import Image from "next/image";
import Link from "next/link";
import { Noto_Serif } from "next/font/google";
import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bell,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  History,
  LayoutDashboard,
  MoreVertical,
  Search,
  Settings,
  Shield,
  ShoppingBag,
  Sparkles,
  Store,
  Truck,
  Wallet,
  XCircle
} from "lucide-react";

import { formatCurrency } from "@/lib/adm/format";
import { financeRepository } from "@/lib/adm/repositories";
import { getAdmDataSource } from "@/lib/adm/repositories/source";
import { buildHref, type AdmFilters, type SearchParamsInput } from "@/lib/adm/url";

type RefundsPageProps = {
  filters: AdmFilters;
  searchParamsSource?: SearchParamsInput;
};

type RefundTab = "pendente" | "em-revisao" | "resolvido" | "bloqueado";

type RefundRow = {
  orderId: string;
  customer: string;
  initials: string;
  seller: string;
  amount: string;
  reason: string;
  status: string;
  highlight: boolean;
};

type SidebarItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  active?: boolean;
};

const editorialSerif = Noto_Serif({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  style: ["normal", "italic"]
});

const refundsTheme = {
  "--refund-bg": "#fbf9f4",
  "--refund-sidebar": "#f5f4ed",
  "--refund-surface": "#ffffff",
  "--refund-surface-low": "#efeee6",
  "--refund-surface-muted": "#f5f4ed",
  "--refund-surface-high": "#e8e9e0",
  "--refund-surface-highest": "#e2e3d9",
  "--refund-text": "#31332c",
  "--refund-text-soft": "#5e6058",
  "--refund-outline": "#797c73",
  "--refund-outline-variant": "#b1b3a9",
  "--refund-primary": "#5f5e5e",
  "--refund-primary-dim": "#535252",
  "--refund-secondary": "#6e5b4d",
  "--refund-secondary-container": "#f8decc",
  "--refund-tertiary": "#a23d3e"
} as CSSProperties;

const tabs: Array<{ label: string; value: RefundTab }> = [
  { label: "Solicitado", value: "pendente" },
  { label: "Aprovado", value: "em-revisao" },
  { label: "Pago", value: "resolvido" },
  { label: "Negado", value: "bloqueado" }
];

const sidebarItems: SidebarItem[] = [
  { label: "Dashboard", href: "/adm/dashboard-executivo", icon: LayoutDashboard },
  { label: "Curadoria", href: "/adm/curadoria/produtos", icon: Sparkles },
  { label: "Sellers", href: "/adm/parceiros", icon: Store },
  { label: "Pedidos", href: "/adm/operacao/pedidos-criticos", icon: ShoppingBag },
  { label: "Logística", href: "/adm/operacao/logistica", icon: Truck },
  { label: "Risco", href: "/adm/financeiro/risco", icon: Shield },
  { label: "Financeiro", href: "/adm/financeiro/reembolsos", icon: Wallet, active: true },
  { label: "Configurações", href: "/adm/gestao/configuracoes", icon: Settings }
];

const refundRows: RefundRow[] = [
  {
    orderId: "#BP-88291",
    customer: "Helena Andrade",
    initials: "HA",
    seller: "Maison du Parfum",
    amount: "R$ 2.450,00",
    reason: "Defeito na embalagem original",
    status: "Solicitado",
    highlight: true
  },
  {
    orderId: "#BP-88285",
    customer: "Mariana Luz",
    initials: "ML",
    seller: "Glow Skincare",
    amount: "R$ 420,00",
    reason: "Desistência (Arrependimento)",
    status: "Solicitado",
    highlight: false
  },
  {
    orderId: "#BP-88240",
    customer: "Ricardo Silveira",
    initials: "RS",
    seller: "TechBeauty Pro",
    amount: "R$ 1.890,00",
    reason: "Produto divergente do anúncio",
    status: "Solicitado",
    highlight: true
  },
  {
    orderId: "#BP-88199",
    customer: "Alice Bittencourt",
    initials: "AB",
    seller: "Pure Botanics",
    amount: "R$ 125,50",
    reason: "Atraso crítico na entrega",
    status: "Solicitado",
    highlight: false
  }
];

function SidebarLink({ item }: { item: SidebarItem }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 px-6 py-4 text-sm uppercase tracking-[0.14em] transition-colors duration-300 ${
        item.active
          ? "border-l-2 border-[var(--refund-primary)] font-bold text-[var(--refund-text)]"
          : "font-normal text-[var(--refund-primary)] hover:bg-[rgba(239,238,230,0.9)] hover:text-[var(--refund-text)]"
      }`}
    >
      <Icon className="h-4.5 w-4.5" strokeWidth={item.active ? 2.1 : 1.8} />
      <span>{item.label}</span>
    </Link>
  );
}

export async function RefundsPage({
  filters,
  searchParamsSource = filters
}: RefundsPageProps) {
  const [refundsResult, dataSource] = await Promise.all([
    financeRepository.listRefunds({
      page: 1,
      pageSize: 12,
      sortBy: "requestedAt",
      sortDir: "desc",
      status: filters.status,
      seller: filters.seller,
      order: filters.order,
      refund: filters.refund,
      q: filters.q
    }),
    getAdmDataSource()
  ]);
  const customerMap = Object.fromEntries(dataSource.customers.map((customer) => [customer.id, customer]));
  const liveRefundRows: RefundRow[] = refundsResult.data.items.map((refund) => {
    const customer = customerMap[refund.customerId];
    const highlight = refund.amount >= 500 || refund.status === "pendente";

    return {
      orderId: refund.orderId.toUpperCase(),
      customer: customer?.name ?? refund.sellerName,
      initials:
        customer?.name
          ?.split(" ")
          .slice(0, 2)
          .map((part) => part[0]?.toUpperCase())
          .join("") ?? "RF",
      seller: refund.sellerName,
      amount: formatCurrency(refund.amount),
      reason: refund.reason,
      status:
        refund.status === "pendente"
          ? "Solicitado"
          : refund.status === "em-revisao"
            ? "Aprovado"
            : refund.status === "resolvido"
              ? "Pago"
              : "Negado",
      highlight
    };
  });
  const activeTab = tabs.some((tab) => tab.value === filters.status)
    ? (filters.status as RefundTab)
    : "pendente";
  const visibleRefundRows = liveRefundRows.length > 0 ? liveRefundRows : refundRows;
  const serif = editorialSerif.className;

  return (
    <div
      style={refundsTheme}
      className="min-h-screen bg-[var(--refund-bg)] text-[var(--refund-text)]"
    >
      <aside className="fixed left-0 top-0 hidden h-full w-64 flex-col bg-[var(--refund-sidebar)] py-8 lg:flex">
        <div className="px-8">
          <h1 className={`${serif} text-2xl tracking-tighter text-[var(--refund-text)]`}>BelaPop</h1>
          <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[var(--refund-primary)]">
            Premium Beauty Admin
          </p>
        </div>

        <nav className="mt-8 flex-1 space-y-1">
          {sidebarItems.map((item) => (
            <SidebarLink key={item.label} item={item} />
          ))}
        </nav>

        <div className="mt-auto px-6">
          <div className="flex items-center gap-3 rounded-xl bg-[var(--refund-surface-muted)] p-3">
            <Image
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCBER-XdImj9Pxkd4w0okKsKwJ9tX3vIiwpHsILc7OWqjn1bekPo05l9vIdSDNBAUzSlcKG0vqBrKjE0EkMGXDjQNVXoGoMRgzWMscU0PzTE9wCdeOnEf9-mktKD2gSBoHbo7Tzd0WmNKUV-lJjfu6xRqoH9DGzRFEmcin842cEwcyD3_8Mt77MRHgxFgrwrxvRXCJLhiJ6p9loX8MxQeQLyqg0Pdiw82aDgkRhEEbbZbnpYrDhLSEqpSZfuljTm7h8MAbwkstIrtQI"
              alt="Perfil administrativo BelaPop"
              width={32}
              height={32}
              className="h-8 w-8 rounded-full object-cover"
            />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-[var(--refund-text)]">Admin Perfil</span>
              <span className="text-[10px] text-[var(--refund-primary-dim)]">Curadoria Master</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="min-h-screen lg:ml-64">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between bg-[rgba(251,249,244,0.8)] px-6 backdrop-blur-md sm:px-8 lg:px-12">
          <div className="flex items-center gap-8">
            <nav className="flex gap-6 text-sm">
              <Link
                href="/adm/financeiro"
                className="text-[var(--refund-primary)] transition-opacity duration-200 hover:text-[var(--refund-text)]"
              >
                Visão Geral
              </Link>
              <Link
                href="/adm/gestao/relatorios"
                className="border-b border-[var(--refund-text)] pb-1 text-[var(--refund-text)]"
              >
                Relatórios
              </Link>
            </nav>
            <div className="h-4 w-px bg-[rgba(177,179,169,0.3)]" />
            <div className="flex items-center text-xs uppercase tracking-[0.18em] text-[var(--refund-text-soft)]">
              Financeiro / <span className="ml-1 font-semibold text-[var(--refund-text)]">Reembolsos</span>
            </div>
          </div>

          <div className="flex items-center gap-6 text-[var(--refund-text)]">
            <Search className="h-4.5 w-4.5 cursor-pointer" strokeWidth={1.9} />
            <Bell className="h-4.5 w-4.5 cursor-pointer" strokeWidth={1.9} />
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(177,179,169,0.25)] text-[11px] font-semibold">
              AP
            </div>
          </div>
        </header>

        <section className="max-w-7xl p-6 sm:p-8 lg:p-12">
          <div className="mb-16 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div className="space-y-2">
              <h2
                className={`${serif} text-4xl font-light tracking-[-0.02em] text-[var(--refund-text)] lg:text-5xl`}
              >
                Gestão de Reembolsos
              </h2>
              <p className="max-w-md text-base leading-relaxed text-[var(--refund-primary-dim)]">
                Controle e rastreabilidade de devoluções financeiras para a curadoria BelaPop.
              </p>
            </div>

            <div className="flex flex-wrap rounded-full bg-[var(--refund-surface-muted)] p-1">
              {tabs.map((tab) => {
                const active = tab.value === activeTab;

                return (
                  <Link
                    key={tab.value}
                    href={buildHref("/adm/financeiro/reembolsos", searchParamsSource, {
                      status: tab.value,
                      page: undefined
                    })}
                    className={`rounded-full px-6 py-2 text-xs uppercase tracking-[0.18em] transition-all ${
                      active
                        ? "bg-[var(--refund-surface)] text-[var(--refund-text)] shadow-sm"
                        : "text-[var(--refund-text-soft)] hover:text-[var(--refund-text)]"
                    }`}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="mb-16 grid grid-cols-1 gap-6 xl:grid-cols-12">
            <article className="rounded-xl bg-[var(--refund-surface)] p-8 xl:col-span-8">
              <span className="block text-[10px] uppercase tracking-[0.2em] text-[var(--refund-primary-dim)]">
                Volume de Retorno Semanal
              </span>
              <div className="mt-4 flex items-baseline gap-4">
                <span className={`${serif} text-4xl text-[var(--refund-text)] lg:text-5xl`}>
                  {formatCurrency(refundsResult.data.items.reduce((sum, refund) => sum + refund.amount, 0))}
                </span>
                <span className="text-xs font-medium text-[var(--refund-tertiary)]">
                  -12% em relação à última semana
                </span>
              </div>

              <div className="mt-8 flex h-12 items-end gap-2 overflow-hidden">
                <div className="h-4 w-full rounded-full bg-[var(--refund-surface-low)]" />
                <div className="h-8 w-full rounded-full bg-[var(--refund-surface-low)]" />
                <div className="h-12 w-full rounded-full bg-[var(--refund-primary)]" />
                <div className="h-6 w-full rounded-full bg-[var(--refund-surface-low)]" />
                <div className="h-9 w-full rounded-full bg-[var(--refund-surface-low)]" />
                <div className="h-10 w-full rounded-full bg-[var(--refund-primary-dim)]" />
              </div>
            </article>

            <article className="rounded-xl bg-[var(--refund-secondary-container)] p-8 text-[var(--refund-text)] xl:col-span-4">
              <span className="block text-[10px] uppercase tracking-[0.2em] text-[var(--refund-secondary)]">
                Aguardando Ação
              </span>
              <span className={`${serif} mt-4 block text-5xl lg:text-6xl`}>
                {dataSource.refunds.filter((refund) => refund.status !== "resolvido").length}
              </span>
              <p className="mt-2 text-xs leading-relaxed opacity-80">
                Solicitações de alta prioridade requerem sua revisão manual imediata.
              </p>
            </article>
          </div>

          <div className="overflow-hidden rounded-xl bg-[var(--refund-surface)]">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[var(--refund-surface-muted)]">
                  <th className="px-8 py-6 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--refund-text-soft)]">
                    Pedido
                  </th>
                  <th className="px-8 py-6 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--refund-text-soft)]">
                    Cliente
                  </th>
                  <th className="px-8 py-6 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--refund-text-soft)]">
                    Seller
                  </th>
                  <th className="px-8 py-6 text-right text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--refund-text-soft)]">
                    Valor
                  </th>
                  <th className="px-8 py-6 text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--refund-text-soft)]">
                    Motivo
                  </th>
                  <th className="px-8 py-6 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--refund-text-soft)]">
                    Status
                  </th>
                  <th className="px-8 py-6 text-right text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--refund-text-soft)]">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--refund-surface-low)]">
                {visibleRefundRows.map((row) => (
                  <tr
                    key={row.orderId}
                    className={`transition-colors duration-300 hover:bg-[var(--refund-surface-muted)] ${
                      row.highlight
                        ? "border-l-2 border-[var(--refund-secondary)] bg-[rgba(245,244,237,0.3)]"
                        : ""
                    }`}
                  >
                    <td className={`${serif} px-8 py-8 text-sm text-[var(--refund-text)]`}>{row.orderId}</td>
                    <td className="px-8 py-8">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--refund-surface-low)] text-[10px] font-bold text-[var(--refund-text)]">
                          {row.initials}
                        </div>
                        <span className="text-sm font-medium text-[var(--refund-text)]">{row.customer}</span>
                      </div>
                    </td>
                    <td className="px-8 py-8 text-sm text-[var(--refund-primary-dim)]">{row.seller}</td>
                    <td className={`${serif} px-8 py-8 text-right text-base ${row.highlight ? "font-bold" : ""}`}>
                      {row.amount}
                    </td>
                    <td className="px-8 py-8 text-xs italic text-[var(--refund-text-soft)]">{row.reason}</td>
                    <td className="px-8 py-8 text-center">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.18em] ${
                          row.highlight
                            ? "bg-[var(--refund-secondary-container)] text-[var(--refund-secondary)]"
                            : "bg-[var(--refund-surface-low)] text-[var(--refund-text-soft)]"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-8 py-8 text-right">
                      <div className="flex justify-end gap-4">
                        <button
                          type="button"
                          className="text-[var(--refund-primary)] transition-colors hover:text-[var(--refund-text)]"
                          title="Aprovar"
                        >
                          <CheckCircle2 className="h-4.5 w-4.5" strokeWidth={1.9} />
                        </button>
                        <button
                          type="button"
                          className="text-[var(--refund-primary)] transition-colors hover:text-[var(--refund-tertiary)]"
                          title="Recusar"
                        >
                          <XCircle className="h-4.5 w-4.5" strokeWidth={1.9} />
                        </button>
                        <button
                          type="button"
                          className="text-[var(--refund-primary)] transition-colors hover:text-[var(--refund-text)]"
                          title="Mais opções"
                        >
                          <MoreVertical className="h-4.5 w-4.5" strokeWidth={1.9} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex items-center justify-between bg-[var(--refund-surface)] px-8 py-6">
              <span className="text-xs text-[var(--refund-primary-dim)]">
                Exibindo {visibleRefundRows.length} de {refundsResult.data.meta.total} solicitações pendentes
              </span>
              <div className="flex gap-4">
                <button
                  type="button"
                  className="text-[var(--refund-text-soft)] transition-colors hover:text-[var(--refund-text)]"
                  title="Página anterior"
                >
                  <ChevronLeft className="h-4.5 w-4.5" strokeWidth={1.9} />
                </button>
                <button
                  type="button"
                  className="text-[var(--refund-text-soft)] transition-colors hover:text-[var(--refund-text)]"
                  title="Próxima página"
                >
                  <ChevronRight className="h-4.5 w-4.5" strokeWidth={1.9} />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-24 flex flex-col gap-12 border-t border-[rgba(177,179,169,0.2)] pt-12 xl:flex-row xl:items-start">
            <div className="xl:w-1/3">
              <h3 className={`${serif} mb-4 text-2xl italic text-[var(--refund-text-soft)]`}>
                Ética na Curadoria
              </h3>
              <p className="text-sm leading-relaxed text-[var(--refund-primary-dim)]">
                A gestão de reembolsos na BelaPop prioriza a satisfação da cliente sem comprometer a saúde financeira dos nossos sellers parceiros. Cada decisão deve ser pautada pela transparência e rapidez.
              </p>
            </div>

            <div className="grid flex-1 grid-cols-1 gap-8 sm:grid-cols-2">
              <article className="rounded-lg bg-[var(--refund-surface-low)] p-6">
                <History className="mb-4 h-5 w-5 text-[var(--refund-primary-dim)]" strokeWidth={1.9} />
                <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-[var(--refund-text)]">
                  Tempo Médio de Resolução
                </p>
                <p className={`${serif} text-lg text-[var(--refund-text)]`}>14.2 Horas</p>
              </article>

              <article className="rounded-lg bg-[var(--refund-surface-low)] p-6">
                <BarChart3 className="mb-4 h-5 w-5 text-[var(--refund-primary-dim)]" strokeWidth={1.9} />
                <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-[var(--refund-text)]">
                  Taxa de Aprovação
                </p>
                <p className={`${serif} text-lg text-[var(--refund-text)]`}>92.4%</p>
              </article>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
