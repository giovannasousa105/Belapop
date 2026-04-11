import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { normalizeSubOrderStatus, type SubOrderStatus } from "@/lib/api/v1/customer-contract";
import {
  mapShipmentStatusToSubOrderStatus,
  mapTrackingStatusToSubOrderStatus,
  promoteSubOrderStatus
} from "@/lib/tracking/subOrderLifecycle";

const toDbStatus = (status: SubOrderStatus) => {
  const map: Record<SubOrderStatus, string> = {
    PROCESSING: "processing",
    READY_TO_SHIP: "ready_to_ship",
    SHIPPED: "shipped",
    IN_TRANSIT: "in_transit",
    OUT_FOR_DELIVERY: "out_for_delivery",
    DELIVERED: "delivered",
    CANCELLED: "cancelled",
    RETURN_REQUESTED: "return_requested",
    RETURN_IN_TRANSIT: "return_in_transit",
    RETURN_RECEIVED: "return_received",
    REFUNDED: "refunded",
    EXCHANGED: "exchanged"
  };
  return map[status];
};

const getCandidateStatus = (args: {
  trackingStatus?: string | null;
  shipmentStatus?: string | null;
  hasTrackingCode?: boolean;
}) => {
  const fromTracking = mapTrackingStatusToSubOrderStatus(args.trackingStatus);
  if (fromTracking) return fromTracking;
  return mapShipmentStatusToSubOrderStatus(
    String(args.shipmentStatus ?? args.trackingStatus ?? ""),
    Boolean(args.hasTrackingCode)
  );
};

export const syncSubOrderStatusFromTracking = async (
  admin: SupabaseClient,
  args: {
    orderId: string;
    sellerId: string | null | undefined;
    trackingStatus?: string | null;
    shipmentStatus?: string | null;
    hasTrackingCode?: boolean;
  }
) => {
  if (!args.orderId || !args.sellerId) return { updated: 0 };

  const candidate = getCandidateStatus(args);
  const lookup = await admin
    .from("sub_orders")
    .select("id,status")
    .eq("order_id", args.orderId)
    .eq("seller_id", args.sellerId)
    .limit(100);

  if (lookup.error) {
    throw new Error(lookup.error.message);
  }

  const subOrders = (lookup.data ?? []) as Array<{ id: string; status: string | null }>;
  let updated = 0;
  for (const subOrder of subOrders) {
    const current = normalizeSubOrderStatus(subOrder.status);
    const next = promoteSubOrderStatus(current, candidate);
    if (next === current) continue;

    const patch = await admin
      .from("sub_orders")
      .update({ status: toDbStatus(next) })
      .eq("id", subOrder.id);

    if (patch.error) {
      throw new Error(patch.error.message);
    }
    updated += 1;
  }

  return { updated };
};
