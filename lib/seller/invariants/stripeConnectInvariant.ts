/**
 * INVARIANTE DE ARQUITETURA — STRIPE CONNECT OBRIGATÓRIO ANTES DE PUBLICAR LOTE
 *
 * Seller NUNCA publica lote sem Stripe Connect completo.
 * "Completo" = charges_enabled AND payouts_enabled E stripe_account_id presente.
 *
 * Consequências de publicar sem Stripe:
 *   · Pedidos sem rota de repasse → seller não recebe pagamento
 *   · Chargebacks sem conta destino → BelaPop absorve o prejuízo
 *   · Violação regulatória (marketplace sem MCC configurado)
 *
 * Uso obrigatório: chamar assertStripeCompleto antes de qualquer
 * INSERT em lotes WHERE seller_id.
 */

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface SellerStripeData {
  readonly id:                      string;
  readonly stripe_account_id:       string | null;
  readonly stripe_charges_enabled:  boolean;
  readonly stripe_payouts_enabled:  boolean;
}

/**
 * Branded type — garante que o seller passou pelo assertStripeCompleto.
 * Usar como parâmetro de funções que precisam de Stripe garantido:
 *
 *   function publicarLote(seller: SellerStripeData & StripeConnectCompleto) { ... }
 */
export type StripeConnectCompleto = {
  readonly stripe_account_id:      string;  // não null
  readonly stripe_charges_enabled: true;
  readonly stripe_payouts_enabled: true;
} & { readonly __brand: "StripeConnectCompleto" };

// ─── assertStripeCompleto ─────────────────────────────────────────────────────
// Usar antes de publicar lote — lança com mensagem acionável se incompleto.

export function assertStripeCompleto(
  seller: SellerStripeData
): asserts seller is SellerStripeData & StripeConnectCompleto {
  if (!seller.stripe_account_id) {
    throw new Error(
      `Stripe Connect incompleto para seller ${seller.id}: ` +
      `stripe_account_id ausente. ` +
      `Iniciar onboarding do Stripe antes de publicar lotes.`
    );
  }
  if (!seller.stripe_charges_enabled) {
    throw new Error(
      `Stripe Connect incompleto para seller ${seller.id}: ` +
      `charges_enabled = false. ` +
      `Aguardar verificação pelo Stripe (normalmente 1–2 dias úteis).`
    );
  }
  if (!seller.stripe_payouts_enabled) {
    throw new Error(
      `Stripe Connect incompleto para seller ${seller.id}: ` +
      `payouts_enabled = false. ` +
      `Aguardar configuração de repasses no Stripe.`
    );
  }
}

// ─── Type guard (não lança) ───────────────────────────────────────────────────

export function isStripeCompleto(
  seller: SellerStripeData
): seller is SellerStripeData & StripeConnectCompleto {
  return (
    seller.stripe_account_id !== null &&
    seller.stripe_charges_enabled === true &&
    seller.stripe_payouts_enabled === true
  );
}
