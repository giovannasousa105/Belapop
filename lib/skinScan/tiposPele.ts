import type { TipoPele } from "./types";

// ─── Tipos locais ─────────────────────────────────────────────────────────────

export interface ScoresNorm {
  acne: number;
  poros: number;
  textura: number;
  oleosidade: number;
  pigmentacao: number;
  vermelhidao: number;
  ressecamento: number;
}

// ─── Tipo de pele ─────────────────────────────────────────────────────────────

/**
 * Determina o tipo de pele com base nos scores normalizados (0–100).
 *
 * As regras são avaliadas **em ordem de prioridade** — o primeiro match vence.
 * Isso garante ausência de ambiguidade mesmo em casos limite.
 */
export function determinarTipoPele(
  scores: ScoresNorm,
  flags: string[],
  focos_selecionados: string[]
): TipoPele {
  const { oleosidade, ressecamento, vermelhidao } = scores;
  const flagSet = new Set(flags);

  // 1. SENSIVEL: vermelhidão alta OU sinal clínico + foco declarado
  if (
    vermelhidao > 60 ||
    (flagSet.has("LOW_CONFIDENCE") && focos_selecionados.includes("sensibilidade"))
  ) {
    return "SENSIVEL";
  }

  // 2. OLEOSA: oleosidade dominante com pele não-ressecada
  if (oleosidade > 65 && ressecamento < 35) {
    return "OLEOSA";
  }

  // 3. MISTA: oleosidade moderada com algum ressecamento coexistindo
  if (oleosidade > 50 && ressecamento > 30) {
    return "MISTA";
  }

  // 4. SECA: ressecamento dominante ou oleosidade muito baixa
  if (ressecamento > 55 || oleosidade < 25) {
    return "SECA";
  }

  // 5. NORMAL: fallback — todos os indicadores dentro da faixa de equilíbrio
  return "NORMAL";
}

// ─── Nível de sensibilidade ───────────────────────────────────────────────────

/**
 * Calcula o nível de sensibilidade clínica (1–5).
 *
 * Baseia-se na combinação de vermelhidão e acne normalizados.
 * Vermelhidão é o indicador primário; acne é o secundário.
 */
export function calcularNivelSensibilidade(scores: ScoresNorm): number {
  const { vermelhidao, acne } = scores;

  if (vermelhidao > 70) return 5;
  if (vermelhidao > 55 || acne > 55) return 4;
  if (vermelhidao >= 35 || acne >= 35) return 3;
  if (vermelhidao >= 20 || acne >= 20) return 2;
  return 1;
}
