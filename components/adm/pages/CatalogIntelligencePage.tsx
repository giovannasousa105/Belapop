import Image from "next/image";
import Link from "next/link";
import { Noto_Serif } from "next/font/google";
import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  ChevronDown,
  CirclePlus,
  LayoutDashboard,
  Leaf,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  Truck,
  User,
  Wallet
} from "lucide-react";

import { getAdmDataSource } from "@/lib/adm/repositories/source";
import type { AdmFilters, SearchParamsInput } from "@/lib/adm/url";

type CatalogIntelligencePageProps = {
  filters: AdmFilters;
  searchParamsSource?: SearchParamsInput;
};

const notoSerif = Noto_Serif({
  subsets: ["latin"],
  weight: ["400", "500", "700"]
});

const theme = {
  "--ci-bg": "#f9f7f2",
  "--ci-sidebar": "#f5f4ed",
  "--ci-surface": "#ffffff",
  "--ci-surface-low": "#f1efe8",
  "--ci-surface-muted": "#efeee6",
  "--ci-border": "rgba(177, 179, 169, 0.18)",
  "--ci-text": "#1b1c19",
  "--ci-text-soft": "#6f6c65",
  "--ci-primary": "#5f5e5e",
  "--ci-secondary": "#a69080",
  "--ci-secondary-deep": "#6e5b4d",
  "--ci-tertiary": "#b34a4a",
  "--ci-shadow": "0 18px 40px rgba(49, 51, 44, 0.04)"
} as CSSProperties;

type SidebarItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  active?: boolean;
};

type DistributionItem = {
  label: string;
  share: number;
};

type BrandItem = {
  rank: string;
  brand: string;
  segment: string;
  share: string;
};

type LowPerformanceItem = {
  name: string;
  brand: string;
  image: string;
  alt: string;
  sellThrough: string;
  curationScore: string;
  action: string;
};

type Opportunity = {
  chip: string;
  title: string;
  copy: string;
  action: string;
  icon: LucideIcon;
  tone: "neutral" | "tertiary";
};

const sidebarItems: SidebarItem[] = [
  { label: "Dashboard", href: "/adm/dashboard-executivo", icon: LayoutDashboard },
  { label: "Curadoria", href: "/adm/curadoria/produtos", icon: Sparkles, active: true },
  { label: "Sellers", href: "/adm/operacao/parceiros", icon: Store },
  { label: "Pedidos", href: "/adm/operacao/pedidos-criticos", icon: ShoppingBag },
  { label: "Logística", href: "/adm/operacao/logistica", icon: Truck },
  { label: "Relatórios", href: "/adm/gestao/relatorios", icon: ShieldCheck },
  { label: "Configurações", href: "/adm/gestao/configuracoes", icon: Settings }
];

const distribution: DistributionItem[] = [
  { label: "Skincare", share: 42 },
  { label: "Maquiagem", share: 28 },
  { label: "Perfumes", share: 18 },
  { label: "Cabelos", share: 12 }
];

const brandConcentration: BrandItem[] = [
  {
    rank: "01",
    brand: "L'Occitane en Provence",
    segment: "43 SKUs • 31% do catálogo",
    share: "42%"
  },
  {
    rank: "02",
    brand: "Dior Backstage",
    segment: "18 SKUs • 19% do catálogo",
    share: "26%"
  },
  {
    rank: "03",
    brand: "Chanel",
    segment: "22 SKUs • 14% do catálogo",
    share: "18%"
  }
];

const lowPerformanceItems: LowPerformanceItem[] = [
  {
    name: "Creme Hidratante Velvet",
    brand: "L'Occitane • Skincare",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDlTeoiV_otETlWKCLKInDSnhoPVBmiElTrs_grH1iCqrmRLEImn2eB9fqa0_cg5d3F1r72ejnpsIzoSwGO7RNkjqR7ostInvZ5Z6eoMa_ZhUoIU24HZjKqKpxOgSXjPJDaGaBW3PxhWoyt0ZSLD6seY6GywXINeHcF9B76OdVIf4CwlfVgb_zOfJcVV3ofVRUXYPNOQ3B235lU9ACUanAru34SW-FxRi_Uqiveg624SLE0etF6KZQTUYLKcIHkLUqHVN5pY_PuwjwG",
    alt: "luxury skincare bottle on a marble pedestal with neutral lighting",
    sellThrough: "1.4x",
    curationScore: "64",
    action: "Revisar"
  },
  {
    name: "Eau de Parfum Intense",
    brand: "Niche Fragrance • Perfumes",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAcAsafGIELnIMr4goOOeETdU7gtktx6ZN2LGW_OO35g6yYLPw_EcpWDrE4JrQuNP26BrPWPq6o_vuCgRaw_yvniCNiRWWd7kdIWXDz4ag4CL-vMVaKdHPzOewVaPI9RNpRAniCcfjSAki2ZogRMZkrpbZmFGx28JkWZnRlDUpFNfXyCK4ZoxKepCI8cHrHWF7V7XK6mHxqY0VUB10la5sXJpL58e2Ae3xwEKvqMYtFtbrsujrYMHT74FgQfYVU174BixJuUxggIt8S",
    alt: "high-end perfume bottle on beige surface",
    sellThrough: "0.2x",
    curationScore: "58",
    action: "Revisar"
  },
  {
    name: "Batom Matte Signature",
    brand: "Maison de Beauté • Makeup",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBxqdDiXtd7yRszMdcBxzHm_Ggf_N1fkAf7pMDhxlqtf9Ux2n-etvlHb41law3b7YeeLX-WvC7DISwBHfyVBnC0WjIb0Vloc2dAUrRNiVPQxDmZk9gRZyrgRKNV06q8YeJwfs3ejE00bkqKZ6YseJT6V49umHsVlQj7GTjKi5iSDx07vYVThIGf6wPsNjgEJlct2pELWIwMOjQtMzt8MfNBYyuFHCV6-aMWiHalO9kVVQIy2lWKsL9_CQP8i7rUT1loOpbX7jaMypO_",
    alt: "minimalist makeup palette with soft earthy tones",
    sellThrough: "1.1x",
    curationScore: "72",
    action: "Revisar"
  }
];

const opportunities: Opportunity[] = [
  {
    chip: "Alta adesão",
    title: "Beleza Limpa / Clean Beauty",
    copy:
      "Crescimento de buscas acima de 41% em nichos verdes. Lacuna de 12 marcas premium na grade atual.",
    action: "Explorar nicho",
    icon: Leaf,
    tone: "neutral"
  },
  {
    chip: "Destacar",
    title: "Acessórios de Luxo",
    copy:
      "Público com recorrência elevada em compra paralela. Potencial para elevar ticket e presentear com curadoria.",
    action: "Analisar SKUs",
    icon: ShieldCheck,
    tone: "tertiary"
  },
  {
    chip: "Vendável",
    title: "Home Spa & Bem-estar",
    copy:
      "Alta associação ao site de rituais. Oportunidade de ampliar cestas com velas, banho e descanso.",
    action: "Mapear sellers",
    icon: Sparkles,
    tone: "neutral"
  }
];

function SidebarLink({ item }: { item: SidebarItem }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[11px] tracking-[0.12em] transition-colors ${
        item.active
          ? "bg-[var(--ci-surface)] font-semibold text-[var(--ci-text)] shadow-[var(--ci-shadow)]"
          : "text-[var(--ci-text-soft)] hover:bg-[rgba(255,255,255,0.72)] hover:text-[var(--ci-text)]"
      }`}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
      <span>{item.label}</span>
    </Link>
  );
}

export async function CatalogIntelligencePage({
  filters: _filters,
  searchParamsSource: _searchParamsSource
}: CatalogIntelligencePageProps) {
  const data = await getAdmDataSource();
  const sellerMap = Object.fromEntries(data.sellers.map((seller) => [seller.id, seller]));
  const distributionRows = Array.from(new Set(data.products.map((product) => product.category)))
    .map((category) => {
      const productCount = data.products.filter((product) => product.category === category).length;
      const share = Math.round((productCount / Math.max(data.products.length, 1)) * 100);
      return { label: category, share };
    })
    .sort((left, right) => right.share - left.share)
    .slice(0, 4);
  const brandRows = data.sellers
    .slice()
    .sort((left, right) => right.activeProducts - left.activeProducts)
    .slice(0, 3)
    .map((seller, index) => ({
      rank: String(index + 1).padStart(2, "0"),
      brand: seller.name,
      segment: `${seller.activeProducts} SKUs • ${seller.category}`,
      share: `${Math.round((seller.activeProducts / Math.max(data.products.length, 1)) * 100)}%`
    }));
  const lowPerformanceRows = data.products
    .slice()
    .sort((left, right) => left.qualityScore - right.qualityScore)
    .slice(0, 3)
    .map((product, index) => ({
      name: product.name,
      brand: `${sellerMap[product.sellerId]?.name ?? "Seller removido"} • ${product.category}`,
      image: lowPerformanceItems[index % lowPerformanceItems.length].image,
      alt: lowPerformanceItems[index % lowPerformanceItems.length].alt,
      sellThrough: `${Math.max(0.2, product.stock / 100).toFixed(1)}x`,
      curationScore: String(product.qualityScore),
      action: "Revisar"
    }));
  const liveOpportunities = data.sellers
    .slice()
    .sort((left, right) => right.qualityScore - left.qualityScore)
    .slice(0, 3)
    .map((seller, index) => ({
      chip: index === 0 ? "Alta adesao" : index === 1 ? "Destacar" : "Vendavel",
      title: seller.category,
      copy: `${seller.name} lidera a frente com score ${seller.qualityScore} e ${seller.activeProducts} SKU(s) ativos.`,
      action: index === 0 ? "Explorar nicho" : index === 1 ? "Analisar SKUs" : "Mapear sellers",
      icon: opportunities[index % opportunities.length].icon,
      tone: opportunities[index % opportunities.length].tone
    }));
  return (
    <div className="min-h-screen bg-[var(--ci-bg)] text-[var(--ci-text)]" style={theme}>
      <div className="mx-auto flex min-h-screen max-w-[1280px]">
        <aside className="flex w-[280px] shrink-0 flex-col border-r border-[var(--ci-border)] bg-[var(--ci-sidebar)] px-5 py-6">
          <div>
            <h1 className={`text-[1.65rem] tracking-[-0.04em] ${notoSerif.className}`}>BelaPop</h1>
            <p className="mt-1 text-[9px] uppercase tracking-[0.28em] text-[var(--ci-text-soft)]">
              Premium Curator Tech
            </p>
          </div>

          <nav className="mt-8 space-y-2">
            {sidebarItems.map((item) => (
              <SidebarLink key={item.href} item={item} />
            ))}
          </nav>

          <div className="mt-auto">
            <button
              type="button"
              className="flex min-h-9 w-full items-center justify-center gap-2 rounded-md bg-[var(--ci-primary)] px-4 text-[9px] font-semibold uppercase tracking-[0.24em] text-white"
            >
              <CirclePlus className="h-3.5 w-3.5" strokeWidth={2} />
              Novo SKU
            </button>

            <div className="mt-6 space-y-3 border-t border-[var(--ci-border)] pt-4 text-[10px] uppercase tracking-[0.22em] text-[var(--ci-text-soft)]">
              <button type="button" className="flex items-center gap-2">
                <User className="h-3.5 w-3.5" strokeWidth={1.8} />
                Logout
              </button>
              <button type="button" className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.8} />
                Sair
              </button>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="flex h-[72px] items-center justify-between border-b border-[var(--ci-border)] px-8">
            <nav className="flex items-center gap-8 text-[11px] text-[var(--ci-text-soft)]">
              <Link href="/adm" className="hover:text-[var(--ci-text)]">
                Visão Geral
              </Link>
              <Link href="/adm/gestao/log-atividades" className="font-semibold text-[var(--ci-text)] underline decoration-[var(--ci-primary)] underline-offset-8">
                Audit
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--ci-text-soft)]" strokeWidth={1.8} />
                <input
                  type="text"
                  placeholder="Buscar produtos ou marcas"
                  className="h-9 w-[220px] rounded-full border border-[var(--ci-border)] bg-[var(--ci-surface)] pl-9 pr-3 text-[11px] text-[var(--ci-text)] outline-none placeholder:text-[var(--ci-text-soft)]"
                />
              </label>
              <button type="button" className="text-[var(--ci-text-soft)]" aria-label="Notificações">
                <Bell className="h-4 w-4" strokeWidth={1.8} />
              </button>
              <button type="button" className="text-[var(--ci-text-soft)]" aria-label="Conta">
                <User className="h-4 w-4" strokeWidth={1.8} />
              </button>
            </div>
          </header>

          <div className="px-8 py-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className={`text-[2.2rem] tracking-[-0.04em] ${notoSerif.className}`}>
                  Inteligência de Catálogo
                </h2>
                <p className="mt-1 text-sm text-[var(--ci-text-soft)]">
                  Análise qualitativa do portfólio e equilíbrio interno.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="inline-flex min-h-8 items-center gap-2 rounded-full border border-[var(--ci-border)] bg-[var(--ci-surface)] px-3 text-[10px] uppercase tracking-[0.18em] text-[var(--ci-text-soft)]"
                >
                  Últimos 30 dias
                  <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.8} />
                </button>
                <button
                  type="button"
                  className="inline-flex min-h-8 items-center gap-2 rounded-full border border-[var(--ci-border)] bg-[var(--ci-surface-low)] px-3 text-[10px] uppercase tracking-[0.18em] text-[var(--ci-text-soft)]"
                >
                  Filtros
                </button>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-5">
              <section className="col-span-8 rounded-2xl border border-[var(--ci-border)] bg-[var(--ci-surface)] p-5 shadow-[var(--ci-shadow)]">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className={`text-lg ${notoSerif.className}`}>Distribuição por Categoria</h3>
                  <span className="text-[9px] uppercase tracking-[0.2em] text-[var(--ci-text-soft)]">
                    Análise de Portfólio
                  </span>
                </div>

                <div className="space-y-5">
                  {(distributionRows.length > 0 ? distributionRows : distribution).map((item) => (
                    <div key={item.label}>
                      <div className="mb-2 flex justify-between text-[11px]">
                        <span className="font-medium text-[var(--ci-text)]">{item.label}</span>
                        <span className="text-[var(--ci-text-soft)]">{item.share}%</span>
                      </div>
                      <div className="h-px w-full bg-[rgba(177,179,169,0.28)]">
                        <div
                          className="h-px bg-[var(--ci-primary)]"
                          style={{ width: `${item.share}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="col-span-4 rounded-2xl border border-[var(--ci-border)] bg-[var(--ci-surface)] p-5 shadow-[var(--ci-shadow)]">
                <h3 className={`text-lg ${notoSerif.className}`}>Concentração por Marca</h3>

                <div className="mt-5 space-y-3">
                  {(brandRows.length > 0 ? brandRows : brandConcentration).map((item) => (
                    <div
                      key={item.rank}
                      className="flex items-center justify-between rounded-xl border border-[var(--ci-border)] bg-[var(--ci-bg)] px-3 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--ci-surface-muted)] text-[9px] font-semibold text-[var(--ci-text-soft)]">
                          {item.rank}
                        </span>
                        <div>
                          <p className="text-[11px] font-semibold text-[var(--ci-text)]">{item.brand}</p>
                          <p className="text-[10px] text-[var(--ci-text-soft)]">{item.segment}</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-[var(--ci-primary)]">{item.share}</span>
                    </div>
                  ))}
                </div>

                <p className="mt-5 text-[10px] leading-5 text-[var(--ci-text-soft)]">
                  Índice de concentração: <span className="font-semibold text-[var(--ci-text)]">saudável</span> / dependência moderada em marcas âncora.
                </p>
              </section>

              <section className="col-span-12 mt-2">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className={`text-lg ${notoSerif.className}`}>Produtos com Baixa Performance</h3>
                  <Link
                    href="/adm/catalogo-marca/reviews"
                    className="text-[10px] uppercase tracking-[0.2em] text-[var(--ci-text-soft)]"
                  >
                    Ver relatório completo
                  </Link>
                </div>

                <div className="overflow-hidden rounded-2xl border border-[var(--ci-border)] bg-[var(--ci-surface)] shadow-[var(--ci-shadow)]">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="text-[9px] uppercase tracking-[0.2em] text-[var(--ci-text-soft)]">
                        <th className="px-4 py-3">Produto</th>
                        <th className="px-4 py-3 text-right">Sell-thru</th>
                        <th className="px-4 py-3 text-right">Curadoria / Score</th>
                        <th className="px-4 py-3 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[rgba(177,179,169,0.12)]">
                      {(lowPerformanceRows.length > 0 ? lowPerformanceRows : lowPerformanceItems).map((item) => (
                        <tr key={item.name}>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <Image
                                src={item.image}
                                alt={item.alt}
                                width={36}
                                height={36}
                                className="h-9 w-9 rounded-md object-cover"
                              />
                              <div>
                                <p className="text-[11px] font-semibold text-[var(--ci-text)]">{item.name}</p>
                                <p className="text-[10px] text-[var(--ci-text-soft)]">{item.brand}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right text-[11px] text-[var(--ci-text)]">{item.sellThrough}</td>
                          <td className="px-4 py-4 text-right text-[11px] font-medium text-[var(--ci-tertiary)]">
                            {item.curationScore}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <button
                              type="button"
                              className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ci-primary)]"
                            >
                              {item.action}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="col-span-12 mt-1">
                <h3 className={`mb-4 text-lg ${notoSerif.className}`}>Oportunidades de Expansão</h3>

                <div className="grid grid-cols-3 gap-4">
                  {(liveOpportunities.length > 0 ? liveOpportunities : opportunities).map((item) => {
                    const Icon = item.icon;
                    const chipClass =
                      item.tone === "tertiary"
                        ? "bg-[rgba(179,74,74,0.08)] text-[var(--ci-tertiary)]"
                        : "bg-[var(--ci-surface-muted)] text-[var(--ci-text-soft)]";

                    return (
                      <article
                        key={item.title}
                        className="rounded-2xl border border-[var(--ci-border)] bg-[var(--ci-surface-low)] p-4"
                      >
                        <div className="mb-4 flex items-center justify-between">
                          <Icon className="h-3.5 w-3.5 text-[var(--ci-text-soft)]" strokeWidth={1.8} />
                          <span className={`rounded-full px-2 py-1 text-[8px] uppercase tracking-[0.18em] ${chipClass}`}>
                            {item.chip}
                          </span>
                        </div>
                        <h4 className={`text-[1rem] leading-5 text-[var(--ci-text)] ${notoSerif.className}`}>
                          {item.title}
                        </h4>
                        <p className="mt-3 text-[10px] leading-5 text-[var(--ci-text-soft)]">{item.copy}</p>
                        <button
                          type="button"
                          className="mt-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ci-text)]"
                        >
                          {item.action}
                        </button>
                      </article>
                    );
                  })}
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
