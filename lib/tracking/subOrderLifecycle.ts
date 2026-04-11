import type { SubOrderStatus } from "@/lib/api/v1/customer-contract";
import { normalizeSubOrderStatus } from "@/lib/api/v1/customer-contract";

const SHIPPED_LIKE = new Set<SubOrderStatus>([
  "SHIPPED",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "RETURN_REQUESTED",
  "RETURN_IN_TRANSIT",
  "RETURN_RECEIVED",
  "REFUNDED",
  "EXCHANGED"
]);

const PRIORITY: Record<SubOrderStatus, number> = {
  PROCESSING: 10,
  READY_TO_SHIP: 20,
  SHIPPED: 30,
  IN_TRANSIT: 40,
  OUT_FOR_DELIVERY: 50,
  DELIVERED: 60,
  RETURN_REQUESTED: 70,
  RETURN_IN_TRANSIT: 80,
  RETURN_RECEIVED: 90,
  REFUNDED: 100,
  EXCHANGED: 100,
  CANCELLED: 5
};

const normalize = (value: string | null | undefined) =>
  (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();

export const mapShipmentStatusToSubOrderStatus = (
  shipmentStatus: string,
  hasTrackingCode: boolean
): SubOrderStatus => {
  const value = normalize(shipmentStatus);
  if (value.includes("deliver")) return "DELIVERED";
  if (value.includes("out_for_delivery") || value.includes("saiu para entrega")) {
    return hasTrackingCode ? "OUT_FOR_DELIVERY" : "SHIPPED";
  }
  if (value.includes("in_transit") || value.includes("transito")) {
    return hasTrackingCode ? "IN_TRANSIT" : "SHIPPED";
  }
  if (value.includes("shipped") || value.includes("posted") || value.includes("postado")) {
    return "SHIPPED";
  }
  if (value.includes("label")) return "READY_TO_SHIP";
  if (value.includes("cancel")) return "CANCELLED";
  return "PROCESSING";
};

export const mapTrackingStatusToSubOrderStatus = (
  trackingStatus: string | null | undefined
): SubOrderStatus | null => {
  const value = (trackingStatus ?? "").trim().toUpperCase();
  if (!value) return null;
  if (value === "LABEL_CREATED") return "READY_TO_SHIP";
  if (value === "POSTED") return "SHIPPED";
  if (value === "IN_TRANSIT") return "IN_TRANSIT";
  if (value === "OUT_FOR_DELIVERY") return "OUT_FOR_DELIVERY";
  if (value === "DELIVERED") return "DELIVERED";
  if (value === "CANCELLED") return "CANCELLED";
  if (value === "RETURNED") return "RETURN_REQUESTED";
  return null;
};

export const promoteSubOrderStatus = (
  currentRaw: string | null | undefined,
  candidate: SubOrderStatus
) => {
  const current = normalizeSubOrderStatus(currentRaw);
  if (candidate === current) return current;

  // Never regress immutable flow.
  if (PRIORITY[candidate] < PRIORITY[current]) return current;

  // "Shipped-like" flow cannot be cancelled by tracking regressions.
  if (candidate === "CANCELLED" && SHIPPED_LIKE.has(current)) return current;

  return candidate;
};

export const deriveSubOrderStatusFromTracking = (
  currentRaw: string | null | undefined,
  trackingCurrentStatus: string | null | undefined
) => {
  const mapped = mapTrackingStatusToSubOrderStatus(trackingCurrentStatus);
  if (!mapped) return normalizeSubOrderStatus(currentRaw);
  return promoteSubOrderStatus(currentRaw, mapped);
};

