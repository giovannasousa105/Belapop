/**
 * BullMQ worker — pipeline completo do Skin Scan BelaPop.
 *
 * Executar como processo independente:
 *   npx tsx jobs/skinScanWorker.ts
 *
 * Requer:
 *   REDIS_URL           — Redis connection string (ex: redis://localhost:6379)
 *   CV_SERVICE_URL      — URL do serviço Python CV (ex: http://cv-service:8000)
 *   CV_SERVICE_API_KEY  — INTERNAL_API_KEY do serviço Python
 *   ANTHROPIC_API_KEY   — Chave da API Anthropic
 *   SUPABASE_SERVICE_ROLE_KEY + SUPABASE_URL — client admin
 */

import { Worker, type Job } from "bullmq";
import { QUEUE_NAME, type SkinScanJobPayload } from "./skinScanWorker.types";

import { posthogServer } from "@/lib/analytics/posthog";
import { captureError } from "@/lib/analytics/sentry";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { calcularSkinProfile } from "@/lib/skinScan/scoringClinico";
import { montarRotinas } from "@/lib/skinScan/rotinaBuilder";
import { gerarNarrativa } from "@/lib/skinScan/narrativaGenerator";
import type { SkinFeatureVector } from "@/lib/skinScan/types";
import type { RotinaResult } from "@/lib/skinScan/rotinaBuilder";
import {
  criarTwin,
  registrarSnapshot,
  calcularESalvarTrends,
  gerarESalvarInsight,
} from "@/lib/digitalTwin/snapshotService";
import { toTwinId } from "@/lib/digitalTwin/twinTypes";

// ─── Redis connection ─────────────────────────────────────────────────────────

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

function getRedisConnection() {
  return { url: REDIS_URL };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function gerarSkinId(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const arr = new Uint8Array(6);
  crypto.getRandomValues(arr);
  return "BP-" + Array.from(arr, (b) => chars[b % chars.length]).join("");
}

async function registrarEvento(
  skinScanId: string,
  etapa: string,
  duracaoMs: number,
  metadata?: Record<string, unknown>
): Promise<void> {
  const admin = getSupabaseAdminClient();
  await admin.from("scan_eventos").insert({
    skin_scan_id: skinScanId,
    etapa,
    duracao_ms: duracaoMs,
    metadata: metadata ?? null,
  });
}

async function atualizarStatus(
  scanId: string,
  status: string,
  extra?: Record<string, unknown>
): Promise<void> {
  const admin = getSupabaseAdminClient();
  await admin
    .from("skin_scans")
    .update({ status, atualizado_em: new Date().toISOString(), ...extra })
    .eq("id", scanId);
}

// ─── Pipeline ─────────────────────────────────────────────────────────────────

async function processarScan(job: Job<SkinScanJobPayload>): Promise<void> {
  const { scan_id, image_buffer_base64, focos } = job.data;
  const admin = getSupabaseAdminClient();
  const tInicio = Date.now();

  console.info(`[skin-scan] Iniciando pipeline scan=${scan_id}`);

  // ── Etapa 1: CV service ───────────────────────────────────────────────────
  await atualizarStatus(scan_id, "PROCESSANDO_CV");
  const t1 = Date.now();

  let featureVector: SkinFeatureVector;
  try {
    const cvUrl = `${process.env.CV_SERVICE_URL ?? "http://localhost:8001"}/analyze`;
    const formData = new FormData();

    // Converter base64 → Blob sem tocar disco
    const imageBuffer = Buffer.from(image_buffer_base64, "base64");
    const blob = new Blob([imageBuffer], { type: "image/jpeg" });
    formData.append("image", blob, "scan.jpg");
    formData.append("scan_id", scan_id);
    focos.forEach((f) => formData.append("focos", f));

    const cvResp = await fetch(cvUrl, {
      method: "POST",
      headers: {
        "x-internal-key": process.env.CV_SERVICE_API_KEY ?? "",
      },
      body: formData,
      signal: AbortSignal.timeout(15_000),
    });

    if (!cvResp.ok) {
      throw new Error(`CV service retornou ${cvResp.status}`);
    }

    featureVector = (await cvResp.json()) as SkinFeatureVector;
  } catch (err) {
    console.error(`[skin-scan] CV service falhou scan=${scan_id}:`, err);
    await atualizarStatus(scan_id, "ERRO", {
      erro_mensagem: err instanceof Error ? err.message : "cv_service_error",
    });
    throw err; // BullMQ vai retentar conforme retry policy
  }

  const duracaoCV = Date.now() - t1;

  await admin.from("scan_cv_results").insert({
    skin_scan_id: scan_id,
    feature_vector: featureVector,
    duracao_cv_ms: duracaoCV,
  });
  await registrarEvento(scan_id, "cv", duracaoCV, {
    face_detectada: featureVector.face_detectada,
    fitzpatrick: featureVector.fitzpatrick_estimado,
    flags: featureVector.flags,
  });

  if (!featureVector.face_detectada) {
    await atualizarStatus(scan_id, "ERRO", {
      erro_mensagem: "face_nao_detectada",
      duracao_ms: Date.now() - tInicio,
    });
    return; // Não é erro de infra — não retentar
  }

  // ── Etapa 2: Scoring clínico ──────────────────────────────────────────────
  await atualizarStatus(scan_id, "SCORING");
  const t2 = Date.now();

  const skinProfile = calcularSkinProfile(featureVector, focos);

  await admin.from("scan_skin_profiles").insert({
    skin_scan_id: scan_id,
    skin_profile: skinProfile,
    perfil_resumo: null, // preenchido no step 4
  });
  await registrarEvento(scan_id, "scoring", Date.now() - t2, {
    tipo_pele: skinProfile.tipo_pele,
    nivel_sensibilidade: skinProfile.nivel_sensibilidade,
  });

  // ── Etapa 3: Recomendação de produtos ────────────────────────────────────
  await atualizarStatus(scan_id, "RECOMENDANDO");
  const t3 = Date.now();

  let rotinas: { manha: RotinaResult; noite: RotinaResult };
  try {
    rotinas = await montarRotinas(skinProfile);
  } catch (err) {
    console.error(`[skin-scan] montarRotinas falhou scan=${scan_id}:`, err);
    // Rotinas vazias como fallback — não interromper o pipeline
    rotinas = {
      manha: { periodo: "manha", passos: [], scores_compat: {} },
      noite: { periodo: "noite", passos: [], scores_compat: {} },
    };
  }

  await Promise.all([
    admin.from("scan_rotinas").insert({
      skin_scan_id: scan_id,
      periodo: "manha",
      rotina: rotinas.manha,
    }),
    admin.from("scan_rotinas").insert({
      skin_scan_id: scan_id,
      periodo: "noite",
      rotina: rotinas.noite,
    }),
  ]);
  await registrarEvento(scan_id, "recommendation", Date.now() - t3, {
    passos_manha: rotinas.manha.passos.length,
    passos_noite: rotinas.noite.passos.length,
  });

  // ── Etapa 4: Narrativa Claude ─────────────────────────────────────────────
  const t4 = Date.now();
  const { narrativa, usou_fallback } = await gerarNarrativa(
    skinProfile,
    rotinas.manha,
    rotinas.noite,
    featureVector.fitzpatrick_estimado
  );

  await admin
    .from("scan_skin_profiles")
    .update({ perfil_resumo: narrativa })
    .eq("skin_scan_id", scan_id);

  await registrarEvento(scan_id, "narrativa", Date.now() - t4, {
    usou_fallback,
  });

  // ── Etapa 5: Gerar Skin ID único ─────────────────────────────────────────
  let skinId: string | null = null;
  for (let tentativa = 0; tentativa < 5; tentativa++) {
    const candidato = gerarSkinId();
    const { error: upsertErr } = await admin
      .from("skin_scans")
      .update({ skin_id: candidato })
      .eq("id", scan_id)
      .is("skin_id", null); // só atualiza se ainda não tem

    if (!upsertErr) {
      skinId = candidato;
      break;
    }
    // Conflito de unicidade — tentar outro ID
  }

  // ── Etapa 6: Registrar exclusão da imagem ────────────────────────────────
  // A imagem nunca foi persistida — o job payload é liberado pelo BullMQ.
  // Registramos o timestamp para compliance LGPD.
  const duracaoTotal = Date.now() - tInicio;

  await admin
    .from("skin_scans")
    .update({
      status: "CONCLUIDO",
      skin_id: skinId,
      duracao_ms: duracaoTotal,
      imagem_deletada_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", scan_id);

  // ── Etapa 7: Digital Twin ─────────────────────────────────────────────────
  // Só atualiza o twin se o job pertence a um usuário autenticado.
  if (job.data.user_id) {
    try {
      const t7 = Date.now();
      const twin = await criarTwin(job.data.user_id);
      const twinId = toTwinId(twin.id);

      const { snapshot, delta } = await registrarSnapshot({
        twinId,
        scanId: scan_id,
        skinProfile,
      });

      const trends = await calcularESalvarTrends(twinId, snapshot.id);

      await gerarESalvarInsight({
        twinId,
        snapshotId: snapshot.id,
        twin: { ...twin, total_scans: twin.total_scans + 1, ultimo_scan_em: new Date().toISOString() },
        trends,
        deltaGlobal: delta?.delta_global ?? null,
      });

      await registrarEvento(scan_id, "digital_twin", Date.now() - t7, {
        twin_id: twin.id,
        snapshot_sequencia: snapshot.numero_sequencia,
        delta_global: delta?.delta_global ?? null,
      });
    } catch (twinErr) {
      // Twin não bloqueia o pipeline — scan já está CONCLUIDO
      console.error(`[skin-scan] Digital Twin falhou scan=${scan_id}:`, twinErr);
    }
  }

  // ── Etapa 8: Notificação ao frontend ─────────────────────────────────────
  // O frontend faz polling em /api/skin-scan/[scan_id]/status a cada 2s.
  // A transição de status para CONCLUIDO já é suficiente para encerrar o polling.

  try {
    await posthogServer.capture({
      distinctId: job.data.user_id ?? `anon_${job.data.session_bp}`,
      event: "scan_concluido_server",
      properties: {
        tipo_pele: skinProfile.tipo_pele,
        duracao_ms: duracaoTotal,
        fallback_cv: !process.env.CV_SERVICE_URL
      }
    });
  } catch (analyticsError) {
    captureError(analyticsError, {
      job: QUEUE_NAME,
      scan_id,
      etapa: "posthog_scan_concluido_server"
    });
  } finally {
    await posthogServer.shutdown();
  }

  console.info(
    `[skin-scan] Pipeline concluído scan=${scan_id} skin_id=${skinId} ${duracaoTotal}ms`
  );
}

// ─── Worker ───────────────────────────────────────────────────────────────────

const worker = new Worker<SkinScanJobPayload>(QUEUE_NAME, processarScan, {
  connection: getRedisConnection(),
  concurrency: 3,
});

worker.on("failed", async (job, err) => {
  if (!job) return;
  captureError(err, {
    job: QUEUE_NAME,
    scan_id: job.data.scan_id,
    etapa: "worker_failed"
  });
  console.error(`[skin-scan] Job falhou scan=${job.data.scan_id}:`, err.message);
  const admin = getSupabaseAdminClient();
  await admin
    .from("skin_scans")
    .update({
      status: "ERRO",
      erro_mensagem: err.message,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", job.data.scan_id);
});

worker.on("ready", () => {
  console.info(`[skin-scan] Worker pronto — fila: ${QUEUE_NAME} (concurrency=3)`);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  await worker.close();
  process.exit(0);
});
