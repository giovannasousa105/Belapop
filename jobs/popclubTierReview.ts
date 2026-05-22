/**
 * PopClub Tier Review — job diário às 9h UTC.
 *
 * Responsabilidades:
 *   1. Avisar membros 60 dias antes do risco de rebaixamento.
 *   2. Processar rebaixamentos anuais na data de avaliação.
 *   3. Expirar créditos vencidos.
 *
 * Iniciar: node -r ts-node/register jobs/popclubTierReview.ts
 */

import { Queue, Worker, type Job } from "bullmq";
import { Redis } from "ioredis";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { processarRevisaoAnual, enviarAvisoRebaixamento } from "@/lib/popclub/tierEngine";
import { expirarCreditos } from "@/lib/popclub/creditsEngine";
import type { PopclubMembro } from "@/lib/popclub/popclubTypes";

// ─── Conexão Redis ────────────────────────────────────────────────────────────

const connection = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

// ─── Queue ────────────────────────────────────────────────────────────────────

export const popclubReviewQueue = new Queue("popclub-tier-review", { connection });

export async function iniciarPopclubReviewScheduler(): Promise<void> {
  await popclubReviewQueue.add(
    "daily-tier-review",
    {},
    {
      repeat: { pattern: "0 9 * * *" }, // todo dia às 9h UTC
      removeOnComplete: 5,
      removeOnFail: 20,
    }
  );
  console.log("[popclub-review] job diário registrado (0 9 * * *)");
}

// ─── Worker ───────────────────────────────────────────────────────────────────

export const popclubReviewWorker = new Worker(
  "popclub-tier-review",
  async (_job: Job) => {
    const admin = getSupabaseAdminClient();
    const hoje = new Date().toISOString().slice(0, 10);

    let totalAvisos = 0;
    let totalRevisoes = 0;

    // ── 1. Enviar avisos de rebaixamento ──────────────────────────────────────

    const { data: avisosHoje } = await admin
      .from("popclub_membros")
      .select("id")
      .eq("data_rebaixamento_aviso", hoje)
      .eq("ativo", true);

    for (const { id } of avisosHoje ?? []) {
      await enviarAvisoRebaixamento(id as string).catch((err: unknown) => {
        console.error("[popclub-review] aviso falhou", { id, err });
      });
      totalAvisos++;
    }

    // ── 2. Processar revisões anuais ──────────────────────────────────────────

    const { data: revisoesPendentes } = await admin
      .from("popclub_membros")
      .select("id, user_id, tier_atual, pontos_acumulados_12m")
      .eq("data_avaliacao_tier", hoje)
      .eq("ativo", true);

    for (const m of (revisoesPendentes ?? []) as PopclubMembro[]) {
      await processarRevisaoAnual(m.id).catch((err: unknown) => {
        console.error("[popclub-review] revisao falhou", { id: m.id, err });
      });
      totalRevisoes++;
    }

    // ── 3. Expirar créditos vencidos ──────────────────────────────────────────

    const { expirados } = await expirarCreditos().catch(() => ({ expirados: 0 }));

    console.log("[popclub-review] ciclo concluído", {
      avisos: totalAvisos,
      revisoes: totalRevisoes,
      creditos_expirados: expirados,
      data: hoje,
    });
  },
  { connection, concurrency: 1 }
);

// ─── Graceful shutdown ────────────────────────────────────────────────────────

async function shutdown() {
  await popclubReviewWorker.close();
  await connection.quit();
  process.exit(0);
}

process.on("SIGTERM", () => void shutdown());
process.on("SIGINT", () => void shutdown());

if (require.main === module) {
  void iniciarPopclubReviewScheduler().catch(console.error);
}
