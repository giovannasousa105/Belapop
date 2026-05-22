/**
 * INVARIANTE: Parâmetros de ranking do catálogo devem ser coerentes.
 * total_vendas >= 0, rating 0–5, total_avaliacoes >= 0.
 * calcularPersonalizado retorna score determinístico e sem NaN.
 */

export class RankingInvariante extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "RankingInvariante";
  }
}

export interface ParamsRanking {
  total_vendas_30d:  number;
  rating_medio:      number;
  total_avaliacoes:  number;
}

export interface ParamsPersonalizado extends ParamsRanking {
  score_compatibilidade?: number;
  curated:                boolean;
  is_featured:            boolean;
}

export function assertRankingCoerente(params: ParamsRanking): void {
  if (!Number.isFinite(params.total_vendas_30d) || params.total_vendas_30d < 0) {
    throw new RankingInvariante(
      `total_vendas_30d inválido: ${params.total_vendas_30d}. Deve ser >= 0.`
    );
  }
  if (!Number.isFinite(params.rating_medio) || params.rating_medio < 0 || params.rating_medio > 5) {
    throw new RankingInvariante(
      `rating_medio inválido: ${params.rating_medio}. Deve estar entre 0 e 5.`
    );
  }
  if (!Number.isFinite(params.total_avaliacoes) || params.total_avaliacoes < 0) {
    throw new RankingInvariante(
      `total_avaliacoes inválido: ${params.total_avaliacoes}. Deve ser >= 0.`
    );
  }
}

export function calcularPersonalizado(params: ParamsPersonalizado): number {
  assertRankingCoerente(params);

  const compatBoost = params.score_compatibilidade != null
    ? Math.min(100, Math.max(0, params.score_compatibilidade)) / 100 * 7
    : 0;

  const vendas  = Math.log1p(params.total_vendas_30d);
  const rating  = params.rating_medio;
  const featured = params.is_featured ? 8 : 0;
  const curated  = params.curated     ? 5 : 0;

  return compatBoost + vendas + rating + featured + curated;
}
