import Image from "next/image";
import Link from "next/link";
import { Noto_Serif } from "next/font/google";
import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Bolt,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Search,
  Settings,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  Store,
  Truck,
  Wallet
} from "lucide-react";

import { ordersRepository } from "@/lib/adm/repositories";
import { getAdmDataSource } from "@/lib/adm/repositories/source";
import { buildHref, toListQueryParams, type AdmFilters, type SearchParamsInput } from "@/lib/adm/url";

type CriticalOrdersPageProps = {
  filters: AdmFilters;
  searchParamsSource?: SearchParamsInput;
};

type CriticalTab = "todos" | "atraso-envio" | "devolucao-pendente" | "chargeback" | "sem-rastreio";

type SidebarItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  active?: boolean;
};

type CriticalMetric = {
  label: string;
  value: string;
  detail: string;
  detailTone?: "danger" | "neutral";
  suffix?: string;
};

type CriticalRow = {
  orderId: string;
  customer: string;
  customerTag: string;
  seller: string;
  issue: string;
  issueClassName: string;
  status: string;
  statusDotClassName: string;
  deadline: string;
  deadlineClassName: string;
  action: string;
  image: string;
  imageAlt: string;
};

const editorialSerif = Noto_Serif({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"]
});

const criticalTheme = {
  "--critical-bg": "#fbf9f4",
  "--critical-sidebar": "#f5f4ed",
  "--critical-surface": "#fbf9f4",
  "--critical-surface-low": "#f5f4ed",
  "--critical-surface-high": "#e8e9e0",
  "--critical-surface-highest": "#e2e3d9",
  "--critical-text": "#31332c",
  "--critical-text-soft": "#797c73",
  "--critical-primary": "#5f5e5e",
  "--critical-secondary": "#6e5b4d",
  "--critical-tertiary": "#a23d3e",
  "--critical-border": "rgba(177,179,169,0.15)"
} as CSSProperties;

const sidebarItems: SidebarItem[] = [
  { label: "Dashboard", href: "/adm/dashboard-executivo", icon: LayoutDashboard },
  { label: "Curadoria", href: "/adm/curadoria/produtos", icon: Sparkles },
  { label: "Sellers", href: "/adm/operacao/parceiros", icon: Store },
  { label: "Pedidos", href: "/adm/operacao/pedidos-criticos", icon: ShoppingBag, active: true },
  { label: "Logística", href: "/adm/operacao/logistica", icon: Truck },
  { label: "Risco", href: "/adm/financeiro/risco", icon: ShieldAlert },
  { label: "Financeiro", href: "/adm/financeiro", icon: Wallet },
  { label: "Configurações", href: "/adm/gestao/configuracoes", icon: Settings }
];

const tabs: Array<{ label: string; value: CriticalTab }> = [
  { label: "Todos", value: "todos" },
  { label: "Atraso de Envio", value: "atraso-envio" },
  { label: "Devolução Pendente", value: "devolucao-pendente" },
  { label: "Chargeback", value: "chargeback" },
  { label: "Sem Rastreio", value: "sem-rastreio" }
];

const rows: CriticalRow[] = [
  {
    orderId: "#BP-8821",
    customer: "Mariana Silveira",
    customerTag: "PREMIUM MEMBER",
    seller: "L'Artisan Paris",
    issue: "Atraso Crítico",
    issueClassName: "bg-[rgba(255,132,130,0.2)] text-[var(--critical-tertiary)]",
    status: "Aguardando Seller",
    statusDotClassName: "bg-[var(--critical-tertiary)] shadow-[0_0_8px_rgba(162,61,62,0.4)]",
    deadline: "Esgotado",
    deadlineClassName: "text-[var(--critical-tertiary)]",
    action: "Intervir",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCEPe4xwYfdQT-gQyGItUsyamS0ooLl39VNZtV_4ECz2bVnhN1z300JbP0Wf0lBIaBTUZy-s0CFrzi5l9p78VqDdd885lY2SFhHg0y254jtg6KzVB90aR2bv_6dEZK5xSUZhTlW2VYsVuulHC204gJQ1hkrHuQXTQAxdYmyKiwgNlRavMIz3fghb5fRnS5r5-euVFZ-FnMJn6h-U2ibn4zNqoUUGsmpuXxhnrn-eo0IzqADUjaHtW69kH5EhwzL6ZGuviQWMbFajB0E",
    imageAlt: "Retrato editorial feminino com maquiagem neutra e fundo limpo"
  },
  {
    orderId: "#BP-9044",
    customer: "Arthur Mendes",
    customerTag: "STANDARD",
    seller: "Studio Minimalist",
    issue: "Sem Rastreio",
    issueClassName: "bg-[var(--critical-surface-highest)] text-[var(--critical-text-soft)]",
    status: "Em Verificação",
    statusDotClassName: "bg-[rgba(177,179,169,1)]",
    deadline: "24h restantes",
    deadlineClassName: "text-[var(--critical-text)]",
    action: "Detalhes",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAVVmHXSwh-fCvhoBFQ_TxcGBVXUuMcDoa3vs1f7aIWLH97pQDbS_Evxza8jGhHiX1UHFMXAOpVNMwGeDOYO3I7E1q3YdWuLqN-PmYcVWxTgGgrtfkCq9PWbXjFAnTtiFPAp25f8msYxUbPbpQhmHWFxoHcDQG3ce_McsKgwr15cU8KWwVn8TBUMtOwX1aaHW9ARN2CRGlIwPzDGZ6ZQx_MirFN8Lv_LArbg1hxHAyCBZbtms8FqIeeOjqWM8oRtXxkJ_SsMw0k90Mj",
    imageAlt: "Retrato masculino minimalista em fundo areia"
  },
  {
    orderId: "#BP-8772",
    customer: "Isadora Porto",
    customerTag: "PREMIUM MEMBER",
    seller: "Casa & Alento",
    issue: "Chargeback",
    issueClassName: "bg-[rgba(248,222,204,0.3)] text-[var(--critical-secondary)]",
    status: "Sob Análise",
    statusDotClassName: "bg-[var(--critical-secondary)] shadow-[0_0_8px_rgba(110,91,77,0.3)]",
    deadline: "Urgente",
    deadlineClassName: "text-[var(--critical-tertiary)]",
    action: "Resolver",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBlKrG_pQbQ5wEygYqy0jcU1b5cylbR43fB_Qefo92SI79CScMhV1WVVdh7xRpQ3eGJJR1ymsBwJ9YR4JCejeNyNC9ZqCACWRS1p9goiJ6KbGroDhbH0dtQ-UVvW6aBCDfj_6-6o7cQ0J26MRoScfR5ePYI84k_YRtzx0MuYXfF0Cj3O1GPhHekEJodLdG0Z1DtZeFuwhOdrdcXket41kjIrSuVWrlgXL9bwm73n5f_BUk1HFce0WurdTysaceeL9R85-fPWUK63ShB",
    imageAlt: "Retrato feminino suave em luz natural editorial"
  }
];

function SidebarLink({ item }: { item: SidebarItem }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 pl-4 py-2 text-sm tracking-wide transition-all duration-200 ${
        item.active
          ? "border-l-2 border-[var(--critical-primary)] bg-[var(--critical-surface-mid,rgba(239,238,230,1))] font-bold text-[var(--critical-text)]"
          : "text-[var(--critical-primary)] opacity-80 hover:bg-[rgba(239,238,230,1)]"
      }`}
    >
      <Icon className="h-4.5 w-4.5" strokeWidth={item.active ? 2 : 1.8} />
      <span>{item.label}</span>
    </Link>
  );
}

export async function CriticalOrdersPage({
  filters,
  searchParamsSource = filters
}: CriticalOrdersPageProps) {
  const referenceTime = new Date("2026-04-10T00:00:00Z").getTime();
  const activeTab = tabs.some((tab) => tab.value === filters.activity)
    ? (filters.activity as CriticalTab)
    : "todos";
  const serif = editorialSerif.className;
  const [ordersResult, dataSource] = await Promise.all([
    ordersRepository.listOrders(
      toListQueryParams(searchParamsSource, {
        page: 1,
        pageSize: 24,
        sortBy: "createdAt",
        sortDir: "desc"
      })
    ),
    getAdmDataSource()
  ]);
  const customerMap = Object.fromEntries(dataSource.customers.map((customer) => [customer.id, customer]));
  const sellerMap = Object.fromEntries(dataSource.sellers.map((seller) => [seller.id, seller]));
  const incidentByOrder = Object.fromEntries(dataSource.logisticsIncidents.map((incident) => [incident.orderId, incident]));
  const refundByOrder = Object.fromEntries(dataSource.refunds.map((refund) => [refund.orderId, refund]));
  const alertByOrder = Object.fromEntries(
    dataSource.financialAlerts
      .filter((alert) => alert.orderId)
      .map((alert) => [alert.orderId as string, alert])
  );
  const criticalRows = ordersResult.data.items
    .filter((order) => {
      const incident = incidentByOrder[order.id];
      const refund = refundByOrder[order.id];
      const alert = alertByOrder[order.id];
      return order.priority !== "baixa" || Boolean(incident) || Boolean(refund) || Boolean(alert);
    })
    .map((order, index) => {
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
      const issueClassName =
        issue === "Chargeback"
          ? "bg-[rgba(248,222,204,0.3)] text-[var(--critical-secondary)]"
          : issue === "Sem Rastreio"
            ? "bg-[var(--critical-surface-highest)] text-[var(--critical-text-soft)]"
            : issue === "Devolução Pendente"
              ? "bg-[rgba(248,222,204,0.3)] text-[var(--critical-secondary)]"
              : "bg-[rgba(255,132,130,0.2)] text-[var(--critical-tertiary)]";
      const tabValue: CriticalTab =
        issue === "Chargeback"
          ? "chargeback"
          : issue === "Sem Rastreio"
            ? "sem-rastreio"
            : issue === "Devolução Pendente"
              ? "devolucao-pendente"
              : "atraso-envio";
      const remainingDays = Math.ceil((new Date(order.eta).getTime() - referenceTime) / 86400000);

      return {
        orderId: order.id,
        customer: customer?.name ?? order.customerName,
        customerTag: customer?.segment === "premium" ? "PREMIUM MEMBER" : "STANDARD",
        seller: seller?.name ?? order.sellerName,
        issue,
        issueClassName,
        status: refund ? "Aguardando Financeiro" : alert ? "Em Análise" : "Aguardando Seller",
        statusDotClassName:
          issue === "Chargeback"
            ? "bg-[var(--critical-secondary)] shadow-[0_0_8px_rgba(110,91,77,0.3)]"
            : issue === "Sem Rastreio"
              ? "bg-[rgba(177,179,169,1)]"
              : "bg-[var(--critical-tertiary)] shadow-[0_0_8px_rgba(162,61,62,0.4)]",
        deadline: remainingDays < 0 ? "Esgotado" : `${remainingDays}d restantes`,
        deadlineClassName: remainingDays < 0 ? "text-[var(--critical-tertiary)]" : "text-[var(--critical-text)]",
        action: refund ? "Resolver" : alert ? "Detalhes" : "Intervir",
        image: rows[index % rows.length].image,
        imageAlt: rows[index % rows.length].imageAlt,
        tabValue
      };
    });
  const filteredRows =
    activeTab === "todos" ? criticalRows : criticalRows.filter((row) => row.tabValue === activeTab);
  const metricCards: CriticalMetric[] = [
    {
      label: "Total Críticos",
      value: String(criticalRows.length),
      detail: `${criticalRows.filter((row) => row.deadline === "Esgotado").length} esgotados`,
      detailTone: "danger"
    },
    {
      label: "Atraso Médio",
      value:
        criticalRows.length > 0
          ? (
              criticalRows.reduce((sum, row) => {
                const order = dataSource.orders.find((item) => item.id === row.orderId);
                if (!order) return sum;
                return sum + Math.max(0, Math.ceil((referenceTime - new Date(order.eta).getTime()) / 86400000));
              }, 0) / criticalRows.length
            ).toFixed(1)
          : "0.0",
      detail: "dias",
      detailTone: "neutral"
    },
    {
      label: "Taxa de Resolução",
      value: `${Math.max(0, 100 - criticalRows.length * 7).toFixed(1)}%`,
      detail: "Meta: 95%",
      detailTone: "neutral"
    }
  ];

  return (
    <div
      style={criticalTheme}
      className="min-h-screen overflow-x-hidden bg-[var(--critical-bg)] text-[var(--critical-text)] antialiased"
    >
      <aside className="fixed left-0 top-0 hidden h-screen w-72 flex-col bg-[var(--critical-sidebar)] px-6 py-10 lg:flex">
        <div className="flex flex-col gap-1">
          <h1 className={`${serif} text-lg tracking-tight text-[var(--critical-text)]`}>
            Curator Admin
          </h1>
          <span className="text-[10px] uppercase tracking-[0.24em] text-[var(--critical-text-soft)]">
            Premium Tier
          </span>
        </div>

        <nav className="mt-8 flex-1 space-y-4">
          {sidebarItems.map((item) => (
            <SidebarLink key={item.label} item={item} />
          ))}
        </nav>

        <div className="mt-auto">
          <Link
            href="/adm"
            className="flex items-center gap-3 pl-4 py-2 text-sm tracking-wide text-[var(--critical-primary)] opacity-80 transition-all duration-200 hover:bg-[rgba(239,238,230,1)]"
          >
            <LogOut className="h-4.5 w-4.5" strokeWidth={1.8} />
            <span>Logout</span>
          </Link>
        </div>
      </aside>

      <main className="min-h-screen p-6 lg:ml-72 lg:p-12">
        <header className="mb-16 flex flex-col gap-6 md:flex-row md:items-baseline md:justify-between">
          <div>
            <h2 className={`${serif} text-4xl tracking-tight text-[var(--critical-text)]`}>
              Pedidos Críticos
            </h2>
            <p className="mt-2 text-sm text-[var(--critical-text-soft)]">
              Segunda-feira, 23 de Outubro de 2023
            </p>
          </div>
          <div className="flex gap-4">
            <button
              type="button"
              className="rounded-full p-2 text-[var(--critical-primary)] transition-colors hover:bg-[var(--critical-surface-low)]"
              aria-label="Buscar"
            >
              <Search className="h-5 w-5" strokeWidth={1.8} />
            </button>
            <button
              type="button"
              className="rounded-full p-2 text-[var(--critical-primary)] transition-colors hover:bg-[var(--critical-surface-low)]"
              aria-label="Notificações"
            >
              <Bell className="h-5 w-5" strokeWidth={1.8} />
            </button>
          </div>
        </header>

        <section className="mb-16 grid grid-cols-1 gap-8 md:grid-cols-3">
          {metricCards.map((metric) => (
            <article
              key={metric.label}
              className="flex flex-col gap-4 rounded-xl bg-[var(--critical-surface-low)] p-8"
            >
              <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--critical-text-soft)]">
                {metric.label}
              </span>
              <div className="flex items-baseline gap-2">
                <span className={`${serif} text-5xl font-light text-[var(--critical-text)]`}>
                  {metric.value}
                </span>
                <span
                  className={`text-xs ${
                    metric.detailTone === "danger"
                      ? "text-[var(--critical-tertiary)]"
                      : "text-[var(--critical-text-soft)]"
                  }`}
                >
                  {metric.detail}
                </span>
              </div>
            </article>
          ))}
        </section>

        <nav className="mb-12 flex gap-12 overflow-x-auto whitespace-nowrap border-b border-[rgba(177,179,169,0.1)]">
          {tabs.map((tab) => {
            const active = tab.value === activeTab;

            return (
              <Link
                key={tab.value}
                href={buildHref("/adm/operacao/pedidos-criticos", searchParamsSource, {
                  activity: tab.value === "todos" ? undefined : tab.value,
                  page: undefined
                })}
                className={`pb-4 text-sm transition-all ${
                  active
                    ? "border-b-2 border-[var(--critical-text)] font-bold text-[var(--critical-text)]"
                    : "text-[var(--critical-text-soft)] hover:text-[var(--critical-text)]"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>

        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0 text-left">
            <thead>
              <tr className="text-[10px] uppercase tracking-[0.15em] text-[var(--critical-text-soft)]">
                <th className="pb-6 pl-4">Pedido</th>
                <th className="pb-6">Cliente</th>
                <th className="pb-6">Seller</th>
                <th className="pb-6">Problema</th>
                <th className="pb-6">Status</th>
                <th className="pb-6">Prazo</th>
                <th className="pb-6 pr-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(177,179,169,0.05)]">
              {filteredRows.map((row) => (
                <tr
                  key={row.orderId}
                  className="group transition-all duration-300 hover:bg-[var(--critical-surface-low)]"
                >
                  <td className="py-8 pl-4">
                    <span className="font-medium text-[var(--critical-text)]">{row.orderId}</span>
                  </td>
                  <td className="py-8">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 overflow-hidden rounded-full bg-[var(--critical-surface-high)]">
                        <Image
                          src={row.image}
                          alt={row.imageAlt}
                          width={40}
                          height={40}
                          className="h-full w-full object-cover grayscale opacity-80"
                        />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-[var(--critical-text)]">
                          {row.customer}
                        </span>
                        <span className="text-[10px] tracking-[0.16em] text-[var(--critical-text-soft)]">
                          {row.customerTag}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-8">
                    <span className="text-sm font-medium text-[var(--critical-text)]">{row.seller}</span>
                  </td>
                  <td className="py-8">
                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${row.issueClassName}`}
                    >
                      {row.issue}
                    </span>
                  </td>
                  <td className="py-8">
                    <div className="flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 rounded-full ${row.statusDotClassName}`} />
                      <span className="text-xs text-[rgba(49,51,44,0.7)]">{row.status}</span>
                    </div>
                  </td>
                  <td className="py-8">
                    <span className={`text-sm font-semibold ${row.deadlineClassName}`}>{row.deadline}</span>
                  </td>
                  <td className="py-8 pr-4 text-right">
                    <Link
                      href="/adm/operacao/logistica"
                      className="border-b border-[rgba(49,51,44,0.2)] pb-1 text-[11px] font-bold uppercase tracking-[0.16em] transition-all hover:border-[var(--critical-text)]"
                    >
                      {row.action}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="mt-16 flex items-center justify-between text-[var(--critical-text-soft)]">
          <p className="text-[10px] uppercase tracking-[0.24em]">
            Mostrando {filteredRows.length} de {criticalRows.length} casos críticos
          </p>
          <div className="flex gap-6">
            <button
              type="button"
              className="transition-colors hover:text-[var(--critical-text)]"
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-5 w-5" strokeWidth={1.8} />
            </button>
            <button
              type="button"
              className="transition-colors hover:text-[var(--critical-text)]"
              aria-label="Próxima página"
            >
              <ChevronRight className="h-5 w-5" strokeWidth={1.8} />
            </button>
          </div>
        </footer>
      </main>

      <Link
        href="/adm/operacao/logistica/incidentes"
        className="fixed bottom-12 right-12 hidden h-14 w-14 items-center justify-center rounded-full bg-[var(--critical-text)] text-[var(--critical-bg)] shadow-2xl transition-all hover:scale-105 active:scale-95 lg:flex"
        aria-label="Intervenção rápida"
      >
        <Bolt className="h-5 w-5" strokeWidth={2} />
      </Link>
    </div>
  );
}
