import { createHash } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import {
  buildDeterministicKey,
  emitPlatformEvent,
  queueNotificationChannels,
  resolveOrderActors
} from "@/lib/events/platformEventBus";
import { logSellerAuditEvent } from "@/lib/rbac/auditLog";
import { resolveSellerScopeContext } from "@/lib/rbac/sellerAccessScope";
import { isRoleAllowed } from "@/lib/rbac/sellerPolicy";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { resolveSellerIdForShipment, resolveStoreIdForSeller } from "@/lib/tracking/shipmentLookup";
import { syncSubOrderStatusFromTracking } from "@/lib/tracking/syncSubOrders";

export const runtime = "nodejs";

type TrackingUpdateRequestBody = {
  status?: string;
  status_details?: string;
  location?: string;
  occurred_at?: string;
  raw?: Record<string, unknown>;
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

const mapShipmentStatus = (status: string | undefined) => {
  const normalized = String(status ?? "").toLowerCase();
  if (normalized.includes("deliver")) return "delivered";
  if (normalized.includes("transit")) return "in_transit";
  if (normalized.includes("label")) return "label_created";
  if (normalized.includes("cancel")) return "cancelled";
  if (normalized.includes("return")) return "returned";
  return "pending";
};

const customerNotificationCopy = (status: string, location?: string) => {
  const normalized = String(status).toLowerCase();
  if (normalized.includes("deliver")) {
    return {
      title: "Pedido entregue",
      body: "Seu pedido foi marcado como entregue. Se precisar, o suporte fica no painel."
    };
  }
  if (normalized.includes("out_for_delivery") || normalized.includes("saiu")) {
    return {
      title: "Saiu para entrega",
      body: "Seu pedido esta a caminho e deve chegar em breve."
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

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ shipment_id: string }> }
) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Autenticacao necessaria." }, { status: 401 });
  }

  const scope = await resolveSellerScopeContext(user.id);
  if (!scope || !isRoleAllowed(scope.rbac, ["OPERACAO"])) {
    return NextResponse.json({ error: "Acao restrita. Solicite ao Admin." }, { status: 403 });
  }

  const { shipment_id: shipmentId } = await context.params;
  const body = (await request.json()) as TrackingUpdateRequestBody;
  const statusInput = String(body.status ?? "").trim();
  if (!statusInput) {
    return NextResponse.json({ error: "status e obrigatorio." }, { status: 400 });
  }

  const occurredAt = body.occurred_at ? new Date(body.occurred_at) : new Date();
  if (Number.isNaN(occurredAt.getTime())) {
    return NextResponse.json({ error: "occurred_at invalido." }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  const { data: shipment, error: shipmentLookupError } = await admin
    .from("shipments")
    .select("*")
    .eq("id", shipmentId)
    .maybeSingle();

  if (shipmentLookupError) {
    return NextResponse.json({ error: shipmentLookupError.message }, { status: 500 });
  }
  if (!shipment) {
    return NextResponse.json({ error: "Shipment nao encontrado." }, { status: 404 });
  }
  const sellerId = await resolveSellerIdForShipment(admin, shipment);
  const scopedStoreId = await resolveStoreIdForSeller(admin, scope.sellerId);
  const shipmentStoreId = String(shipment.store_id ?? "").trim();
  const shipmentSellerId = String(sellerId ?? "").trim();
  if (
    shipmentSellerId !== scope.sellerId &&
    shipmentStoreId !== scopedStoreId &&
    shipmentStoreId !== scope.sellerId
  ) {
    return NextResponse.json({ error: "Shipment fora do escopo autenticado." }, { status: 404 });
  }

  const targetStatus = mapShipmentStatus(statusInput);
  if (shipment.status === "delivered" && targetStatus === "delivered") {
    return NextResponse.json({ shipment, ignored: true, reason: "already_delivered" }, { status: 200 });
  }

  const updatedAtMs = Date.parse(String(shipment.updated_at ?? ""));
  if (Number.isFinite(updatedAtMs) && occurredAt.getTime() <= updatedAtMs) {
    return NextResponse.json({ shipment, ignored: true, reason: "out_of_order_event" }, { status: 200 });
  }

  const patch = {
    status: targetStatus,
    updated_at: occurredAt.toISOString()
  };

  const updateShipment = await admin.from("shipments").update(patch).eq("id", shipmentId).select("*").single();
  if (updateShipment.error) {
    return NextResponse.json({ error: updateShipment.error.message }, { status: 500 });
  }

  const insertEvent = await admin.from("shipment_events").insert({
    shipment_id: shipmentId,
    status: statusInput,
    raw_payload: {
      status_details: body.status_details ?? null,
      location: body.location ?? null,
      raw: body.raw ?? {}
    },
    occurred_at: occurredAt.toISOString()
  });

  if (insertEvent.error) {
    const message = String(insertEvent.error.message ?? "").toLowerCase();
    const optional = message.includes("relation") && message.includes("shipment_events");
    if (!optional) {
      console.error("[shipments/update-tracking] event insert failed", insertEvent.error);
    }
  }

  await syncSubOrderStatusFromTracking(admin, {
    orderId: updateShipment.data.order_id,
    sellerId: (updateShipment.data.seller_id as string | null) ?? sellerId,
    trackingStatus: statusInput,
    shipmentStatus: targetStatus,
    hasTrackingCode: Boolean(updateShipment.data.tracking_code)
  });

  const orderPatch: Record<string, string> = {
    shipping_status: targetStatus
  };
  if (targetStatus === "delivered") {
    orderPatch.status = "delivered";
  } else if (targetStatus === "cancelled") {
    orderPatch.status = "canceled";
  }

  await admin.from("orders").update(orderPatch).eq("id", updateShipment.data.order_id);

  if (targetStatus === "cancelled") {
    const provider = "manual_tracking_update";
    const externalRef = `${shipmentId}:${occurredAt.toISOString()}`;
    const idempotencyKey = buildIdempotencyKey([
      provider,
      externalRef,
      "order_canceled",
      updateShipment.data.order_id
    ]);

    const cancelEventInsert = await admin.from("marketplace_events").insert({
      event_type: "order",
      event_name: "order_canceled",
      occurred_at: occurredAt.toISOString(),
      channel: "marketplace",
      store_id: updateShipment.data.store_id ?? null,
      order_id: updateShipment.data.order_id,
      amount_cents: null,
      currency: "BRL",
      external_ref: externalRef,
      idempotency_key: idempotencyKey,
      source: "api",
      provider,
      ingestion_status: "processed",
      metadata: {
        shipment_id: shipmentId,
        actor_user_id: user.id,
        shipment_status: statusInput,
        location: body.location ?? null
      }
    });

    if (cancelEventInsert.error && cancelEventInsert.error.code !== "23505") {
      console.error("[shipments/update-tracking] order_canceled event insert failed", cancelEventInsert.error);
    }
  }

  const actors = await resolveOrderActors(updateShipment.data.order_id);
  const eventId = await emitPlatformEvent({
    eventName: "shipment.tracking.updated",
    aggregateType: "order",
    aggregateId: updateShipment.data.order_id,
    orderId: updateShipment.data.order_id,
    customerUserId: actors.customerUserId,
    sellerId: (updateShipment.data.seller_id as string | null) ?? sellerId,
    actorUserId: user.id,
    payload: {
      shipment_id: shipmentId,
      status: statusInput,
      normalized_status: targetStatus,
      tracking_code: updateShipment.data.tracking_code ?? null,
      carrier: updateShipment.data.carrier ?? null,
      location: body.location ?? null
    },
    idempotencyKey: buildDeterministicKey([
      "shipment.tracking.updated",
      shipmentId,
      statusInput,
      occurredAt.toISOString()
    ])
  });

  if (actors.customerUserId) {
    const copy = customerNotificationCopy(statusInput, body.location ?? undefined);
    await queueNotificationChannels({
      eventId,
      recipientUserId: actors.customerUserId,
      recipientSellerId: (updateShipment.data.seller_id as string | null) ?? sellerId,
      channels: ["in_app", "email", "whatsapp"],
      templateKey: "order.tracking.updated",
      title: copy.title,
      body: copy.body,
      ctaLabel: "Acompanhar pedido",
      ctaHref: `/conta/pedidos/${updateShipment.data.order_id}`,
      metadata: {
        order_id: updateShipment.data.order_id,
        shipment_id: shipmentId,
        status: statusInput,
        location: body.location ?? null
      }
    });
  }

  await logSellerAuditEvent({
    actorUserId: user.id,
    role: scope.rbac.role,
    action: "shipment_tracking_update",
    sellerId: (updateShipment.data.seller_id as string | null) ?? sellerId,
    beforeState: shipment,
    afterState: updateShipment.data,
    requestIp: request.headers.get("x-forwarded-for"),
    userAgent: request.headers.get("user-agent")
  });

  return NextResponse.json({ shipment: updateShipment.data });
}
