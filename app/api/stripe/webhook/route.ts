import { createHash } from "node:crypto";

import { NextResponse } from "next/server";
import Stripe from "stripe";

import { loadPersistedSplitsForOrder } from "@/lib/checkout/serverCheckout";
import { updateCheckoutSessionProviderState } from "@/lib/checkout/paymentSessions";
import { postChargebackEconomicEntries } from "@/lib/finance/chargebacks";
import { recordPaymentState } from "@/lib/payments/stateMachine";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getNormalizedEnvValue, getStripe } from "@/lib/stripe/stripeClient";

export const runtime = "nodejs";

const webhookSecret = getNormalizedEnvValue(process.env.STRIPE_WEBHOOK_SECRET);

const buildIdempotencyKey = (parts: Array<string | null | undefined>) =>
  createHash("sha256")
    .update(
      parts
        .map((part) => String(part ?? "").trim())
        .filter(Boolean)
        .join(":")
    )
    .digest("hex");

const persistStripeTransaction = async ({
  stripe,
  event,
  paymentIntent,
  orderId
}: {
  stripe: Stripe;
  event: Stripe.Event;
  paymentIntent: Stripe.PaymentIntent;
  orderId: string | null;
}) => {
  const admin = getSupabaseAdminClient();
  const paymentIntentId = String(paymentIntent.id ?? "").trim();
  if (!paymentIntentId) return;

  let chargeId: string | null = null;
  let fee = 0;

  const latestCharge = paymentIntent.latest_charge;
  if (typeof latestCharge === "string" && latestCharge.trim()) {
    chargeId = latestCharge.trim();
  } else if (
    latestCharge &&
    typeof latestCharge === "object" &&
    "id" in latestCharge &&
    typeof latestCharge.id === "string"
  ) {
    chargeId = latestCharge.id;
  }

  if (chargeId) {
    try {
      const charge = await stripe.charges.retrieve(chargeId, {
        expand: ["balance_transaction"]
      });
      const balanceTransaction = charge.balance_transaction;
      if (
        balanceTransaction &&
        typeof balanceTransaction === "object" &&
        "fee" in balanceTransaction
      ) {
        fee = Number(balanceTransaction.fee ?? 0) / 100;
      }
    } catch (error) {
      console.warn("[Stripe webhook] Falha ao buscar fee da charge para reconciliacao:", error);
    }
  }

  const insert = await admin.from("stripe_transactions").insert({
    provider: "stripe",
    event_id: event.id,
    payment_intent_id: paymentIntentId,
    charge_id: chargeId,
    amount: Number(paymentIntent.amount_received ?? paymentIntent.amount ?? 0) / 100,
    fee,
    currency: (paymentIntent.currency ?? "brl").toUpperCase(),
    status: paymentIntent.status,
    metadata: {
      event_type: event.type,
      order_id: orderId
    },
    created_at: new Date(event.created * 1000).toISOString()
  });

  if (insert.error) {
    if (insert.error.code === "23505") return;
    if (insert.error.code === "42P01" || insert.error.code === "42703") {
      console.warn(
        "[Stripe webhook] stripe_transactions indisponivel. Rode a migration 20260310_1800_marketplace_reconciliation_engine.sql."
      );
      return;
    }
    throw new Error(`stripe_transactions insert failed: ${insert.error.message}`);
  }
};

const resolveStoreIdFromOrder = async (orderId: string) => {
  const admin = getSupabaseAdminClient();
  const subOrderLookup = await admin
    .from("sub_orders")
    .select("seller_id")
    .eq("order_id", orderId)
    .limit(1)
    .maybeSingle();

  if (subOrderLookup.error) {
    throw new Error(`sub_orders store lookup failed: ${subOrderLookup.error.message}`);
  }

  return (subOrderLookup.data?.seller_id as string | null) ?? null;
};

const resolveOrderIdFromPaymentIntent = async (
  paymentIntent: Stripe.PaymentIntent
) => {
  const admin = getSupabaseAdminClient();
  const lookup = await admin
    .from("orders")
    .select("id")
    .eq("payment_intent_id", paymentIntent.id)
    .maybeSingle();

  if (lookup.error) {
    throw new Error(`orders lookup failed: ${lookup.error.message}`);
  }

  return (lookup.data?.id as string | null) ?? null;
};

const markOrderAsPaid = async (
  orderId: string | null,
  paymentIntent: Stripe.PaymentIntent,
  providerEventId?: string | null
) => {
  if (!orderId) return;

  const admin = getSupabaseAdminClient();
  const provider = "stripe";
  const providerRef = paymentIntent.id;
  const currency = (paymentIntent.currency ?? "brl").toUpperCase();
  const amountCents = Number(paymentIntent.amount_received ?? paymentIntent.amount ?? 0);
  const occurredAt = new Date().toISOString();
  const storeId = await resolveStoreIdFromOrder(orderId);

  await recordPaymentState({
    orderId,
    state: "succeeded",
    paymentIntentId: providerRef,
    amountCents,
    currency,
    provider,
    event: "payment_intent.succeeded",
    providerEventId: providerEventId ?? null,
    metadata: {
      event_type: "payment_intent.succeeded"
    }
  });
  await updateCheckoutSessionProviderState({
    paymentIntentId: providerRef,
    providerStatus: "succeeded",
    status: "succeeded"
  });

  const orderUpdate = await admin
    .from("orders")
    .update({
      status: "paid"
    })
    .eq("id", orderId);

  if (orderUpdate.error) {
    throw new Error(`orders update failed: ${orderUpdate.error.message}`);
  }

  const subOrderUpdate = await admin
    .from("sub_orders")
    .update({
      status: "awaiting_shipment",
      payment_status: "paid"
    })
    .eq("order_id", orderId);

  if (subOrderUpdate.error) {
    throw new Error(`sub_orders update failed: ${subOrderUpdate.error.message}`);
  }

  const eventInsert = await admin.from("marketplace_events").insert({
    event_type: "order",
    event_name: "order_paid",
    occurred_at: occurredAt,
    channel: "marketplace",
    store_id: storeId,
    order_id: orderId,
    amount_cents: amountCents > 0 ? amountCents : null,
    currency,
    external_ref: providerRef,
    idempotency_key: buildIdempotencyKey([
      provider,
      providerRef,
      "order_paid",
      orderId,
      providerEventId
    ]),
    source: "stripe_webhook",
    provider,
    ingestion_status: "processed",
    metadata: {
      event_type: "payment_intent.succeeded"
    }
  });

  if (eventInsert.error && eventInsert.error.code !== "23505") {
    throw new Error(`marketplace_events insert failed: ${eventInsert.error.message}`);
  }
};

const markOrderAsFailed = async (
  orderId: string | null,
  paymentIntent: Stripe.PaymentIntent,
  eventType: "payment_intent.payment_failed" | "payment_intent.canceled",
  providerEventId?: string | null
) => {
  if (!orderId) return;

  const admin = getSupabaseAdminClient();
  const provider = "stripe";
  const providerRef = paymentIntent.id;
  const currency = (paymentIntent.currency ?? "brl").toUpperCase();
  const amountCents = Number(paymentIntent.amount ?? 0);
  const occurredAt = new Date().toISOString();
  const storeId = await resolveStoreIdFromOrder(orderId);

  await recordPaymentState({
    orderId,
    state: eventType === "payment_intent.canceled" ? "canceled" : "failed",
    paymentIntentId: providerRef,
    amountCents,
    currency,
    provider,
    event: eventType,
    providerEventId: providerEventId ?? null,
    metadata: {
      event_type: eventType
    }
  });
  await updateCheckoutSessionProviderState({
    paymentIntentId: providerRef,
    providerStatus: eventType === "payment_intent.canceled" ? "canceled" : "payment_failed",
    status: eventType === "payment_intent.canceled" ? "canceled" : "failed"
  });

  const orderUpdate = await admin
    .from("orders")
    .update({
      status: "cancelled"
    })
    .eq("id", orderId);

  if (orderUpdate.error) {
    throw new Error(`orders update failed: ${orderUpdate.error.message}`);
  }

  const subOrderUpdate = await admin
    .from("sub_orders")
    .update({
      status: "cancelled",
      payment_status: "failed"
    })
    .eq("order_id", orderId);

  if (subOrderUpdate.error) {
    throw new Error(`sub_orders update failed: ${subOrderUpdate.error.message}`);
  }

  const eventInsert = await admin.from("marketplace_events").insert({
    event_type: "order",
    event_name: "order_canceled",
    occurred_at: occurredAt,
    channel: "marketplace",
    store_id: storeId,
    order_id: orderId,
    amount_cents: amountCents > 0 ? amountCents : null,
    currency,
    external_ref: providerRef,
    idempotency_key: buildIdempotencyKey([
      provider,
      providerRef,
      "order_canceled",
      orderId,
      eventType,
      providerEventId
    ]),
    source: "stripe_webhook",
    provider,
    ingestion_status: "processed",
    metadata: {
      event_type: eventType
    }
  });

  if (eventInsert.error && eventInsert.error.code !== "23505") {
    throw new Error(`marketplace_events insert failed: ${eventInsert.error.message}`);
  }
};

const markOrderAsIntermediateState = async (
  orderId: string | null,
  paymentIntent: Stripe.PaymentIntent,
  nextState: "processing" | "requires_action" | "requires_payment_method" | "requires_confirmation",
  eventType: string,
  providerEventId?: string | null
) => {
  if (!orderId) return;

  await recordPaymentState({
    orderId,
    state: nextState,
    paymentIntentId: paymentIntent.id,
    amountCents: Number(paymentIntent.amount ?? 0),
    currency: (paymentIntent.currency ?? "brl").toUpperCase(),
    provider: "stripe",
    event: eventType,
    providerEventId: providerEventId ?? null,
    metadata: {
      event_type: eventType
    }
  });
  await updateCheckoutSessionProviderState({
    paymentIntentId: paymentIntent.id,
    providerStatus: nextState,
    status: nextState
  });
};

const resolvePaymentIntentFromCharge = async (
  stripe: Stripe,
  charge:
    | Stripe.Charge
    | Stripe.Refund
    | Stripe.Dispute
) => {
  let paymentIntentRef =
    "payment_intent" in charge ? charge.payment_intent : null;

  if (!paymentIntentRef && "charge" in charge && charge.charge) {
    const chargeRef = charge.charge;
    const stripeCharge =
      typeof chargeRef === "string"
        ? await stripe.charges.retrieve(chargeRef)
        : chargeRef;
    paymentIntentRef = stripeCharge.payment_intent;
  }

  if (!paymentIntentRef) return null;
  if (typeof paymentIntentRef === "object") {
    return paymentIntentRef as Stripe.PaymentIntent;
  }

  return stripe.paymentIntents.retrieve(String(paymentIntentRef));
};

const markOrderAsRefunded = async ({
  orderId,
  paymentIntent,
  providerEventId,
  amountCents
}: {
  orderId: string | null;
  paymentIntent: Stripe.PaymentIntent;
  providerEventId?: string | null;
  amountCents?: number | null;
}) => {
  if (!orderId) return;

  const admin = getSupabaseAdminClient();
  const providerRef = paymentIntent.id;
  const provider = "stripe";
  const currency = (paymentIntent.currency ?? "brl").toUpperCase();
  const occurredAt = new Date().toISOString();
  const storeId = await resolveStoreIdFromOrder(orderId);
  const refundedAmount = Number(amountCents ?? paymentIntent.amount_received ?? paymentIntent.amount ?? 0);

  await recordPaymentState({
    orderId,
    state: "refunded",
    paymentIntentId: providerRef,
    amountCents: refundedAmount,
    currency,
    provider,
    event: "charge.refunded",
    providerEventId: providerEventId ?? null,
    metadata: {
      event_type: "charge.refunded"
    }
  });
  await updateCheckoutSessionProviderState({
    paymentIntentId: providerRef,
    providerStatus: "refunded",
    status: "refunded"
  });

  const eventInsert = await admin.from("marketplace_events").insert({
    event_type: "finance",
    event_name: "refund_settled",
    occurred_at: occurredAt,
    channel: "marketplace",
    store_id: storeId,
    order_id: orderId,
    amount_cents: refundedAmount > 0 ? refundedAmount : null,
    currency,
    external_ref: providerRef,
    idempotency_key: buildIdempotencyKey([
      provider,
      providerRef,
      "refund_settled",
      orderId,
      providerEventId
    ]),
    source: "stripe_webhook",
    provider,
    ingestion_status: "processed",
    metadata: {
      event_type: "charge.refunded"
    }
  });

  if (eventInsert.error && eventInsert.error.code !== "23505") {
    throw new Error(`marketplace_events insert failed: ${eventInsert.error.message}`);
  }
};

const markOrderAsChargeback = async ({
  orderId,
  paymentIntent,
  providerEventId,
  amountCents
}: {
  orderId: string | null;
  paymentIntent: Stripe.PaymentIntent;
  providerEventId?: string | null;
  amountCents?: number | null;
}) => {
  if (!orderId) return;

  const admin = getSupabaseAdminClient();
  const providerRef = paymentIntent.id;
  const provider = "stripe";
  const currency = (paymentIntent.currency ?? "brl").toUpperCase();
  const occurredAt = new Date().toISOString();
  const storeId = await resolveStoreIdFromOrder(orderId);
  const disputedAmount = Number(amountCents ?? paymentIntent.amount_received ?? paymentIntent.amount ?? 0);

  await recordPaymentState({
    orderId,
    state: "chargeback",
    paymentIntentId: providerRef,
    amountCents: disputedAmount,
    currency,
    provider,
    event: "charge.dispute.created",
    providerEventId: providerEventId ?? null,
    metadata: {
      event_type: "charge.dispute.created"
    }
  });
  await updateCheckoutSessionProviderState({
    paymentIntentId: providerRef,
    providerStatus: "chargeback",
    status: "chargeback"
  });

  const eventInsert = await admin.from("marketplace_events").insert({
    event_type: "risk",
    event_name: "chargeback_opened",
    occurred_at: occurredAt,
    channel: "marketplace",
    store_id: storeId,
    order_id: orderId,
    amount_cents: disputedAmount > 0 ? disputedAmount : null,
    currency,
    external_ref: providerRef,
    idempotency_key: buildIdempotencyKey([
      provider,
      providerRef,
      "chargeback_opened",
      orderId,
      providerEventId
    ]),
    source: "stripe_webhook",
    provider,
    ingestion_status: "processed",
    metadata: {
      event_type: "charge.dispute.created"
    }
  });

  if (eventInsert.error && eventInsert.error.code !== "23505") {
    throw new Error(`marketplace_events insert failed: ${eventInsert.error.message}`);
  }
};

const createTransfers = async (
  stripe: Stripe,
  paymentIntent: Stripe.PaymentIntent,
  orderId: string | null
) => {
  if (!orderId) return;
  const splits = await loadPersistedSplitsForOrder(orderId);

  await Promise.all(
    splits.map((split) =>
      stripe.transfers.create(
        {
          amount: split.sellerNetCents,
          currency: paymentIntent.currency,
          destination: split.stripeAccountId,
          transfer_group: paymentIntent.transfer_group ?? orderId,
          metadata: {
            orderId,
            sellerId: split.sellerId
          }
        },
        {
          idempotencyKey: `transfer-${paymentIntent.id}-${split.sellerId}`
        }
      )
    )
  );
};

const resolveStripeDisputeFeeCents = async (stripe: Stripe, dispute: Stripe.Dispute) => {
  const balanceTransactions =
    Array.isArray(dispute.balance_transactions) && dispute.balance_transactions.length > 0
      ? dispute.balance_transactions
      : (
          await stripe.disputes.retrieve(dispute.id, {
            expand: ["balance_transactions"]
          })
        ).balance_transactions;

  return (balanceTransactions ?? []).reduce((sum, row) => {
    const fee = Number(row?.fee ?? 0);
    return sum + Math.max(0, fee);
  }, 0);
};

export async function POST(request: Request) {
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET nao configurado." },
      { status: 500 }
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Assinatura do webhook ausente." },
      { status: 400 }
    );
  }

  const body = await request.text();
  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Assinatura invalida.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    if (event.type === "payment_intent.created") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderId = await resolveOrderIdFromPaymentIntent(paymentIntent);
      await markOrderAsIntermediateState(
        orderId,
        paymentIntent,
        "requires_payment_method",
        "payment_intent.created",
        event.id
      );
    }

    if (event.type === "payment_intent.processing") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderId = await resolveOrderIdFromPaymentIntent(paymentIntent);
      await markOrderAsIntermediateState(
        orderId,
        paymentIntent,
        "processing",
        "payment_intent.processing",
        event.id
      );
    }

    if (event.type === "payment_intent.requires_action") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderId = await resolveOrderIdFromPaymentIntent(paymentIntent);
      await markOrderAsIntermediateState(
        orderId,
        paymentIntent,
        "requires_action",
        "payment_intent.requires_action",
        event.id
      );
    }

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderId = await resolveOrderIdFromPaymentIntent(paymentIntent);
      await persistStripeTransaction({ stripe, event, paymentIntent, orderId });
      await markOrderAsPaid(orderId, paymentIntent, event.id);
      await createTransfers(stripe, paymentIntent, orderId);
    }

    if (event.type === "payment_intent.payment_failed") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderId = await resolveOrderIdFromPaymentIntent(paymentIntent);
      await persistStripeTransaction({ stripe, event, paymentIntent, orderId });
      await markOrderAsFailed(
        orderId,
        paymentIntent,
        "payment_intent.payment_failed",
        event.id
      );
    }

    if (event.type === "payment_intent.canceled") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderId = await resolveOrderIdFromPaymentIntent(paymentIntent);
      await persistStripeTransaction({ stripe, event, paymentIntent, orderId });
      await markOrderAsFailed(
        orderId,
        paymentIntent,
        "payment_intent.canceled",
        event.id
      );
    }

    if (event.type === "charge.refunded") {
      const refundCharge = event.data.object as Stripe.Charge;
      const paymentIntent = await resolvePaymentIntentFromCharge(stripe, refundCharge);
      if (paymentIntent) {
        const orderId = await resolveOrderIdFromPaymentIntent(paymentIntent);
        await markOrderAsRefunded({
          orderId,
          paymentIntent,
          providerEventId: event.id,
          amountCents: Number(refundCharge.amount_refunded ?? refundCharge.amount ?? 0)
        });
      }
    }

    if (event.type === "charge.dispute.created") {
      const dispute = event.data.object as Stripe.Dispute;
      const paymentIntent = await resolvePaymentIntentFromCharge(stripe, dispute);
      if (paymentIntent) {
        const chargebackFeeCents = await resolveStripeDisputeFeeCents(stripe, dispute);
        const orderId = await resolveOrderIdFromPaymentIntent(paymentIntent);
        await markOrderAsChargeback({
          orderId,
          paymentIntent,
          providerEventId: event.id,
          amountCents: Number(dispute.amount ?? 0)
        });
        if (orderId) {
          await postChargebackEconomicEntries({
            orderId,
            provider: "stripe",
            providerReference: paymentIntent.id,
            providerEventId: event.id,
            currency: (paymentIntent.currency ?? "brl").toUpperCase(),
            chargebackFeeCents
          });
        }
      }
    }

    if (event.type === "transfer.created") {
      console.info("[Stripe webhook] Transfer criado:", event.data.object.id);
    }
  } catch (error) {
    console.error("[Stripe webhook] Falha ao processar evento:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Falha ao processar evento Stripe."
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
