import Link from "next/link";
import { Cormorant_Garamond } from "next/font/google";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  MapPinned,
  PackageCheck,
  Truck,
  Waves,
  Zap,
} from "lucide-react";

import { FinanceSidebar } from "@/components/admin/financeiro/FinanceSidebar";
import { FinanceKpiCard } from "@/components/admin/financeiro/FinanceKpiCard";
import { ErrorState } from "@/components/adm/DataStates";
import { logisticsRepository } from "@/lib/adm/repositories";
import { getAdmDataSource } from "@/lib/adm/repositories/source";
import { buildHref, toListQueryParams, type AdmFilters, type SearchParamsInput } from "@/lib/adm/url";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

type LogisticsPageProps = {
  filters: AdmFilters;
  searchParamsSource: SearchParamsInput;
};

type ShipmentViewState = "todos" | "enviado" | "pendente" | "atrasado" | "sem-rastreio";

type DisplayShipment = {
  id: string;
  orderId: string;
  customerName: string;
  sellerName: string;
  carrier: string;
  trackingCode: string;
  eta: string;
  incidentType?: string;
  viewState: Exclude<ShipmentViewState, "todos">;
};

const tabs: Array<{ key: ShipmentViewState; label: string }> = [
  { key: "todos", label: "Todos" },
  { key: "enviado", label: "Em trânsito" },
  { key: "pendente", label: "Preparação" },
  { key: "atrasado", label: "Atrasados" },
  { key: "sem-rastreio", label: "Sem rastreio" },
];

const getShipmentViewState = (
  status: string,
  eta: string,
  incidentType?: string
): Exclude<ShipmentViewState, "todos"> => {
  const normalizedIncident = incidentType?.toLowerCase() ?? "";
  if (normalizedIncident.includes("sem rastreio")) return "sem-rastreio";
  if (status === "critico" || new Date(eta).getTime() < Date.now()) return "atrasado";
  if (status === "pendente" || status === "em-revisao") return "pendente";
  return "enviado";
};

const formatShortDate = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(value)
  );

function ShipmentStatusBadge({ state }: { state: Exclude<ShipmentViewState, "todos"> }) {
  const config = {
    atrasado:    { label: "Atrasado",    dot: "bg-[#EF4444]", text: "text-[#7F1D1D]", bg: "bg-[#FEE2E2]" },
    pendente:    { label: "Preparação",  dot: "bg-[#F59E0B]", text: "text-[#92400E]", bg: "bg-[#FEF3C7]" },
    "sem-rastreio": { label: "Sem rastreio", dot: "bg-[#9E9589]", text: "text-[#6B5E54]", bg: "bg-[#F4F1EE]" },
    enviado:     { label: "Em trânsito", dot: "bg-[#10B981]", text: "text-[#065F46]", bg: "bg-[#D1FAE5]" },
  }[state];

  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${config.bg} ${config.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

export async function LogisticsPage({ filters, searchParamsSource }: LogisticsPageProps) {
  const shipmentsResult = await logisticsRepository.listShipments(
    toListQueryParams(searchParamsSource, {
      page: 1,
      pageSize: 24,
      sortBy: "lastUpdateAt",
      sortDir: "desc",
    })
  );
  const incidentsResult = await logisticsRepository.listIncidents(
    toListQueryParams(searchParamsSource, {
      page: 1,
      pageSize: 6,
      sortBy: "openedAt",
      sortDir: "desc",
    })
  );

  if (!shipmentsResult.success || !incidentsResult.success) {
    return (
      <ErrorState
        title="Falha ao carregar logística"
        description="Não foi possível montar a visão de envios para este recorte."
      />
    );
  }

  const dataSource = await getAdmDataSource();
  const orderMap = Object.fromEntries(dataSource.orders.map((o) => [o.id, o]));
  const customerMap = Object.fromEntries(dataSource.customers.map((c) => [c.id, c]));
  const incidentByShipment = Object.fromEntries(
    dataSource.logisticsIncidents.map((i) => [i.shipmentId, i])
  );

  const rows: DisplayShipment[] = shipmentsResult.data.items.map((shipment) => {
    const order = orderMap[shipment.orderId];
    const customer = order ? customerMap[order.customerId] : undefined;
    const incident = incidentByShipment[shipment.id];
    const viewState = getShipmentViewState(shipment.status, shipment.eta, incident?.type);

    return {
      id: shipment.id,
      orderId: shipment.orderId,
      customerName: customer?.name ?? "Cliente Premium",
      sellerName: shipment.sellerName,
      carrier: shipment.carrier,
      trackingCode: shipment.trackingCode,
      eta: shipment.eta,
      incidentType: incident?.type,
      viewState,
    };
  });

  const activeTab = tabs.some((t) => t.key === filters.activity)
    ? (filters.activity as ShipmentViewState)
    : "todos";
  const visibleRows = activeTab === "todos" ? rows : rows.filter((r) => r.viewState === activeTab);
  const delayedCount = rows.filter((r) => r.viewState === "atrasado").length;
  const pendingCount = rows.filter((r) => r.viewState === "pendente").length;
  const transitCount = rows.filter((r) => r.viewState === "enviado").length;
  const missingTrackingCount = rows.filter((r) => r.viewState === "sem-rastreio").length;
  const onTimeRate = rows.length
    ? (((rows.length - delayedCount) / rows.length) * 100).toFixed(1)
    : "0.0";

  const tabCounts: Record<ShipmentViewState, number> = {
    todos: rows.length,
    enviado: transitCount,
    pendente: pendingCount,
    atrasado: delayedCount,
    "sem-rastreio": missingTrackingCount,
  };

  const incidentCards = incidentsResult.data.items.slice(0, 4);
  const carrierSummary = Array.from(
    rows.reduce<Map<string, number>>((acc, row) => {
      acc.set(row.carrier, (acc.get(row.carrier) ?? 0) + 1);
      return acc;
    }, new Map())
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#1A1714]">
      <FinanceSidebar activeHref="/adm/operacao/logistica" />

      <main className="pl-[220px]">
        {/* Header */}
        <header className="sticky top-0 z-20 border-b border-[rgba(139,94,60,0.10)] bg-[#FAFAF8]/90 px-10 py-5 backdrop-blur-md">
          <div className="flex items-center justify-between gap-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9E9589]">
                Módulo Operação
              </p>
              <h1 className={`${cormorant.className} text-[28px] font-medium leading-tight tracking-[-0.02em] text-[#1A1714]`}>
                Logística & Envios
              </h1>
              <p className="mt-0.5 text-[11px] text-[#9E9589]">
                {rows.length} envio{rows.length !== 1 ? "s" : ""} nesta janela
              </p>
            </div>
            <Link
              href="/adm/operacao/logistica/incidentes"
              className="flex items-center gap-2 rounded-full bg-[#EF4444] px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white shadow-[0_4px_16px_rgba(239,68,68,0.30)] transition-all hover:bg-[#DC2626] hover:shadow-[0_6px_20px_rgba(239,68,68,0.40)]"
            >
              <Zap className="h-3.5 w-3.5" strokeWidth={2.2} />
              Incidentes críticos
            </Link>
          </div>
        </header>

        <div className="px-10 py-8 space-y-6">
          {/* KPI Row */}
          <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <FinanceKpiCard
              label="Em Preparação"
              value={String(pendingCount)}
              subtext="Pedidos em embalagem"
              icon={<PackageCheck className="h-4 w-4" strokeWidth={1.8} />}
              variant="warning"
            />
            <FinanceKpiCard
              label="Em Trânsito"
              value={String(transitCount)}
              subtext="Fluxo embarcado"
              icon={<Truck className="h-4 w-4" strokeWidth={1.8} />}
            />
            <FinanceKpiCard
              label="Atrasos Críticos"
              value={String(delayedCount)}
              subtext="Escalação imediata"
              icon={<AlertTriangle className="h-4 w-4" strokeWidth={1.8} />}
              variant={delayedCount > 0 ? "critical" : "default"}
            />
            <FinanceKpiCard
              label="SLA no Prazo"
              value={`${onTimeRate}%`}
              subtext={`${missingTrackingCount} sem rastreio`}
              icon={<Waves className="h-4 w-4" strokeWidth={1.8} />}
              variant={parseFloat(onTimeRate) >= 95 ? "default" : "warning"}
            />
          </section>

          {/* Main grid — table + right panel */}
          <div className="grid gap-6 xl:grid-cols-[1fr_280px]">
            {/* Left: tabs + table */}
            <div className="space-y-4">
              {/* Tabs */}
              <div className="flex gap-0.5 overflow-x-auto border-b border-[rgba(139,94,60,0.08)]">
                {tabs.map((tab) => {
                  const active = activeTab === tab.key;
                  const count = tabCounts[tab.key];
                  return (
                    <Link
                      key={tab.key}
                      href={buildHref("/adm/operacao/logistica", searchParamsSource, {
                        activity: tab.key === "todos" ? undefined : tab.key,
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
                        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                          active
                            ? "bg-[rgba(139,94,60,0.12)] text-[#8B5E3C]"
                            : tab.key === "atrasado"
                              ? "bg-[#FEE2E2] text-[#EF4444]"
                              : "bg-[rgba(139,94,60,0.08)] text-[#8B5E3C]"
                        }`}>
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
                        {["#", "Cliente", "Seller", "Status", "Prazo", "Transportadora", "Rastreio", "Ação"].map((h, i) => (
                          <th
                            key={h}
                            className={`px-5 py-3.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9E9589] ${i === 7 ? "text-right" : ""}`}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(139,94,60,0.06)]">
                      {visibleRows.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-5 py-12 text-center text-[13px] text-[#9E9589]">
                            Nenhum envio nesta categoria.
                          </td>
                        </tr>
                      ) : (
                        visibleRows.map((row) => (
                          <tr
                            key={row.id}
                            className={`group transition-colors hover:bg-[rgba(139,94,60,0.02)] ${
                              row.viewState === "atrasado"
                                ? "border-l-[3px] border-l-[#EF4444]"
                                : row.viewState === "sem-rastreio"
                                  ? "border-l-[3px] border-l-[#F59E0B]"
                                  : ""
                            }`}
                          >
                            <td className="px-5 py-4">
                              <code
                                className="rounded-md bg-[#F4F1EE] px-2 py-1 font-mono text-[11px] text-[#6B5E54]"
                                title={row.orderId}
                              >
                                #{row.orderId.slice(0, 8)}
                              </code>
                            </td>
                            <td className="px-5 py-4 text-[13px] font-medium text-[#1A1714]">
                              {row.customerName}
                            </td>
                            <td className="px-5 py-4 text-[12px] text-[#6B5E54]">
                              {row.sellerName}
                            </td>
                            <td className="px-5 py-4">
                              <ShipmentStatusBadge state={row.viewState} />
                            </td>
                            <td className="px-5 py-4">
                              <span className={`text-[12px] font-medium ${
                                row.viewState === "atrasado" ? "text-[#EF4444]" : "text-[#6B5E54]"
                              }`}>
                                {formatShortDate(row.eta)}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-[12px] text-[#6B5E54]">
                              {row.carrier}
                            </td>
                            <td className="px-5 py-4 font-mono text-[11px] text-[#9E9589]">
                              {row.viewState === "sem-rastreio" ? (
                                <span className="text-[#F59E0B]">Não gerado</span>
                              ) : (
                                row.trackingCode
                              )}
                            </td>
                            <td className="px-5 py-4 text-right">
                              <Link
                                href={`/adm/operacao/logistica/envios/${row.id}`}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-[rgba(139,94,60,0.20)] px-3 py-1.5 text-[11px] font-semibold text-[#8B5E3C] transition-all hover:bg-[rgba(139,94,60,0.06)]"
                              >
                                Acompanhar
                              </Link>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-[rgba(139,94,60,0.08)] px-5 py-3.5">
                  <p className="text-[12px] text-[#9E9589]">
                    Mostrando {visibleRows.length} de {rows.length} envios
                  </p>
                  <div className="flex items-center gap-1">
                    <button type="button" aria-label="Página anterior" className="flex h-8 w-8 items-center justify-center rounded-lg border border-[rgba(139,94,60,0.14)] text-[#9E9589] transition-colors hover:bg-[rgba(139,94,60,0.06)]">
                      <ChevronLeft className="h-4 w-4" strokeWidth={1.8} />
                    </button>
                    <button type="button" aria-label="Próxima página" className="flex h-8 w-8 items-center justify-center rounded-lg border border-[rgba(139,94,60,0.14)] text-[#9E9589] transition-colors hover:bg-[rgba(139,94,60,0.06)]">
                      <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
                    </button>
                  </div>
                </div>
              </section>
            </div>

            {/* Right panel */}
            <div className="space-y-4">
              {/* Incidents */}
              <section className="rounded-2xl border border-[rgba(139,94,60,0.14)] bg-white p-5 shadow-[0_4px_16px_rgba(28,26,24,0.04)]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9E9589]">
                  Monitoramento
                </p>
                <h2 className={`${cormorant.className} mt-1 text-[20px] font-medium text-[#1A1714]`}>
                  {incidentCards.length} alertas em leitura
                </h2>
                <div className="mt-4 space-y-2.5">
                  {incidentCards.map((incident) => (
                    <Link
                      key={incident.id}
                      href={`/adm/operacao/logistica/incidentes?shipment=${incident.shipmentId}`}
                      className="flex items-start gap-3 rounded-xl border border-[rgba(139,94,60,0.10)] bg-[#FAFAF8] p-3.5 transition-colors hover:border-[rgba(139,94,60,0.22)] hover:bg-white"
                    >
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#EF4444]" strokeWidth={1.8} />
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold text-[#1A1714]">{incident.type}</p>
                        <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-[#9E9589]">
                          {incident.summary}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link
                  href="/adm/operacao/logistica/incidentes"
                  className="mt-4 block text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8B5E3C] underline underline-offset-4 transition-opacity hover:opacity-70"
                >
                  Ver todos os incidentes
                </Link>
              </section>

              {/* Carriers */}
              <section className="rounded-2xl border border-[rgba(139,94,60,0.14)] bg-white p-5 shadow-[0_4px_16px_rgba(28,26,24,0.04)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9E9589]">
                      Transportadoras
                    </p>
                    <h2 className={`${cormorant.className} mt-1 text-[18px] font-medium text-[#1A1714]`}>
                      Prioridade operacional
                    </h2>
                  </div>
                  <MapPinned className="h-4 w-4 shrink-0 text-[#9E9589]" strokeWidth={1.8} />
                </div>
                <div className="mt-4 space-y-3">
                  {carrierSummary.map(([carrier, count]) => (
                    <div
                      key={carrier}
                      className="flex items-center justify-between border-b border-[rgba(139,94,60,0.08)] pb-3 last:border-0 last:pb-0"
                    >
                      <div>
                        <p className="text-[13px] font-semibold text-[#1A1714]">{carrier}</p>
                        <p className="text-[11px] text-[#9E9589]">{count} envio{count !== 1 ? "s" : ""}</p>
                      </div>
                      <span className="rounded-full bg-[#D1FAE5] px-2 py-0.5 text-[10px] font-bold text-[#065F46]">
                        Ativa
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
