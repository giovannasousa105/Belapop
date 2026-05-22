import type Stripe from "stripe";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  checkAndMarkIdempotency,
  logWebhookEvent,
  registrarEventoLote,
} from "./stripeWebhookUtils";

type RefundContext = {
  chargeId: string;
  refundId: string;
  paymentIntentId: string | null;
  amountRefundedCents: number;
  orderId: string | null;
};

async function resolveRefundContext(
  charge: Stripe.Charge
): Promise<RefundContext> {
  const admin = getSupabaseAdminClient();

  const paymentIntentId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : (charge.payment_intent as Stripe.PaymentIntent | null)?.id ?? null;

  const refund = charge.refunds?.data?.[0] ?? null;
  const refundId = refund?.id ?? "unknown";
  const amountRefundedCents = Number(charge.amount_refunded ?? 0);

  // Resolve order via payment_intent_id
  let orderId: string | null = null;
  if (paymentIntentId) {
    const { data } = await admin
      .from("orders")
      .select("id")
      .eq("payment_intent_id", paymentIntentId)
      .maybeSingle();
    orderId = (data as { id?: string } | null)?.id ?? null;
  }

  return { chargeId: charge.id, refundId, paymentIntentId, amountRefundedCents, orderId };
}

async function resolveOrderLoteId(orderId: string): Promise<string | null> {
  const admin = getSupabaseAdminClient();

  // Find the confirmed lote_reserva linked to this order
  const { data } = await admin
    .from("lote_reservas")
    .select("lote_id")
    .eq("pedido_id", orderId)
    .eq("status", "CONFIRMADA")
    .limit(1)
    .maybeSingle();

  return (data as { lote_id?: string } | null)?.lote_id ?? null;
}

/**
 * Handles charge.refund.updated (status = 'succeeded') and charge.refunded.
 *
 * BelaPop policy: refund does NOT automatically restore qtd_disponivel.
 * Stock restoration is a deliberate seller + admin decision.
 *
 * This handler:
 * 1. Records a LIBERACAO event in lote_eventos for audit trail.
 * 2. Updates the pedido status to REEMBOLSADO.
 * 3. Creates an admin task to verify stock replenishment.
 */
export async function handleRefundCompleted(
  charge: Stripe.Charge,
  stripeEventId: string,
  eventType: string
): Promise<void> {
  // Guard: only process succeeded refunds
  const latestRefund = charge.refunds?.data?.[0];
  if (latestRefund && latestRefund.status !== "succeeded") return;

  const { skip } = await checkAndMarkIdempotency(stripeEventId, eventType);
  if (skip) {
    logWebhookEvent("info", stripeEventId, eventType, "evento_ja_processado");
    return;
  }

  const ctx = await resolveRefundContext(charge);

  // Update pedido status
  if (ctx.orderId) {
    const admin = getSupabaseAdminClient();
    try {
      await admin
        .from("orders")
        .update({ status: "refunded" })
        .eq("id", ctx.orderId);
    } catch (err: unknown) {
      logWebhookEvent("warn", stripeEventId, eventType,
        "order status update failed",
        { order_id: ctx.orderId, error: err instanceof Error ? err.message : String(err) });
    }

    // Record lote audit event (no qty change — policy decision)
    const loteId = await resolveOrderLoteId(ctx.orderId).catch(() => null);
    if (loteId) {
      await registrarEventoLote({
        loteId,
        tipo: "LIBERACAO",
        deltaQtd: 0, // explicit: no automatic stock restoration
        metadata: {
          motivo: "reembolso_stripe",
          charge_id: ctx.chargeId,
          refund_id: ctx.refundId,
          amount_refunded_cents: ctx.amountRefundedCents,
          order_id: ctx.orderId,
          stripe_event_id: stripeEventId,
          nota: "qtd_disponivel_NAO_restaurado_automaticamente",
        },
      });
    }

    // Create admin task for manual stock review
    const adminClient = getSupabaseAdminClient();
    try {
      await adminClient
        .from("tarefas_admin")
        .insert({
          tipo: "VERIFICAR_ESTOQUE_POS_REEMBOLSO",
          status: "pendente",
          prioridade: "media",
          titulo: "Verificar reposição de estoque após reembolso",
          descricao: `Pedido ${ctx.orderId} foi reembolsado via Stripe. Avaliar se o estoque do lote deve ser reposto manualmente.`,
          metadata: {
            order_id: ctx.orderId,
            lote_id: loteId,
            charge_id: ctx.chargeId,
            refund_id: ctx.refundId,
            amount_refunded_cents: ctx.amountRefundedCents,
            stripe_event_id: stripeEventId,
          },
          criado_em: new Date().toISOString(),
        });
    } catch (err: unknown) {
      const pgErr = err as { code?: string; message?: string };
      if (pgErr.code !== "42P01") {
        logWebhookEvent("warn", stripeEventId, eventType,
          "tarefas_admin insert failed — table may not exist yet",
          { error: pgErr.message });
      }
    }
  }

  logWebhookEvent("info", stripeEventId, eventType, "reembolso_registrado", {
    charge_id: ctx.chargeId,
    order_id: ctx.orderId,
    amount_cents: ctx.amountRefundedCents,
  });
}
