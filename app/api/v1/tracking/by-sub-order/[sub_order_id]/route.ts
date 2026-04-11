import { NextRequest, NextResponse } from "next/server";

import { requireCustomerApiContext } from "@/lib/api/v1/customer-auth";
import { buildTrackingPayload, normalizeSubOrderStatus } from "@/lib/api/v1/customer-contract";
import { loadLatestShipmentsForSubOrders } from "@/lib/tracking/shipmentLookup";
import { deriveSubOrderStatusFromTracking } from "@/lib/tracking/subOrderLifecycle";

type ShipmentEventRow = {
  id: number;
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
  { params }: { params: Promise<{ sub_order_id: string }> }
) {
  const auth = await requireCustomerApiContext();
  if (!auth.ok) return auth.response;

  const { sub_order_id: subOrderId } = await params;
  const { admin, userId } = auth.ctx;

  const { data: subOrder, error } = await admin
    .from("sub_orders")
    .select("id,order_id,seller_id,status,shipping_service,shipping_days,created_at")
    .eq("id", subOrderId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!subOrder) return NextResponse.json({ error: "Subpedido nao encontrado." }, { status: 404 });

  const { data: order } = await admin
    .from("orders")
    .select("id,customer_id")
    .eq("id", subOrder.order_id)
    .maybeSingle();

  if (!order || order.customer_id !== userId) {
    return NextResponse.json({ error: "Subpedido nao encontrado." }, { status: 404 });
  }

  const { shipmentsBySubOrderId } = await loadLatestShipmentsForSubOrders(admin, [
    {
      id: subOrder.id,
      order_id: subOrder.order_id,
      seller_id: subOrder.seller_id
    }
  ]);
  const shipment = shipmentsBySubOrderId[subOrder.id];

  let events: Array<{ id: string; status: string; occurred_at: string; location: string | null }> = [];
  if (shipment?.id) {
    const { data: eventRows, error: eventError } = await admin
      .from("shipment_events")
      .select("id,status,occurred_at,raw_payload")
      .eq("shipment_id", shipment.id)
      .order("occurred_at", { ascending: true });

    if (!eventError) {
      events = ((eventRows ?? []) as ShipmentEventRow[]).map((event) => ({
        id: String(event.id),
        status: normalizeTrackingStatus(event.status),
        occurred_at: event.occurred_at,
        location: toLocation(event.raw_payload)
      }));
    }
  }

  const latestTrackingStatus = events.length ? events[events.length - 1]?.status : null;
  const effectiveSubOrderStatus = deriveSubOrderStatusFromTracking(
    subOrder.status,
    latestTrackingStatus ?? null
  );

  const payload = buildTrackingPayload({
    subOrderId: subOrder.id,
    subOrderStatus: normalizeSubOrderStatus(effectiveSubOrderStatus),
    createdAt: subOrder.created_at,
    carrier: shipment?.carrier ?? null,
    trackingCode: shipment?.tracking_code ?? null,
    events
  });

  return NextResponse.json(payload);
}
