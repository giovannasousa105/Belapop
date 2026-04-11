import Image from "next/image";
import Link from "next/link";
import { Noto_Serif } from "next/font/google";
import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  HelpCircle,
  LayoutDashboard,
  Search,
  Settings,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  Store,
  Truck,
  UserRound,
  Wallet,
  Wand2
} from "lucide-react";

import { formatCurrency } from "@/lib/adm/format";
import { financeRepository } from "@/lib/adm/repositories";
import { getAdmDataSource } from "@/lib/adm/repositories/source";
import { toListQueryParams } from "@/lib/adm/url";
import type { AdmFilters, SearchParamsInput } from "@/lib/adm/url";

const notoSerif = Noto_Serif({
  subsets: ["latin"],
  weight: ["400", "700"]
});

const auditTheme = {
  "--audit-bg": "#fbf9f4",
  "--audit-sidebar": "#f5f4ed",
  "--audit-surface": "#ffffff",
  "--audit-surface-low": "#efeee6",
  "--audit-surface-highest": "#e2e3d9",
  "--audit-text": "#31332c",
  "--audit-text-soft": "#5e6058",
  "--audit-outline": "#797c73",
  "--audit-outline-variant": "#b1b3a9",
  "--audit-primary": "#5f5e5e",
  "--audit-secondary": "#6e5b4d",
  "--audit-tertiary": "#a23d3e",
  "--audit-shadow": "0 20px 40px rgba(49, 51, 44, 0.05)"
} as CSSProperties;

type AuditPageProps = {
  filters: AdmFilters;
  searchParamsSource: SearchParamsInput;
};

type SidebarItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  active?: boolean;
};

type AuditRecord = {
  id: string;
  status: string;
  statusTone: "warm" | "neutral";
  title: string;
  description: string;
  owner: string;
  age: string;
  impact: string;
  highlight?: boolean;
  highlightLabel?: string;
  investigateHref: string;
  correctHref: string;
  resolveHref: string;
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

const records: AuditRecord[] = [
  {
    id: "AUD-8821",
    status: "Em Investigação",
    statusTone: "warm",
    title: "Divergência entre pedido e pagamento",
    description:
      "Diferença de valor identificada entre o checkout do cliente e o gateway de pagamento. Possível falha na atualização de cache de preços durante a transação.",
    owner: "Helena M.",
    age: "Há 2 horas",
    impact: "- R$ 1.200,00",
    investigateHref: "/adm/financeiro",
    correctHref: "/adm/financeiro/reembolsos?status=pendente",
    resolveHref: "/adm/financeiro/repasses"
  },
  {
    id: "AUD-8819",
    status: "Pendente",
    statusTone: "neutral",
    title: "Erro de comissão",
    description:
      "Taxa de marketplace calculada incorretamente para seller de luxo \"Vogue Noir\". Contrato especial de 12% aplicado como 15%.",
    owner: "Arthur K.",
    age: "Há 5 horas",
    impact: "- R$ 450,00",
    investigateHref: "/adm/financeiro",
    correctHref: "/adm/financeiro/repasses?status=bloqueado",
    resolveHref: "/adm/financeiro/repasses"
  },
  {
    id: "AUD-8802",
    status: "Em Investigação",
    statusTone: "warm",
    title: "Duplicidade de repasse",
    description:
      "Sistema de pagamento automatizado gerou repasse duplicado para o pedido #99281. Necessário estorno manual junto ao parceiro bancário.",
    owner: "Marina L.",
    age: "Há 1 dia",
    impact: "- R$ 8.900,00",
    highlight: true,
    highlightLabel: "ALTO IMPACTO",
    investigateHref: "/adm/financeiro/repasses?status=bloqueado",
    correctHref: "/adm/financeiro/repasses?status=bloqueado",
    resolveHref: "/adm/financeiro/auditoria"
  },
  {
    id: "AUD-8750",
    status: "Pendente",
    statusTone: "neutral",
    title: "Pedido pago não enviado",
    description:
      "3 pedidos sinalizados com ausência de dados de envio após confirmação de pagamento (30 dias). Risco alto de chargeback e quebra de SLA.",
    owner: "Arthur K.",
    age: "Há 2 dias",
    impact: "- R$ 3.100,00",
    investigateHref: "/adm/operacao/pedidos-criticos",
    correctHref: "/adm/operacao/logistica/incidentes",
    resolveHref: "/adm/operacao/pedidos-criticos"
  },
  {
    id: "AUD-8742",
    status: "Em Investigação",
    statusTone: "warm",
    title: "Reembolso indevido",
    description:
      "Processamento automático de estorno para o pedido #11002 sem devolução do produto físico. Identificado possível falha no webhook da transportadora.",
    owner: "Helena M.",
    age: "Há 3 dias",
    impact: "- R$ 1.200,00",
    investigateHref: "/adm/financeiro/reembolsos?status=pendente",
    correctHref: "/adm/financeiro/reembolsos?status=pendente",
    resolveHref: "/adm/financeiro/auditoria"
  }
];

function SidebarLink({ item }: { item: SidebarItem }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 py-3 pl-8 text-sm uppercase tracking-wide transition-all ${
        item.active
          ? "border-l-2 border-stone-800 bg-stone-200/30 font-bold text-stone-900"
          : "text-stone-500 hover:bg-stone-200/50"
      }`}
    >
      <Icon className="h-5 w-5" strokeWidth={item.active ? 2 : 1.75} />
      <span>{item.label}</span>
    </Link>
  );
}

function AuditAction({
  href,
  title,
  icon: Icon
}: {
  href: string;
  title: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      title={title}
      className="rounded-full p-2 text-[var(--audit-outline)] transition-colors hover:bg-[var(--audit-surface-low)] hover:text-stone-900"
    >
      <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
    </Link>
  );
}

function AuditRecordCard({ record }: { record: AuditRecord }) {
  const badgeClass =
    record.statusTone === "warm"
      ? "bg-[rgba(248,222,204,0.7)] text-[var(--audit-secondary)]"
      : "bg-[var(--audit-surface-low)] text-[var(--audit-outline)]";

  return (
    <article
      className={`flex flex-col items-start gap-8 rounded-xl bg-[var(--audit-surface)] p-8 transition-transform duration-300 hover:-translate-y-[2px] md:flex-row ${
        record.highlight ? "border-l-4 border-[var(--audit-tertiary)]" : ""
      }`}
      style={{ boxShadow: "var(--audit-shadow)" }}
    >
      <div className="flex-1">
        <div className="mb-3 flex items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${badgeClass}`}
          >
            {record.status}
          </span>
          <span className="text-[10px] uppercase tracking-widest text-[var(--audit-outline)]">
            ID: {record.id}
          </span>
          {record.highlightLabel ? (
            <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--audit-tertiary)]">
              {record.highlightLabel}
            </span>
          ) : null}
        </div>

        <h5 className={`${notoSerif.className} mb-2 text-lg text-stone-900`}>{record.title}</h5>
        <p className="max-w-2xl text-sm leading-relaxed text-[var(--audit-text-soft)]">
          {record.description}
        </p>

        <div className="mt-6 flex items-center gap-6">
          <div className="flex items-center gap-2">
            <UserRound className="h-4 w-4 text-[var(--audit-outline)]" strokeWidth={1.8} />
            <span className="text-xs font-medium">{record.owner}</span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-[var(--audit-outline)]" strokeWidth={1.8} />
            <span className="text-xs font-medium">{record.age}</span>
          </div>
        </div>
      </div>

      <div className="flex min-w-[180px] flex-col justify-between text-right">
        <p className={`${notoSerif.className} mb-8 text-2xl text-[var(--audit-tertiary)]`}>
          {record.impact}
        </p>
        <div className="flex justify-end gap-3">
          <AuditAction href={record.investigateHref} title="Investigar" icon={Search} />
          <AuditAction href={record.correctHref} title="Corrigir" icon={Wand2} />
          <AuditAction href={record.resolveHref} title="Marcar como Resolvido" icon={CheckCircle2} />
        </div>
      </div>
    </article>
  );
}

export async function AuditPage({ filters, searchParamsSource }: AuditPageProps) {
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
  const visibleAlerts = alertsResult.data.items.filter((alert) =>
    filters.alert ? alert.id === filters.alert : true
  );
  const liveRecords: AuditRecord[] = visibleAlerts.map((alert) => {
    const linkedPayout = alert.payoutId ? dataSource.payouts.find((payout) => payout.id === alert.payoutId) : undefined;
    const linkedRefund = alert.refundId ? dataSource.refunds.find((refund) => refund.id === alert.refundId) : undefined;
    const impact = linkedRefund?.amount ?? linkedPayout?.grossAmount ?? 0;

    return {
      id: alert.id.toUpperCase(),
      status: alert.status === "critico" ? "Em Investigacao" : "Pendente",
      statusTone: alert.status === "critico" || alert.priority === "critica" ? "warm" : "neutral",
      title: alert.type,
      description: alert.summary,
      owner: alert.priority === "critica" ? "Helena M." : "Arthur K.",
      age: new Date(alert.createdAt).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      }),
      impact: `- ${formatCurrency(impact)}`,
      highlight: alert.priority === "critica",
      highlightLabel: alert.priority === "critica" ? "ALTO IMPACTO" : undefined,
      investigateHref: `/adm/financeiro?alert=${alert.id}`,
      correctHref: linkedRefund
        ? `/adm/financeiro/reembolsos?refund=${linkedRefund.id}`
        : linkedPayout
          ? `/adm/financeiro/repasses?payout=${linkedPayout.id}`
          : "/adm/financeiro",
      resolveHref: `/adm/financeiro/auditoria?alert=${alert.id}`
    };
  });
  const visibleRecords = liveRecords.length > 0 ? liveRecords : records;
  const totalImpact = visibleAlerts.reduce((sum, alert) => {
    const payout = alert.payoutId ? dataSource.payouts.find((row) => row.id === alert.payoutId) : undefined;
    const refund = alert.refundId ? dataSource.refunds.find((row) => row.id === alert.refundId) : undefined;
    return sum + (refund?.amount ?? payout?.grossAmount ?? 0);
  }, 0);
  return (
    <div style={auditTheme} className="min-h-screen bg-[var(--audit-bg)] text-[var(--audit-text)]">
      <aside className="fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-stone-200/50 bg-stone-100 py-8">
        <div className="mb-10 px-8">
          <h1 className={`${notoSerif.className} text-lg italic text-stone-900`}>BelaPop</h1>
          <p className="mt-1 text-[10px] uppercase tracking-widest text-stone-500">Premium Marketplace</p>
        </div>

        <nav className="flex-1 space-y-1">
          {sidebarItems.map((item) => (
            <SidebarLink key={item.label} item={item} />
          ))}
        </nav>

        <div className="border-t border-stone-200/30 px-8 pt-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 overflow-hidden rounded-full bg-stone-200">
              <Image
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCy51e1qtyzJphpphWO5eyLN2uxWGhkLtWSncdYIJbxfVFtzhqDxjRCEzHBLHr0jvlvvw5szOZOp1sgppwxs328kOK-HwHP3kbaPfgIsu4R7WY26EvXWGvHEuvPpMHgCfffSA6wTNUcpjF26an5EQR-kUFCDydoQKQIHHuRM79TF5NliJ30VjuHqygDDoivef1G_WlskmjC5AAFAy3DHnMkcd0xSyD5LRugNcyC-KPnyR0FhwJpkR-dcR-IMBPJKaEoJ857mo0MUYYL"
                alt="Admin Curator"
                width={32}
                height={32}
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <p className="text-xs font-bold text-[var(--audit-text)]">Admin Curator</p>
              <p className="text-[10px] text-[var(--audit-outline)]">Internal Audit</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="ml-64 min-h-screen">
        <header className="sticky top-0 z-40 flex items-center justify-between bg-stone-50/80 px-12 py-6 shadow-sm shadow-stone-200/50 backdrop-blur-xl">
          <div>
            <h2 className={`${notoSerif.className} text-2xl italic tracking-tight text-stone-900`}>
              Auditoria Financeira
            </h2>
            <nav className="mt-1 flex gap-4 text-[10px] uppercase tracking-[0.2em] text-[var(--audit-outline)]">
              <span>Overview</span>
              <span className="text-stone-300">/</span>
              <span className="font-bold text-[var(--audit-secondary)]">Inconsistências</span>
            </nav>
          </div>

          <div className="flex items-center gap-8">
            <div className="flex items-center gap-4">
              <div className="flex cursor-pointer items-center gap-2 rounded-full bg-[var(--audit-surface-low)] px-4 py-2 outline outline-1 outline-[rgba(177,179,169,0.15)] transition-colors hover:bg-[var(--audit-surface-highest)]">
                <CalendarDays className="h-4 w-4" strokeWidth={1.8} />
                <span className="text-xs font-medium">Últimos 30 dias</span>
              </div>
              <div className="flex cursor-pointer items-center gap-2 rounded-full bg-[var(--audit-surface-low)] px-4 py-2 outline outline-1 outline-[rgba(177,179,169,0.15)] transition-colors hover:bg-[var(--audit-surface-highest)]">
                <AlertTriangle className="h-4 w-4" strokeWidth={1.8} />
                <span className="text-xs font-medium">Todos os Status</span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-stone-500">
              <AlertTriangle className="h-5 w-5 cursor-pointer transition-colors hover:text-stone-900" strokeWidth={1.8} />
              <HelpCircle className="h-5 w-5 cursor-pointer transition-colors hover:text-stone-900" strokeWidth={1.8} />
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-12 py-10">
          <section className="mb-16 grid grid-cols-12 gap-8">
            <div className="relative col-span-8 overflow-hidden rounded-xl bg-[var(--audit-surface-low)] p-10">
              <div className="relative z-10">
                <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--audit-secondary)]">
                  Impacto Financeiro Total
                </p>
                <h3 className={`${notoSerif.className} text-5xl text-stone-900`}>
                  - {formatCurrency(totalImpact)}
                </h3>
                <p className="mt-6 max-w-md text-sm leading-relaxed text-[var(--audit-outline)]">
                  Monitoramento em tempo real de divergências transacionais. Cinco incidentes críticos
                  aguardam resolução imediata para garantir a integridade do marketplace.
                </p>
              </div>
              <div className="pointer-events-none absolute right-0 top-0 h-full w-1/3 opacity-10">
                <Image
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDGV4Lr_KDAH422537R1_M8ADkaHG9mqih3ZE0Sxgxg7ErUaAWj3bJoCXv8z_Dpl_KoQS48aTr9a3e2t1Y19isIYdBVF5T_kuE3qGn2DBCA3oQ2CD7HGjBdi02aTalMpb1EYg7GjaN2iGUthbHo3IpyLZO2OcSAW5xftyhJSeCU4m73ylvwkMmWK-5T3bE6o_16ej1OPIBk30p6BOUDyeHXMyvjd2iYoBwD6qSEW2BGR4LdWP2KjGDbdR_bWOvm9hcSBQqckNTbyLms"
                  alt="Textura editorial abstrata"
                  fill
                  className="object-cover grayscale"
                />
              </div>
            </div>

            <div className="col-span-4 flex flex-col gap-6">
              <article
                className="flex flex-col justify-between rounded-xl bg-[var(--audit-surface)] p-8 outline outline-1 outline-[rgba(177,179,169,0.15)]"
                style={{ boxShadow: "var(--audit-shadow)" }}
              >
                <AlertTriangle className="mb-4 h-6 w-6 text-[var(--audit-tertiary)]" strokeWidth={1.8} />
                <div>
                  <p className={`${notoSerif.className} mb-1 text-3xl`}>{visibleRecords.length}</p>
                  <p className="text-xs uppercase tracking-widest text-[var(--audit-outline)]">
                    Incidentes Ativos
                  </p>
                </div>
              </article>

              <article
                className="flex flex-col justify-between rounded-xl bg-[var(--audit-surface)] p-8 outline outline-1 outline-[rgba(177,179,169,0.15)]"
                style={{ boxShadow: "var(--audit-shadow)" }}
              >
                <CheckCircle2 className="mb-4 h-6 w-6 text-[var(--audit-secondary)]" strokeWidth={1.8} />
                <div>
                  <p className={`${notoSerif.className} mb-1 text-3xl`}>
                    {dataSource.activityLogs.length}
                  </p>
                  <p className="text-xs uppercase tracking-widest text-[var(--audit-outline)]">
                    Resolvidos este mês
                  </p>
                </div>
              </article>
            </div>
          </section>

          <section className="space-y-6">
            <div className="mb-8 flex items-end justify-between border-b border-stone-200/30 pb-4">
              <h4 className={`${notoSerif.className} text-xl italic`}>Registros de Auditoria</h4>
              <p className="text-xs text-[var(--audit-outline)]">
                Filtrando por: <span className="font-bold text-[var(--audit-text)]">Pendentes e Em Investigação</span>
              </p>
            </div>

            {visibleRecords.map((record) => (
              <AuditRecordCard key={record.id} record={record} />
            ))}
          </section>

          <footer className="mt-16 flex items-center justify-between text-[var(--audit-outline)]">
            <p className="text-xs uppercase tracking-widest">Página 1 de 4</p>
            <div className="flex gap-4">
              <button
                type="button"
                className="rounded-full border border-[rgba(177,179,169,0.30)] px-6 py-2 text-xs uppercase tracking-widest transition-colors hover:bg-[var(--audit-surface-low)]"
              >
                Anterior
              </button>
              <button
                type="button"
                className="rounded-full bg-stone-900 px-6 py-2 text-xs uppercase tracking-widest text-stone-50 transition-opacity hover:opacity-90"
              >
                Próxima
              </button>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
