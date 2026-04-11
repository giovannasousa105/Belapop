"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { Noto_Serif } from "next/font/google";
import { useEffect, useState, type CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  BadgeCheck,
  Bell,
  CalendarDays,
  ChevronDown,
  HelpCircle,
  LayoutDashboard,
  Menu,
  Minus,
  RefreshCw,
  Settings,
  ShieldAlert,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Store,
  TrendingUp,
  Truck,
  Undo2,
  UserPlus,
  UserX,
  Wallet,
  Wand2,
  X
} from "lucide-react";

const notoSerif = Noto_Serif({
  subsets: ["latin"],
  weight: ["400", "500", "700"]
});

const dashboardTheme = {
  "--exec-bg": "#fbf9f4",
  "--exec-text": "#31332c",
  "--exec-text-muted": "#5e6058",
  "--exec-text-soft": "rgba(94,96,88,0.66)",
  "--exec-primary": "#5f5e5e",
  "--exec-secondary": "#6e5b4d",
  "--exec-tertiary": "#a23d3e",
  "--exec-surface": "#ffffff",
  "--exec-surface-low": "#f5f4ed",
  "--exec-surface-mid": "#efeee6",
  "--exec-border": "rgba(177,179,169,0.18)",
  "--exec-shadow": "0 20px 40px rgba(49, 51, 44, 0.05)"
} as CSSProperties;

const cardClass =
  "rounded-xl border border-[rgba(177,179,169,0.08)] bg-[var(--exec-surface)] shadow-[var(--exec-shadow)]";
const softCardClass = "rounded-xl bg-[var(--exec-surface-low)]";
const labelClass =
  "text-[10px] font-semibold uppercase tracking-[0.2em] text-[rgba(94,96,88,0.6)]";

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  active?: boolean;
};

type ExecutiveDashboardIconKey =
  | "alert-triangle"
  | "badge-check"
  | "shield-alert"
  | "truck"
  | "undo2"
  | "user-plus"
  | "user-x"
  | "wallet"
  | "wand2";

type MetricCardItem = {
  label: string;
  value: string;
  detail: string;
  tone: "positive" | "neutral" | "muted";
};

type StatusCardItem = {
  label: string;
  value: string;
  iconKey: ExecutiveDashboardIconKey;
  accent?: "danger";
};

type AlertItem = {
  title: string;
  description: string;
  time: string;
  iconKey: ExecutiveDashboardIconKey;
  tone?: "danger" | "neutral";
};

type InsightCardItem = {
  label: string;
  value: string;
  detail: string;
  detailTone?: "positive" | "muted" | "danger";
};

export type ExecutiveDashboardPageProps = {
  summaryCards?: MetricCardItem[];
  operationCards?: StatusCardItem[];
  alerts?: AlertItem[];
  insightCards?: InsightCardItem[];
};

const primaryNav: NavItem[] = [
  { label: "Dashboard", href: "/adm/dashboard-executivo", icon: LayoutDashboard, active: true },
  { label: "Curadoria", href: "/adm/curadoria/produtos", icon: Sparkles },
  { label: "Sellers", href: "/adm/operacao/parceiros", icon: Store },
  { label: "Pedidos", href: "/adm/operacao/pedidos-criticos", icon: ShoppingBag },
  { label: "Logística", href: "/adm/operacao/logistica", icon: Truck },
  { label: "Financeiro", href: "/adm/financeiro", icon: Wallet },
  { label: "Risco", href: "/adm/financeiro/risco", icon: ShieldAlert },
  { label: "Configurações", href: "/adm/gestao/configuracoes", icon: Settings }
];

const summaryCards: MetricCardItem[] = [
  {
    label: "GMV MENSAL",
    value: "R$ 1.250.000,00",
    detail: "+12.4% vs mês ant.",
    tone: "positive"
  },
  {
    label: "PEDIDOS DIÁRIOS",
    value: "432",
    detail: "Estável",
    tone: "neutral"
  },
  {
    label: "SELLERS ATIVOS",
    value: "128",
    detail: "5 novos hoje",
    tone: "positive"
  },
  {
    label: "SKUS ATIVOS",
    value: "8.420",
    detail: "Últ. sinc: 2 min atrás",
    tone: "muted"
  }
];

const operationCards: StatusCardItem[] = [
  { label: "Curadoria Pendente", value: "56 itens", iconKey: "wand2" },
  { label: "Sellers Pendentes", value: "12 contas", iconKey: "user-plus" },
  { label: "Taxa de Aprovação", value: "94.2%", iconKey: "badge-check" },
  { label: "Pedidos em Risco", value: "8 críticos", iconKey: "alert-triangle", accent: "danger" }
];

const alerts: AlertItem[] = [
  {
    title: "Atraso em Entregas (SP)",
    description: "4 transportadoras reportaram instabilidade na malha sudeste.",
    time: "14:20",
    iconKey: "truck"
  },
  {
    title: "Chargebacks Elevados",
    description: "Pico de contestações identificado na categoria Perfumaria.",
    time: "12:05",
    iconKey: "wallet",
    tone: "danger"
  },
  {
    title: "Devoluções Recentes",
    description: "Aumento de 3% em pedidos devolvidos por avaria física.",
    time: "Ontem",
    iconKey: "undo2"
  },
  {
    title: "Sellers sem Resposta",
    description: "12 sellers não responderam tickets críticos em 24h.",
    time: "Ontem",
    iconKey: "user-x",
    tone: "neutral"
  }
];

const insightCards: InsightCardItem[] = [
  { label: "Ticket Médio", value: "R$ 289,30", detail: "+R$ 14,00", detailTone: "positive" },
  { label: "Churn de Sellers", value: "1.2%", detail: "-0.4%", detailTone: "muted" }
];

const executiveIcons: Record<ExecutiveDashboardIconKey, LucideIcon> = {
  "alert-triangle": AlertTriangle,
  "badge-check": BadgeCheck,
  "shield-alert": ShieldAlert,
  truck: Truck,
  undo2: Undo2,
  "user-plus": UserPlus,
  "user-x": UserX,
  wallet: Wallet,
  wand2: Wand2
};

function SidebarLink({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`flex items-center gap-3 py-3 text-sm transition-colors duration-300 ${
        item.active
          ? "border-l-2 border-[var(--exec-primary)] pl-4 font-bold text-[var(--exec-text)]"
          : "pl-4 font-medium text-[rgba(95,94,94,0.7)] hover:bg-[var(--exec-surface-mid)]"
      }`}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />
      <span className={`${notoSerif.className} font-medium tracking-tight`}>{item.label}</span>
    </Link>
  );
}

function SummaryCard({ item }: { item: MetricCardItem }) {
  return (
    <article
      className={`${cardClass} flex min-h-[176px] flex-col justify-between p-8 transition-transform duration-300 hover:scale-[1.01]`}
    >
      <div>
        <p className={labelClass}>{item.label}</p>
        <h3
          className={`mt-3 text-3xl font-light leading-none tracking-[-0.03em] text-[var(--exec-text)] ${notoSerif.className}`}
        >
          {item.value}
        </h3>
      </div>
      <div className="mt-4 flex items-center gap-1">
        {item.tone === "positive" ? (
          <TrendingUp className="h-4 w-4 text-emerald-700" strokeWidth={1.8} />
        ) : item.tone === "neutral" ? (
          <Minus className="h-4 w-4 text-[rgba(94,96,88,0.42)]" strokeWidth={1.8} />
        ) : (
          <RefreshCw className="h-4 w-4 text-[rgba(94,96,88,0.6)]" strokeWidth={1.8} />
        )}
        <span
          className={`text-[11px] ${
            item.tone === "positive"
              ? "font-bold text-emerald-700"
              : "font-medium text-[rgba(94,96,88,0.66)]"
          }`}
        >
          {item.detail}
        </span>
      </div>
    </article>
  );
}

function StatusCard({ item }: { item: StatusCardItem }) {
  const Icon = executiveIcons[item.iconKey];
  const isDanger = item.accent === "danger";

  return (
    <article
      className={`group flex cursor-pointer items-center justify-between rounded-xl p-6 transition-all ${
        isDanger
          ? "border border-[rgba(162,61,62,0.12)] bg-[rgba(162,61,62,0.05)] hover:bg-[rgba(162,61,62,0.1)]"
          : "bg-[var(--exec-surface-low)] hover:bg-[var(--exec-surface-mid)]"
      }`}
    >
      <div>
        <p
          className={`text-[11px] font-medium ${
            isDanger ? "text-[var(--exec-tertiary)]" : "text-[var(--exec-text-muted)]"
          }`}
        >
          {item.label}
        </p>
        <p
          className={`mt-1 text-xl font-bold ${
            isDanger ? "text-[var(--exec-tertiary)]" : "text-[var(--exec-text)]"
          }`}
        >
          {item.value}
        </p>
      </div>
      <Icon
        className={`h-5 w-5 ${isDanger ? "text-[var(--exec-tertiary)]" : "text-[var(--exec-primary)]"}`}
        strokeWidth={1.8}
      />
    </article>
  );
}

function AlertRow({ item }: { item: AlertItem }) {
  const Icon = executiveIcons[item.iconKey];
  const isDanger = item.tone === "danger";

  return (
    <div className="flex items-start gap-4 p-5 transition-colors hover:bg-[var(--exec-bg)]">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--exec-surface-mid)]">
        <Icon
          className={`h-4 w-4 ${isDanger ? "text-[var(--exec-tertiary)]" : "text-[var(--exec-primary)]"}`}
          strokeWidth={1.8}
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex justify-between gap-4">
          <p className="truncate text-sm font-semibold text-[var(--exec-text)]">{item.title}</p>
          <span className="text-[10px] text-[var(--exec-text-soft)]">{item.time}</span>
        </div>
        <p className="mt-1 text-xs leading-5 text-[rgba(94,96,88,0.7)]">{item.description}</p>
      </div>
    </div>
  );
}

function InsightCard({
  label,
  value,
  detail,
  detailTone = "positive"
}: {
  label: string;
  value: string;
  detail: string;
  detailTone?: InsightCardItem["detailTone"];
}) {
  const detailClass =
    detailTone === "danger"
      ? "text-[var(--exec-tertiary)]"
      : detailTone === "muted"
        ? "text-[rgba(94,96,88,0.66)]"
        : "text-emerald-700";

  return (
    <article className={`${softCardClass} rounded-xl p-6`}>
      <p className={labelClass}>{label}</p>
      <div className="mt-3 flex items-baseline gap-2">
        <span className={`text-xl text-[var(--exec-text)] ${notoSerif.className}`}>{value}</span>
        <span className={`text-[10px] font-bold ${detailClass}`}>{detail}</span>
      </div>
    </article>
  );
}

export function ExecutiveDashboardPage({
  summaryCards: summaryCardsProp,
  operationCards: operationCardsProp,
  alerts: alertsProp,
  insightCards: insightCardsProp
}: ExecutiveDashboardPageProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const visibleSummaryCards = summaryCardsProp ?? summaryCards;
  const visibleOperationCards = operationCardsProp ?? operationCards;
  const visibleAlerts = alertsProp ?? alerts;
  const visibleInsightCards = insightCardsProp ?? insightCards;

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <div className="min-h-screen bg-[var(--exec-bg)] text-[var(--exec-text)]" style={dashboardTheme}>
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-[rgba(14,14,12,0.36)] backdrop-blur-[2px] lg:hidden"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col overflow-y-auto bg-[var(--exec-surface-low)] px-6 py-8 transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="mb-10 px-4">
          <h1 className={`text-xl font-bold tracking-[-0.04em] text-[var(--exec-text)] ${notoSerif.className}`}>
            BelaPop
          </h1>
          <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.24em] text-[rgba(94,96,88,0.6)]">
            Marketplace Admin
          </p>
        </div>

        <nav className="flex-1 space-y-1">
          {primaryNav.map((item) => (
            <SidebarLink key={item.label} item={item} onClick={() => setMobileOpen(false)} />
          ))}
        </nav>

        <div className="mt-auto border-t border-[rgba(177,179,169,0.1)] pt-6">
          <Link
            href="/adm/gestao/relatorios"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 py-3 pl-4 text-[rgba(95,94,94,0.7)] transition-colors duration-300 hover:bg-[var(--exec-surface-mid)]"
          >
            <HelpCircle className="h-[18px] w-[18px] shrink-0" strokeWidth={1.8} />
            <span className={`${notoSerif.className} text-sm font-medium tracking-tight`}>Support</span>
          </Link>

          <div className="mt-4 flex items-center gap-3 px-4">
            <div className="h-8 w-8 overflow-hidden rounded-full bg-[var(--exec-surface-mid)]">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuARQVfhChrAwr6-Bd-vOQO01kvVMCattVFFhiV1-tUvlsX4m4BTPzUjbVZMbiESD1vzJ08OZcB9VuK7rDy-8QR1mIHJEcwFfPHb_mm0c0vhu3gcJLaRuDsJ5npgHm32LYn-3hk2SXfc9HQV2ovZbNCf2JidUHmH7u7ma_z0T7coSGVD4bAMRmErUftBkXeGWxGZq0UcWM0siSYy8UEReEQxttpK4SJvyaA-PiuPMSL2tLN0x5-3Eondezs38XDZs_54IsVcY5s6TYZ2"
                alt="Administrator profile"
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <p className="text-xs font-semibold leading-none text-[var(--exec-text)]">Admin</p>
              <p className="mt-1 text-[10px] text-[var(--exec-text-soft)]">Executivo</p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--exec-border)] bg-white text-[var(--exec-text)] lg:hidden"
          aria-label="Fechar menu lateral"
        >
          <X className="h-4 w-4" />
        </button>
      </aside>

      <div className="flex min-h-screen flex-col lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-black/5 bg-[rgba(251,249,244,0.82)] backdrop-blur-md">
          <div className="flex h-20 w-full items-center justify-between gap-4 px-4 md:px-6 lg:px-10">
            <div className="flex min-w-0 items-center gap-4 lg:gap-6">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--exec-border)] bg-white text-[var(--exec-text)] lg:hidden"
                aria-label="Abrir menu lateral"
              >
                <Menu className="h-4 w-4" />
              </button>

              <h2
                className={`min-w-0 truncate text-[1.5rem] tracking-[-0.03em] text-[var(--exec-text)] lg:text-2xl ${notoSerif.className}`}
              >
                Visão Geral da Operação
              </h2>

              <div className="hidden items-center gap-3 rounded-xl bg-[var(--exec-surface-low)] px-4 py-2 md:flex">
                <CalendarDays className="h-4 w-4 text-[rgba(121,124,115,0.9)]" strokeWidth={1.8} />
                <span className="text-xs font-medium text-[var(--exec-text-muted)]">01 Jan - 30 Jan 2026</span>
                <ChevronDown className="h-4 w-4 text-[rgba(121,124,115,0.9)]" strokeWidth={1.8} />
              </div>
            </div>

            <div className="flex items-center gap-4 lg:gap-6">
              <nav className="hidden items-center gap-8 md:flex">
                <Link
                  href="/adm/gestao/relatorios"
                  className="border-b border-[var(--exec-text)] pb-1 text-sm font-medium text-[var(--exec-text)]"
                >
                  Relatórios
                </Link>
                <button
                  type="button"
                  className="text-sm font-medium text-[var(--exec-primary)] transition-opacity duration-200 hover:text-[var(--exec-text)]"
                >
                  Exportar
                </button>
              </nav>

              <div className="hidden h-6 w-px bg-[rgba(177,179,169,0.2)] md:block" />

              <div className="flex items-center gap-2 md:gap-4">
                <button
                  type="button"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[var(--exec-text-soft)] transition-colors hover:bg-[var(--exec-surface-mid)]"
                  aria-label="Notificações"
                >
                  <Bell className="h-4 w-4" strokeWidth={1.8} />
                </button>
                <button
                  type="button"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[var(--exec-text-soft)] transition-colors hover:bg-[var(--exec-surface-mid)]"
                  aria-label="Filtros"
                >
                  <SlidersHorizontal className="h-4 w-4" strokeWidth={1.8} />
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-6 lg:px-10 lg:py-10">
          <div className="space-y-10 lg:space-y-12">
            <section>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
                {visibleSummaryCards.map((item) => (
                  <SummaryCard key={item.label} item={item} />
                ))}
              </div>
            </section>

            <section>
              <h3 className={`mb-6 text-lg italic text-[rgba(49,51,44,0.82)] ${notoSerif.className}`}>
                Status de Operação
              </h3>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                {visibleOperationCards.map((item) => (
                  <StatusCard key={item.label} item={item} />
                ))}
              </div>
            </section>

            <section className="grid grid-cols-1 gap-10 lg:grid-cols-12">
              <div className="space-y-6 lg:col-span-5">
                <div className="flex items-end justify-between gap-4">
                  <h4 className={`text-lg italic text-[rgba(49,51,44,0.82)] ${notoSerif.className}`}>
                    Alertas Operacionais
                  </h4>
                  <Link
                    href="/adm/operacao/pedidos-criticos"
                    className="border-b border-transparent pb-1 text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--exec-text-soft)] transition-colors hover:border-[var(--exec-primary)] hover:text-[var(--exec-primary)]"
                  >
                    Ver todos
                  </Link>
                </div>

                <div className={`${cardClass} overflow-hidden`}>
                  <div className="divide-y divide-[rgba(177,179,169,0.1)]">
                    {visibleAlerts.map((item) => (
                      <AlertRow key={item.title} item={item} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6 lg:col-span-7">
                <div className="flex items-end justify-between gap-4">
                  <h4 className={`text-lg italic text-[rgba(49,51,44,0.82)] ${notoSerif.className}`}>
                    Evolução de Performance
                  </h4>
                  <div className="flex gap-4">
                    <span className="flex items-center gap-2 text-[10px] font-bold text-[rgba(94,96,88,0.48)]">
                      <span className="h-2 w-2 rounded-full bg-[var(--exec-primary)]" />
                      GMV
                    </span>
                    <span className="flex items-center gap-2 text-[10px] font-bold text-[rgba(94,96,88,0.48)]">
                      <span className="h-2 w-2 rounded-full bg-[#b1b3a9]" />
                      PEDIDOS
                    </span>
                  </div>
                </div>

                <div className={`${cardClass} relative flex h-[360px] flex-col justify-between p-8`}>
                  <div className="pointer-events-none absolute inset-x-8 bottom-16 top-16 opacity-30">
                    <svg className="h-full w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 640 220">
                      <path
                        d="M0,180 Q80,160 160,190 T320,120 T480,80 T640,40"
                        fill="none"
                        stroke="#5f5e5e"
                        strokeWidth="2.5"
                      />
                      <path
                        d="M0,200 Q80,190 160,210 T320,180 T480,160 T640,130"
                        fill="none"
                        stroke="#b1b3a9"
                        strokeDasharray="4"
                        strokeWidth="1.5"
                      />
                    </svg>
                  </div>

                  <div className="relative z-10 flex h-full flex-col justify-between">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className={`text-2xl font-light text-[var(--exec-text)] ${notoSerif.className}`}>
                          Crescimento Sustentado
                        </p>
                        <p className="mt-1 text-xs text-[var(--exec-text-muted)]">
                          Análise de volume transacional de Janeiro
                        </p>
                      </div>

                      <button
                        type="button"
                        className="w-fit rounded-full bg-[var(--exec-surface-low)] px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--exec-text)] transition-colors hover:bg-[var(--exec-surface-mid)]"
                      >
                        Download PDF
                      </button>
                    </div>

                    <div className="flex justify-between border-t border-[rgba(177,179,169,0.1)] pt-8 text-[10px] font-bold uppercase tracking-[0.24em] text-[rgba(94,96,88,0.5)]">
                      <span>01 Jan</span>
                      <span>07 Jan</span>
                      <span>14 Jan</span>
                      <span>21 Jan</span>
                      <span>28 Jan</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {visibleInsightCards.map((item) => (
                    <InsightCard
                      key={item.label}
                      label={item.label}
                      value={item.value}
                      detail={item.detail}
                      detailTone={item.detailTone}
                    />
                  ))}
                </div>
              </div>
            </section>

            <footer className="flex flex-col gap-4 border-t border-[rgba(177,179,169,0.1)] pb-6 pt-12 md:flex-row md:items-center md:justify-between">
              <p className="text-[10px] uppercase tracking-[0.24em] text-[rgba(94,96,88,0.5)]">
                © 2026 BelaPop Ecosystem • Privacy &amp; Control
              </p>
              <div className="flex flex-wrap gap-6">
                <Link
                  href="/adm/gestao/relatorios"
                  className="text-[10px] uppercase tracking-[0.24em] text-[rgba(94,96,88,0.5)] transition-colors hover:text-[var(--exec-text)]"
                >
                  Documentação API
                </Link>
                <Link
                  href="/adm/financeiro/auditoria"
                  className="text-[10px] uppercase tracking-[0.24em] text-[rgba(94,96,88,0.5)] transition-colors hover:text-[var(--exec-text)]"
                >
                  Segurança
                </Link>
              </div>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}
