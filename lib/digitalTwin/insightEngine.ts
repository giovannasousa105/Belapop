/**
 * INVARIANTE DE SCORES — LEIA ANTES DE QUALQUER CÁLCULO:
 *
 *   score MENOR = condição MELHORADA = pele melhorando
 *   delta_global NEGATIVO = melhora   (score caiu = bom)
 *   delta_global POSITIVO = piora     (score subiu = ruim)
 *
 * classificarInsight usa esta convenção DIRETAMENTE.
 * NUNCA inverter as condições de PROGRESSO_POSITIVO e REGRESSAO_DETECTADA.
 *
 * Exceção controlada para exibição ao usuário:
 *   buildUserPrompt usa Math.abs(delta) — convenção interna nunca vaza para Claude.
 */

import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  SKIN_MARKERS,
  type SkinMarker,
} from "./invariants/skinScoreInvariant";
import {
  type InsightTipo,
  type CopilotSeed,
} from "./invariants";
import { calcularTrends } from "./deltaEngine";
import type { SkinTwinRow, TwinDeltaRow, TwinSnapshotRow } from "./twinTypes";
import * as progressoPrompt from "./prompts/progressoInsight";
import * as regressaoPrompt from "./prompts/regressaoAlert";
import * as ajustePrompt from "./prompts/ajusteRotina";
import * as marcoPrompt from "./prompts/marcoAlcancado";

// ─── Tipos internos ───────────────────────────────────────────────────────────

type TrendMap = ReturnType<typeof calcularTrends>;

const MENSAGENS: Record<InsightTipo, string> = {
  PRIMEIRO_SCAN:       "Sua jornada começou. Próximo scan em 6 semanas.",
  PROGRESSO_POSITIVO:  "Sua pele está respondendo. Continue com a consistência.",
  ESTAVEL:             "Estabilidade é progresso. Continue.",
  REGRESSAO_DETECTADA: "Pequenas variações são normais. Vamos ajustar juntas.",
  MARCO_ALCANCADO:     "Marco alcançado. Sua rotina está funcionando.",
  AJUSTE_ROTINA:       "Hora de atualizar sua rotina para a pele de agora.",
  RETORNO_APOS_PAUSA:  "Bem-vinda de volta. Sua pele está esperando.",
};

const CLAUDE_MODEL   = "claude-sonnet-4-6";
const CLAUDE_TOKENS  = 400;
const CLAUDE_TIMEOUT = 12_000;

// ─── classificarInsight ───────────────────────────────────────────────────────
// PURA — sem I/O.
//
// ATENÇÃO — prioridade ESTRITA (parar na primeira que bater):
//   1. Primeiro scan
//   2. Retorno após pausa (intervalo > 60 dias)
//   3. Regressão: >= 2 marcadores PIORA OU delta_global > 5 (positivo = piora)
//   4. Marco: baseline - atual >= 20 em qualquer marcador (positivo = score caiu = melhora)
//   5. Ajuste: efetividade < 40
//   6. Progresso: delta_global < -5 (negativo = melhora)
//   7. Default: Estável

export function classificarInsight(
  delta: TwinDeltaRow | null,
  twin: SkinTwinRow
): InsightTipo {
  // 1. Primeiro scan — delta é null, sem comparação
  if (twin.total_scans === 1) return "PRIMEIRO_SCAN";
  if (!delta) return "ESTAVEL";

  // 2. Retorno após pausa
  if (delta.intervalo_dias > 60) return "RETORNO_APOS_PAUSA";

  // 3. Regressão detectada
  // delta_global > 5 (POSITIVO) = piora global — NUNCA inverter
  const contagemPioras = Object.values(delta.classificacoes).filter(
    (c) => c === "PIORA"
  ).length;
  if (contagemPioras >= 2 || delta.delta_global > 5) return "REGRESSAO_DETECTADA";

  // 4. Marco alcançado
  // baseline - atual >= 20: score caiu >= 20 pontos = melhora real
  if (twin.scores_atuais && twin.scores_baseline) {
    for (const m of SKIN_MARKERS) {
      const baseline = (twin.scores_baseline as Record<string, number>)[m] ?? 0;
      const atual    = (twin.scores_atuais as Record<string, number>)[m] ?? 0;
      if (baseline - atual >= 20) return "MARCO_ALCANCADO";
    }
  }

  // 5. Efetividade baixa
  if (
    delta.efetividade_rotina !== null &&
    delta.efetividade_rotina !== undefined &&
    delta.efetividade_rotina < 40
  ) {
    return "AJUSTE_ROTINA";
  }

  // 6. Progresso positivo
  // delta_global < -5 (NEGATIVO) = melhora — NUNCA inverter
  if (delta.delta_global < -5) return "PROGRESSO_POSITIVO";

  // 7. Default
  return "ESTAVEL";
}

// ─── gerarCopilotSeed ─────────────────────────────────────────────────────────
// SÍNCRONA, PURA. Nunca retorna Promise.
// Sem await, sem fetch, sem Supabase, sem Claude API.
//
// O Copilot usa este seed para check-ins diários. Se dependesse de API
// externa, uma instabilidade derrubaria a retenção da plataforma.

export function gerarCopilotSeed(params: {
  insightTipo:          InsightTipo;
  trends:               TrendMap | null;
  twin:                 Pick<SkinTwinRow, "scores_atuais">;
  ultimoScanEm:         Date;
  alertaAtivo:          boolean;
  rotinaPrecisaRevisao: boolean;
}): CopilotSeed {
  const { insightTipo, trends, twin, ultimoScanEm, alertaAtivo, rotinaPrecisaRevisao } = params;

  const diasDesdeUltimoScan = Math.floor(
    (Date.now() - ultimoScanEm.getTime()) / 86_400_000
  );

  const proximoScanEm = new Date(ultimoScanEm);
  proximoScanEm.setDate(proximoScanEm.getDate() + 42); // 6 semanas — sempre 42 dias

  // marcadorFoco: pior tendência ativa, ou marcador com score mais alto
  const marcadorFoco: SkinMarker = _selecionarMarcadorFoco(trends, twin.scores_atuais);

  return {
    ultimoInsightTipo:         insightTipo,
    marcadorFoco,
    diasDesdeUltimoScan,
    proximoScanRecomendadoEm:  proximoScanEm.toISOString().split("T")[0],
    alertaAtivo,
    rotinaPrecisaRevisao,
    mensagemMotivacionalCurta: MENSAGENS[insightTipo],
  };
}

function _selecionarMarcadorFoco(
  trends: TrendMap | null,
  scoresAtuais: Record<string, number> | null | undefined
): SkinMarker {
  // 1. Tendência PIORANDO com maior |slope|
  if (trends) {
    const piorando = SKIN_MARKERS
      .filter((m) => trends[m]?.status === "PIORANDO")
      .sort((a, b) => Math.abs(trends[b].slope) - Math.abs(trends[a].slope));
    if (piorando.length > 0) return piorando[0];
  }

  // 2. Marcador com maior score atual (pior condição agora)
  if (scoresAtuais) {
    let maxScore = -1;
    let maxMarcador: SkinMarker = "acne";
    for (const m of SKIN_MARKERS) {
      const s = scoresAtuais[m] ?? 0;
      if (s > maxScore) {
        maxScore = s;
        maxMarcador = m;
      }
    }
    return maxMarcador;
  }

  // 3. Fallback final — nunca undefined
  return "acne";
}

// ─── gerarInsight ─────────────────────────────────────────────────────────────
// Async — chama Claude API com timeout e fallback.

export async function gerarInsight(params: {
  tipo:      InsightTipo;
  twin:      SkinTwinRow;
  delta:     TwinDeltaRow | null;
  snapshots: TwinSnapshotRow[];
  trends:    TrendMap | null;
}): Promise<{
  narrativa:     string;
  ajuste_rotina: Record<string, unknown> | null;
  alerta:        boolean;
  seed_copilot:  CopilotSeed;
}> {
  const { tipo, twin, delta, snapshots, trends } = params;

  const alerta = tipo === "REGRESSAO_DETECTADA" || tipo === "AJUSTE_ROTINA";
  const rotinaPrecisaRevisao = tipo === "AJUSTE_ROTINA" || tipo === "MARCO_ALCANCADO";

  const ultimoScanEm = twin.ultimo_scan_em
    ? new Date(twin.ultimo_scan_em)
    : new Date();

  const seed_copilot = gerarCopilotSeed({
    insightTipo: tipo,
    trends,
    twin: { scores_atuais: twin.scores_atuais },
    ultimoScanEm,
    alertaAtivo: alerta,
    rotinaPrecisaRevisao,
  });

  // Buscar produtos para ajuste (quando relevante)
  let ajuste_rotina: Record<string, unknown> | null = null;
  if (tipo === "AJUSTE_ROTINA" || tipo === "REGRESSAO_DETECTADA") {
    ajuste_rotina = await buscarProdutosParaAjuste(twin, trends).catch(() => null);
  }

  // Gerar narrativa via Claude com fallback
  const narrativa = await _chamarClaude(tipo, twin, delta, snapshots);

  return { narrativa, ajuste_rotina, alerta, seed_copilot };
}

// ─── buscarProdutosParaAjuste ──────────────────────────────────────────────────

export async function buscarProdutosParaAjuste(
  twin: SkinTwinRow,
  trends: TrendMap | null
): Promise<Record<string, unknown>> {
  const admin = getSupabaseAdminClient();

  // Identificar marcadores problemáticos
  const marcadoresProblema = trends
    ? SKIN_MARKERS.filter((m) => trends[m]?.status === "PIORANDO")
    : SKIN_MARKERS.slice(0, 2); // fallback: primeiros 2

  if (marcadoresProblema.length === 0) {
    return { sugerir_novo_scan: true };
  }

  // Buscar produtos do catálogo para esses marcadores
  const { data: produtos } = await admin
    .from("products")
    .select("id, name, slug, price_cents, ativos_principais, tipo_pele_indicado")
    .eq("status", "ACTIVE")
    .limit(10);

  if (!produtos || produtos.length === 0) {
    return { sugerir_novo_scan: true };
  }

  return {
    marcadores_problema: marcadoresProblema,
    produtos_sugeridos: produtos.slice(0, 4).map((p) => ({
      id: p.id,
      nome: p.name,
      slug: p.slug,
    })),
  };
}

// ─── _chamarClaude (interno) ──────────────────────────────────────────────────

async function _chamarClaude(
  tipo: InsightTipo,
  twin: SkinTwinRow,
  delta: TwinDeltaRow | null,
  snapshots: TwinSnapshotRow[]
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return _fallback(tipo, twin, delta);

  const { system, userPrompt } = _montarPrompt(tipo, twin, delta, snapshots);

  try {
    const client = new Anthropic({ apiKey });
    const resultado = await Promise.race([
      client.messages.create({
        model:      CLAUDE_MODEL,
        max_tokens: CLAUDE_TOKENS,
        system,
        messages: [{ role: "user", content: userPrompt }],
      }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), CLAUDE_TIMEOUT)),
    ]);

    if (!resultado) return _fallback(tipo, twin, delta);
    const bloco = resultado.content[0];
    if (bloco.type !== "text" || !bloco.text.trim()) {
      return _fallback(tipo, twin, delta);
    }
    return bloco.text.trim();
  } catch {
    return _fallback(tipo, twin, delta);
  }
}

function _montarPrompt(
  tipo: InsightTipo,
  twin: SkinTwinRow,
  delta: TwinDeltaRow | null,
  snapshots: TwinSnapshotRow[]
): { system: string; userPrompt: string } {
  const ultimoSnapshot = snapshots[snapshots.length - 1];
  const ativos = ultimoSnapshot?.ativos_em_uso ?? [];

  switch (tipo) {
    case "PROGRESSO_POSITIVO":
    case "MARCO_ALCANCADO": {
      const melhoraram = delta
        ? Object.entries(delta.classificacoes)
            .filter(([, c]) => c === "MELHORA")
            .map(([m]) => ({
              nome: m,
              // Math.abs — convenção interna nunca vaza para o Claude
              deltaPts: Math.abs(
                (delta.deltas_por_marcador[m] as { valor?: number })?.valor ?? 0
              ),
            }))
        : [];
      const estaveis = delta
        ? Object.entries(delta.classificacoes).filter(([, c]) => c === "ESTAVEL").map(([m]) => m)
        : [];

      return {
        system: progressoPrompt.SYSTEM,
        userPrompt: progressoPrompt.buildUserPrompt({
          diasDesdeUltimoScan: delta?.intervalo_dias ?? 0,
          marcadoresMelhoraram: melhoraram,
          marcadoresEstaveis: estaveis,
          // Math.abs — delta_global NEGATIVO internamente = melhora
          melhoraGlobalPts: Math.abs(delta?.delta_global ?? 0),
          efetividadeRotinaPct: delta?.efetividade_rotina ?? null,
          ativosEmUso: ativos,
          totalScans: twin.total_scans,
          melhoraAcumuladaPct: null,
        }),
      };
    }

    case "REGRESSAO_DETECTADA": {
      const pioraram = delta
        ? Object.entries(delta.classificacoes)
            .filter(([, c]) => c === "PIORA")
            .map(([m]) => ({
              nome: m,
              deltaAbs: Math.abs(
                (delta.deltas_por_marcador[m] as { valor?: number })?.valor ?? 0
              ),
            }))
        : [];
      const estaveis = delta
        ? Object.entries(delta.classificacoes).filter(([, c]) => c === "ESTAVEL").map(([m]) => m)
        : [];

      return {
        system: regressaoPrompt.SYSTEM,
        userPrompt: regressaoPrompt.buildUserPrompt({
          marcadoresPiora: pioraram,
          marcadoresEstaveis: estaveis,
          intervaloDias: delta?.intervalo_dias ?? 0,
          consistenciaPct: null,
          estacao: _estimarEstacao(),
        }),
      };
    }

    case "AJUSTE_ROTINA":
      return {
        system: ajustePrompt.SYSTEM,
        userPrompt: ajustePrompt.buildUserPrompt({
          efetividadePct: delta?.efetividade_rotina ?? 0,
          ativosEmUso: ativos,
          marcadoresNaoRespondendo: delta
            ? Object.entries(delta.classificacoes)
                .filter(([, c]) => c !== "MELHORA")
                .map(([m]) => m)
            : [],
          totalScans: twin.total_scans,
        }),
      };

    default:
      return { system: progressoPrompt.SYSTEM, userPrompt: "Gere uma mensagem motivacional curta." };
  }
}

function _fallback(
  tipo: InsightTipo,
  twin: SkinTwinRow,
  delta: TwinDeltaRow | null
): string {
  switch (tipo) {
    case "REGRESSAO_DETECTADA":
      return regressaoPrompt.FALLBACK();
    case "AJUSTE_ROTINA":
      return ajustePrompt.FALLBACK();
    case "MARCO_ALCANCADO": {
      const melhor = delta
        ? Object.entries(delta.classificacoes).find(([, c]) => c === "MELHORA")
        : null;
      if (melhor) {
        const pts = Math.abs(
          (delta!.deltas_por_marcador[melhor[0]] as { valor?: number })?.valor ?? 0
        );
        return marcoPrompt.FALLBACK({ marcador: melhor[0], pts });
      }
      return MENSAGENS[tipo];
    }
    case "PROGRESSO_POSITIVO": {
      const melhor = delta
        ? Object.entries(delta.classificacoes).find(([, c]) => c === "MELHORA")
        : null;
      if (melhor) {
        const pts = Math.abs(
          (delta!.deltas_por_marcador[melhor[0]] as { valor?: number })?.valor ?? 0
        );
        return progressoPrompt.FALLBACK({ marcador: melhor[0], delta: pts });
      }
      return MENSAGENS[tipo];
    }
    default:
      return MENSAGENS[tipo];
  }
}

function _estimarEstacao(): string {
  const mes = new Date().getMonth() + 1; // 1–12
  if (mes >= 12 || mes <= 2) return "verão";
  if (mes <= 5) return "outono";
  if (mes <= 8) return "inverno";
  return "primavera";
}
