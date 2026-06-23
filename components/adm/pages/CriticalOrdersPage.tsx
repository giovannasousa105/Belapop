import Link from "next/link";
import { Cormorant_Garamond } from "next/font/google";
import { AlertTriangle, Bell, ChevronLeft, ChevronRight, Zap } from "lucide-react";

import { FinanceSidebar } from "@/components/admin/financeiro/FinanceSidebar";
import { FinanceKpiCard } from "@/components/admin/financeiro/FinanceKpiCard";
import { ordersRepository } from "@/lib/adm/repositories";
import { getAdmDataSource } from "@/lib/adm/repositories/source";
import { buildHref, toListQueryParams, type AdmFilters, type SearchParamsInput } from "@/lib/adm/url";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

type CriticalOrdersPageProps = {
  filters: AdmFilters;
  searchParamsSource?: SearchParamsInput;
};

type CriticalTab = "todos" | "atraso-envio" | "devolucao-pendente" | "chargeback" | "sem-rastreio";

type CriticalRow = {
  orderId: string;
  customer: string;
  customerTag: "PREMIUM MEMBER" | "STANDARD";
  seller: string;
  issue: string;
  tabValue: CriticalTab;
  status: string;
  deadline: string;
  isOverdue: boolean;
  action: string;
};

const tabs: Array<{ label: string; value: CriticalTab }> = [
  { label: "Todos", value: "todos" },
  { label: "Atraso de Envio", value: "atraso-envio" },
  { label: "Devolução Pendente", value: "devolucao-pendente" },
  { label: "Chargeback", value: "chargeback" },
  { label: "Sem Rastreio", value: "sem-rastreio" },
];

// Problem badge config
const problemConfig: Record<string, { color: string; bg: string; icon: string }> = {
  "Atraso Crítico":     { color: "#7F1D1D", bg: "#FEE2E2", icon: "⏰" },
  "Devolução Pendente": { color: "#92400E", bg: "#FEF3C7", icon: "↩" },
  "Chargeback":         { color: "#1E3A8A", bg: "#DBEAFE", icon: "💳" },
  "Sem Rastreio":       { color: "#374151", bg: "#F3F4F6", icon: "📦" },
};

function ProblemBadge({ problem }: { problem: string }) {
  const cfg = problemConfig[problem] ?? { color: "#374151", bg: "#F3F4F6", icon: "⚠" };
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-semibold"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      <span aria-hidden="true">{cfg.icon}</span>
      {problem}
    </span>
  );
}

function DeadlineBadge({ deadline, isOverdue }: { deadline: string; isOverdue: boolean }) {
  if (isOverdue) {
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-[#FEE2E2] px-3 py-1 text-[11px] font-bold text-[#7F1D1D]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#EF4444]" aria-hidden="true" />
        Esgotado
      </span>
    );
  }
  const isUrgent = deadline.toLowerCase().includes("urgente") || deadline.toLowerCase().includes("24h");
  if (isUrgent) {
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-[#FEF3C7] px-3 py-1 text-[11px] font-bold text-[#92400E]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#F59E0B]" aria-hidden="true" />
        {deadline}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-[#D1FAE5] px-3 py-1 text-[11px] font-bold text-[#065F46]">
      {deadline}
    </span>
  );
}

function CustomerAvatar({ name }: { name: string }) {
  const initials = name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const palettes: [string, string][] = [
    ["#F5D0A9", "#7A5234"],
    ["#D4E4FF", "#1E3A8A"],
    ["#D1FAE5", "#065F46"],
    ["#FDE8FF", "#6B21A8"],
  ];
  const [bg, text] = palettes[name.charCodeAt(0) % palettes.length];
  return (
    <span
      className={`${cormorant.className} inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[13px] font-bold`}
      style={{ background: bg, color: text }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

export async function CriticalOrdersPage({
  filters,
  searchParamsSource = filters,
}: CriticalOrdersPageProps) {
  const referenceTime = new Date("2026-04-10T00:00:00Z").getTime();
  const activeTab = tabs.some((t) => t.value === filters.activity)
    ? (filters.activity as CriticalTab)
    : "todos";

  const [ordersResult, dataSource] = await Promise.all([
    ordersRepository.listOrders(
      toListQueryParams(searchParamsSource, {
        page: 1,
        pageSize: 24,
        sortBy: "createdAt",
        sortDir: "desc",
      })
    ),
    getAdmDataSource(),
  ]);

  const customerMap = Object.fromEntries(dataSource.customers.map((c) => [c.id, c]));
  const sellerMap = Object.fromEntries(dataSource.sellers.map((s) => [s.id, s]));
  const incidentByOrder = Object.fromEntries(dataSource.logisticsIncidents.map((i) => [i.orderId, i]));
  const refundByOrder = Object.fromEntries(dataSource.refunds.map((r) => [r.orderId, r]));
  const alertByOrder = Object.fromEntries(
    dataSource.financialAlerts
      .filter((a) => a.orderId)
      .map((a) => [a.orderId as string, a])
  );

  const criticalRows: CriticalRow[] = ordersResult.data.items
    .filter((order) => {
      const incident = incidentByOrder[order.id];
      const refund = refundByOrder[order.id];
      const alert = alertByOrder[order.id];
      return order.priority !== "baixa" || Boolean(incident) || Boolean(refund) || Boolean(alert);
    })
    .map((order) => {
      const customer = customerMap[order.customerId];
      const seller = sellerMap[order.sellerId];
      const incident = incidentByOrder[order.id];
      const refund = refundByOrder[order.id];
      const alert = alertByOrder[order.id];
      const issue =
        alert?.type.toLowerCase().includes("chargeback")
          ? "Chargeback"
          : refund
            ? "Devolução Pendente"
            : incident?.type.toLowerCase().includes("rastreio")
              ? "Sem Rastreio"
              : "Atraso Crítico";
      const tabValue: CriticalTab =
        issue === "Chargeback"
          ? "chargeback"
          : issue === "Sem Rastreio"
            ? "sem-rastreio"
            : issue === "Devolução Pendente"
              ? "devolucao-pendente"
              : "atraso-envio";
      const remainingDays = Math.ceil((new Date(order.eta).getTime() - referenceTime) / 86400000);
      const isOverdue = remainingDays < 0;

      return {
        orderId: order.id,
        customer: customer?.name ?? order.customerName,
        customerTag: customer?.segment === "premium" ? "PREMIUM MEMBER" : "STANDARD",
        seller: seller?.name ?? order.sellerName,
        issue,
        tabValue,
        status: refund ? "Aguardando Financeiro" : alert ? "Em Análise" : "Aguardando Seller",
        deadline: isOverdue ? "Esgotado" : `${remainingDays}d restantes`,
        isOverdue,
        action: refund ? "Resolver" : alert ? "Detalhes" : "Intervir",
      };
    });

  const filteredRows =
    activeTab === "todos" ? criticalRows : criticalRows.filter((r) => r.tabValue === activeTab);

  const overdueCount = criticalRows.filter((r) => r.isOverdue).length;
  const avgDelay =
    criticalRows.length > 0
      ? (
          criticalRows.reduce((sum, row) => {
            const order = dataSource.orders.find((o) => o.id === row.orderId);
            if (!order) return sum;
            return sum + Math.max(0, Math.ceil((referenceTime - new Date(order.eta).getTime()) / 86400000));
          }, 0) / criticalRows.length
        ).toFixed(1)
      : "0,0";
  const resolutionRate = Math.max(0, 100 - criticalRows.length * 7);

  const tabCounts: Record<CriticalTab, number> = {
    todos: criticalRows.length,
    "atraso-envio": criticalRows.filter((r) => r.tabValue === "atraso-envio").length,
    "devolucao-pendente": criticalRows.filter((r) => r.tabValue === "devolucao-pendente").length,
    chargeback: criticalRows.filter((r) => r.tabValue === "chargeback").length,
    "sem-rastreio": criticalRows.filter((r) => r.tabValue === "sem-rastreio").length,
  };

  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#1A1714]">
      <FinanceSidebar activeHref="/adm/operacao/pedidos-criticos" />

      <main className="pl-[220px]">
        {/* Header */}
        <header className="sticky top-0 z-20 border-b border-[rgba(139,94,60,0.10)] bg-[#FAFAF8]/90 px-10 py-5 backdrop-blur-md">
          <div className="flex items-center justify-between gap-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9E9589]">
                Módulo Operação
              </p>
              <h1
                className={`${cormorant.className} text-[28px] font-medium leading-tight tracking-[-0.02em] text-[#1A1714]`}
              >
                Pedidos Críticos
              </h1>
              <p className="mt-0.5 text-[11px] capitalize text-[#9E9589]">{today}</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Notificações"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(139,94,60,0.14)] text-[#9E9589] transition-colors hover:text-[#1A1714]"
              >
                <Bell className="h-4 w-4" strokeWidth={1.8} />
              </button>
              <Link
                href="/adm/operacao/logistica/incidentes"
                className="flex items-center gap-2 rounded-full bg-[#EF4444] px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white shadow-[0_4px_16px_rgba(239,68,68,0.35)] transition-all hover:bg-[#DC2626] hover:shadow-[0_6px_20px_rgba(239,68,68,0.45)]"
              >
                <Zap className="h-3.5 w-3.5" strokeWidth={2.2} />
                Intervenção Rápida
              </Link>
            </div>
          </div>
        </header>

        <div className="px-10 py-8 space-y-6">
          {/* KPI Row */}
          <section className="grid grid-cols-3 gap-4">
            <FinanceKpiCard
              label="Total Críticos"
              value={String(criticalRows.length)}
              subtext={`${overdueCount} esgotado${overdueCount !== 1 ? "s" : ""}`}
              icon={<AlertTriangle className="h-4 w-4" strokeWidth={1.8} />}
              variant="critical"
            />
            <FinanceKpiCard
              label="Atraso Médio"
              value={`${avgDelay.replace(".", ",")} dias`}
              subtext="média por pedido crítico"
              icon={<span className="text-[13px]">⏱</span>}
              variant="warning"
            />
            {/* Taxa de Resolução com progress bar inline */}
            <div className="rounded-2xl border border-[rgba(139,94,60,0.14)] bg-white p-5 shadow-[0_4px_16px_rgba(28,26,24,0.04)]">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.10em] text-[#9E9589]">
                  Taxa de Resolução
                </p>
                <span className="rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[10px] font-semibold text-[#F59E0B]">
                  Meta: 95%
                </span>
              </div>
              <p
                className={`${cormorant.className} mt-3 text-[34px] font-medium leading-none tracking-[-0.02em] text-[#1A1714]`}
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {resolutionRate.toFixed(1).replace(".", ",")}%
              </p>
              {/* Progress bar */}
              <div className="relative mt-3 h-1 overflow-hidden rounded-full bg-[rgba(139,94,60,0.12)]">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(resolutionRate, 100)}%`,
                    background: resolutionRate >= 95 ? "#10B981" : "#F59E0B",
                  }}
                />
                {/* Meta marker at 95% */}
                <div
                  className="absolute top-[-3px] h-[10px] w-0.5 rounded-sm bg-[#9E9589]"
                  style={{ left: "95%" }}
                  title="Meta: 95%"
                />
              </div>
            </div>
          </section>

          {/* Category Tabs */}
          <div className="flex gap-0.5 overflow-x-auto border-b border-[rgba(139,94,60,0.08)] pb-0">
            {tabs.map((tab) => {
              const active = tab.value === activeTab;
              const count = tabCounts[tab.value];
              return (
                <Link
                  key={tab.value}
                  href={buildHref("/adm/operacao/pedidos-criticos", searchParamsSource, {
                    activity: tab.value === "todos" ? undefined : tab.value,
                    page: undefined,
                  })}
                  className={`flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-3.5 py-3 text-[13px] font-medium transition-all ${
                    active
                      ? "border-[#8B5E3C] font-semibold text-[#8B5E3C]"
                      : "border-transparent text-[#9E9589] hover:text-[#1A1714]"
                  }`}
                >
                  {tab.label}
                  {count > 0 && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                        active
                          ? "bg-[rgba(139,94,60,0.12)] text-[#8B5E3C]"
                          : "bg-[#FEE2E2] text-[#EF4444]"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Table */}
          <section className="overflow-hidden rounded-2xl border border-[rgba(139,94,60,0.14)] bg-white shadow-[0_4px_16px_rgba(28,26,24,0.04)]">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-[rgba(139,94,60,0.10)] bg-[#F4F1EE]">
                    {["#", "Cliente", "Seller", "Problema", "Status", "Prazo", "Ação"].map(
                      (h, i) => (
                        <th
                          key={h}
                          className={`px-5 py-3.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9E9589] ${i === 6 ? "text-right" : ""}`}
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(139,94,60,0.06)]">
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-5 py-12 text-center text-[13px] text-[#9E9589]"
                      >
                        Nenhum caso crítico nesta categoria.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row) => (
                      <tr
                        key={row.orderId}
                        className={`group transition-colors hover:bg-[rgba(139,94,60,0.02)] ${
                          row.isOverdue ? "border-l-[3px] border-l-[#EF4444]" : ""
                        }`}
                      >
                        {/* ID curto com tooltip */}
                        <td className="px-5 py-4">
                          <code
                            className="rounded-md bg-[#F4F1EE] px-2 py-1 font-mono text-[11px] text-[#6B5E54]"
                            title={row.orderId}
                          >
                            #{row.orderId.slice(0, 8)}
                          </code>
                        </td>

                        {/* Cliente */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <CustomerAvatar name={row.customer} />
                            <div>
                              <p className="text-[13px] font-semibold text-[#1A1714]">
                                {row.customer}
                              </p>
                              <p className="text-[10px] font-semibold uppercase tracking-[0.10em] text-[#9E9589]">
                                {row.customerTag}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Seller */}
                        <td className="px-5 py-4 text-[12px] text-[#6B5E54]">
                          {row.seller}
                        </td>

                        {/* Problema */}
                        <td className="px-5 py-4">
                          <ProblemBadge problem={row.issue} />
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                                row.issue === "Chargeback"
                                  ? "bg-blue-500"
                                  : row.issue === "Sem Rastreio"
                                    ? "bg-[#9E9589]"
                                    : "bg-[#EF4444]"
                              }`}
                            />
                            <span className="text-[12px] text-[#6B5E54]">{row.status}</span>
                          </div>
                        </td>

                        {/* Prazo */}
                        <td className="px-5 py-4">
                          <DeadlineBadge deadline={row.deadline} isOverdue={row.isOverdue} />
                        </td>

                        {/* Ação */}
                        <td className="px-5 py-4 text-right">
                          <Link
                            href={`/adm/operacao/logistica?order=${row.orderId}`}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[#8B5E3C] px-3.5 py-1.5 text-[11px] font-semibold text-white transition-all hover:bg-[#7A5234] hover:shadow-[0_4px_12px_rgba(139,94,60,0.3)]"
                          >
                            <Zap className="h-3 w-3" strokeWidth={2.2} />
                            {row.action}
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Table footer */}
            <div className="flex items-center justify-between border-t border-[rgba(139,94,60,0.08)] px-5 py-3.5">
              <p className="text-[12px] text-[#9E9589]">
                Mostrando {filteredRows.length} de {criticalRows.length} casos críticos
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Página anterior"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[rgba(139,94,60,0.14)] text-[#9E9589] transition-colors hover:bg-[rgba(139,94,60,0.06)]"
                >
                  <ChevronLeft className="h-4 w-4" strokeWidth={1.8} />
                </button>
                <button
                  type="button"
                  aria-label="Próxima página"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[rgba(139,94,60,0.14)] text-[#9E9589] transition-colors hover:bg-[rgba(139,94,60,0.06)]"
                >
                  <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
