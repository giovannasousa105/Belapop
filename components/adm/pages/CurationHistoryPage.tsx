import Image from "next/image";
import Link from "next/link";
import { Noto_Serif } from "next/font/google";
import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  ChartColumn,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  LayoutDashboard,
  Printer,
  ScrollText,
  Search,
  Settings,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  Store,
  Truck,
  Users,
  Wallet
} from "lucide-react";

import { activitiesRepository, optionsRepository } from "@/lib/adm/repositories";
import type {
  ActivityLogDetailItem,
  ActivityLogListItem
} from "@/lib/adm/repositories/activitiesRepository";
import { getAdmDataSource } from "@/lib/adm/repositories/source";
import { buildHref, toListQueryParams, type AdmFilters, type SearchParamsInput } from "@/lib/adm/url";
import type { AuditSnapshotValue } from "@/types/adm";


const notoSerif = Noto_Serif({
  subsets: ["latin"],
  weight: ["400", "700"]
});

const historyTheme = {
  "--history-bg": "#fbf9f4",
  "--history-sidebar": "#f5f4ed",
  "--history-surface": "#ffffff",
  "--history-surface-low": "#efeee6",
  "--history-text": "#31332c",
  "--history-text-soft": "#5e6058",
  "--history-primary": "#5f5e5e",
  "--history-border": "rgba(177, 179, 169, 0.15)",
  "--history-shadow": "0 20px 40px rgba(49, 51, 44, 0.03)"
} as CSSProperties;

type CurationHistoryPageProps = {
  filters: AdmFilters;
  searchParamsSource: SearchParamsInput;
};

type SidebarItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  active?: boolean;
};

type ActivityVisual = {
  title: string;
  meta: string;
};

type AvatarConfig = {
  src?: string;
  initials: string;
  toneClassName: string;
};

const sidebarItems: SidebarItem[] = [
  { label: "Dashboard", href: "/adm/dashboard-executivo", icon: LayoutDashboard },
  { label: "Curadoria", href: "/adm/curadoria/produtos", icon: Sparkles, active: true },
  { label: "Sellers", href: "/adm/operacao/parceiros", icon: Store },
  { label: "Pedidos", href: "/adm/operacao/pedidos-criticos", icon: ShoppingBag },
  { label: "Logistica", href: "/adm/operacao/logistica", icon: Truck },
  { label: "Risco", href: "/adm/financeiro/risco", icon: ShieldAlert },
  { label: "Financeiro", href: "/adm/financeiro", icon: Wallet },
  { label: "Clientes", href: "/adm/relacionamento/clientes", icon: Users },
  { label: "Relatorios", href: "/adm/gestao/relatorios", icon: ChartColumn },
  { label: "Configuracoes", href: "/adm/gestao/configuracoes", icon: Settings }
];

const avatarByUserName: Record<string, AvatarConfig> = {
  "Ana Curadoria": {
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDjhjrtszxJlHWAGl8NQmAiFj1Oo_FwVElcTaKwvDuk_ObEbGMsSHeskaBodSDMeVbkHzUIs20-b0HJnxLMGVI75OcMUbfXIjc27oSgXsy-TtDVwk0mEkP3oCH9Oh43Sxay-TULAPYTrqTmgAmtoW8uztUVSEr5_GfkKDgO_8KSykmz7K_UR8pAnfamWjKUnsMTwMh6ulvjB3ofPxuhm7GeZsEUCOJWeW9Og07MGh8IWfrIVK_k0hZXP0rAx8lbea6x599Od74lzQ2_",
    initials: "AC",
    toneClassName: "bg-[#eadccf]"
  },
  "Bruno Operacoes": {
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuBWfcoD-1Ce9agGOuTMvQFZXNZUoiKp5tYLotAjAPXOFGmiLvTGTL5l7N-9MkJgh66GQEcPgD4KYaMJjikPS2Lzt5P3zP5h1Cm1YU0am9HCZ44J7zzwShzd9BlFNGFn8A3S6l1aNOF3ukKp_oabv34dk8c_jx1udiB6pGxHgezvZvoXD4U3JnL8bJpl6quUDtoarOHLpI7p6zzNgPGxJzt4XMnzQ2o93WkABCuwAfVBTHcUduDfREtc0hKmwz0e0JPH86OZ5jB0aqKR",
    initials: "BO",
    toneClassName: "bg-[#ddd6cc]"
  },
  "Clara Finance": {
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDpP8B8NkZ7Ydmp12uBGa6nYZ-y6lkjjMLBHZ8jQIpyc1zU2PrkEgDtTZtxm7oVXEkFt18vceWjqIwPgteialgONxTn772IsriSWjlbUjLYMFmE6TCHWb4CfKlH7JjynpaW5A30o6HR6foNynPbmr0UQBsH72MNYB6k5Av104-Swi518JQuNe7h6SsAmczxGI1oP9abVlUhGJmtczAQx4SvAXdPn2RblM7-EP_p-hQ-4MLKJrI7hHUIYuaPbSwlsUeXhDoIw0YxZlwQ",
    initials: "CF",
    toneClassName: "bg-[#dedad4]"
  },
  "Diego Compliance": {
    src: "https://lh3.googleusercontent.com/aida-public/AB6AXuCNFi9CKuAPe11N8KrVUjoLsQnE_yRqJVVJ4uSfHNr0r9ID3VykGk0csvWvZ2UpSl2_v4UMOC_gBxQZuRa4Kbi8i1BWJlinIAKo5a_Qlxa3YsEteLsJU2L5rSZk-K1-sfJZh5Yf2HRIfbRb9p-pYc3e69522Wv5NYNb4M8935ObwPVvr2qs0GBnVQ7fu4GI7FQxC0PCKKwpa-JokfbimIsAZuKhiAlrCj4b-iu3BwIqTahTyI6UtSOyak7qJkU1t6yBs0hjpMkagspP",
    initials: "DC",
    toneClassName: "bg-[#dad5ce]"
  }
};

const periodOptions = optionsRepository.listPeriodOptions();

function SidebarLink({ item }: { item: SidebarItem }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 py-2 text-sm transition-colors ${
        item.active
          ? "border-l-2 border-[var(--history-primary)] bg-stone-200/30 pl-4 font-semibold text-[var(--history-text)]"
          : "pl-4 font-medium text-[var(--history-primary)] hover:bg-stone-200/40 hover:text-[var(--history-text)]"
      }`}
    >
      <Icon className="h-4 w-4" strokeWidth={1.7} />
      <span>{item.label}</span>
    </Link>
  );
}

function HiddenFilterFields({
  filters,
  exclude = []
}: {
  filters: AdmFilters;
  exclude?: Array<keyof AdmFilters>;
}) {
  return Object.entries(filters)
    .filter(([key, value]) => value && !exclude.includes(key as keyof AdmFilters))
    .map(([key, value]) => <input key={key} type="hidden" name={key} value={value} />);
}

function formatActivityValue(value: AuditSnapshotValue | undefined) {
  if (value === undefined || value === null || value === "") return "Sem valor";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "boolean") return value ? "Sim" : "Nao";

  const normalized = String(value).replace(/-/g, " ");
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

function formatDiffPreview(activity: ActivityLogDetailItem) {
  const before = activity.before ?? {};
  const after = activity.after ?? {};
  const changedKey = Array.from(new Set([...Object.keys(before), ...Object.keys(after)])).find(
    (key) => before[key] !== after[key]
  );

  if (!changedKey) return null;

  return `${formatActivityValue(before[changedKey])} -> ${formatActivityValue(after[changedKey])}`;
}

function getAvatarConfig(userName: string): AvatarConfig {
  const config = avatarByUserName[userName];
  if (config) return config;

  const initials = userName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return {
    initials: initials || "BP",
    toneClassName: "bg-[#d9d4cb]"
  };
}

function formatActivityDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo"
  })
    .format(new Date(value))
    .replace(".", "")
    .replace(",", " /");
}

function matchesPeriod(value: string, period?: string) {
  if (!period) return true;

  const days = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : null;
  if (!days) return true;

  const date = new Date(value);
  const now = new Date();
  const diffInDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
  return diffInDays <= days;
}

function resolveActivityVisual(
  activity: ActivityLogListItem,
  relations: {
    productMap: Record<string, { name: string; sellerId: string }>;
    sellerMap: Record<string, { name: string }>;
    incidentMap: Record<string, { sellerId: string; summary: string; shipmentId: string }>;
    payoutMap: Record<string, { sellerId: string }>;
    documentMap: Record<string, { sellerId: string; type: string }>;
  }
): ActivityVisual {
  if (activity.entityType === "product") {
    const product = relations.productMap[activity.entityId];
    const sellerName = product ? relations.sellerMap[product.sellerId]?.name : undefined;

    return {
      title: product?.name ?? activity.entityId,
      meta: sellerName ? `SKU: ${activity.entityId.toUpperCase()} / ${sellerName}` : activity.entityId
    };
  }

  if (activity.entityType === "incident") {
    const incident = relations.incidentMap[activity.entityId];
    const sellerName = incident ? relations.sellerMap[incident.sellerId]?.name : undefined;

    return {
      title: sellerName ?? activity.entityId,
      meta: incident ? `${incident.summary} / ${incident.shipmentId}` : activity.entityId
    };
  }

  if (activity.entityType === "payout") {
    const payout = relations.payoutMap[activity.entityId];
    const sellerName = payout ? relations.sellerMap[payout.sellerId]?.name : undefined;

    return {
      title: sellerName ?? activity.entityId,
      meta: `Repasse ${activity.entityId.toUpperCase()}`
    };
  }

  if (activity.entityType === "document") {
    const document = relations.documentMap[activity.entityId];
    const sellerName = document ? relations.sellerMap[document.sellerId]?.name : undefined;

    return {
      title: document?.type ?? activity.entityId,
      meta: sellerName ? `Seller: ${sellerName}` : activity.entityId
    };
  }

  return {
    title: activity.entityId,
    meta: activity.entityType
  };
}

export async function CurationHistoryPage({
  filters,
  searchParamsSource
}: CurationHistoryPageProps) {
  const baseQuery = toListQueryParams(searchParamsSource, {
    page: 1,
    pageSize: 50,
    sortBy: "createdAt",
    sortDir: "desc"
  });
  const listResult = await activitiesRepository.listActivities(baseQuery);

  if (!listResult.success) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-[var(--history-bg)] px-6 text-center text-[var(--history-text)]"
        style={historyTheme}
      >
        <div className="max-w-lg rounded-[1.5rem] border border-[var(--history-border)] bg-white p-10 shadow-[var(--history-shadow)]">
          <h1 className={`${notoSerif.className} text-3xl`}>Historico de Versoes</h1>
          <p className="mt-4 text-sm text-[var(--history-text-soft)]">
            Nao foi possivel carregar os eventos desta trilha no momento.
          </p>
        </div>
      </div>
    );
  }

  const dataSource = await getAdmDataSource();
  const sellerMap = Object.fromEntries(dataSource.sellers.map((seller) => [seller.id, seller]));
  const productMap = Object.fromEntries(dataSource.products.map((product) => [product.id, product]));
  const incidentMap = Object.fromEntries(
    dataSource.logisticsIncidents.map((incident) => [incident.id, incident])
  );
  const payoutMap = Object.fromEntries(dataSource.payouts.map((payout) => [payout.id, payout]));
  const documentMap = Object.fromEntries(
    dataSource.documents.map((document) => [document.id, document])
  );
  const userAreaMap = Object.fromEntries(dataSource.internalUsers.map((user) => [user.id, user.area]));

  const activityRows = listResult.data.items.filter((activity) => matchesPeriod(activity.createdAt, filters.period));
  const pageSize = Math.max(1, Number(filters.pageSize ?? "12") || 12);
  const totalItems = activityRows.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(Math.max(1, Number(filters.page ?? "1") || 1), totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const pagedRows = activityRows.slice(startIndex, startIndex + pageSize);

  const actionOptions = optionsRepository
    .listActivityActionOptions()
    .filter((option) => activityRows.some((row) => row.actionType === option.value));
  const userOptions = optionsRepository
    .listActivityActorOptions()
    .filter((option) => activityRows.some((row) => row.userId === option.value));
  const entityOptions = optionsRepository
    .listActivityEntityOptions()
    .filter((option) => activityRows.some((row) => row.entityType === option.value));

  return (
    <div
      className="min-h-screen bg-[var(--history-bg)] text-[var(--history-text)]"
      style={historyTheme}
    >
      <div className="flex min-h-screen">
        <aside className="hidden h-screen w-72 shrink-0 flex-col gap-8 border-r border-stone-200/20 bg-[var(--history-sidebar)] px-6 py-10 lg:flex">
          <div className="mb-4">
            <span className="text-xl tracking-[0.2em] text-stone-900">BelaPop</span>
            <p className="mt-1 text-[10px] font-medium uppercase tracking-widest text-stone-500">
              Premium Management
            </p>
          </div>

          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto pr-2">
            {sidebarItems.map((item) => (
              <SidebarLink key={item.href} item={item} />
            ))}
          </nav>

          <div className="mt-auto border-t border-stone-200/20 pt-8">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-stone-200">
                <Image
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuB8t9IC4oaDqM7JlDfEMx-IhNVFVasGJPkTwq8JT13q0RTj8nECp1BWUFZCiUU-XKX5d-kpLTB_dr81so_wMElZmRvnr9Cr4UfmIYNVoF_1ln5XpfsxRz2zodnzlALPTANWreXief8Mt5AD1BbXlmvp766xfsBknupKUZD_jdMR8Bt4ZdL48gMlD695HR732fM7dwY87xYoIymuKpqxoDE9mBwI5R2OoABuO4YTkRmT_z0BL4Oa1VjMqN2zQNVMYVpyK8aGJ__Trp5c"
                  alt="Admin BelaPop"
                  width={40}
                  height={40}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-stone-900">Adrian Curator</span>
                <span className="text-[10px] uppercase tracking-widest text-stone-500">
                  Platform Admin
                </span>
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 flex w-full items-center justify-between bg-stone-50/80 px-6 py-6 backdrop-blur-xl sm:px-8 xl:px-12">
            <h1 className={`${notoSerif.className} text-2xl italic tracking-tight text-stone-900`}>
              Historico de Versoes
            </h1>

            <div className="flex items-center gap-4 sm:gap-8">
              <form method="get" action="/adm/curadoria/historico-versoes" className="relative hidden w-64 md:block">
                <HiddenFilterFields filters={filters} exclude={["q", "page"]} />
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" strokeWidth={1.7} />
                <input
                  type="search"
                  name="q"
                  defaultValue={filters.q}
                  placeholder="Buscar no historico..."
                  className="w-full rounded-xl border-none bg-stone-100 py-2 pl-10 pr-4 text-sm text-stone-700 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-300"
                />
              </form>

              <button type="button" aria-label="Notificacoes" className="text-stone-500 transition-colors hover:text-stone-800">
                <Bell className="h-5 w-5" strokeWidth={1.7} />
              </button>
            </div>
          </header>

          <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 p-6 sm:p-8 xl:p-12">
            <section className="max-w-3xl">
              <h2 className={`${notoSerif.className} mb-4 text-4xl leading-tight tracking-[-0.03em] text-[var(--history-text)] xl:text-5xl`}>
                Historico de Alteracoes da Curadoria
              </h2>
              <p className="text-base font-light leading-relaxed text-[var(--history-text-soft)] xl:text-lg">
                Acompanhamento granular de ajustes em produtos, documentos e eventos conectados ao fluxo
                curatorial. Cada registro preserva contexto, rastreabilidade e governanca operacional.
              </p>
            </section>

            <section>
              <form
                method="get"
                action="/adm/curadoria/historico-versoes"
                className="grid grid-cols-1 gap-4 md:grid-cols-5"
              >
                <HiddenFilterFields filters={filters} exclude={["action", "user", "entity", "period", "page"]} />

                <div className="flex flex-col gap-2">
                  <label htmlFor="history-action" className="pl-1 text-[10px] font-bold uppercase tracking-widest text-stone-400">
                    Acao
                  </label>
                  <select
                    id="history-action"
                    name="action"
                    defaultValue={filters.action ?? ""}
                    className="w-full cursor-pointer rounded-xl border border-stone-200/30 bg-white px-4 py-3 text-sm text-stone-600 outline-none transition-colors focus:border-stone-300"
                  >
                    <option value="">Todos os tipos</option>
                    {actionOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="history-user" className="pl-1 text-[10px] font-bold uppercase tracking-widest text-stone-400">
                    Usuario
                  </label>
                  <select
                    id="history-user"
                    name="user"
                    defaultValue={filters.user ?? ""}
                    className="w-full cursor-pointer rounded-xl border border-stone-200/30 bg-white px-4 py-3 text-sm text-stone-600 outline-none transition-colors focus:border-stone-300"
                  >
                    <option value="">Qualquer admin</option>
                    {userOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="history-entity" className="pl-1 text-[10px] font-bold uppercase tracking-widest text-stone-400">
                    Entidade
                  </label>
                  <select
                    id="history-entity"
                    name="entity"
                    defaultValue={filters.entity ?? ""}
                    className="w-full cursor-pointer rounded-xl border border-stone-200/30 bg-white px-4 py-3 text-sm text-stone-600 outline-none transition-colors focus:border-stone-300"
                  >
                    <option value="">Todas entidades</option>
                    {entityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor="history-period" className="pl-1 text-[10px] font-bold uppercase tracking-widest text-stone-400">
                    Periodo
                  </label>
                  <div className="relative">
                    <select
                      id="history-period"
                      name="period"
                      defaultValue={filters.period ?? "7d"}
                      className="w-full cursor-pointer appearance-none rounded-xl border border-stone-200/30 bg-white px-4 py-3 text-sm text-stone-600 outline-none transition-colors focus:border-stone-300"
                    >
                      {periodOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          Ultimos {option.label}
                        </option>
                      ))}
                    </select>
                    <Clock3 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" strokeWidth={1.7} />
                  </div>
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-[var(--history-primary)] py-3.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
                  >
                    Aplicar Filtros
                  </button>
                </div>
              </form>
            </section>

            <section className="overflow-hidden rounded-[1.5rem] bg-white shadow-[var(--history-shadow)]">
              {pagedRows.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[860px] border-collapse text-left">
                      <thead>
                        <tr className="border-b border-stone-100 bg-[var(--history-surface-low)]/30">
                          <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400">
                            Usuario
                          </th>
                          <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400">
                            Acao
                          </th>
                          <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400">
                            Entidade
                          </th>
                          <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400">
                            Data & Hora
                          </th>
                          <th className="px-8 py-6 text-right text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400">
                            Acao
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-50">
                        {pagedRows.map((row) => {
                          const avatar = getAvatarConfig(row.userName);
                          const visual = resolveActivityVisual(row, {
                            productMap,
                            sellerMap,
                            incidentMap,
                            payoutMap,
                            documentMap
                          });
                          const diffPreview = formatDiffPreview(row as ActivityLogDetailItem);
                          const detailHref =
                            row.contextPathname ??
                            `/adm/gestao/log-atividades?activity=${encodeURIComponent(row.id)}`;

                          return (
                            <tr key={row.id} className="group transition-colors hover:bg-[var(--history-surface-low)]">
                              <td className="px-8 py-6">
                                <div className="flex items-center gap-3">
                                  <div className={`flex h-8 w-8 items-center justify-center overflow-hidden rounded-full ${avatar.toneClassName}`}>
                                    {avatar.src ? (
                                      <Image
                                        src={avatar.src}
                                        alt={row.userName}
                                        width={32}
                                        height={32}
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <span className="text-[10px] font-semibold uppercase tracking-wide text-stone-700">
                                        {avatar.initials}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium text-stone-800">{row.userName}</span>
                                    <span className="text-[10px] uppercase tracking-widest text-stone-400">
                                      {userAreaMap[row.userId] ?? "Backoffice"}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-8 py-6">
                                <div className="space-y-1">
                                  <span className="text-sm text-stone-600">{row.actionLabel}</span>
                                  <p className="text-[10px] uppercase tracking-widest text-stone-400">
                                    {formatActivityValue(row.status)}
                                  </p>
                                </div>
                              </td>
                              <td className="px-8 py-6">
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium text-stone-800">{visual.title}</span>
                                  <span className="text-[10px] text-stone-400">{visual.meta}</span>
                                </div>
                              </td>
                              <td className="px-8 py-6">
                                <span className="text-sm text-stone-500">{formatActivityDate(row.createdAt)}</span>
                              </td>
                              <td className="px-8 py-6 text-right">
                                {diffPreview ? (
                                  <span className="mr-4 hidden text-xs italic text-stone-400 xl:inline">
                                    {diffPreview}
                                  </span>
                                ) : null}
                                <Link
                                  href={detailHref}
                                  className="text-[11px] font-bold uppercase tracking-widest text-stone-400 underline underline-offset-4 transition-colors hover:text-stone-900"
                                >
                                  Detalhes
                                </Link>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <footer className="flex flex-col gap-6 bg-white/50 px-8 py-8 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-xs font-medium text-stone-400">
                      Exibindo {pagedRows.length} de {totalItems} revisoes
                    </span>

                    <div className="flex items-center gap-2">
                      <Link
                        href={buildHref("/adm/curadoria/historico-versoes", searchParamsSource, {
                          page: currentPage > 1 ? String(currentPage - 1) : undefined
                        })}
                        aria-disabled={currentPage === 1}
                        className={`flex h-10 w-10 items-center justify-center rounded-full border border-stone-100 transition-all ${
                          currentPage === 1
                            ? "pointer-events-none text-stone-300"
                            : "text-stone-500 hover:bg-stone-50 hover:text-stone-800"
                        }`}
                      >
                        <ChevronLeft className="h-4 w-4" strokeWidth={1.7} />
                      </Link>
                      <div className="flex items-center gap-4 px-4 text-xs font-bold">
                        <span className="text-stone-800 underline underline-offset-4">{currentPage}</span>
                        {totalPages > 1 ? <span className="text-stone-300">de {totalPages}</span> : null}
                      </div>
                      <Link
                        href={buildHref("/adm/curadoria/historico-versoes", searchParamsSource, {
                          page: currentPage < totalPages ? String(currentPage + 1) : undefined
                        })}
                        aria-disabled={currentPage >= totalPages}
                        className={`flex h-10 w-10 items-center justify-center rounded-full border border-stone-100 transition-all ${
                          currentPage >= totalPages
                            ? "pointer-events-none text-stone-300"
                            : "text-stone-800 hover:bg-stone-50"
                        }`}
                      >
                        <ChevronRight className="h-4 w-4" strokeWidth={1.7} />
                      </Link>
                    </div>
                  </footer>
                </>
              ) : (
                <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 px-8 py-12 text-center">
                  <ScrollText className="h-8 w-8 text-stone-300" strokeWidth={1.7} />
                  <h3 className={`${notoSerif.className} text-2xl text-[var(--history-text)]`}>
                    Sem revisoes para os filtros ativos
                  </h3>
                  <p className="max-w-md text-sm text-[var(--history-text-soft)]">
                    Ajuste os filtros ou remova a busca para visualizar novamente a trilha completa de alteracoes.
                  </p>
                  <Link
                    href="/adm/curadoria/historico-versoes"
                    className="mt-2 text-[11px] font-bold uppercase tracking-widest text-stone-500 underline underline-offset-4"
                  >
                    Limpar filtros
                  </Link>
                </div>
              )}
            </section>

            <div className="flex flex-col justify-end gap-4 text-[10px] font-bold uppercase tracking-widest text-stone-500 sm:flex-row">
              <button type="button" className="flex items-center gap-2 transition-colors hover:text-stone-900">
                <Download className="h-4 w-4" strokeWidth={1.7} />
                <span>Baixar CSV completo</span>
              </button>
              <button type="button" className="flex items-center gap-2 transition-colors hover:text-stone-900">
                <Printer className="h-4 w-4" strokeWidth={1.7} />
                <span>Imprimir relatorio</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}





