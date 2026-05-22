/**
 * INVARIANTE DE DOMÍNIO — LEIA ANTES DE QUALQUER CÁLCULO DE DELTA:
 *
 *   score MENOR = condição MELHORADA = pele melhorando
 *   delta NEGATIVO = melhora  (ex: acne 60→42 = delta -18 = MELHORA)
 *   delta POSITIVO = piora    (ex: oleosidade 30→60 = delta +30 = PIORA)
 *
 * Esta convenção é OPOSTA ao que parece intuitivo.
 * O CI verifica que delta_global < 0 é tratado como melhora.
 *
 * Exceção controlada: calcularMelhoraGlobal retorna POSITIVO para comunicar
 * melhora ao usuário — mas é apenas para exibição, não para cálculos internos.
 */

import {
  SKIN_MARKERS,
  toSkinScore,
  calcularSkinDelta,
  type SkinMarker,
  type SkinScore,
  type SkinDelta,
} from "./invariants/skinScoreInvariant";
import {
  TREND_WINDOW as INVARIANT_TREND_WINDOW,
  calcularMarkerTrend,
  type MarkerTrend,
  type TrendStatus,
} from "./invariants/trendWindowInvariant";
import type { SerializedSkinDelta, TwinSnapshotRow } from "./twinTypes";

// ─── Constantes exportadas ────────────────────────────────────────────────────

export const MARCADORES: SkinMarker[] = [...SKIN_MARKERS];

/**
 * Pesos clínicos por marcador — usados no cálculo de delta_global ponderado.
 * Marcadores mais impactantes na qualidade de vida recebem peso maior.
 */
export const PESOS: Record<SkinMarker, number> = {
  acne:         1.5,
  oleosidade:   1.2,
  pigmentacao:  1.3,
  vermelhidao:  1.2,
  ressecamento: 1.1,
  textura:      1.0,
  poros:        1.0,
};

/** Janela de tendência: mínimo 3 e máximo 5 snapshots. */
export const TREND_WINDOW = INVARIANT_TREND_WINDOW;

// ─── Tipos de delta ───────────────────────────────────────────────────────────

export type DeltaClassificacao = "MELHORA" | "PIORA" | "ESTAVEL";

/** Mapeamento ativo → marcadores que ele atua. */
const ATIVO_MARCADORES: Record<string, SkinMarker[]> = {
  "niacinamida":         ["oleosidade", "poros"],
  "bha-salicilico":      ["acne", "oleosidade"],
  "vitamina-c":          ["pigmentacao"],
  "ceramidas":           ["ressecamento", "vermelhidao"],
  "aha-glicolico":       ["textura", "pigmentacao"],
  "retinol":             ["textura", "poros"],
  "retinol-0.025":       ["textura", "poros"],
  "acido-hialuronico":   ["ressecamento"],
  "centella-asiatica":   ["vermelhidao"],
  "zinco-pca":           ["oleosidade", "acne"],
  "salicilico-0.5":      ["acne", "oleosidade"],
  "pantenol":            ["vermelhidao", "ressecamento"],
  "acido-azelaico":      ["acne", "pigmentacao"],
  "acido-kojico":        ["pigmentacao"],
  "pha":                 ["textura", "poros"],
};

// ─── Helpers internos ─────────────────────────────────────────────────────────

function toScore(n: number): SkinScore {
  return toSkinScore(Math.min(100, Math.max(0, Math.round(n))));
}

function toScoreMap(scores: Record<string, number>): Record<SkinMarker, SkinScore> {
  const result = {} as Record<SkinMarker, SkinScore>;
  for (const m of SKIN_MARKERS) {
    result[m] = toScore(scores[m] ?? 0);
  }
  return result;
}

function serializeDelta(d: SkinDelta): SerializedSkinDelta {
  return {
    marcador: d.marcador,
    valor: d.valor,
    direcao: d.direcao,
    magnitude: d.magnitude,
  };
}

// ─── calcularDeltaEntreScan ───────────────────────────────────────────────────
// Versão interna usada pelo snapshotService — opera em mapas de scores brutos.

export function calcularDeltaEntreScan(
  anterior: Record<string, number>,
  atual: Record<string, number>
): Record<SkinMarker, SerializedSkinDelta> {
  const a = toScoreMap(anterior);
  const b = toScoreMap(atual);
  const result = {} as Record<SkinMarker, SerializedSkinDelta>;

  for (const m of SKIN_MARKERS) {
    result[m] = serializeDelta(calcularSkinDelta(a[m], b[m], m));
  }

  return result;
}

// ─── calcularDelta ────────────────────────────────────────────────────────────
// Versão spec — aceita TwinSnapshotRow, aplica PESOS no delta_global.
// delta NEGATIVO = melhora. delta_global NEGATIVO = melhora global.

export function calcularDelta(
  anterior: Pick<TwinSnapshotRow, "scores_normalizados" | "ativos_em_uso">,
  atual: Pick<TwinSnapshotRow, "scores_normalizados">
): {
  deltas_por_marcador: Record<SkinMarker, number>;
  classificacoes: Record<SkinMarker, DeltaClassificacao>;
  delta_global: number;
  efetividade_rotina: number | null;
} {
  const a = toScoreMap(anterior.scores_normalizados);
  const b = toScoreMap(atual.scores_normalizados);

  const deltas_por_marcador = {} as Record<SkinMarker, number>;
  const classificacoes = {} as Record<SkinMarker, DeltaClassificacao>;

  let somaPonderada = 0;
  let somaPesos = 0;

  for (const m of SKIN_MARKERS) {
    const delta = b[m] - a[m]; // negativo = score caiu = MELHORA
    deltas_por_marcador[m] = delta;

    // |delta| < 5 = ESTAVEL (limiar clínico)
    classificacoes[m] =
      delta <= -5 ? "MELHORA" : delta >= 5 ? "PIORA" : "ESTAVEL";

    somaPonderada += delta * PESOS[m];
    somaPesos += PESOS[m];
  }

  // delta_global NEGATIVO = melhora global — documentado na invariante
  const delta_global = parseFloat((somaPonderada / somaPesos).toFixed(2));

  const efetividade_rotina = calcularEfetividade(
    anterior.ativos_em_uso ?? [],
    classificacoes
  );

  return { deltas_por_marcador, classificacoes, delta_global, efetividade_rotina };
}

// ─── calcularEfetividade ──────────────────────────────────────────────────────
// Mede o quanto os ativos em uso estão gerando melhora nos marcadores que atuam.
// Retorna null se não há ativos. Retorna 0–100 (% dos marcadores cobertos melhorados).

export function calcularEfetividade(
  ativos: string[],
  classificacoes: Record<string, DeltaClassificacao>
): number | null {
  if (!ativos || ativos.length === 0) return null;

  const marcadoresCobertos = new Set<SkinMarker>();
  for (const ativo of ativos) {
    const marcadores = ATIVO_MARCADORES[ativo.toLowerCase()] ?? [];
    for (const m of marcadores) marcadoresCobertos.add(m);
  }

  if (marcadoresCobertos.size === 0) return null;

  let melhorados = 0;
  for (const m of marcadoresCobertos) {
    if (classificacoes[m] === "MELHORA") melhorados++;
  }

  return parseFloat(((melhorados / marcadoresCobertos.size) * 100).toFixed(1));
}

// ─── calcularEfetividadeBaseline (interno) ────────────────────────────────────
// Versão usada internamente pelo snapshotService (comparação de mapas brutos).
// delta_global NEGATIVO = melhora geral.

export function calcularEfetividadeBaseline(
  baseline: Record<string, number>,
  atual: Record<string, number>
): { delta_global: number; melhora_percentual: number } {
  const b = toScoreMap(baseline);
  const a = toScoreMap(atual);

  let somaPonderada = 0;
  let somaPesos = 0;
  let marcadoresMelhorados = 0;

  for (const m of SKIN_MARKERS) {
    const delta = a[m] - b[m]; // negativo = score caiu = MELHORA
    somaPonderada += delta * PESOS[m];
    somaPesos += PESOS[m];
    if (delta < -5) marcadoresMelhorados++;
  }

  return {
    delta_global: parseFloat((somaPonderada / somaPesos).toFixed(2)),
    melhora_percentual: parseFloat(
      ((marcadoresMelhorados / SKIN_MARKERS.length) * 100).toFixed(1)
    ),
  };
}

// ─── calcularTrends ───────────────────────────────────────────────────────────
// Versão spec — aceita TwinSnapshotRow[].
// slope NEGATIVO = score descendo = MELHORANDO.
// Mínimo 3 snapshots. Janela: últimos 5.

export function calcularTrends(
  snapshots: Pick<TwinSnapshotRow, "scores_normalizados" | "numero_sequencia" | "criado_em">[]
): Record<SkinMarker, { status: TrendStatus; slope: number; velocidade_por_semana: number; confianca: "ALTA" | "MEDIA" | "INSUFICIENTE" }> {
  const result = {} as Record<SkinMarker, { status: TrendStatus; slope: number; velocidade_por_semana: number; confianca: "ALTA" | "MEDIA" | "INSUFICIENTE" }>;

  if (snapshots.length < TREND_WINDOW.MIN_SNAPSHOTS) {
    for (const m of SKIN_MARKERS) {
      result[m] = {
        status: "INSUFICIENTE",
        slope: 0,
        velocidade_por_semana: 0,
        confianca: "INSUFICIENTE",
      };
    }
    return result;
  }

  // Janela deslizante: últimos min(total, 5)
  const janela = snapshots.slice(-TREND_WINDOW.MAX_SNAPSHOTS);
  const n = janela.length;

  // Calcular intervalo médio em dias
  let intervaloMedioDias = 42;
  if (n >= 2) {
    const t0 = new Date(janela[0].criado_em).getTime();
    const tN = new Date(janela[n - 1].criado_em).getTime();
    intervaloMedioDias = Math.max(1, (tN - t0) / (1000 * 60 * 60 * 24) / (n - 1));
  }

  const confianca: "ALTA" | "MEDIA" | "INSUFICIENTE" =
    n >= TREND_WINDOW.MAX_SNAPSHOTS ? "ALTA" : "MEDIA";

  for (const m of SKIN_MARKERS) {
    const series = janela.map((s) => toScore(s.scores_normalizados[m] ?? 0));
    const trend = calcularMarkerTrend(series, m, intervaloMedioDias);

    result[m] = {
      status: trend.status,
      slope: trend.slope,
      velocidade_por_semana: trend.velocidade_por_semana,
      confianca,
    };
  }

  return result;
}

// ─── calcularTrendsFromSnapshots (interno) ────────────────────────────────────
// Versão usada pelo snapshotService — retorna MarkerTrend[] para upsert no banco.

export function calcularTrendsFromSnapshots(
  snapshots: Array<{ scores_normalizados: Record<string, number>; criado_em: string }>
): MarkerTrend[] {
  if (snapshots.length === 0) {
    return SKIN_MARKERS.map((m) => ({
      marcador: m,
      status: "INSUFICIENTE" as const,
      slope: 0,
      velocidade_por_semana: 0,
      snapshotsUsados: 0,
      confianca: "BAIXA" as const,
    }));
  }

  let intervaloMedioDias = 42;
  if (snapshots.length >= 2) {
    const t0 = new Date(snapshots[0].criado_em).getTime();
    const tN = new Date(snapshots[snapshots.length - 1].criado_em).getTime();
    const totalDias = (tN - t0) / (1000 * 60 * 60 * 24);
    intervaloMedioDias = Math.max(1, totalDias / (snapshots.length - 1));
  }

  return SKIN_MARKERS.map((m) => {
    const series = snapshots.map((s) => toScore(s.scores_normalizados[m] ?? 0));
    return calcularMarkerTrend(series, m, intervaloMedioDias);
  });
}

// ─── calcularMelhoraGlobal ────────────────────────────────────────────────────
// Versão spec — retorna POSITIVO para melhora (para exibição ao usuário).
//
// melhora_global_pct POSITIVO = pele melhorou (scores caíram)
// Fórmula: média da redução percentual por marcador
// melhora_por_marcador = (baseline[m] - atual[m]) / baseline[m] * 100
//
// ATENÇÃO: retorno POSITIVO = MELHORA (score caiu)
// Diferente de delta_global onde NEGATIVO = MELHORA.

export function calcularMelhoraGlobal(
  baseline: Record<string, number>,
  atual: Record<string, number>
): number {
  const SOMA_PESOS = Object.values(PESOS).reduce((a, b) => a + b, 0);
  let soma = 0;

  for (const m of SKIN_MARKERS) {
    const b = baseline[m] ?? 0;
    const a = atual[m] ?? 0;
    if (b === 0) continue;
    // (baseline - atual) / baseline * peso → positivo = score caiu = melhora
    soma += ((b - a) / b) * 100 * PESOS[m];
  }

  return parseFloat((soma / SOMA_PESOS).toFixed(2));
}

// ─── calcularMelhoraGlobalObjeto (para API routes) ───────────────────────────
// Versão que retorna objeto com delta e percentual — para uso nas rotas de API.
// delta_global NEGATIVO = melhora geral.

export function calcularMelhoraGlobalObjeto(
  scoresBaseline: Record<string, number>,
  ultimoSnapshot: { scores_normalizados: Record<string, number> } | null
): { delta_global: number; melhora_percentual: number } | null {
  if (!ultimoSnapshot) return null;
  return calcularEfetividadeBaseline(scoresBaseline, ultimoSnapshot.scores_normalizados);
}
