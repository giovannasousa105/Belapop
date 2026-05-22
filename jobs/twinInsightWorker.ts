/**
 * BullMQ worker — gera insights do Digital Twin após cada scan.
 *
 * Disparado por: snapshotService após criarTwin ou registrarSnapshot.
 * Fire-and-forget — nunca bloqueia o pipeline de scan.
 *
 * Executar como processo independente:
 *   npx tsx jobs/twinInsightWorker.ts
 */

import { Worker, Queue, type Job } from "bullmq";
import { Redis } from "ioredis";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { classificarInsight, gerarInsight } from "@/lib/digitalTwin/insightEngine";
import { calcularTrends } from "@/lib/digitalTwin/deltaEngine";
import type { SkinTwinRow, TwinDeltaRow, TwinSnapshotRow } from "@/lib/digitalTwin/twinTypes";
import { logger } from "@/lib/logger";

// ─── Redis ────────────────────────────────────────────────────────────────────

const REDIS_URL = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";

function getRedisConnection() {
  return new Redis(REDIS_URL, { maxRetriesPerRequest: null, enableReadyCheck: false });
}

export const QUEUE_NAME = "twin-insights";

export interface TwinInsightJobPayload {
  twin_id:           string;
  delta_id:          string | null;
  snapshot_atual_id: string | null;
}

// ─── recalcularTrendsNoBanco ──────────────────────────────────────────────────

async function recalcularTrendsNoBanco(
  twinId: string,
  snapshots: TwinSnapshotRow[]
): Promise<ReturnType<typeof calcularTrends> | null> {
  if (snapshots.length < 3) return null;

  const trends = calcularTrends(snapshots);
  const admin  = getSupabaseAdminClient();

  // Identificar marcador de destaque (maior melhora acumulada) e atenção (pior tendência)
  const entries = Object.entries(trends) as Array<[string, { status: string; slope: number; velocidade_por_semana: number; confianca: string }]>;

  const marcadorDestaque =
    entries
      .filter(([, t]) => t.status === "MELHORANDO")
      .sort(([, a], [, b]) => Math.abs(b.slope) - Math.abs(a.slope))[0]?.[0] ?? null;

  const marcadorAtencao =
    entries
      .filter(([, t]) => t.status === "PIORANDO")
      .sort(([, a], [, b]) => Math.abs(b.slope) - Math.abs(a.slope))[0]?.[0] ?? null;

  // UPSERT twin_trends (per-marcador — esquema existente)
  const lastSnapshot = snapshots[snapshots.length - 1];
  await Promise.all(
    entries.map(([marcador, trend]) =>
      admin.from("twin_trends").upsert(
        {
          twin_id:              twinId,
          snapshot_id:          lastSnapshot.id,
          marcador,
          status:               trend.status,
          slope:                trend.slope,
          velocidade_por_semana: trend.velocidade_por_semana,
          snapshots_usados:     snapshots.length,
          confianca:            trend.confianca,
          calculado_em:         new Date().toISOString(),
        },
        { onConflict: "twin_id,marcador" }
      )
    )
  );

  // Atualizar campos de resumo em skin_twins
  await admin
    .from("skin_twins")
    .update({
      marcador_destaque: marcadorDestaque,
      marcador_atencao:  marcadorAtencao,
      atualizado_em:     new Date().toISOString(),
    })
    .eq("id", twinId);

  return trends;
}

// ─── Worker ───────────────────────────────────────────────────────────────────

const connection = getRedisConnection();

export const twinInsightWorker = new Worker<TwinInsightJobPayload>(
  QUEUE_NAME,
  async (job: Job<TwinInsightJobPayload>) => {
    const { twin_id, delta_id, snapshot_atual_id } = job.data;
    const admin = getSupabaseAdminClient();

    // 1. Buscar twin completo
    const { data: twinData } = await admin
      .from("skin_twins")
      .select("*")
      .eq("id", twin_id)
      .maybeSingle();

    if (!twinData) {
      logger.error({ job: QUEUE_NAME, twin_id, msg: "Twin não encontrado" });
      return;
    }
    const twin = twinData as SkinTwinRow;

    // 2. Buscar delta (se houver)
    let delta: TwinDeltaRow | null = null;
    if (delta_id) {
      const { data: deltaData } = await admin
        .from("twin_deltas")
        .select("*")
        .eq("id", delta_id)
        .maybeSingle();
      delta = (deltaData as TwinDeltaRow | null) ?? null;
    }

    // 3. Buscar todos os snapshots em ordem cronológica
    const { data: snapshotsData } = await admin
      .from("twin_snapshots")
      .select("*")
      .eq("twin_id", twin_id)
      .order("numero_sequencia", { ascending: true });

    const snapshots = (snapshotsData ?? []) as TwinSnapshotRow[];

    // 4. Classificar tipo de insight
    const tipo = classificarInsight(delta, twin);

    // 5. Recalcular trends se >= 3 scans
    let trends: ReturnType<typeof calcularTrends> | null = null;
    if (twin.total_scans >= 3) {
      trends = await recalcularTrendsNoBanco(twin_id, snapshots);
    }

    // 6. Gerar insight (Claude + CopilotSeed síncrono)
    const { narrativa, ajuste_rotina, alerta, seed_copilot } = await gerarInsight({
      tipo,
      twin,
      delta,
      snapshots,
      trends,
    });

    // 7. INSERT twin_insights
    const snapshotAtualId = snapshot_atual_id ?? snapshots[snapshots.length - 1]?.id ?? null;
    await admin.from("twin_insights").insert({
      twin_id,
      delta_id,
      snapshot_id: snapshotAtualId,
      tipo,
      conteudo:              narrativa,
      alerta_ativo:          alerta,
      rotina_precisa_revisao: ajuste_rotina !== null,
      seed_copilot,
    });

    // 8. UPDATE skin_twins: proximo_scan_em + scores_atuais + copilot_seed
    const ultimoSnapshot = snapshots[snapshots.length - 1];
    const proxScan = new Date();
    proxScan.setDate(proxScan.getDate() + 42); // sempre 42 dias

    await admin.from("skin_twins").update({
      proximo_scan_em: proxScan.toISOString(),
      copilot_seed:    seed_copilot,
      scores_atuais:   ultimoSnapshot?.scores_normalizados ?? null,
      atualizado_em:   new Date().toISOString(),
    }).eq("id", twin_id);

    // 9. Alerta → e-mail via CRM (fire-and-forget)
    if (alerta && twin.user_id) {
      void (async () => {
        try {
          const { enviarAlertaRegressao } = await import("@/lib/crm/flows/pele");
          await enviarAlertaRegressao({
            user_id:       twin.user_id,
            email:         "",  // deliveryQueue busca o e-mail do usuário via user_id
            nome:          null,
            marcador_foco: seed_copilot.marcadorFoco,
            conteudo:      narrativa,
            scan_id:       snapshotAtualId,
          });
        } catch (err) {
          logger.error({ job: QUEUE_NAME, twin_id, etapa: "crm_alerta", err });
        }
      })();
    }

    // 10. Cachear seed no Redis (TTL 5min — Copilot não bate no banco)
    void (async () => {
      try {
        const redis = getRedisConnection();
        await redis.set(
          `copilot:seed:${twin.user_id}`,
          JSON.stringify(seed_copilot),
          "EX",
          300
        );
        await redis.quit();
      } catch (err) {
        logger.error({ job: QUEUE_NAME, twin_id, etapa: "redis_cache", err });
      }
    })();

    logger.info({ job: QUEUE_NAME, twin_id, tipo, alerta });
  },
  {
    connection,
    concurrency: 2,
  }
);

twinInsightWorker.on("failed", (job, err) => {
  // Falha silenciosa — insight é valor agregado, nunca bloqueia o scan
  logger.error({
    job: QUEUE_NAME,
    twin_id: job?.data.twin_id,
    err: err.message,
    msg: "twin-insight job falhou — scan não é afetado",
  });
});

twinInsightWorker.on("ready", () => {
  logger.info({ job: QUEUE_NAME, msg: `Worker pronto (concurrency=2)` });
});

// ─── Queue export (para enfileirar de outros workers) ─────────────────────────

export const twinInsightQueue = new Queue<TwinInsightJobPayload>(QUEUE_NAME, {
  connection: getRedisConnection(),
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: "exponential", delay: 5_000 },
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 30 },
  },
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  await twinInsightWorker.close();
  process.exit(0);
});
