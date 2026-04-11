"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import PortalRoleSwitcher from "@/components/PortalRoleSwitcher";
import PortalBackButton from "@/components/navigation/PortalBackButton";
import { useAuth } from "@/lib/AuthContext";

type TabKey =
  | "dashboard"
  | "orders"
  | "returns"
  | "products"
  | "inventory"
  | "pricing"
  | "payouts"
  | "statement"
  | "growth"
  | "logistics"
  | "support"
  | "settings"
  | "campaigns"
  | "finance"
  | "alerts"
  | "automations"
  | "analytics"
  | "reputation"
  | "reports"
  | "help";

type RangeKey = "today" | "7d" | "30d" | "90d";

type PartnerDashboardResponse = {
  seller_id: string;
  range: RangeKey;
  generated_at: string;
  kpis: {
    gmv_cents: number;
    orders: number;
    items_active: number;
    sla_percent: number;
    seller_payout_cents: number;
    fee_cents: number;
    shipping_cents: number;
    discount_allocated_cents: number;
  };
};

type PartnerOrderRow = {
  id: string;
  order_id: string;
  seller_id: string;
  status: string;
  items_total_cents: number;
  shipping_cents: number;
  discount_allocated_cents: number;
  fee_cents: number;
  seller_payout_cents: number;
  tracking_code: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
};

type PartnerOrdersResponse = {
  total: number;
  items: PartnerOrderRow[];
};

type PartnerPayoutRow = {
  seller_order_id: string;
  order_id: string;
  items_total_cents: number;
  shipping_cents: number;
  discount_allocated_cents: number;
  fee_cents: number;
  seller_payout_cents: number;
  created_at: string;
  updated_at: string | null;
};

type PartnerPayoutsResponse = {
  total: number;
  summary: {
    orders: number;
    gmv_cents: number;
    items_total_cents: number;
    shipping_cents: number;
    discount_allocated_cents: number;
    fee_cents: number;
    seller_payout_cents: number;
  };
  items: PartnerPayoutRow[];
};

type PartnerProductRow = {
  id: string;
  seller_id: string;
  name: string;
  slug: string | null;
  status: string;
  price_cents: number;
  stock_quantity: number;
  category: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type PartnerProductsResponse = {
  total: number;
  summary: {
    active: number;
    low_stock: number;
    out_of_stock: number;
    pending_review: number;
  };
  items: PartnerProductRow[];
};

type PartnerSupportTicketRow = {
  id: string;
  order_id: string | null;
  status: string;
  priority: string;
  sla_deadline: string | null;
  created_at: string | null;
  assigned_to: string | null;
};

type PartnerSupportResponse = {
  total: number;
  summary: {
    open: number;
    waiting: number;
    in_review: number;
    resolved: number;
    overdue: number;
  };
  items: PartnerSupportTicketRow[];
};

type PartnerLogisticsItem = {
  seller_order_id: string;
  order_id: string;
  status: string;
  tracking_code: string | null;
  shipping_method: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
  sla_hours_elapsed: number;
  sla_state: "ok" | "risk" | "delayed";
};

type PartnerLogisticsResponse = {
  total: number;
  summary: {
    total: number;
    awaiting_shipment: number;
    in_transit: number;
    delivered: number;
    canceled: number;
    sla_risk: number;
    delayed: number;
  };
  items: PartnerLogisticsItem[];
};

type DashboardView = {
  storeName: string;
  score: number;
  cancelRate: number;
  kpis: {
    gmv: number;
    orders: number;
    aov: number;
    payout: number;
    items: number;
    sla: number;
  };
  deltas: {
    gmv: number;
    orders: number;
    aov: number;
    payout: number;
  };
  series: {
    gmv: number[];
    orders: number[];
  };
  todos: {
    waitingShipment: number;
    slaRisk: number;
  };
};

const navConfig: Array<{ section?: string; key?: TabKey; label?: string }> = [
  { section: "VISAO GERAL" },
  { key: "dashboard", label: "Overview" },
  { section: "VENDAS" },
  { key: "orders", label: "Pedidos" },
  { key: "returns", label: "Devolucoes" },
  { section: "CATALOGO" },
  { key: "products", label: "Produtos" },
  { key: "inventory", label: "Estoque" },
  { key: "pricing", label: "Precos & Promocoes" },
  { section: "FINANCEIRO" },
  { key: "payouts", label: "Repasse" },
  { key: "statement", label: "Extrato" },
  { section: "CRESCIMENTO" },
  { key: "growth", label: "Crescimento" },
  { section: "OPERACAO" },
  { key: "logistics", label: "Frete & SLA" },
  { section: "SUPORTE" },
  { key: "support", label: "Suporte" },
  { section: "GESTAO AVANCADA" },
  { key: "campaigns", label: "Campanhas & Ads" },
  { key: "finance", label: "Financeiro detalhado" },
  { key: "alerts", label: "Alertas & Regras" },
  { key: "automations", label: "Automacoes" },
  { key: "analytics", label: "Analytics avancado" },
  { key: "reputation", label: "Reputacao" },
  { key: "reports", label: "Relatorios" },
  { key: "help", label: "Central do vendedor" },
  { section: "CONFIGURACOES" },
  { key: "settings", label: "Configuracoes" }
];

const RANGE_KEYS: RangeKey[] = ["today", "7d", "30d", "90d"];
const TAB_KEYS: TabKey[] = navConfig
  .map((entry) => entry.key)
  .filter((value): value is TabKey => Boolean(value));

const normalizeTabParam = (value: string | null): TabKey =>
  value && TAB_KEYS.includes(value as TabKey) ? (value as TabKey) : "dashboard";

const normalizeRangeParam = (value: string | null): RangeKey =>
  value && RANGE_KEYS.includes(value as RangeKey) ? (value as RangeKey) : "30d";

const toNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const rangeDays = (range: RangeKey) => {
  if (range === "today") return 1;
  if (range === "7d") return 7;
  if (range === "90d") return 90;
  return 30;
};

const orderGmvCents = (row: PartnerOrderRow) =>
  Math.max(0, row.items_total_cents + row.shipping_cents - row.discount_allocated_cents);

const calcDelta = (current: number, previous: number) => {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Number((((current - previous) / Math.abs(previous)) * 100).toFixed(1));
};

const buildSeries = (orders: PartnerOrderRow[], range: RangeKey) => {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const hourMs = 60 * 60 * 1000;
  const buckets = range === "today" ? 24 : Math.min(30, rangeDays(range));
  const bucketMs =
    range === "today" ? hourMs : Math.ceil(rangeDays(range) / Math.max(buckets, 1)) * dayMs;
  const start = now - bucketMs * buckets;

  const gmv = Array.from({ length: buckets }, () => 0);
  const ordersSeries = Array.from({ length: buckets }, () => 0);

  orders.forEach((row) => {
    const ts = new Date(row.created_at).getTime();
    if (!Number.isFinite(ts) || ts < start || ts > now) return;
    const index = Math.min(buckets - 1, Math.max(0, Math.floor((ts - start) / bucketMs)));
    gmv[index] += orderGmvCents(row) / 100;
    ordersSeries[index] += 1;
  });

  return { gmv, orders: ordersSeries };
};

const statusLabel = (status: string) =>
  status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const statusTone = (statusRaw: string) => {
  const status = statusRaw.toLowerCase();
  if (status.includes("cancel")) return "text-rose-700 bg-rose-50 border-rose-200";
  if (status.includes("deliver")) return "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (status.includes("ship") || status.includes("transit")) return "text-sky-700 bg-sky-50 border-sky-200";
  return "text-amber-700 bg-amber-50 border-amber-200";
};

const normalizeStatus = (value: string | null | undefined) => String(value ?? "").trim().toLowerCase();

const isCanceledStatus = (statusRaw: string) => normalizeStatus(statusRaw).includes("cancel");
const isRefundedStatus = (statusRaw: string) => normalizeStatus(statusRaw).includes("refund");
const isReturnedStatus = (statusRaw: string) => normalizeStatus(statusRaw).includes("return");
const isDeliveredStatus = (statusRaw: string) => normalizeStatus(statusRaw).includes("deliver");
const isShippedStatus = (statusRaw: string) => {
  const status = normalizeStatus(statusRaw);
  return status.includes("ship") || status.includes("transit") || status.includes("out_for_delivery");
};

const average = (values: number[]) => {
  if (values.length === 0) return 0;
  const total = values.reduce((sum, value) => sum + value, 0);
  return total / values.length;
};

const slaStateTone = (state: PartnerLogisticsItem["sla_state"]) => {
  if (state === "delayed") return "text-rose-700 bg-rose-50 border-rose-200";
  if (state === "risk") return "text-amber-700 bg-amber-50 border-amber-200";
  return "text-emerald-700 bg-emerald-50 border-emerald-200";
};

const fmtBRL = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtDate = (iso: string | null | undefined) => {
  if (!iso) return "--";
  const parsed = new Date(iso);
  if (!Number.isFinite(parsed.getTime())) return "--";
  return parsed.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { cache: "no-store", signal });
  if (response.ok) return (await response.json()) as T;
  const payload = await response.json().catch(() => null);
  const message =
    payload && typeof payload === "object" && "error" in payload
      ? String((payload as { error?: unknown }).error ?? "Falha ao carregar.")
      : `HTTP ${response.status}`;
  throw new Error(message);
}

function buildDashboard(
  range: RangeKey,
  storeName: string,
  dashboard: PartnerDashboardResponse | null,
  allOrders: PartnerOrderRow[]
): DashboardView {
  if (!dashboard) {
    return {
      storeName,
      score: 0,
      cancelRate: 0,
      kpis: { gmv: 0, orders: 0, aov: 0, payout: 0, items: 0, sla: 0 },
      deltas: { gmv: 0, orders: 0, aov: 0, payout: 0 },
      series: { gmv: [0, 0], orders: [0, 0] },
      todos: { waitingShipment: 0, slaRisk: 0 }
    };
  }

  const now = Date.now();
  const days = rangeDays(range);
  const periodMs = days * 24 * 60 * 60 * 1000;
  const currentStart = now - periodMs;
  const previousStart = currentStart - periodMs;

  const current = allOrders.filter((row) => {
    const ts = new Date(row.created_at).getTime();
    return Number.isFinite(ts) && ts >= currentStart;
  });

  const previous = allOrders.filter((row) => {
    const ts = new Date(row.created_at).getTime();
    return Number.isFinite(ts) && ts >= previousStart && ts < currentStart;
  });

  const currentGmv = current.reduce((sum, row) => sum + orderGmvCents(row), 0);
  const previousGmv = previous.reduce((sum, row) => sum + orderGmvCents(row), 0);
  const currentOrders = current.length;
  const previousOrders = previous.length;
  const currentAov = currentOrders > 0 ? currentGmv / currentOrders : 0;
  const previousAov = previousOrders > 0 ? previousGmv / previousOrders : 0;
  const currentPayout = current.reduce((sum, row) => sum + Math.max(0, row.seller_payout_cents), 0);
  const previousPayout = previous.reduce((sum, row) => sum + Math.max(0, row.seller_payout_cents), 0);
  const waitingShipment = current.filter((row) => {
    const status = row.status.toLowerCase();
    return (
      status.includes("pending") ||
      status.includes("created") ||
      status.includes("process") ||
      status.includes("awaiting_shipment")
    );
  }).length;
  const slaRisk = current.filter((row) => {
    const status = row.status.toLowerCase();
    if (status.includes("deliver") || status.includes("ship")) return false;
    const ts = new Date(row.created_at).getTime();
    return Number.isFinite(ts) && now - ts > 42 * 60 * 60 * 1000;
  }).length;
  const cancelRate =
    currentOrders > 0
      ? Number(
          ((current.filter((row) => row.status.toLowerCase().includes("cancel")).length / currentOrders) * 100).toFixed(
            2
          )
        )
      : 0;

  return {
    storeName,
    score: Math.max(0, Math.min(100, Math.round(dashboard.kpis.sla_percent * 0.8 + (100 - cancelRate) * 0.2))),
    cancelRate,
    kpis: {
      gmv: currentGmv / 100,
      orders: currentOrders,
      aov: currentAov / 100,
      payout: currentPayout / 100,
      items: dashboard.kpis.items_active,
      sla: Number(toNumber(dashboard.kpis.sla_percent).toFixed(2))
    },
    deltas: {
      gmv: calcDelta(currentGmv, previousGmv),
      orders: calcDelta(currentOrders, previousOrders),
      aov: calcDelta(currentAov, previousAov),
      payout: calcDelta(currentPayout, previousPayout)
    },
    series: buildSeries(current, range),
    todos: { waitingShipment, slaRisk }
  };
}

export default function PartnerPortal() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, ready, logout } = useAuth();

  const tab = useMemo(() => normalizeTabParam(searchParams.get("tab")), [searchParams]);
  const range = useMemo(
    () => normalizeRangeParam(searchParams.get("range")),
    [searchParams]
  );
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dashboardPayload, setDashboardPayload] = useState<PartnerDashboardResponse | null>(null);
  const [ordersPayload, setOrdersPayload] = useState<PartnerOrdersResponse | null>(null);
  const [payoutsPayload, setPayoutsPayload] = useState<PartnerPayoutsResponse | null>(null);
  const [productsPayload, setProductsPayload] = useState<PartnerProductsResponse | null>(null);
  const [supportPayload, setSupportPayload] = useState<PartnerSupportResponse | null>(null);
  const [logisticsPayload, setLogisticsPayload] = useState<PartnerLogisticsResponse | null>(null);

  const replacePortalState = useCallback(
    (nextTab: TabKey, nextRange: RangeKey) => {
      const currentTab = searchParams.get("tab");
      const currentRange = searchParams.get("range");
      if (currentTab === nextTab && currentRange === nextRange) return;

      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", nextTab);
      params.set("range", nextRange);

      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    const rawTab = searchParams.get("tab");
    const rawRange = searchParams.get("range");
    const normalizedTab = normalizeTabParam(rawTab);
    const normalizedRange = normalizeRangeParam(rawRange);

    if (rawTab === normalizedTab && rawRange === normalizedRange) return;
    replacePortalState(normalizedTab, normalizedRange);
  }, [replacePortalState, searchParams]);

  useEffect(() => {
    if (!ready || !user) return;
    const controller = new AbortController();
    const fromDate = new Date(Date.now() - rangeDays(range) * 2 * 24 * 60 * 60 * 1000).toISOString();
    setLoading(true);
    setError(null);

    void Promise.all([
      fetchJson<PartnerDashboardResponse>(`/api/partner/dashboard?range=${range}`, controller.signal),
      fetchJson<PartnerOrdersResponse>(
        `/api/partner/orders?range=${range}&date_from=${encodeURIComponent(fromDate)}&page=1&page_size=500`,
        controller.signal
      ),
      fetchJson<PartnerPayoutsResponse>(`/api/partner/payouts?range=${range}&page=1&page_size=120`, controller.signal),
      fetchJson<PartnerProductsResponse>(`/api/partner/products?page=1&page_size=200`, controller.signal),
      fetchJson<PartnerSupportResponse>(`/api/partner/support?range=${range}&page=1&page_size=120`, controller.signal),
      fetchJson<PartnerLogisticsResponse>(`/api/partner/logistics?range=${range}&page=1&page_size=120`, controller.signal)
    ])
      .then(([dashboard, orders, payouts, products, support, logistics]) => {
        setDashboardPayload(dashboard);
        setOrdersPayload(orders);
        setPayoutsPayload(payouts);
        setProductsPayload(products);
        setSupportPayload(support);
        setLogisticsPayload(logistics);
      })
      .catch((loadError) => {
        if (controller.signal.aborted) return;
        const message = loadError instanceof Error ? loadError.message : "Falha ao carregar painel.";
        setError(message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [ready, user, range]);

  const dashboard = useMemo(
    () => buildDashboard(range, user?.sellerProfile?.storeName ?? "Loja Parceira", dashboardPayload, ordersPayload?.items ?? []),
    [range, user?.sellerProfile?.storeName, dashboardPayload, ordersPayload]
  );

  const currentOrders = useMemo(() => {
    const start = Date.now() - rangeDays(range) * 24 * 60 * 60 * 1000;
    return (ordersPayload?.items ?? []).filter((row) => {
      const ts = new Date(row.created_at).getTime();
      return Number.isFinite(ts) && ts >= start;
    });
  }, [ordersPayload, range]);

  const returnsOrders = useMemo(
    () =>
      currentOrders.filter(
        (row) => isRefundedStatus(row.status) || isReturnedStatus(row.status) || isCanceledStatus(row.status)
      ),
    [currentOrders]
  );

  const returnsSummary = useMemo(
    () => ({
      refunded: returnsOrders.filter((row) => isRefundedStatus(row.status)).length,
      returned: returnsOrders.filter((row) => isReturnedStatus(row.status)).length,
      canceled: returnsOrders.filter((row) => isCanceledStatus(row.status)).length
    }),
    [returnsOrders]
  );

  const inventoryRows = useMemo(() => {
    const items = productsPayload?.items ?? [];
    return [...items].sort((left, right) => left.stock_quantity - right.stock_quantity);
  }, [productsPayload]);

  const pricingStats = useMemo(() => {
    const prices = (productsPayload?.items ?? [])
      .map((item) => item.price_cents)
      .filter((value) => Number.isFinite(value) && value > 0);
    const min = prices.length > 0 ? Math.min(...prices) : 0;
    const max = prices.length > 0 ? Math.max(...prices) : 0;
    const avg = average(prices);
    return { min, max, avg };
  }, [productsPayload]);

  const growthByStatus = useMemo(() => {
    const aggregate = new Map<string, number>();
    currentOrders.forEach((row) => {
      const label = statusLabel(row.status);
      aggregate.set(label, (aggregate.get(label) ?? 0) + 1);
    });
    return Array.from(aggregate.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((left, right) => right.count - left.count)
      .slice(0, 6);
  }, [currentOrders]);

  const ordersByHour = useMemo(() => {
    const buckets = Array.from({ length: 24 }, () => 0);
    currentOrders.forEach((row) => {
      const parsed = new Date(row.created_at);
      if (!Number.isFinite(parsed.getTime())) return;
      buckets[parsed.getHours()] += 1;
    });
    return buckets;
  }, [currentOrders]);

  const demandPeakHour = useMemo(() => {
    if (ordersByHour.length === 0) return 0;
    let peakHour = 0;
    let peakValue = -1;
    ordersByHour.forEach((value, hour) => {
      if (value > peakValue) {
        peakValue = value;
        peakHour = hour;
      }
    });
    return peakHour;
  }, [ordersByHour]);

  const statementRows = useMemo(() => payoutsPayload?.items ?? [], [payoutsPayload]);

  const supportSummary = useMemo(
    () => ({
      total: toNumber(supportPayload?.total),
      open: toNumber(supportPayload?.summary?.open),
      waiting: toNumber(supportPayload?.summary?.waiting),
      inReview: toNumber(supportPayload?.summary?.in_review),
      resolved: toNumber(supportPayload?.summary?.resolved),
      overdue: toNumber(supportPayload?.summary?.overdue)
    }),
    [supportPayload]
  );

  const advancedAlerts = useMemo(() => {
    const delayedShipments = toNumber(logisticsPayload?.summary?.delayed);
    const slaRisk = dashboard.todos.slaRisk;
    const waitingShipment = dashboard.todos.waitingShipment;
    const overdueTickets = toNumber(supportPayload?.summary?.overdue);
    const lowStock = toNumber(productsPayload?.summary?.low_stock);
    const outOfStock = toNumber(productsPayload?.summary?.out_of_stock);

    return [
      {
        title: "Pedidos aguardando envio",
        value: waitingShipment,
        tone: waitingShipment > 0 ? "warn" : "ok",
        hint: "Pedidos ainda nao despachados no periodo."
      },
      {
        title: "SLA em risco",
        value: slaRisk,
        tone: slaRisk > 0 ? "warn" : "ok",
        hint: "Pedidos proximos do limite operacional."
      },
      {
        title: "Envios atrasados",
        value: delayedShipments,
        tone: delayedShipments > 0 ? "warn" : "ok",
        hint: "Rastreamentos com atraso efetivo."
      },
      {
        title: "Tickets vencidos",
        value: overdueTickets,
        tone: overdueTickets > 0 ? "warn" : "ok",
        hint: "Chamados acima do SLA de resposta."
      },
      {
        title: "Estoque baixo",
        value: lowStock,
        tone: lowStock > 0 ? "warn" : "ok",
        hint: "Produtos com cobertura critica."
      },
      {
        title: "Sem estoque",
        value: outOfStock,
        tone: outOfStock > 0 ? "warn" : "ok",
        hint: "Itens indisponiveis para venda."
      }
    ];
  }, [dashboard.todos.slaRisk, dashboard.todos.waitingShipment, logisticsPayload, productsPayload, supportPayload]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      router.replace("/login?tab=partner");
      router.refresh();
      setIsLoggingOut(false);
    }
  };

  useEffect(() => {
    setMobileNavOpen(false);
  }, [tab]);

  const handleTabChange = (nextTab: TabKey) => {
    replacePortalState(nextTab, range);
  };

  const handleRangeChange = (nextRange: RangeKey) => {
    replacePortalState(tab, nextRange);
  };

  return (
    <div className="min-h-screen overflow-x-clip bg-[#fbfbfd] text-slate-900">
      <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-3 py-2 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setMobileNavOpen((current) => !current)}
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700"
          >
            {mobileNavOpen ? "Fechar menu" : "Menu"}
          </button>
          <p className="truncate text-sm font-medium text-slate-700">{dashboard.storeName}</p>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 disabled:opacity-60"
          >
            {isLoggingOut ? "Saindo..." : "Sair"}
          </button>
        </div>
      </div>

      <div className="flex min-h-screen">
        {mobileNavOpen ? (
          <button
            type="button"
            aria-label="Fechar menu lateral"
            onClick={() => setMobileNavOpen(false)}
            className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
          />
        ) : null}

        <aside
          className={`fixed inset-y-0 left-0 z-40 w-[300px] border-r border-white/12 bg-[#090a0f] p-4 text-white transition-transform duration-200 lg:static lg:translate-x-0 ${
            mobileNavOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="space-y-3">
            <p className="text-xs tracking-[0.3em] text-white/82">BelaPop</p>
            <h1 className="text-xl">Portal do Parceiro</h1>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p className="text-sm">{dashboard.storeName}</p>
              <p className="mt-1 text-xs text-white/92">Parceiro â€¢ Score {dashboard.score}/100</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/25 px-2 py-1 text-xs">SLA {dashboard.kpis.sla.toFixed(1)}%</span>
                <span className="rounded-full border border-white/25 px-2 py-1 text-xs">Cancel. {dashboard.cancelRate.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <nav className="mt-5 max-h-[calc(100vh-220px)] space-y-1 overflow-y-auto pr-1">
            {navConfig.map((entry, idx) =>
              entry.section ? (
                <p key={`${entry.section}-${idx}`} className="pt-3 text-[11px] tracking-[0.24em] text-white/68">
                  {entry.section}
                </p>
              ) : (
                <button
                  key={entry.key}
                  onClick={() => handleTabChange(entry.key as TabKey)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm ${
                    tab === entry.key
                      ? "border border-[#d14a7a]/65 bg-[#d14a7a]/20 text-white shadow-[0_0_0_1px_rgba(209,74,122,0.08)]"
                      : "border border-transparent text-white/95 hover:border-white/15 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span>{entry.label}</span>
                  {entry.key === "orders" && dashboard.todos.waitingShipment > 0 ? (
                    <span className="rounded-full border border-white/25 px-2 py-0.5 text-xs">{dashboard.todos.waitingShipment}</span>
                  ) : null}
                  {entry.key === "logistics" && dashboard.todos.slaRisk > 0 ? (
                    <span className="rounded-full border border-white/25 px-2 py-0.5 text-xs">{dashboard.todos.slaRisk}</span>
                  ) : null}
                  {entry.key === "support" && supportSummary.overdue > 0 ? (
                    <span className="rounded-full border border-white/25 px-2 py-0.5 text-xs">{supportSummary.overdue}</span>
                  ) : null}
                </button>
              )
            )}
          </nav>

          <PortalRoleSwitcher variant="dark" className="mt-4" compact />

          <button
            className="mt-6 w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm text-white/90 transition hover:border-white/35 hover:bg-white/10"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? "Saindo..." : "Sair"}
          </button>
        </aside>

        <main className="w-full flex-1 p-3 sm:p-4 lg:p-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <PortalBackButton fallbackHref="/" className="mb-3" />
                <p className="text-xs tracking-[0.24em] text-slate-500">PORTAL DO PARCEIRO</p>
                <h2 className="mt-1 text-2xl sm:text-3xl">{titleFor(tab)}</h2>
                <p className="mt-1 text-sm text-slate-500">Operacao premium, sem atrito.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {(["today", "7d", "30d", "90d"] as RangeKey[]).map((item) => (
                  <button
                    key={item}
                    onClick={() => handleRangeChange(item)}
                    className={`rounded-xl border px-3 py-2 text-sm ${
                      range === item ? "border-[#d14a7a]/40 bg-[#d14a7a]/10" : "border-slate-200 bg-white"
                    }`}
                  >
                    {item === "today" ? "Hoje" : item}
                  </button>
                ))}
                <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" onClick={() => handleTabChange("products")}>
                  + Produto
                </button>
                <button className="rounded-xl border border-[#d14a7a]/50 bg-[#d14a7a]/10 px-3 py-2 text-sm" onClick={() => handleTabChange("campaigns")}>
                  Criar promocao
                </button>
                <PortalRoleSwitcher variant="light" compact />
                <button
                  className="hidden rounded-xl border border-[#d14a7a]/30 bg-[#d14a7a]/5 px-3 py-2 text-sm lg:inline-flex"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? "Saindo..." : "Sair"}
                </button>
              </div>
            </div>
          </div>

          {error ? (
            <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
          ) : null}

          {loading ? (
            <div className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">Carregando dados...</div>
          ) : null}

          <div className="mt-4 space-y-4">
            {tab === "dashboard" ? (
              <>
                <section className="grid grid-cols-1 gap-3 xl:grid-cols-5">
                  <Kpi label="Receita (GMV)" value={fmtBRL(dashboard.kpis.gmv)} delta={dashboard.deltas.gmv} />
                  <Kpi label="Pedidos" value={String(dashboard.kpis.orders)} delta={dashboard.deltas.orders} />
                  <Kpi label="Ticket medio" value={fmtBRL(dashboard.kpis.aov)} delta={dashboard.deltas.aov} />
                  <Kpi label="Repasse estimado" value={fmtBRL(dashboard.kpis.payout)} delta={dashboard.deltas.payout} />
                  <Kpi label="Itens ativos" value={String(dashboard.kpis.items)} delta={0} />
                </section>

                <section className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                  <Card title="Crescimento (GMV)" subtitle="Evolucao no periodo">
                    <Sparkline data={dashboard.series.gmv} />
                  </Card>
                  <Card title="Pedidos" subtitle="Volume no periodo">
                    <Bars data={dashboard.series.orders} />
                  </Card>
                </section>

                <section className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                  <Card title="Acoes prioritarias" subtitle="Checklist operacional">
                    <div className="space-y-2">
                      <Todo label="Pedidos aguardando envio" value={dashboard.todos.waitingShipment} />
                      <Todo label="SLA em risco (24h)" value={dashboard.todos.slaRisk} />
                    </div>
                  </Card>
                  <Card title="Financeiro rapido" subtitle="Resumo do periodo">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between"><span>Taxas do periodo</span><b>{fmtBRL(toNumber(dashboardPayload?.kpis.fee_cents) / 100)}</b></div>
                      <div className="flex items-center justify-between"><span>Frete do periodo</span><b>{fmtBRL(toNumber(dashboardPayload?.kpis.shipping_cents) / 100)}</b></div>
                      <div className="flex items-center justify-between"><span>Descontos alocados</span><b>{fmtBRL(toNumber(dashboardPayload?.kpis.discount_allocated_cents) / 100)}</b></div>
                    </div>
                  </Card>
                </section>
              </>
            ) : null}

            {tab === "orders" ? (
              <Card title="Pedidos do lojista" subtitle="Dados reais de /api/partner/orders">
                {currentOrders.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-sm text-slate-500">
                    Sem pedidos no periodo selecionado.
                  </p>
                ) : (
                  <div className="overflow-auto">
                    <table className="min-w-full border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-[0.18em] text-slate-500">
                          <th className="px-2 py-2">Seller Order</th>
                          <th className="px-2 py-2">Order</th>
                          <th className="px-2 py-2">Status</th>
                          <th className="px-2 py-2 text-right">GMV</th>
                          <th className="px-2 py-2 text-right">Repasse</th>
                          <th className="px-2 py-2 text-right">Criado em</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentOrders.map((row) => (
                          <tr key={row.id} className="border-b border-slate-100">
                            <td className="px-2 py-2 font-medium">#{row.id.slice(0, 8)}</td>
                            <td className="px-2 py-2">#{row.order_id.slice(0, 8)}</td>
                            <td className="px-2 py-2">
                              <span className={`rounded-full border px-2 py-1 text-xs ${statusTone(row.status)}`}>
                                {statusLabel(row.status)}
                              </span>
                            </td>
                            <td className="px-2 py-2 text-right">{fmtBRL(orderGmvCents(row) / 100)}</td>
                            <td className="px-2 py-2 text-right">{fmtBRL(row.seller_payout_cents / 100)}</td>
                            <td className="px-2 py-2 text-right">{fmtDate(row.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            ) : null}

            {tab === "returns" ? (
              <Card title="Devolucoes & Reembolsos" subtitle="Derivado de statuses reais em /api/partner/orders">
                <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-4">
                  <Summary label="Com ocorrencia" value={String(returnsOrders.length)} />
                  <Summary label="Reembolsados" value={String(returnsSummary.refunded)} />
                  <Summary label="Devolvidos" value={String(returnsSummary.returned)} />
                  <Summary label="Cancelados" value={String(returnsSummary.canceled)} />
                </div>
                {returnsOrders.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-sm text-slate-500">
                    Nenhuma devolucao, cancelamento ou reembolso no periodo selecionado.
                  </p>
                ) : (
                  <div className="overflow-auto">
                    <table className="min-w-full border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-[0.18em] text-slate-500">
                          <th className="px-2 py-2">Seller Order</th>
                          <th className="px-2 py-2">Order</th>
                          <th className="px-2 py-2">Status</th>
                          <th className="px-2 py-2 text-right">GMV</th>
                          <th className="px-2 py-2 text-right">Repasse</th>
                          <th className="px-2 py-2 text-right">Criado em</th>
                        </tr>
                      </thead>
                      <tbody>
                        {returnsOrders.map((row) => (
                          <tr key={row.id} className="border-b border-slate-100">
                            <td className="px-2 py-2 font-medium">#{row.id.slice(0, 8)}</td>
                            <td className="px-2 py-2">#{row.order_id.slice(0, 8)}</td>
                            <td className="px-2 py-2">
                              <span className={`rounded-full border px-2 py-1 text-xs ${statusTone(row.status)}`}>
                                {statusLabel(row.status)}
                              </span>
                            </td>
                            <td className="px-2 py-2 text-right">{fmtBRL(orderGmvCents(row) / 100)}</td>
                            <td className="px-2 py-2 text-right">{fmtBRL(row.seller_payout_cents / 100)}</td>
                            <td className="px-2 py-2 text-right">{fmtDate(row.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            ) : null}

            {tab === "payouts" ? (
              <Card title="Repasses" subtitle="Dados reais de /api/partner/payouts">
                <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-4">
                  <Summary label="Pedidos" value={String(toNumber(payoutsPayload?.summary?.orders))} />
                  <Summary label="GMV" value={fmtBRL(toNumber(payoutsPayload?.summary?.gmv_cents) / 100)} />
                  <Summary label="Taxas" value={fmtBRL(toNumber(payoutsPayload?.summary?.fee_cents) / 100)} />
                  <Summary label="Repasse" value={fmtBRL(toNumber(payoutsPayload?.summary?.seller_payout_cents) / 100)} />
                </div>
                {(payoutsPayload?.items ?? []).length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-sm text-slate-500">
                    Sem repasses no periodo selecionado.
                  </p>
                ) : (
                  <div className="overflow-auto">
                    <table className="min-w-full border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-[0.18em] text-slate-500">
                          <th className="px-2 py-2">Seller Order</th>
                          <th className="px-2 py-2">Order</th>
                          <th className="px-2 py-2 text-right">Itens</th>
                          <th className="px-2 py-2 text-right">Frete</th>
                          <th className="px-2 py-2 text-right">Fee</th>
                          <th className="px-2 py-2 text-right">Repasse</th>
                          <th className="px-2 py-2 text-right">Atualizado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(payoutsPayload?.items ?? []).map((row) => (
                          <tr key={row.seller_order_id} className="border-b border-slate-100">
                            <td className="px-2 py-2 font-medium">#{row.seller_order_id.slice(0, 8)}</td>
                            <td className="px-2 py-2">#{row.order_id.slice(0, 8)}</td>
                            <td className="px-2 py-2 text-right">{fmtBRL(row.items_total_cents / 100)}</td>
                            <td className="px-2 py-2 text-right">{fmtBRL(row.shipping_cents / 100)}</td>
                            <td className="px-2 py-2 text-right">{fmtBRL(row.fee_cents / 100)}</td>
                            <td className="px-2 py-2 text-right">{fmtBRL(row.seller_payout_cents / 100)}</td>
                            <td className="px-2 py-2 text-right">{fmtDate(row.updated_at ?? row.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            ) : null}

            {tab === "statement" ? (
              <Card title="Extrato financeiro" subtitle="Movimentacoes reais a partir de /api/partner/payouts">
                <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-4">
                  <Summary label="Lancamentos" value={String(statementRows.length)} />
                  <Summary label="Itens" value={fmtBRL(toNumber(payoutsPayload?.summary?.items_total_cents) / 100)} />
                  <Summary label="Descontos" value={fmtBRL(toNumber(payoutsPayload?.summary?.discount_allocated_cents) / 100)} />
                  <Summary label="Liquido" value={fmtBRL(toNumber(payoutsPayload?.summary?.seller_payout_cents) / 100)} />
                </div>
                {statementRows.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-sm text-slate-500">
                    Sem movimentacoes para montar o extrato no periodo selecionado.
                  </p>
                ) : (
                  <div className="overflow-auto">
                    <table className="min-w-full border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-[0.18em] text-slate-500">
                          <th className="px-2 py-2">Data</th>
                          <th className="px-2 py-2">Descricao</th>
                          <th className="px-2 py-2 text-right">Itens</th>
                          <th className="px-2 py-2 text-right">Frete</th>
                          <th className="px-2 py-2 text-right">Fee</th>
                          <th className="px-2 py-2 text-right">Liquido</th>
                        </tr>
                      </thead>
                      <tbody>
                        {statementRows.map((row) => (
                          <tr key={row.seller_order_id} className="border-b border-slate-100">
                            <td className="px-2 py-2">{fmtDate(row.updated_at ?? row.created_at)}</td>
                            <td className="px-2 py-2">
                              Repasse seller order #{row.seller_order_id.slice(0, 8)} (order #{row.order_id.slice(0, 8)})
                            </td>
                            <td className="px-2 py-2 text-right">{fmtBRL(row.items_total_cents / 100)}</td>
                            <td className="px-2 py-2 text-right">{fmtBRL(row.shipping_cents / 100)}</td>
                            <td className="px-2 py-2 text-right">{fmtBRL(row.fee_cents / 100)}</td>
                            <td className="px-2 py-2 text-right">{fmtBRL(row.seller_payout_cents / 100)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            ) : null}

            {tab === "products" ? (
              <Card title="Produtos" subtitle="Dados reais de /api/partner/products">
                <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-4">
                  <Summary label="Ativos" value={String(toNumber(productsPayload?.summary?.active))} />
                  <Summary label="Estoque baixo" value={String(toNumber(productsPayload?.summary?.low_stock))} />
                  <Summary label="Sem estoque" value={String(toNumber(productsPayload?.summary?.out_of_stock))} />
                  <Summary label="Pendentes" value={String(toNumber(productsPayload?.summary?.pending_review))} />
                </div>
                {(productsPayload?.items ?? []).length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-sm text-slate-500">
                    Nenhum produto encontrado para este lojista.
                  </p>
                ) : (
                  <div className="overflow-auto">
                    <table className="min-w-full border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-[0.18em] text-slate-500">
                          <th className="px-2 py-2">Produto</th>
                          <th className="px-2 py-2">Status</th>
                          <th className="px-2 py-2 text-right">Preco</th>
                          <th className="px-2 py-2 text-right">Estoque</th>
                          <th className="px-2 py-2">Categoria</th>
                          <th className="px-2 py-2 text-right">Atualizado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(productsPayload?.items ?? []).map((row) => (
                          <tr key={row.id} className="border-b border-slate-100">
                            <td className="px-2 py-2 font-medium">{row.name}</td>
                            <td className="px-2 py-2">
                              <span className={`rounded-full border px-2 py-1 text-xs ${statusTone(row.status)}`}>
                                {statusLabel(row.status)}
                              </span>
                            </td>
                            <td className="px-2 py-2 text-right">{fmtBRL(row.price_cents / 100)}</td>
                            <td className="px-2 py-2 text-right">{row.stock_quantity}</td>
                            <td className="px-2 py-2">{row.category ?? "--"}</td>
                            <td className="px-2 py-2 text-right">{fmtDate(row.updated_at ?? row.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            ) : null}

            {tab === "inventory" ? (
              <Card title="Estoque" subtitle="Visao operacional baseada em /api/partner/products">
                <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-4">
                  <Summary label="Produtos" value={String(toNumber(productsPayload?.total))} />
                  <Summary label="Estoque baixo" value={String(toNumber(productsPayload?.summary?.low_stock))} />
                  <Summary label="Sem estoque" value={String(toNumber(productsPayload?.summary?.out_of_stock))} />
                  <Summary label="Ativos" value={String(toNumber(productsPayload?.summary?.active))} />
                </div>
                {inventoryRows.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-sm text-slate-500">
                    Nenhum produto disponivel para analise de estoque.
                  </p>
                ) : (
                  <div className="overflow-auto">
                    <table className="min-w-full border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-[0.18em] text-slate-500">
                          <th className="px-2 py-2">Produto</th>
                          <th className="px-2 py-2">Status</th>
                          <th className="px-2 py-2 text-right">Estoque</th>
                          <th className="px-2 py-2 text-right">Preco</th>
                          <th className="px-2 py-2">Sinal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inventoryRows.slice(0, 120).map((row) => {
                          const stockTone =
                            row.stock_quantity <= 0
                              ? "text-rose-700 bg-rose-50 border-rose-200"
                              : row.stock_quantity <= 5
                                ? "text-amber-700 bg-amber-50 border-amber-200"
                                : "text-emerald-700 bg-emerald-50 border-emerald-200";
                          const stockLabel =
                            row.stock_quantity <= 0 ? "Sem estoque" : row.stock_quantity <= 5 ? "Baixo" : "Saudavel";
                          return (
                            <tr key={row.id} className="border-b border-slate-100">
                              <td className="px-2 py-2 font-medium">{row.name}</td>
                              <td className="px-2 py-2">{statusLabel(row.status)}</td>
                              <td className="px-2 py-2 text-right">{row.stock_quantity}</td>
                              <td className="px-2 py-2 text-right">{fmtBRL(row.price_cents / 100)}</td>
                              <td className="px-2 py-2">
                                <span className={`rounded-full border px-2 py-1 text-xs ${stockTone}`}>{stockLabel}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            ) : null}

            {tab === "pricing" ? (
              <Card title="Precos & Promocoes" subtitle="Baseado no catalogo real de /api/partner/products">
                <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-4">
                  <Summary label="Preco medio" value={fmtBRL(pricingStats.avg / 100)} />
                  <Summary label="Menor preco" value={fmtBRL(pricingStats.min / 100)} />
                  <Summary label="Maior preco" value={fmtBRL(pricingStats.max / 100)} />
                  <Summary label="Produtos ativos" value={String(toNumber(productsPayload?.summary?.active))} />
                </div>
                {(productsPayload?.items ?? []).length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-sm text-slate-500">
                    Sem produtos para analise de precos.
                  </p>
                ) : (
                  <div className="overflow-auto">
                    <table className="min-w-full border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-[0.18em] text-slate-500">
                          <th className="px-2 py-2">Produto</th>
                          <th className="px-2 py-2">Categoria</th>
                          <th className="px-2 py-2 text-right">Preco</th>
                          <th className="px-2 py-2 text-right">Estoque</th>
                          <th className="px-2 py-2">Faixa</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(productsPayload?.items ?? [])
                          .slice()
                          .sort((left, right) => right.price_cents - left.price_cents)
                          .slice(0, 120)
                          .map((row) => {
                            const priceBand =
                              row.price_cents >= pricingStats.avg * 1.25
                                ? "Premium"
                                : row.price_cents <= pricingStats.avg * 0.75
                                  ? "Entrada"
                                  : "Media";
                            return (
                              <tr key={row.id} className="border-b border-slate-100">
                                <td className="px-2 py-2 font-medium">{row.name}</td>
                                <td className="px-2 py-2">{row.category ?? "--"}</td>
                                <td className="px-2 py-2 text-right">{fmtBRL(row.price_cents / 100)}</td>
                                <td className="px-2 py-2 text-right">{row.stock_quantity}</td>
                                <td className="px-2 py-2">{priceBand}</td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            ) : null}

            {tab === "support" ? (
              <Card title="Suporte" subtitle="Dados reais de /api/partner/support">
                <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-5">
                  <Summary label="Abertos" value={String(supportSummary.open)} />
                  <Summary label="Aguardando" value={String(supportSummary.waiting)} />
                  <Summary label="Em analise" value={String(supportSummary.inReview)} />
                  <Summary label="Resolvidos" value={String(supportSummary.resolved)} />
                  <Summary label="Vencidos SLA" value={String(supportSummary.overdue)} />
                </div>
                {(supportPayload?.items ?? []).length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-sm text-slate-500">
                    Nenhum chamado encontrado no periodo selecionado.
                  </p>
                ) : (
                  <div className="overflow-auto">
                    <table className="min-w-full border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-[0.18em] text-slate-500">
                          <th className="px-2 py-2">Ticket</th>
                          <th className="px-2 py-2">Order</th>
                          <th className="px-2 py-2">Status</th>
                          <th className="px-2 py-2">Prioridade</th>
                          <th className="px-2 py-2 text-right">SLA</th>
                          <th className="px-2 py-2 text-right">Criado em</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(supportPayload?.items ?? []).map((row) => (
                          <tr key={row.id} className="border-b border-slate-100">
                            <td className="px-2 py-2 font-medium">#{row.id.slice(0, 8)}</td>
                            <td className="px-2 py-2">{row.order_id ? `#${row.order_id.slice(0, 8)}` : "--"}</td>
                            <td className="px-2 py-2">
                              <span className={`rounded-full border px-2 py-1 text-xs ${statusTone(row.status)}`}>
                                {statusLabel(row.status)}
                              </span>
                            </td>
                            <td className="px-2 py-2">{statusLabel(row.priority)}</td>
                            <td className="px-2 py-2 text-right">{fmtDate(row.sla_deadline)}</td>
                            <td className="px-2 py-2 text-right">{fmtDate(row.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            ) : null}

            {tab === "logistics" ? (
              <Card title="Frete & SLA" subtitle="Dados reais de /api/partner/logistics">
                <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-6">
                  <Summary label="Total" value={String(toNumber(logisticsPayload?.summary?.total))} />
                  <Summary label="Aguardando envio" value={String(toNumber(logisticsPayload?.summary?.awaiting_shipment))} />
                  <Summary label="Em transito" value={String(toNumber(logisticsPayload?.summary?.in_transit))} />
                  <Summary label="Entregues" value={String(toNumber(logisticsPayload?.summary?.delivered))} />
                  <Summary label="SLA risco" value={String(toNumber(logisticsPayload?.summary?.sla_risk))} />
                  <Summary label="Atrasados" value={String(toNumber(logisticsPayload?.summary?.delayed))} />
                </div>
                {(logisticsPayload?.items ?? []).length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-sm text-slate-500">
                    Nenhum envio encontrado no periodo selecionado.
                  </p>
                ) : (
                  <div className="overflow-auto">
                    <table className="min-w-full border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-[0.18em] text-slate-500">
                          <th className="px-2 py-2">Seller Order</th>
                          <th className="px-2 py-2">Order</th>
                          <th className="px-2 py-2">Status</th>
                          <th className="px-2 py-2">Tracking</th>
                          <th className="px-2 py-2">SLA</th>
                          <th className="px-2 py-2 text-right">Horas</th>
                          <th className="px-2 py-2 text-right">Criado em</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(logisticsPayload?.items ?? []).map((row) => (
                          <tr key={row.seller_order_id} className="border-b border-slate-100">
                            <td className="px-2 py-2 font-medium">#{row.seller_order_id.slice(0, 8)}</td>
                            <td className="px-2 py-2">#{row.order_id.slice(0, 8)}</td>
                            <td className="px-2 py-2">
                              <span className={`rounded-full border px-2 py-1 text-xs ${statusTone(row.status)}`}>
                                {statusLabel(row.status)}
                              </span>
                            </td>
                            <td className="px-2 py-2">{row.tracking_code ?? "--"}</td>
                            <td className="px-2 py-2">
                              <span className={`rounded-full border px-2 py-1 text-xs ${slaStateTone(row.sla_state)}`}>
                                {row.sla_state === "ok" ? "OK" : row.sla_state === "risk" ? "Risco" : "Atrasado"}
                              </span>
                            </td>
                            <td className="px-2 py-2 text-right">{row.sla_hours_elapsed.toFixed(1)}h</td>
                            <td className="px-2 py-2 text-right">{fmtDate(row.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            ) : null}

            {tab === "growth" ? (
              <>
                <section className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                  <Card title="GMV no periodo" subtitle="Serie real derivada de /api/partner/orders">
                    <Sparkline data={dashboard.series.gmv} />
                  </Card>
                  <Card title="Pedidos por faixa" subtitle="Distribuicao real de status">
                    {growthByStatus.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-sm text-slate-500">
                        Sem pedidos para calcular crescimento no periodo.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {growthByStatus.map((entry) => (
                          <div key={entry.label} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                            <span>{entry.label}</span>
                            <span className="font-medium">{entry.count}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </section>
                <Card title="Leituras de crescimento" subtitle="Sinais operacionais atuais">
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
                    <Summary label="GMV atual" value={fmtBRL(dashboard.kpis.gmv)} />
                    <Summary label="Delta GMV" value={`${dashboard.deltas.gmv}%`} />
                    <Summary label="Delta pedidos" value={`${dashboard.deltas.orders}%`} />
                    <Summary label="SLA" value={`${dashboard.kpis.sla.toFixed(2)}%`} />
                  </div>
                </Card>
              </>
            ) : null}

            {tab === "settings" ? (
              <Card title="Configuracoes do parceiro" subtitle="Identidade e links de acao do ambiente real">
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  <Summary label="Loja" value={dashboard.storeName} />
                  <Summary label="Email da conta" value={user?.email ?? "--"} />
                  <Summary label="SLA atual" value={`${dashboard.kpis.sla.toFixed(2)}%`} />
                  <Summary label="Score" value={`${dashboard.score}/100`} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                    onClick={() => router.push("/parceiro/onboarding")}
                  >
                    Editar dados da loja
                  </button>
                  <button
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                    onClick={() => router.push("/parceiro/suporte")}
                  >
                    Abrir suporte parceiro
                  </button>
                </div>
              </Card>
            ) : null}

            {tab === "campaigns" ? (
              <Card title="Campanhas & Ads" subtitle="Centro de campanhas baseado em pedidos, catalogo e estoque reais">
                <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-4">
                  <Summary label="GMV atual" value={fmtBRL(dashboard.kpis.gmv)} />
                  <Summary label="Pedidos" value={String(dashboard.kpis.orders)} />
                  <Summary label="Ticket medio" value={fmtBRL(dashboard.kpis.aov)} />
                  <Summary label="Delta GMV" value={`${dashboard.deltas.gmv}%`} />
                </div>
                <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm">
                    <p className="font-medium">Sugestoes automaticas</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-600">
                      <li>Ativar promocao em produtos com estoque alto e giro baixo.</li>
                      <li>Reforcar campanhas nas janelas de maior demanda de pedidos ({String(demandPeakHour).padStart(2, "0")}:00).</li>
                      <li>Criar bundles para elevar ticket medio no periodo atual.</li>
                    </ul>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm">
                    <p className="font-medium">Acoes rapidas</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button className="rounded-xl border border-slate-200 bg-white px-3 py-2" onClick={() => handleTabChange("pricing")}>
                        Ajustar precos
                      </button>
                      <button className="rounded-xl border border-slate-200 bg-white px-3 py-2" onClick={() => handleTabChange("products")}>
                        Selecionar produtos
                      </button>
                      <button className="rounded-xl border border-slate-200 bg-white px-3 py-2" onClick={() => handleTabChange("growth")}>
                        Ver impacto
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ) : null}

            {tab === "finance" ? (
              <Card title="Financeiro detalhado" subtitle="Lotes de repasse e composicao financeira por seller order">
                <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-5">
                  <Summary label="Pedidos no lote" value={String(toNumber(payoutsPayload?.summary?.orders))} />
                  <Summary label="Itens" value={fmtBRL(toNumber(payoutsPayload?.summary?.items_total_cents) / 100)} />
                  <Summary label="Frete" value={fmtBRL(toNumber(payoutsPayload?.summary?.shipping_cents) / 100)} />
                  <Summary label="Taxas" value={fmtBRL(toNumber(payoutsPayload?.summary?.fee_cents) / 100)} />
                  <Summary label="Repasse liquido" value={fmtBRL(toNumber(payoutsPayload?.summary?.seller_payout_cents) / 100)} />
                </div>
                {statementRows.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-sm text-slate-500">
                    Sem dados financeiros detalhados para o periodo selecionado.
                  </p>
                ) : (
                  <div className="overflow-auto">
                    <table className="min-w-full border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-[0.18em] text-slate-500">
                          <th className="px-2 py-2">Seller Order</th>
                          <th className="px-2 py-2">Order</th>
                          <th className="px-2 py-2 text-right">Itens</th>
                          <th className="px-2 py-2 text-right">Frete</th>
                          <th className="px-2 py-2 text-right">Desconto</th>
                          <th className="px-2 py-2 text-right">Taxa</th>
                          <th className="px-2 py-2 text-right">Repasse</th>
                        </tr>
                      </thead>
                      <tbody>
                        {statementRows.slice(0, 80).map((row) => (
                          <tr key={row.seller_order_id} className="border-b border-slate-100">
                            <td className="px-2 py-2 font-medium">#{row.seller_order_id.slice(0, 8)}</td>
                            <td className="px-2 py-2">#{row.order_id.slice(0, 8)}</td>
                            <td className="px-2 py-2 text-right">{fmtBRL(row.items_total_cents / 100)}</td>
                            <td className="px-2 py-2 text-right">{fmtBRL(row.shipping_cents / 100)}</td>
                            <td className="px-2 py-2 text-right">{fmtBRL(row.discount_allocated_cents / 100)}</td>
                            <td className="px-2 py-2 text-right">{fmtBRL(row.fee_cents / 100)}</td>
                            <td className="px-2 py-2 text-right">{fmtBRL(row.seller_payout_cents / 100)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            ) : null}

            {tab === "alerts" ? (
              <Card title="Alertas & Regras" subtitle="Fila priorizada de risco operacional">
                <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                  {advancedAlerts.map((item) => (
                    <div key={item.title} className="rounded-xl border border-slate-200 bg-white px-3 py-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{item.title}</p>
                        <span
                          className={`rounded-full border px-2 py-1 text-xs ${
                            item.tone === "warn"
                              ? "border-amber-200 bg-amber-50 text-amber-700"
                              : "border-emerald-200 bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {item.value}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{item.hint}</p>
                    </div>
                  ))}
                </div>
              </Card>
            ) : null}

            {tab === "automations" ? (
              <Card title="Automacoes" subtitle="Playbooks internos para operacao do seller">
                <div className="space-y-2">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm">
                    <p className="font-medium">Regra: lembrar envio em risco de SLA</p>
                    <p className="mt-1 text-slate-600">
                      Estado atual: {dashboard.todos.slaRisk > 0 ? "Ativa com itens em risco" : "Ativa (sem riscos no momento)"}.
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm">
                    <p className="font-medium">Regra: alerta de estoque baixo</p>
                    <p className="mt-1 text-slate-600">
                      Estado atual: {toNumber(productsPayload?.summary?.low_stock) > 0 ? "Ativa com produtos criticos" : "Ativa (estoque saudavel)"}.
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm">
                    <p className="font-medium">Regra: escalonamento de suporte vencido</p>
                    <p className="mt-1 text-slate-600">
                      Estado atual: {toNumber(supportPayload?.summary?.overdue) > 0 ? "Ativa com tickets vencidos" : "Ativa (SLA em dia)"}.
                    </p>
                  </div>
                </div>
              </Card>
            ) : null}

            {tab === "analytics" ? (
              <>
                <section className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                  <Card title="Serie de GMV" subtitle="Dados reais do periodo selecionado">
                    <Sparkline data={dashboard.series.gmv} />
                  </Card>
                  <Card title="Pedidos por faixa horaria" subtitle="Demanda real derivada de /api/partner/orders">
                    <Bars data={ordersByHour} />
                  </Card>
                </section>
                <Card title="Analise consolidada" subtitle="Leituras reais de pedidos, receita e operacao">
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-5">
                    <Summary label="Pedidos" value={String(currentOrders.length)} />
                    <Summary label="Janela de demanda" value={`${String(demandPeakHour).padStart(2, "0")}:00`} />
                    <Summary label="Ticket medio" value={fmtBRL(dashboard.kpis.aov)} />
                    <Summary label="Delta pedidos" value={`${dashboard.deltas.orders}%`} />
                    <Summary label="Delta GMV" value={`${dashboard.deltas.gmv}%`} />
                  </div>
                </Card>
              </>
            ) : null}

            {tab === "reputation" ? (
              <Card title="Reputacao" subtitle="Saude operacional e experiencia do cliente">
                <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-5">
                  <Summary label="Score da loja" value={`${dashboard.score}/100`} />
                  <Summary label="SLA" value={`${dashboard.kpis.sla.toFixed(2)}%`} />
                  <Summary label="Cancelamento" value={`${dashboard.cancelRate.toFixed(2)}%`} />
                  <Summary label="Tickets vencidos" value={String(supportSummary.overdue)} />
                  <Summary label="Envios atrasados" value={String(toNumber(logisticsPayload?.summary?.delayed))} />
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
                  A reputacao combina SLA, cancelamentos, suporte e logistica reais para priorizacao interna.
                </div>
              </Card>
            ) : null}

            {tab === "reports" ? (
              <Card title="Relatorios" subtitle="Consolidado de datasets operacionais do periodo">
                <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
                  <Summary label="Pedidos" value={String(currentOrders.length)} />
                  <Summary label="Produtos" value={String(toNumber(productsPayload?.total))} />
                  <Summary label="Tickets" value={String(toNumber(supportPayload?.total))} />
                  <Summary label="Registros payout" value={String(statementRows.length)} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" onClick={() => handleTabChange("orders")}>
                    Ver base de pedidos
                  </button>
                  <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" onClick={() => handleTabChange("products")}>
                    Ver base de produtos
                  </button>
                  <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" onClick={() => handleTabChange("finance")}>
                    Ver financeiro detalhado
                  </button>
                </div>
              </Card>
            ) : null}

            {tab === "help" ? (
              <Card title="Central do vendedor" subtitle="Apoio operacional no proprio portal">
                <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                  <Summary label="Tickets em aberto" value={String(toNumber(supportPayload?.summary?.open))} />
                  <Summary label="Tickets vencidos" value={String(toNumber(supportPayload?.summary?.overdue))} />
                  <Summary label="Pedidos em risco SLA" value={String(dashboard.todos.slaRisk)} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" onClick={() => handleTabChange("support")}>
                    Ir para Suporte
                  </button>
                  <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" onClick={() => handleTabChange("logistics")}>
                    Ir para Frete & SLA
                  </button>
                  <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm" onClick={() => handleTabChange("settings")}>
                    Ver Configuracoes
                  </button>
                </div>
              </Card>
            ) : null}

            {tab !== "dashboard" &&
            tab !== "orders" &&
            tab !== "returns" &&
            tab !== "payouts" &&
            tab !== "statement" &&
            tab !== "products" &&
            tab !== "inventory" &&
            tab !== "pricing" &&
            tab !== "support" &&
            tab !== "logistics" &&
            tab !== "growth" &&
            tab !== "settings" &&
            tab !== "campaigns" &&
            tab !== "finance" &&
            tab !== "alerts" &&
            tab !== "automations" &&
            tab !== "analytics" &&
            tab !== "reputation" &&
            tab !== "reports" &&
            tab !== "help" ? (
              <Card title={titleFor(tab)} subtitle="Tela em evolucao">
                <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-sm text-slate-500">
                  Essa aba esta pronta para consumir endpoint dedicado.
                </p>
              </Card>
            ) : null}
          </div>
        </main>
      </div>
    </div>
  );
}

function Kpi({ label, value, delta }: { label: string; value: string; delta: number }) {
  const positive = delta >= 0;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-2 text-3xl">{value}</p>
      <p className={`mt-2 text-sm ${positive ? "text-emerald-700" : "text-rose-700"}`}>
        {positive ? "+" : "-"} {Math.abs(delta)}% vs periodo anterior
      </p>
    </div>
  );
}

function Card({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-xl">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Todo({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
      <span>{label}</span>
      <span className={`rounded-full border px-2 py-1 text-xs ${value > 0 ? "border-amber-200 bg-amber-50 text-amber-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
        {value > 0 ? `Atencao (${value})` : "OK"}
      </span>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
      <p className="text-[11px] uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-1 text-lg">{value}</p>
    </div>
  );
}

function Sparkline({ data }: { data: number[] }) {
  const values = data.length > 1 ? data : [0, ...(data.length ? data : [0])];
  const width = 520;
  const height = 140;
  const padding = 10;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const x = (idx: number) => padding + (idx * (width - padding * 2)) / (values.length - 1);
  const y = (value: number) =>
    padding + (height - padding * 2) * (1 - (value - min) / (max - min || 1));
  const line = values.map((value, idx) => `${idx === 0 ? "M" : "L"} ${x(idx)} ${y(value)}`).join(" ");

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id="partnerArea" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#d14a7a" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#d14a7a" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={`${line} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`} fill="url(#partnerArea)" />
      <path d={line} fill="none" stroke="#d14a7a" strokeWidth="3" />
    </svg>
  );
}

function Bars({ data }: { data: number[] }) {
  const values = data.length > 0 ? data : [0, 0];
  const width = 520;
  const height = 140;
  const padding = 10;
  const max = Math.max(...values, 1);
  const barWidth = (width - padding * 2) / values.length;

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`}>
      {values.map((value, idx) => {
        const barHeight = ((height - padding * 2) * value) / max;
        return (
          <rect
            key={idx}
            x={padding + idx * barWidth + 2}
            y={height - padding - barHeight}
            width={Math.max(2, barWidth - 4)}
            height={barHeight}
            rx={6}
            fill="#d14a7a"
            opacity={0.28}
          />
        );
      })}
    </svg>
  );
}

function titleFor(tab: TabKey) {
  const titles: Record<TabKey, string> = {
    dashboard: "Overview",
    orders: "Pedidos",
    returns: "Devolucoes",
    products: "Produtos",
    inventory: "Estoque",
    pricing: "Precos & Promocoes",
    payouts: "Repasse",
    statement: "Extrato",
    growth: "Crescimento",
    logistics: "Frete & SLA",
    support: "Suporte",
    settings: "Configuracoes",
    campaigns: "Campanhas & Ads",
    finance: "Financeiro detalhado",
    alerts: "Alertas & Regras",
    automations: "Automacoes",
    analytics: "Analytics avancado",
    reputation: "Reputacao",
    reports: "Relatorios",
    help: "Central do vendedor"
  };
  return titles[tab];
}

