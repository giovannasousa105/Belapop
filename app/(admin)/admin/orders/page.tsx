import {
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  Route,
  TrendingUp,
  Truck
} from "lucide-react";

import { LuxuryButton } from "@/components/LuxuryButton";
import { SectionFrame } from "@/components/SectionFrame";
import { KpiCard } from "@/components/admin/dashboard/KpiCard";
import { OrderStatusChart } from "@/components/admin/dashboard/OrderStatusChart";
import { OrdersPerformanceChart } from "@/components/admin/dashboard/OrdersPerformanceChart";
import { fetchOrders, type AdminOrderRow } from "@/lib/admin/data";
import { formatPrice } from "@/lib/utils";

type NormalizedOrderStatus =
  | "created"
  | "paid"
  | "processing"
  | "awaiting_shipment"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "other";

type RiskLevel = "healthy" | "warning" | "critical";

type EnrichedOrder = AdminOrderRow & {
  normalizedStatus: NormalizedOrderStatus;
  ageHours: number;
  riskScore: number;
  riskLevel: RiskLevel;
  nextAction: string;
};

type TrendPoint = {
  date: string;
  label: string;
  orders: number;
  gmvCents: number;
  canceled: number;
};

type InsightTone = "critical" | "warning" | "info";

type AiInsight = {
  id: string;
  tone: InsightTone;
  title: string;
  detail: string;
};

const STATUS_ORDER: NormalizedOrderStatus[] = [
  "created",
  "paid",
  "processing",
  "awaiting_shipment",
  "shipped",
  "delivered",
  "cancelled",
  "other"
];

const OPEN_STATUS = new Set<NormalizedOrderStatus>([
  "created",
  "paid",
  "processing",
  "awaiting_shipment",
  "shipped",
  "other"
]);

const statusMeta: Record<
  NormalizedOrderStatus,
  {
    label: string;
    badgeClassName: string;
    barClassName: string;
    slaHours: number | null;
  }
> = {
  created: {
    label: "Criado",
    badgeClassName: "border-slate-200 bg-slate-50 text-slate-700",
    barClassName: "bg-slate-600",
    slaHours: 2
  },
  paid: {
    label: "Pago",
    badgeClassName: "border-indigo-200 bg-indigo-50 text-indigo-700",
    barClassName: "bg-indigo-500",
    slaHours: 6
  },
  processing: {
    label: "Em processamento",
    badgeClassName: "border-amber-200 bg-amber-50 text-amber-700",
    barClassName: "bg-amber-500",
    slaHours: 24
  },
  awaiting_shipment: {
    label: "Aguardando envio",
    badgeClassName: "border-orange-200 bg-orange-50 text-orange-700",
    barClassName: "bg-orange-500",
    slaHours: 36
  },
  shipped: {
    label: "Em transporte",
    badgeClassName: "border-sky-200 bg-sky-50 text-sky-700",
    barClassName: "bg-sky-500",
    slaHours: 72
  },
  delivered: {
    label: "Entregue",
    badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
    barClassName: "bg-emerald-500",
    slaHours: null
  },
  cancelled: {
    label: "Cancelado",
    badgeClassName: "border-rose-200 bg-rose-50 text-rose-700",
    barClassName: "bg-rose-500",
    slaHours: null
  },
  other: {
    label: "Outro",
    badgeClassName: "border-black/10 bg-bpOffWhite text-bpGraphite/80",
    barClassName: "bg-bpGraphite",
    slaHours: null
  }
};

const insightToneClass: Record<InsightTone, string> = {
  critical: "border-rose-200 bg-rose-50 text-rose-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  info: "border-sky-200 bg-sky-50 text-sky-800"
};

const riskToneClass: Record<RiskLevel, string> = {
  critical: "border-rose-200 bg-rose-50 text-rose-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  healthy: "border-emerald-200 bg-emerald-50 text-emerald-700"
};

const riskLabel: Record<RiskLevel, string> = {
  critical: "Critico",
  warning: "Atencao",
  healthy: "Estavel"
};

const toCurrencyFromCents = (value: number | null | undefined) =>
  formatPrice((value ?? 0) / 100);

const normalizeOrderStatus = (status: string | null | undefined): NormalizedOrderStatus => {
  const key = String(status ?? "created")
    .trim()
    .toLowerCase()
    .replaceAll("-", "_");

  if (key === "created") return "created";
  if (key === "paid") return "paid";
  if (key === "processing") return "processing";
  if (key === "awaiting_shipment") return "awaiting_shipment";
  if (key === "in_transit" || key === "shipped") return "shipped";
  if (key === "delivered" || key === "fulfilled") return "delivered";
  if (key === "cancelled" || key === "canceled") return "cancelled";
  return "other";
};

const getAgeHours = (createdAt: string | null | undefined) => {
  if (!createdAt) return 0;
  const timestamp = new Date(createdAt).getTime();
  if (Number.isNaN(timestamp)) return 0;
  return Math.max(0, Math.round((Date.now() - timestamp) / (1000 * 60 * 60)));
};

const getRiskLevel = (riskScore: number): RiskLevel => {
  if (riskScore >= 70) return "critical";
  if (riskScore >= 45) return "warning";
  return "healthy";
};

const computeRiskScore = (
  order: AdminOrderRow,
  normalizedStatus: NormalizedOrderStatus,
  ageHours: number
) => {
  let score = 10;

  if ((normalizedStatus === "created" || normalizedStatus === "paid") && ageHours >= 24) score += 28;
  if ((normalizedStatus === "processing" || normalizedStatus === "awaiting_shipment") && ageHours >= 48) score += 34;
  if (normalizedStatus === "shipped" && ageHours >= 120) score += 24;
  if (normalizedStatus === "other") score += 16;
  if (normalizedStatus === "cancelled") score += 10;
  if ((order.total_cents ?? 0) >= 150000) score += 12;
  if ((order.shipping_cents ?? 0) <= 0 && normalizedStatus !== "cancelled") score += 8;

  return Math.min(99, score);
};

const buildNextAction = (
  normalizedStatus: NormalizedOrderStatus,
  ageHours: number,
  riskScore: number
) => {
  if (normalizedStatus === "cancelled") return "Auditar motivo do cancelamento";
  if (normalizedStatus === "delivered") return "Disparar pedido de avaliacao do cliente";
  if (normalizedStatus === "shipped" && ageHours >= 120) return "Abrir tratativa com transportadora";
  if (normalizedStatus === "awaiting_shipment" || normalizedStatus === "processing") {
    return riskScore >= 70 ? "Priorizar separacao e expedicao imediata" : "Confirmar janela de postagem";
  }
  if (normalizedStatus === "created" || normalizedStatus === "paid") {
    return riskScore >= 70 ? "Validar pagamento/fraude com urgencia" : "Acompanhar confirmacao de pagamento";
  }
  return "Monitorar ate proxima atualizacao";
};

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "--";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "--";
  return parsed.toLocaleString("pt-BR");
};

const buildTrendData = (orders: AdminOrderRow[], days = 14): TrendPoint[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const byDay = new Map<string, TrendPoint>();

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - offset);
    const key = day.toISOString().slice(0, 10);
    byDay.set(key, {
      date: key,
      label: day.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      orders: 0,
      gmvCents: 0,
      canceled: 0
    });
  }

  orders.forEach((order) => {
    if (!order.created_at) return;
    const parsed = new Date(order.created_at);
    if (Number.isNaN(parsed.getTime())) return;
    parsed.setHours(0, 0, 0, 0);
    const key = parsed.toISOString().slice(0, 10);
    const bucket = byDay.get(key);
    if (!bucket) return;

    bucket.orders += 1;
    bucket.gmvCents += order.total_cents ?? 0;
    if (normalizeOrderStatus(order.status) === "cancelled") {
      bucket.canceled += 1;
    }
  });

  return Array.from(byDay.values());
};

const buildAiInsights = (orders: EnrichedOrder[]): AiInsight[] => {
  if (orders.length === 0) {
    return [
      {
        id: "empty",
        tone: "info",
        title: "Sem pedidos no recorte atual",
        detail: "Assim que novos pedidos entrarem, o copiloto gera prioridades, riscos e proximas acoes."
      }
    ];
  }

  const queueStages: NormalizedOrderStatus[] = [
    "created",
    "paid",
    "processing",
    "awaiting_shipment",
    "shipped"
  ];
  const stageCounts = queueStages.map((stage) => ({
    stage,
    count: orders.filter((order) => order.normalizedStatus === stage).length
  }));
  stageCounts.sort((a, b) => b.count - a.count);
  const bottleneck = stageCounts[0];

  const criticalOrders = orders.filter((order) => order.riskLevel === "critical").length;
  const overdueOrders = orders.filter(
    (order) => OPEN_STATUS.has(order.normalizedStatus) && order.ageHours >= 48
  ).length;
  const cancelledOrders = orders.filter((order) => order.normalizedStatus === "cancelled").length;
  const cancelRate = (cancelledOrders / orders.length) * 100;

  const insights: AiInsight[] = [];

  if (bottleneck.count > 0) {
    insights.push({
      id: "bottleneck",
      tone: bottleneck.count >= 6 ? "warning" : "info",
      title: `Gargalo principal: ${statusMeta[bottleneck.stage].label}`,
      detail: `${bottleneck.count} pedidos nesta etapa. A recomendacao e concentrar equipe nessa fila nas proximas 2h.`
    });
  }

  if (criticalOrders > 0) {
    insights.push({
      id: "critical-risk",
      tone: "critical",
      title: "Pedidos com risco critico detectados",
      detail: `${criticalOrders} pedidos com score >= 70. Priorize verificacao de pagamento, separacao e transporte.`
    });
  } else {
    insights.push({
      id: "risk-ok",
      tone: "info",
      title: "Risco operacional controlado",
      detail: "Nenhum pedido no nivel critico no recorte monitorado."
    });
  }

  if (overdueOrders > 0) {
    insights.push({
      id: "overdue",
      tone: overdueOrders >= 4 ? "warning" : "info",
      title: "Pedidos acima de 48h em aberto",
      detail: `${overdueOrders} pedidos com envelhecimento acima do alvo. Sugestao: atuar por ordem de risco e ticket.`
    });
  }

  if (cancelRate >= 8) {
    insights.push({
      id: "cancel-rate",
      tone: "warning",
      title: "Taxa de cancelamento em atencao",
      detail: `Cancelamento em ${cancelRate.toFixed(1)}% no recorte. Revisar causa-raiz em pagamento e fulfillment.`
    });
  }

  return insights.slice(0, 4);
};

export default async function AdminOrdersPage() {
  const orders = await fetchOrders();
  const enrichedOrders: EnrichedOrder[] = orders.map((order) => {
    const normalizedStatus = normalizeOrderStatus(order.status);
    const ageHours = getAgeHours(order.created_at);
    const riskScore = computeRiskScore(order, normalizedStatus, ageHours);

    return {
      ...order,
      normalizedStatus,
      ageHours,
      riskScore,
      riskLevel: getRiskLevel(riskScore),
      nextAction: buildNextAction(normalizedStatus, ageHours, riskScore)
    };
  });

  const totalOrders = enrichedOrders.length;
  const gmvCents = enrichedOrders.reduce((sum, order) => sum + (order.total_cents ?? 0), 0);
  const avgTicketCents = totalOrders > 0 ? Math.round(gmvCents / totalOrders) : 0;
  const openOrders = enrichedOrders.filter((order) => OPEN_STATUS.has(order.normalizedStatus)).length;
  const deliveredOrders = enrichedOrders.filter((order) => order.normalizedStatus === "delivered").length;
  const cancelledOrders = enrichedOrders.filter((order) => order.normalizedStatus === "cancelled").length;
  const cancelRatePct = totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0;
  const fulfillmentPct = totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0;
  const avgOpenAgeHours =
    openOrders > 0
      ? Math.round(
          enrichedOrders
            .filter((order) => OPEN_STATUS.has(order.normalizedStatus))
            .reduce((sum, order) => sum + order.ageHours, 0) / openOrders
        )
      : 0;
  const riskOrders = enrichedOrders.filter((order) => order.riskScore >= 55);
  const criticalOrders = enrichedOrders
    .filter((order) => order.riskLevel === "critical")
    .sort((a, b) => b.riskScore - a.riskScore || b.ageHours - a.ageHours)
    .slice(0, 8);

  const stageCards = STATUS_ORDER.filter((status) => status !== "other").map((status) => {
    const count = enrichedOrders.filter((order) => order.normalizedStatus === status).length;
    const sharePct = totalOrders > 0 ? (count / totalOrders) * 100 : 0;
    return { status, count, sharePct };
  });

  const statusBreakdownRaw = STATUS_ORDER.map((status) => ({
    status,
    label: statusMeta[status].label,
    count: enrichedOrders.filter((order) => order.normalizedStatus === status).length
  }));
  const statusBreakdown =
    statusBreakdownRaw.filter((item) => item.count > 0).length > 0
      ? statusBreakdownRaw.filter((item) => item.count > 0)
      : statusBreakdownRaw.filter((item) => item.status !== "other");

  const trendData = buildTrendData(orders);
  const aiInsights = buildAiInsights(enrichedOrders);
  const updatedAtLabel = new Date().toLocaleString("pt-BR");

  return (
    <div className="flex flex-col gap-8">
      <SectionFrame>
        <div className="relative overflow-hidden rounded-2xl border border-bpPink/20 bg-gradient-to-br from-[#fff7fb] via-white to-[#fffaf4] p-6">
          <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-bpPink/10 blur-3xl" />
          <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Order Intelligence Hub</p>
              <h1 className="font-display text-3xl text-bpBlack md:text-4xl">Fluxo de pedidos com copiloto IA</h1>
              <p className="max-w-3xl text-sm text-bpGraphite/80">
                Monitoramento transacional com leitura de risco, gargalos e prioridades para acelerar expedicao e reduzir cancelamentos.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-black/10 bg-white/90 px-4 py-3 text-right shadow-sm">
                <p className="text-[11px] uppercase tracking-[0.2em] text-bpGraphite/70">Atualizado em</p>
                <p className="text-sm font-semibold text-bpBlackSoft">{updatedAtLabel}</p>
              </div>
              <LuxuryButton tone="retail" variant="secondary" href="/admin/dashboard">
                Dashboard executivo
              </LuxuryButton>
              <LuxuryButton tone="retail" variant="outline" href="/admin/support">
                Suporte
              </LuxuryButton>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <KpiCard title="Pedidos monitorados" value={totalOrders.toLocaleString("pt-BR")} icon={<Route size={16} />} />
          <KpiCard title="GMV monitorado" value={toCurrencyFromCents(gmvCents)} icon={<TrendingUp size={16} />} />
          <KpiCard title="Ticket medio" value={toCurrencyFromCents(avgTicketCents)} icon={<BrainCircuit size={16} />} />
          <KpiCard title="Em aberto" value={openOrders.toLocaleString("pt-BR")} icon={<Clock3 size={16} />} />
          <KpiCard title="Risco elevado" value={riskOrders.length.toLocaleString("pt-BR")} icon={<AlertTriangle size={16} />} />
          <KpiCard title="Entregas concluidas" value={`${fulfillmentPct.toFixed(1)}%`} icon={<CheckCircle2 size={16} />} />
        </div>
      </SectionFrame>

      <SectionFrame>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Fluxo operacional</p>
            <h2 className="font-display text-xl text-bpBlack">Funil por etapa com SLA alvo</h2>
          </div>
          <div className="rounded-2xl border border-black/10 bg-bpOffWhite px-4 py-3 text-sm text-bpGraphite/80">
            {openOrders.toLocaleString("pt-BR")} em aberto | {avgOpenAgeHours.toLocaleString("pt-BR")}h idade media
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {stageCards.map((stage) => {
            const meta = statusMeta[stage.status];
            const fillWidth = stage.count === 0 ? 0 : Math.max(8, Math.min(100, stage.sharePct));
            return (
              <div key={stage.status} className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-bpGraphite/70">{meta.label}</p>
                  <p className="font-display text-2xl text-bpBlack">{stage.count}</p>
                </div>
                <div className="mt-3 h-2 rounded-full bg-black/5">
                  <div className={`h-2 rounded-full ${meta.barClassName}`} style={{ width: `${fillWidth}%` }} />
                </div>
                <p className="mt-2 text-xs text-bpGraphite/70">{stage.sharePct.toFixed(1)}% do volume</p>
                <p className="text-[11px] text-bpGraphite/60">
                  {meta.slaHours !== null ? `SLA alvo: ${meta.slaHours}h` : "Sem SLA aplicavel"}
                </p>
              </div>
            );
          })}
        </div>
      </SectionFrame>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_1fr]">
        <SectionFrame>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Copiloto IA</p>
              <h2 className="font-display text-xl text-bpBlack">Leituras e prioridades automaticas</h2>
            </div>
            <span className="rounded-full border border-bpPink/30 bg-bpPink/10 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-bpPink">
              heuristica ativa
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {aiInsights.map((insight) => (
              <div key={insight.id} className={`rounded-2xl border p-4 ${insightToneClass[insight.tone]}`}>
                <p className="text-[11px] uppercase tracking-[0.2em]">Insight</p>
                <p className="mt-1 text-sm font-semibold">{insight.title}</p>
                <p className="mt-1 text-xs opacity-85">{insight.detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
              <p className="text-[11px] uppercase tracking-[0.2em] text-bpGraphite/70">Taxa de cancelamento</p>
              <p className="mt-1 font-display text-2xl text-bpBlack">{cancelRatePct.toFixed(1)}%</p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
              <p className="text-[11px] uppercase tracking-[0.2em] text-bpGraphite/70">Pedidos criticos</p>
              <p className="mt-1 font-display text-2xl text-rose-700">{criticalOrders.length}</p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
              <p className="text-[11px] uppercase tracking-[0.2em] text-bpGraphite/70">Entregues</p>
              <p className="mt-1 font-display text-2xl text-emerald-700">{deliveredOrders}</p>
            </div>
          </div>
        </SectionFrame>

        <SectionFrame>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Fila prioritaria</p>
              <h2 className="font-display text-xl text-bpBlack">Pedidos que exigem acao agora</h2>
            </div>
            <Truck className="text-bpGraphite/50" size={18} />
          </div>

          <div className="mt-4 space-y-3">
            {criticalOrders.map((order) => {
              const meta = statusMeta[order.normalizedStatus];
              return (
                <div key={order.id} className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.2em] text-bpGraphite/70">Pedido {order.id.slice(0, 8)}</p>
                      <p className="text-sm font-semibold text-bpBlackSoft">{toCurrencyFromCents(order.total_cents)}</p>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.2em] ${meta.badgeClassName}`}>
                      {meta.label}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-bpGraphite/75">
                    <span className={`rounded-full border px-2 py-1 ${riskToneClass[order.riskLevel]}`}>
                      risco {order.riskScore}
                    </span>
                    <span>{order.ageHours}h em aberto</span>
                    <span>{formatDateTime(order.created_at)}</span>
                  </div>
                  <p className="mt-2 text-xs text-bpGraphite/80">{order.nextAction}</p>
                </div>
              );
            })}

            {criticalOrders.length === 0 && (
              <p className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                Sem pedidos criticos no momento.
              </p>
            )}
          </div>
        </SectionFrame>
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <OrdersPerformanceChart title="Pedidos, GMV e cancelamentos - ultimos 14 dias" data={trendData} />
        <OrderStatusChart title="Distribuicao por status (recorte atual)" data={statusBreakdown} />
      </div>

      <SectionFrame>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Fila completa</p>
            <h2 className="font-display text-xl text-bpBlack">Painel operacional de pedidos</h2>
          </div>
          <LuxuryButton tone="retail" size="sm" variant="outline" href="/admin/finance">
            Financeiro
          </LuxuryButton>
        </div>

        <div className="mt-4 overflow-x-auto rounded-2xl border border-black/10">
          <table className="min-w-full divide-y divide-black/10 bg-white text-sm">
            <thead className="bg-bpOffWhite/90 text-[11px] uppercase tracking-[0.2em] text-bpGraphite/70">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Pedido</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Valor</th>
                <th className="px-4 py-3 text-right font-medium">Frete</th>
                <th className="px-4 py-3 text-right font-medium">Comissao</th>
                <th className="px-4 py-3 text-right font-medium">Idade</th>
                <th className="px-4 py-3 text-left font-medium">Prioridade IA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {enrichedOrders.map((order) => {
                const meta = statusMeta[order.normalizedStatus];
                return (
                  <tr key={order.id}>
                    <td className="px-4 py-3 align-top">
                      <p className="font-semibold text-bpBlackSoft">{order.id.slice(0, 8)}</p>
                      <p className="text-xs text-bpGraphite/70">{formatDateTime(order.created_at)}</p>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.2em] ${meta.badgeClassName}`}>
                        {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right align-top font-semibold text-bpBlackSoft">
                      {toCurrencyFromCents(order.total_cents)}
                    </td>
                    <td className="px-4 py-3 text-right align-top text-bpGraphite/80">
                      {toCurrencyFromCents(order.shipping_cents)}
                    </td>
                    <td className="px-4 py-3 text-right align-top text-bpGraphite/80">
                      {toCurrencyFromCents(order.commission_cents)}
                    </td>
                    <td className="px-4 py-3 text-right align-top text-bpGraphite/80">
                      {order.ageHours}h
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-2 py-1 text-[11px] uppercase tracking-[0.15em] ${riskToneClass[order.riskLevel]}`}>
                          {riskLabel[order.riskLevel]}
                        </span>
                        <span className="text-xs text-bpGraphite/80">{order.nextAction}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {enrichedOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center">
                    <p className="text-sm text-bpGraphite/80">Nenhum pedido registrado.</p>
                    <p className="mt-1 text-xs text-bpGraphite/60">
                      O painel atualiza automaticamente quando novos pedidos forem criados.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SectionFrame>
    </div>
  );
}
