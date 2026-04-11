import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ActiveChips } from "@/components/catalog/ActiveChips";
import { Filters } from "@/components/catalog/Filters";
import { CatalogProductCard } from "@/components/catalog/ProductCard";
import { SearchBar } from "@/components/catalog/SearchBar";
import { SortSelect } from "@/components/catalog/SortSelect";
import { BelaPopValidatedFooter } from "@/components/luxury/BelaPopValidatedFooter";
import { BelaPopValidatedHeader } from "@/components/luxury/BelaPopValidatedHeader";
import { getCatalogData } from "@/lib/queries/catalog";

export const revalidate = 60;
export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

type CatalogPageProps = {
  searchParams?: Promise<SearchParams>;
};

type HeaderSection = "skincare" | "maquiagem" | "cabelos" | "perfumes" | "skin-scan";

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function formatCurrencyBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
}

function resolveCatalogSection(category: string | undefined): HeaderSection {
  switch ((category ?? "").toLowerCase()) {
    case "maquiagem":
      return "maquiagem";
    case "cabelos":
      return "cabelos";
    case "perfumes":
      return "perfumes";
    case "skincare":
    default:
      return "skincare";
  }
}

function resolveLiveCategoryRoute(category: string | undefined) {
  switch ((category ?? "").toLowerCase()) {
    case "skincare":
      return "/skincare";
    case "maquiagem":
      return "/maquiagem";
    case "cabelos":
      return "/cabelos";
    case "perfumes":
      return "/perfumes";
    default:
      return null;
  }
}

export async function generateMetadata({ searchParams }: CatalogPageProps): Promise<Metadata> {
  const params = (await searchParams) ?? {};
  const q = firstParam(params.q);

  return {
    title: q ? `${q} - Catálogo | BelaPop` : "Catálogo | BelaPop",
    description: "Catálogo com filtros por marca, ritual, textura, seleção e faixa de preço.",
    openGraph: {
      title: q ? `${q} - Catálogo | BelaPop` : "Catálogo | BelaPop",
      description: "Catálogo com filtros por marca, ritual, textura, seleção e faixa de preço.",
      images: [{ url: "/editorial/presenca-diurna.svg", alt: "Catálogo BelaPop" }],
      type: "website"
    }
  };
}

export default async function CatalogoPage({ searchParams }: CatalogPageProps) {
  const params = (await searchParams) ?? {};
  const category = firstParam(params.categoria);
  const activeSection = resolveCatalogSection(category);

  const liveCategoryRoute = resolveLiveCategoryRoute(category);
  if (liveCategoryRoute) {
    redirect(liveCategoryRoute);
  }

  const { products, facets } = await getCatalogData(params);

  return (
    <div className="min-h-screen bg-bpOffWhite text-bpBlackSoft" data-belapop-page="catalogo-public">
      <BelaPopValidatedHeader activeSection={activeSection} />

      <main className="mx-auto w-full max-w-7xl px-4 pb-12 pt-24 sm:px-6 sm:pb-16 sm:pt-28 lg:pt-32">
        <section className="overflow-hidden rounded-[36px] border border-[rgba(216,160,172,0.18)] bg-[linear-gradient(135deg,#fffdfc_0%,#f6e8ea_48%,#fbf7f4_100%)] px-6 pb-8 pt-10 shadow-[0_26px_80px_rgba(91,49,56,0.07)] md:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-bpRoseGold">
                Catálogo BelaPop
              </p>
              <h1 className="mt-4 text-balance font-display text-[2.02rem] leading-[1] text-bpBlack sm:text-4xl md:text-6xl">
                Produtos organizados para facilitar sua escolha.
              </h1>
              <p className="mt-4 max-w-2xl text-[0.92rem] leading-6 text-bpGraphite/88 md:text-base md:leading-relaxed">
                Explore limpeza, tratamento, hidratação, fotoproteção e maquiagem funcional com
                filtros por uso, formulação e adaptação na pele.
              </p>
              <p className="mt-5 text-[11px] uppercase tracking-[0.18em] text-bpGraphite/66 sm:text-xs sm:tracking-[0.22em]">
                {products.length} itens encontrados / faixa {formatCurrencyBRL(facets.minPrice)} a{" "}
                {formatCurrencyBRL(facets.maxPrice)}
              </p>
              <p className="mt-2 text-xs text-bpGraphite/62">
                Seleção em construção contínua, com foco em consistência.
              </p>
              {products.length > 0 && products.length <= 6 ? (
                <p className="mt-2 text-xs text-bpGraphite/62">
                  Seleção inicial. Novos produtos estão sendo adicionados continuamente.
                </p>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[28px] border border-[rgba(216,160,172,0.16)] bg-white/72 px-5 py-5 backdrop-blur">
                <p className="text-[10px] uppercase tracking-[0.24em] text-bpRoseGold">
                  Seleção com critério
                </p>
                <p className="mt-3 font-display text-2xl text-bpBlack">
                  Seleção baseada em critérios de uso e formulação
                </p>
                <p className="mt-3 text-[0.92rem] leading-6 text-bpGraphite/88 sm:text-sm sm:leading-relaxed">
                  Filtros por ritual, textura e origem para encontrar o produto adequado para sua pele.
                </p>
              </div>
              <div className="rounded-[28px] border border-[rgba(216,160,172,0.16)] bg-white/72 px-5 py-5 backdrop-blur">
                <p className="text-[10px] uppercase tracking-[0.24em] text-bpRoseGold">
                  Curadoria BelaPop
                </p>
                <p className="mt-3 font-display text-2xl text-bpBlack">
                  Produtos vendidos por parceiros verificados
                </p>
                <p className="mt-3 text-[0.92rem] leading-6 text-bpGraphite/88 sm:text-sm sm:leading-relaxed">
                  Cada parceiro define prazo e envio. Você acompanha condições com transparência.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
            <SearchBar />
            <SortSelect />
          </div>

          <div className="mt-4">
            <ActiveChips />
          </div>
          <p className="mt-4 text-xs text-bpGraphite/62">
            Produtos vendidos por parceiros verificados. Prazo e envio definidos por cada seller.
          </p>
          <p className="mt-2 text-xs text-bpGraphite/62">
            Cada produto pode ter condições de envio e prazo diferentes.
          </p>
        </section>

        <div className="mt-8 grid gap-6 md:grid-cols-[280px_1fr]">
          <Filters facets={facets} />

          <section>
            {products.length === 0 ? (
              <div className="rounded-[28px] border border-[rgba(216,160,172,0.18)] bg-white p-7 shadow-[0_18px_44px_rgba(91,49,56,0.05)]">
                <p className="font-medium text-bpBlack">Ainda em edição.</p>
                <p className="mt-1 text-sm text-bpGraphite/70">Explore outro ritual ou limpe os filtros.</p>
                <a
                  href="/catalogo?sort=featured"
                  className="mt-4 inline-flex rounded-full bg-bpBlack px-5 py-2 text-xs uppercase tracking-[0.24em] text-bpOffWhite"
                >
                  Ver seleção disponível
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 min-[430px]:grid-cols-2 md:grid-cols-3 md:gap-6">
                {products.map((product) => (
                  <CatalogProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <BelaPopValidatedFooter />
    </div>
  );
}
