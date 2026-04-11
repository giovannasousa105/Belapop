import KpiCard from "@/components/admin/kpi-card";
import Panel from "@/components/admin/panel";
import PriorityList from "@/components/admin/priority-list";
import Sidebar from "@/components/admin/sidebar";
import Topbar from "@/components/admin/topbar";
import PerformanceTimeframePanel from "@/components/admin/performance-timeframe-panel";
import PlaceholderChart from "@/components/admin/charts/placeholder-chart";
import OpsQueue from "@/components/admin/ops-queue";
import type {
  DashboardRange,
  ExecutiveDashboardData
} from "@/lib/admin/dashboardMetrics";
import { fetchExecutiveDashboardData } from "@/lib/admin/dashboardMetrics";
import type { AdminDashboardViewModel } from "@/lib/admin/mock";
import type { Range } from "@/lib/admin/metrics-types";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

const asPercent = (value: number, digits = 2) =>
  `${value.toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  })}%`;

const asSignedPercentDelta = (value: number, digits = 1) =>
  `${value >= 0 ? "+" : ""}${value.toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  })}% vs periodo anterior`;

const asSignedPointsDelta = (value: number, digits = 1) =>
  `${value >= 0 ? "+" : ""}${value.toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  })} p.p. vs periodo anterior`;

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const formatTokenLabel = (value: string | null | undefined) =>
  (value ?? "indefinido")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

const last = <T,>(arr: T[], count: number) => arr.slice(Math.max(0, arr.length - count));
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const mapSeverity = (
  severity: "critical" | "warning" | "info"
): "high" | "medium" | "low" => {
  if (severity === "critical") return "high";
  if (severity === "warning") return "medium";
  return "low";
};

const emptySparkline = [0, 0, 0, 0, 0, 0, 0];

const buildDegradedViewModel = (): AdminDashboardViewModel => ({
  updatedAtLabel: "indisponivel",
  kpis: [
    "gmv",
    "revenue",
    "orders",
    "aov",
    "conversion",
    "sre_maturity",
    "risk_control",
    "cancel"
  ].map((key) => ({
    key,
    label:
      key === "revenue"
        ? "Receita (take rate)"
        : key === "orders"
          ? "Pedidos"
          : key === "aov"
            ? "Ticket medio"
            : key === "conversion"
              ? "Conversao"
              : key === "sre_maturity"
                ? "Maturidade SRE"
                : key === "risk_control"
                  ? "Controle de risco"
                  : key === "cancel"
                    ? "Cancelamento"
                    : "GMV",
    value: "--",
    delta: "Carga indisponivel",
    hint: "Nao foi possivel carregar o consolidado executivo.",
    trend: "neutral" as const,
    sparkline: emptySparkline
  })),
  performanceSeries: [{ ts: 1, label: "Sem dados", gmv: 0, orders: 0, cancelRate: 0 }],
  priorities: [
    {
      id: "degraded-dashboard",
      title: "Dashboard executivo em estado degradado",
      meta: "A camada de metricas falhou. Revise logs e a origem dos dados antes de tomar decisao operacional.",
      severity: "high",
      primaryActionLabel: "Abrir financeiro",
      primaryActionHref: "/admin/finance",
      secondaryActionLabel: "Ver pedidos",
      secondaryActionHref: "/admin/orders"
    }
  ],
  opsQueue: [
    {
      id: "queue-degraded",
      area: "Carga executiva indisponivel",
      count: 1,
      sla: "imediato",
      href: "/admin/finance"
    }
  ],
  health: [
    {
      key: "dashboard-health",
      label: "Estado do painel",
      value: "Degradado",
      delta: "Acao imediata necessaria"
    }
  ],
  commercial: {
    payments: [{ label: "Pagamentos e risco", value: "--" }],
    catalog: [{ label: "Catalogo e estoque", value: "--" }],
    carts: [{ label: "Carrinhos e recuperacao", value: "--" }]
  },
  statusPoints: [{ label: "Sem dados", value: 0 }],
  funnelPoints: [{ label: "Sem dados", value: 0 }]
});

type DashboardPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const normalizeRange = (value: unknown): Range => {
  if (value === "7d" || value === "30d" || value === "90d" || value === "today") {
    return value;
  }
  return "today";
};

const buildViewModel = (live?: ExecutiveDashboardData | null): AdminDashboardViewModel => {
  if (!live) return buildDegradedViewModel();

  const visits =
    live.funnel.find((step) => step.label.toLowerCase().includes("visitas"))?.value ?? 0;
  const paid =
    live.funnel.find((step) => step.label.toLowerCase().includes("pagos"))?.value ??
    live.kpis.orders;
  const conversionPct = visits > 0 ? (paid / visits) * 100 : 0;

  const totalPaymentAttempts =
    live.paymentMonitor.paid +
    live.paymentMonitor.pending +
    live.paymentMonitor.failed +
    live.paymentMonitor.refundedOrChargeback;
  const paymentApprovalPct =
    totalPaymentAttempts > 0
      ? (live.paymentMonitor.paid / totalPaymentAttempts) * 100
      : 0;

  const takeRateRevenueCents = Math.round(live.kpis.gmvCents * 0.12);
  const reputationScore = Math.max(0, Math.min(5, live.marketplaceReadiness.score / 20));
  const trendPoints = last(live.ordersTrend, 14);
  const holdbackCents = Math.max(0, live.sreRiskMonitor.activeHoldbackCents);
  const sreMaturityScore = clamp(
    Math.round(
      live.sreRiskMonitor.oncallCoveragePct -
        live.sreRiskMonitor.criticalIncidents * 12 -
        live.sreRiskMonitor.errorBudgetCritical * 10 -
        live.sreRiskMonitor.drMissedOpenAlerts * 8
    ),
    0,
    100
  );
  const riskControlScore = clamp(
    Math.round(
      (100 - live.sreRiskMonitor.avgSellerRiskScore) -
        live.sreRiskMonitor.reconCriticalProviders * 12 -
        live.sreRiskMonitor.restrictedSellers * 3
    ),
    0,
    100
  );
  const sreTrend: "up" | "down" | "neutral" =
    sreMaturityScore >= 85 ? "up" : sreMaturityScore >= 70 ? "neutral" : "down";
  const riskTrend: "up" | "down" | "neutral" =
    riskControlScore >= 80 ? "up" : riskControlScore >= 60 ? "neutral" : "down";

  return {
    updatedAtLabel: new Date(live.generatedAt).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }),
    kpis: [
      {
        key: "gmv",
        label: "GMV",
        value: formatPrice(live.kpis.gmvCents / 100),
        delta: asSignedPercentDelta(live.kpis.gmvDelta),
        hint: "Soma dos pedidos pagos no periodo selecionado.",
        trend: live.kpis.gmvDelta >= 0 ? "up" : "down",
        sparkline: last(live.ordersTrend, 7).map((point) => point.gmvCents / 100)
      },
      {
        key: "revenue",
        label: "Receita (take rate)",
        value: formatPrice(takeRateRevenueCents / 100),
        delta: asSignedPercentDelta(live.kpis.gmvDelta),
        hint: "Estimativa de receita com take rate medio de 12%.",
        trend: live.kpis.gmvDelta >= 0 ? "up" : "down",
        sparkline: last(live.ordersTrend, 7).map((point) => point.gmvCents / 100)
      },
      {
        key: "orders",
        label: "Pedidos",
        value: live.kpis.orders.toLocaleString("pt-BR"),
        delta: asSignedPercentDelta(live.kpis.ordersDelta),
        hint: "Quantidade total de pedidos criados no periodo.",
        trend: live.kpis.ordersDelta >= 0 ? "up" : "down",
        sparkline: last(live.ordersTrend, 7).map((point) => point.orders)
      },
      {
        key: "aov",
        label: "Ticket medio",
        value: formatPrice(live.kpis.aovCents / 100),
        delta: asSignedPercentDelta(live.kpis.aovDelta),
        hint: "GMV dividido pela quantidade de pedidos pagos.",
        trend: live.kpis.aovDelta >= 0 ? "up" : "down",
        sparkline: last(live.ordersTrend, 7).map((point) =>
          point.orders > 0 ? point.gmvCents / 100 / point.orders : 0
        )
      },
      {
        key: "conversion",
        label: "Conversao",
        value: asPercent(conversionPct),
        delta: asSignedPercentDelta(live.kpis.ordersDelta),
        hint: "Pedidos pagos sobre total de visitas registradas no funil.",
        trend: live.kpis.ordersDelta >= 0 ? "up" : "down",
        sparkline: last(live.ordersTrend, 7).map((point) => point.orders)
      },
      {
        key: "sre_maturity",
        label: "Maturidade SRE",
        value: `${sreMaturityScore.toLocaleString("pt-BR")}%`,
        delta: `Cobertura ${live.sreRiskMonitor.oncallCoveragePct.toFixed(0)}% | ${live.sreRiskMonitor.criticalIncidents} incidentes criticos`,
        hint: "Combina cobertura de plantao, incidentes criticos e burn de error budget.",
        trend: sreTrend,
        sparkline: last(live.supportTrend, 7).map((point) =>
          Math.max(0, point.replied - point.opened)
        )
      },
      {
        key: "risk_control",
        label: "Controle de risco",
        value: `${riskControlScore.toLocaleString("pt-BR")}%`,
        delta: `${live.sreRiskMonitor.highRiskSellers} sellers alto risco | holdback ${formatPrice(holdbackCents / 100)}`,
        hint: "Resume risco antifraude, reconcilicao critica e sellers restritos.",
        trend: riskTrend,
        sparkline: last(live.ordersTrend, 7).map((point) => point.canceled)
      },
      {
        key: "cancel",
        label: "Cancelamento",
        value: asPercent(live.kpis.cancelRatePct),
        delta: asSignedPointsDelta(live.kpis.cancelRateDelta),
        hint: "Percentual de pedidos cancelados no periodo.",
        trend:
          live.kpis.cancelRateDelta > 0
            ? "up"
            : live.kpis.cancelRateDelta < 0
              ? "down"
              : "neutral",
        sparkline: last(live.ordersTrend, 7).map((point) => point.canceled)
      }
    ],
    performanceSeries: trendPoints.map((point) => ({
      ts: new Date(`${point.date}T00:00:00`).getTime(),
      label: point.label,
      gmv: point.gmvCents / 100,
      orders: point.orders,
      cancelRate: point.orders > 0 ? (point.canceled / point.orders) * 100 : 0
    })),
    priorities:
      live.alerts.length > 0
        ? live.alerts.slice(0, 4).map((alert) => ({
            id: alert.id,
            title: alert.title,
            meta: alert.detail,
            severity: mapSeverity(alert.severity),
            primaryActionLabel: alert.cta,
            primaryActionHref: alert.href,
            secondaryActionLabel: "Criar regra",
            secondaryActionHref: "/admin/settings"
          }))
        : [
            {
              id: "no-critical-alerts",
              title: "Sem prioridades criticas abertas",
              meta: "Nenhum alerta operacional severo no range selecionado.",
              severity: "low",
              primaryActionLabel: "Abrir financeiro",
              primaryActionHref: "/admin/finance",
              secondaryActionLabel: "Ver pedidos",
              secondaryActionHref: "/admin/orders"
            }
          ],
    opsQueue: [
      {
        id: "queue-payments",
        area: "Pagamentos falhos",
        count: live.paymentMonitor.failed,
        sla: "2h",
        href: "/admin/finance"
      },
      {
        id: "queue-chargeback",
        area: "Chargebacks",
        count: live.paymentMonitor.refundedOrChargeback,
        sla: "4h",
        href: "/admin/finance"
      },
      {
        id: "queue-logistics",
        area: "Logistica pendente",
        count: live.shippingMonitor.delayed,
        sla: "6h",
        href: "/admin/orders"
      },
      {
        id: "queue-catalog",
        area: "Catalogo em revisao",
        count: live.catalogMonitor.needsReview,
        sla: "24h",
        href: "/admin/products"
      },
      {
        id: "queue-support",
        area: "Atendimento aberto",
        count: live.kpis.openTickets,
        sla: "1h",
        href: "/admin/support"
      }
    ],
    health: [
      {
        key: "stores_active",
        label: "Lojas ativas",
        value: live.kpis.activeSellers.toLocaleString("pt-BR"),
        delta: `${live.kpis.activeSellersDelta >= 0 ? "+" : ""}${live.kpis.activeSellersDelta.toFixed(1)}%`
      },
      {
        key: "stores_pending",
        label: "Lojas pendentes",
        value: live.kpis.pendingSellers.toLocaleString("pt-BR")
      },
      {
        key: "support_sla",
        label: "SLA suporte",
        value: `${live.kpis.avgFirstResponseMinutes.toLocaleString("pt-BR")} min`
      },
      {
        key: "reputation",
        label: "Reputacao media",
        value: `${reputationScore.toFixed(1).replace(".", ",")}/5`
      }
    ],
    commercial: {
      payments: [
        {
          label: "Pagamentos falhos",
          value: live.paymentMonitor.failed.toLocaleString("pt-BR")
        },
        {
          label: "Chargebacks (30d)",
          value: live.paymentMonitor.refundedOrChargeback.toLocaleString("pt-BR")
        },
        {
          label: "Taxa de aprovacao",
          value: asPercent(paymentApprovalPct, 1)
        }
      ],
      catalog: [
        {
          label: "Produtos publicados",
          value: live.catalogMonitor.published.toLocaleString("pt-BR")
        },
        {
          label: "Sem estoque",
          value: live.catalogMonitor.outOfStock.toLocaleString("pt-BR")
        },
        {
          label: "Em revisao",
          value: live.catalogMonitor.needsReview.toLocaleString("pt-BR")
        }
      ],
      carts: [
        {
          label: "Carrinhos ativos",
          value: live.cartMonitor.active.toLocaleString("pt-BR")
        },
        {
          label: "Abandonados",
          value: live.cartMonitor.abandoned.toLocaleString("pt-BR")
        },
        {
          label: "Recuperacao",
          value: asPercent(live.cartMonitor.recoveryRatePct, 1)
        }
      ]
    },
    statusPoints: live.orderStatusBreakdown.map((status) => ({
      label: status.label,
      value: status.count
    })),
    funnelPoints: live.funnel.map((step) => ({
      label: step.label,
      value: step.value
    }))
  };
};

export default async function AdminDashboardPage({ searchParams }: DashboardPageProps) {
  const params = (await searchParams) ?? {};
  const rawRange = Array.isArray(params.range) ? params.range[0] : params.range;
  const selectedRange = normalizeRange(rawRange);

  let liveDashboard: ExecutiveDashboardData | null = null;
  let dashboardLoadError: string | null = null;

  try {
    liveDashboard = await fetchExecutiveDashboardData(selectedRange as DashboardRange);
  } catch (error) {
    console.error("[admin-dashboard] carga executiva indisponivel", error);
    dashboardLoadError = error instanceof Error ? error.message : "Erro desconhecido";
  }

  const data = buildViewModel(liveDashboard);
  const financeDrilldown = liveDashboard?.financeDrilldown ?? null;
  const latestFinanceReport = financeDrilldown?.latestReport ?? null;

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-slate-900">
      <Sidebar />

      <div className="lg:pl-[260px]">
        <Topbar updatedAtLabel={data.updatedAtLabel} selectedRange={selectedRange} />

        <main className="mx-auto max-w-[1500px] space-y-6 px-6 py-6 lg:px-8">
          {!liveDashboard ? (
            <section className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-950 shadow-[0_2px_12px_rgba(120,53,15,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                Estado degradado
              </p>
              <h2 className="mt-2 text-lg font-semibold text-amber-950">
                O dashboard executivo nao carregou os dados reais.
              </h2>
              <p className="mt-2 text-sm text-amber-900/85">
                Revise logs, conectividade das fontes e a camada de metricas antes de tomar decisoes operacionais.
              </p>
              {dashboardLoadError ? (
                <p className="mt-2 rounded-xl border border-amber-200 bg-white/70 px-3 py-2 text-xs text-amber-900/75">
                  Detalhe tecnico: {dashboardLoadError}
                </p>
              ) : null}
            </section>
          ) : null}

          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8">
            {data.kpis.map((kpi) => (
              <KpiCard
                key={kpi.key}
                label={kpi.label}
                value={kpi.value}
                delta={kpi.delta}
                hint={kpi.hint}
                trend={kpi.trend}
                sparkline={kpi.sparkline}
              />
            ))}
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <div className="xl:col-span-8">
              <PerformanceTimeframePanel controlledRange={selectedRange} />
            </div>

            <Panel
              className="xl:col-span-4"
              title="Prioridades imediatas"
              subtitle="Fila critica com impacto operacional"
            >
              <PriorityList items={data.priorities} />
            </Panel>
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <Panel className="xl:col-span-6" title="Fila operacional" subtitle="Pendencias por area e SLA">
              <OpsQueue items={data.opsQueue} />
            </Panel>

            <Panel
              className="xl:col-span-6"
              title="Saude do marketplace"
              subtitle="Sinais de estabilidade e crescimento"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {data.health.map((item) => (
                  <article key={item.key} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs text-slate-500">{item.label}</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">{item.value}</p>
                    {item.delta ? <p className="mt-1 text-xs text-emerald-600">{item.delta}</p> : null}
                  </article>
                ))}
              </div>
            </Panel>
          </section>

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <Panel className="xl:col-span-4" title="Pagamentos e risco" subtitle="Falhas, chargeback e aprovacao">
              <div className="space-y-3">
                {data.commercial.payments.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3"
                  >
                    <span className="text-sm text-slate-700">{item.label}</span>
                    <span className="text-sm font-semibold text-slate-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel className="xl:col-span-4" title="Catalogo e estoque" subtitle="Qualidade e cobertura do catalogo">
              <div className="space-y-3">
                {data.commercial.catalog.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3"
                  >
                    <span className="text-sm text-slate-700">{item.label}</span>
                    <span className="text-sm font-semibold text-slate-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel className="xl:col-span-4" title="Carrinhos e recuperacao" subtitle="Conversao e abandono">
              <div className="space-y-3">
                {data.commercial.carts.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3"
                  >
                    <span className="text-sm text-slate-700">{item.label}</span>
                    <span className="text-sm font-semibold text-slate-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </section>

          {financeDrilldown ? (
            <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
              <Panel
                className="xl:col-span-6"
                title="Reconciliacao e divergencias"
                subtitle="Drill-down direto de reconciliation_reports e reconciliation_issues"
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <article className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs text-slate-500">Ultimo report</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">
                      {latestFinanceReport ? formatTokenLabel(latestFinanceReport.status) : "Sem execucao"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {latestFinanceReport?.reportDate ?? "--"}
                    </p>
                  </article>
                  <article className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs text-slate-500">Issues abertas</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">
                      {financeDrilldown.openIssues.toLocaleString("pt-BR")}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">Divergencias operacionais em aberto</p>
                  </article>
                  <article className="rounded-2xl border border-slate-200 bg-white p-4">
                    <p className="text-xs text-slate-500">Ledger mismatch</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">
                      {financeDrilldown.integrityMismatches.toLocaleString("pt-BR")}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">Transacoes recentes fora de balanceamento</p>
                  </article>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {financeDrilldown.entryTypes.map((entryType) => (
                    <span
                      key={entryType.entryType}
                      className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700"
                    >
                      {formatTokenLabel(entryType.entryType)}: {entryType.count}
                    </span>
                  ))}
                </div>

                <div className="mt-4 space-y-3">
                  {financeDrilldown.issues.length > 0 ? (
                    financeDrilldown.issues.map((issue) => (
                      <article
                        key={issue.id ?? `${issue.issueType}-${issue.createdAt}`}
                        className="rounded-2xl border border-slate-200 bg-white p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {formatTokenLabel(issue.issueType)}
                            </p>
                            <p className="text-xs text-slate-500">
                              Pedido {issue.orderId ?? "--"} | Provider {issue.provider}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-500">{formatTokenLabel(issue.status)}</p>
                            <p className="text-sm font-semibold text-slate-900">
                              {formatPrice(issue.actualAmount)} / {formatPrice(issue.expectedAmount)}
                            </p>
                          </div>
                        </div>
                      </article>
                    ))
                  ) : (
                    <p className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">
                      Nenhuma divergencia recente de reconciliacao.
                    </p>
                  )}
                </div>
              </Panel>

              <Panel
                className="xl:col-span-6"
                title="Ledger operacional"
                subtitle="Lancamentos e transacoes recentes com postings semanticos"
              >
                <div className="space-y-3">
                  {financeDrilldown.recentEntries.map((entry) => (
                    <article
                      key={entry.id ?? `${entry.entryType}-${entry.createdAt}`}
                      className="rounded-2xl border border-slate-200 bg-white p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {formatTokenLabel(entry.entryType)}
                          </p>
                          <p className="text-xs text-slate-500">
                            {entry.accountCode ?? "--"} | {entry.referenceType ?? "--"} |{" "}
                            {formatDateTime(entry.createdAt)}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-slate-900">
                          {formatPrice(entry.amount)}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Transacoes recentes</p>
                      <p className="text-xs text-slate-500">
                        Balanceamento debito x credito nas ultimas transacoes do ledger.
                      </p>
                    </div>
                    <a
                      href="/admin/finance"
                      className="text-xs font-medium text-slate-700 underline underline-offset-4"
                    >
                      Abrir financeiro
                    </a>
                  </div>

                  <div className="mt-3 space-y-2">
                    {financeDrilldown.recentTransactions.map((transaction) => (
                      <div
                        key={transaction.id ?? `${transaction.transactionType}-${transaction.createdAt}`}
                        className="flex items-center justify-between gap-3 rounded-xl border border-white bg-white px-3 py-2"
                      >
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {formatTokenLabel(transaction.transactionType)}
                          </p>
                          <p className="text-xs text-slate-500">
                            {transaction.linesCount} linhas | {formatDateTime(transaction.createdAt)}
                          </p>
                        </div>
                        <p
                          className={`text-xs font-semibold ${
                            transaction.totalDebitCents === transaction.totalCreditCents
                              ? "text-emerald-600"
                              : "text-rose-600"
                          }`}
                        >
                          {transaction.totalDebitCents === transaction.totalCreditCents
                            ? "Balanceado"
                            : "Mismatch"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </Panel>
            </section>
          ) : null}

          <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <Panel className="xl:col-span-6" title="Distribuicao por status" subtitle="Pedidos por etapa (30d)">
              <PlaceholderChart
                points={data.statusPoints}
                series={[{ key: "value", label: "Pedidos", format: "integer" }]}
              />
            </Panel>

            <Panel className="xl:col-span-6" title="Funil comercial" subtitle="Visao geral de conversao (30d)">
              <PlaceholderChart
                points={data.funnelPoints}
                series={[{ key: "value", label: "Eventos", format: "integer" }]}
              />
            </Panel>
          </section>
        </main>
      </div>
    </div>
  );
}
