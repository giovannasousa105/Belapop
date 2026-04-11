import { createHash, randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { updateCheckoutSessionProviderState } from "@/lib/checkout/paymentSessions";
import { postChargebackEconomicEntries } from "@/lib/finance/chargebacks";
import {
  markWebhookError,
  markWebhookProcessed,
  registerWebhookEvent
} from "@/lib/webhooks/idempotency";
import { recordPaymentState } from "@/lib/payments/stateMachine";
import { verifyWebhookSignature } from "@/lib/webhooks/signature";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type PaymentApprovedPayload = {
  event: string;
  event_id: string;
  event_time?: string;
  occurred_at?: string;
  data?: {
    order_id?: string;
    store_id?: string;
    amount?: number;
    currency?: string;
    payment_method?: string;
    provider?: string;
    provider_reference?: string;
    event_time?: string;
    device_id?: string;
    device_fingerprint?: string;
    fingerprint?: string;
    session_id?: string;
    ip_address?: string;
    ip?: string;
    user_agent?: string;
  };
};

const CANCEL_PAYMENT_EVENTS = new Set([
  "payment.canceled",
  "payment.cancelled",
  "payment.voided"
]);

const REFUND_PAYMENT_EVENTS = new Set([
  "payment.refunded",
  "refund.settled",
  "refund.succeeded",
  "payment.refund_settled"
]);

const CHARGEBACK_PAYMENT_EVENTS = new Set([
  "chargeback.opened",
  "dispute.opened",
  "payment.chargeback_opened"
]);

const toCents = (amount: number | undefined) => {
  if (!Number.isFinite(amount)) return 0;
  return Math.round((amount as number) * 100);
};

const toIsoTimestamp = (value: string | undefined) => {
  if (!value) return new Date().toISOString();
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return new Date().toISOString();
  return new Date(parsed).toISOString();
};

const buildIdempotencyKey = (parts: Array<string | null | undefined>) =>
  createHash("sha256")
    .update(
      parts
        .map((part) => String(part ?? "").trim())
        .filter((part) => part.length > 0)
        .join(":")
    )
    .digest("hex");

const buildRiskMetadata = (payload: PaymentApprovedPayload) => ({
  payment_method: payload.data?.payment_method ?? null,
  device_id: payload.data?.device_id ?? null,
  device_fingerprint:
    payload.data?.device_fingerprint ?? payload.data?.fingerprint ?? null,
  session_id: payload.data?.session_id ?? null,
  ip_address: payload.data?.ip_address ?? payload.data?.ip ?? null,
  user_agent: payload.data?.user_agent ?? null
});

const resolveStoreIdFromOrder = async (
  orderId: string,
  fallbackStoreId: string | null
) => {
  if (fallbackStoreId) return fallbackStoreId;
  const admin = getSupabaseAdminClient();
  const orderLookup = await admin
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();
  if (orderLookup.error) {
    throw new Error(`orders store lookup failed: ${orderLookup.error.message}`);
  }

  const fromOrder =
    ((orderLookup.data as Record<string, unknown> | null)?.store_id as string | undefined) ??
    ((orderLookup.data as Record<string, unknown> | null)?.seller_id as string | undefined) ??
    null;
  if (fromOrder) return fromOrder;

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

const syncSubOrdersPaymentState = async (
  orderId: string,
  patch: {
    status?: string;
    payment_status?: string;
  }
) => {
  const admin = getSupabaseAdminClient();
  const result = await admin
    .from("sub_orders")
    .update(patch)
    .eq("order_id", orderId);

  if (result.error) {
    throw new Error(`sub_orders update failed: ${result.error.message}`);
  }
};

const processPaymentApproved = async (payload: PaymentApprovedPayload) => {
  const orderId = payload.data?.order_id;
  if (!orderId) return;

  const admin = getSupabaseAdminClient();
  const provider = payload.data?.provider ?? "payment_webhook";
  const providerRef = payload.data?.provider_reference ?? payload.event_id;
  const amountCents = toCents(payload.data?.amount);
  const currency = payload.data?.currency ?? "BRL";
  const storeId = await resolveStoreIdFromOrder(
    orderId,
    payload.data?.store_id ?? null
  );
  const occurredAt = toIsoTimestamp(
    payload.event_time ?? payload.data?.event_time ?? payload.occurred_at
  );
  const idempotencyKey = buildIdempotencyKey([
    provider,
    providerRef,
    "order_paid",
    orderId,
    payload.event_id
  ]);

  const { data: existingPayment, error: paymentLookupError } = await admin
    .from("payments")
    .select("id,status")
    .eq("order_id", orderId)
    .maybeSingle();

  if (paymentLookupError) {
    throw new Error(`payments lookup failed: ${paymentLookupError.message}`);
  }

  await recordPaymentState({
    orderId,
    state: "succeeded",
    paymentIntentId: providerRef,
    amountCents,
    currency,
    provider,
    event: payload.event,
    providerEventId: payload.event_id,
    metadata: {
      occurred_at: occurredAt,
      ...buildRiskMetadata(payload)
    }
  });
  await updateCheckoutSessionProviderState({
    paymentIntentId: providerRef,
    providerStatus: "succeeded",
    status: "succeeded"
  });

  if (existingPayment?.id && existingPayment.status !== "paid") {
    const updatePayment = await admin
      .from("payments")
      .update({
        status: "paid",
        provider,
        provider_ref: providerRef,
        amount_cents: amountCents > 0 ? amountCents : undefined,
        currency
      })
      .eq("id", existingPayment.id);
    if (updatePayment.error) {
      throw new Error(`payments update failed: ${updatePayment.error.message}`);
    }
  } else if (!existingPayment?.id) {
    const insertPayment = await admin.from("payments").insert({
      id: randomUUID(),
      order_id: orderId,
      status: "paid",
      amount_cents: amountCents,
      currency,
      provider,
      provider_ref: providerRef
    });
    if (insertPayment.error) {
      throw new Error(`payments insert failed: ${insertPayment.error.message}`);
    }
  }

  const updateOrder = await admin
    .from("orders")
    .update({
      status: "paid",
      payment_status: "paid",
      payment_provider: provider,
      payment_intent_id: providerRef
    })
    .eq("id", orderId);

  if (updateOrder.error) {
    throw new Error(`orders update failed: ${updateOrder.error.message}`);
  }

  await syncSubOrdersPaymentState(orderId, {
    status: "awaiting_shipment",
    payment_status: "paid"
  });

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
    idempotency_key: idempotencyKey,
    source: "webhook",
    provider,
    ingestion_status: "processed",
    metadata: {
      provider,
      ...buildRiskMetadata(payload)
    }
  });

  if (eventInsert.error && eventInsert.error.code !== "23505") {
    throw new Error(`marketplace_events insert failed: ${eventInsert.error.message}`);
  }
};

const processPaymentCanceled = async (payload: PaymentApprovedPayload) => {
  const orderId = payload.data?.order_id;
  if (!orderId) return;

  const admin = getSupabaseAdminClient();
  const provider = payload.data?.provider ?? "payment_webhook";
  const providerRef = payload.data?.provider_reference ?? payload.event_id;
  const amountCents = toCents(payload.data?.amount);
  const currency = payload.data?.currency ?? "BRL";
  const storeId = payload.data?.store_id ?? null;
  const occurredAt = toIsoTimestamp(
    payload.event_time ?? payload.data?.event_time ?? payload.occurred_at
  );
  const idempotencyKey = buildIdempotencyKey([
    provider,
    providerRef,
    "order_canceled",
    orderId
  ]);

  const { data: existingPayment, error: paymentLookupError } = await admin
    .from("payments")
    .select("id,status")
    .eq("order_id", orderId)
    .maybeSingle();

  if (paymentLookupError) {
    throw new Error(`payments lookup failed: ${paymentLookupError.message}`);
  }

  await recordPaymentState({
    orderId,
    state: "canceled",
    paymentIntentId: providerRef,
    amountCents,
    currency,
    provider,
    event: payload.event,
    providerEventId: payload.event_id,
    metadata: {
      occurred_at: occurredAt,
      event: payload.event,
      ...buildRiskMetadata(payload)
    }
  });
  await updateCheckoutSessionProviderState({
    paymentIntentId: providerRef,
    providerStatus: "canceled",
    status: "canceled"
  });

  if (existingPayment?.id) {
    const updatePayment = await admin
      .from("payments")
      .update({
        status: "failed",
        provider,
        provider_ref: providerRef,
        amount_cents: amountCents > 0 ? amountCents : undefined,
        currency
      })
      .eq("id", existingPayment.id);
    if (updatePayment.error) {
      throw new Error(`payments update failed: ${updatePayment.error.message}`);
    }
  } else {
    const insertPayment = await admin.from("payments").insert({
      id: randomUUID(),
      order_id: orderId,
      status: "failed",
      amount_cents: amountCents,
      currency,
      provider,
      provider_ref: providerRef
    });
    if (insertPayment.error) {
      throw new Error(`payments insert failed: ${insertPayment.error.message}`);
    }
  }

  const updateOrder = await admin
    .from("orders")
    .update({
      status: "cancelled",
      payment_status: "failed",
      payment_provider: provider,
      payment_intent_id: providerRef
    })
    .eq("id", orderId);

  if (updateOrder.error) {
    throw new Error(`orders update failed: ${updateOrder.error.message}`);
  }

  await syncSubOrdersPaymentState(orderId, {
    status: "cancelled",
    payment_status: "failed"
  });

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
    idempotency_key: idempotencyKey,
    source: "webhook",
    provider,
    ingestion_status: "processed",
    metadata: {
      provider,
      event: payload.event,
      ...buildRiskMetadata(payload)
    }
  });

  if (eventInsert.error && eventInsert.error.code !== "23505") {
    throw new Error(`marketplace_events insert failed: ${eventInsert.error.message}`);
  }
};

const processRefundSettled = async (payload: PaymentApprovedPayload) => {
  const orderId = payload.data?.order_id;
  if (!orderId) return;

  const admin = getSupabaseAdminClient();
  const provider = payload.data?.provider ?? "payment_webhook";
  const providerRef = payload.data?.provider_reference ?? payload.event_id;
  const amountCents = toCents(payload.data?.amount);
  const currency = payload.data?.currency ?? "BRL";
  const storeId = await resolveStoreIdFromOrder(orderId, payload.data?.store_id ?? null);
  const occurredAt = toIsoTimestamp(
    payload.event_time ?? payload.data?.event_time ?? payload.occurred_at
  );
  const idempotencyKey = buildIdempotencyKey([
    provider,
    providerRef,
    "refund_settled",
    orderId
  ]);

  const { data: existingPayment, error: paymentLookupError } = await admin
    .from("payments")
    .select("id,status")
    .eq("order_id", orderId)
    .maybeSingle();

  if (paymentLookupError) {
    throw new Error(`payments lookup failed: ${paymentLookupError.message}`);
  }

  await recordPaymentState({
    orderId,
    state: "refunded",
    paymentIntentId: providerRef,
    amountCents,
    currency,
    provider,
    event: payload.event,
    providerEventId: payload.event_id,
    metadata: {
      occurred_at: occurredAt,
      event: payload.event,
      ...buildRiskMetadata(payload)
    }
  });
  await updateCheckoutSessionProviderState({
    paymentIntentId: providerRef,
    providerStatus: "refunded",
    status: "refunded"
  });

  if (existingPayment?.id) {
    const updatePayment = await admin
      .from("payments")
      .update({
        status: "refunded",
        provider,
        provider_ref: providerRef,
        amount_cents: amountCents > 0 ? amountCents : undefined,
        currency
      })
      .eq("id", existingPayment.id);
    if (updatePayment.error) {
      throw new Error(`payments update failed: ${updatePayment.error.message}`);
    }
  } else {
    const insertPayment = await admin.from("payments").insert({
      id: randomUUID(),
      order_id: orderId,
      status: "refunded",
      amount_cents: amountCents,
      currency,
      provider,
      provider_ref: providerRef
    });
    if (insertPayment.error) {
      throw new Error(`payments insert failed: ${insertPayment.error.message}`);
    }
  }

  const updateOrder = await admin
    .from("orders")
    .update({
      payment_status: "refunded",
      payment_provider: provider,
      payment_intent_id: providerRef
    })
    .eq("id", orderId);
  if (updateOrder.error) {
    throw new Error(`orders update failed: ${updateOrder.error.message}`);
  }

  const eventInsert = await admin.from("marketplace_events").insert({
    event_type: "finance",
    event_name: "refund_settled",
    occurred_at: occurredAt,
    channel: "marketplace",
    store_id: storeId,
    order_id: orderId,
    amount_cents: amountCents > 0 ? amountCents : null,
    currency,
    external_ref: providerRef,
    idempotency_key: idempotencyKey,
    source: "webhook",
    provider,
    ingestion_status: "processed",
    metadata: {
      provider,
      event: payload.event,
      ...buildRiskMetadata(payload)
    }
  });
  if (eventInsert.error && eventInsert.error.code !== "23505") {
    throw new Error(`marketplace_events insert failed: ${eventInsert.error.message}`);
  }
};

const processChargebackOpened = async (payload: PaymentApprovedPayload) => {
  const orderId = payload.data?.order_id;
  if (!orderId) return;

  const admin = getSupabaseAdminClient();
  const provider = payload.data?.provider ?? "payment_webhook";
  const providerRef = payload.data?.provider_reference ?? payload.event_id;
  const amountCents = toCents(payload.data?.amount);
  const currency = payload.data?.currency ?? "BRL";
  const storeId = await resolveStoreIdFromOrder(orderId, payload.data?.store_id ?? null);
  const occurredAt = toIsoTimestamp(
    payload.event_time ?? payload.data?.event_time ?? payload.occurred_at
  );
  const idempotencyKey = buildIdempotencyKey([
    provider,
    providerRef,
    "chargeback_opened",
    orderId
  ]);

  const { data: existingPayment, error: paymentLookupError } = await admin
    .from("payments")
    .select("id,status")
    .eq("order_id", orderId)
    .maybeSingle();

  if (paymentLookupError) {
    throw new Error(`payments lookup failed: ${paymentLookupError.message}`);
  }

  await recordPaymentState({
    orderId,
    state: "chargeback",
    paymentIntentId: providerRef,
    amountCents,
    currency,
    provider,
    event: payload.event,
    providerEventId: payload.event_id,
    metadata: {
      occurred_at: occurredAt,
      event: payload.event,
      ...buildRiskMetadata(payload)
    }
  });
  await updateCheckoutSessionProviderState({
    paymentIntentId: providerRef,
    providerStatus: "chargeback",
    status: "chargeback"
  });

  if (existingPayment?.id) {
    const updatePayment = await admin
      .from("payments")
      .update({
        status: "chargeback",
        provider,
        provider_ref: providerRef,
        amount_cents: amountCents > 0 ? amountCents : undefined,
        currency
      })
      .eq("id", existingPayment.id);
    if (updatePayment.error) {
      throw new Error(`payments update failed: ${updatePayment.error.message}`);
    }
  } else {
    const insertPayment = await admin.from("payments").insert({
      id: randomUUID(),
      order_id: orderId,
      status: "chargeback",
      amount_cents: amountCents,
      currency,
      provider,
      provider_ref: providerRef
    });
    if (insertPayment.error) {
      throw new Error(`payments insert failed: ${insertPayment.error.message}`);
    }
  }

  const updateOrder = await admin
    .from("orders")
    .update({
      payment_status: "chargeback",
      payment_provider: provider,
      payment_intent_id: providerRef
    })
    .eq("id", orderId);
  if (updateOrder.error) {
    throw new Error(`orders update failed: ${updateOrder.error.message}`);
  }

  const eventInsert = await admin.from("marketplace_events").insert({
    event_type: "risk",
    event_name: "chargeback_opened",
    occurred_at: occurredAt,
    channel: "marketplace",
    store_id: storeId,
    order_id: orderId,
    amount_cents: amountCents > 0 ? amountCents : null,
    currency,
    external_ref: providerRef,
    idempotency_key: idempotencyKey,
    source: "webhook",
    provider,
    ingestion_status: "processed",
    metadata: {
      provider,
      event: payload.event,
      ...buildRiskMetadata(payload)
    }
  });
  if (eventInsert.error && eventInsert.error.code !== "23505") {
    throw new Error(`marketplace_events insert failed: ${eventInsert.error.message}`);
  }

  await postChargebackEconomicEntries({
    orderId,
    provider,
    providerReference: providerRef,
    providerEventId: payload.event_id,
    currency,
    chargebackFeeCents: 0
  });
};

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature");
  const timestamp = request.headers.get("x-timestamp");

  const verification = verifyWebhookSignature({
    rawBody,
    signatureHeader: signature,
    timestampHeader: timestamp,
    secret: process.env.PAYMENT_WEBHOOK_SECRET
  });

  if (!verification.ok) {
    return NextResponse.json(
      { error: "invalid_signature", reason: verification.reason },
      { status: 401 }
    );
  }

  let payload: PaymentApprovedPayload;
  try {
    payload = JSON.parse(rawBody) as PaymentApprovedPayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const eventId = String(payload.event_id ?? "").trim();
  const eventType = String(payload.event ?? "").trim();
  if (!eventId || !eventType) {
    return NextResponse.json({ error: "missing_event_identity" }, { status: 400 });
  }

  const registered = await registerWebhookEvent({
    provider: "payment",
    eventId,
    eventType,
    payload
  });
  if (registered.error) {
    return NextResponse.json(
      { received: false, error: "event_register_failed", detail: registered.error },
      { status: 500 }
    );
  }
  if (registered.duplicate) {
    return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
  }

  try {
    if (eventType === "payment.approved") {
      await processPaymentApproved(payload);
      await markWebhookProcessed("payment", eventId, "processed");
    } else if (CANCEL_PAYMENT_EVENTS.has(eventType.toLowerCase())) {
      await processPaymentCanceled(payload);
      await markWebhookProcessed("payment", eventId, "processed");
    } else if (REFUND_PAYMENT_EVENTS.has(eventType.toLowerCase())) {
      await processRefundSettled(payload);
      await markWebhookProcessed("payment", eventId, "processed");
    } else if (CHARGEBACK_PAYMENT_EVENTS.has(eventType.toLowerCase())) {
      await processChargebackOpened(payload);
      await markWebhookProcessed("payment", eventId, "processed");
    } else {
      await markWebhookProcessed("payment", eventId, "ignored");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    await markWebhookError("payment", eventId, message);
    return NextResponse.json({ received: true, processed: false, error: message }, { status: 200 });
  }

  return NextResponse.json({ received: true, processed: true }, { status: 200 });
}
