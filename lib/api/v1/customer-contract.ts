import type { User } from "@supabase/supabase-js";

import type { OrderRow, SubOrderRow } from "@/lib/api/v1/orders";

type UnknownRecord = Record<string, unknown>;

export type OrderStatus =
  | "CREATED"
  | "PAYMENT_PENDING"
  | "PAID"
  | "CANCELLED"
  | "PARTIALLY_PROCESSING"
  | "PROCESSING"
  | "PARTIALLY_SHIPPED"
  | "SHIPPED"
  | "PARTIALLY_DELIVERED"
  | "DELIVERED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";

export type SubOrderStatus =
  | "PROCESSING"
  | "READY_TO_SHIP"
  | "SHIPPED"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURN_REQUESTED"
  | "RETURN_IN_TRANSIT"
  | "RETURN_RECEIVED"
  | "REFUNDED"
  | "EXCHANGED";

export type TicketStatus =
  | "OPEN"
  | "WAITING_STORE"
  | "WAITING_CUSTOMER"
  | "IN_REVIEW"
  | "RESOLUTION_PROPOSED"
  | "RESOLVED"
  | "CLOSED"
  | "CANCELLED"
  | "ESCALATED";

export type TicketReason =
  | "NOT_RECEIVED"
  | "DAMAGED_ITEM"
  | "WRONG_ITEM"
  | "QUALITY_ISSUE"
  | "SERVICE_ISSUE"
  | "OTHER";

export type TicketDesiredResolution =
  | "REFUND"
  | "EXCHANGE"
  | "RESHIP"
  | "INFO";

export type TicketAttachment = {
  attachment_id: string;
  type: "IMAGE" | "VIDEO" | "FILE";
  filename: string;
  url: string;
  uploaded_at: string;
};

export type TicketMessage = {
  message_id: string;
  sender_type: "CUSTOMER" | "STORE" | "SUPPORT";
  text: string;
  attachment_ids: string[];
  sent_at: string;
};

type TransitionMap<T extends string> = Record<T, T[]>;

type TicketBootstrap = {
  order_id: string | null;
  sub_order_id: string | null;
  seller_id: string | null;
  store_id: string | null;
  item_ids: string[];
  items: Array<{
    item_id: string;
    product_name: string;
    variant: string | null;
    quantity: number;
  }>;
  reason: TicketReason;
  desired_resolution: TicketDesiredResolution;
  description: string;
  attachments: TicketAttachment[];
};

const asRecord = (value: unknown): UnknownRecord =>
  typeof value === "object" && value !== null ? (value as UnknownRecord) : {};

const normalize = (value: string | null | undefined) =>
  (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();

const hasAny = (value: string, tokens: string[]) => tokens.some((token) => value.includes(token));

const digitsOnly = (value: string) => value.replace(/\D/g, "");

const safeString = (record: UnknownRecord, keys: string[]): string | null => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
};

const safeNumber = (record: UnknownRecord, keys: string[]): number | null => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
};

const moneyFromCents = (value: number | null | undefined) =>
  Number(((value ?? 0) / 100).toFixed(2));

const normalizeCurrency = (value: string | null | undefined) => {
  if (!value) return "BRL";
  const sanitized = value.trim().toUpperCase();
  return sanitized || "BRL";
};

const toIsoString = (value: string | null | undefined, fallback: Date) => {
  if (value) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  return fallback.toISOString();
};

const toDateOnly = (value: Date) => value.toISOString().slice(0, 10);

const withTime = (date: Date, hours: number, minutes: number, seconds: number) => {
  const copy = new Date(date);
  copy.setHours(hours, minutes, seconds, 0);
  return copy;
};

const pushDays = (date: Date, amount: number) => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
};

const normalizeCpf = (value: string | null | undefined) => {
  if (!value) return null;
  const digits = digitsOnly(value);
  if (digits.length !== 11) return value;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

const normalizePhone = (value: string | null | undefined) => {
  if (!value) return null;
  const digits = digitsOnly(value);
  if (!digits) return null;
  if (digits.startsWith("55")) return `+${digits}`;
  return `+55${digits}`;
};

const parseItems = (value: unknown): UnknownRecord[] =>
  Array.isArray(value) ? value.map((item) => asRecord(item)) : [];

const toItemCount = (items: UnknownRecord[]) => {
  if (!items.length) return 0;
  return items.reduce((total, item) => {
    const quantity = safeNumber(item, ["quantity", "qty"]);
    return total + Math.max(1, Number(quantity ?? 1));
  }, 0);
};

const toItemUnitPrice = (item: UnknownRecord) => {
  const unitCents = safeNumber(item, ["unit_price_cents", "unitPriceCents", "price_cents", "priceCents"]);
  if (unitCents !== null) return moneyFromCents(unitCents);
  const unit = safeNumber(item, ["unit_price", "unitPrice", "price"]);
  return Number((unit ?? 0).toFixed(2));
};

const toOrderNumber = (orderId: string, createdAt: string) => {
  const year = new Date(createdAt).getFullYear();
  const suffix = orderId.replace(/-/g, "").slice(0, 6).toUpperCase();
  return `BP-${year}-${suffix}`;
};

export const normalizeSubOrderStatus = (rawStatus: string | null | undefined): SubOrderStatus => {
  const value = normalize(rawStatus);
  if (hasAny(value, ["ready_to_ship", "ready to ship", "pronto para envio"])) return "READY_TO_SHIP";
  if (hasAny(value, ["out_for_delivery", "saiu para entrega"])) return "OUT_FOR_DELIVERY";
  if (hasAny(value, ["in_transit", "em transito", "em rota"])) return "IN_TRANSIT";
  if (hasAny(value, ["shipped", "postado", "enviado"])) return "SHIPPED";
  if (hasAny(value, ["delivered", "entregue"])) return "DELIVERED";
  if (hasAny(value, ["return_requested", "devolucao solicitada"])) return "RETURN_REQUESTED";
  if (hasAny(value, ["return_in_transit", "devolucao em transito"])) return "RETURN_IN_TRANSIT";
  if (hasAny(value, ["return_received", "devolucao recebida"])) return "RETURN_RECEIVED";
  if (hasAny(value, ["refunded", "reembolsado"])) return "REFUNDED";
  if (hasAny(value, ["exchanged", "troca concluida"])) return "EXCHANGED";
  if (hasAny(value, ["cancelled", "cancelado"])) return "CANCELLED";
  return "PROCESSING";
};

const normalizePaymentStatus = (rawStatus: string | null | undefined) => {
  const value = normalize(rawStatus);
  if (hasAny(value, ["paid", "captured", "aprovado", "pago"])) return "PAID";
  if (hasAny(value, ["refunded", "reembolsado"])) return "REFUNDED";
  if (hasAny(value, ["cancel", "cancelado"])) return "CANCELLED";
  return "PAYMENT_PENDING";
};

export const deriveOrderStatus = ({
  orderStatus,
  paymentStatus,
  subStatuses
}: {
  orderStatus: string | null | undefined;
  paymentStatus: string | null | undefined;
  subStatuses: SubOrderStatus[];
}): OrderStatus => {
  const rawOrder = normalize(orderStatus);
  if (hasAny(rawOrder, ["cancel"])) return "CANCELLED";
  if (hasAny(rawOrder, ["partially_refunded", "partial_refund"])) return "PARTIALLY_REFUNDED";
  if (hasAny(rawOrder, ["refunded", "reembolsado"])) return "REFUNDED";

  const payment = normalizePaymentStatus(paymentStatus);
  if (payment === "PAYMENT_PENDING") return "PAYMENT_PENDING";
  if (payment === "CANCELLED") return "CANCELLED";
  if (!subStatuses.length) return payment === "PAID" ? "PAID" : "CREATED";

  const counts = subStatuses.reduce<Record<SubOrderStatus, number>>((acc, status) => {
    acc[status] = (acc[status] ?? 0) + 1;
    return acc;
  }, {} as Record<SubOrderStatus, number>);

  const total = subStatuses.length;
  const delivered = counts.DELIVERED ?? 0;
  const refunded = counts.REFUNDED ?? 0;
  const cancelled = counts.CANCELLED ?? 0;
  const shippedLike =
    (counts.SHIPPED ?? 0) + (counts.IN_TRANSIT ?? 0) + (counts.OUT_FOR_DELIVERY ?? 0);
  const processingLike = (counts.PROCESSING ?? 0) + (counts.READY_TO_SHIP ?? 0);

  if (refunded === total) return "REFUNDED";
  if (refunded > 0) return "PARTIALLY_REFUNDED";
  if (cancelled === total) return "CANCELLED";
  if (delivered === total) return "DELIVERED";
  if (delivered > 0) return "PARTIALLY_DELIVERED";
  if (shippedLike === total) return "SHIPPED";
  if (shippedLike > 0) return "PARTIALLY_SHIPPED";
  if (processingLike === total) return "PROCESSING";
  if (processingLike > 0) return "PARTIALLY_PROCESSING";
  return payment === "PAID" ? "PAID" : "CREATED";
};

export const normalizeTicketStatus = (rawStatus: string | null | undefined): TicketStatus => {
  const value = normalize(rawStatus);
  if (hasAny(value, ["waiting_store", "aguardando lojista"])) return "WAITING_STORE";
  if (hasAny(value, ["waiting_customer", "aguardando cliente"])) return "WAITING_CUSTOMER";
  if (hasAny(value, ["in_review", "in analysis", "em analise"])) return "IN_REVIEW";
  if (hasAny(value, ["resolution_proposed", "proposta"])) return "RESOLUTION_PROPOSED";
  if (hasAny(value, ["resolved", "resolvido"])) return "RESOLVED";
  if (hasAny(value, ["closed", "encerrado"])) return "CLOSED";
  if (hasAny(value, ["cancelled", "cancelado"])) return "CANCELLED";
  if (hasAny(value, ["escalated", "escalado"])) return "ESCALATED";
  return "OPEN";
};

export const normalizeTicketReason = (rawReason: string | null | undefined): TicketReason => {
  const value = normalize(rawReason);
  if (hasAny(value, ["nao_chegou", "not_received", "nao chegou"])) return "NOT_RECEIVED";
  if (hasAny(value, ["avaria", "damaged", "quebrado"])) return "DAMAGED_ITEM";
  if (hasAny(value, ["produto_errado", "wrong_item"])) return "WRONG_ITEM";
  if (hasAny(value, ["qualidade", "quality"])) return "QUALITY_ISSUE";
  if (hasAny(value, ["atendimento", "service"])) return "SERVICE_ISSUE";
  return "OTHER";
};

export const normalizeDesiredResolution = (
  rawResolution: string | null | undefined
): TicketDesiredResolution => {
  const value = normalize(rawResolution);
  if (hasAny(value, ["reembolso", "refund"])) return "REFUND";
  if (hasAny(value, ["troca", "exchange"])) return "EXCHANGE";
  if (hasAny(value, ["reenvio", "reship"])) return "RESHIP";
  return "INFO";
};

const ORDER_TRANSITIONS: TransitionMap<OrderStatus> = {
  CREATED: ["CREATED", "PAYMENT_PENDING", "PAID", "CANCELLED"],
  PAYMENT_PENDING: ["PAYMENT_PENDING", "CREATED", "PAID", "CANCELLED"],
  PAID: ["PAID", "PROCESSING", "PARTIALLY_PROCESSING", "CANCELLED"],
  PARTIALLY_PROCESSING: ["PARTIALLY_PROCESSING", "PROCESSING", "PARTIALLY_SHIPPED"],
  PROCESSING: ["PROCESSING", "PARTIALLY_SHIPPED", "SHIPPED", "CANCELLED"],
  PARTIALLY_SHIPPED: ["PARTIALLY_SHIPPED", "SHIPPED", "PARTIALLY_DELIVERED"],
  SHIPPED: ["SHIPPED", "PARTIALLY_DELIVERED", "DELIVERED"],
  PARTIALLY_DELIVERED: ["PARTIALLY_DELIVERED", "DELIVERED"],
  DELIVERED: ["DELIVERED", "PARTIALLY_REFUNDED", "REFUNDED"],
  PARTIALLY_REFUNDED: ["PARTIALLY_REFUNDED", "REFUNDED"],
  REFUNDED: ["REFUNDED"],
  CANCELLED: ["CANCELLED"]
};

const SUB_ORDER_TRANSITIONS: TransitionMap<SubOrderStatus> = {
  PROCESSING: ["PROCESSING", "READY_TO_SHIP", "CANCELLED"],
  READY_TO_SHIP: ["READY_TO_SHIP", "SHIPPED", "CANCELLED"],
  SHIPPED: ["SHIPPED", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"],
  IN_TRANSIT: ["IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"],
  OUT_FOR_DELIVERY: ["OUT_FOR_DELIVERY", "DELIVERED"],
  DELIVERED: ["DELIVERED", "RETURN_REQUESTED"],
  CANCELLED: ["CANCELLED"],
  RETURN_REQUESTED: ["RETURN_REQUESTED", "RETURN_IN_TRANSIT", "REFUNDED", "EXCHANGED"],
  RETURN_IN_TRANSIT: ["RETURN_IN_TRANSIT", "RETURN_RECEIVED"],
  RETURN_RECEIVED: ["RETURN_RECEIVED", "REFUNDED", "EXCHANGED"],
  REFUNDED: ["REFUNDED"],
  EXCHANGED: ["EXCHANGED"]
};

const TICKET_TRANSITIONS: TransitionMap<TicketStatus> = {
  OPEN: ["OPEN", "WAITING_STORE", "CANCELLED", "ESCALATED"],
  WAITING_STORE: ["WAITING_STORE", "WAITING_CUSTOMER", "IN_REVIEW", "RESOLUTION_PROPOSED", "ESCALATED"],
  WAITING_CUSTOMER: ["WAITING_CUSTOMER", "WAITING_STORE", "IN_REVIEW", "ESCALATED"],
  IN_REVIEW: ["IN_REVIEW", "RESOLUTION_PROPOSED", "ESCALATED"],
  RESOLUTION_PROPOSED: ["RESOLUTION_PROPOSED", "IN_REVIEW", "RESOLVED", "ESCALATED"],
  RESOLVED: ["RESOLVED", "CLOSED"],
  CLOSED: ["CLOSED"],
  CANCELLED: ["CANCELLED"],
  ESCALATED: ["ESCALATED", "IN_REVIEW", "RESOLUTION_PROPOSED", "RESOLVED", "CLOSED"]
};

export const canTransitionOrderStatus = ({
  current,
  next,
  hasAnySubOrderShipped
}: {
  current: OrderStatus;
  next: OrderStatus;
  hasAnySubOrderShipped: boolean;
}) => {
  if (!ORDER_TRANSITIONS[current].includes(next)) return false;
  if (next === "CANCELLED" && hasAnySubOrderShipped) return false;
  const lockedStatuses: OrderStatus[] = ["SHIPPED", "PARTIALLY_SHIPPED", "PARTIALLY_DELIVERED", "DELIVERED"];
  if (lockedStatuses.includes(current) && (next === "PROCESSING" || next === "PARTIALLY_PROCESSING")) {
    return false;
  }
  return true;
};

export const canTransitionSubOrderStatus = ({
  current,
  next,
  hasAnyShipmentEvent,
  returnEligible,
  deliveredAt
}: {
  current: SubOrderStatus;
  next: SubOrderStatus;
  hasAnyShipmentEvent: boolean;
  returnEligible: boolean;
  deliveredAt: string | null;
}) => {
  if (!SUB_ORDER_TRANSITIONS[current].includes(next)) return false;
  if (next === "CANCELLED" && hasAnyShipmentEvent) return false;
  if (next === "RETURN_REQUESTED" && (!returnEligible || !deliveredAt)) return false;
  return true;
};

export const canTransitionTicketStatus = ({
  current,
  next,
  hasStoreAction
}: {
  current: TicketStatus;
  next: TicketStatus;
  hasStoreAction: boolean;
}) => {
  if (!TICKET_TRANSITIONS[current].includes(next)) return false;
  if (current === "OPEN" && next === "CANCELLED" && hasStoreAction) return false;
  if (current === "OPEN" && next === "RESOLVED") return false;
  return true;
};

export const CUSTOMER_STATE_MACHINE_SPECS = {
  order: {
    initial: "CREATED",
    transitions: ORDER_TRANSITIONS
  },
  sub_order: {
    initial: "PROCESSING",
    transitions: SUB_ORDER_TRANSITIONS
  },
  ticket: {
    initial: "OPEN",
    transitions: TICKET_TRANSITIONS
  }
} as const;

export const buildCustomerBlock = ({
  user,
  profile
}: {
  user: User;
  profile: UnknownRecord | null;
}) => {
  const metadata = asRecord(user.user_metadata ?? {});
  const fullName =
    safeString(profile ?? {}, ["full_name"]) ??
    safeString(metadata, ["full_name", "name"]) ??
    "Cliente BelaPop";
  const email = safeString(profile ?? {}, ["email"]) ?? user.email ?? null;

  return {
    customer_id: user.id,
    name: fullName,
    cpf: normalizeCpf(safeString(metadata, ["cpf"])),
    email,
    phone_e164: normalizePhone(safeString(metadata, ["phone", "phone_number"]))
  };
};

export const buildOrderPayload = ({
  order,
  subOrders,
  sellerNames,
  customer
}: {
  order: OrderRow;
  subOrders: SubOrderRow[];
  sellerNames: Record<string, string>;
  customer: ReturnType<typeof buildCustomerBlock>;
}) => {
  const subStatuses = subOrders.map((subOrder) => normalizeSubOrderStatus(subOrder.status));
  const status = deriveOrderStatus({
    orderStatus: order.status,
    paymentStatus: order.payment_status,
    subStatuses
  });
  const now = new Date();
  const createdAt = toIsoString(order.created_at, now);
  const address = asRecord(order.address ?? {});

  return {
    order_id: order.id,
    order_number: toOrderNumber(order.id, createdAt),
    created_at: createdAt,
    currency: "BRL",
    customer,
    payment: {
      status: normalizePaymentStatus(order.payment_status),
      method: normalizePaymentStatus(order.payment_status) === "PAID" ? "PIX" : "UNKNOWN",
      paid_at: normalizePaymentStatus(order.payment_status) === "PAID" ? createdAt : null,
      provider: (order.payment_provider ?? "UNKNOWN").toUpperCase(),
      provider_reference: null
    },
    delivery_address: {
      recipient_name: safeString(address, ["recipient_name", "full_name", "name"]) ?? customer.name,
      street: safeString(address, ["street", "logradouro", "line1"]) ?? "",
      number: safeString(address, ["number"]) ?? "",
      complement: safeString(address, ["complement", "line2"]) ?? "",
      district: safeString(address, ["district", "bairro"]) ?? "",
      city: safeString(address, ["city"]) ?? "",
      state: safeString(address, ["state", "uf"]) ?? "",
      postal_code: safeString(address, ["postal_code", "zip", "cep"]) ?? "",
      country: safeString(address, ["country"]) ?? "BR"
    },
    totals: {
      items_subtotal: moneyFromCents(order.total_products_cents),
      shipping_total: moneyFromCents(order.total_shipping_cents),
      discount_total: Number(
        Math.max(
          0,
          moneyFromCents(order.total_products_cents + order.total_shipping_cents - order.total_order_cents)
        ).toFixed(2)
      ),
      grand_total: moneyFromCents(order.total_order_cents)
    },
    status,
    sub_orders: subOrders.map((subOrder) => {
      const items = parseItems(subOrder.items);
      const sellerName = sellerNames[subOrder.seller_id] ?? "Lojista";
      return {
        sub_order_id: subOrder.id,
        seller_id: subOrder.seller_id,
        seller_name: sellerName,
        store_id: subOrder.seller_id,
        store_name: sellerName,
        status: normalizeSubOrderStatus(subOrder.status),
        shipping_cost: moneyFromCents(subOrder.shipping_total_cents),
        shipping_eta_days: subOrder.shipping_days ?? null,
        items_count: toItemCount(items)
      };
    }),
    legacy: {
      id: order.id,
      status: order.status,
      payment_status: order.payment_status
    }
  };
};

export const buildSubOrderPayload = ({
  subOrder,
  order,
  storeName,
  productNames,
  carrier,
  trackingCode,
  postedAt,
  estimatedDeliveryDate
}: {
  subOrder: SubOrderRow;
  order: Pick<OrderRow, "id" | "created_at">;
  storeName: string;
  productNames: Record<string, string>;
  carrier: string | null;
  trackingCode: string | null;
  postedAt: string | null;
  estimatedDeliveryDate: string | null;
}) => {
  const items = parseItems(subOrder.items);
  const createdAt = toIsoString(subOrder.created_at, new Date());
  const itemRows = items.map((item, index) => {
    const productId = safeString(item, ["product_id", "productId", "id"]) ?? null;
    return {
      item_id: safeString(item, ["item_id", "id"]) ?? `${subOrder.id}-${index + 1}`,
      product_id: productId ?? `item-${index + 1}`,
      product_name:
        safeString(item, ["product_name", "name", "title"]) ??
        (productId ? productNames[productId] ?? "Produto" : "Produto"),
      variant: safeString(item, ["variant", "variation", "color", "size"]),
      quantity: Math.max(1, Number(safeNumber(item, ["quantity", "qty"]) ?? 1)),
      unit_price: toItemUnitPrice(item),
      image_url: safeString(item, ["image_url", "image", "thumbnail"])
    };
  });

  const itemsSubtotal = moneyFromCents(subOrder.product_total_cents);
  const shippingCost = moneyFromCents(subOrder.shipping_total_cents);
  const total = Number((itemsSubtotal + shippingCost).toFixed(2));
  const status = normalizeSubOrderStatus(subOrder.status);
  const supportChannel = {
    type: "IN_APP_CHAT",
    hours: "09:00-18:00"
  };

  return {
    sub_order_id: subOrder.id,
    order_id: subOrder.order_id,
    order_number: toOrderNumber(order.id, toIsoString(order.created_at, new Date())),
    seller: {
      seller_id: subOrder.seller_id,
      seller_name: storeName,
      support_channel: supportChannel,
      store_id: subOrder.seller_id,
      store_name: storeName
    },
    store: {
      store_id: subOrder.seller_id,
      store_name: storeName,
      support_channel: supportChannel
    },
    status,
    items: itemRows,
    shipping: {
      shipping_cost: shippingCost,
      service_level: subOrder.shipping_service ?? "STANDARD",
      carrier: carrier ?? "Em definicao",
      posted_at: postedAt ?? createdAt,
      tracking_code: trackingCode,
      estimated_delivery_date:
        estimatedDeliveryDate ??
        (subOrder.shipping_days !== null && subOrder.shipping_days !== undefined
          ? toDateOnly(pushDays(new Date(createdAt), subOrder.shipping_days))
          : null)
    },
    pricing: {
      items_subtotal: itemsSubtotal,
      shipping_cost: shippingCost,
      discount_total: 0,
      total
    },
    eligibility: {
      can_open_ticket: status !== "CANCELLED",
      can_request_return: status === "DELIVERED" || status === "SHIPPED" || status === "IN_TRANSIT",
      return_deadline_date: toDateOnly(pushDays(new Date(createdAt), 10))
    }
  };
};

const trackingStatusFromSubOrderStatus = (status: SubOrderStatus) => {
  if (status === "OUT_FOR_DELIVERY") return "OUT_FOR_DELIVERY";
  if (status === "IN_TRANSIT") return "IN_TRANSIT";
  if (status === "SHIPPED") return "POSTED";
  if (status === "DELIVERED") return "DELIVERED";
  if (status === "CANCELLED") return "CANCELLED";
  if (status === "RETURN_REQUESTED" || status === "RETURN_IN_TRANSIT" || status === "RETURN_RECEIVED") {
    return "RETURNED";
  }
  if (status === "REFUNDED") return "RETURNED";
  return "LABEL_CREATED";
};

const trackingStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    LABEL_CREATED: "Etiqueta gerada",
    POSTED: "Postado",
    IN_TRANSIT: "Em transito",
    OUT_FOR_DELIVERY: "Saiu para entrega",
    DELIVERED: "Entregue",
    CANCELLED: "Cancelado",
    RETURNED: "Devolvido"
  };
  return labels[status] ?? "Atualizado";
};

type TrackingEventInput = {
  id: string;
  status: string;
  occurred_at: string;
  location: string | null;
};

export const buildTrackingPayload = ({
  subOrderId,
  subOrderStatus,
  createdAt,
  carrier,
  trackingCode,
  events
}: {
  subOrderId: string;
  subOrderStatus: SubOrderStatus;
  createdAt: string;
  carrier: string | null;
  trackingCode: string | null;
  events: TrackingEventInput[];
}) => {
  const baseDate = new Date(createdAt);
  const fallbackEvents: TrackingEventInput[] = [
    {
      id: `${subOrderId}-1`,
      status: "LABEL_CREATED",
      occurred_at: baseDate.toISOString(),
      location: null
    }
  ];

  const current = trackingStatusFromSubOrderStatus(subOrderStatus);
  if (current !== "LABEL_CREATED") {
    fallbackEvents.push({
      id: `${subOrderId}-2`,
      status: current,
      occurred_at: pushDays(baseDate, 1).toISOString(),
      location: null
    });
  }

  const timeline = (events.length ? events : fallbackEvents).map((event, index) => ({
    event_id: event.id || `${subOrderId}-${index + 1}`,
    status: event.status,
    label: trackingStatusLabel(event.status),
    occurred_at: event.occurred_at,
    location: event.location
  }));

  return {
    sub_order_id: subOrderId,
    carrier: carrier ?? "Em definicao",
    tracking_code: trackingCode ?? null,
    last_updated_at: timeline[timeline.length - 1]?.occurred_at ?? createdAt,
    current_status: current,
    events: timeline
  };
};

const splitMessageAndAttachmentIds = (message: string) => {
  const marker = "\nattachments:";
  const markerIndex = message.lastIndexOf(marker);
  if (markerIndex < 0) return { text: message, attachmentIds: [] as string[] };
  const text = message.slice(0, markerIndex).trim();
  const tail = message.slice(markerIndex + marker.length).trim();
  try {
    const parsed = JSON.parse(tail) as unknown;
    if (Array.isArray(parsed)) {
      const attachmentIds = parsed
        .map((value) => (typeof value === "string" ? value : ""))
        .filter(Boolean);
      return { text, attachmentIds };
    }
  } catch {
    return { text: message, attachmentIds: [] };
  }
  return { text, attachmentIds: [] };
};

export const parseBootstrapMessage = (message: string, ticketId: string): TicketBootstrap => {
  const base: TicketBootstrap = {
    order_id: null,
    sub_order_id: null,
    seller_id: null,
    store_id: null,
    item_ids: [],
    items: [],
    reason: "OTHER",
    desired_resolution: "INFO",
    description: message,
    attachments: []
  };

  try {
    const parsed = JSON.parse(message) as unknown;
    const record = asRecord(parsed);
    if (!Object.keys(record).length) return base;

    const attachmentsRaw = Array.isArray(record.attachments) ? record.attachments : [];
    const attachments = attachmentsRaw
      .map((value, index) => {
        const attachment = asRecord(value);
        const url = safeString(attachment, ["url"]);
        if (!url) return null;
        const filename = safeString(attachment, ["filename"]) ?? `attachment-${index + 1}`;
        const typeText = normalize(safeString(attachment, ["type"]));
        const type: "IMAGE" | "VIDEO" | "FILE" = hasAny(typeText, ["video"])
          ? "VIDEO"
          : hasAny(typeText, ["image", "foto", "jpg", "png"])
            ? "IMAGE"
            : "FILE";
        return {
          attachment_id:
            safeString(attachment, ["attachment_id", "id"]) ?? `${ticketId}-att-${index + 1}`,
          type,
          filename,
          url,
          uploaded_at:
            safeString(attachment, ["uploaded_at", "created_at"]) ?? new Date().toISOString()
        } satisfies TicketAttachment;
      })
      .filter((attachment): attachment is TicketAttachment => Boolean(attachment));

    const itemsRaw = Array.isArray(record.items) ? record.items : [];
    const items = itemsRaw.map((value, index) => {
      const item = asRecord(value);
      return {
        item_id: safeString(item, ["item_id", "id"]) ?? `${ticketId}-item-${index + 1}`,
        product_name: safeString(item, ["product_name", "name"]) ?? "Produto",
        variant: safeString(item, ["variant"]),
        quantity: Math.max(1, Number(safeNumber(item, ["quantity"]) ?? 1))
      };
    });

    const itemIdsRaw = Array.isArray(record.item_ids) ? record.item_ids : [];
    const itemIds = itemIdsRaw
      .map((value) => (typeof value === "string" ? value : ""))
      .filter(Boolean);

    return {
      order_id: safeString(record, ["order_id"]),
      sub_order_id: safeString(record, ["sub_order_id"]),
      seller_id: safeString(record, ["seller_id", "store_id"]),
      store_id: safeString(record, ["store_id", "seller_id"]),
      item_ids: itemIds,
      items,
      reason: normalizeTicketReason(safeString(record, ["reason"])),
      desired_resolution: normalizeDesiredResolution(safeString(record, ["desired_resolution"])),
      description: safeString(record, ["description"]) ?? base.description,
      attachments
    };
  } catch {
    const lines = message.split("\n").map((line) => line.trim());
    const lookup = lines.reduce<Record<string, string>>((acc, line) => {
      const [key, ...rest] = line.split(":");
      if (key && rest.length) acc[normalize(key)] = rest.join(":").trim();
      return acc;
    }, {});

    return {
      ...base,
      order_id: lookup.pedido ?? null,
      seller_id: lookup.lojista ?? null,
      store_id: lookup.lojista ?? null,
      reason: normalizeTicketReason(lookup.motivo ?? null),
      desired_resolution: normalizeDesiredResolution(lookup.desejo ?? null),
      description:
        lines.slice(Math.max(0, lines.findIndex((line) => !line.includes(":")))).join("\n") ||
        message
    };
  }
};

export const mapTicketMessage = (row: UnknownRecord): TicketMessage => {
  const rawMessage = safeString(row, ["message"]) ?? "";
  const { text, attachmentIds } = splitMessageAndAttachmentIds(rawMessage);
  const senderRole = normalize(safeString(row, ["sender_role"]));
  const senderType: TicketMessage["sender_type"] =
    senderRole === "customer"
      ? "CUSTOMER"
      : senderRole === "seller" || senderRole === "store"
        ? "STORE"
        : "SUPPORT";

  return {
    message_id: safeString(row, ["id"]) ?? crypto.randomUUID(),
    sender_type: senderType,
    text,
    attachment_ids: attachmentIds,
    sent_at: safeString(row, ["created_at"]) ?? new Date().toISOString()
  };
};

export const buildTicketProtocol = (ticketId: string, createdAt: string) => {
  const year = new Date(createdAt).getFullYear();
  const sequence = ticketId.replace(/-/g, "").slice(-6).toUpperCase();
  return `BP-SUP-${year}-${sequence}`;
};

export const buildTicketSla = ({
  createdAt,
  firstResponseDueAt,
  resolutionDueAt
}: {
  createdAt: string;
  firstResponseDueAt: string | null;
  resolutionDueAt: string | null;
}) => {
  const created = new Date(createdAt);
  const firstResponse = firstResponseDueAt
    ? new Date(firstResponseDueAt)
    : withTime(created, 23, 59, 59);
  const resolution = resolutionDueAt ? new Date(resolutionDueAt) : withTime(pushDays(created, 3), 23, 59, 59);

  return {
    first_response_due_at: firstResponse.toISOString(),
    resolution_due_at: resolution.toISOString()
  };
};

export const mapTicketToPayload = ({
  ticket,
  bootstrap,
  attachments,
  messages
}: {
  ticket: UnknownRecord;
  bootstrap: TicketBootstrap;
  attachments: TicketAttachment[];
  messages: TicketMessage[];
}) => {
  const ticketId = safeString(ticket, ["id"]) ?? crypto.randomUUID();
  const createdAt = safeString(ticket, ["created_at"]) ?? new Date().toISOString();

  return {
    ticket_id: ticketId,
    protocol: buildTicketProtocol(ticketId, createdAt),
    created_at: createdAt,
    customer_id: safeString(ticket, ["user_id", "customer_id"]),
    order_id: bootstrap.order_id,
    sub_order_id: bootstrap.sub_order_id,
    seller_id: bootstrap.seller_id ?? bootstrap.store_id,
    store_id: bootstrap.store_id,
    reason: bootstrap.reason,
    desired_resolution: bootstrap.desired_resolution,
    status: normalizeTicketStatus(safeString(ticket, ["status"])),
    sla: buildTicketSla({
      createdAt,
      firstResponseDueAt: safeString(ticket, ["first_response_due_at"]),
      resolutionDueAt: safeString(ticket, ["resolution_due_at", "sla_deadline"])
    }),
    items: bootstrap.items,
    description: bootstrap.description,
    attachments,
    messages
  };
};

export const normalizeAttachmentType = (contentType: string) => {
  const value = normalize(contentType);
  if (value.startsWith("image/")) return "IMAGE";
  if (value.startsWith("video/")) return "VIDEO";
  return "FILE";
};
