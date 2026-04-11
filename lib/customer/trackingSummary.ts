import type { CustomerTrackingByOrderDto } from "@/lib/customer/dto";
import {
  type SubOrderRow,
  formatDateTimePtBr,
  resolveSubOrderUiStatus,
  statusLabel,
  statusMessage
} from "@/lib/customer/portal";

export type TrackingBySubOrder = CustomerTrackingByOrderDto["sub_orders"][number];

type BuildSubOrderTrackingSummaryInput = {
  subOrder: SubOrderRow;
  tracking?: TrackingBySubOrder | null;
  sellerName?: string | null;
  fallbackCreatedAt?: string | null;
};

const parseDate = (value: string | null | undefined) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const dateOnlyToDate = (value: string) => {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const addDays = (value: Date, days: number) => {
  const next = new Date(value);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

const normalizeTrackingStatus = (value: string | null | undefined) =>
  (value ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

const rankByStatus = (status: string | null | undefined) => {
  const normalized = normalizeTrackingStatus(status);
  if (normalized === "OUT_FOR_DELIVERY") return 0;
  if (normalized === "IN_TRANSIT") return 1;
  if (normalized === "POSTED" || normalized === "SHIPPED") return 2;
  if (normalized === "LABEL_CREATED") return 3;
  if (normalized === "DELIVERED") return 20;
  if (normalized === "CANCELLED" || normalized === "RETURNED") return 30;
  return 10;
};

const buildEstimatedDeliveryDate = (subOrder: SubOrderRow, fallbackCreatedAt?: string | null) => {
  const explicitDate = subOrder.shipping?.estimated_delivery_date
    ? dateOnlyToDate(subOrder.shipping.estimated_delivery_date)
    : null;
  if (explicitDate) return explicitDate;

  const baseDate = parseDate(subOrder.created_at ?? fallbackCreatedAt ?? null);
  if (!baseDate) return null;
  if (!subOrder.shipping_days || subOrder.shipping_days <= 0) return null;
  return addDays(baseDate, subOrder.shipping_days);
};

export const buildSubOrderTrackingSummary = ({
  subOrder,
  tracking,
  sellerName,
  fallbackCreatedAt
}: BuildSubOrderTrackingSummaryInput) => {
  const trackingStatus = tracking?.current_status ?? null;
  const lastEvent = tracking?.events?.[tracking.events.length - 1] ?? null;
  const effectiveCreatedAt = subOrder.created_at ?? fallbackCreatedAt ?? null;
  const lastUpdatedAt = tracking?.last_updated_at ?? lastEvent?.occurred_at ?? effectiveCreatedAt ?? null;
  const estimatedDelivery = buildEstimatedDeliveryDate(subOrder, fallbackCreatedAt);
  const resolvedSubOrderStatus = resolveSubOrderUiStatus(subOrder.status, {
    storeName: sellerName,
    shippingDays: subOrder.shipping_days,
    estimatedDeliveryDate: subOrder.shipping?.estimated_delivery_date ?? null,
    createdAt: effectiveCreatedAt,
    lastTrackingAt: lastUpdatedAt
  });
  const effectiveStatus = trackingStatus || resolvedSubOrderStatus.replace(/^SUB_/, "");
  const baseDetail = statusMessage(subOrder.status, "sub_order", {
    storeName: sellerName,
    shippingDays: subOrder.shipping_days,
    estimatedDeliveryDate: subOrder.shipping?.estimated_delivery_date ?? null,
    createdAt: effectiveCreatedAt,
    lastTrackingAt: lastUpdatedAt
  });

  let etaLabel = "Previsao em atualizacao";
  if (normalizeTrackingStatus(effectiveStatus) === "DELIVERED") {
    etaLabel = "Entregue";
  } else if (normalizeTrackingStatus(effectiveStatus) === "OUT_FOR_DELIVERY") {
    etaLabel = "Saiu para entrega hoje";
  } else if (estimatedDelivery) {
    etaLabel = `Previsao ate ${formatDateTimePtBr(estimatedDelivery.toISOString())}`;
  } else if (subOrder.shipping_days && subOrder.shipping_days > 0) {
    etaLabel = `${subOrder.shipping_days} dia(s) estimados`;
  }

  const detailLine = lastEvent
    ? `${lastEvent.label}${lastEvent.location ? ` - ${lastEvent.location}` : ""}`
    : baseDetail;

  const carrierLine = tracking?.carrier
    ? `${tracking.carrier}${tracking.tracking_code ? ` - ${tracking.tracking_code}` : ""}`
    : subOrder.shipping_service ?? "Envio em atualizacao";

  return {
    currentLabel: trackingStatus
      ? statusLabel(trackingStatus, "tracking")
      : statusLabel(subOrder.status, "sub_order", {
          storeName: sellerName,
          shippingDays: subOrder.shipping_days,
          estimatedDeliveryDate: subOrder.shipping?.estimated_delivery_date ?? null,
          createdAt: effectiveCreatedAt,
          lastTrackingAt: lastUpdatedAt
        }),
    detailLine,
    carrierLine,
    etaLabel,
    lastUpdatedLabel: lastUpdatedAt ? formatDateTimePtBr(lastUpdatedAt) : "Em atualizacao",
    statusRank: rankByStatus(effectiveStatus),
    etaSortValue: estimatedDelivery?.getTime() ?? Number.MAX_SAFE_INTEGER,
    hasLiveTracking: Boolean(tracking?.tracking_code || tracking?.events?.length)
  };
};
