import { formatPrice } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import {
  AlertOctagon,
  AlertTriangle,
  Box,
  Check,
  CircleCheck,
  Clock3,
  CornerUpLeft,
  FilePlus,
  Home,
  HousePlus,
  Inbox,
  Info,
  Loader2,
  Lock,
  MapPin,
  MessageSquare,
  PackageCheck,
  ReceiptText,
  Repeat,
  Repeat2,
  Route,
  Shield,
  Sparkles,
  Store,
  Tag,
  Truck,
  UserRound,
  XCircle
} from "lucide-react";
import {
  safeParseCustomerOrderStatusInputDto,
  safeParseCustomerSubOrderStatusInputDto,
  safeParseCustomerTrackingStatusInputDto,
  type CustomerOrderStatusInputDto,
  type CustomerSubOrderStatusInputDto,
  type CustomerTrackingStatusInputDto
} from "@/lib/customer/dto";

export type OrderRow = {
  id: string;
  status: string | null;
  total_order_cents: number | null;
  created_at: string;
  payment_provider?: string | null;
};

export type SubOrderRow = {
  id: string;
  order_id: string;
  seller_id: string;
  status: string | null;
  shipping_service?: string | null;
  shipping_days?: number | null;
  shipping_total_cents?: number | null;
  product_total_cents?: number | null;
  created_at?: string | null;
  shipping?: {
    estimated_delivery_date?: string | null;
  };
  items?: Array<{ productId?: string; quantity?: number }>;
};

export type SellerRow = {
  id: string;
  store_name: string | null;
};

type StatusTone = "default" | "highlight" | "muted";
type StatusScope = "auto" | "order" | "sub_order" | "tracking" | "ticket";
type AutoScope = Exclude<StatusScope, "auto"> | "unknown";

export type OrderUiStatus =
  | "ORDER_CREATED"
  | "ORDER_PAYMENT_PENDING"
  | "ORDER_PAID"
  | "ORDER_PARTIALLY_PROCESSING"
  | "ORDER_PROCESSING"
  | "ORDER_PARTIALLY_SHIPPED"
  | "ORDER_SHIPPED"
  | "ORDER_PARTIALLY_DELIVERED"
  | "ORDER_DELIVERED"
  | "ORDER_CANCELLED"
  | "ORDER_PARTIALLY_REFUNDED"
  | "ORDER_REFUNDED";

export type SubOrderUiStatus =
  | "SUB_PROCESSING"
  | "SUB_READY_TO_SHIP"
  | "SUB_LABEL_CREATED"
  | "SUB_SHIPPED"
  | "SUB_IN_TRANSIT"
  | "SUB_OUT_FOR_DELIVERY"
  | "SUB_DELIVERED"
  | "SUB_DELAYED_DERIVED"
  | "SUB_CANCELLED"
  | "SUB_RETURN_REQUESTED"
  | "SUB_RETURN_APPROVED"
  | "SUB_RETURN_IN_TRANSIT"
  | "SUB_RETURN_RECEIVED"
  | "SUB_REFUNDED"
  | "SUB_EXCHANGED";

export type TrackingUiStatus =
  | "TRK_LABEL_CREATED"
  | "TRK_POSTED"
  | "TRK_IN_TRANSIT"
  | "TRK_OUT_FOR_DELIVERY"
  | "TRK_DELIVERED"
  | "TRK_CANCELLED"
  | "TRK_RETURNED"
  | "TRK_EXCEPTION";

export type TicketUiStatus =
  | "TICKET_OPEN"
  | "TICKET_WAITING_STORE"
  | "TICKET_WAITING_CUSTOMER"
  | "TICKET_IN_REVIEW"
  | "TICKET_RESOLUTION_PROPOSED"
  | "TICKET_RESOLVED"
  | "TICKET_CLOSED"
  | "TICKET_CANCELLED"
  | "TICKET_ESCALATED";

export type UiStatusKey = OrderUiStatus | SubOrderUiStatus | TrackingUiStatus | TicketUiStatus;

export type UiStatus = {
  label: string;
  icon: LucideIcon;
  message: string;
  priority: number;
};

export type UiStatusMap = Record<string, UiStatus>;

export type Tracking = CustomerTrackingStatusInputDto;
export type SubOrder = CustomerSubOrderStatusInputDto;
export type Order = CustomerOrderStatusInputDto;

export type SubOrderStatusOptions = {
  storeName?: string | null;
  shippingDays?: number | null;
  estimatedDeliveryDate?: string | null;
  createdAt?: string | null;
  lastTrackingAt?: string | null;
};

export const UI_STATUS_MAP: Record<UiStatusKey, UiStatus> = {
  ORDER_CREATED: {
    label: "Pedido criado",
    icon: FilePlus,
    message: "Seu pedido foi criado. Finalize o pagamento para a loja comecar a preparar.",
    priority: 10
  },
  ORDER_PAYMENT_PENDING: {
    label: "Aguardando pagamento",
    icon: Clock3,
    message: "Assim que o pagamento confirmar, a preparacao comeca.",
    priority: 20
  },
  ORDER_PAID: {
    label: "Pagamento aprovado",
    icon: CircleCheck,
    message: "Tudo certo! Agora as lojas comecam a preparar seus itens.",
    priority: 30
  },
  ORDER_PARTIALLY_PROCESSING: {
    label: "Em preparacao",
    icon: Sparkles,
    message: "Uma ou mais lojas estao separando seus itens.",
    priority: 40
  },
  ORDER_PROCESSING: {
    label: "Em preparacao",
    icon: Sparkles,
    message: "As lojas estao separando seus itens.",
    priority: 50
  },
  ORDER_PARTIALLY_SHIPPED: {
    label: "Parcialmente enviado",
    icon: Truck,
    message: "Algumas lojas ja enviaram. Acompanhe por lojista.",
    priority: 60
  },
  ORDER_SHIPPED: {
    label: "Enviado",
    icon: Truck,
    message: "Todos os envios foram postados. Acompanhe por lojista.",
    priority: 70
  },
  ORDER_PARTIALLY_DELIVERED: {
    label: "Parcialmente entregue",
    icon: Home,
    message: "Uma parte chegou. Falta pouco para o restante.",
    priority: 80
  },
  ORDER_DELIVERED: {
    label: "Entregue",
    icon: HousePlus,
    message: "Tudo entregue. Se precisar, trocas e suporte ficam no seu painel.",
    priority: 90
  },
  ORDER_CANCELLED: {
    label: "Cancelado",
    icon: XCircle,
    message: "Pedido cancelado. Confira os detalhes e possiveis estornos.",
    priority: 5
  },
  ORDER_PARTIALLY_REFUNDED: {
    label: "Estorno parcial",
    icon: ReceiptText,
    message: "Parte do valor foi estornada. Veja os detalhes por lojista.",
    priority: 85
  },
  ORDER_REFUNDED: {
    label: "Estornado",
    icon: ReceiptText,
    message: "O valor foi estornado. Veja os detalhes no seu pedido.",
    priority: 95
  },
  SUB_PROCESSING: {
    label: "Separando",
    icon: Box,
    message: "A loja esta separando seus itens com cuidado.",
    priority: 50
  },
  SUB_READY_TO_SHIP: {
    label: "Pronto para envio",
    icon: PackageCheck,
    message: "Seu pedido esta embalado e indo para postagem.",
    priority: 55
  },
  SUB_LABEL_CREATED: {
    label: "Etiqueta gerada",
    icon: Tag,
    message: "A etiqueta foi criada. Falta apenas a postagem.",
    priority: 56
  },
  SUB_SHIPPED: {
    label: "Enviado",
    icon: Truck,
    message: "Pedido postado. O rastreio ja esta disponivel.",
    priority: 70
  },
  SUB_IN_TRANSIT: {
    label: "Em transito",
    icon: Route,
    message: "Seu pedido esta a caminho.",
    priority: 75
  },
  SUB_OUT_FOR_DELIVERY: {
    label: "Saiu para entrega",
    icon: MapPin,
    message: "Hoje e dia! O entregador esta indo ate voce.",
    priority: 80
  },
  SUB_DELIVERED: {
    label: "Entregue",
    icon: HousePlus,
    message: "Entregue. Se precisar, trocas e suporte ficam no seu painel.",
    priority: 90
  },
  SUB_DELAYED_DERIVED: {
    label: "Atrasado",
    icon: AlertTriangle,
    message: "Houve atraso na rota. Te avisamos na proxima atualizacao de rastreio.",
    priority: 78
  },
  SUB_CANCELLED: {
    label: "Cancelado",
    icon: XCircle,
    message: "Esse envio foi cancelado. Voce vera a atualizacao do estorno.",
    priority: 5
  },
  SUB_RETURN_REQUESTED: {
    label: "Troca/Devolucao solicitada",
    icon: Repeat,
    message: "Recebemos sua solicitacao. Vamos te orientar nos proximos passos.",
    priority: 82
  },
  SUB_RETURN_APPROVED: {
    label: "Troca/Devolucao aprovada",
    icon: Check,
    message: "Tudo certo! Voce pode enviar o item conforme instrucoes.",
    priority: 83
  },
  SUB_RETURN_IN_TRANSIT: {
    label: "Devolucao em transito",
    icon: Route,
    message: "A devolucao esta a caminho da loja.",
    priority: 84
  },
  SUB_RETURN_RECEIVED: {
    label: "Devolucao recebida",
    icon: Inbox,
    message: "A loja recebeu o item. A proxima etapa e a solucao final.",
    priority: 85
  },
  SUB_REFUNDED: {
    label: "Estornado",
    icon: ReceiptText,
    message: "O estorno desse envio foi realizado.",
    priority: 95
  },
  SUB_EXCHANGED: {
    label: "Troca concluida",
    icon: Repeat2,
    message: "Troca concluida. Se precisar, estamos aqui.",
    priority: 96
  },
  TRK_LABEL_CREATED: {
    label: "Etiqueta gerada",
    icon: Tag,
    message: "Etiqueta criada. A postagem sera o proximo passo.",
    priority: 56
  },
  TRK_POSTED: {
    label: "Enviado",
    icon: Truck,
    message: "Postado. Voce ja pode acompanhar o trajeto.",
    priority: 70
  },
  TRK_IN_TRANSIT: {
    label: "Em transito",
    icon: Route,
    message: "A caminho do seu endereco.",
    priority: 75
  },
  TRK_OUT_FOR_DELIVERY: {
    label: "Saiu para entrega",
    icon: MapPin,
    message: "Pode chegar hoje. Fique de olho!",
    priority: 80
  },
  TRK_DELIVERED: {
    label: "Entregue",
    icon: HousePlus,
    message: "Entrega confirmada.",
    priority: 90
  },
  TRK_CANCELLED: {
    label: "Envio cancelado",
    icon: XCircle,
    message: "Este envio foi cancelado. Confira os detalhes no pedido.",
    priority: 20
  },
  TRK_RETURNED: {
    label: "Devolvido",
    icon: CornerUpLeft,
    message: "O envio retornou. Acompanhe os proximos passos no atendimento.",
    priority: 82
  },
  TRK_EXCEPTION: {
    label: "Ocorrencia na entrega",
    icon: AlertOctagon,
    message: "Houve uma ocorrencia. Abra um protocolo se precisar de ajuda.",
    priority: 79
  },
  TICKET_OPEN: {
    label: "Aberto",
    icon: MessageSquare,
    message: "Protocolo criado. Ja estamos encaminhando.",
    priority: 30
  },
  TICKET_WAITING_STORE: {
    label: "Aguardando a loja",
    icon: Store,
    message: "A loja precisa responder para avancarmos.",
    priority: 40
  },
  TICKET_WAITING_CUSTOMER: {
    label: "Aguardando voce",
    icon: UserRound,
    message: "Precisamos de uma informacao sua para concluir.",
    priority: 45
  },
  TICKET_IN_REVIEW: {
    label: "Em analise (BelaPop)",
    icon: Shield,
    message: "Estamos analisando e vamos te atualizar.",
    priority: 50
  },
  TICKET_RESOLUTION_PROPOSED: {
    label: "Solucao proposta",
    icon: Sparkles,
    message: "Temos uma solucao. Confirme para finalizar.",
    priority: 60
  },
  TICKET_RESOLVED: {
    label: "Resolvido",
    icon: CircleCheck,
    message: "Resolvido. Voce pode encerrar quando quiser.",
    priority: 70
  },
  TICKET_CLOSED: {
    label: "Encerrado",
    icon: Lock,
    message: "Protocolo encerrado. O historico fica salvo.",
    priority: 90
  },
  TICKET_CANCELLED: {
    label: "Cancelado",
    icon: XCircle,
    message: "Protocolo cancelado.",
    priority: 5
  },
  TICKET_ESCALATED: {
    label: "Escalado",
    icon: AlertOctagon,
    message: "Caso sensivel. Time BelaPop esta priorizando.",
    priority: 80
  }
};

const STATUS_TONE_MUTED = new Set<UiStatusKey>([
  "ORDER_CANCELLED",
  "ORDER_PARTIALLY_REFUNDED",
  "ORDER_REFUNDED",
  "SUB_DELAYED_DERIVED",
  "SUB_CANCELLED",
  "SUB_REFUNDED",
  "TRK_CANCELLED",
  "TRK_RETURNED",
  "TRK_EXCEPTION",
  "TICKET_CLOSED",
  "TICKET_CANCELLED",
  "TICKET_ESCALATED"
]);

const STATUS_TONE_HIGHLIGHT = new Set<UiStatusKey>([
  "ORDER_PAID",
  "ORDER_PARTIALLY_SHIPPED",
  "ORDER_SHIPPED",
  "ORDER_PARTIALLY_DELIVERED",
  "ORDER_DELIVERED",
  "SUB_SHIPPED",
  "SUB_OUT_FOR_DELIVERY",
  "SUB_DELIVERED",
  "SUB_EXCHANGED",
  "TRK_POSTED",
  "TRK_OUT_FOR_DELIVERY",
  "TRK_DELIVERED",
  "TICKET_RESOLUTION_PROPOSED",
  "TICKET_RESOLVED"
]);

const normalize = (value: string | null | undefined) =>
  (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();

const includesAny = (value: string, tokens: string[]) =>
  tokens.some((token) => value.includes(token));

const parseDate = (value: string | null | undefined) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const todayIsoDate = () => {
  const today = new Date();
  const yyyy = String(today.getFullYear());
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const applyStoreName = (message: string, storeName?: string | null) => {
  if (!message.includes("{Loja}")) return message;
  return message.replace("{Loja}", storeName || "A loja");
};

const humanizeUnknownStatus = (value: string | null | undefined) => {
  const fallback = (value ?? "").trim();
  if (!fallback) return "Em atualizacao";
  return fallback
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const statusToneByKey = (key: UiStatusKey): StatusTone => {
  if (STATUS_TONE_MUTED.has(key)) return "muted";
  if (STATUS_TONE_HIGHLIGHT.has(key)) return "highlight";
  return "default";
};

export function safeGet(map: UiStatusMap, key: string): UiStatus {
  return (
    map[key] ?? {
      label: "Atualizando",
      icon: Loader2,
      message: "Estamos atualizando as informacoes.",
      priority: 0
    }
  );
}

export function isDelayedDerived(
  estimatedDeliveryDate?: string,
  currentTechnical?: string
): boolean {
  if (!estimatedDeliveryDate) return false;

  const technical = normalize(currentTechnical)
    .replace(/^sub_/, "")
    .replace(/^order_/, "")
    .replace(/^trk_/, "")
    .replace(/^ticket_/, "");

  const terminal = new Set(["delivered", "cancelled", "refunded", "exchanged"]);
  if (technical && terminal.has(technical)) return false;

  return estimatedDeliveryDate < todayIsoDate();
}

export function normalizeTrackingStatus(tracking?: Tracking | null): string | null {
  if (!tracking) return null;
  if (tracking.current_status) return tracking.current_status;

  const lastEvent = tracking.events?.[tracking.events.length - 1];
  return lastEvent?.status ?? null;
}

export function pickBest(keys: Array<string | null | undefined>, map: UiStatusMap): UiStatus {
  const statuses = keys
    .filter((key): key is string => Boolean(key))
    .map((key) => safeGet(map, key))
    .sort((a, b) => b.priority - a.priority);

  return statuses[0] ?? safeGet(map, "UNKNOWN");
}

const isDelayedSubOrder = ({
  status,
  shippingDays,
  estimatedDeliveryDate,
  createdAt,
  lastTrackingAt
}: {
  status: SubOrderUiStatus;
  shippingDays?: number | null;
  estimatedDeliveryDate?: string | null;
  createdAt?: string | null;
  lastTrackingAt?: string | null;
}) => {
  if (!["SUB_SHIPPED", "SUB_IN_TRANSIT", "SUB_OUT_FOR_DELIVERY"].includes(status)) return false;
  const etaFromEstimated = parseDate(estimatedDeliveryDate);
  const created = parseDate(createdAt);
  const etaFromShipping =
    created && shippingDays && shippingDays > 0
      ? new Date(created.getTime() + shippingDays * 24 * 60 * 60 * 1000)
      : null;
  const eta = etaFromEstimated ?? etaFromShipping;
  if (!eta) return false;
  const now = new Date();
  if (now <= eta) return false;

  // Derived delay only when ETA passed and there was no new tracking event after ETA.
  const trackingDate = parseDate(lastTrackingAt);
  if (!trackingDate) return true;
  return trackingDate.getTime() <= eta.getTime();
};

const inferScope = (status: string | null | undefined): AutoScope => {
  const value = normalize(status);
  if (!value) return "unknown";

  if (value.startsWith("order_")) return "order";
  if (value.startsWith("sub_")) return "sub_order";
  if (value.startsWith("trk_")) return "tracking";
  if (value.startsWith("ticket_")) return "ticket";

  if (
    includesAny(value, [
      "waiting_store",
      "waiting_customer",
      "resolution_proposed",
      "in_review",
      "escalated",
      "ticket",
      "protocolo",
      "aberto"
    ])
  ) {
    return "ticket";
  }

  if (
    includesAny(value, [
      "label_created",
      "posted",
      "in_transit",
      "out_for_delivery",
      "exception",
      "ocorrencia"
    ])
  ) {
    return "tracking";
  }

  if (includesAny(value, ["ready_to_ship", "return_", "devolucao", "troca_concluida"])) {
    return "sub_order";
  }

  if (
    includesAny(value, [
      "partially_",
      "payment_pending",
      "payment_approved",
      "paid",
      "created",
      "cancel",
      "shipped",
      "delivered",
      "refunded",
      "processing",
      "separando",
      "enviado",
      "entregue"
    ])
  ) {
    return "order";
  }

  return "unknown";
};

export const resolveOrderUiStatus = (status: string | null | undefined): OrderUiStatus => {
  const value = normalize(status);
  if (includesAny(value, ["order_partially_refunded", "partially_refunded", "partial_refund", "reembolso_parcial"])) {
    return "ORDER_PARTIALLY_REFUNDED";
  }
  if (includesAny(value, ["order_refunded", "refunded", "reembolsado", "estornado"])) {
    return "ORDER_REFUNDED";
  }
  if (includesAny(value, ["order_cancelled", "cancel", "cancelado"])) return "ORDER_CANCELLED";
  if (includesAny(value, ["order_partially_delivered", "partially_delivered", "parcialmente_entregue"])) {
    return "ORDER_PARTIALLY_DELIVERED";
  }
  if (includesAny(value, ["order_delivered", "delivered", "entregue"])) return "ORDER_DELIVERED";
  if (includesAny(value, ["order_partially_shipped", "partially_shipped", "parcialmente_enviado"])) {
    return "ORDER_PARTIALLY_SHIPPED";
  }
  if (includesAny(value, ["order_shipped", "shipped", "enviado", "postado"])) return "ORDER_SHIPPED";
  if (includesAny(value, ["order_partially_processing", "partially_processing", "parcialmente_processando"])) {
    return "ORDER_PARTIALLY_PROCESSING";
  }
  if (includesAny(value, ["order_processing", "processing", "separando", "separacao"])) {
    return "ORDER_PROCESSING";
  }
  if (includesAny(value, ["order_paid", "paid", "pago", "payment_approved"])) return "ORDER_PAID";
  if (includesAny(value, ["order_payment_pending", "payment_pending", "pending_payment", "aguardando_pagamento"])) {
    return "ORDER_PAYMENT_PENDING";
  }
  return "ORDER_CREATED";
};

export const resolveSubOrderUiStatus = (
  status: string | null | undefined,
  options?: SubOrderStatusOptions
): SubOrderUiStatus => {
  const value = normalize(status);
  let resolved: SubOrderUiStatus;

  if (includesAny(value, ["sub_return_requested", "return_requested", "devolucao_solicitada"])) {
    resolved = "SUB_RETURN_REQUESTED";
  } else if (includesAny(value, ["sub_return_approved", "return_approved", "devolucao_aprovada"])) {
    resolved = "SUB_RETURN_APPROVED";
  } else if (includesAny(value, ["sub_return_in_transit", "return_in_transit", "devolucao_em_transito"])) {
    resolved = "SUB_RETURN_IN_TRANSIT";
  } else if (includesAny(value, ["sub_return_received", "return_received", "devolucao_recebida"])) {
    resolved = "SUB_RETURN_RECEIVED";
  } else if (includesAny(value, ["sub_refunded", "refunded", "reembolsado", "estornado"])) {
    resolved = "SUB_REFUNDED";
  } else if (includesAny(value, ["sub_exchanged", "exchanged", "trocado", "troca_concluida"])) {
    resolved = "SUB_EXCHANGED";
  } else if (includesAny(value, ["sub_cancelled", "cancelled", "cancelado"])) {
    resolved = "SUB_CANCELLED";
  } else if (includesAny(value, ["sub_out_for_delivery", "out_for_delivery", "saiu_para_entrega"])) {
    resolved = "SUB_OUT_FOR_DELIVERY";
  } else if (includesAny(value, ["sub_in_transit", "in_transit", "em_transito", "rota"])) {
    resolved = "SUB_IN_TRANSIT";
  } else if (includesAny(value, ["sub_shipped", "shipped", "postado", "enviado"])) {
    resolved = "SUB_SHIPPED";
  } else if (includesAny(value, ["sub_label_created", "label_created", "etiqueta_gerada"])) {
    resolved = "SUB_LABEL_CREATED";
  } else if (includesAny(value, ["sub_ready_to_ship", "ready_to_ship", "pronto_para_envio"])) {
    resolved = "SUB_READY_TO_SHIP";
  } else {
    resolved = "SUB_PROCESSING";
  }

  if (
    isDelayedSubOrder({
      status: resolved,
      shippingDays: options?.shippingDays,
      estimatedDeliveryDate: options?.estimatedDeliveryDate,
      createdAt: options?.createdAt,
      lastTrackingAt: options?.lastTrackingAt
    })
  ) {
    return "SUB_DELAYED_DERIVED";
  }

  return resolved;
};

export const resolveTrackingUiStatus = (status: string | null | undefined): TrackingUiStatus => {
  const value = normalize(status);
  if (includesAny(value, ["trk_returned", "returned", "devolvido"])) return "TRK_RETURNED";
  if (includesAny(value, ["trk_cancelled", "cancelled", "cancelado"])) return "TRK_CANCELLED";
  if (
    includesAny(value, [
      "trk_exception",
      "exception",
      "ocorrencia",
      "falha",
      "endereco insuficiente",
      "destinatario ausente",
      "tentativa de entrega",
      "delivery_failed",
      "recipient_absent",
      "address_issue"
    ])
  ) {
    return "TRK_EXCEPTION";
  }
  if (includesAny(value, ["trk_delivered", "delivered", "entregue"])) return "TRK_DELIVERED";
  if (includesAny(value, ["trk_out_for_delivery", "out_for_delivery", "saiu_para_entrega"])) {
    return "TRK_OUT_FOR_DELIVERY";
  }
  if (includesAny(value, ["trk_in_transit", "in_transit", "em_transito", "rota"])) return "TRK_IN_TRANSIT";
  if (includesAny(value, ["trk_posted", "posted", "shipped", "postado", "enviado"])) return "TRK_POSTED";
  return "TRK_LABEL_CREATED";
};

export const resolveTicketUiStatus = (status: string | null | undefined): TicketUiStatus => {
  const value = normalize(status);
  if (includesAny(value, ["ticket_waiting_store", "waiting_store", "aguardando_loja"])) return "TICKET_WAITING_STORE";
  if (includesAny(value, ["ticket_waiting_customer", "waiting_customer", "aguardando_cliente"])) {
    return "TICKET_WAITING_CUSTOMER";
  }
  if (includesAny(value, ["ticket_in_review", "in_review", "em_analise"])) return "TICKET_IN_REVIEW";
  if (includesAny(value, ["ticket_resolution_proposed", "resolution_proposed", "solucao_proposta"])) {
    return "TICKET_RESOLUTION_PROPOSED";
  }
  if (includesAny(value, ["ticket_resolved", "resolved", "resolvido"])) return "TICKET_RESOLVED";
  if (includesAny(value, ["ticket_closed", "closed", "encerrado"])) return "TICKET_CLOSED";
  if (includesAny(value, ["ticket_cancelled", "cancelled", "cancelado"])) return "TICKET_CANCELLED";
  if (includesAny(value, ["ticket_escalated", "escalated", "escalado"])) return "TICKET_ESCALATED";
  return "TICKET_OPEN";
};

const fallbackMeta = (status: string | null | undefined): UiStatus => {
  const label = humanizeUnknownStatus(status);
  return {
    label,
    icon: Info,
    message: label,
    priority: 0
  };
};

const metaByKey = (key: UiStatusKey, options?: SubOrderStatusOptions): UiStatus => {
  const base = UI_STATUS_MAP[key];
  return {
    ...base,
    message: applyStoreName(base.message, options?.storeName)
  };
};

const getStatusMeta = (
  status: string | null | undefined,
  scope: StatusScope = "auto",
  options?: SubOrderStatusOptions
) => {
  const effectiveScope = scope === "auto" ? inferScope(status) : scope;
  if (effectiveScope === "unknown") return fallbackMeta(status);

  if (effectiveScope === "order") {
    return metaByKey(resolveOrderUiStatus(status), options);
  }
  if (effectiveScope === "sub_order") {
    return metaByKey(resolveSubOrderUiStatus(status, options), options);
  }
  if (effectiveScope === "tracking") {
    return metaByKey(resolveTrackingUiStatus(status), options);
  }
  return metaByKey(resolveTicketUiStatus(status), options);
};

const getStatusKey = (
  status: string | null | undefined,
  scope: StatusScope = "auto",
  options?: SubOrderStatusOptions
): UiStatusKey | null => {
  const effectiveScope = scope === "auto" ? inferScope(status) : scope;
  if (effectiveScope === "unknown") return null;
  if (effectiveScope === "order") return resolveOrderUiStatus(status);
  if (effectiveScope === "sub_order") return resolveSubOrderUiStatus(status, options);
  if (effectiveScope === "tracking") return resolveTrackingUiStatus(status);
  return resolveTicketUiStatus(status);
};

export const formatMoneyFromCents = (value: number | null | undefined) =>
  formatPrice(Number(value ?? 0) / 100);

export const shortId = (value: string, size = 8) =>
  value.length > size ? value.slice(0, size).toUpperCase() : value.toUpperCase();

export const statusLabel = (
  status: string | null | undefined,
  scope: StatusScope = "auto",
  options?: SubOrderStatusOptions
) => getStatusMeta(status, scope, options).label;

export const statusMessage = (
  status: string | null | undefined,
  scope: StatusScope = "auto",
  options?: SubOrderStatusOptions
) => getStatusMeta(status, scope, options).message;

export const statusIcon = (
  status: string | null | undefined,
  scope: StatusScope = "auto",
  options?: SubOrderStatusOptions
) => getStatusMeta(status, scope, options).icon;

export const statusTone = (
  status: string | null | undefined,
  scope: StatusScope = "auto",
  options?: SubOrderStatusOptions
) => {
  const key = getStatusKey(status, scope, options);
  if (!key) return "default";
  return statusToneByKey(key);
};

export const statusClassName = (
  status: string | null | undefined,
  scope: StatusScope = "auto",
  options?: SubOrderStatusOptions
) => {
  const tone = statusTone(status, scope, options);
  if (tone === "highlight") return "border-bpPink/35 bg-bpPink/10 text-bpBlack";
  if (tone === "muted") return "border-black/15 bg-black/5 text-bpGraphite/85";
  return "border-black/12 bg-white text-bpGraphite/85";
};

export const isClosedOrderStatus = (status: string | null | undefined) => {
  const resolved = resolveOrderUiStatus(status);
  return ["ORDER_DELIVERED", "ORDER_CANCELLED", "ORDER_REFUNDED"].includes(resolved);
};

export const statusPriority = (
  status: string | null | undefined,
  scope: StatusScope = "auto",
  options?: SubOrderStatusOptions
) => getStatusMeta(status, scope, options).priority;

export const statusUiKey = (
  status: string | null | undefined,
  scope: StatusScope = "auto",
  options?: SubOrderStatusOptions
) => getStatusKey(status, scope, options);

type PickStatusInput = {
  status: string | null | undefined;
  scope?: StatusScope;
  options?: SubOrderStatusOptions;
};

export const pickPrimaryStatus = (items: PickStatusInput[]) => {
  if (!items.length) return null;
  return items.reduce<PickStatusInput>((best, item) => {
    const bestPriority = statusPriority(best.status, best.scope ?? "auto", best.options);
    const currentPriority = statusPriority(item.status, item.scope ?? "auto", item.options);
    return currentPriority >= bestPriority ? item : best;
  }, items[0]);
};

export function getPrimarySubOrderUiStatus(
  subOrder: unknown,
  tracking: unknown,
  uiStatusMap: UiStatusMap = UI_STATUS_MAP
): UiStatus {
  const parsedSubOrder = safeParseCustomerSubOrderStatusInputDto(subOrder);
  if (!parsedSubOrder) return safeGet(uiStatusMap, "UNKNOWN");

  const parsedTracking = tracking ? safeParseCustomerTrackingStatusInputDto(tracking) : null;
  const subKey = `SUB_${parsedSubOrder.status}`;
  const trackingStatus = normalizeTrackingStatus(parsedTracking ?? undefined);
  const trkKey = trackingStatus ? `TRK_${trackingStatus}` : null;
  const delayedKey = isDelayedDerived(
    parsedSubOrder.shipping?.estimated_delivery_date ?? undefined,
    parsedSubOrder.status
  )
    ? "SUB_DELAYED_DERIVED"
    : null;

  return pickBest([subKey, trkKey, delayedKey], uiStatusMap);
}

export function getPrimaryOrderUiStatus(
  order: unknown,
  uiStatusMap: UiStatusMap = UI_STATUS_MAP
): UiStatus {
  const parsedOrder = safeParseCustomerOrderStatusInputDto(order);
  if (!parsedOrder) return safeGet(uiStatusMap, "UNKNOWN");

  const orderKey = `ORDER_${parsedOrder.status}`;
  const bestSub =
    parsedOrder.sub_orders?.length
      ? parsedOrder.sub_orders
          .map((subOrder) => safeGet(uiStatusMap, `SUB_${subOrder.status}`))
          .sort((a, b) => b.priority - a.priority)[0]
      : null;

  const bestOrder = safeGet(uiStatusMap, orderKey);
  if (bestSub && bestSub.priority > bestOrder.priority) return bestSub;
  return bestOrder;
}

export const TRACKING_STEPS = [
  "Pagamento aprovado",
  "Separando",
  "Enviado",
  "Em transito",
  "Saiu para entrega",
  "Entregue"
] as const;

export const TRACKING_TIMELINE_KEYS: TrackingUiStatus[] = [
  "TRK_POSTED",
  "TRK_IN_TRANSIT",
  "TRK_OUT_FOR_DELIVERY",
  "TRK_DELIVERED"
];

export const getUiStatusByKey = (
  key: UiStatusKey,
  uiStatusMap: UiStatusMap = UI_STATUS_MAP
) => safeGet(uiStatusMap, key);

export const trackingStepIndexFromSubOrderStatus = (
  status: string | null | undefined,
  options?: SubOrderStatusOptions
) => {
  const resolved = resolveSubOrderUiStatus(status, options);
  if (resolved === "SUB_PROCESSING" || resolved === "SUB_READY_TO_SHIP" || resolved === "SUB_LABEL_CREATED") {
    return 1;
  }
  if (resolved === "SUB_SHIPPED") return 2;
  if (resolved === "SUB_IN_TRANSIT") return 3;
  if (resolved === "SUB_OUT_FOR_DELIVERY") return 4;
  if (["SUB_DELIVERED", "SUB_REFUNDED", "SUB_EXCHANGED", "SUB_RETURN_RECEIVED"].includes(resolved)) {
    return 5;
  }
  if (
    [
      "SUB_RETURN_REQUESTED",
      "SUB_RETURN_APPROVED",
      "SUB_RETURN_IN_TRANSIT",
      "SUB_CANCELLED",
      "SUB_DELAYED_DERIVED"
    ].includes(resolved)
  ) {
    return 2;
  }
  return 0;
};

export const formatDateTimePtBr = (value: string) =>
  new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
