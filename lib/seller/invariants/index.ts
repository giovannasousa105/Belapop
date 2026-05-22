/**
 * Ponto de entrada único para todas as invariantes do módulo Seller.
 *
 * Importar SEMPRE daqui — nunca dos arquivos individuais.
 * Ponto único de mudança em refatorações futuras.
 */

export {
  validarTransicaoSeller,
  assertPodeAprovar,
} from "./sellerStatusInvariant";

export type {
  SellerStatus,
  TransicaoResult,
  SellerParaAprovacao,
} from "./sellerStatusInvariant";

export {
  assertStripeCompleto,
  isStripeCompleto,
} from "./stripeConnectInvariant";

export type {
  SellerStripeData,
  StripeConnectCompleto,
} from "./stripeConnectInvariant";

export {
  calcularSLA,
  corDoSLA,
} from "./slaInvariant";

export type {
  SLAStatus,
  SLAStatusTipo,
} from "./slaInvariant";
