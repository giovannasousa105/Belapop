import Link from "next/link";
import { Noto_Serif } from "next/font/google";
import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  CalendarDays,
  ChevronRight,
  LayoutDashboard,
  MapPinned,
  PackageCheck,
  Settings,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  Store,
  Truck,
  Wallet,
  Waves
} from "lucide-react";

import { ErrorState } from "@/components/adm/DataStates";
import { logisticsRepository } from "@/lib/adm/repositories";
import { getAdmDataSource } from "@/lib/adm/repositories/source";
import { buildHref, toListQueryParams, type AdmFilters, type SearchParamsInput } from "@/lib/adm/url";

type LogisticsPageProps = {
  filters: AdmFilters;
  searchParamsSource: SearchParamsInput;
};

type ShipmentViewState = "todos" | "enviado" | "pendente" | "atrasado" | "sem-rastreio";

type SidebarItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  active?: boolean;
};

type LogisticsMetric = {
  label: string;
  value: string;
  detail: string;
  tone: "primary" | "secondary" | "tertiary" | "muted";
  icon: LucideIcon;
};

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

const editorialSerif = Noto_Serif({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"]
});

const logisticsTheme = {
  "--logistics-bg": "#fbf9f4",
  "--logistics-sidebar": "#f5f4ed",
  "--logistics-surface": "#ffffff",
  "--logistics-surface-low": "#efeee6",
  "--logistics-surface-high": "#e8e9e0",
  "--logistics-surface-highest": "#e2e3d9",
  "--logistics-text": "#31332c",
  "--logistics-text-soft": "#5e6058",
  "--logistics-outline": "#797c73",
  "--logistics-outline-variant": "rgba(177,179,169,0.16)",
  "--logistics-primary": "#5f5e5e",
  "--logistics-primary-dim": "#535252",
  "--logistics-secondary": "#6e5b4d",
  "--logistics-tertiary": "#a23d3e",
  "--logistics-shadow": "0 20px 40px rgba(49, 51, 44, 0.04)"
} as CSSProperties;

const sidebarItems: SidebarItem[] = [
  { label: "Dashboard", href: "/adm/dashboard-executivo", icon: LayoutDashboard },
  { label: "Curadoria", href: "/adm/curadoria/produtos", icon: Sparkles },
  { label: "Sellers", href: "/adm/operacao/parceiros", icon: Store },
  { label: "Pedidos", href: "/adm/operacao/pedidos-criticos", icon: ShoppingBag },
  { label: "Logística", href: "/adm/operacao/logistica", icon: Truck, active: true },
  { label: "Risco", href: "/adm/financeiro/risco", icon: ShieldAlert },
  { label: "Financeiro", href: "/adm/financeiro", icon: Wallet },
  { label: "Configurações", href: "/adm/gestao/configuracoes", icon: Settings }
];

const tabs: Array<{ key: ShipmentViewState; label: string }> = [
  { key: "todos", label: "Todos" },
  { key: "enviado", label: "Em trânsito" },
  { key: "pendente", label: "Preparação" },
  { key: "atrasado", label: "Atrasados" },
  { key: "sem-rastreio", label: "Sem rastreio" }
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

function SidebarLink({ item }: { item: SidebarItem }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={`group flex items-center gap-3 px-6 py-3 text-sm tracking-wide transition-colors ${
        item.active
          ? "border-l-2 border-[var(--logistics-primary)] bg-[rgba(239,238,230,0.55)] font-bold text-[var(--logistics-text)]"
          : "pl-[26px] text-[var(--logistics-primary)] hover:bg-[var(--logistics-surface-low)]"
      }`}
    >
      <Icon className="h-4.5 w-4.5 shrink-0" strokeWidth={item.active ? 2 : 1.8} />
      <span>{item.label}</span>
    </Link>
  );
}

function LogisticsMetricCard({ metric }: { metric: LogisticsMetric }) {
  const Icon = metric.icon;
  const toneClass =
    metric.tone === "primary"
      ? "text-[var(--logistics-primary)]"
      : metric.tone === "secondary"
        ? "text-[var(--logistics-secondary)]"
        : metric.tone === "tertiary"
          ? "text-[var(--logistics-tertiary)]"
          : "text-[var(--logistics-outline)]";

  return (
    <article
      className="rounded-xl border border-[var(--logistics-outline-variant)] bg-[var(--logistics-surface)] p-6"
      style={{ boxShadow: "var(--logistics-shadow)" }}
    >
      <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--logistics-text-soft)]">
        {metric.label}
      </p>
      <p className={`${editorialSerif.className} text-4xl text-[var(--logistics-text)]`}>
        {metric.value}
      </p>
      <div className={`mt-4 flex items-center gap-2 text-xs ${toneClass}`}>
        <Icon className="h-4 w-4" strokeWidth={1.9} />
        <span>{metric.detail}</span>
      </div>
    </article>
  );
}

function ShipmentStatus({ state }: { state: DisplayShipment["viewState"] }) {
  const config =
    state === "atrasado"
      ? { label: "Atrasado", dot: "bg-[var(--logistics-tertiary)]", text: "text-[var(--logistics-tertiary)]" }
      : state === "pendente"
        ? {
            label: "Preparação",
            dot: "bg-[var(--logistics-secondary)]",
            text: "text-[var(--logistics-secondary)]"
          }
        : state === "sem-rastreio"
          ? { label: "Sem rastreio", dot: "bg-[var(--logistics-outline)]", text: "text-[var(--logistics-outline)]" }
          : { label: "Em trânsito", dot: "bg-[var(--logistics-primary)]", text: "text-[var(--logistics-primary)]" };

  return (
    <div className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] ${config.text}`}>
      <span className={`h-2 w-2 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </div>
  );
}

export async function LogisticsPage({ filters, searchParamsSource }: LogisticsPageProps) {
  const shipmentsResult = await logisticsRepository.listShipments(
    toListQueryParams(searchParamsSource, {
      page: 1,
      pageSize: 24,
      sortBy: "lastUpdateAt",
      sortDir: "desc"
    })
  );
  const incidentsResult = await logisticsRepository.listIncidents(
    toListQueryParams(searchParamsSource, {
      page: 1,
      pageSize: 6,
      sortBy: "openedAt",
      sortDir: "desc"
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
  const orderMap = Object.fromEntries(dataSource.orders.map((order) => [order.id, order]));
  const customerMap = Object.fromEntries(dataSource.customers.map((customer) => [customer.id, customer]));
  const incidentByShipment = Object.fromEntries(
    dataSource.logisticsIncidents.map((incident) => [incident.shipmentId, incident])
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
      viewState
    };
  });

  const activeTab = tabs.some((tab) => tab.key === filters.activity)
    ? (filters.activity as ShipmentViewState)
    : "todos";
  const visibleRows = activeTab === "todos" ? rows : rows.filter((row) => row.viewState === activeTab);
  const featuredRows = visibleRows.slice(0, 6);
  const delayedCount = rows.filter((row) => row.viewState === "atrasado").length;
  const pendingCount = rows.filter((row) => row.viewState === "pendente").length;
  const transitCount = rows.filter((row) => row.viewState === "enviado").length;
  const missingTrackingCount = rows.filter((row) => row.viewState === "sem-rastreio").length;
  const onTimeRate = rows.length ? (((rows.length - delayedCount) / rows.length) * 100).toFixed(1) : "0.0";

  const metrics: LogisticsMetric[] = [
    {
      label: "Em preparação",
      value: String(pendingCount),
      detail: "Pedidos em embalagem premium",
      tone: "secondary",
      icon: PackageCheck
    },
    {
      label: "Em trânsito",
      value: String(transitCount),
      detail: "Fluxo embarcado na janela atual",
      tone: "primary",
      icon: Truck
    },
    {
      label: "Atrasos críticos",
      value: String(delayedCount),
      detail: "Escalação imediata",
      tone: "tertiary",
      icon: AlertTriangle
    },
    {
      label: "SLA no prazo",
      value: `${onTimeRate}%`,
      detail: `${missingTrackingCount} envios sem rastreio ativo`,
      tone: "muted",
      icon: Waves
    }
  ];

  const carrierSummary = Array.from(
    rows.reduce<Map<string, number>>((acc, row) => {
      acc.set(row.carrier, (acc.get(row.carrier) ?? 0) + 1);
      return acc;
    }, new Map())
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const incidentCards = incidentsResult.data.items.slice(0, 3);

  return (
    <div
      style={logisticsTheme}
      className="min-h-screen bg-[var(--logistics-bg)] text-[var(--logistics-text)] antialiased"
    >
      <div className="flex min-h-screen">
        <aside className="fixed left-0 top-0 hidden h-screen w-72 flex-col border-r border-[var(--logistics-outline-variant)] bg-[var(--logistics-sidebar)] py-8 xl:flex">
          <div className="px-8">
            <h1 className={`${editorialSerif.className} text-2xl italic tracking-tight text-[var(--logistics-text)]`}>
              BelaPop
            </h1>
            <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-[var(--logistics-text-soft)]">
              Curator Workspace
            </p>
          </div>

          <nav className="mt-8 flex-1 space-y-1">
            {sidebarItems.map((item) => (
              <SidebarLink key={item.label} item={item} />
            ))}
          </nav>

          <div className="mt-auto px-6">
            <Link
              href="/adm/operacao/logistica/incidentes"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-[var(--logistics-primary)] px-6 text-[11px] font-bold uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-90"
            >
              Ver incidentes
            </Link>
          </div>
        </aside>

        <main className="flex-1 xl:ml-72">
          <header className="sticky top-0 z-40 bg-[rgba(251,249,244,0.86)] backdrop-blur-xl">
            <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-5 px-6 py-6 xl:px-12">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--logistics-text-soft)]">
                    Operação / Envios Premium
                  </p>
                  <h2 className={`${editorialSerif.className} mt-2 text-4xl tracking-tight text-[var(--logistics-text)]`}>
                    Logística & envios
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--logistics-text-soft)]">
                    Controle editorial da malha, leitura de risco por transportadora e visão limpa
                    dos envios que exigem resposta rápida da operação.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="inline-flex min-h-11 items-center gap-3 rounded-full border border-[var(--logistics-outline-variant)] bg-[var(--logistics-surface)] px-4 text-xs font-medium tracking-wide text-[var(--logistics-text)]">
                    <CalendarDays className="h-4 w-4" strokeWidth={1.8} />
                    <span>01 Jan — 31 Jan 2024</span>
                  </div>
                  <Link
                    href="/adm/operacao/logistica/incidentes"
                    className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--logistics-text)] px-6 text-[11px] font-bold uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-90"
                  >
                    Incidentes críticos
                  </Link>
                </div>
              </div>
            </div>
          </header>

          <div className="mx-auto w-full max-w-[1680px] px-6 py-10 xl:px-12">
            <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
              {metrics.map((metric) => (
                <LogisticsMetricCard key={metric.label} metric={metric} />
              ))}
            </section>

            <section className="mt-10 grid grid-cols-1 gap-8 xl:grid-cols-12">
              <div className="space-y-6 xl:col-span-8">
                <nav className="overflow-x-auto">
                  <div className="flex min-w-max gap-10 border-b border-[var(--logistics-outline-variant)] pb-0.5">
                    {tabs.map((tab) => {
                      const active = activeTab === tab.key;
                      return (
                        <Link
                          key={tab.key}
                          href={buildHref("/adm/operacao/logistica", searchParamsSource, {
                            activity: tab.key === "todos" ? undefined : tab.key,
                            page: undefined
                          })}
                          className={`pb-4 text-xs font-bold uppercase tracking-[0.18em] transition ${
                            active
                              ? "border-b-2 border-[var(--logistics-text)] text-[var(--logistics-text)]"
                              : "text-[var(--logistics-text-soft)] hover:text-[var(--logistics-text)]"
                          }`}
                        >
                          {tab.label}
                        </Link>
                      );
                    })}
                  </div>
                </nav>

                <section
                  className="overflow-hidden rounded-xl border border-[var(--logistics-outline-variant)] bg-[var(--logistics-surface)]"
                  style={{ boxShadow: "var(--logistics-shadow)" }}
                >
                  <div className="flex items-end justify-between gap-6 px-8 py-7">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--logistics-text-soft)]">
                        Manifesto de envios
                      </p>
                      <h3 className={`${editorialSerif.className} mt-2 text-2xl text-[var(--logistics-text)]`}>
                        Jornada logística em acompanhamento
                      </h3>
                    </div>
                    <Link
                      href="/adm/operacao/logistica/incidentes"
                      className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--logistics-text-soft)] underline underline-offset-4"
                    >
                      Ver todos os incidentes
                    </Link>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse text-left">
                      <thead>
                        <tr className="bg-[var(--logistics-surface-low)]">
                          <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--logistics-text-soft)]">
                            Pedido
                          </th>
                          <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--logistics-text-soft)]">
                            Cliente
                          </th>
                          <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--logistics-text-soft)]">
                            Seller
                          </th>
                          <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--logistics-text-soft)]">
                            Status
                          </th>
                          <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--logistics-text-soft)]">
                            Prazo
                          </th>
                          <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--logistics-text-soft)]">
                            Transportadora
                          </th>
                          <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--logistics-text-soft)]">
                            Rastreio
                          </th>
                          <th className="px-8 py-5 text-right text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--logistics-text-soft)]">
                            Ação
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[rgba(177,179,169,0.10)]">
                        {featuredRows.map((row) => (
                          <tr
                            key={row.id}
                            className={`transition-colors hover:bg-[var(--logistics-surface-low)] ${
                              row.viewState === "atrasado"
                                ? "border-l-2 border-l-[var(--logistics-tertiary)]"
                                : row.viewState === "sem-rastreio"
                                  ? "border-l-2 border-l-[var(--logistics-secondary)]"
                                  : ""
                            }`}
                          >
                            <td className="px-8 py-7">
                              <span className="font-medium tracking-[-0.02em] text-[var(--logistics-text)]">
                                {row.orderId}
                              </span>
                            </td>
                            <td className="px-8 py-7 text-sm text-[var(--logistics-text)]">
                              {row.customerName}
                            </td>
                            <td className="px-8 py-7 text-sm text-[var(--logistics-text-soft)]">
                              {row.sellerName}
                            </td>
                            <td className="px-8 py-7">
                              <ShipmentStatus state={row.viewState} />
                            </td>
                            <td className="px-8 py-7">
                              <span
                                className={`text-sm ${
                                  row.viewState === "atrasado"
                                    ? "font-medium text-[var(--logistics-tertiary)]"
                                    : "text-[var(--logistics-text)]"
                                }`}
                              >
                                {formatShortDate(row.eta)}
                              </span>
                            </td>
                            <td className="px-8 py-7 text-sm text-[var(--logistics-text)]">
                              {row.carrier}
                            </td>
                            <td className="px-8 py-7 text-xs text-[var(--logistics-text-soft)]">
                              {row.viewState === "sem-rastreio" ? "Não gerado" : row.trackingCode}
                            </td>
                            <td className="px-8 py-7 text-right">
                              <Link
                                href={`/adm/operacao/logistica/envios/${row.id}?shipment=${row.id}`}
                                className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--logistics-text)] underline underline-offset-4"
                              >
                                Acompanhar
                                <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>

              <aside className="space-y-6 xl:col-span-4">
                <section
                  className="rounded-xl border border-[var(--logistics-outline-variant)] bg-[var(--logistics-surface-low)] p-8"
                  style={{ boxShadow: "var(--logistics-shadow)" }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--logistics-text-soft)]">
                    Monitoramento crítico
                  </p>
                  <h3 className={`${editorialSerif.className} mt-3 text-3xl text-[var(--logistics-text)]`}>
                    {incidentCards.length} alertas em leitura ativa
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-[var(--logistics-text-soft)]">
                    A malha atual exige atenção sobre atrasos, pedidos sem rastreio e sellers com
                    risco de quebra de SLA na janela premium.
                  </p>
                  <div className="mt-6 space-y-4">
                    {incidentCards.map((incident) => (
                      <Link
                        key={incident.id}
                        href={`/adm/operacao/logistica/incidentes?shipment=${incident.shipmentId}`}
                        className="block rounded-xl bg-[var(--logistics-surface)] p-4 transition-colors hover:bg-white"
                      >
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--logistics-tertiary)]" />
                          <div>
                            <p className="text-sm font-semibold text-[var(--logistics-text)]">
                              {incident.type}
                            </p>
                            <p className="mt-1 text-xs leading-6 text-[var(--logistics-text-soft)]">
                              {incident.summary}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>

                <section
                  className="rounded-xl border border-[var(--logistics-outline-variant)] bg-[var(--logistics-surface)] p-8"
                  style={{ boxShadow: "var(--logistics-shadow)" }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--logistics-text-soft)]">
                        Transportadoras
                      </p>
                      <h3 className={`${editorialSerif.className} mt-2 text-2xl text-[var(--logistics-text)]`}>
                        Prioridade operacional
                      </h3>
                    </div>
                    <MapPinned className="h-5 w-5 text-[var(--logistics-primary)]" strokeWidth={1.8} />
                  </div>

                  <div className="mt-6 space-y-4">
                    {carrierSummary.map(([carrier, count]) => (
                      <div
                        key={carrier}
                        className="flex items-center justify-between border-b border-[rgba(177,179,169,0.12)] pb-4 last:border-b-0 last:pb-0"
                      >
                        <div>
                          <p className="text-sm font-semibold text-[var(--logistics-text)]">{carrier}</p>
                          <p className="text-xs text-[var(--logistics-text-soft)]">
                            {count} envios nesta janela
                          </p>
                        </div>
                        <span className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--logistics-primary)]">
                          Ativa
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                <section
                  className="rounded-xl border border-[var(--logistics-outline-variant)] bg-[var(--logistics-surface)] p-8"
                  style={{ boxShadow: "var(--logistics-shadow)" }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--logistics-text-soft)]">
                    Diretriz da operação
                  </p>
                  <p className={`${editorialSerif.className} mt-3 text-2xl italic text-[var(--logistics-text)]`}>
                    Transparência logística é parte da curadoria.
                  </p>
                  <p className="mt-4 text-sm leading-7 text-[var(--logistics-text-soft)]">
                    Para sellers premium, a prioridade não é apenas entregar, mas sustentar a
                    percepção de confiança em cada atualização de rota, prazo e tratativa.
                  </p>
                </section>
              </aside>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
