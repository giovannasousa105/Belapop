/**
 * INVARIANTE DE DOMÍNIO — JANELA DE TREND
 *
 * Trends de pele nunca são calculados com menos de 3 snapshots.
 * A janela máxima é de 5 snapshots (deslizante — sempre os mais recentes).
 *
 * Motivação: um scan atípico (alergia, iluminação ruim, maquiagem residual)
 * tem peso máximo de 1/5 na tendência. Sem janela, um outlier destrói
 * meses de tendência positiva real.
 *
 * A regressão linear sobre a janela é mais robusta que comparação binária
 * porque: (1) reduz peso de outliers, (2) detecta tendência antes do usuário
 * perceber, (3) não alerta por variação pontual.
 */

import type { SkinMarker, SkinScore } from "./skinScoreInvariant";

// ─── Constantes da janela ─────────────────────────────────────────────────────

export const TREND_WINDOW = {
  MIN_SNAPSHOTS: 3, // mínimo para calcular — abaixo disso: retornar INSUFICIENTE
  MAX_SNAPSHOTS: 5, // janela máxima — sempre os N mais recentes
} as const;

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type TrendStatus = "MELHORANDO" | "ESTAVEL" | "PIORANDO" | "INSUFICIENTE";

export interface MarkerTrend {
  readonly marcador: SkinMarker;
  readonly status: TrendStatus;
  readonly slope: number; // pontos por scan (negativo = score descendo = MELHORANDO)
  readonly velocidade_por_semana: number;
  readonly snapshotsUsados: number;
  readonly confianca: "ALTA" | "MEDIA" | "BAIXA";
  /**
   * confianca:
   *   ALTA   = 5 snapshots usados
   *   MEDIA  = 3-4 snapshots usados
   *   BAIXA  = nunca retornado — INSUFICIENTE é retornado em vez disso
   */
}

// ─── Regressão linear simples ─────────────────────────────────────────────────

function regressaoLinear(valores: number[]): number {
  const n = valores.length;
  const xMean = (n - 1) / 2;
  const yMean = valores.reduce((s, v) => s + v, 0) / n;

  const num = valores.reduce((s, v, i) => s + (i - xMean) * (v - yMean), 0);
  const den = valores.reduce((s, _, i) => s + Math.pow(i - xMean, 2), 0);

  return den === 0 ? 0 : num / den;
}

// ─── Cálculo de trend ─────────────────────────────────────────────────────────

const SLOPE_LIMIAR = 0.5; // pontos por scan

/**
 * Calcula a tendência de um marcador de pele com base em uma série de scores.
 *
 * @param scores      Série cronológica do mais antigo ao mais recente.
 * @param marcador    Marcador de pele sendo analisado.
 * @param intervaloMedioDias  Dias médios entre scans — usado para calcular velocidade semanal.
 */
export function calcularMarkerTrend(
  scores: SkinScore[],
  marcador: SkinMarker,
  intervaloMedioDias: number
): MarkerTrend {
  if (scores.length < TREND_WINDOW.MIN_SNAPSHOTS) {
    return {
      marcador,
      status: "INSUFICIENTE",
      slope: 0,
      velocidade_por_semana: 0,
      snapshotsUsados: scores.length,
      confianca: "BAIXA",
    };
  }

  // Pegar apenas os N mais recentes (janela deslizante)
  const janela = scores.slice(-TREND_WINDOW.MAX_SNAPSHOTS);
  const n = janela.length;

  const slope = regressaoLinear(janela as number[]);

  // Para marcadores padrão: slope negativo = score descendo = MELHORANDO
  const status: TrendStatus =
    slope <= -SLOPE_LIMIAR
      ? "MELHORANDO"
      : slope >= SLOPE_LIMIAR
        ? "PIORANDO"
        : "ESTAVEL";

  const velocidade_por_semana =
    Math.abs(slope) * (7 / Math.max(intervaloMedioDias, 1));

  return {
    marcador,
    status,
    slope: parseFloat(slope.toFixed(4)),
    velocidade_por_semana: parseFloat(velocidade_por_semana.toFixed(2)),
    snapshotsUsados: n,
    confianca: n >= TREND_WINDOW.MAX_SNAPSHOTS ? "ALTA" : "MEDIA",
  };
}

// ─── Guard ────────────────────────────────────────────────────────────────────
// Nunca chamar a trend engine sem verificar se há dados suficientes.

export function assertTrendSuficiente(trends: MarkerTrend[]): void {
  const insuficientes = trends.filter((t) => t.status === "INSUFICIENTE");
  if (insuficientes.length === trends.length) {
    throw new Error(
      `calcularTrends chamado com snapshots insuficientes. ` +
        `Mínimo: ${TREND_WINDOW.MIN_SNAPSHOTS}. ` +
        `Verificar total_scans antes de chamar esta função.`
    );
  }
}
