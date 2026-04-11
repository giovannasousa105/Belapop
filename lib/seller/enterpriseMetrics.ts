export type SellerSubOrderMetricRow = {
  id: string;
  order_id: string | null;
  status: string | null;
  payment_status: string | null;
  created_at: string | null;
  product_total_cents: number | null;
  shipping_total_cents: number | null;
  platform_fee_cents: number | null;
  seller_net_cents: number | null;
};

export type SellerProductMetricRow = {
  id: string;
  status: string | null;
  stock_quantity: number | null;
};

export type SellerSupportTicketMetricRow = {
  id: string;
  status: string | null;
  created_at: string | null;
  sla_deadline: string | null;
};

export type SellerReviewMetricRow = {
  rating: number | null;
};

export type SellerScoreWeights = {
  sla: number;
  cancel: number;
  returns: number;
  rating: number;
  stockout: number;
  response: number;
};

export type SellerScoreComponents = {
  sla: number;
  cancel: number;
  returns: number;
  rating: number;
  stockout: number;
  response: number;
};

export type SellerScoreMetrics = {
  orders_total: number;
  late_orders: number;
  canceled_orders: number;
  returned_orders: number;
  stockout_skus: number;
  skus_published: number;
  support_tickets: number;
  support_tickets_late: number;
  rating_avg: number;
  rating_count: number;
  cancel_rate_percent: number;
  return_rate_percent: number;
  sla_on_time_percent: number;
  stockout_rate_percent: number;
  support_response_percent: number;
};

export type SellerScoreResult = {
  score: number;
  grade: "A" | "B" | "C" | "D" | "E";
  components: SellerScoreComponents;
  metrics: SellerScoreMetrics;
  weights: SellerScoreWeights;
  recommendations: string[];
  impacts: Array<{
    key: keyof SellerScoreComponents;
    level: "high" | "medium" | "low";
    message: string;
  }>;
};

export type SellerScoreBenchmark = {
  peers_count: number;
  category_average_score: number | null;
  percentile: number | null;
  band: "top_20" | "mid" | "below_average" | "insufficient_data";
};

export type SellerOperationalQueueItem = {
  id: string;
  title: string;
  severity: "critical" | "high" | "medium";
  priority_score: number;
  count: number;
  sla_hours: number;
  estimated_impact_cents: number;
  action_href: string;
  reason: string;
};

const DEFAULT_WEIGHTS: SellerScoreWeights = {
  sla: 0.28,
  cancel: 0.2,
  returns: 0.16,
  rating: 0.14,
  stockout: 0.12,
  response: 0.1
};

const clamp = (value: number, min = 0, max = 100) =>
  Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));

const normalize = (value: string | null | undefined) =>
  (value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();

const includesAny = (value: string, terms: string[]) => terms.some((term) => value.includes(term));

const toCents = (subOrder: SellerSubOrderMetricRow) =>
  (Number(subOrder.product_total_cents ?? 0) || 0) +
  (Number(subOrder.shipping_total_cents ?? 0) || 0);

const isCanceled = (status: string) => includesAny(status, ["cancel", "cancelado", "canceled"]);
const isReturned = (status: string) =>
  includesAny(status, ["devol", "return", "refund", "reembolso"]);
const isDelivered = (status: string) => includesAny(status, ["entreg", "delivered"]);
const isShipped = (status: string) =>
  includesAny(status, ["shipped", "enviado", "in_transit", "out_for_delivery", "em transito"]);
const isOpenTicket = (status: string) =>
  includesAny(status, ["open", "aberto", "waiting", "analise", "review", "escalated"]);

const toGrade = (score: number): SellerScoreResult["grade"] => {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "E";
};

export const computeSellerScore = (args: {
  subOrders: SellerSubOrderMetricRow[];
  products: SellerProductMetricRow[];
  supportTickets: SellerSupportTicketMetricRow[];
  reviews: SellerReviewMetricRow[];
  now?: number;
  weights?: Partial<SellerScoreWeights>;
}): SellerScoreResult => {
  const now = args.now ?? Date.now();
  const weights: SellerScoreWeights = {
    ...DEFAULT_WEIGHTS,
    ...(args.weights ?? {})
  };

  const rows = args.subOrders.map((row) => {
    const status = normalize(row.status);
    const createdAtMs = row.created_at ? new Date(row.created_at).getTime() : now;
    const ageHours = Math.max(0, (now - createdAtMs) / (1000 * 60 * 60));
    return { ...row, status, ageHours };
  });

  const ordersTotal = rows.length;
  const canceledOrders = rows.filter((row) => isCanceled(row.status)).length;
  const returnedOrders = rows.filter((row) => isReturned(row.status)).length;
  const lateOrders = rows.filter(
    (row) =>
      !isCanceled(row.status) &&
      !isDelivered(row.status) &&
      !isShipped(row.status) &&
      row.ageHours > 48
  ).length;

  const publishedProducts = args.products.filter(
    (product) => !includesAny(normalize(product.status), ["draft", "arquivado", "archived", "rejected"])
  );
  const stockoutSkus = publishedProducts.filter(
    (product) => Number(product.stock_quantity ?? 0) <= 0
  ).length;

  const tickets = args.supportTickets.map((ticket) => {
    const status = normalize(ticket.status);
    const createdAtMs = ticket.created_at ? new Date(ticket.created_at).getTime() : now;
    const isLateBySla =
      ticket.sla_deadline && Number.isFinite(new Date(ticket.sla_deadline).getTime())
        ? new Date(ticket.sla_deadline).getTime() < now
        : false;
    const isLateByAge = (now - createdAtMs) / (1000 * 60 * 60) > 24;
    return {
      ...ticket,
      status,
      isLate: isOpenTicket(status) && (isLateBySla || isLateByAge)
    };
  });
  const supportTicketsLate = tickets.filter((ticket) => ticket.isLate).length;

  const ratingValues = args.reviews
    .map((review) => Number(review.rating ?? 0))
    .filter((rating) => Number.isFinite(rating) && rating > 0);
  const ratingCount = ratingValues.length;
  const ratingAvg =
    ratingCount > 0
      ? ratingValues.reduce((sum, rating) => sum + rating, 0) / ratingCount
      : 0;

  const cancelRate = ordersTotal > 0 ? (canceledOrders / ordersTotal) * 100 : 0;
  const returnRate = ordersTotal > 0 ? (returnedOrders / ordersTotal) * 100 : 0;
  const slaOnTime = ordersTotal > 0 ? ((ordersTotal - lateOrders) / ordersTotal) * 100 : 100;
  const stockoutRate =
    publishedProducts.length > 0 ? (stockoutSkus / publishedProducts.length) * 100 : 0;
  const supportResponseRate =
    tickets.length > 0 ? ((tickets.length - supportTicketsLate) / tickets.length) * 100 : 100;

  const components: SellerScoreComponents = {
    sla: clamp(slaOnTime),
    cancel: clamp(100 - cancelRate * 6),
    returns: clamp(100 - returnRate * 7),
    rating: clamp(ratingCount > 0 ? (ratingAvg / 5) * 100 : 78),
    stockout: clamp(100 - stockoutRate * 3),
    response: clamp(supportResponseRate)
  };

  const score = clamp(
    components.sla * weights.sla +
      components.cancel * weights.cancel +
      components.returns * weights.returns +
      components.rating * weights.rating +
      components.stockout * weights.stockout +
      components.response * weights.response
  );

  const impacts: SellerScoreResult["impacts"] = [];
  if (components.sla < 85) {
    impacts.push({
      key: "sla",
      level: "high",
      message: "SLA de envio baixo reduz exposicao organica e pode gerar penalidade de ranking."
    });
  }
  if (components.cancel < 82) {
    impacts.push({
      key: "cancel",
      level: "high",
      message: "Cancelamento elevado derruba conversao recorrente e confianca da loja."
    });
  }
  if (components.returns < 80) {
    impacts.push({
      key: "returns",
      level: "medium",
      message: "Devolucao acima da media pressiona margem e aumenta custo operacional."
    });
  }
  if (components.stockout < 85) {
    impacts.push({
      key: "stockout",
      level: "medium",
      message: "Ruptura recorrente reduz score de disponibilidade e performance de campanhas."
    });
  }
  if (components.response < 88) {
    impacts.push({
      key: "response",
      level: "medium",
      message: "Tempo de resposta alto aumenta escalonamentos de suporte e risco de disputa."
    });
  }
  if (components.rating < 80) {
    impacts.push({
      key: "rating",
      level: "low",
      message: "Avaliacao media abaixo da categoria reduz taxa de conversao no PDP."
    });
  }

  const recommendations: string[] = [];
  if (lateOrders > 0) recommendations.push("Priorizar expedicao dos pedidos vencendo em ate 24h.");
  if (stockoutSkus > 0) recommendations.push("Repor SKUs em ruptura e configurar alerta de estoque minimo.");
  if (supportTicketsLate > 0) recommendations.push("Ativar playbook de resposta em ate 24h para tickets abertos.");
  if (returnRate > 2.5) recommendations.push("Revisar SKUs com maior devolucao e ajustar conteudo/qualidade.");
  if (cancelRate > 2) recommendations.push("Travar ofertas de baixo estoque e revisar promessa de prazo.");

  return {
    score,
    grade: toGrade(score),
    components,
    metrics: {
      orders_total: ordersTotal,
      late_orders: lateOrders,
      canceled_orders: canceledOrders,
      returned_orders: returnedOrders,
      stockout_skus: stockoutSkus,
      skus_published: publishedProducts.length,
      support_tickets: tickets.length,
      support_tickets_late: supportTicketsLate,
      rating_avg: ratingAvg,
      rating_count: ratingCount,
      cancel_rate_percent: cancelRate,
      return_rate_percent: returnRate,
      sla_on_time_percent: slaOnTime,
      stockout_rate_percent: stockoutRate,
      support_response_percent: supportResponseRate
    },
    weights,
    recommendations,
    impacts
  };
};

export const computeBenchmark = (
  score: number,
  peerScores: number[]
): SellerScoreBenchmark => {
  const cleanPeers = peerScores.filter((value) => Number.isFinite(value));
  if (cleanPeers.length < 5) {
    return {
      peers_count: cleanPeers.length,
      category_average_score: cleanPeers.length
        ? cleanPeers.reduce((sum, value) => sum + value, 0) / cleanPeers.length
        : null,
      percentile: null,
      band: "insufficient_data"
    };
  }

  const lowerOrEqual = cleanPeers.filter((value) => value <= score).length;
  const percentile = Math.round((lowerOrEqual / cleanPeers.length) * 100);
  const average = cleanPeers.reduce((sum, value) => sum + value, 0) / cleanPeers.length;

  return {
    peers_count: cleanPeers.length,
    category_average_score: average,
    percentile,
    band: percentile >= 80 ? "top_20" : percentile >= 50 ? "mid" : "below_average"
  };
};

export const buildOperationalQueue = (args: {
  subOrders: SellerSubOrderMetricRow[];
  products: SellerProductMetricRow[];
  supportTickets: SellerSupportTicketMetricRow[];
  now?: number;
}): SellerOperationalQueueItem[] => {
  const now = args.now ?? Date.now();
  const rows = args.subOrders.map((row) => {
    const status = normalize(row.status);
    const createdAtMs = row.created_at ? new Date(row.created_at).getTime() : now;
    const ageHours = Math.max(0, (now - createdAtMs) / (1000 * 60 * 60));
    return {
      ...row,
      status,
      ageHours,
      grossCents: toCents(row)
    };
  });

  const pendingShipments = rows.filter(
    (row) =>
      !isCanceled(row.status) &&
      !isDelivered(row.status) &&
      !isShipped(row.status) &&
      row.ageHours >= 24
  );
  const slaRiskOrders = rows.filter(
    (row) =>
      !isCanceled(row.status) &&
      !isDelivered(row.status) &&
      !isShipped(row.status) &&
      row.ageHours >= 42
  );
  const returnsBacklog = rows.filter(
    (row) => isReturned(row.status) && row.ageHours >= 24
  );
  const outOfStockProducts = args.products.filter(
    (product) =>
      !includesAny(normalize(product.status), ["draft", "arquivado", "archived", "rejected"]) &&
      Number(product.stock_quantity ?? 0) <= 0
  );
  const lateTickets = args.supportTickets.filter((ticket) => {
    const status = normalize(ticket.status);
    if (!isOpenTicket(status)) return false;
    const createdAtMs = ticket.created_at ? new Date(ticket.created_at).getTime() : now;
    const lateByAge = (now - createdAtMs) / (1000 * 60 * 60) > 24;
    const lateBySla =
      ticket.sla_deadline && Number.isFinite(new Date(ticket.sla_deadline).getTime())
        ? new Date(ticket.sla_deadline).getTime() < now
        : false;
    return lateByAge || lateBySla;
  });

  const queue: SellerOperationalQueueItem[] = [
    {
      id: "send_today",
      title: "Enviar hoje",
      severity: pendingShipments.length >= 6 ? "critical" : pendingShipments.length > 0 ? "high" : "medium",
      priority_score: pendingShipments.length > 0 ? 100 + pendingShipments.length * 4 : 10,
      count: pendingShipments.length,
      sla_hours: 24,
      estimated_impact_cents: pendingShipments.reduce((sum, row) => sum + row.grossCents, 0),
      action_href: "/seller/orders?filter=due_24h",
      reason: "Pedidos com mais de 24h sem postagem tendem a reduzir SLA e recorrencia."
    },
    {
      id: "sla_risk",
      title: "SLA em risco",
      severity: slaRiskOrders.length >= 3 ? "critical" : slaRiskOrders.length > 0 ? "high" : "medium",
      priority_score: slaRiskOrders.length > 0 ? 110 + slaRiskOrders.length * 6 : 8,
      count: slaRiskOrders.length,
      sla_hours: 6,
      estimated_impact_cents: slaRiskOrders.reduce((sum, row) => sum + row.grossCents, 0),
      action_href: "/seller/orders?view=exceptions",
      reason: "Pedidos acima de 42h sem envio entram na janela de quebra de SLA."
    },
    {
      id: "stockout_critical",
      title: "Ruptura de estoque",
      severity:
        outOfStockProducts.length >= 8
          ? "critical"
          : outOfStockProducts.length > 0
            ? "high"
            : "medium",
      priority_score: outOfStockProducts.length > 0 ? 90 + outOfStockProducts.length * 3 : 6,
      count: outOfStockProducts.length,
      sla_hours: 12,
      estimated_impact_cents: outOfStockProducts.length * 12_000,
      action_href: "/seller/inventory",
      reason: "SKU sem saldo ativo gera cancelamento e reduz score de disponibilidade."
    },
    {
      id: "returns_backlog",
      title: "Devolucoes pendentes",
      severity: returnsBacklog.length >= 4 ? "high" : returnsBacklog.length > 0 ? "medium" : "medium",
      priority_score: returnsBacklog.length > 0 ? 70 + returnsBacklog.length * 5 : 4,
      count: returnsBacklog.length,
      sla_hours: 24,
      estimated_impact_cents: returnsBacklog.reduce((sum, row) => sum + row.grossCents, 0),
      action_href: "/seller/support",
      reason: "Tratativa lenta de devolucao eleva custo de suporte e chance de disputa."
    },
    {
      id: "support_backlog",
      title: "Suporte sem resposta",
      severity: lateTickets.length >= 5 ? "high" : lateTickets.length > 0 ? "medium" : "medium",
      priority_score: lateTickets.length > 0 ? 65 + lateTickets.length * 4 : 3,
      count: lateTickets.length,
      sla_hours: 24,
      estimated_impact_cents: lateTickets.length * 6_500,
      action_href: "/seller/support",
      reason: "Tickets abertos sem resposta acima de 24h elevam escalonamento."
    }
  ];

  return queue
    .filter((item) => item.count > 0)
    .sort((a, b) => b.priority_score - a.priority_score);
};
