import Link from "next/link";
import { Noto_Serif } from "next/font/google";
import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Blocks,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  LayoutDashboard,
  MapPinned,
  Search,
  Settings,
  Shield,
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
import { buildHref, toListQueryParams, type AdmFilters, type SearchParamsInput } from "@/lib/adm/url";

type RiskPageProps = {
  filters: AdmFilters;
  searchParamsSource?: SearchParamsInput;
};

const notoSerif = Noto_Serif({
  subsets: ["latin"],
  weight: ["400", "500", "700"]
});

const riskTheme = {
  "--risk-bg": "#fbf9f4",
  "--risk-sidebar": "#f5f4ed",
  "--risk-surface": "#ffffff",
  "--risk-surface-soft": "#f8decc",
  "--risk-surface-muted": "#efeee6",
  "--risk-text": "#31332c",
  "--risk-text-muted": "#5e6058",
  "--risk-text-soft": "rgba(94, 96, 88, 0.72)",
  "--risk-primary": "#5f5e5e",
  "--risk-secondary": "#6e5b4d",
  "--risk-tertiary": "#a23d3e",
  "--risk-border": "rgba(177, 179, 169, 0.18)",
  "--risk-shadow": "0 18px 40px rgba(49, 51, 44, 0.05)"
} as CSSProperties;

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  active?: boolean;
};

type Kpi = {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
};

type RiskRow = {
  id: string;
  initials: string;
  customer: string;
  date: string;
  value: string;
  alertType: string;
  score: number;
  status: string;
};

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/adm", icon: LayoutDashboard },
  { label: "Curadoria", href: "/adm/curadoria/produtos", icon: Sparkles },
  { label: "Sellers", href: "/adm/operacao/parceiros", icon: Store },
  { label: "Pedidos", href: "/adm/operacao/pedidos-criticos", icon: ShoppingBag },
  { label: "Logística", href: "/adm/operacao/logistica", icon: Truck },
  { label: "Risco", href: "/adm/financeiro/risco", icon: ShieldAlert, active: true },
  { label: "Financeiro", href: "/adm/financeiro", icon: Wallet },
  { label: "Configurações", href: "/adm/gestao/configuracoes", icon: Settings }
];

const kpis: Kpi[] = [
  {
    label: "Pedidos em Revisão",
    value: "14",
    detail: "Ação manual requerida",
    icon: ShieldAlert
  },
  {
    label: "Bloqueios (24h)",
    value: "128",
    detail: "Fluxo automatizado estável",
    icon: Blocks
  },
  {
    label: "Score Médio",
    value: "18.2",
    detail: "-4.2% vs semana anterior",
    icon: Shield
  },
  {
    label: "Volume em Análise",
    value: "R$ 42.850",
    detail: "6.2% do faturamento total",
    icon: CheckCircle2
  }
];

const rows: RiskRow[] = [
  {
    id: "#BP-98231",
    initials: "AL",
    customer: "Adriana Lima",
    date: "Hoje, 14:22",
    value: "R$ 12.450,00",
    alertType: "Alto Valor Suspeito",
    score: 85,
    status: "Pendente"
  },
  {
    id: "#BP-98214",
    initials: "MF",
    customer: "Marcelo Fonseca",
    date: "Hoje, 12:05",
    value: "R$ 1.200,00",
    alertType: "Múltiplos Cartões",
    score: 42,
    status: "Em Análise"
  },
  {
    id: "#BP-98199",
    initials: "VS",
    customer: "Valentina Sampaio",
    date: "Ontem, 23:45",
    value: "R$ 8.900,00",
    alertType: "Divergência Endereço",
    score: 15,
    status: "Revisado"
  }
];

function SidebarLink({ item }: { item: NavItem }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
        item.active
          ? "rounded-xl bg-[var(--risk-surface)] font-semibold text-[var(--risk-text)] shadow-[var(--risk-shadow)]"
          : "text-[var(--risk-text-muted)] hover:bg-[var(--risk-surface)] hover:text-[var(--risk-text)]"
      }`}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />
      <span>{item.label}</span>
    </Link>
  );
}

function FilterChip({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <button
      type="button"
      className={`rounded-full px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] transition-colors ${
        active
          ? "bg-[var(--risk-primary)] text-white"
          : "bg-[var(--risk-surface-muted)] text-[var(--risk-text-soft)] hover:text-[var(--risk-text)]"
      }`}
    >
      {label}
    </button>
  );
}

function KpiCard({ item }: { item: Kpi }) {
  const Icon = item.icon;

  return (
    <article className="rounded-2xl border border-[var(--risk-border)] bg-[var(--risk-surface)] p-5 shadow-[var(--risk-shadow)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--risk-text-soft)]">
            {item.label}
          </p>
          <p className={`mt-3 text-[2rem] leading-none tracking-[-0.04em] text-[var(--risk-text)] ${notoSerif.className}`}>
            {item.value}
          </p>
        </div>
        <Icon className="h-4 w-4 text-[var(--risk-text-soft)]" strokeWidth={1.8} />
      </div>
      <p className="mt-4 text-[11px] text-[var(--risk-text-muted)]">{item.detail}</p>
    </article>
  );
}

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="inline-flex min-w-[56px] items-center gap-2">
      <span className="text-xs font-semibold text-[var(--risk-text)]">{score}</span>
      <span className="h-[2px] w-8 overflow-hidden rounded-full bg-[rgba(49,51,44,0.12)]">
        <span
          className={`block h-full rounded-full ${score >= 70 ? "bg-[var(--risk-tertiary)]" : "bg-[var(--risk-primary)]"}`}
          style={{ width: `${Math.max(12, Math.min(score, 100))}%` }}
        />
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "Pendente"
      ? "bg-[rgba(162,61,62,0.08)] text-[var(--risk-tertiary)]"
      : status === "Em Análise"
        ? "bg-[rgba(110,91,77,0.12)] text-[var(--risk-secondary)]"
        : "bg-[rgba(95,94,94,0.08)] text-[var(--risk-primary)]";

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${tone}`}>
      {status}
    </span>
  );
}

export async function RiskPage({ filters, searchParamsSource = filters }: RiskPageProps) {
  const [alertsResult, dataSource] = await Promise.all([
    financeRepository.listFinancialAlerts(
      toListQueryParams(searchParamsSource, {
        page: 1,
        pageSize: 12,
        sortBy: "createdAt",
        sortDir: "desc"
      })
    ),
    getAdmDataSource()
  ]);
  const customerMap = Object.fromEntries(dataSource.customers.map((customer) => [customer.id, customer]));
  const orderMap = Object.fromEntries(dataSource.orders.map((order) => [order.id, order]));
  const payoutMap = Object.fromEntries(dataSource.payouts.map((payout) => [payout.id, payout]));
  const refundsByOrderId = Object.fromEntries(dataSource.refunds.map((refund) => [refund.orderId, refund]));
  const blockedPayouts = dataSource.payouts.filter(
    (payout) => payout.status === "bloqueado" || payout.status === "alerta" || payout.status === "em-revisao"
  );
  const liveRows = alertsResult.data.items.map((alert) => {
    const order = alert.orderId ? orderMap[alert.orderId] : undefined;
    const customer = order ? customerMap[order.customerId] : undefined;
    const refund = order ? refundsByOrderId[order.id] : undefined;
    const referenceAmount =
      refund?.amount ??
      (alert.payoutId ? payoutMap[alert.payoutId]?.grossAmount : undefined) ??
      order?.total ??
      0;
    const scoreByPriority = {
      baixa: 24,
      media: 48,
      alta: 72,
      critica: 91
    } as const;

    return {
      id: order?.id?.toUpperCase() ?? alert.id.toUpperCase(),
      initials:
        customer?.name
          ?.split(" ")
          .filter(Boolean)
          .slice(0, 2)
          .map((part) => part[0]?.toUpperCase())
          .join("") ?? "AL",
      customer: customer?.name ?? alert.sellerName,
      date: new Date(alert.createdAt).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
      }),
      value: formatCurrency(referenceAmount),
      alertType: alert.type,
      score: scoreByPriority[alert.priority as keyof typeof scoreByPriority] ?? 40,
      status:
        alert.status === "em-revisao"
          ? "Em Analise"
          : alert.status === "critico"
            ? "Pendente"
            : alert.status === "resolvido"
              ? "Revisado"
              : "Em Analise"
    };
  });
  const riskRows = liveRows.length > 0 ? liveRows : rows;
  const riskLevel = filters.priority ?? "critica";
  const kpiCards: Kpi[] = [
    {
      label: "Pedidos em Revisao",
      value: String(riskRows.length),
      detail: "Acao manual requerida",
      icon: ShieldAlert
    },
    {
      label: "Bloqueios (24h)",
      value: String(blockedPayouts.length),
      detail: "Fluxo automatizado estavel",
      icon: Blocks
    },
    {
      label: "Score Medio",
      value: (riskRows.reduce((sum, row) => sum + row.score, 0) / Math.max(riskRows.length, 1)).toFixed(1),
      detail: `${alertsResult.data.items.filter((alert) => alert.priority === "critica").length} casos criticos`,
      icon: Shield
    },
    {
      label: "Volume em Analise",
      value: formatCurrency(
        alertsResult.data.items.reduce((sum, alert) => {
          const order = alert.orderId ? orderMap[alert.orderId] : undefined;
          const payout = alert.payoutId ? payoutMap[alert.payoutId] : undefined;
          return sum + (payout?.grossAmount ?? order?.total ?? 0);
        }, 0)
      ),
      detail: `${alertsResult.data.meta.total} alertas no periodo`,
      icon: CheckCircle2
    }
  ];
  const visibleKpis = alertsResult.data.items.length > 0 ? kpiCards : kpis;
  const selectedRiskRow = riskRows[0];
  return (
    <div className="min-h-screen bg-[var(--risk-bg)] text-[var(--risk-text)]" style={riskTheme}>
      <div className="mx-auto flex min-h-screen w-full max-w-[1480px]">
        <aside className="flex w-60 shrink-0 flex-col bg-[var(--risk-sidebar)] px-4 py-7">
          <div className="px-2">
            <h1 className={`text-xl tracking-[-0.04em] text-[var(--risk-text)] ${notoSerif.className}`}>
              BelaPop
            </h1>
            <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-[var(--risk-text-soft)]">
              Luxo &amp; Curadoria
            </p>
          </div>

          <nav className="mt-8 space-y-1">
            {navItems.map((item) => (
              <SidebarLink key={item.href} item={item} />
            ))}
          </nav>

          <div className="mt-auto flex items-center gap-3 rounded-xl border border-[var(--risk-border)] bg-[var(--risk-surface)] px-3 py-3 shadow-[var(--risk-shadow)]">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--risk-text)] text-xs font-semibold text-[#f8f5ef]">
              A
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--risk-text)]">Admin</p>
              <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--risk-text-soft)]">
                Master Access
              </p>
            </div>
          </div>
        </aside>

        <div className="flex min-h-screen min-w-0 flex-1">
          <main className="min-w-0 flex-1 px-8 py-7">
            <header className="flex items-center justify-between gap-4">
              <h2 className={`text-[1.65rem] tracking-[-0.03em] text-[var(--risk-text)] ${notoSerif.className}`}>
                Risco &amp; Antifraude
              </h2>
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--risk-border)] bg-[var(--risk-surface)] px-4 py-2 text-xs text-[var(--risk-text-muted)]">
                  <CalendarDays className="h-4 w-4" strokeWidth={1.8} />
                  <span>Últimos 30 dias</span>
                </div>
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--risk-border)] bg-[var(--risk-surface)] text-[var(--risk-text-soft)]"
                  aria-label="Buscar"
                >
                  <Search className="h-4 w-4" strokeWidth={1.8} />
                </button>
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--risk-border)] bg-[var(--risk-surface)] text-[var(--risk-text-soft)]"
                  aria-label="Notificações"
                >
                  <Bell className="h-4 w-4" strokeWidth={1.8} />
                </button>
              </div>
            </header>

            <section className="mt-7">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <h3 className={`text-[2.15rem] tracking-[-0.04em] text-[var(--risk-text)] ${notoSerif.className}`}>
                    Monitoramento Editorial
                  </h3>
                  <p className="mt-2 max-w-[760px] text-sm leading-7 text-[var(--risk-text-muted)]">
                    Painel de análise de integridade transacional. Priorize revisões de alto impacto
                    para manter a exclusividade da experiência BelaPop.
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <Link
                    href={buildHref("/adm/financeiro/risco", searchParamsSource, {
                      priority: undefined,
                      page: undefined
                    })}
                  >
                    <FilterChip label="Todos" active={!filters.priority} />
                  </Link>
                  <Link
                    href={buildHref("/adm/financeiro/risco", searchParamsSource, {
                      priority: "baixa",
                      page: undefined
                    })}
                  >
                    <FilterChip label="Baixo" active={riskLevel === "baixa"} />
                  </Link>
                  <Link
                    href={buildHref("/adm/financeiro/risco", searchParamsSource, {
                      priority: "media",
                      page: undefined
                    })}
                  >
                    <FilterChip label="Medio" active={riskLevel === "media"} />
                  </Link>
                  <Link
                    href={buildHref("/adm/financeiro/risco", searchParamsSource, {
                      priority: "critica",
                      page: undefined
                    })}
                  >
                    <FilterChip label="Critico" active={riskLevel === "critica"} />
                  </Link>
                </div>
              </div>
            </section>

            <section className="mt-8 grid grid-cols-4 gap-4">
              {visibleKpis.map((item) => (
                <KpiCard key={item.label} item={item} />
              ))}
            </section>

            <section className="mt-6 rounded-2xl border border-[var(--risk-border)] bg-[var(--risk-surface)] p-5 shadow-[var(--risk-shadow)]">
              <div className="flex items-center justify-between gap-4">
                <h4 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--risk-text-soft)]">
                  Pedidos Suspeitos
                </h4>
                <button
                  type="button"
                  className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--risk-text-soft)]"
                >
                  Exportar Relatório
                </button>
              </div>

              <div className="mt-4 overflow-hidden rounded-xl border border-[var(--risk-border)]">
                <table className="min-w-full border-collapse">
                  <thead className="bg-[rgba(245,244,237,0.72)]">
                    <tr className="text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--risk-text-soft)]">
                      <th className="px-4 py-4">ID Pedido</th>
                      <th className="px-4 py-4">Cliente</th>
                      <th className="px-4 py-4">Data</th>
                      <th className="px-4 py-4">Valor</th>
                      <th className="px-4 py-4">Tipo de Alerta</th>
                      <th className="px-4 py-4">Score</th>
                      <th className="px-4 py-4">Status</th>
                      <th className="px-4 py-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--risk-border)] bg-white">
                    {riskRows.map((row) => (
                      <tr key={row.id} className="align-middle">
                        <td className="px-4 py-4 text-xs font-semibold text-[var(--risk-text)]">{row.id}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--risk-surface-soft)] text-[10px] font-semibold text-[var(--risk-secondary)]">
                              {row.initials}
                            </div>
                            <span className="text-sm text-[var(--risk-text)]">{row.customer}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-xs text-[var(--risk-text-muted)]">{row.date}</td>
                        <td className="px-4 py-4 text-sm text-[var(--risk-text)]">{row.value}</td>
                        <td className="px-4 py-4">
                          <span className="rounded-full bg-[rgba(162,61,62,0.08)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--risk-tertiary)]">
                            {row.alertType}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <ScoreBar score={row.score} />
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadge status={row.status} />
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--risk-border)] text-[var(--risk-text-soft)]"
                              aria-label={`Analisar ${row.id}`}
                            >
                              <Search className="h-4 w-4" strokeWidth={1.8} />
                            </button>
                            <button
                              type="button"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--risk-border)] text-[var(--risk-text-soft)]"
                              aria-label={`Aprovar ${row.id}`}
                            >
                              <CheckCircle2 className="h-4 w-4" strokeWidth={1.8} />
                            </button>
                            <button
                              type="button"
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--risk-border)] text-[var(--risk-text-soft)]"
                              aria-label={`Bloquear ${row.id}`}
                            >
                              <ShieldAlert className="h-4 w-4" strokeWidth={1.8} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-[var(--risk-text-soft)]">
                <p>
                  Exibindo {riskRows.length} de {alertsResult.data.meta.total} registros
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--risk-text-soft)]"
                    aria-label="Anterior"
                  >
                    <ChevronLeft className="h-4 w-4" strokeWidth={1.8} />
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--risk-text-soft)]"
                    aria-label="Próximo"
                  >
                    <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
                  </button>
                </div>
              </div>
            </section>
          </main>

          <aside className="w-[420px] shrink-0 border-l border-[var(--risk-border)] bg-[rgba(255,255,255,0.5)] px-6 py-7">
            <div className="rounded-2xl border border-[var(--risk-border)] bg-[var(--risk-surface)] p-5 shadow-[var(--risk-shadow)]">
              <h5 className={`text-xl tracking-[-0.03em] text-[var(--risk-text)] ${notoSerif.className}`}>
                Visão de Contexto: {selectedRiskRow?.customer ?? "Sem caso selecionado"}
              </h5>

              <div className="mt-5 space-y-4">
                <div className="rounded-xl border border-[var(--risk-border)] bg-[var(--risk-bg)] p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[var(--risk-text)]">
                    <MapPinned className="h-4 w-4 text-[var(--risk-secondary)]" strokeWidth={1.8} />
                    <span>Geolocalização vs Entrega</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[var(--risk-text-muted)]">
                    O acesso originou-se em São Paulo, SP, enquanto o endereço de entrega está
                    localizado em Manaus, AM. Distância: 2.689km.
                  </p>
                </div>

                <div className="rounded-xl border border-[var(--risk-border)] bg-[var(--risk-bg)] p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[var(--risk-text)]">
                    <CreditCard className="h-4 w-4 text-[var(--risk-secondary)]" strokeWidth={1.8} />
                    <span>Histórico de Pagamento</span>
                  </div>
                  <div className="mt-3 space-y-3 text-sm text-[var(--risk-text-muted)]">
                    <div className="flex items-center justify-between gap-4">
                      <span>Visa Platinum **** 8821</span>
                      <span className="text-emerald-700">Sucesso</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>Mastercard Black **** 1029</span>
                      <span className="text-[var(--risk-tertiary)]">Falha (Cód. 05)</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span>Amex Gold **** 4492</span>
                      <span className="text-[var(--risk-tertiary)]">Falha (Cód. 51)</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--risk-border)] bg-[var(--risk-bg)] p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-[var(--risk-text)]">
                    <Search className="h-4 w-4 text-[var(--risk-secondary)]" strokeWidth={1.8} />
                    <span>Impressão Digital do Dispositivo</span>
                  </div>
                  <div className="mt-3 space-y-2 text-sm text-[var(--risk-text-muted)]">
                    <p>IP: 187.32.14.92 (Vivo Fibra)</p>
                    <p>Browser: Safari on iOS 17.2</p>
                    <p>Reputação IP: Neutra</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-[rgba(162,61,62,0.18)] bg-[rgba(162,61,62,0.05)] p-5 shadow-[var(--risk-shadow)]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--risk-tertiary)]">
                Ação Recomendada
              </p>
              <p className={`mt-3 text-[1.6rem] tracking-[-0.03em] text-[var(--risk-text)] ${notoSerif.className}`}>
                Bloqueio Preventivo
              </p>
              <p className="mt-3 text-sm leading-6 text-[var(--risk-text-muted)]">
                Baseado na divergência de endereço e múltiplas tentativas de cartões distintos em
                curto intervalo, este pedido apresenta alta probabilidade de fraude (85%).
              </p>

              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--risk-tertiary)] px-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white"
                >
                  Executar Bloqueio
                </button>
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--risk-border)] bg-white px-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--risk-text)]"
                >
                  Ignorar Alerta
                </button>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-[var(--risk-border)] bg-[var(--risk-surface)] p-5 shadow-[var(--risk-shadow)]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--risk-text-soft)]">
                Notas de Análise
              </p>
              <textarea
                className="mt-3 h-36 w-full resize-none rounded-xl border border-[var(--risk-border)] bg-[var(--risk-bg)] px-4 py-3 text-sm text-[var(--risk-text)] outline-none placeholder:text-[var(--risk-text-soft)]"
                placeholder="Adicionar observação sobre o caso..."
                defaultValue=""
              />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
