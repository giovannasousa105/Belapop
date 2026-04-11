import Image from "next/image";
import Link from "next/link";
import { Noto_Serif } from "next/font/google";
import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  LayoutDashboard,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  Truck,
  Users,
  Wallet
} from "lucide-react";

import { formatCurrency } from "@/lib/adm/format";
import { sellersRepository } from "@/lib/adm/repositories";
import { getAdmDataSource } from "@/lib/adm/repositories/source";
import { toListQueryParams, type AdmFilters, type SearchParamsInput } from "@/lib/adm/url";

type SellersPageProps = {
  filters: AdmFilters;
  searchParamsSource?: SearchParamsInput;
};

type SidebarItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  active?: boolean;
};

type SellerStat = {
  label: string;
  value: string;
  meta: string;
  tone: "primary" | "tertiary" | "muted";
  icon: LucideIcon;
};

type SellerRow = {
  id: string;
  name: string;
  code: string;
  category: string;
  status: "Ativo" | "Em Revisão";
  volume: string;
  image: string;
  imageAlt: string;
};

const editorialSerif = Noto_Serif({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"]
});

const partnersTheme = {
  "--partners-bg": "#fbf9f4",
  "--partners-sidebar": "#f5f4ed",
  "--partners-surface": "#ffffff",
  "--partners-surface-low": "#efeee6",
  "--partners-surface-high": "#e8e9e0",
  "--partners-surface-highest": "#e2e3d9",
  "--partners-text": "#31332c",
  "--partners-text-soft": "#5e6058",
  "--partners-outline": "#797c73",
  "--partners-outline-variant": "rgba(177,179,169,0.18)",
  "--partners-primary": "#5f5e5e",
  "--partners-secondary": "#6e5b4d",
  "--partners-tertiary": "#a23d3e"
} as CSSProperties;

const sidebarItems: SidebarItem[] = [
  { label: "Dashboard", href: "/adm/dashboard-executivo", icon: LayoutDashboard },
  { label: "Curadoria", href: "/adm/curadoria/produtos", icon: Sparkles },
  { label: "Sellers", href: "/adm/operacao/parceiros", icon: Users, active: true },
  { label: "Pedidos", href: "/adm/operacao/pedidos-criticos", icon: ShoppingBag },
  { label: "Logística", href: "/adm/operacao/logistica", icon: Truck },
  { label: "Risco", href: "/adm/financeiro/risco", icon: ShieldAlert },
  { label: "Financeiro", href: "/adm/financeiro", icon: Wallet },
  { label: "Configurações", href: "/adm/gestao/configuracoes", icon: Settings }
];

const _stats: SellerStat[] = [
  {
    label: "Total Ativos",
    value: "1,284",
    meta: "+12% este mês",
    tone: "primary",
    icon: Users
  },
  {
    label: "Aguardando Revisão",
    value: "42",
    meta: "Prioridade alta",
    tone: "tertiary",
    icon: ShieldAlert
  },
  {
    label: "Ticket Médio",
    value: "R$ 4.2k",
    meta: "Estável",
    tone: "muted",
    icon: Wallet
  },
  {
    label: "GMV Total (YTD)",
    value: "R$ 1.8M",
    meta: "Meta: 92%",
    tone: "primary",
    icon: Wallet
  }
];

const sellers: SellerRow[] = [
  {
    id: "98234-BR",
    name: "Essence & Co.",
    code: "ID: 98234-BR",
    category: "Beleza & Perfumaria",
    status: "Ativo",
    volume: "R$ 145.200,00",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAXfsqz8JjfDx68JhIard7R0UBe3mniJwoYcmx_mfGG7Uk8W9crqzGDAPTUN-8uXzsMp_AU7JsWWJWE7q-cPCTdkPP4WjYc1eqglE8nm7MLM5A1m9KirU9rA4Nba0vj6N07RE-YJtj6TNypV0SVjFSztU2dOLwB4r_8CjK-hAkr6i9csIByZGjUbZ45ITyfUz1TbrKVFLoX5dCeIuS35hx7J4Ns-Fp_sWe5YoC8ZQ83CPowng0KdbVLkxE37CyDhnFjbPeBbY0m74tg",
    imageAlt: "Frasco de perfume minimalista em fundo bege editorial"
  },
  {
    id: "77210-BR",
    name: "Chronos Atelier",
    code: "ID: 77210-BR",
    category: "Acessórios de Luxo",
    status: "Em Revisão",
    volume: "R$ 0,00",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDNHeXo0u3ln6bpJE3Rqz7a7m7frb9CiV1y9dSjj_b9QIcwWFdIY3DGljCTBH_Gfe3vDBymMuBEpnYt7_MReG-qxMVYpUD4whzKGANaACovtAgWCCmaEzXWgvypKk9jS31-jEGNARCbG3tVDyb0BR5EepzFYL3CExoG1HOisNE54E4ABDyMc9qcKrxvUeKWOa63HtdUmFYh4f5CVEnx-x_le3E-si2b40v4nldcFo6C_K2LQsVgiga5JQOFkdDWLe9cibILpyj_hCl_",
    imageAlt: "Relógio branco premium em composição clean de estúdio"
  },
  {
    id: "10455-BR",
    name: "Nordic Sport",
    code: "ID: 10455-BR",
    category: "Esportes & Outdoor",
    status: "Ativo",
    volume: "R$ 89.430,00",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDE9s-fCPusKHThyQu803uON6EtTTGnxZVKCdCkCtR3w8JkVyW24DkkDCf5X4bdbU9ObULMwjl-hjYxy597KJ7-ZqPygrJVJhNc0aM5ul5aTlh96acrRMbCbr5CPimvLzIZ_NmVGCj9wdCsws737oYZUUmIbtXf78IH-nV4iXVqobgC0IVwVonLZpqHWP_OfWRsLqjvbuJQF0LNwwD4j01632nEnHw79ftQZwq42vw3ry8YX-8vwKbbTyU-UAwZy4NrjTfBLeNSFZlA",
    imageAlt: "Tênis vermelho em iluminação de estúdio cinematográfica"
  }
];

function SidebarLink({ item }: { item: SidebarItem }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
        item.active
          ? "relative rounded-xl bg-[var(--partners-surface-highest)] font-bold text-[var(--partners-text)]"
          : "rounded-xl text-[var(--partners-text)] hover:bg-[var(--partners-surface-low)]"
      }`}
    >
      {item.active ? (
        <span className="absolute left-0 h-6 w-1 rounded-full bg-[var(--partners-secondary)]" />
      ) : null}
      <Icon className="h-4.5 w-4.5 shrink-0" strokeWidth={item.active ? 2 : 1.8} />
      <span>{item.label}</span>
    </Link>
  );
}

function SellerStatCard({ stat }: { stat: SellerStat }) {
  const Icon = stat.icon;
  const toneClass =
    stat.tone === "primary"
      ? "text-[var(--partners-primary)]"
      : stat.tone === "tertiary"
        ? "text-[var(--partners-tertiary)]"
        : "text-[var(--partners-text-soft)]";

  return (
    <article className="rounded-xl border border-[var(--partners-outline-variant)] bg-[var(--partners-surface)] p-6">
      <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-[var(--partners-text-soft)]">
        {stat.label}
      </p>
      <h3 className="text-3xl font-medium text-[var(--partners-text)]">{stat.value}</h3>
      <div className={`mt-4 flex items-center gap-2 text-xs ${toneClass}`}>
        <Icon className="h-4 w-4" strokeWidth={1.9} />
        <span>{stat.meta}</span>
      </div>
    </article>
  );
}

function SellerStatusPill({ status }: { status: SellerRow["status"] }) {
  const className =
    status === "Ativo"
      ? "bg-[rgba(95,94,94,0.10)] text-[var(--partners-primary)]"
      : "bg-[rgba(162,61,62,0.10)] text-[var(--partners-tertiary)]";

  return (
    <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${className}`}>
      {status}
    </span>
  );
}

export async function SellersPage({ filters, searchParamsSource = filters }: SellersPageProps) {
  const serif = editorialSerif.className;
  const [listResult, dataSource] = await Promise.all([
    sellersRepository.listSellers(
      toListQueryParams(searchParamsSource, {
        page: 1,
        pageSize: 10,
        sortBy: "gmv30d",
        sortDir: "desc"
      })
    ),
    getAdmDataSource()
  ]);
  const sellerRows = listResult.data.items.map((seller, index) => ({
    id: seller.id,
    name: seller.name,
    code: `ID: ${seller.id.toUpperCase()}`,
    category: seller.category,
    status:
      seller.status === "em-revisao" || seller.status === "pendente" || seller.status === "bloqueado"
        ? ("Em Revisão" as const)
        : ("Ativo" as const),
    volume: formatCurrency(seller.gmv30d),
    image: sellers[index % sellers.length].image,
    imageAlt: sellers[index % sellers.length].imageAlt
  }));
  const averageTicket =
    dataSource.orders.length > 0
      ? formatCurrency(
          dataSource.orders.reduce((sum, order) => sum + order.total, 0) / dataSource.orders.length
        )
      : formatCurrency(0);
  const totalGmv = dataSource.sellers.reduce((sum, seller) => sum + seller.gmv30d, 0);
  const activeSellers = dataSource.sellers.filter((seller) => seller.status !== "bloqueado").length;
  const pendingReview = dataSource.sellers.filter(
    (seller) => seller.status === "em-revisao" || seller.status === "pendente" || seller.pendingDocuments > 0
  ).length;
  const statCards: SellerStat[] = [
    {
      label: "Total Ativos",
      value: String(activeSellers),
      meta: `${dataSource.sellers.filter((seller) => seller.status === "premium" || seller.tier === "premium").length} premium`,
      tone: "primary",
      icon: Users
    },
    {
      label: "Aguardando Revisão",
      value: String(pendingReview),
      meta: "Prioridade alta",
      tone: "tertiary",
      icon: ShieldAlert
    },
    {
      label: "Ticket Médio",
      value: averageTicket,
      meta: `${dataSource.orders.length} pedidos`,
      tone: "muted",
      icon: Wallet
    },
    {
      label: "GMV Total (30d)",
      value: formatCurrency(totalGmv),
      meta: `${sellerRows.length} sellers no recorte`,
      tone: "primary",
      icon: Wallet
    }
  ];

  return (
    <div
      style={partnersTheme}
      className="min-h-screen bg-[var(--partners-bg)] text-[var(--partners-text)] antialiased"
    >
      <div className="mx-auto flex min-h-screen w-full max-w-[1720px]">
        <aside className="sticky top-0 hidden min-h-screen w-80 shrink-0 border-r border-transparent bg-[var(--partners-sidebar)] p-6 xl:flex xl:flex-col">
          <div className="flex flex-col gap-8">
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--partners-outline-variant)] bg-[var(--partners-surface-high)] shadow-sm">
                <Users className="h-5 w-5 text-[var(--partners-primary)]" strokeWidth={1.8} />
              </div>
              <div>
                <h1 className={`${serif} text-lg leading-tight text-[var(--partners-text)]`}>
                  Gestão de Parceiros
                </h1>
                <p className="text-xs text-[var(--partners-text-soft)]">
                  Administração de sellers e parceiros
                </p>
              </div>
            </div>

            <nav className="flex flex-col gap-1">
              {sidebarItems.map((item) => (
                <SidebarLink key={item.label} item={item} />
              ))}
            </nav>
          </div>
        </aside>

        <main className="flex-1 bg-[var(--partners-bg)] p-6 md:p-8 xl:p-10">
          <header className="mb-12 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-2xl">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-[var(--partners-secondary)]">
                Diretório de Parceiros
              </span>
              <h2 className={`${serif} text-4xl tracking-tight text-[var(--partners-text)]`}>
                Sellers & marcas
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-[var(--partners-text-soft)]">
                Gerencie os relacionamentos comerciais, acompanhe o status de onboarding e valide
                a conformidade de novos parceiros no ecossistema.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <button
                type="button"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[var(--partners-surface-highest)] px-8 py-3 text-sm font-medium text-[var(--partners-text)] transition-all hover:brightness-95"
              >
                Exportar CSV
              </button>
              <button
                type="button"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--partners-primary)] px-8 py-3 text-sm font-medium text-white shadow-sm transition-all hover:bg-[var(--partners-primary)]/90"
              >
                <Plus className="h-4 w-4" />
                Novo Parceiro
              </button>
            </div>
          </header>

          <section className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {statCards.map((stat) => (
              <SellerStatCard key={stat.label} stat={stat} />
            ))}
          </section>

          <section className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="group relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--partners-text-soft)] transition-colors group-focus-within:text-[var(--partners-primary)]" />
              <input
                type="text"
                defaultValue={filters.q}
                placeholder="Buscar por nome, CNPJ ou categoria..."
                className="w-full rounded-xl border border-[rgba(177,179,169,0.20)] bg-[var(--partners-surface)] py-3 pl-12 pr-4 text-sm text-[var(--partners-text)] outline-none transition focus:border-[var(--partners-primary)] focus:ring-1 focus:ring-[var(--partners-primary)]"
              />
            </div>
            <button
              type="button"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[rgba(177,179,169,0.20)] bg-[var(--partners-surface-low)] px-6 py-3 text-sm text-[var(--partners-text)] transition-colors hover:bg-[var(--partners-surface-high)]"
            >
              <Filter className="h-4 w-4" strokeWidth={1.8} />
              Filtros
            </button>
          </section>

          <section className="overflow-hidden rounded-xl border border-[var(--partners-outline-variant)] bg-[var(--partners-surface)]">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left">
                <thead>
                  <tr className="bg-[var(--partners-surface-low)]">
                    <th className="px-8 py-5 text-xs font-bold uppercase tracking-[0.18em] text-[var(--partners-text-soft)]">
                      Parceiro
                    </th>
                    <th className="px-8 py-5 text-xs font-bold uppercase tracking-[0.18em] text-[var(--partners-text-soft)]">
                      Categoria
                    </th>
                    <th className="px-8 py-5 text-xs font-bold uppercase tracking-[0.18em] text-[var(--partners-text-soft)]">
                      Status
                    </th>
                    <th className="px-8 py-5 text-right text-xs font-bold uppercase tracking-[0.18em] text-[var(--partners-text-soft)]">
                      Volume (Mês)
                    </th>
                    <th className="px-8 py-5 text-right text-xs font-bold uppercase tracking-[0.18em] text-[var(--partners-text-soft)]">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(177,179,169,0.10)]">
                  {sellerRows.map((seller) => (
                    <tr
                      key={seller.id}
                      className="group transition-colors hover:bg-[var(--partners-surface-low)]"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 overflow-hidden rounded-lg bg-[var(--partners-surface-high)]">
                            <Image
                              src={seller.image}
                              alt={seller.imageAlt}
                              width={40}
                              height={40}
                              className="h-10 w-10 object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-medium text-[var(--partners-text)]">{seller.name}</p>
                            <p className="text-xs text-[var(--partners-text-soft)]">{seller.code}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-sm text-[var(--partners-text-soft)]">
                          {seller.category}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <SellerStatusPill status={seller.status} />
                      </td>
                      <td className="px-8 py-6 text-right">
                        <span className="text-sm font-medium text-[var(--partners-text)]">
                          {seller.volume}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <Link
                          href={`/adm/operacao/parceiros?seller=${seller.id}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--partners-text-soft)] transition-colors hover:text-[var(--partners-primary)]"
                          aria-label={`Abrir ${seller.name}`}
                        >
                          <MoreHorizontal className="h-4 w-4" strokeWidth={1.8} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <footer className="mt-0 flex flex-col gap-4 px-8 py-6 text-sm text-[var(--partners-text-soft)] sm:flex-row sm:items-center sm:justify-between">
              <p>
                Mostrando {sellerRows.length} de {listResult.data.meta.total} parceiros
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-[rgba(177,179,169,0.20)] transition-colors hover:bg-[var(--partners-surface-low)]"
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="h-4 w-4" strokeWidth={1.8} />
                </button>
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--partners-primary)] font-medium text-white"
                >
                  1
                </button>
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-[rgba(177,179,169,0.20)] transition-colors hover:bg-[var(--partners-surface-low)]"
                >
                  2
                </button>
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-[rgba(177,179,169,0.20)] transition-colors hover:bg-[var(--partners-surface-low)]"
                >
                  3
                </button>
                <span className="flex h-10 w-10 items-center justify-center">...</span>
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-[rgba(177,179,169,0.20)] transition-colors hover:bg-[var(--partners-surface-low)]"
                >
                  129
                </button>
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-[rgba(177,179,169,0.20)] transition-colors hover:bg-[var(--partners-surface-low)]"
                  aria-label="Próxima página"
                >
                  <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
                </button>
              </div>
            </footer>
          </section>
        </main>
      </div>
    </div>
  );
}
