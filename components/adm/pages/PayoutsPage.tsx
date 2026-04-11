import Image from "next/image";
import Link from "next/link";
import { Noto_Serif } from "next/font/google";
import {
  Bell,
  LayoutDashboard,
  Settings,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  Store,
  Truck,
  Wallet
} from "lucide-react";

import { formatCurrency } from "@/lib/adm/format";
import { financeRepository } from "@/lib/adm/repositories";
import { getAdmDataSource } from "@/lib/adm/repositories/source";
import { buildHref, type AdmFilters, type SearchParamsInput } from "@/lib/adm/url";

type PayoutsPageProps = {
  filters: AdmFilters;
  searchParamsSource?: SearchParamsInput;
};

type PayoutStatus = "pendente" | "aprovado" | "resolvido";

type PayoutRow = {
  id: string;
  sellerCode: string;
  sellerName: string;
  sellerImage: string;
  sellerImageAlt: string;
  period: string;
  grossAmount: string;
  netAmount: string;
  status: PayoutStatus;
  statusLabel: string;
  statusClassName: string;
  scheduledAt: string;
  breakdown: Array<{ id: string; date: string; amount: string }>;
  fees: Array<{ label: string; amount: string }>;
  adjustment: { label: string; amount: string };
};

const editorialSerif = Noto_Serif({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"]
});

const payoutTheme = {
  ["--payout-bg" as string]: "#fbf9f4",
  ["--payout-surface" as string]: "#ffffff",
  ["--payout-surface-low" as string]: "#f5f4ed",
  ["--payout-border" as string]: "rgba(177,179,169,0.16)",
  ["--payout-text" as string]: "#31332c",
  ["--payout-text-soft" as string]: "#5f5e5e",
  ["--payout-primary" as string]: "#5f5e5e",
  ["--payout-tertiary" as string]: "#a23d3e",
  ["--payout-shadow" as string]: "0 20px 40px rgba(49, 51, 44, 0.03)"
} as React.CSSProperties;

const tabs: Array<{ label: string; value?: PayoutStatus | "bloqueado" }> = [
  { label: "Todos" },
  { label: "Pendentes", value: "pendente" },
  { label: "Aprovados", value: "aprovado" },
  { label: "Pagos", value: "resolvido" },
  { label: "Retidos", value: "bloqueado" }
];

const payoutRows: PayoutRow[] = [
  {
    id: "bela-9921",
    sellerCode: "BELA-9921",
    sellerName: "Maison L'Art",
    sellerImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCMkG2Ae0FJsNfutVnLFDXsU8--BDIpRj3cxbyGEqkRwMKeJnsrWDnqMWHq_d2EXCVYpPAD9-qw-FGvOax1laZgzxcXp-KO68iwxRg_XHIKtHC2TucLiuJHNipNpr0KMZfQei41s4KmbHHYT4TzTm7vn77r_xBJvNBbXUmKV3P33hSD5Y_RM8GF9vUywZ268B32_xyg9Yf31jJZkaRPJlWayHgNnK9at0Tt3LcfUK--Gdy12iK_6zFfOslFDaE9N5eA5poQ7qM8n79q",
    sellerImageAlt: "Placeholder abstrato minimalista de marca premium",
    period: "01 - 15 Out",
    grossAmount: "R$ 12.450,00",
    netAmount: "R$ 9.835,50",
    status: "pendente",
    statusLabel: "Pendente",
    statusClassName: "bg-amber-50 text-amber-700 border-amber-200/30",
    scheduledAt: "20 Out 2023",
    breakdown: [
      { id: "#ORD-49210", date: "12 Out, 2023", amount: "R$ 4.500,00" },
      { id: "#ORD-49215", date: "14 Out, 2023", amount: "R$ 7.950,00" }
    ],
    fees: [
      { label: "Comissão de Curadoria (15%)", amount: "- R$ 1.867,50" },
      { label: "Processamento Financeiro", amount: "- R$ 342,00" },
      { label: "Logística Especialista", amount: "- R$ 405,00" }
    ],
    adjustment: { label: "Estorno Logística (Reembolso)", amount: "+ R$ 125,00" }
  },
  {
    id: "bela-8842",
    sellerCode: "BELA-8842",
    sellerName: "Studio Essence",
    sellerImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCFOigLBhXLgylrWYyEaVRsl_o55xwmw_QKevv6_06-_v0WXS7ZhfdJ0b9qmS-dY2Cz3T0BrAPR8wDWm8N4-sFrXPgDlTG6zUVhTVoiYY2F03lL1KClqUukEUkJ0075cigj1oZmRRUnpl817BevjNfa-naMmaFYV9j1x71QGyzIX8PjK4zAvBu_YLqxMg3FnrkPp1qCW6xvpubLa6e8dJ0a89NYKGw6O1g_wXjDrPjzLXvwsHxo23OFrIa1EIkDL1bgIykZzoOOo_Nj",
    sellerImageAlt: "Close de tecido branco em linguagem editorial de moda",
    period: "01 - 15 Out",
    grossAmount: "R$ 8.920,00",
    netAmount: "R$ 7.136,00",
    status: "resolvido",
    statusLabel: "Pago",
    statusClassName: "bg-emerald-50 text-emerald-700 border-emerald-200/30",
    scheduledAt: "18 Out 2023",
    breakdown: [
      { id: "#ORD-49174", date: "11 Out, 2023", amount: "R$ 3.120,00" },
      { id: "#ORD-49196", date: "14 Out, 2023", amount: "R$ 5.800,00" }
    ],
    fees: [
      { label: "Comissão de Curadoria (15%)", amount: "- R$ 1.338,00" },
      { label: "Processamento Financeiro", amount: "- R$ 248,00" },
      { label: "Logística Especialista", amount: "- R$ 198,00" }
    ],
    adjustment: { label: "Bônus por SLA premium", amount: "+ R$ 62,00" }
  },
  {
    id: "bela-7731",
    sellerCode: "BELA-7731",
    sellerName: "Nordic Home",
    sellerImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDXZ296VSXXUEDAxzmTB2YazLBMl67xlxB9WbkKQ_PHz_fjidqpIX9CpCJhg2C9MU8famNFCNN_LMZVW8Nh1JcyQfT89JeAZnyetv1vhwSnOrTXK9k2aNWDPf_915J5t8h_ILBEwOZWifHtmpA-qah2C2bL6x61O29QxK_27rqOYv1FHOoDRPSK7psLqwneuGai9CWy1N7AgbXJMGpC9Yk0_Pcx6QZdFWFtmXLcO3fMxeH-6fD4VMAfe25oUYEHhJaRj-R5mHVHtvc-",
    sellerImageAlt: "Top view de relógio minimalista em superfície de pedra",
    period: "01 - 15 Out",
    grossAmount: "R$ 21.300,00",
    netAmount: "R$ 16.827,00",
    status: "aprovado",
    statusLabel: "Aprovado",
    statusClassName: "bg-blue-50 text-blue-700 border-blue-200/30",
    scheduledAt: "22 Out 2023",
    breakdown: [
      { id: "#ORD-49088", date: "10 Out, 2023", amount: "R$ 8.140,00" },
      { id: "#ORD-49122", date: "15 Out, 2023", amount: "R$ 13.160,00" }
    ],
    fees: [
      { label: "Comissão de Curadoria (15%)", amount: "- R$ 3.195,00" },
      { label: "Processamento Financeiro", amount: "- R$ 426,00" },
      { label: "Logística Especialista", amount: "- R$ 514,00" }
    ],
    adjustment: { label: "Crédito de performance", amount: "+ R$ 82,00" }
  }
];

const sidebarLinks = [
  { label: "Dashboard", href: "/adm/dashboard-executivo", icon: LayoutDashboard },
  { label: "Curadoria", href: "/adm/curadoria/produtos", icon: Sparkles },
  { label: "Sellers", href: "/adm/parceiros", icon: Store },
  { label: "Pedidos", href: "/adm/operacao/pedidos-criticos", icon: ShoppingBag },
  { label: "Logística", href: "/adm/operacao/logistica", icon: Truck },
  { label: "Risco", href: "/adm/financeiro/risco", icon: ShieldAlert },
  { label: "Financeiro", href: "/adm/financeiro/repasses", icon: Wallet, active: true },
  { label: "Configurações", href: "/adm/gestao/configuracoes", icon: Settings }
];

function resolveSelectedPayout(rows: PayoutRow[], filters: AdmFilters) {
  const selectedById = rows.find((row) => row.id === filters.payout);
  if (selectedById) {
    return selectedById;
  }

  const selectedByStatus = rows.find((row) => row.status === filters.status);
  return selectedByStatus ?? rows[0];
}

export async function PayoutsPage({
  filters,
  searchParamsSource = filters
}: PayoutsPageProps) {
  const [payoutsResult, dataSource] = await Promise.all([
    financeRepository.listPayouts({
      page: 1,
      pageSize: 12,
      sortBy: "scheduledAt",
      sortDir: "desc",
      status: filters.status,
      seller: filters.seller,
      payout: filters.payout,
      q: filters.q
    }),
    getAdmDataSource()
  ]);
  const orderMap = Object.fromEntries(dataSource.orders.map((order) => [order.id, order]));
  const livePayoutRows: PayoutRow[] = payoutsResult.data.items.map((payout, index) => {
    const orderBreakdown = payout.orderIds.map((orderId) => {
      const order = orderMap[orderId];
      return {
        id: orderId.toUpperCase(),
        date: order?.createdAt
          ? new Date(order.createdAt).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "short",
              year: "numeric"
            })
          : "--",
        amount: formatCurrency(order?.total ?? 0)
      };
    });
    const commission = Math.max(0, payout.grossAmount - payout.netAmount);

    return {
      id: payout.id,
      sellerCode: payout.id.toUpperCase(),
      sellerName: payout.sellerName,
      sellerImage: payoutRows[index % payoutRows.length].sellerImage,
      sellerImageAlt: payoutRows[index % payoutRows.length].sellerImageAlt,
      period: payout.period.toUpperCase(),
      grossAmount: formatCurrency(payout.grossAmount),
      netAmount: formatCurrency(payout.netAmount),
      status:
        payout.status === "bloqueado" || payout.status === "alerta"
          ? "pendente"
          : payout.status === "aprovado"
            ? "aprovado"
            : "resolvido",
      statusLabel:
        payout.status === "bloqueado" || payout.status === "alerta"
          ? "Pendente"
          : payout.status === "aprovado"
            ? "Aprovado"
            : "Pago",
      statusClassName:
        payout.status === "bloqueado" || payout.status === "alerta"
          ? "bg-amber-50 text-amber-700 border-amber-200/30"
          : payout.status === "aprovado"
            ? "bg-blue-50 text-blue-700 border-blue-200/30"
            : "bg-emerald-50 text-emerald-700 border-emerald-200/30",
      scheduledAt: new Date(payout.scheduledAt).toLocaleDateString("pt-BR"),
      breakdown: orderBreakdown,
      fees: [
        { label: "Comissao de Curadoria", amount: `- ${formatCurrency(commission * 0.7)}` },
        { label: "Processamento Financeiro", amount: `- ${formatCurrency(commission * 0.2)}` },
        { label: "Logistica Especialista", amount: `- ${formatCurrency(commission * 0.1)}` }
      ],
      adjustment: {
        label: payout.netAmount === 0 ? "Repasse retido para revisao" : "Ajuste operacional",
        amount: payout.netAmount === 0 ? "+ R$ 0,00" : `+ ${formatCurrency(Math.max(0, commission * 0.05))}`
      }
    };
  });
  const visiblePayoutRows = livePayoutRows.length > 0 ? livePayoutRows : payoutRows;
  const selectedPayout = resolveSelectedPayout(visiblePayoutRows, filters);
  const serif = editorialSerif.className;

  return (
    <div
      style={payoutTheme}
      className="min-h-screen bg-[var(--payout-bg)] text-[var(--payout-text)] antialiased"
    >
      <div className="flex min-h-screen">
        <aside className="fixed left-0 top-0 hidden h-screen w-72 flex-col border-r border-[var(--payout-border)] bg-[#f5f4ed] py-10 lg:flex">
          <div className="px-8">
            <h2 className={`${serif} text-lg font-bold tracking-tight text-[var(--payout-text)]`}>
              Curator Admin
            </h2>
            <p className="mt-1 text-[10px] uppercase tracking-[0.24em] text-[var(--payout-text-soft)]">
              Luxury Marketplace
            </p>
          </div>

          <nav className="mt-8 flex-1 space-y-1">
            {sidebarLinks.map(({ label, href, icon: Icon, active }) => (
              <Link
                key={label}
                href={href}
                className={`group flex items-center gap-4 px-8 py-3 text-sm uppercase tracking-[0.14em] transition-all duration-200 ${
                  active
                    ? "border-l-2 border-[var(--payout-primary)] bg-[rgba(239,238,230,0.55)] pl-4 font-bold text-[var(--payout-text)]"
                    : "pl-4 text-[var(--payout-text-soft)] hover:bg-[rgba(239,238,230,0.9)]"
                }`}
              >
                <Icon
                  className={`h-4 w-4 shrink-0 ${active ? "" : "transition-transform duration-300 group-hover:translate-x-1"}`}
                />
                <span>{label}</span>
              </Link>
            ))}
          </nav>

          <div className="mt-auto border-t border-[var(--payout-border)] px-8 pt-8">
            <div className="flex items-center gap-3">
              <Image
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBrw0eoJiY8N-9lw_fflMMjcD-Fj5AC357hiexhkcbtetTMCHeAj5AMc-BsrmhEuFGy4fV6z6MtED38NXep7xPgBvfD9bj6YLpkBSmlMKGAI8HrB04Zk6GhcUwaFjrTFrMDc_1ymHrhjJREl4HEujm4eAsTudkixKExg4gDOaHKyerwvVQT30vmR4Z6TxW-JHAMFhN5Y4QxUjk44FqTCUjYQre3ZBvZd1lScKRcn49R9mp8js9fLnsEW9iFfC3mfT93XfDfqSrwUYox"
                alt="Perfil de administradora"
                width={40}
                height={40}
                className="h-10 w-10 rounded-full object-cover"
              />
              <div>
                <p className="text-xs font-bold text-[var(--payout-text)]">Mariana Silva</p>
                <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--payout-text-soft)]">
                  Chief Curator
                </p>
              </div>
            </div>
          </div>
        </aside>

        <main className="min-h-screen flex-1 lg:ml-72">
          <header className="sticky top-0 z-40 bg-[rgba(251,249,244,0.84)] backdrop-blur-xl">
            <div className="mx-auto flex w-full max-w-[1920px] items-center justify-between px-6 py-5 sm:px-8 lg:px-12">
              <h1 className={`${serif} text-2xl tracking-tight text-[var(--payout-text)]`}>
                The Editorial Canvas
              </h1>

              <div className="flex items-center gap-6 lg:gap-12">
                <nav className="hidden items-center gap-8 md:flex">
                  <Link
                    href="/adm/financeiro"
                    className={`${serif} border-b border-[var(--payout-text)] pb-1 text-base italic tracking-tight text-[var(--payout-text)]`}
                  >
                    Visão Geral
                  </Link>
                  <Link
                    href="/adm/gestao/relatorios"
                    className={`${serif} text-base italic tracking-tight text-[var(--payout-text-soft)] transition-colors hover:text-[var(--payout-text)]`}
                  >
                    Relatórios
                  </Link>
                  <Link
                    href="/adm/financeiro/auditoria"
                    className={`${serif} text-base italic tracking-tight text-[var(--payout-text-soft)] transition-colors hover:text-[var(--payout-text)]`}
                  >
                    Conciliação
                  </Link>
                </nav>

                <div className="flex items-center gap-4 text-[var(--payout-text-soft)]">
                  <Bell className="h-5 w-5" />
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--payout-border)] bg-[var(--payout-surface)] text-xs font-semibold text-[var(--payout-text)]">
                    MS
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div className="mx-auto grid w-full max-w-[1920px] grid-cols-12 gap-8 px-6 py-10 sm:px-8 lg:gap-12 lg:px-12 lg:py-12">
            <section className="col-span-12 space-y-10 lg:col-span-8">
              <div className="flex flex-col justify-between gap-6 border-b border-[var(--payout-border)] pb-8 md:flex-row md:items-end">
                <div>
                  <h2 className={`${serif} text-4xl italic tracking-tight text-[var(--payout-text)] sm:text-5xl`}>
                    Repasses para Sellers
                  </h2>
                  <p className="mt-2 max-w-lg text-base leading-7 text-[var(--payout-text-soft)]">
                    Controle e transparência nos pagamentos aos parceiros de curadoria BelaPop.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="inline-flex items-center gap-3 rounded-xl border border-[rgba(177,179,169,0.15)] bg-[var(--payout-surface-low)] px-4 py-2 text-sm uppercase tracking-[0.16em] text-[var(--payout-text)]">
                    <span className="inline-block h-2 w-2 rounded-full bg-[var(--payout-primary)]" />
                    Outubro 2023
                  </div>
                  <button
                    type="button"
                    className="rounded-xl bg-[var(--payout-primary)] px-8 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white shadow-sm transition-colors hover:bg-[#535252]"
                  >
                    Exportar Relatório
                  </button>
                </div>
              </div>

              <nav className="overflow-x-auto">
                <div className="flex min-w-max gap-10">
                  {tabs.map((tab) => {
                    const active = (tab.value ?? "") === (filters.status ?? "");
                    const defaultActive = !tab.value && !filters.status;

                    return (
                      <Link
                        key={tab.label}
                        href={buildHref("/adm/financeiro/repasses", searchParamsSource, {
                          status: tab.value,
                          payout: undefined,
                          page: undefined
                        })}
                        className={`pb-4 text-xs font-semibold uppercase tracking-[0.2em] transition-colors ${
                          active || defaultActive
                            ? "border-b-2 border-[var(--payout-text)] text-[var(--payout-text)]"
                            : "border-b-2 border-transparent text-[rgba(95,94,94,0.6)] hover:text-[var(--payout-text)]"
                        }`}
                      >
                        {tab.label}
                      </Link>
                    );
                  })}
                </div>
              </nav>

              <div className="overflow-hidden">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[var(--payout-border)] text-[10px] uppercase tracking-[0.15em] text-[rgba(95,94,94,0.55)]">
                      <th className="px-4 py-6 font-semibold">Seller</th>
                      <th className="px-4 py-6 font-semibold">Período</th>
                      <th className="px-4 py-6 text-right font-semibold">Vendas</th>
                      <th className="px-4 py-6 text-right font-semibold">Valor Líquido</th>
                      <th className="px-4 py-6 text-center font-semibold">Status</th>
                      <th className="px-4 py-6 font-semibold">Previsão</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(177,179,169,0.08)]">
                    {visiblePayoutRows.map((row) => {
                      const active = row.id === selectedPayout.id;

                      return (
                        <tr
                          key={row.id}
                          className={`group cursor-default transition-colors ${
                            active
                              ? "border-l-2 border-l-[var(--payout-text)] bg-[var(--payout-surface-low)]"
                              : "hover:bg-[var(--payout-surface-low)]"
                          }`}
                        >
                          <td className="px-4 py-8">
                            <div className="flex items-center gap-4">
                              <div className="h-10 w-10 overflow-hidden rounded-full bg-[#e2e3d9]">
                                <Image
                                  src={row.sellerImage}
                                  alt={row.sellerImageAlt}
                                  width={40}
                                  height={40}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <div>
                                <p className={`${serif} text-lg italic leading-none text-[var(--payout-text)]`}>
                                  {row.sellerName}
                                </p>
                                <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-[rgba(95,94,94,0.5)]">
                                  ID: {row.sellerCode}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-8 text-sm text-[var(--payout-primary)]">{row.period}</td>
                          <td className="px-4 py-8 text-right text-sm font-medium text-[var(--payout-text)]">
                            {row.grossAmount}
                          </td>
                          <td className="px-4 py-8 text-right">
                            <span className={`${serif} text-lg text-[var(--payout-text)]`}>
                              {row.netAmount}
                            </span>
                          </td>
                          <td className="px-4 py-8 text-center">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.18em] ${row.statusClassName}`}
                            >
                              {row.statusLabel}
                            </span>
                          </td>
                          <td className="px-4 py-8 text-sm text-[rgba(95,94,94,0.7)]">
                            {row.scheduledAt}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <aside className="col-span-12 lg:col-span-4 lg:sticky lg:top-32">
              <article className="overflow-hidden rounded-xl border border-[rgba(177,179,169,0.15)] bg-[var(--payout-surface)] shadow-[var(--payout-shadow)]">
                <div className="border-b border-[var(--payout-border)] px-8 py-8">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-[rgba(95,94,94,0.5)]">
                        Detalhes do Repasse
                      </span>
                      <h3 className={`${serif} mt-2 text-3xl italic text-[var(--payout-text)]`}>
                        {selectedPayout.sellerName}
                      </h3>
                    </div>
                    <span className="text-sm uppercase tracking-[0.18em] text-[rgba(95,94,94,0.35)]">
                      Close
                    </span>
                  </div>

                  <div className="mt-6 flex items-baseline gap-2">
                    <span className={`${serif} text-4xl text-[var(--payout-text)]`}>
                      {selectedPayout.netAmount}
                    </span>
                    <span className="text-sm uppercase tracking-[0.18em] text-[rgba(95,94,94,0.5)]">
                      Líquido
                    </span>
                  </div>
                </div>

                <div className="space-y-6 px-8 py-8">
                  <section>
                    <h4 className="border-b border-[var(--payout-border)] pb-2 text-[10px] uppercase tracking-[0.2em] text-[var(--payout-primary)]">
                      Resumo de Pedidos
                    </h4>
                    <div className="mt-4 space-y-4">
                      {selectedPayout.breakdown.map((order) => (
                        <div key={order.id} className="flex items-center justify-between gap-4 text-sm">
                          <div>
                            <p className="font-medium text-[var(--payout-text)]">{order.id}</p>
                            <p className="text-[10px] text-[rgba(95,94,94,0.5)]">{order.date}</p>
                          </div>
                          <p className={`${serif} text-base italic text-[var(--payout-text)]`}>
                            {order.amount}
                          </p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h4 className="border-b border-[var(--payout-border)] pb-2 text-[10px] uppercase tracking-[0.2em] text-[var(--payout-primary)]">
                      Taxas e Encargos
                    </h4>
                    <div className="mt-4 space-y-3 text-sm">
                      {selectedPayout.fees.map((fee) => (
                        <div key={fee.label} className="flex items-center justify-between gap-4">
                          <span className="text-[rgba(95,94,94,0.72)]">{fee.label}</span>
                          <span className="font-medium text-[var(--payout-tertiary)]">{fee.amount}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h4 className="border-b border-[var(--payout-border)] pb-2 text-[10px] uppercase tracking-[0.2em] text-[var(--payout-primary)]">
                      Ajustes
                    </h4>
                    <div className="mt-4 flex items-center justify-between gap-4 text-sm">
                      <span className="text-[rgba(95,94,94,0.72)]">{selectedPayout.adjustment.label}</span>
                      <span className="font-medium text-emerald-700">
                        {selectedPayout.adjustment.amount}
                      </span>
                    </div>
                  </section>
                </div>

                <div className="flex flex-col gap-3 bg-[rgba(245,244,237,0.5)] px-8 py-8">
                  <button
                    type="button"
                    className="w-full rounded-xl bg-[var(--payout-text)] py-4 text-xs font-bold uppercase tracking-[0.2em] text-[var(--payout-bg)] transition-opacity hover:opacity-90"
                  >
                    Aprovar Repasse
                  </button>
                  <Link
                    href={`/adm/financeiro/auditoria?payout=${selectedPayout.id}`}
                    className="w-full rounded-xl border border-[rgba(177,179,169,0.4)] px-4 py-4 text-center text-xs uppercase tracking-[0.2em] text-[var(--payout-primary)] transition-colors hover:bg-[rgba(226,227,217,0.5)]"
                  >
                    Segurar Pagamento
                  </Link>
                </div>
              </article>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}
