"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  BadgeCheck,
  Bell,
  ReceiptText,
  ShieldAlert,
  SlidersHorizontal,
  Truck,
  Undo2,
  UserPlus,
  UserX,
  Wallet,
  Wand2,
} from "lucide-react";

import { FinanceSidebar } from "@/components/admin/financeiro/FinanceSidebar";
import { KpiCard } from "@/components/admin/dashboard/KpiCard";
import { StatusStrip } from "@/components/admin/dashboard/StatusStrip";
import { AlertFeed } from "@/components/admin/dashboard/AlertFeed";
import { PerformanceChart } from "@/components/admin/dashboard/PerformanceChart";
import { PeriodSelector } from "@/components/admin/dashboard/PeriodSelector";
import { MiniMetricCard } from "@/components/admin/dashboard/MiniMetricCard";
import type { AlertSeverity, AlertFeedItem } from "@/components/admin/dashboard/AlertFeed";
import type { ChartDataPoint } from "@/components/admin/dashboard/PerformanceChart";
import type { Period } from "@/components/admin/dashboard/PeriodSelector";
import { translateAlert } from "@/lib/alerts/translations";

const dashboardTheme = {
  "--color-bg-primary":    "#FAFAF8",
  "--color-bg-secondary":  "#F4F1ED",
  "--color-bg-card":       "#FFFFFF",
  "--color-accent-primary":   "#8B5E3C",
  "--color-accent-secondary": "#C9956A",
  "--color-text-primary":   "#1A1714",
  "--color-text-secondary": "#6B5E54",
  "--color-text-muted":     "#9E9589",
  "--color-border-subtle":  "rgba(139,94,60,0.07)",
  "--color-border-default": "rgba(139,94,60,0.14)",
} as CSSProperties;

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

export type MetricCardItem = {
  label: string;
  value: string;
  detail: string;
  tone: "positive" | "neutral" | "muted";
  href?: string;
  variant?: "default" | "warning" | "critical" | "success";
};

export type StatusCardItem = {
  label: string;
  value: string;
  iconKey: ExecutiveDashboardIconKey;
  accent?: "danger";
  href?: string;
};

export type AlertItem = {
  title: string;
  description: string;
  time: string;
  iconKey: ExecutiveDashboardIconKey;
  tone?: "danger" | "neutral";
};

export type InsightCardItem = {
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
  chartData?: ChartDataPoint[];
};

const fallbackSummaryCards: MetricCardItem[] = [
  { label: "GMV Mensal", value: "R$ 1.250.000", detail: "+12.4% vs mês ant.", tone: "positive" },
  { label: "Pedidos Diários", value: "432", detail: "Estável", tone: "neutral" },
  { label: "Sellers Ativos", value: "128", detail: "5 novos hoje", tone: "positive" },
  { label: "SKUs Ativos", value: "8.420", detail: "Últ. sinc: 2 min", tone: "muted" },
];

const fallbackOperationCards: StatusCardItem[] = [
  { label: "Curadoria Pendente", value: "56 itens", iconKey: "wand2", href: "/adm/curadoria/produtos?status=pendente" },
  { label: "Sellers Pendentes", value: "12 contas", iconKey: "user-plus", href: "/adm/operacao/parceiros" },
  { label: "Taxa de Aprovação", value: "94.2%", iconKey: "badge-check" },
  { label: "Pedidos em Risco", value: "8 críticos", iconKey: "alert-triangle", accent: "danger", href: "/adm/operacao/pedidos-criticos?priority=critica" },
];

const fallbackAlerts: AlertItem[] = [
  { title: "Atraso sem movimentação", description: "4 transportadoras reportaram instabilidade na malha sudeste.", time: "há 3h", iconKey: "truck" },
  { title: "Risco de chargeback", description: "Pico de contestações identificado na categoria Perfumaria.", time: "há 5h", iconKey: "wallet", tone: "danger" },
  { title: "Reembolso em análise", description: "Aumento de 3% em pedidos devolvidos por avaria física.", time: "ontem", iconKey: "undo2" },
  { title: "Plantão sem responsável", description: "Nenhum operador designado para o plantão de hoje.", time: "ontem", iconKey: "user-x", tone: "neutral" },
];

const fallbackInsightCards: InsightCardItem[] = [
  { label: "Ticket Médio", value: "R$ 289,30", detail: "+R$ 14,00", detailTone: "positive" },
  { label: "Churn de Sellers", value: "1.2%", detail: "-0.4%", detailTone: "muted" },
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
  wand2: Wand2,
};

const toneToVariant: Record<MetricCardItem["tone"], "default" | "success" | "warning" | "critical"> = {
  positive: "success",
  neutral: "default",
  muted: "default",
};

const iconBgDanger = "bg-[#FEE2E2] text-[#EF4444]";
const iconBgDefault = "bg-[rgba(139,94,60,0.08)] text-[#8B5E3C]";

const iconKeyToPrefix: Record<ExecutiveDashboardIconKey, string> = {
  wallet: "FIN",
  truck: "LOG",
  "shield-alert": "DOC",
  undo2: "RFD",
  "user-x": "CRM",
  "user-plus": "CRM",
  "alert-triangle": "OPS",
  "badge-check": "OPS",
  wand2: "CUR",
};

export function ExecutiveDashboardPage({
  summaryCards: summaryCardsProp,
  operationCards: operationCardsProp,
  alerts: alertsProp,
  insightCards: insightCardsProp,
  chartData,
}: ExecutiveDashboardPageProps) {
  const [period, setPeriod] = useState<Period>("30d");
  const [exporting, setExporting] = useState(false);

  const visibleSummaryCards = summaryCardsProp ?? fallbackSummaryCards;
  const visibleOperationCards = operationCardsProp ?? fallbackOperationCards;
  const visibleAlerts = alertsProp ?? fallbackAlerts;
  const visibleInsightCards = insightCardsProp ?? fallbackInsightCards;

  const handleExport = () => {
    if (exporting) return;
    setExporting(true);
    try {
      const summaryRows = visibleSummaryCards.map((card) => [card.label, card.value, card.detail]);
      const chartRows = (chartData ?? []).map((point) => [point.date, String(point.gmv), String(point.orders)]);
      const csv = [
        ["Métrica", "Valor", "Detalhe"],
        ...summaryRows,
        [],
        ["Data", "GMV", "Pedidos"],
        ...chartRows,
      ]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";"))
        .join("\n");

      const blob = new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `belapop-dashboard-${new Date().toISOString().slice(0, 10)}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const alertFeedItems: AlertFeedItem[] = visibleAlerts.map((a, i) => {
    const prefix = iconKeyToPrefix[a.iconKey] ?? "ALT";
    const code = `${prefix}-${String(i + 1).padStart(3, "0")}`;
    const translation = translateAlert(a.title);

    return {
      id: String(i),
      code,
      title: translation.title,
      description: a.description !== a.title ? (translation.description !== a.title ? a.description : translation.description) : translation.description,
      action: translation.action,
      actionHref: translation.actionHref,
      severity: (a.tone === "danger" ? "critica" : "alta") as AlertSeverity,
      timestamp: a.time,
    };
  });

  const statusCells = visibleOperationCards.map((card) => {
    const Icon = executiveIcons[card.iconKey];
    const isDanger = card.accent === "danger";
    return {
      icon: <Icon className="h-4 w-4" strokeWidth={1.8} />,
      iconBg: isDanger ? iconBgDanger : iconBgDefault,
      label: card.label,
      value: card.value,
      href: card.href,
    };
  });

  const resolvedChartData: ChartDataPoint[] = chartData ?? [
    { date: "01-01", gmv: 38000, orders: 12 },
    { date: "01-08", gmv: 52000, orders: 18 },
    { date: "01-15", gmv: 61000, orders: 22 },
    { date: "01-22", gmv: 74000, orders: 27 },
    { date: "01-29", gmv: 89000, orders: 31 },
  ];

  // Determine best "Ver todos" href based on majority alert type
  const alertHref = visibleAlerts.some((a) => a.iconKey === "truck")
    ? "/adm/operacao/logistica/incidentes"
    : visibleAlerts.some((a) => a.iconKey === "wallet" || a.iconKey === "undo2")
      ? "/adm/financeiro"
      : "/adm/gestao/log-atividades";

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#1A1714]" style={dashboardTheme}>
      <FinanceSidebar activeHref="/adm/dashboard-executivo" />

      <div className="flex min-h-screen flex-col pl-[220px]">
        {/* Sticky header */}
        <header className="sticky top-0 z-20 border-b border-[rgba(139,94,60,0.10)] bg-[#FAFAF8]/90 backdrop-blur-xl">
          <div className="flex h-16 w-full items-center justify-between gap-4 px-8">
            <div className="flex min-w-0 items-center gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9E9589]">
                  Dashboard Executivo
                </p>
                <h1 className="whitespace-nowrap text-[22px] font-semibold leading-tight tracking-tight text-[#1A1714]">
                  Visão Geral da Operação
                </h1>
              </div>
              <div className="hidden md:block">
                <PeriodSelector value={period} onChange={setPeriod} />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <nav className="hidden items-center gap-5 md:flex">
                <Link
                  href="/adm/gestao/relatorios"
                  className="text-[12px] font-medium text-[#6B5E54] transition hover:text-[#1A1714]"
                >
                  Relatórios
                </Link>
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={exporting}
                  className="text-[12px] font-medium text-[#9E9589] transition hover:text-[#1A1714] disabled:opacity-50"
                >
                  {exporting ? "Exportando..." : "Exportar"}
                </button>
              </nav>
              <div className="hidden h-4 w-px bg-[rgba(139,94,60,0.14)] md:block" />
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-[#9E9589] transition hover:bg-[#F4F1ED] hover:text-[#1A1714]"
                aria-label="Notificações"
              >
                <Bell className="h-4 w-4" strokeWidth={1.8} />
              </button>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-[#9E9589] transition hover:bg-[#F4F1ED] hover:text-[#1A1714]"
                aria-label="Filtros"
              >
                <SlidersHorizontal className="h-4 w-4" strokeWidth={1.8} />
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 px-8 py-7">
          <div className="grid gap-6">
            {/* KPI cards — 4 uniformes */}
            <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
              {visibleSummaryCards.map((card) => (
                <KpiCard
                  key={card.label}
                  label={card.label}
                  value={card.value}
                  subtext={card.detail}
                  href={card.href}
                  variant={card.variant ?? toneToVariant[card.tone]}
                  trend={
                    card.tone === "positive"
                      ? { direction: "up", label: card.detail }
                      : card.tone === "neutral"
                        ? { direction: "neutral", label: "Estável" }
                        : undefined
                  }
                />
              ))}
            </section>

            {/* Status strip */}
            <section>
              <StatusStrip cells={statusCells} />
            </section>

            {/* Alerts + Chart */}
            <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <AlertFeed
                  title="Alertas Operacionais"
                  items={alertFeedItems}
                  href={alertHref}
                />
              </div>

              <div className="space-y-4 lg:col-span-7">
                <PerformanceChart
                  data={resolvedChartData}
                  insight="Volume transacional em crescimento sustentado no período."
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {visibleInsightCards.map((card, i) => (
                    <MiniMetricCard
                      key={card.label}
                      icon={
                        i === 0
                          ? <ReceiptText className="h-5 w-5" strokeWidth={1.8} />
                          : <ShieldAlert className="h-5 w-5" strokeWidth={1.8} />
                      }
                      label={card.label}
                      value={card.value}
                      subtext={card.detail}
                      progress={
                        card.label.toLowerCase().includes("aprovação")
                          ? parseFloat(card.value.replace(",", "."))
                          : undefined
                      }
                    />
                  ))}
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
