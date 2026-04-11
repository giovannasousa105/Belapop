import Image from "next/image";
import Link from "next/link";
import { Noto_Serif } from "next/font/google";
import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Package2,
  Settings,
  ShieldAlert,
  Truck,
  Undo2
} from "lucide-react";

import { qualityRepository } from "@/lib/adm/repositories";
import { getAdmDataSource } from "@/lib/adm/repositories/source";
import type { QualityScoreListItem } from "@/lib/adm/repositories/qualityRepository";
import type { AdmFilters, SearchParamsInput } from "@/lib/adm/url";

const notoSerif = Noto_Serif({
  subsets: ["latin"],
  weight: ["400", "600", "700"]
});

const monitoringTheme = {
  "--monitoring-bg": "#fbf9f4",
  "--monitoring-surface": "#ffffff",
  "--monitoring-surface-low": "#f5f4ed",
  "--monitoring-surface-soft": "#efeee6",
  "--monitoring-text": "#31332c",
  "--monitoring-text-soft": "#5e6058",
  "--monitoring-primary": "#5f5e5e",
  "--monitoring-secondary": "#6e5b4d",
  "--monitoring-tertiary": "#a23d3e",
  "--monitoring-outline": "#797c73",
  "--monitoring-border": "rgba(177, 179, 169, 0.15)",
  "--monitoring-shadow": "0 20px 40px rgba(49, 51, 44, 0.03)"
} as CSSProperties;

type CurationMonitoringPageProps = {
  filters: AdmFilters;
  searchParamsSource: SearchParamsInput;
};

type SidebarItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  active?: boolean;
};

type SummaryCard = {
  label: string;
  value: string;
  detail: string;
  pill?: {
    label: string;
    tone: "critical" | "watch";
  };
  icon?: LucideIcon;
};

type MonitoringRow = {
  id: string;
  entityLabel: string;
  entityMeta: string;
  category: string;
  previousScore: string;
  currentScore: string;
  trend: "down" | "stable";
  reason: string;
  reviewedAt: string;
  imageSrc: string;
  imageAlt: string;
  reviewHref: string;
  secondaryHref: string;
  secondaryLabel: string;
};

const sidebarItems: SidebarItem[] = [
  { label: "Dashboard", href: "/adm/dashboard-executivo", icon: LayoutDashboard },
  { label: "Sellers em Risco", href: "/adm/curadoria/monitoramento", icon: ShieldAlert, active: true },
  { label: "Produtos", href: "/adm/curadoria/produtos", icon: Package2 },
  { label: "Logistica", href: "/adm/operacao/logistica", icon: Truck },
  { label: "Devolucoes", href: "/adm/financeiro/reembolsos", icon: Undo2 }
];

const periodLabelMap: Record<string, string> = {
  "7d": "Ultimos 7 dias",
  "30d": "Ultimos 30 dias",
  "90d": "Ultimos 90 dias"
};

const riskLabelMap: Record<string, string> = {
  high: "Alto Risco",
  watch: "Monitorando",
  all: "Todos"
};

const entityPreviewImages = {
  productWatch:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBJjcJdha_Ojq7N1bpTh21HvJslmS-WAl1xMB7OadHz9vyxvLxzdE0z0bdzPgp0kjDu83PyIXTis5x6Jxec97PlGF7If1un-xd5xY7w8xNEB9Qk9if1hmM43qU8qqkv5xCG8RlgDieWCUySbpOrZhRsMOONvuIUhENkfJ5jtVq3CSMCpuWzh8kcKeIHhbvC9ZGmx9QMQDER-yNva4Z9_hB6lJ3vqaGDbSxSrK29XX7RQbGRO9ATxgvxLqaZEry6lEPvmN9HZkAHzS7l",
  sellerStudio:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCqM3lYxfPKp3XR35RjdP-cMRJ4s8KQbnVRU-acayzZtWODF0k_ssyzMc5pXVDS91c58yvkHUrjaxCGZBAXtTaBHfzcfD6RoYNT_h7Z3kFPyzXpaOwAhnhEPfYcH8JNIPcQEFsARbFkeBllxDrYZLiOGoC9T9fALDuaQocri6qnIa9SrwEszp0yCNXnEwqM5w_cadXCkO6U0CFadCkLD3Jj0XGyV83FoAqbdOt0aiZNjaPHuATVNa-dMYW4ac4sYPuzouciZM6Enf4U",
  productCeramic:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBegnDPDMJeiCdit7X_c3O7fmSa2RxY94AdfNnwIIrkMMwFIJlmNgRiPwxnIaSXy1G1v-kU_IAV0AuclYvEgIvRP8-EtIiyCfzNeZz-m3kqKQZu04WDRKOGi4yZdkBNTNXZeuG0iicuylh-1jVaAazw0YoC6TWV7YQDejQa9KvP7O9Upwbg77lhqjL6eQHFoJCDYu5Yx1a4f1NwrZbV7sZobSd_kTCbKphE4L5MwDvsxfkouCFmZU95VqB3KXsawKWFUhEidM1i89DO",
  avatar:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuD0ROAVx3Wxiz6hrCIiioEX05scT1IVaDQ1sIkKGAH4naSeVdaDzkm0ZeExBtszzOuThL0auyA1uQXxBefOnXkCf_UcHTo5WGTaf4zfPsvAQueCkC-h4p3mg1GV6p8GHK2PYyeFL5-Ny12JrFZ4dI4M5lyF_U9CbYUM5M5s2Raf3UJ1uY5VWpEAqzdCQuEOkobQgggRnSFobkECpPHJJ2n_WH5jZOKhROQ-uhLjspxriY_eDor1N-V9MfX6zjvWFG8kxFwAvcT5G6CV"
};

function SidebarLink({ item }: { item: SidebarItem }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 py-2 text-sm transition-all ${
        item.active
          ? "translate-x-1 border-l-2 border-neutral-900 pl-4 font-bold text-neutral-900"
          : "pl-4 text-neutral-500 hover:bg-white/50 hover:text-neutral-900"
      }`}
    >
      <Icon className="h-[18px] w-[18px]" strokeWidth={1.7} />
      <span>{item.label}</span>
    </Link>
  );
}

function SummaryCardView({ card }: { card: SummaryCard }) {
  const Icon = card.icon;

  return (
    <article className="flex h-48 flex-col justify-between rounded-xl border border-transparent bg-[var(--monitoring-surface)] p-8 transition-colors hover:border-[rgba(177,179,169,0.1)]">
      <div className="flex items-start justify-between gap-3">
        <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--monitoring-outline)]">
          {card.label}
        </span>
        {card.pill ? (
          <span
            className={`rounded-full px-2 py-1 text-[10px] font-medium ${
              card.pill.tone === "critical"
                ? "bg-[rgba(255,132,130,0.1)] text-[var(--monitoring-tertiary)]"
                : "bg-[rgba(248,222,204,0.3)] text-[#604e41]"
            }`}
          >
            {card.pill.label}
          </span>
        ) : Icon ? (
          <Icon className="h-4 w-4 text-[var(--monitoring-primary)]" strokeWidth={1.7} />
        ) : null}
      </div>

      <div>
        <div className={`${notoSerif.className} text-3xl font-bold text-[var(--monitoring-text)]`}>
          {card.value}
        </div>
        <p className="mt-1 text-sm text-[var(--monitoring-text-soft)]">{card.detail}</p>
      </div>
    </article>
  );
}

function formatScore(value: number) {
  return (value / 20).toFixed(1);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "America/Sao_Paulo"
  })
    .format(new Date(value))
    .replace(".", "");
}

function matchesPeriod(dateValue: string, period?: string) {
  if (!period || !periodLabelMap[period]) return true;

  const maxDays = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  const date = new Date(dateValue);
  const now = new Date();
  const diff = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
  return diff <= maxDays;
}

function matchesRisk(score: QualityScoreListItem, risk?: string) {
  if (!risk || risk === "all") return true;
  if (risk === "high") return score.status === "critico" || score.status === "alerta" || score.trend === "down";
  if (risk === "watch") return score.status === "em-revisao" || score.status === "pendente" || score.trend !== "up";
  return true;
}

export async function CurationMonitoringPage({
  filters,
  searchParamsSource
}: CurationMonitoringPageProps) {
  const [qualityListResult, criticalProducts, dataSource] = await Promise.all([
    qualityRepository.listQualityScores({
      page: 1,
      pageSize: 50,
      sortBy: "score",
      sortDir: "asc"
    }),
    qualityRepository.listCriticalProducts(12),
    getAdmDataSource()
  ]);

  const qualityRows = qualityListResult.success ? qualityListResult.data.items : [];
  const sellerMap = Object.fromEntries(dataSource.sellers.map((seller) => [seller.id, seller]));
  const statusByProductId = Object.fromEntries(
    dataSource.curationStatuses.map((status) => [status.productId, status])
  );
  const reviewByProductId = Object.fromEntries(
    dataSource.reviews
      .filter((review) => review.sentiment === "negativo" || review.status === "critico")
      .map((review) => [review.productId, review])
  );
  const incidentBySellerId = Object.fromEntries(
    dataSource.logisticsIncidents.map((incident) => [incident.sellerId, incident])
  );
  const refundByOrderId = Object.fromEntries(dataSource.refunds.map((refund) => [refund.orderId, refund]));
  const orderByProductId = Object.fromEntries(dataSource.orders.map((order) => [order.productId, order]));
  const documentBySellerId = Object.fromEntries(
    dataSource.documents
      .filter((document) => document.status !== "aprovado")
      .map((document) => [document.sellerId, document])
  );

  void searchParamsSource;
  const effectivePeriod = filters.period ?? "30d";
  const effectiveRisk = filters.risk ?? "high";

  const filteredScores = qualityRows
    .filter((row) => (filters.seller ? row.sellerId === filters.seller : true))
    .filter((row) => matchesRisk(row, effectiveRisk))
    .filter((row) => matchesPeriod(row.updatedAt, effectivePeriod));

  const downSellers = filteredScores.filter((row) => row.trend === "down");
  const totalGmv = dataSource.sellers.reduce((sum, seller) => sum + seller.gmv30d, 0);
  const atRiskGmv = downSellers.reduce(
    (sum, row) => sum + (sellerMap[row.sellerId]?.gmv30d ?? 0),
    0
  );
  const gmvImpactPct = totalGmv > 0 ? ((atRiskGmv / totalGmv) * 100).toFixed(1) : "0.0";

  const operationalProducts = criticalProducts.filter((product) => {
    const order = orderByProductId[product.id];
    const incident = incidentBySellerId[product.sellerId];
    const refund = order ? refundByOrderId[order.id] : undefined;
    return Boolean(incident || refund || product.status === "critico");
  });

  const unresolvedRefunds = dataSource.refunds.filter((refund) => refund.status !== "resolvido");
  const returnPressurePct = dataSource.orders.length
    ? ((unresolvedRefunds.length / dataSource.orders.length) * 100).toFixed(1)
    : "0.0";
  const mainRefundReason = unresolvedRefunds[0]?.reason ?? "Diferenca no anuncio";

  const sellersBySeverity = [...filteredScores].sort((left, right) => left.score - right.score);
  const primarySeller = sellersBySeverity[0];
  const primaryProduct = criticalProducts.find((product) => product.sellerId === primarySeller?.sellerId) ?? criticalProducts[0];
  const secondarySeller = sellersBySeverity[1] ?? primarySeller;
  const tertiaryProduct =
    criticalProducts.find((product) => product.id !== primaryProduct?.id && product.sellerId !== secondarySeller?.sellerId) ??
    criticalProducts.find((product) => product.id !== primaryProduct?.id) ??
    criticalProducts[1];

  const monitoringRows: MonitoringRow[] = [
    primaryProduct
      ? (() => {
          const sellerScore = qualityRows.find((row) => row.sellerId === primaryProduct.sellerId);
          const status = statusByProductId[primaryProduct.id];
          const review = reviewByProductId[primaryProduct.id];
          const order = orderByProductId[primaryProduct.id];
          const refund = order ? refundByOrderId[order.id] : undefined;
          const current = Number(formatScore(primaryProduct.qualityScore));
          const previous = Math.min(5, current + (sellerScore?.trend === "down" ? 0.8 : 0.4)).toFixed(1);

          return {
            id: primaryProduct.id,
            entityLabel: primaryProduct.name,
            entityMeta: `SKU: ${primaryProduct.id.toUpperCase()}`,
            category: primaryProduct.category,
            previousScore: previous,
            currentScore: current.toFixed(1),
            trend: "down" as const,
            reason:
              status?.reason ??
              refund?.reason ??
              review?.excerpt ??
              "Reclamacoes recorrentes em auditoria editorial",
            reviewedAt: status?.updatedAt ?? sellerScore?.updatedAt ?? new Date().toISOString(),
            imageSrc: entityPreviewImages.productWatch,
            imageAlt:
              "minimalist studio product shot of a sleek designer watch on a stone surface with soft ambient lighting",
            reviewHref: `/adm/curadoria/produtos?product=${primaryProduct.id}&status=${primaryProduct.curationStatus}`,
            secondaryHref: `/adm/operacao/parceiros?seller=${primaryProduct.sellerId}`,
            secondaryLabel: "Suspender"
          };
        })()
      : null,
    secondarySeller
      ? (() => {
          const seller = sellerMap[secondarySeller.sellerId];
          const incident = incidentBySellerId[secondarySeller.sellerId];
          const document = documentBySellerId[secondarySeller.sellerId];
          const current = Number(formatScore(secondarySeller.score));
          const previous = Math.min(5, current + 0.4).toFixed(1);

          return {
            id: secondarySeller.id,
            entityLabel: seller?.name ?? secondarySeller.sellerName,
            entityMeta: `Seller ID: ${secondarySeller.sellerId.toUpperCase()}`,
            category: seller?.category ?? "Seller",
            previousScore: previous,
            currentScore: current.toFixed(1),
            trend: "stable" as const,
            reason: incident?.type ?? document?.type ?? "Atraso logistico sistemico",
            reviewedAt: incident?.openedAt ?? document?.dueDate ?? secondarySeller.updatedAt,
            imageSrc: entityPreviewImages.sellerStudio,
            imageAlt:
              "lifestyle portrait of a craftsman in a well-organized studio workspace with neutral tones and soft lighting",
            reviewHref: `/adm/operacao/parceiros?seller=${secondarySeller.sellerId}`,
            secondaryHref: `/adm/catalogo-marca/campanhas?seller=${secondarySeller.sellerId}`,
            secondaryLabel: "Rebaixar"
          };
        })()
      : null,
    tertiaryProduct
      ? (() => {
          const sellerScore = qualityRows.find((row) => row.sellerId === tertiaryProduct.sellerId);
          const status = statusByProductId[tertiaryProduct.id];
          const incident = incidentBySellerId[tertiaryProduct.sellerId];
          const current = Number(formatScore(tertiaryProduct.qualityScore));
          const previous = Math.min(5, current + 0.5).toFixed(1);

          return {
            id: tertiaryProduct.id,
            entityLabel: tertiaryProduct.name,
            entityMeta: `SKU: ${tertiaryProduct.id.toUpperCase()}`,
            category: tertiaryProduct.category,
            previousScore: previous,
            currentScore: current.toFixed(1),
            trend: "down" as const,
            reason:
              status?.reason ??
              incident?.summary ??
              "Taxa de quebra em transito acima do limite",
            reviewedAt: status?.updatedAt ?? sellerScore?.updatedAt ?? new Date().toISOString(),
            imageSrc: entityPreviewImages.productCeramic,
            imageAlt:
              "sculptural ceramic vase on a minimalist wooden pedestal with dramatic soft shadows and neutral palette",
            reviewHref: `/adm/curadoria/produtos?product=${tertiaryProduct.id}&status=${tertiaryProduct.curationStatus}`,
            secondaryHref: `/adm/catalogo-marca/campanhas?product=${tertiaryProduct.id}`,
            secondaryLabel: "Rebaixar"
          };
        })()
      : null
  ].filter(Boolean) as MonitoringRow[];

  const summaryCards: SummaryCard[] = [
    {
      label: "Queda de Score",
      value: `${String(downSellers.length).padStart(2, "0")} Sellers`,
      detail: `Impacto estimado em ${gmvImpactPct}% do GMV`,
      pill: { label: "Alerta Critico", tone: "critical" }
    },
    {
      label: "Piora Operacional",
      value: `${String(operationalProducts.length).padStart(2, "0")} Produtos`,
      detail: `${dataSource.logisticsIncidents.length} incidentes ativos em logistica`,
      icon: AlertTriangle
    },
    {
      label: "Aumento de Devolucoes",
      value: `+${returnPressurePct}%`,
      detail: `Principal motivo: "${mainRefundReason}"`,
      pill: { label: "Monitorando", tone: "watch" }
    }
  ];

  const currentPeriodLabel = periodLabelMap[effectivePeriod] ?? "Ultimos 30 dias";
  const currentRiskLabel = riskLabelMap[effectiveRisk] ?? "Alto Risco";
  const totalItems = filteredScores.length || monitoringRows.length;

  return (
    <div
      className="flex min-h-screen overflow-hidden bg-[var(--monitoring-bg)] text-[var(--monitoring-text)]"
      style={monitoringTheme}
    >
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-[var(--monitoring-surface-low)] px-6 py-10 md:flex">
        <div className="mb-8 flex flex-col space-y-1">
          <span className={`${notoSerif.className} text-xl italic text-[var(--monitoring-primary)]`}>
            Qualidade
          </span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--monitoring-outline)]">
            Monitoramento Premium
          </span>
        </div>

        <nav className="flex flex-1 flex-col space-y-4">
          {sidebarItems.map((item) => (
            <SidebarLink key={item.href} item={item} />
          ))}
        </nav>

        <div className="mt-8 flex flex-col space-y-4 border-t border-[var(--monitoring-border)] pt-8">
          <button
            type="button"
            className="rounded-xl bg-[var(--monitoring-primary)] px-4 py-3 text-xs font-medium tracking-wide text-white shadow-sm transition-opacity hover:opacity-90"
          >
            Gerar Relatorio Anual
          </button>

          <Link
            href="/adm/gestao/configuracoes"
            className="flex items-center gap-3 py-2 pl-4 text-sm text-neutral-500 transition-colors hover:bg-white/50 hover:text-neutral-900"
          >
            <Settings className="h-[18px] w-[18px]" strokeWidth={1.7} />
            <span>Suporte</span>
          </Link>

          <Link
            href="/adm/login"
            className="flex items-center gap-3 py-2 pl-4 text-sm text-neutral-500 transition-colors hover:bg-white/50 hover:text-neutral-900"
          >
            <LogOut className="h-[18px] w-[18px]" strokeWidth={1.7} />
            <span>Sair</span>
          </Link>
        </div>
      </aside>

      <main className="flex h-screen min-h-screen flex-1 flex-col overflow-y-auto md:ml-64">
        <header className="sticky top-0 z-30 flex items-center justify-between bg-stone-50/80 px-6 py-6 backdrop-blur-xl sm:px-10 xl:px-12">
          <div className="flex flex-col">
            <span className="text-lg font-semibold tracking-[-0.02em] text-neutral-900">
              The Editorial Curator
            </span>
          </div>

          <div className="flex items-center gap-8">
            <nav className="hidden items-center gap-8 font-[Noto_Serif] text-sm tracking-tight lg:flex">
              <Link href="/adm/curadoria/monitoramento" className="border-b border-neutral-900 pb-1 text-neutral-900">
                Visao Geral
              </Link>
              <Link href="/adm/gestao/relatorios" className="text-neutral-500 transition-colors hover:text-neutral-900">
                Relatorios
              </Link>
              <Link href="/adm/financeiro/risco" className="text-neutral-500 transition-colors hover:text-neutral-900">
                Alertas
              </Link>
            </nav>

            <div className="flex items-center gap-5 text-neutral-800">
              <Bell className="h-5 w-5 cursor-pointer transition-opacity hover:opacity-60" strokeWidth={1.7} />
              <Settings className="h-5 w-5 cursor-pointer transition-opacity hover:opacity-60" strokeWidth={1.7} />
              <div className="relative h-8 w-8 overflow-hidden rounded-full">
                <Image
                  src={entityPreviewImages.avatar}
                  alt="Avatar do curador"
                  fill
                  sizes="32px"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </header>

        <div className="space-y-12 p-6 sm:p-10 xl:p-12">
          <section className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="space-y-2">
              <h1 className={`${notoSerif.className} text-4xl font-bold tracking-[-0.02em] lg:text-5xl`}>
                Monitoramento de Qualidade
              </h1>
              <p className="font-light text-[var(--monitoring-text-soft)]">
                Auditoria continua de performance para o ecossistema BelaPop.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3 rounded-xl border border-[var(--monitoring-border)] bg-[var(--monitoring-surface)] px-4 py-2">
                <CalendarDays className="h-4 w-4 text-[var(--monitoring-outline)]" strokeWidth={1.7} />
                <span className="text-xs font-medium text-[var(--monitoring-primary)]">{currentPeriodLabel}</span>
                <ChevronDown className="h-4 w-4 text-[var(--monitoring-outline)]" strokeWidth={1.7} />
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-[var(--monitoring-border)] bg-[var(--monitoring-surface)] px-4 py-2">
                <ShieldAlert className="h-4 w-4 text-[var(--monitoring-outline)]" strokeWidth={1.7} />
                <span className="text-xs font-medium text-[var(--monitoring-primary)]">{currentRiskLabel}</span>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {summaryCards.map((card) => (
              <SummaryCardView key={card.label} card={card} />
            ))}
          </section>

          <section className="space-y-6">
            <h2 className={`${notoSerif.className} text-2xl font-bold text-[var(--monitoring-text)]`}>
              Auditoria de Qualidade
            </h2>

            <div className="overflow-hidden rounded-xl border border-[rgba(177,179,169,0.1)] bg-[var(--monitoring-surface)]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[var(--monitoring-surface-soft)] text-[10px] uppercase tracking-[0.15em] text-[var(--monitoring-outline)]">
                      <th className="px-8 py-6 font-medium">Entidade</th>
                      <th className="px-8 py-6 font-medium">Categoria</th>
                      <th className="px-8 py-6 text-center font-medium">Score Anterior</th>
                      <th className="px-8 py-6 text-center font-medium">Score Atual</th>
                      <th className="px-8 py-6 font-medium">Motivo do Alerta</th>
                      <th className="px-8 py-6 font-medium">Ultima Revisao</th>
                      <th className="px-8 py-6 text-right font-medium">Acoes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--monitoring-surface-soft)]">
                    {monitoringRows.map((row) => (
                      <tr key={row.id} className="group transition-colors hover:bg-[var(--monitoring-surface-low)]">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-[var(--monitoring-surface-soft)]">
                              <Image
                                src={row.imageSrc}
                                alt={row.imageAlt}
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-[var(--monitoring-text)]">
                                {row.entityLabel}
                              </div>
                              <div className="text-[10px] text-[var(--monitoring-outline)]">
                                {row.entityMeta}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-xs text-[var(--monitoring-text-soft)]">{row.category}</span>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <span className="text-xs font-medium text-[var(--monitoring-outline)]">
                            {row.previousScore}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span
                              className={`text-sm font-bold ${
                                row.trend === "down"
                                  ? "text-[var(--monitoring-tertiary)]"
                                  : "text-[var(--monitoring-text)]"
                              }`}
                            >
                              {row.currentScore}
                            </span>
                            {row.trend === "down" ? (
                              <AlertTriangle className="h-4 w-4 text-[var(--monitoring-tertiary)]" strokeWidth={1.7} />
                            ) : (
                              <ShieldAlert className="h-4 w-4 text-[var(--monitoring-outline)]" strokeWidth={1.7} />
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-xs text-[var(--monitoring-text-soft)]">{row.reason}</span>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-xs text-[var(--monitoring-outline)]">
                            {formatDate(row.reviewedAt)}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-3 opacity-0 transition-opacity group-hover:opacity-100">
                            <Link
                              href={row.reviewHref}
                              className="border-b border-[rgba(95,94,94,0.2)] pb-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--monitoring-primary)] hover:border-[var(--monitoring-primary)]"
                            >
                              Revisar
                            </Link>
                            <Link
                              href={row.secondaryHref}
                              className={`border-b pb-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                row.secondaryLabel === "Suspender"
                                  ? "border-[rgba(162,61,62,0.2)] text-[var(--monitoring-tertiary)] hover:border-[var(--monitoring-tertiary)]"
                                  : "border-[rgba(110,91,77,0.2)] text-[var(--monitoring-secondary)] hover:border-[var(--monitoring-secondary)]"
                              }`}
                            >
                              {row.secondaryLabel}
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-light text-[var(--monitoring-outline)]">
                  Exibindo {monitoringRows.length} de {totalItems} itens monitorados
                </p>

                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    className="rounded-lg border border-[var(--monitoring-border)] p-2 transition-colors hover:bg-[var(--monitoring-surface-soft)]"
                    aria-label="Pagina anterior"
                  >
                    <ChevronLeft className="h-4 w-4" strokeWidth={1.7} />
                  </button>
                  <span className="text-xs font-medium">Pagina 1 de 1</span>
                  <button
                    type="button"
                    className="rounded-lg border border-[var(--monitoring-border)] p-2 transition-colors hover:bg-[var(--monitoring-surface-soft)]"
                    aria-label="Proxima pagina"
                  >
                    <ChevronRight className="h-4 w-4" strokeWidth={1.7} />
                  </button>
                </div>
              </div>
            </div>
          </section>

          <footer className="border-t border-[rgba(177,179,169,0.1)] pt-12">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-[var(--monitoring-outline)]">
                  BelaPop Premium Quality Intelligence
                </p>
                <p className="text-xs font-light text-[var(--monitoring-text-soft)]">
                  Ultima atualizacao do algoritmo: 14 de Novembro as 04:30 AM.
                </p>
              </div>

              <div className="flex items-center gap-8">
                <div className="flex flex-col items-start md:items-end">
                  <span className="text-[10px] uppercase tracking-widest text-[var(--monitoring-outline)]">
                    Status do Sistema
                  </span>
                  <span className="flex items-center gap-2 text-xs font-medium text-[var(--monitoring-text)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Operando em conformidade
                  </span>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
