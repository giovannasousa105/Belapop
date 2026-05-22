import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  calcularDeltaEntreScan,
  calcularEfetividadeBaseline,
  calcularTrendsFromSnapshots,
} from "./deltaEngine";
import { gerarCopilotSeed, assertSeedValido } from "./invariants/copilotSeedInvariant";
import type { InsightTipo, MarkerTrend } from "./invariants";
import type {
  SkinTwinRow,
  TwinSnapshotRow,
  TwinDeltaRow,
  TwinId,
  toTwinId,
} from "./twinTypes";
import { toTwinId as makeTwinId } from "./twinTypes";
import type { SkinProfile } from "@/lib/skinScan/types";

// ─── criarTwin ────────────────────────────────────────────────────────────────
// Idempotente: faz upsert por user_id. Retorna o twin existente ou novo.

export async function criarTwin(userId: string): Promise<SkinTwinRow> {
  const admin = getSupabaseAdminClient();

  const { data, error } = await admin
    .from("skin_twins")
    .upsert({ user_id: userId, status: "SEM_DADOS" }, { onConflict: "user_id" })
    .select()
    .single();

  if (error) throw new Error(`criarTwin: ${error.message}`);
  return data as SkinTwinRow;
}

// ─── buscarTwin / buscarTwinPorUser ───────────────────────────────────────────

export async function buscarTwin(userId: string): Promise<SkinTwinRow | null> {
  const admin = getSupabaseAdminClient();

  const { data } = await admin
    .from("skin_twins")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  return data as SkinTwinRow | null;
}

/** Alias explícito para uso no skinScanWorker (spec: buscarTwinPorUser). */
export const buscarTwinPorUser = buscarTwin;

// ─── registrarSnapshot ────────────────────────────────────────────────────────
// Persiste um novo snapshot e calcula delta vs anterior.
// scores_baseline NUNCA é atualizado se já existir (primeiro scan apenas).

export async function registrarSnapshot(params: {
  twinId: TwinId;
  scanId: string;
  skinProfile: SkinProfile;
}): Promise<{ snapshot: TwinSnapshotRow; delta: TwinDeltaRow | null }> {
  const { twinId, scanId, skinProfile } = params;
  const admin = getSupabaseAdminClient();

  const [twinResult, lastSnapshotResult] = await Promise.all([
    admin.from("skin_twins").select("*").eq("id", twinId).single(),
    admin
      .from("twin_snapshots")
      .select("*")
      .eq("twin_id", twinId)
      .order("numero_sequencia", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (twinResult.error) throw new Error(`Twin não encontrado: ${twinResult.error.message}`);
  const twin = twinResult.data as SkinTwinRow;
  const lastSnapshot = lastSnapshotResult.data as TwinSnapshotRow | null;
  const numeroSequencia = twin.total_scans + 1;

  const { data: snapshotData, error: snapshotErr } = await admin
    .from("twin_snapshots")
    .insert({
      twin_id: twinId,
      scan_id: scanId,
      scores_normalizados: skinProfile.scores_normalizados,
      tipo_pele: skinProfile.tipo_pele,
      nivel_sensibilidade: skinProfile.nivel_sensibilidade,
      focos_selecionados: skinProfile.perfil_resumo_input.focos_selecionados ?? [],
      numero_sequencia: numeroSequencia,
    })
    .select()
    .single();

  if (snapshotErr) throw new Error(`Erro ao inserir snapshot: ${snapshotErr.message}`);
  const snapshot = snapshotData as TwinSnapshotRow;

  // Delta vs anterior
  let delta: TwinDeltaRow | null = null;
  if (lastSnapshot) {
    const deltasPorMarcador = calcularDeltaEntreScan(
      lastSnapshot.scores_normalizados,
      skinProfile.scores_normalizados
    );
    const { delta_global, melhora_percentual } = calcularEfetividadeBaseline(
      lastSnapshot.scores_normalizados,
      skinProfile.scores_normalizados
    );

    const { data: deltaData } = await admin
      .from("twin_deltas")
      .insert({
        twin_id: twinId,
        snapshot_anterior_id: lastSnapshot.id,
        snapshot_atual_id: snapshot.id,
        deltas_por_marcador: deltasPorMarcador,
        delta_global,
        melhora_percentual,
      })
      .select()
      .single();

    delta = (deltaData as TwinDeltaRow | null) ?? null;
  }

  // Atualizar twin
  const isFirstScan = twin.total_scans === 0;
  const updatePayload: Record<string, unknown> = {
    total_scans: numeroSequencia,
    tipo_pele_atual: skinProfile.tipo_pele,
    nivel_sensibilidade_atual: skinProfile.nivel_sensibilidade,
    status: "ATIVO",
    ultimo_scan_em: new Date().toISOString(),
    atualizado_em: new Date().toISOString(),
  };

  if (isFirstScan) {
    // scores_baseline é IMUTÁVEL — só definido aqui, no primeiro scan
    updatePayload.scores_baseline = skinProfile.scores_normalizados;
    updatePayload.primeiro_scan_em = new Date().toISOString();
  }

  await admin.from("skin_twins").update(updatePayload).eq("id", twinId);

  return { snapshot, delta };
}

// ─── calcularESalvarTrends ────────────────────────────────────────────────────
// Busca os últimos 5 snapshots e faz upsert dos trends por marcador.

export async function calcularESalvarTrends(
  twinId: TwinId,
  latestSnapshotId: string
): Promise<MarkerTrend[]> {
  const admin = getSupabaseAdminClient();

  const { data: snapshots } = await admin
    .from("twin_snapshots")
    .select("scores_normalizados, criado_em")
    .eq("twin_id", twinId)
    .order("numero_sequencia", { ascending: false })
    .limit(5);

  if (!snapshots || snapshots.length === 0) return [];

  const emOrdem = [...snapshots].reverse() as Array<{
    scores_normalizados: Record<string, number>;
    criado_em: string;
  }>;

  const trends = calcularTrendsFromSnapshots(emOrdem);

  await Promise.all(
    trends.map((t) =>
      admin.from("twin_trends").upsert(
        {
          twin_id: twinId,
          snapshot_id: latestSnapshotId,
          marcador: t.marcador,
          status: t.status,
          slope: t.slope,
          velocidade_por_semana: t.velocidade_por_semana,
          snapshots_usados: t.snapshotsUsados,
          confianca: t.confianca,
          calculado_em: new Date().toISOString(),
        },
        { onConflict: "twin_id,marcador" }
      )
    )
  );

  return trends;
}

// ─── determinarInsightTipo ────────────────────────────────────────────────────
// Lógica de classificação do tipo de insight — sem I/O.

export function determinarInsightTipo(params: {
  totalScans: number;
  deltaGlobal: number | null;
  diasDesdeUltimoScan: number;
  hasTrendPiorando: boolean;
}): InsightTipo {
  const { totalScans, deltaGlobal, diasDesdeUltimoScan, hasTrendPiorando } = params;

  if (totalScans === 1) return "PRIMEIRO_SCAN";
  if (diasDesdeUltimoScan > 120) return "RETORNO_APOS_PAUSA";
  if (hasTrendPiorando) return "REGRESSAO_DETECTADA";
  if (deltaGlobal !== null && deltaGlobal < -15) return "MARCO_ALCANCADO";
  if (deltaGlobal !== null && deltaGlobal < -5) return "PROGRESSO_POSITIVO";
  if (deltaGlobal !== null && deltaGlobal > 5) return "AJUSTE_ROTINA";
  return "ESTAVEL";
}

// ─── gerarESalvarInsight ──────────────────────────────────────────────────────
// Gera e persiste um insight usando o template síncrono (CopilotSeed).

export async function gerarESalvarInsight(params: {
  twinId: TwinId;
  snapshotId: string;
  twin: SkinTwinRow;
  trends: MarkerTrend[];
  deltaGlobal: number | null;
}): Promise<void> {
  const { twinId, snapshotId, twin, trends, deltaGlobal } = params;
  const admin = getSupabaseAdminClient();

  const ultimoScanEm = twin.ultimo_scan_em ? new Date(twin.ultimo_scan_em) : new Date();
  const diasDesdeUltimoScan = Math.floor(
    (Date.now() - ultimoScanEm.getTime()) / (1000 * 60 * 60 * 24)
  );

  const hasTrendPiorando = trends.some((t) => t.status === "PIORANDO");

  const tipo = determinarInsightTipo({
    totalScans: twin.total_scans,
    deltaGlobal,
    diasDesdeUltimoScan,
    hasTrendPiorando,
  });

  const alerta_ativo = tipo === "REGRESSAO_DETECTADA" || tipo === "AJUSTE_ROTINA";
  const rotina_precisa_revisao = tipo === "AJUSTE_ROTINA" || tipo === "MARCO_ALCANCADO";

  // Gerar seed (síncrono, puro — sem API)
  const seed = gerarCopilotSeed({
    insightTipo: tipo,
    trends,
    ultimoScanEm,
    alertaAtivo: alerta_ativo,
    rotinaPrecisaRevisao: rotina_precisa_revisao,
  });
  assertSeedValido(seed);

  await Promise.all([
    admin.from("twin_insights").insert({
      twin_id: twinId,
      snapshot_id: snapshotId,
      tipo,
      conteudo: seed.mensagemMotivacionalCurta,
      alerta_ativo,
      rotina_precisa_revisao,
    }),
    admin
      .from("skin_twins")
      .update({ copilot_seed: seed, atualizado_em: new Date().toISOString() })
      .eq("id", twinId),
  ]);
}
