export {
  toCompatScore,
  deveExibirBadge,
  formatarScoreParaExibicao,
  CompatScoreInvalidoError,
  COMPAT_BADGE_THRESHOLD,
} from "./compatibilidadeInvariant";
export type { CompatScore } from "./compatibilidadeInvariant";

export {
  assertRankingCoerente,
  calcularPersonalizado,
  RankingInvariante,
} from "./rankingInvariant";
export type { ParamsRanking, ParamsPersonalizado } from "./rankingInvariant";
