import { NextRequest, NextResponse } from "next/server";

import { requireCustomerApiContext } from "@/lib/api/v1/customer-auth";
import {
  buildOrderPayload,
  buildTrackingPayload,
  buildCustomerBlock,
  normalizeSubOrderStatus
} from "@/lib/api/v1/customer-contract";
import { loadSubOrdersWithSellers } from "@/lib/api/v1/orders";
import { loadLatestShipmentsForSubOrders } from "@/lib/tracking/shipmentLookup";
import { deriveSubOrderStatusFromTracking } from "@/lib/tracking/subOrderLifecycle";

type ShipmentEventRow = {
  id: number;
  shipment_id: string;
  status: string;
  occurred_at: string;
  raw_payload: Record<string, unknown> | null;
};

const normalizeTrackingStatus = (status: string | null | undefined) =>
  (status ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

const toLocation = (payload: Record<string, unknown> | null) => {
  const record = payload ?? {};
  const location =
    record.location ??
    record.city ??
    record.local ??
    record.place ??
    record.origin ??
    record.destination;
  return typeof location === "string" && location.trim() ? location.trim() : null;
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ order_id: string }> }
) {
  const auth = await requireCustomerApiContext();
  if (!auth.ok) return auth.response;

  const { order_id: orderId } = await params;
  const { admin, userId } = auth.ctx;

  const [{ data: order, error }, { data: profile }] = await Promise.all([
    admin
      .from("orders")
      .select(
        "id,customer_id,total_order_cents,total_products_cents,total_shipping_cents,status,payment_status,payment_provider,payment_intent_id,address,created_at"
      )
      .eq("id", orderId)
      .eq("customer_id", userId)
      .maybeSingle(),
    admin.from("profiles").select("id,email,full_name").eq("id", userId).maybeSingle()
  ]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!order) return NextResponse.json({ error: "Pedido nao encontrado." }, { status: 404 });

  const { subOrders, sellers } = await loadSubOrdersWithSellers(admin, [orderId]);
  const customer = buildCustomerBlock({
    user: auth.ctx.user,
    profile: profile ? (profile as Record<string, unknown>) : null
  });

  const { bridge, shipmentsBySubOrderId } = await loadLatestShipmentsForSubOrders(admin, subOrders);
  const shipments = Object.values(shipmentsBySubOrderId).filter(
    (shipment): shipment is NonNullable<typeof shipment> => Boolean(shipment)
  );

  const shipmentIds = shipments.map((shipment) => shipment.id);
  const { data: eventRows, error: eventError } = shipmentIds.length
    ? await admin
        .from("shipment_events")
        .select("id,shipment_id,status,occurred_at,raw_payload")
        .in("shipment_id", shipmentIds)
        .order("occurred_at", { ascending: true })
    : { data: [], error: null };

  const eventsByShipment = (eventError ? [] : ((eventRows ?? []) as ShipmentEventRow[])).reduce<
    Record<string, Array<{ id: string; status: string; occurred_at: string; location: string | null }>>
  >((acc, event) => {
    if (!acc[event.shipment_id]) acc[event.shipment_id] = [];
    acc[event.shipment_id].push({
      id: String(event.id),
      status: normalizeTrackingStatus(event.status),
      occurred_at: event.occurred_at,
      location: toLocation(event.raw_payload)
    });
    return acc;
  }, {});

  const latestTrackingStatusBySeller = subOrders.reduce<Record<string, string | null>>((acc, subOrder) => {
    const shipment = shipmentsBySubOrderId[subOrder.id];
    if (!shipment) {
      acc[subOrder.id] = null;
      return acc;
    }
    const events = eventsByShipment[shipment.id] ?? [];
    acc[subOrder.id] = events.length ? events[events.length - 1]?.status ?? null : null;
    return acc;
  }, {});

  const effectiveSubOrders = subOrders.map((subOrder) => ({
    ...subOrder,
    status: deriveSubOrderStatusFromTracking(subOrder.status, latestTrackingStatusBySeller[subOrder.id])
  }));

  const orderPayload = buildOrderPayload({
    order,
    subOrders: effectiveSubOrders,
    sellerNames: sellers,
    customer
  });

  return NextResponse.json({
    order_id: orderPayload.order_id,
    order_number: orderPayload.order_number,
    status: orderPayload.status,
    created_at: orderPayload.created_at,
    sub_orders: effectiveSubOrders.map((subOrder) => {
      const sellerName = bridge.sellerNames[subOrder.seller_id] ?? sellers[subOrder.seller_id] ?? "Lojista";
      return {
        ...buildTrackingPayload({
          subOrderId: subOrder.id,
          subOrderStatus: normalizeSubOrderStatus(subOrder.status),
          createdAt: subOrder.created_at,
          carrier: shipmentsBySubOrderId[subOrder.id]?.carrier ?? null,
          trackingCode: shipmentsBySubOrderId[subOrder.id]?.tracking_code ?? null,
          events: eventsByShipment[shipmentsBySubOrderId[subOrder.id]?.id ?? ""] ?? []
        }),
        seller_id: subOrder.seller_id,
        seller_name: sellerName,
        store_id: subOrder.seller_id,
        store_name: sellerName
      };
    }),
    tracking_summary: {
      total_sub_orders: effectiveSubOrders.length,
      delivered_sub_orders: effectiveSubOrders.filter(
        (subOrder) => normalizeSubOrderStatus(subOrder.status) === "DELIVERED"
      ).length
    }
  });
}
