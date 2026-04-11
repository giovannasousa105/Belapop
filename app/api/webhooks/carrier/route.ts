import { createHash } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import {
  buildDeterministicKey,
  emitPlatformEvent,
  queueNotificationChannels,
  resolveOrderActors
} from "@/lib/events/platformEventBus";
import {
  markWebhookError,
  markWebhookProcessed,
  registerWebhookEvent
} from "@/lib/webhooks/idempotency";
import { verifyWebhookSignature } from "@/lib/webhooks/signature";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { resolveSellerIdForShipment } from "@/lib/tracking/shipmentLookup";
import { syncSubOrderStatusFromTracking } from "@/lib/tracking/syncSubOrders";

export const runtime = "nodejs";

type CarrierWebhookPayload = {
  event: string;
  event_id: string;
  occurred_at?: string;
  data?: {
    shipment_id?: string;
    order_id?: string;
    carrier?: string;
    tracking_code?: string;
    status?: string;
    status_details?: string;
    location?: string;
    occurred_at?: string;
    raw?: Record<string, unknown>;
  };
};

const mapShipmentStatus = (status: string | undefined) => {
  const normalized = String(status ?? "").toLowerCase();
  if (normalized.includes("deliver")) return "delivered";
  if (normalized.includes("transit")) return "in_transit";
  if (normalized.includes("label")) return "label_created";
  if (normalized.includes("cancel")) return "cancelled";
  if (normalized.includes("return")) return "returned";
  return "pending";
};

const parseOccurredAt = (value: string | undefined) => {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed) : null;
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

const customerNotificationCopy = (status: string, location?: string | null) => {
  const normalized = String(status).toLowerCase();
  if (normalized.includes("deliver")) {
    return {
      title: "Pedido entregue",
      body: "Seu pedido foi marcado como entregue."
    };
  }
  if (normalized.includes("out_for_delivery")) {
    return {
      title: "Saiu para entrega",
      body: "Seu pedido saiu para entrega."
    };
  }
  if (normalized.includes("transit")) {
    return {
      title: "Pedido em transito",
      body: location
        ? `Seu pedido esta em transito. Ultima localizacao: ${location}.`
        : "Seu pedido esta em transito."
    };
  }
  if (normalized.includes("cancel")) {
    return {
      title: "Envio cancelado",
      body: "O envio foi cancelado. Consulte os detalhes no pedido."
    };
  }
  return {
    title: "Atualizacao de rastreio",
    body: "Houve uma atualizacao no rastreio do seu pedido."
  };
};

const processCarrierUpdate = async (payload: CarrierWebhookPayload) => {
  const data = payload.data;
  const shipmentId = String(data?.shipment_id ?? "").trim();
  const orderId = String(data?.order_id ?? "").trim();
  if (!shipmentId || !orderId) return;

  const admin = getSupabaseAdminClient();
  const normalizedStatus = mapShipmentStatus(data?.status);
  const occurredAt = parseOccurredAt(data?.occurred_at ?? payload.occurred_at);

  const { data: shipment, error: shipmentLookupError } = await admin
    .from("shipments")
    .select("id,status,updated_at,order_id,seller_id,store_id,carrier,tracking_code")
    .eq("id", shipmentId)
    .maybeSingle();

  if (shipmentLookupError) {
    throw new Error(`shipments lookup failed: ${shipmentLookupError.message}`);
  }

  const isDeliveredAlready = shipment?.status === "delivered" && normalizedStatus === "delivered";
  if (isDeliveredAlready) return;
  const sellerId = shipment ? await resolveSellerIdForShipment(admin, shipment) : null;

  if (shipment?.updated_at && occurredAt) {
    const lastUpdated = Date.parse(String(shipment.updated_at));
    if (Number.isFinite(lastUpdated) && occurredAt.getTime() <= lastUpdated) {
      return;
    }
  }

  const updateShipment = await admin
    .from("shipments")
    .update({
      carrier: data?.carrier ?? shipment?.carrier ?? null,
      tracking_code: data?.tracking_code ?? shipment?.tracking_code ?? null,
      status: normalizedStatus,
      updated_at: occurredAt?.toISOString() ?? new Date().toISOString()
    })
    .eq("id", shipmentId);

  if (updateShipment.error) {
    throw new Error(`shipments update failed: ${updateShipment.error.message}`);
  }

  const insertEvent = await admin.from("shipment_events").insert({
    shipment_id: shipmentId,
    status: data?.status ?? normalizedStatus,
    raw_payload: {
      status_details: data?.status_details ?? null,
      location: data?.location ?? null,
      raw: data?.raw ?? {}
    },
    occurred_at: occurredAt?.toISOString() ?? new Date().toISOString()
  });

  if (insertEvent.error) {
    const message = insertEvent.error.message.toLowerCase();
    const optionalTable = message.includes("relation") && message.includes("shipment_events");
    if (!optionalTable) {
      throw new Error(`shipment_events insert failed: ${insertEvent.error.message}`);
    }
  }

  const orderPatch: Record<string, string> = {
    shipping_status: normalizedStatus
  };
  if (normalizedStatus === "delivered") {
    orderPatch.status = "delivered";
  } else if (normalizedStatus === "cancelled") {
    orderPatch.status = "canceled";
  }

  const updateOrder = await admin.from("orders").update(orderPatch).eq("id", orderId);
  if (updateOrder.error) {
    throw new Error(`orders shipping update failed: ${updateOrder.error.message}`);
  }

  await syncSubOrderStatusFromTracking(admin, {
    orderId,
    sellerId: (shipment?.seller_id as string | null) ?? sellerId,
    trackingStatus: data?.status ?? normalizedStatus,
    shipmentStatus: normalizedStatus,
    hasTrackingCode: Boolean(data?.tracking_code ?? shipment?.tracking_code)
  });

  if (normalizedStatus === "cancelled") {
    const provider = "carrier_webhook";
    const externalRef =
      String(data?.tracking_code ?? "").trim() ||
      String(payload.event_id ?? "").trim() ||
      shipmentId;
    const idempotencyKey = buildIdempotencyKey([
      provider,
      externalRef,
      "order_canceled",
      orderId
    ]);

    const cancelEventInsert = await admin.from("marketplace_events").insert({
      event_type: "order",
      event_name: "order_canceled",
      occurred_at: occurredAt?.toISOString() ?? new Date().toISOString(),
      channel: "marketplace",
      store_id: shipment?.store_id ?? null,
      order_id: orderId,
      amount_cents: null,
      currency: "BRL",
      external_ref: externalRef,
      idempotency_key: idempotencyKey,
      source: "webhook",
      provider,
      ingestion_status: "processed",
      metadata: {
        shipment_id: shipmentId,
        tracking_code: data?.tracking_code ?? null,
        carrier: data?.carrier ?? null,
        shipment_status: data?.status ?? normalizedStatus
      }
    });

    if (cancelEventInsert.error && cancelEventInsert.error.code !== "23505") {
      throw new Error(`marketplace_events insert failed: ${cancelEventInsert.error.message}`);
    }
  }

  const actors = await resolveOrderActors(orderId);
  const platformEventId = await emitPlatformEvent({
    eventName: "shipment.tracking.updated",
    aggregateType: "order",
    aggregateId: orderId,
    orderId,
    customerUserId: actors.customerUserId,
    sellerId: (shipment?.seller_id as string | null) ?? sellerId,
    payload: {
      shipment_id: shipmentId,
      status: data?.status ?? normalizedStatus,
      normalized_status: normalizedStatus,
      tracking_code: data?.tracking_code ?? shipment?.tracking_code ?? null,
      carrier: data?.carrier ?? shipment?.carrier ?? null,
      location: data?.location ?? null,
      provider: "carrier_webhook",
      event_id: payload.event_id
    },
    idempotencyKey: buildDeterministicKey([
      "carrier.tracking.updated",
      payload.event_id,
      shipmentId
    ])
  });

  if (actors.customerUserId) {
    const copy = customerNotificationCopy(data?.status ?? normalizedStatus, data?.location ?? null);
    await queueNotificationChannels({
      eventId: platformEventId,
      recipientUserId: actors.customerUserId,
      recipientSellerId: (shipment?.seller_id as string | null) ?? sellerId,
      channels: ["in_app", "email", "whatsapp"],
      templateKey: "order.tracking.updated",
      title: copy.title,
      body: copy.body,
      ctaLabel: "Acompanhar pedido",
      ctaHref: `/conta/pedidos/${orderId}`,
      metadata: {
        order_id: orderId,
        shipment_id: shipmentId,
        tracking_code: data?.tracking_code ?? shipment?.tracking_code ?? null,
        status: data?.status ?? normalizedStatus
      }
    });
  }
};

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature");
  const timestamp = request.headers.get("x-timestamp");

  const verification = verifyWebhookSignature({
    rawBody,
    signatureHeader: signature,
    timestampHeader: timestamp,
    secret: process.env.CARRIER_WEBHOOK_SECRET
  });

  if (!verification.ok) {
    return NextResponse.json(
      { error: "invalid_signature", reason: verification.reason },
      { status: 401 }
    );
  }

  let payload: CarrierWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as CarrierWebhookPayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const eventId = String(payload.event_id ?? "").trim();
  const eventType = String(payload.event ?? "").trim();
  if (!eventId || !eventType) {
    return NextResponse.json({ error: "missing_event_identity" }, { status: 400 });
  }

  const registered = await registerWebhookEvent({
    provider: "carrier",
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
    if (eventType === "shipment.tracking.updated") {
      await processCarrierUpdate(payload);
      await markWebhookProcessed("carrier", eventId, "processed");
    } else {
      await markWebhookProcessed("carrier", eventId, "ignored");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    await markWebhookError("carrier", eventId, message);
    return NextResponse.json({ received: true, processed: false, error: message }, { status: 200 });
  }

  return NextResponse.json({ received: true, processed: true }, { status: 200 });
}
