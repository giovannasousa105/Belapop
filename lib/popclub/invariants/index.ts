/**
 * Ponto de entrada único para as invariantes de domínio do PopClub.
 *
 * Importar SEMPRE daqui, nunca dos arquivos individuais:
 *   import { calcularProgressoTier, executarResgate, avaliarRebaixamento }
 *     from '@/lib/popclub/invariants'
 *
 * CI verifica que nenhum arquivo externo importa os módulos individuais.
 */

// ── Invariante 1: Pontos ─────────────────────────────────────────────────────
export {
  toPontosDisponiveis,
  toPontosAcumulados12m,
  calcularTierPorPontos,
  calcularProgressoTier,
  assertProgressoComLabel,
  TIER_LIMIARES,
} from "./pontosInvariant";

export type {
  PontosDisponiveis,
  PontosAcumulados12m,
  TierEnum,
  ProgressoTier,
} from "./pontosInvariant";

// ── Invariante 2: Stripe primeiro ────────────────────────────────────────────
export {
  criarCouponStripe,
  persistirCreditoNoBanco,
  executarResgate,
} from "./stripeFirstInvariant";

export type {
  CouponInput,
  CouponCriado,
  CreditoDbOps,
} from "./stripeFirstInvariant";

// ── Invariante 3: Rebaixamento com aviso ─────────────────────────────────────
export {
  avaliarRebaixamento,
  calcularDatasRebaixamento,
  calcularAvisoPayload,
} from "./tierRebaixamentoInvariant";

export type {
  RebaixamentoInput,
  RebaixamentoResult,
  AvisoRebaixamentoPayload,
} from "./tierRebaixamentoInvariant";
