/**
 * INVARIANTE: CompatScore é um inteiro 0–100.
 * Badge só exibe quando score >= 60.
 * Nunca exibir scores que não passaram por toCompatScore().
 */

declare const __compatScoreBrand: unique symbol;
export type CompatScore = number & { readonly [__compatScoreBrand]: true };

export class CompatScoreInvalidoError extends Error {
  constructor(raw: number) {
    super(`CompatScore inválido: ${raw}. Deve ser inteiro entre 0 e 100.`);
    this.name = "CompatScoreInvalidoError";
  }
}

export function toCompatScore(raw: number): CompatScore {
  const inteiro = Math.round(raw);
  if (!Number.isFinite(inteiro) || inteiro < 0 || inteiro > 100) {
    throw new CompatScoreInvalidoError(raw);
  }
  return inteiro as CompatScore;
}

export const COMPAT_BADGE_THRESHOLD = 60;

export function deveExibirBadge(score: CompatScore): boolean {
  return score >= COMPAT_BADGE_THRESHOLD;
}

export function formatarScoreParaExibicao(score: CompatScore): string {
  return `${score}% compatível`;
}
