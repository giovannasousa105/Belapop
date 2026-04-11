import Image from "next/image";
import Link from "next/link";
import { Noto_Serif } from "next/font/google";
import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  CalendarDays,
  ChevronDown,
  CircleDollarSign,
  Info,
  Landmark,
  LayoutDashboard,
  ReceiptText,
  RotateCcw,
  Scale,
  Settings,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  Store,
  TrendingUp,
  Truck,
  Wallet
} from "lucide-react";

import { getCurrentAdmUser } from "@/lib/adm/auth/current-user";
import { canAccessRoute } from "@/lib/adm/auth/guards";
import { formatCurrency } from "@/lib/adm/format";
import { financeRepository } from "@/lib/adm/repositories";
import type { FinancialAlertListItem } from "@/lib/adm/repositories/financeRepository";
import { getAdmDataSource } from "@/lib/adm/repositories/source";
import { toListQueryParams, type AdmFilters } from "@/lib/adm/url";

const notoSerif = Noto_Serif({
  subsets: ["latin"],
  weight: ["400", "600", "700"]
});

const financeTheme = {
  "--finance-bg": "#fbf9f4",
  "--finance-sidebar": "#f5f4ed",
  "--finance-surface": "#ffffff",
  "--finance-surface-low": "#efeee6",
  "--finance-surface-high": "#e8e9e0",
  "--finance-surface-highest": "#e2e3d9",
  "--finance-text": "#31332c",
  "--finance-text-soft": "#5e6058",
  "--finance-outline": "#797c73",
  "--finance-outline-variant": "#b1b3a9",
  "--finance-primary": "#5f5e5e",
  "--finance-primary-dim": "#535252",
  "--finance-secondary": "#6e5b4d",
  "--finance-tertiary": "#a23d3e"
} as CSSProperties;

type FinanceOverviewPageProps = {
  filters: AdmFilters;
};

type SidebarItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  active?: boolean;
};

type MetricCardData = {
  label: string;
  value: string;
  meta: string;
  tone: "green" | "neutral" | "tertiary";
  icon: LucideIcon;
};

type AlertCardData = {
  id: string;
  title: string;
  summary: string;
  metaLabel: string;
  metaValue: string;
  actionLabel: string;
  href?: string;
  tone: "tertiary" | "secondary" | "neutral";
  icon: LucideIcon;
};

const sidebarItems: SidebarItem[] = [
  { label: "Dashboard", href: "/adm/dashboard-executivo", icon: LayoutDashboard },
  { label: "Curadoria", href: "/adm/curadoria/produtos", icon: Sparkles },
  { label: "Sellers", href: "/adm/operacao/parceiros", icon: Store },
  { label: "Pedidos", href: "/adm/operacao/pedidos-criticos", icon: ShoppingBag },
  { label: "Logística", href: "/adm/operacao/logistica", icon: Truck },
  { label: "Risco", href: "/adm/financeiro/risco", icon: ShieldAlert },
  { label: "Financeiro", href: "/adm/financeiro", icon: Wallet, active: true },
  { label: "Configurações", href: "/adm/gestao/configuracoes", icon: Settings }
];

const revenueBars = [
  { height: "40%", opacity: "bg-[var(--finance-primary)]/10" },
  { height: "55%", opacity: "bg-[var(--finance-primary)]/20" },
  { height: "45%", opacity: "bg-[var(--finance-primary)]/15" },
  { height: "70%", opacity: "bg-[var(--finance-primary)]/30" },
  { height: "60%", opacity: "bg-[var(--finance-primary)]/40" },
  { height: "85%", opacity: "bg-[var(--finance-primary)]/25" },
  { height: "100%", opacity: "bg-[var(--finance-primary)]/60" }
];

function SidebarLink({ item }: { item: SidebarItem }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={`group flex items-center gap-3 px-6 py-3 text-sm tracking-wide transition-colors duration-200 ${
        item.active
          ? "border-l-2 border-[var(--finance-primary)] bg-[var(--finance-surface-low)] font-bold text-[var(--finance-text)]"
          : "text-[var(--finance-primary)] hover:bg-[var(--finance-surface-low)]"
      }`}
    >
      <Icon className="h-5 w-5" strokeWidth={item.active ? 2 : 1.75} />
      <span>{item.label}</span>
    </Link>
  );
}

function FinanceMetricCard({ card }: { card: MetricCardData }) {
  const Icon = card.icon;
  const toneClass =
    card.tone === "green"
      ? "text-[#2e7d32]"
      : card.tone === "tertiary"
        ? "text-[var(--finance-tertiary)]"
        : "text-[var(--finance-outline)]";

  return (
    <article className="rounded-xl border border-[rgba(177,179,169,0.05)] bg-[var(--finance-surface)] p-6">
      <p className="mb-4 text-[10px] uppercase tracking-widest text-[var(--finance-primary)]">
        {card.label}
      </p>
      <h3 className={`${notoSerif.className} text-2xl text-[var(--finance-text)]`}>{card.value}</h3>
      <div className={`mt-4 flex items-center gap-2 text-[10px] font-medium ${toneClass}`}>
        <Icon className="h-3.5 w-3.5" strokeWidth={1.9} />
        <span>{card.meta}</span>
      </div>
    </article>
  );
}

function AlertCard({ alert }: { alert: AlertCardData }) {
  const Icon = alert.icon;
  const toneClass =
    alert.tone === "tertiary"
      ? "bg-[rgba(162,61,62,0.10)] text-[var(--finance-tertiary)]"
      : alert.tone === "secondary"
        ? "bg-[rgba(110,91,77,0.10)] text-[var(--finance-secondary)]"
        : "bg-[rgba(121,124,115,0.10)] text-[var(--finance-outline)]";

  const content = (
    <>
      <div className="flex items-center gap-6">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${toneClass}`}>
          <Icon className="h-5 w-5" strokeWidth={1.8} />
        </div>
        <div>
          <p className="text-sm font-bold text-[var(--finance-text)]">{alert.title}</p>
          <p className="mt-1 text-xs text-[var(--finance-outline)]">{alert.summary}</p>
        </div>
      </div>
      <div className="flex items-center gap-8 text-right">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-[var(--finance-outline)]">
            {alert.metaLabel}
          </p>
          <p
            className={`text-sm font-medium ${
              alert.tone === "tertiary" ? "text-[var(--finance-tertiary)]" : "text-[var(--finance-text)]"
            }`}
          >
            {alert.metaValue}
          </p>
        </div>
        <span className="inline-flex min-h-10 items-center justify-center border border-[rgba(177,179,169,0.30)] px-5 text-[10px] font-bold uppercase tracking-widest transition-all hover:bg-[var(--finance-text)] hover:text-[var(--finance-surface)]">
          {alert.actionLabel}
        </span>
      </div>
    </>
  );

  if (alert.href) {
    return (
      <Link
        href={alert.href}
        className="flex items-center justify-between gap-6 bg-[var(--finance-surface)] p-6 transition-colors hover:bg-[rgba(255,247,246,0.4)]"
      >
        {content}
      </Link>
    );
  }

  return <div className="flex items-center justify-between gap-6 bg-[var(--finance-surface)] p-6">{content}</div>;
}

function buildFallbackAlerts(canAudit: boolean): AlertCardData[] {
  return [
    {
      id: "fallback-payout-delay",
      title: "Repasses Atrasados: Maison de Beauté",
      summary: "Divergência em dados bancários para repasse de R$ 42.150,00.",
      metaLabel: "Atraso",
      metaValue: "3 Dias",
      actionLabel: "Resolver",
      href: canAudit ? "/adm/financeiro/auditoria?priority=critica" : undefined,
      tone: "tertiary",
      icon: AlertTriangle
    },
    {
      id: "fallback-divergence",
      title: "Divergência: Promoção Relâmpago",
      summary: "Diferença de R$ 1.200 no cálculo de subsídio da plataforma em itens de luxo.",
      metaLabel: "Tipo",
      metaValue: "Contábil",
      actionLabel: "Auditar",
      href: canAudit ? "/adm/financeiro/auditoria?status=em-revisao" : undefined,
      tone: "secondary",
      icon: Scale
    },
    {
      id: "fallback-refunds",
      title: "Alto Volume: Reembolsos em Fragrâncias",
      summary: "Aumento de 15% em pedidos de estorno para a categoria parfum nas últimas 48h.",
      metaLabel: "Risco",
      metaValue: "Médio",
      actionLabel: "Analisar",
      href: canAudit ? "/adm/financeiro/reembolsos?status=pendente" : undefined,
      tone: "tertiary",
      icon: RotateCcw
    }
  ];
}

function buildAlertCards(items: FinancialAlertListItem[], canAudit: boolean): AlertCardData[] {
  if (!Array.isArray(items) || items.length === 0) {
    return buildFallbackAlerts(canAudit);
  }

  return items.slice(0, 3).map((alert, index) => {
    const normalizedType = alert.type.toLowerCase();
    const normalizedSummary = alert.summary.toLowerCase();
    const isRefund = normalizedType.includes("reembolso") || normalizedSummary.includes("reembolso");
    const isDivergence =
      normalizedType.includes("diverg") ||
      normalizedSummary.includes("diverg") ||
      normalizedSummary.includes("subsídio") ||
      normalizedSummary.includes("subsidio");
    const isDelayed = normalizedType.includes("repasse") || normalizedSummary.includes("repasse");

    const tone: AlertCardData["tone"] = isRefund || isDelayed ? "tertiary" : isDivergence ? "secondary" : "neutral";
    const icon = isRefund ? RotateCcw : isDivergence ? Scale : isDelayed ? AlertTriangle : Info;
    const metaLabel = isDelayed ? "Atraso" : isDivergence ? "Tipo" : "Risco";
    const metaValue = isDelayed
      ? "3 Dias"
      : isDivergence
        ? "Contábil"
        : alert.priority === "critica"
          ? "Crítico"
          : alert.priority === "alta"
            ? "Alto"
            : "Médio";
    const actionLabel = isDelayed ? "Resolver" : isDivergence ? "Auditar" : "Analisar";
    const prefix = isDelayed ? "Repasses Atrasados" : isDivergence ? "Divergência" : "Alto Volume";
    const sellerSuffix = alert.sellerName ? `: ${alert.sellerName}` : "";

    return {
      id: alert.id,
      title: `${prefix}${sellerSuffix}`.trim(),
      summary: alert.summary,
      metaLabel,
      metaValue,
      actionLabel,
      href: canAudit ? `/adm/financeiro/auditoria?alert=${alert.id}` : undefined,
      tone,
      icon: index === 2 && !isRefund && !isDivergence && !isDelayed ? RotateCcw : icon
    };
  });
}

export async function FinanceOverviewPage({ filters }: FinanceOverviewPageProps) {
  const [summary, dataSource, currentUser] = await Promise.all([
    financeRepository.getFinanceSummary(),
    getAdmDataSource(),
    getCurrentAdmUser()
  ]);
  const canAudit = currentUser ? canAccessRoute(currentUser, "/adm/financeiro/auditoria").allowed : false;
  const alertsResult = await financeRepository.listFinancialAlerts(
    toListQueryParams(filters, {
      page: 1,
      pageSize: 3,
      sortBy: "createdAt",
      sortDir: "desc"
    })
  );

  const pendingPayoutAmount = dataSource.payouts
    .filter((payout) => payout.status === "pendente")
    .reduce((sum, payout) => sum + payout.netAmount, 0);
  const pendingPayoutCount = dataSource.payouts.filter((payout) => payout.status === "pendente").length;
  const completedPayoutAmount = dataSource.payouts
    .filter((payout) => payout.status === "resolvido")
    .reduce((sum, payout) => sum + payout.netAmount, 0);
  const refundShare = summary.grossPayout > 0 ? (summary.refundAmount / summary.grossPayout) * 100 : 0;

  const metricCards: MetricCardData[] = [
    {
      label: "GMV Total",
      value: formatCurrency(summary.grossPayout),
      meta: "+12.4%",
      tone: "green",
      icon: TrendingUp
    },
    {
      label: "Receita (Take Rate)",
      value: formatCurrency(summary.grossPayout - summary.netPayout),
      meta: "Média de 15% por transação",
      tone: "neutral",
      icon: CircleDollarSign
    },
    {
      label: "Repasses Pendentes",
      value: formatCurrency(pendingPayoutAmount),
      meta: `${pendingPayoutCount} sellers aguardando`,
      tone: "tertiary",
      icon: Landmark
    },
    {
      label: "Repasses Realizados",
      value: formatCurrency(completedPayoutAmount),
      meta: "Ciclo de 15 dias concluído",
      tone: "neutral",
      icon: ReceiptText
    },
    {
      label: "Estornos",
      value: formatCurrency(summary.refundAmount),
      meta: `${refundShare.toFixed(1)}% do volume total`,
      tone: "neutral",
      icon: Info
    }
  ];

  const alertCards = alertsResult.success
    ? buildAlertCards(alertsResult.data.items, canAudit)
    : buildFallbackAlerts(canAudit);

  return (
    <div style={financeTheme} className="min-h-screen bg-[var(--finance-bg)] text-[var(--finance-text)]">
      <aside className="fixed left-0 top-0 flex h-screen w-64 flex-col border-r border-[rgba(177,179,169,0.15)] bg-[var(--finance-sidebar)] py-8 font-body text-sm tracking-wide">
        <div className="mb-10 px-8">
          <h1 className={`${notoSerif.className} text-xl text-[var(--finance-text)]`}>BelaPop</h1>
          <p className="mt-1 text-[10px] uppercase tracking-[0.2em] opacity-50">Premium Beauty Admin</p>
        </div>

        <nav className="flex-1">
          {sidebarItems.map((item) => (
            <SidebarLink key={item.label} item={item} />
          ))}
        </nav>

        <div className="mt-auto px-6">
          <div className="flex items-center gap-3 rounded-xl bg-[var(--finance-surface-low)] p-4">
            <div className="h-8 w-8 overflow-hidden rounded-full bg-[rgba(177,179,169,0.30)]">
              <Image
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuA7b1kpmFSYJeMjWIWnrO0NOGVY3Yu7wzAGrstIUM4PLF6EpM0vEWTbodPlddMqO6xaGNjL2aPQJ_hmOk936XwyC3gmnY_zQdmWOF_l5AivM4XvkNbzdNT5-BCup-zpYgzlx3z4CopZhtWvarVF4qi_dPIx33wvcLEv0zEMMnl_TmyVTNdQKWrzBpEc8VdFnnT7zojCRkzhFVP7GyI99N7N8I6RAN9O6-d7olE6E1TEit66vDe5Vww0WW5xkbUBJx402eYjd6Fhi7Nb"
                alt="Admin BelaPop"
                width={32}
                height={32}
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <p className="text-xs font-bold text-[var(--finance-text)]">Admin BelaPop</p>
              <p className="text-[10px] opacity-60">Sair da conta</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="ml-64 p-12">
        <header className="mb-16 flex items-end justify-between">
          <div>
            <h2 className={`${notoSerif.className} text-4xl tracking-tighter text-[var(--finance-text)]`}>
              Gestão Financeira
            </h2>
            <p className="mt-2 text-sm text-[var(--finance-primary)]">
              Visão consolidada da saúde econômica e fluxos de caixa.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex cursor-pointer items-center gap-3 rounded-full border border-[rgba(177,179,169,0.15)] bg-[var(--finance-surface)] px-4 py-2">
              <CalendarDays className="h-4 w-4 text-[var(--finance-text)]" strokeWidth={1.8} />
              <span className="text-xs font-medium tracking-wide">01 Jan — 31 Jan, 2024</span>
              <ChevronDown className="h-4 w-4 text-[var(--finance-text)]" strokeWidth={1.8} />
            </div>
            <button
              type="button"
              className="rounded-full bg-[var(--finance-primary)] px-6 py-2 text-xs font-medium tracking-wider text-[var(--finance-surface)] transition-opacity hover:opacity-90"
            >
              EXPORTAR RELATÓRIO
            </button>
          </div>
        </header>

        <section className="mb-12 grid grid-cols-5 gap-6">
          {metricCards.map((card) => (
            <FinanceMetricCard key={card.label} card={card} />
          ))}
        </section>

        <section className="mb-16 grid grid-cols-2 gap-12">
          <article className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className={`${notoSerif.className} text-lg text-[var(--finance-text)]`}>Evolução de Receita</h4>
              <span className="text-[10px] uppercase tracking-widest opacity-40">Projeção Mensal</span>
            </div>
            <div className="flex h-64 w-full items-end gap-4 overflow-hidden rounded-xl bg-[var(--finance-surface-low)] px-8 pb-4">
              {revenueBars.map((bar, index) => (
                <div
                  key={`${bar.height}-${index}`}
                  className={`flex-1 rounded-t-sm ${bar.opacity}`}
                  style={{ height: bar.height }}
                />
              ))}
            </div>
          </article>

          <article className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className={`${notoSerif.className} text-lg text-[var(--finance-text)]`}>Evolução de Repasses</h4>
              <span className="text-[10px] uppercase tracking-widest opacity-40">
                Comprometimento de Caixa
              </span>
            </div>
            <div className="relative flex h-64 w-full items-center justify-center overflow-hidden rounded-xl bg-[var(--finance-surface-low)] p-8">
              <svg className="h-full w-full text-[var(--finance-secondary)]" viewBox="0 0 400 100" fill="none">
                <path
                  d="M0 80 Q 50 70, 100 85 T 200 50 T 300 60 T 400 20"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <circle cx="400" cy="20" r="3" fill="currentColor" />
              </svg>
              <div className="absolute bottom-4 left-0 flex w-full justify-between px-8 text-[10px] uppercase tracking-tight opacity-30">
                <span>Sem 1</span>
                <span>Sem 2</span>
                <span>Sem 3</span>
                <span>Sem 4</span>
              </div>
            </div>
          </article>
        </section>

        <section className="space-y-8">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-[var(--finance-tertiary)]" strokeWidth={1.9} />
            <h4 className={`${notoSerif.className} text-xl italic text-[var(--finance-text)]`}>
              Alertas Críticos & Divergências
            </h4>
          </div>

          <div className="space-y-1">
            {alertCards.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        </section>

        <footer className="mt-24 border-t border-[rgba(177,179,169,0.10)] pt-8 text-center">
          <p className={`${notoSerif.className} text-sm italic text-[var(--finance-outline)]`}>
            BelaPop Finance — Precisão e Curadoria em cada transação.
          </p>
          <p className="mt-4 text-[9px] uppercase tracking-[0.3em] opacity-30">
            Sistema de Auditoria Premium v2.4.0
          </p>
        </footer>
      </main>
    </div>
  );
}
