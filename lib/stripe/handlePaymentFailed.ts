import type Stripe from "stripe";

import {
  checkAndMarkIdempotency,
  liberarLoteReserva,
  logWebhookEvent,
} from "./stripeWebhookUtils";

/**
 * Handles payment_intent.payment_failed and payment_intent.canceled.
 * Releases the lote reservation and restores qtd_disponivel.
 *
 * Safe to call multiple times: liberarLoteReserva is idempotent.
 */
export async function handlePaymentFailed(
  paymentIntent: Stripe.PaymentIntent,
  stripeEventId: string,
  eventType: string
): Promise<void> {
  const paymentIntentId = paymentIntent.id;

  const { skip } = await checkAndMarkIdempotency(stripeEventId, eventType);
  if (skip) {
    logWebhookEvent("info", stripeEventId, eventType,
      "evento_ja_processado", { payment_intent_id: paymentIntentId });
    return;
  }

  const motivo =
    eventType === "payment_intent.canceled"
      ? "payment_intent_cancelado"
      : "pagamento_falhou";

  const result = await liberarLoteReserva({
    paymentIntentId,
    motivo,
    eventId: stripeEventId,
  });

  logWebhookEvent(
    result.ok ? "info" : "warn",
    stripeEventId,
    eventType,
    result.skipped ? "reserva_nao_encontrada_ou_ja_liberada" : "reserva_liberada",
    { payment_intent_id: paymentIntentId, motivo }
  );
}
