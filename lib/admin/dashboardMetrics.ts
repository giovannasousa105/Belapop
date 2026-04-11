import { addDays, format, startOfDay, subDays } from "date-fns";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

type AnyRow = Record<string, unknown>;

export type DashboardRange = "today" | "7d" | "30d" | "90d";

const RANGE_DAYS: Record<DashboardRange, number> = {
  today: 1,
  "7d": 7,
  "30d": 30,
  "90d": 90
};

type ExecutiveWindow = {
  currentStart: Date;
  previousStart: Date;
  now: Date;
  rangeDays: number;
};

type OrderAggregate = {
  totalOrders: number;
  revenueOrders: number;
  gmvCents: number;
  aovCents: number;
  canceledOrders: number;
  deliveredOrders: number;
  pendingOrders: number;
  cancelRatePct: number;
  fulfillmentPct: number;
};

export type DashboardKpis = {
  gmvCents: number;
  gmvDelta: number;
  orders: number;
  ordersDelta: number;
  aovCents: number;
  aovDelta: number;
  cancelRatePct: number;
  cancelRateDelta: number;
  fulfillmentPct: number;
  fulfillmentDelta: number;
  activeSellers: number;
  activeSellersDelta: number;
  openTickets: number;
  openTicketsDelta: number;
  overdueTickets: number;
  overdueTicketsDelta: number;
  avgFirstResponseMinutes: number;
  avgFirstResponseDelta: number;
  pendingProducts: number;
  pendingSellers: number;
};

export type OrdersTrendPoint = {
  date: string;
  label: string;
  orders: number;
  gmvCents: number;
  canceled: number;
};

export type SupportTrendPoint = {
  date: string;
  label: string;
  opened: number;
  replied: number;
};

export type StatusPoint = {
  status: string;
  label: string;
  count: number;
};

export type RecentOrderPoint = {
  id: string;
  createdAt: string | null;
  status: string;
  amountCents: number;
  customerId: string | null;
};

export type RecentTicketPoint = {
  id: string;
  createdAt: string | null;
  status: string;
  subject: string;
  userId: string | null;
  ageHours: number;
};

export type ShippingQueuePoint = {
  id: string;
  createdAt: string | null;
  shippingStatus: "awaiting_shipment" | "in_transit" | "delivered" | "other";
  carrier: string | null;
  amountCents: number;
  ageHours: number;
  isDelayed: boolean;
};

export type ShippingMonitor = {
  awaitingShipment: number;
  inTransit: number;
  delivered: number;
  delayed: number;
  queue: ShippingQueuePoint[];
};

export type PaymentMonitor = {
  paid: number;
  pending: number;
  failed: number;
  refundedOrChargeback: number;
  scheduledPayouts: number;
  failedPayouts: number;
  payoutAmountCents: number;
  nextPayoutAt: string | null;
};

export type CatalogMonitor = {
  total: number;
  published: number;
  lowStock: number;
  outOfStock: number;
  paused: number;
  needsReview: number;
};

export type CartMonitor = {
  active: number;
  abandoned: number;
  converted: number;
  abandonedValueCents: number;
  recoveryRatePct: number;
};

export type ReadinessStatus = "healthy" | "attention" | "critical";

export type MarketplaceReadinessModule = {
  key: string;
  label: string;
  status: ReadinessStatus;
  detail: string;
  href: string;
};

export type MarketplaceReadiness = {
  score: number;
  modules: MarketplaceReadinessModule[];
};

export type AlertSeverity = "critical" | "warning" | "info";

export type OperationalAlert = {
  id: string;
  severity: AlertSeverity;
  title: string;
  detail: string;
  href: string;
  cta: string;
};

export type SreRiskMonitor = {
  oncallCoveragePct: number;
  uncoveredShifts7d: number;
  openIncidents: number;
  criticalIncidents: number;
  errorBudgetCritical: number;
  errorBudgetWarn: number;
  drMissedOpenAlerts: number;
  avgSellerRiskScore: number;
  highRiskSellers: number;
  restrictedSellers: number;
  blockedPayoutSellers: number;
  activeHoldbacks: number;
  activeHoldbackCents: number;
  reconCriticalProviders: number;
  reconWarnProviders: number;
  reconLatestDate: string | null;
};

export type FinanceReconciliationReport = {
  id: string | null;
  provider: string;
  reportDate: string | null;
  status: string;
  discrepancies: number;
  totalOrders: number;
  totalPayments: number;
  totalPayouts: number;
  createdAt: string | null;
  updatedAt: string | null;
};

export type FinanceReconciliationIssue = {
  id: string | null;
  provider: string;
  orderId: string | null;
  sellerId: string | null;
  paymentIntentId: string | null;
  issueType: string | null;
  expectedAmount: number;
  actualAmount: number;
  status: string;
  createdAt: string | null;
};

export type FinanceLedgerEntry = {
  id: string | null;
  orderId: string | null;
  sellerId: string | null;
  entryType: string | null;
  amount: number;
  currency: string;
  referenceType: string | null;
  accountCode: string | null;
  direction: string | null;
  createdAt: string | null;
};

export type FinanceLedgerTransaction = {
  id: string | null;
  transactionType: string | null;
  orderId: string | null;
  sellerId: string | null;
  status: string;
  linesCount: number;
  totalDebitCents: number;
  totalCreditCents: number;
  createdAt: string | null;
};

export type FinanceDrilldown = {
  latestReport: FinanceReconciliationReport | null;
  openIssues: number;
  integrityMismatches: number;
  entryTypes: Array<{ entryType: string; count: number }>;
  reports: FinanceReconciliationReport[];
  issues: FinanceReconciliationIssue[];
  recentEntries: FinanceLedgerEntry[];
  recentTransactions: FinanceLedgerTransaction[];
};

export type ExecutiveDashboardData = {
  generatedAt: string;
  kpis: DashboardKpis;
  ordersTrend: OrdersTrendPoint[];
  supportTrend: SupportTrendPoint[];
  orderStatusBreakdown: StatusPoint[];
  funnel: { label: string; value: number }[];
  shippingMonitor: ShippingMonitor;
  paymentMonitor: PaymentMonitor;
  catalogMonitor: CatalogMonitor;
  cartMonitor: CartMonitor;
  sreRiskMonitor: SreRiskMonitor;
  financeDrilldown: FinanceDrilldown;
  marketplaceReadiness: MarketplaceReadiness;
  alerts: OperationalAlert[];
  recentOrders: RecentOrderPoint[];
  recentTickets: RecentTicketPoint[];
};

const REVENUE_ORDER_STATUSES = new Set([
  "paid",
  "processing",
  "shipped",
  "delivered",
  "fulfilled"
]);

const CANCELED_ORDER_STATUSES = new Set(["canceled", "cancelled", "refunded"]);
const DELIVERED_ORDER_STATUSES = new Set(["delivered", "fulfilled"]);
const PENDING_ORDER_STATUSES = new Set(["created", "pending", "processing"]);
const AWAITING_SHIPMENT_STATUSES = new Set([
  "awaiting_shipment",
  "ready_to_ship",
  "paid",
  "processing",
  "pending"
]);
const IN_TRANSIT_STATUSES = new Set([
  "shipped",
  "in_transit",
  "out_for_delivery"
]);
const DELIVERED_SHIPPING_STATUSES = new Set(["delivered", "fulfilled"]);
const RESOLVED_TICKET_STATUSES = new Set(["resolved", "closed", "done"]);
const RESOLVED_RECON_ISSUE_STATUSES = new Set(["resolved", "closed"]);
const CUSTOMER_SENDER_ROLES = new Set(["customer", "client", "buyer", "user"]);
const PAYMENT_SUCCESS_STATUSES = new Set(["paid", "succeeded", "captured"]);
const PAYMENT_PENDING_STATUSES = new Set(["pending", "authorized", "processing"]);
const PAYMENT_FAILED_STATUSES = new Set(["failed"]);
const PAYMENT_REFUND_STATUSES = new Set(["refunded", "chargeback"]);
const PAYOUT_SCHEDULED_STATUSES = new Set(["scheduled", "pending"]);
const PAYOUT_FAILED_STATUSES = new Set(["failed", "error", "rejected", "cancelled"]);
const CART_CONVERTED_STATUSES = new Set(["converted", "ordered", "checked_out", "completed", "paid"]);
const HIGH_RISK_SELLER_TIERS = new Set(["high", "restricted"]);
const OPEN_SRE_INCIDENT_STATUSES = new Set(["open", "investigating", "mitigating"]);
const CRITICAL_SRE_INCIDENT_SEVERITY = new Set(["sev1", "sev2"]);

const ORDER_STATUS_LABELS: Record<string, string> = {
  created: "Criado",
  pending: "Pendente",
  paid: "Pago",
  processing: "Processando",
  shipped: "Enviado",
  delivered: "Entregue",
  fulfilled: "Concluido",
  canceled: "Cancelado",
  cancelled: "Cancelado",
  refunded: "Reembolsado"
};

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toDate = (value: unknown): Date | null => {
  if (typeof value !== "string" || !value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const toStatus = (value: unknown) =>
  (typeof value === "string" ? value : "").trim().toLowerCase();

const orderAmountCents = (order: AnyRow) =>
  toNumber(order.total_cents ?? order.total_order_cents ?? order.total_products_cents);

const pctDelta = (current: number, previous: number) => {
  if (previous === 0) {
    if (current === 0) return 0;
    return 100;
  }
  return ((current - previous) / previous) * 100;
};

const improvementDelta = (current: number, previous: number) => {
  if (previous === 0) {
    if (current === 0) return 0;
    return -100;
  }
  return ((previous - current) / previous) * 100;
};

const ratioPct = (numerator: number, denominator: number) => {
  if (denominator <= 0) return 0;
  return (numerator / denominator) * 100;
};

const safeSelect = async (label: string, query: any) => {
  const { data, error } = await query;
  if (error) {
    console.error(`[dashboard] ${label} failed`, error.message ?? error);
    return [] as AnyRow[];
  }
  return (data ?? []) as AnyRow[];
};

const createWindow = (range: DashboardRange): ExecutiveWindow => {
  const rangeDays = RANGE_DAYS[range];
  const now = new Date();
  const currentStart =
    range === "today" ? startOfDay(now) : startOfDay(subDays(now, rangeDays - 1));
  const previousStart = startOfDay(subDays(currentStart, rangeDays));
  return { currentStart, previousStart, now, rangeDays };
};

const inCurrentWindow = (date: Date | null, window: ExecutiveWindow) =>
  Boolean(date && date >= window.currentStart && date <= window.now);

const inPreviousWindow = (date: Date | null, window: ExecutiveWindow) =>
  Boolean(date && date >= window.previousStart && date < window.currentStart);

const aggregateOrders = (orders: AnyRow[]): OrderAggregate => {
  let totalOrders = 0;
  let revenueOrders = 0;
  let gmvCents = 0;
  let canceledOrders = 0;
  let deliveredOrders = 0;
  let pendingOrders = 0;

  orders.forEach((order) => {
    totalOrders += 1;
    const status = toStatus(order.status);
    const amount = orderAmountCents(order);

    if (REVENUE_ORDER_STATUSES.has(status)) {
      revenueOrders += 1;
      gmvCents += amount;
    }
    if (CANCELED_ORDER_STATUSES.has(status)) canceledOrders += 1;
    if (DELIVERED_ORDER_STATUSES.has(status)) deliveredOrders += 1;
    if (PENDING_ORDER_STATUSES.has(status)) pendingOrders += 1;
  });

  const aovCents = revenueOrders > 0 ? Math.round(gmvCents / revenueOrders) : 0;
  const cancelRatePct = totalOrders > 0 ? (canceledOrders / totalOrders) * 100 : 0;
  const fulfillmentPct = revenueOrders > 0 ? (deliveredOrders / revenueOrders) * 100 : 0;

  return {
    totalOrders,
    revenueOrders,
    gmvCents,
    aovCents,
    canceledOrders,
    deliveredOrders,
    pendingOrders,
    cancelRatePct,
    fulfillmentPct
  };
};

const buildDayAxis = (window: ExecutiveWindow) => {
  const points = Math.max(1, Math.min(30, window.rangeDays));
  return Array.from({ length: points }, (_, index) => {
    const day = startOfDay(subDays(window.now, points - 1 - index));
    const key = format(day, "yyyy-MM-dd");
    return { key, label: format(day, "dd/MM") };
  });
};

const computeFirstReplyMinutes = (tickets: AnyRow[], messages: AnyRow[]) => {
  const ticketCreatedAt = new Map<string, Date>();
  tickets.forEach((ticket) => {
    const ticketId = String(ticket.id ?? "");
    const createdAt = toDate(ticket.created_at);
    if (ticketId && createdAt) {
      ticketCreatedAt.set(ticketId, createdAt);
    }
  });

  const firstReplyAt = new Map<string, Date>();
  messages.forEach((message) => {
    const ticketId = String(message.ticket_id ?? "");
    const createdAt = toDate(message.created_at);
    if (!ticketId || !createdAt) return;

    const role = toStatus(message.sender_role);
    if (CUSTOMER_SENDER_ROLES.has(role)) return;

    const current = firstReplyAt.get(ticketId);
    if (!current || createdAt < current) {
      firstReplyAt.set(ticketId, createdAt);
    }
  });

  const replyDurations = Array.from(ticketCreatedAt.entries())
    .map(([ticketId, createdAt]) => {
      const replyAt = firstReplyAt.get(ticketId);
      if (!replyAt) return null;
      const minutes = (replyAt.getTime() - createdAt.getTime()) / 60000;
      return minutes >= 0 ? minutes : null;
    })
    .filter((value): value is number => typeof value === "number");

  if (!replyDurations.length) return 0;
  return Math.round(replyDurations.reduce((sum, value) => sum + value, 0) / replyDurations.length);
};

const statusLabel = (status: string) => ORDER_STATUS_LABELS[status] ?? (status || "Indefinido");

const shippingStatusOf = (
  order: AnyRow
): "awaiting_shipment" | "in_transit" | "delivered" | "other" => {
  const shippingStatus = toStatus(order.shipping_status);
  const orderStatus = toStatus(order.status);
  const source = shippingStatus || orderStatus;

  if (AWAITING_SHIPMENT_STATUSES.has(source)) return "awaiting_shipment";
  if (IN_TRANSIT_STATUSES.has(source)) return "in_transit";
  if (DELIVERED_SHIPPING_STATUSES.has(source)) return "delivered";
  return "other";
};

const shippingCarrierOf = (order: AnyRow, shipment?: AnyRow | null): string | null => {
  const candidates = [
    shipment?.carrier,
    order.carrier,
    order.shipping_carrier,
    order.carrier_name
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  return null;
};

export async function fetchExecutiveDashboardData(
  range: DashboardRange = "today"
): Promise<ExecutiveDashboardData> {
  const supabase = await getSupabaseServerClient();
  const serviceSupabase = getSupabaseAdminClient();
  const window = createWindow(range);
  const since = window.previousStart.toISOString();
  const oncallFrom = format(window.now, "yyyy-MM-dd");
  const oncallTo = format(addDays(window.now, 7), "yyyy-MM-dd");

  const [
    ordersPeriod,
    ordersRecent,
    shipmentsPeriod,
    sellers,
    productsAll,
    cartsAll,
    paymentsPeriod,
    payoutsPeriod,
    pendingProducts,
    pendingSellers,
    tickets,
    messages,
    analyticsEvents,
    sellerRiskProfiles,
    activeHoldbacksRows,
    reconciliationRuns,
    oncallShifts,
    sreIncidents,
    sreErrorBudgetRollups,
    financeOpsAlerts,
    reconciliationReportsRows,
    reconciliationIssuesRows,
    ledgerEntriesRows,
    ledgerTransactionsRows
  ] = await Promise.all([
    safeSelect(
      "orders-period",
      supabase.from("orders").select("*").gte("created_at", since).order("created_at", { ascending: true })
    ),
    safeSelect(
      "orders-recent",
      supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(8)
    ),
    safeSelect(
      "shipments-period",
      supabase
        .from("shipments")
        .select("order_id,status,carrier,created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: true })
    ),
    safeSelect("sellers", supabase.from("sellers").select("id,status,created_at")),
    safeSelect("products-all", supabase.from("products").select("id,status,stock_quantity")),
    safeSelect("carts-all", supabase.from("carts").select("id,status,subtotal_cents,updated_at,created_at")),
    safeSelect("payments-period", supabase.from("payments").select("status,amount_cents,created_at").gte("created_at", since)),
    safeSelect(
      "payouts-period",
      supabase.from("payouts").select("status,amount_cents,scheduled_for,paid_at,created_at").gte("created_at", since)
    ),
    safeSelect(
      "pending-products",
      supabase.from("products").select("id,status,created_at").in("status", ["review", "needs_adjustment"])
    ),
    safeSelect("pending-sellers", supabase.from("sellers").select("id,status").eq("status", "pending")),
    safeSelect(
      "tickets",
      supabase.from("support_tickets").select("*").order("created_at", { ascending: false }).limit(1000)
    ),
    safeSelect(
      "support-messages",
      supabase.from("support_messages").select("ticket_id,sender_role,created_at").gte("created_at", since)
    ),
    safeSelect(
      "analytics-events",
      supabase.from("analytics_events").select("type,created_at").gte("created_at", window.currentStart.toISOString())
    ),
    safeSelect(
      "seller-risk-profiles",
      supabase
        .from("seller_risk_profiles")
        .select("seller_id,risk_score,risk_tier,payouts_blocked,computed_at")
        .order("computed_at", { ascending: false })
        .limit(5000)
    ),
    safeSelect(
      "active-holdbacks",
      supabase
        .from("seller_holdbacks")
        .select("id,seller_id,status,holdback_cents,created_at")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(5000)
    ),
    safeSelect(
      "gateway-reconciliation-runs",
      supabase
        .from("gateway_reconciliation_runs")
        .select("provider,recon_date,status,computed_at")
        .order("recon_date", { ascending: false })
        .order("provider", { ascending: true })
        .limit(180)
    ),
    safeSelect(
      "sre-oncall-shifts",
      supabase
        .from("sre_oncall_shifts")
        .select("shift_date,status,primary_user_id,secondary_user_id,updated_at")
        .gte("shift_date", oncallFrom)
        .lte("shift_date", oncallTo)
        .order("shift_date", { ascending: true })
    ),
    safeSelect(
      "sre-incidents",
      supabase
        .from("sre_incidents")
        .select("id,severity,status,started_at,resolved_at,updated_at")
        .order("started_at", { ascending: false })
        .limit(2000)
    ),
    safeSelect(
      "sre-error-budget-rollups",
      supabase
        .from("sre_error_budget_rollups")
        .select("service_key,sli_key,status,computed_date,budget_burn_pct,remaining_budget_pct,computed_at")
        .order("computed_date", { ascending: false })
        .limit(2000)
    ),
    safeSelect(
      "finance-ops-alerts",
      supabase
        .from("finance_ops_alerts")
        .select("id,alert_type,severity,status,created_at")
        .eq("status", "open")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(2000)
    ),
    safeSelect(
      "reconciliation-reports",
      serviceSupabase
        .from("reconciliation_reports")
        .select("id,provider,report_date,status,discrepancies,total_orders,total_payments,total_payouts,created_at,updated_at")
        .order("report_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(20)
    ),
    safeSelect(
      "reconciliation-issues",
      serviceSupabase
        .from("reconciliation_issues")
        .select("id,provider,order_id,seller_id,payment_intent_id,issue_type,expected_amount,actual_amount,status,created_at")
        .order("created_at", { ascending: false })
        .limit(50)
    ),
    safeSelect(
      "marketplace-ledger-entries",
      serviceSupabase
        .from("marketplace_ledger_entries")
        .select("id,order_id,seller_id,entry_type,amount,currency,reference_type,account_code,direction,created_at")
        .order("created_at", { ascending: false })
        .limit(50)
    ),
    safeSelect(
      "ledger-transactions",
      serviceSupabase
        .from("ledger_transactions")
        .select("id,transaction_type,order_id,seller_id,status,lines_count,total_debit_cents,total_credit_cents,created_at")
        .order("created_at", { ascending: false })
        .limit(30)
    )
  ]);

  const latestShipmentByOrder = new Map<string, AnyRow>();
  shipmentsPeriod.forEach((shipment) => {
    const orderId = String(shipment.order_id ?? "");
    if (!orderId) return;

    const previous = latestShipmentByOrder.get(orderId);
    if (!previous) {
      latestShipmentByOrder.set(orderId, shipment);
      return;
    }

    const previousTime = toDate(previous.created_at)?.getTime() ?? 0;
    const currentTime = toDate(shipment.created_at)?.getTime() ?? 0;
    if (currentTime >= previousTime) {
      latestShipmentByOrder.set(orderId, shipment);
    }
  });

  const ordersCurrent = ordersPeriod.filter((order) => inCurrentWindow(toDate(order.created_at), window));
  const ordersPrevious = ordersPeriod.filter((order) => inPreviousWindow(toDate(order.created_at), window));

  const currentOrders = aggregateOrders(ordersCurrent);
  const previousOrders = aggregateOrders(ordersPrevious);

  const activeSellers = sellers.filter((seller) => toStatus(seller.status) === "active").length;
  const currentNewActiveSellers = sellers.filter(
    (seller) => toStatus(seller.status) === "active" && inCurrentWindow(toDate(seller.created_at), window)
  ).length;
  const previousNewActiveSellers = sellers.filter(
    (seller) => toStatus(seller.status) === "active" && inPreviousWindow(toDate(seller.created_at), window)
  ).length;

  const openTickets = tickets.filter((ticket) => !RESOLVED_TICKET_STATUSES.has(toStatus(ticket.status)));
  const overdueTickets = openTickets.filter((ticket) => {
    const createdAt = toDate(ticket.created_at);
    if (!createdAt) return false;
    const ageHours = (window.now.getTime() - createdAt.getTime()) / 3600000;
    return ageHours >= 48;
  });

  const ticketsCurrent = tickets.filter((ticket) => inCurrentWindow(toDate(ticket.created_at), window));
  const ticketsPrevious = tickets.filter((ticket) => inPreviousWindow(toDate(ticket.created_at), window));

  const openTicketsCurrent = ticketsCurrent.filter(
    (ticket) => !RESOLVED_TICKET_STATUSES.has(toStatus(ticket.status))
  ).length;
  const openTicketsPrevious = ticketsPrevious.filter(
    (ticket) => !RESOLVED_TICKET_STATUSES.has(toStatus(ticket.status))
  ).length;

  const overdueTicketsCurrent = ticketsCurrent.filter((ticket) => {
    if (RESOLVED_TICKET_STATUSES.has(toStatus(ticket.status))) return false;
    const createdAt = toDate(ticket.created_at);
    if (!createdAt) return false;
    const ageHours = (window.now.getTime() - createdAt.getTime()) / 3600000;
    return ageHours >= 48;
  }).length;

  const overdueTicketsPrevious = ticketsPrevious.filter((ticket) => {
    if (RESOLVED_TICKET_STATUSES.has(toStatus(ticket.status))) return false;
    const createdAt = toDate(ticket.created_at);
    if (!createdAt) return false;
    const endOfPrevious = window.currentStart;
    const ageHours = (endOfPrevious.getTime() - createdAt.getTime()) / 3600000;
    return ageHours >= 48;
  }).length;

  const avgFirstResponseCurrent = computeFirstReplyMinutes(ticketsCurrent, messages);
  const avgFirstResponsePrevious = computeFirstReplyMinutes(ticketsPrevious, messages);

  const dayAxis = buildDayAxis(window);
  const ordersTrendMap = new Map<string, OrdersTrendPoint>(
    dayAxis.map(({ key, label }) => [key, { date: key, label, orders: 0, gmvCents: 0, canceled: 0 }])
  );
  const supportTrendMap = new Map<string, SupportTrendPoint>(
    dayAxis.map(({ key, label }) => [key, { date: key, label, opened: 0, replied: 0 }])
  );

  ordersCurrent.forEach((order) => {
    const createdAt = toDate(order.created_at);
    if (!createdAt) return;
    const key = format(createdAt, "yyyy-MM-dd");
    const bucket = ordersTrendMap.get(key);
    if (!bucket) return;

    const status = toStatus(order.status);
    bucket.orders += 1;
    if (REVENUE_ORDER_STATUSES.has(status)) {
      bucket.gmvCents += orderAmountCents(order);
    }
    if (CANCELED_ORDER_STATUSES.has(status)) {
      bucket.canceled += 1;
    }
  });

  ticketsCurrent.forEach((ticket) => {
    const createdAt = toDate(ticket.created_at);
    if (!createdAt) return;
    const key = format(createdAt, "yyyy-MM-dd");
    const bucket = supportTrendMap.get(key);
    if (bucket) bucket.opened += 1;
  });

  messages.forEach((message) => {
    const role = toStatus(message.sender_role);
    if (CUSTOMER_SENDER_ROLES.has(role)) return;
    const createdAt = toDate(message.created_at);
    if (!createdAt || !inCurrentWindow(createdAt, window)) return;
    const key = format(createdAt, "yyyy-MM-dd");
    const bucket = supportTrendMap.get(key);
    if (bucket) bucket.replied += 1;
  });

  const statusCountMap = new Map<string, number>();
  ordersCurrent.forEach((order) => {
    const key = toStatus(order.status) || "indefinido";
    statusCountMap.set(key, (statusCountMap.get(key) ?? 0) + 1);
  });

  const orderStatusBreakdown = Array.from(statusCountMap.entries())
    .map(([status, count]) => ({ status, label: statusLabel(status), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const eventCount = (types: string[]) =>
    analyticsEvents.filter((event) => types.includes(toStatus(event.type))).length;

  const visitCount = eventCount(["page_view", "view_item", "product_view"]);
  const addToCartCount = eventCount(["add_to_cart", "cart_add", "cart_updated"]);
  const checkoutCount = eventCount(["checkout_start", "checkout_started"]);
  const paidCount = currentOrders.revenueOrders;

  const funnel = [
    { label: "Visitas", value: visitCount },
    { label: "Add ao carrinho", value: addToCartCount },
    { label: "Checkout", value: checkoutCount },
    { label: "Pagos", value: paidCount }
  ];

  let awaitingShipment = 0;
  let inTransit = 0;
  let delivered = 0;
  let delayed = 0;

  const shippingQueue: ShippingQueuePoint[] = ordersCurrent
    .map((order) => {
      const shipment = latestShipmentByOrder.get(String(order.id ?? ""));
      const createdAt = toDate(order.created_at);
      const ageHours = createdAt
        ? Math.max(0, Math.round((window.now.getTime() - createdAt.getTime()) / 3600000))
        : 0;
      const shippingStatus = shippingStatusOf(shipment ?? order);
      const carrier = shippingCarrierOf(order, shipment);
      const isDelayed =
        (shippingStatus === "awaiting_shipment" && ageHours >= 48) ||
        (shippingStatus === "in_transit" && ageHours >= 96);

      if (shippingStatus === "awaiting_shipment") awaitingShipment += 1;
      if (shippingStatus === "in_transit") inTransit += 1;
      if (shippingStatus === "delivered") delivered += 1;
      if (isDelayed) delayed += 1;

      return {
        id: String(order.id ?? ""),
        createdAt: typeof order.created_at === "string" ? order.created_at : null,
        shippingStatus,
        carrier,
        amountCents: orderAmountCents(order),
        ageHours,
        isDelayed
      };
    })
    .filter((order) => order.shippingStatus === "awaiting_shipment" || order.shippingStatus === "in_transit")
    .sort((a, b) => {
      if (a.isDelayed !== b.isDelayed) return a.isDelayed ? -1 : 1;
      return b.ageHours - a.ageHours;
    })
    .slice(0, 8);

  const publishedProducts = productsAll.filter((product) => toStatus(product.status) === "published");
  const outOfStockProducts = publishedProducts.filter((product) => toNumber(product.stock_quantity) <= 0).length;
  const lowStockProducts = publishedProducts.filter((product) => {
    const stock = toNumber(product.stock_quantity);
    return stock > 0 && stock <= 5;
  }).length;
  const pausedProducts = productsAll.filter((product) => toStatus(product.status) === "paused").length;
  const needsReviewProducts = productsAll.filter((product) =>
    ["review", "needs_adjustment"].includes(toStatus(product.status))
  ).length;

  const activeCarts = cartsAll.filter((cart) => toStatus(cart.status) === "active").length;
  const abandonedCartsRows = cartsAll.filter((cart) => toStatus(cart.status) === "abandoned");
  const convertedCarts = cartsAll.filter((cart) => CART_CONVERTED_STATUSES.has(toStatus(cart.status))).length;
  const abandonedValueCents = abandonedCartsRows.reduce((sum, cart) => sum + toNumber(cart.subtotal_cents), 0);
  const recoveryRatePct = ratioPct(convertedCarts, convertedCarts + abandonedCartsRows.length);

  const paidPayments = paymentsPeriod.filter((payment) =>
    PAYMENT_SUCCESS_STATUSES.has(toStatus(payment.status))
  ).length;
  const pendingPayments = paymentsPeriod.filter((payment) =>
    PAYMENT_PENDING_STATUSES.has(toStatus(payment.status))
  ).length;
  const failedPayments = paymentsPeriod.filter((payment) =>
    PAYMENT_FAILED_STATUSES.has(toStatus(payment.status))
  ).length;
  const refundedOrChargebackPayments = paymentsPeriod.filter((payment) =>
    PAYMENT_REFUND_STATUSES.has(toStatus(payment.status))
  ).length;

  const scheduledPayoutRows = payoutsPeriod.filter((payout) =>
    PAYOUT_SCHEDULED_STATUSES.has(toStatus(payout.status))
  );
  const failedPayouts = payoutsPeriod.filter((payout) =>
    PAYOUT_FAILED_STATUSES.has(toStatus(payout.status))
  ).length;
  const payoutAmountCents = scheduledPayoutRows.reduce(
    (sum, payout) => sum + toNumber(payout.amount_cents),
    0
  );
  const nextPayoutAt =
    scheduledPayoutRows
      .map((payout) => {
        const scheduledFor = payout.scheduled_for;
        if (typeof scheduledFor === "string" && scheduledFor.trim()) {
          return toDate(scheduledFor)?.toISOString() ?? null;
        }
        if (typeof payout.created_at === "string" && payout.created_at.trim()) {
          return toDate(payout.created_at)?.toISOString() ?? null;
        }
        return null;
      })
      .filter((value): value is string => Boolean(value))
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0] ?? null;

  const paymentMonitor: PaymentMonitor = {
    paid: paidPayments,
    pending: pendingPayments,
    failed: failedPayments,
    refundedOrChargeback: refundedOrChargebackPayments,
    scheduledPayouts: scheduledPayoutRows.length,
    failedPayouts,
    payoutAmountCents,
    nextPayoutAt
  };

  const catalogMonitor: CatalogMonitor = {
    total: productsAll.length,
    published: publishedProducts.length,
    lowStock: lowStockProducts,
    outOfStock: outOfStockProducts,
    paused: pausedProducts,
    needsReview: needsReviewProducts
  };

  const cartMonitor: CartMonitor = {
    active: activeCarts,
    abandoned: abandonedCartsRows.length,
    converted: convertedCarts,
    abandonedValueCents,
    recoveryRatePct
  };

  const avgSellerRiskScore =
    sellerRiskProfiles.length > 0
      ? sellerRiskProfiles.reduce((sum, row) => sum + toNumber(row.risk_score), 0) /
        sellerRiskProfiles.length
      : 0;
  const highRiskSellers = sellerRiskProfiles.filter((row) =>
    HIGH_RISK_SELLER_TIERS.has(toStatus(row.risk_tier))
  ).length;
  const restrictedSellers = sellerRiskProfiles.filter(
    (row) => toStatus(row.risk_tier) === "restricted"
  ).length;
  const blockedPayoutSellers = sellerRiskProfiles.filter((row) => Boolean(row.payouts_blocked)).length;
  const activeHoldbackCents = activeHoldbacksRows.reduce(
    (sum, row) => sum + Math.max(0, toNumber(row.holdback_cents)),
    0
  );

  const latestReconDate = reconciliationRuns[0]?.recon_date
    ? String(reconciliationRuns[0].recon_date)
    : null;
  const latestReconRows = latestReconDate
    ? reconciliationRuns.filter((row) => String(row.recon_date ?? "") === latestReconDate)
    : [];
  const reconCriticalProviders = latestReconRows.filter(
    (row) => toStatus(row.status) === "critical"
  ).length;
  const reconWarnProviders = latestReconRows.filter((row) => toStatus(row.status) === "warn").length;

  const uncoveredShifts7d = oncallShifts.filter((row) => toStatus(row.status) === "uncovered").length;
  const oncallCoveragePct =
    oncallShifts.length > 0
      ? ratioPct(oncallShifts.length - uncoveredShifts7d, oncallShifts.length)
      : 0;

  const openIncidentsRows = sreIncidents.filter((row) =>
    OPEN_SRE_INCIDENT_STATUSES.has(toStatus(row.status))
  );
  const criticalIncidentsRows = openIncidentsRows.filter((row) =>
    CRITICAL_SRE_INCIDENT_SEVERITY.has(toStatus(row.severity))
  );

  const latestBudgetDate = sreErrorBudgetRollups[0]?.computed_date
    ? String(sreErrorBudgetRollups[0].computed_date)
    : null;
  const latestBudgetRows = latestBudgetDate
    ? sreErrorBudgetRollups.filter((row) => String(row.computed_date ?? "") === latestBudgetDate)
    : [];
  const errorBudgetCritical = latestBudgetRows.filter(
    (row) => toStatus(row.status) === "critical"
  ).length;
  const errorBudgetWarn = latestBudgetRows.filter((row) => toStatus(row.status) === "warn").length;

  const drMissedOpenAlerts = financeOpsAlerts.filter((row) =>
    ["dr_drill_missed", "dr_test_overdue"].includes(toStatus(row.alert_type))
  ).length;

  const reconciliationReports: FinanceReconciliationReport[] = reconciliationReportsRows.map((row) => ({
    id: row.id ? String(row.id) : null,
    provider: row.provider ? String(row.provider) : "stripe",
    reportDate: row.report_date ? String(row.report_date) : null,
    status: toStatus(row.status),
    discrepancies: toNumber(row.discrepancies),
    totalOrders: Number(toNumber(row.total_orders).toFixed(2)),
    totalPayments: Number(toNumber(row.total_payments).toFixed(2)),
    totalPayouts: Number(toNumber(row.total_payouts).toFixed(2)),
    createdAt: row.created_at ? String(row.created_at) : null,
    updatedAt: row.updated_at ? String(row.updated_at) : null
  }));

  const reconciliationIssues: FinanceReconciliationIssue[] = reconciliationIssuesRows.map((row) => ({
    id: row.id ? String(row.id) : null,
    provider: row.provider ? String(row.provider) : "stripe",
    orderId: row.order_id ? String(row.order_id) : null,
    sellerId: row.seller_id ? String(row.seller_id) : null,
    paymentIntentId: row.payment_intent_id ? String(row.payment_intent_id) : null,
    issueType: row.issue_type ? String(row.issue_type) : null,
    expectedAmount: Number(toNumber(row.expected_amount).toFixed(2)),
    actualAmount: Number(toNumber(row.actual_amount).toFixed(2)),
    status: toStatus(row.status),
    createdAt: row.created_at ? String(row.created_at) : null
  }));

  const recentLedgerEntries: FinanceLedgerEntry[] = ledgerEntriesRows.map((row) => ({
    id: row.id ? String(row.id) : null,
    orderId: row.order_id ? String(row.order_id) : null,
    sellerId: row.seller_id ? String(row.seller_id) : null,
    entryType: row.entry_type ? String(row.entry_type) : null,
    amount: Number(toNumber(row.amount).toFixed(2)),
    currency: row.currency ? String(row.currency) : "BRL",
    referenceType: row.reference_type ? String(row.reference_type) : null,
    accountCode: row.account_code ? String(row.account_code) : null,
    direction: row.direction ? String(row.direction) : null,
    createdAt: row.created_at ? String(row.created_at) : null
  }));

  const recentLedgerTransactions: FinanceLedgerTransaction[] = ledgerTransactionsRows.map((row) => ({
    id: row.id ? String(row.id) : null,
    transactionType: row.transaction_type ? String(row.transaction_type) : null,
    orderId: row.order_id ? String(row.order_id) : null,
    sellerId: row.seller_id ? String(row.seller_id) : null,
    status: toStatus(row.status),
    linesCount: toNumber(row.lines_count),
    totalDebitCents: toNumber(row.total_debit_cents),
    totalCreditCents: toNumber(row.total_credit_cents),
    createdAt: row.created_at ? String(row.created_at) : null
  }));

  const financeEntryTypeMap = new Map<string, number>();
  recentLedgerEntries.forEach((entry) => {
    const key = entry.entryType ?? "unknown";
    financeEntryTypeMap.set(key, (financeEntryTypeMap.get(key) ?? 0) + 1);
  });

  const financeDrilldown: FinanceDrilldown = {
    latestReport: reconciliationReports[0] ?? null,
    openIssues: reconciliationIssues.filter(
      (issue) => !RESOLVED_RECON_ISSUE_STATUSES.has(issue.status)
    ).length,
    integrityMismatches: recentLedgerTransactions.filter(
      (transaction) => transaction.totalDebitCents !== transaction.totalCreditCents
    ).length,
    entryTypes: Array.from(financeEntryTypeMap.entries())
      .map(([entryType, count]) => ({ entryType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8),
    reports: reconciliationReports.slice(0, 6),
    issues: reconciliationIssues.slice(0, 6),
    recentEntries: recentLedgerEntries.slice(0, 8),
    recentTransactions: recentLedgerTransactions.slice(0, 6)
  };

  const sreRiskMonitor: SreRiskMonitor = {
    oncallCoveragePct,
    uncoveredShifts7d,
    openIncidents: openIncidentsRows.length,
    criticalIncidents: criticalIncidentsRows.length,
    errorBudgetCritical,
    errorBudgetWarn,
    drMissedOpenAlerts,
    avgSellerRiskScore,
    highRiskSellers,
    restrictedSellers,
    blockedPayoutSellers,
    activeHoldbacks: activeHoldbacksRows.length,
    activeHoldbackCents,
    reconCriticalProviders,
    reconWarnProviders,
    reconLatestDate: latestReconDate
  };

  const marketplaceReadinessModules: MarketplaceReadinessModule[] = [
    {
      key: "payments",
      label: "Pagamentos e risco",
      status:
        paymentMonitor.failed > 0 || paymentMonitor.refundedOrChargeback >= 3
          ? "critical"
          : paymentMonitor.pending > 10
            ? "attention"
            : "healthy",
      detail: `${paymentMonitor.failed} falhas | ${paymentMonitor.pending} pendentes`,
      href: "/admin/finance"
    },
    {
      key: "risk",
      label: "Risco antifraude",
      status:
        highRiskSellers >= 5 || reconCriticalProviders > 0
          ? "critical"
          : highRiskSellers > 0 || reconWarnProviders > 0
            ? "attention"
            : "healthy",
      detail: `${highRiskSellers} sellers alto risco | ${blockedPayoutSellers} payouts bloqueados`,
      href: "/admin/finance"
    },
    {
      key: "sre",
      label: "SRE e continuidade",
      status:
        criticalIncidentsRows.length > 0 || errorBudgetCritical > 0 || uncoveredShifts7d > 0
          ? "critical"
          : errorBudgetWarn > 0
            ? "attention"
            : "healthy",
      detail: `${openIncidentsRows.length} incidentes | cobertura ${oncallCoveragePct.toFixed(0)}%`,
      href: "/admin/finance"
    },
    {
      key: "shipping",
      label: "Logistica e frete",
      status: delayed >= 5 ? "critical" : delayed > 0 ? "attention" : "healthy",
      detail: `${delayed} atrasados | ${inTransit} em transito`,
      href: "/admin/orders"
    },
    {
      key: "catalog",
      label: "Catalogo e estoque",
      status:
        catalogMonitor.outOfStock >= 20
          ? "critical"
          : catalogMonitor.lowStock >= 10 || catalogMonitor.outOfStock > 0
            ? "attention"
            : "healthy",
      detail: `${catalogMonitor.outOfStock} sem estoque | ${catalogMonitor.lowStock} estoque baixo`,
      href: "/admin/products"
    },
    {
      key: "support",
      label: "Atendimento",
      status:
        overdueTickets.length >= 10
          ? "critical"
          : openTickets.length >= 25 || overdueTickets.length > 0
            ? "attention"
            : "healthy",
      detail: `${openTickets.length} abertos | ${overdueTickets.length} acima SLA`,
      href: "/admin/support"
    },
    {
      key: "sellers",
      label: "Onboarding parceiros",
      status:
        pendingSellers.length >= 20
          ? "critical"
          : pendingSellers.length > 0
            ? "attention"
            : "healthy",
      detail: `${pendingSellers.length} aguardando aprovacao`,
      href: "/admin/parceiros"
    },
    {
      key: "conversion",
      label: "Conversao de carrinho",
      status:
        cartMonitor.abandoned >= 20 && cartMonitor.abandoned > cartMonitor.converted * 2
          ? "critical"
          : cartMonitor.abandoned > cartMonitor.converted
            ? "attention"
            : "healthy",
      detail: `${cartMonitor.abandoned} abandonados | recuperacao ${cartMonitor.recoveryRatePct.toFixed(1)}%`,
      href: "/admin/carts"
    }
  ];

  const readinessScoreByStatus: Record<ReadinessStatus, number> = {
    healthy: 100,
    attention: 65,
    critical: 30
  };
  const readinessScore = Math.round(
    marketplaceReadinessModules.reduce(
      (sum, module) => sum + readinessScoreByStatus[module.status],
      0
    ) / Math.max(1, marketplaceReadinessModules.length)
  );
  const marketplaceReadiness: MarketplaceReadiness = {
    score: readinessScore,
    modules: marketplaceReadinessModules
  };

  const alerts: OperationalAlert[] = [];

  if (paymentMonitor.failed > 0) {
    alerts.push({
      id: "failed-payments",
      severity: "critical",
      title: "Falhas de pagamento detectadas",
      detail: `${paymentMonitor.failed} pagamentos falharam no periodo.`,
      href: "/admin/finance",
      cta: "Revisar financeiro"
    });
  }

  if (highRiskSellers > 0 || blockedPayoutSellers > 0) {
    alerts.push({
      id: "risk-marketplace",
      severity: highRiskSellers >= 5 || blockedPayoutSellers > 0 ? "critical" : "warning",
      title: "Risco financeiro acima do baseline",
      detail: `${highRiskSellers} sellers em alto risco e ${blockedPayoutSellers} com payout bloqueado.`,
      href: "/admin/finance",
      cta: "Ajustar risco e holdback"
    });
  }

  if (criticalIncidentsRows.length > 0 || errorBudgetCritical > 0 || uncoveredShifts7d > 0) {
    alerts.push({
      id: "sre-readiness",
      severity: criticalIncidentsRows.length > 0 || errorBudgetCritical > 0 ? "critical" : "warning",
      title: "Maturidade SRE requer acao",
      detail: `${criticalIncidentsRows.length} incidentes criticos | ${errorBudgetCritical} budgets criticos | ${uncoveredShifts7d} turnos sem cobertura.`,
      href: "/admin/finance",
      cta: "Reforcar plantao"
    });
  }

  if (delayed > 0) {
    alerts.push({
      id: "shipping-delays",
      severity: delayed >= 5 ? "critical" : "warning",
      title: "Pedidos com atraso logistico",
      detail: `${delayed} pedidos excederam janela de frete.`,
      href: "/admin/orders",
      cta: "Priorizar expedicao"
    });
  }

  if (overdueTickets.length > 0) {
    alerts.push({
      id: "support-sla",
      severity: overdueTickets.length >= 10 ? "critical" : "warning",
      title: "SLA de suporte comprometido",
      detail: `${overdueTickets.length} tickets acima de 48h sem fechamento.`,
      href: "/admin/support",
      cta: "Atacar backlog"
    });
  }

  if (catalogMonitor.outOfStock > 0 || catalogMonitor.lowStock > 0) {
    alerts.push({
      id: "catalog-stock",
      severity: catalogMonitor.outOfStock >= 20 ? "critical" : "warning",
      title: "Risco de ruptura no catalogo",
      detail: `${catalogMonitor.outOfStock} sem estoque e ${catalogMonitor.lowStock} com baixo estoque.`,
      href: "/admin/products",
      cta: "Ajustar estoque"
    });
  }

  if (cartMonitor.abandoned > cartMonitor.converted && cartMonitor.abandoned >= 10) {
    alerts.push({
      id: "cart-abandonment",
      severity: "warning",
      title: "Abandono de carrinho elevado",
      detail: `${cartMonitor.abandoned} carrinhos abandonados no periodo.`,
      href: "/admin/carts",
      cta: "Recuperar carrinhos"
    });
  }

  if (pendingSellers.length > 0) {
    alerts.push({
      id: "pending-sellers",
      severity: "info",
      title: "Fila de parceiros pendente",
      detail: `${pendingSellers.length} parceiros aguardam aprovacao.`,
      href: "/admin/parceiros",
      cta: "Revisar parceiros"
    });
  }

  if (financeDrilldown.openIssues > 0) {
    alerts.push({
      id: "reconciliation-open-issues",
      severity: financeDrilldown.openIssues >= 5 ? "critical" : "warning",
      title: "Divergencias de reconciliacao abertas",
      detail: `${financeDrilldown.openIssues} issues aguardam tratamento financeiro.`,
      href: "/admin/finance",
      cta: "Abrir reconciliacao"
    });
  }

  if (financeDrilldown.integrityMismatches > 0) {
    alerts.push({
      id: "ledger-integrity-mismatch",
      severity: "critical",
      title: "Ledger com mismatch de integridade",
      detail: `${financeDrilldown.integrityMismatches} transacoes recentes nao fecham debito x credito.`,
      href: "/admin/finance",
      cta: "Auditar ledger"
    });
  }

  const alertRank: Record<AlertSeverity, number> = {
    critical: 0,
    warning: 1,
    info: 2
  };
  alerts.sort((a, b) => alertRank[a.severity] - alertRank[b.severity]);

  const recentOrders: RecentOrderPoint[] = ordersRecent.map((order) => ({
    id: String(order.id ?? ""),
    createdAt: typeof order.created_at === "string" ? order.created_at : null,
    status: toStatus(order.status) || "indefinido",
    amountCents: orderAmountCents(order),
    customerId: String(order.customer_id ?? order.buyer_id ?? "") || null
  }));

  const recentTickets: RecentTicketPoint[] = tickets.slice(0, 8).map((ticket) => {
    const createdAt = toDate(ticket.created_at);
    const ageHours = createdAt
      ? Math.max(0, Math.round((window.now.getTime() - createdAt.getTime()) / 3600000))
      : 0;

    return {
      id: String(ticket.id ?? ""),
      createdAt: typeof ticket.created_at === "string" ? ticket.created_at : null,
      status: toStatus(ticket.status) || "open",
      subject: String(ticket.subject ?? "Sem assunto"),
      userId: String(ticket.user_id ?? ticket.customer_id ?? "") || null,
      ageHours
    };
  });

  return {
    generatedAt: window.now.toISOString(),
    kpis: {
      gmvCents: currentOrders.gmvCents,
      gmvDelta: pctDelta(currentOrders.gmvCents, previousOrders.gmvCents),
      orders: currentOrders.totalOrders,
      ordersDelta: pctDelta(currentOrders.totalOrders, previousOrders.totalOrders),
      aovCents: currentOrders.aovCents,
      aovDelta: pctDelta(currentOrders.aovCents, previousOrders.aovCents),
      cancelRatePct: currentOrders.cancelRatePct,
      cancelRateDelta: improvementDelta(currentOrders.cancelRatePct, previousOrders.cancelRatePct),
      fulfillmentPct: currentOrders.fulfillmentPct,
      fulfillmentDelta: pctDelta(currentOrders.fulfillmentPct, previousOrders.fulfillmentPct),
      activeSellers,
      activeSellersDelta: pctDelta(currentNewActiveSellers, previousNewActiveSellers),
      openTickets: openTickets.length,
      openTicketsDelta: improvementDelta(openTicketsCurrent, openTicketsPrevious),
      overdueTickets: overdueTickets.length,
      overdueTicketsDelta: improvementDelta(overdueTicketsCurrent, overdueTicketsPrevious),
      avgFirstResponseMinutes: avgFirstResponseCurrent,
      avgFirstResponseDelta: improvementDelta(avgFirstResponseCurrent, avgFirstResponsePrevious),
      pendingProducts: pendingProducts.length,
      pendingSellers: pendingSellers.length
    },
    ordersTrend: Array.from(ordersTrendMap.values()),
    supportTrend: Array.from(supportTrendMap.values()),
    orderStatusBreakdown,
    funnel,
    shippingMonitor: {
      awaitingShipment,
      inTransit,
      delivered,
      delayed,
      queue: shippingQueue
    },
    paymentMonitor,
    catalogMonitor,
    cartMonitor,
    sreRiskMonitor,
    financeDrilldown,
    marketplaceReadiness,
    alerts,
    recentOrders,
    recentTickets
  };
}
