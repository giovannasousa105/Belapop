import { randomUUID } from "node:crypto";

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
import { resolveStoreIdForSeller } from "@/lib/tracking/shipmentLookup";
import { syncSubOrderStatusFromTracking } from "@/lib/tracking/syncSubOrders";

export const runtime = "nodejs";

type AddTrackingRequestBody = {
  carrier?: string;
  tracking_code?: string;
  posted_at?: string;
};

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
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
    return NextResponse.json({ error: "Escopo do seller nao encontrado." }, { status: 403 });
  }

  const { id: orderId } = await context.params;
  const body = (await request.json()) as AddTrackingRequestBody;
  const carrier = String(body.carrier ?? "").trim();
  const trackingCode = String(body.tracking_code ?? "").trim();
  if (!carrier || !trackingCode) {
    return NextResponse.json(
      { error: "carrier e tracking_code sao obrigatorios." },
      { status: 400 }
    );
  }

  const admin = getSupabaseAdminClient();
  const [{ data: subOrder, error: subOrderError }, storeId] = await Promise.all([
    admin
      .from("sub_orders")
      .select("id,order_id,seller_id,shipping_total_cents,shipping_service")
      .eq("order_id", orderId)
      .eq("seller_id", scope.sellerId)
      .maybeSingle(),
    resolveStoreIdForSeller(admin, scope.sellerId)
  ]);

  if (subOrderError) {
    return NextResponse.json({ error: subOrderError.message }, { status: 500 });
  }
  if (!subOrder) {
    return NextResponse.json(
      { error: "Subpedido do seller nao encontrado para este pedido." },
      { status: 404 }
    );
  }

  const { data: shipment, error: shipmentError } = await admin
    .from("shipments")
    .select("*")
    .eq("order_id", orderId)
    .eq("seller_id", scope.sellerId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (shipmentError) {
    return NextResponse.json({ error: shipmentError.message }, { status: 500 });
  }

  const patch = {
    order_id: orderId,
    seller_id: scope.sellerId,
    store_id: storeId,
    shipping_cents: Number(subOrder.shipping_total_cents ?? 0),
    carrier,
    service_level: String(subOrder.shipping_service ?? "").trim() || null,
    tracking_code: trackingCode,
    status: "in_transit",
    created_at: shipment?.created_at ?? body.posted_at ?? new Date().toISOString(),
    updated_at: body.posted_at ?? new Date().toISOString()
  };

  const updateResult = shipment
    ? await admin.from("shipments").update(patch).eq("id", shipment.id).select("*").single()
    : await admin
        .from("shipments")
        .insert({
          ...patch,
          id: randomUUID()
        })
        .select("*")
        .single();

  if (updateResult.error) {
    return NextResponse.json({ error: updateResult.error.message }, { status: 500 });
  }

  await admin
    .from("orders")
    .update({
      shipping_status: "in_transit"
    })
    .eq("id", orderId);

  await syncSubOrderStatusFromTracking(admin, {
    orderId,
    sellerId: (updateResult.data?.seller_id as string | null) ?? scope.sellerId,
    shipmentStatus: "shipped",
    trackingStatus: "POSTED",
    hasTrackingCode: true
  });

  await admin.from("order_events").insert({
    order_id: orderId,
    event_type: "shipment.tracking.added",
    payload: {
      carrier,
      tracking_code: trackingCode
    },
    created_at: new Date().toISOString()
  }).then(({ error }) => {
    if (error) {
      const message = String(error.message ?? "").toLowerCase();
      const optional = message.includes("relation") && message.includes("order_events");
      if (!optional) {
        console.error("[orders/add-tracking] order event failed", error);
      }
    }
  });

  const actors = await resolveOrderActors(orderId);
  const eventId = await emitPlatformEvent({
    eventName: "shipment.tracking.added",
    aggregateType: "order",
    aggregateId: orderId,
    orderId,
    customerUserId: actors.customerUserId,
    sellerId: (updateResult.data?.seller_id as string | null) ?? scope.sellerId,
    actorUserId: user.id,
    payload: {
      carrier,
      tracking_code: trackingCode,
      shipment_id: updateResult.data?.id ?? null
    },
    idempotencyKey: buildDeterministicKey([
      "shipment.tracking.added",
      orderId,
      trackingCode
    ])
  });

  if (actors.customerUserId) {
    await queueNotificationChannels({
      eventId,
      recipientUserId: actors.customerUserId,
      recipientSellerId: (updateResult.data?.seller_id as string | null) ?? scope.sellerId,
      channels: ["in_app", "email", "whatsapp"],
      templateKey: "order.tracking.added",
      title: "Seu pedido foi enviado",
      body: `A loja postou seu pedido via ${carrier}. Codigo de rastreio: ${trackingCode}.`,
      ctaLabel: "Acompanhar pedido",
      ctaHref: `/conta/pedidos/${orderId}`,
      metadata: {
        order_id: orderId,
        tracking_code: trackingCode,
        carrier
      }
    });
  }

  await logSellerAuditEvent({
    actorUserId: user.id,
    role: scope.rbac.role,
    action: "dispatch_order",
    sellerId: updateResult.data?.seller_id ?? scope.sellerId,
    beforeState: shipment,
    afterState: updateResult.data,
    requestIp: request.headers.get("x-forwarded-for"),
    userAgent: request.headers.get("user-agent")
  });

  return NextResponse.json({ shipment: updateResult.data });
}
