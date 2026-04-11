"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Flower2,
  Search,
  Sparkles,
  SunMedium,
  Waves
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type SkincareProduct = {
  id: string;
  slug: string;
  title: string;
  category: string | null;
  brand: string | null;
  priceCents: number;
  currency: string | null;
  heroImageUrl: string | null;
};

type Props = { products: SkincareProduct[] };

const primaryFilters = [
  "Todos",
  "Limpeza",
  "Seruns",
  "Hidratacao",
  "Protecao",
  "Olhos",
  "Mascaras"
] as const;

const refinementFilters = [
  "Tipo de pele",
  "Necessidade",
  "Textura",
  "Ativos",
  "Marca",
  "Preco",
  "Avaliacao"
] as const;

const sortOptions = [
  "Mais desejados",
  "Lancamentos",
  "Menor preco",
  "Maior preco",
  "Melhor avaliados"
] as const;

const ritualSteps = [
  {
    icon: Waves,
    title: "1. Limpar",
    description:
      "Remova impurezas preservando a barreira da pele e preparando a textura para absorver melhor cada ativo."
  },
  {
    icon: Sparkles,
    title: "2. Tratar",
    description:
      "Seruns concentrados e formulas de alta performance para uniformizar, regenerar e iluminar."
  },
  {
    icon: Flower2,
    title: "3. Hidratar",
    description:
      "Cremes e emulsões com toque sensorial para selar conforto, elasticidade e viço."
  },
  {
    icon: SunMedium,
    title: "4. Proteger",
    description:
      "Fotoprotecao diaria com acabamento sofisticado para preservar o ritual e a luminosidade."
  }
] as const;

const ITEMS_PER_PAGE = 15;

function normalizeText(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function formatPrice(priceCents: number, currency = "BRL") {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency
  }).format((priceCents || 0) / 100);
}

function resolveCategory(product: SkincareProduct) {
  const normalized = normalizeText(
    `${product.title} ${product.category ?? ""} ${product.brand ?? ""}`
  );

  if (/(cleanser|sabonete|limpeza|gel de limpeza|espuma)/.test(normalized)) return "Limpeza";
  if (/(serum|seruns|essence|tonico|booster|ampola)/.test(normalized)) return "Seruns";
  if (/(olhos|eye|eye lift)/.test(normalized)) return "Olhos";
  if (/(fps|solar|protecao|uv)/.test(normalized)) return "Protecao";
  if (/(mascara|mask|esfoliante|detox)/.test(normalized)) return "Mascaras";

  return "Hidratacao";
}

function previewRating(product: SkincareProduct) {
  return (product.title.length * 13 + product.priceCents) % 500;
}

export function SkincareCatalogExperience({ products }: Props) {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] =
    useState<(typeof primaryFilters)[number]>("Todos");
  const [activeRefinement, setActiveRefinement] =
    useState<(typeof refinementFilters)[number]>("Tipo de pele");
  const [activeSort, setActiveSort] =
    useState<(typeof sortOptions)[number]>("Mais desejados");
  const [activePage, setActivePage] = useState(1);
  const carouselRef = useRef<HTMLDivElement>(null);

  const hotProducts = useMemo(() => products.slice(0, 2), [products]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = normalizeText(query);

    return products.filter((product) => {
      const category = resolveCategory(product);
      const matchesFilter = activeFilter === "Todos" || category === activeFilter;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        normalizeText(`${product.title} ${product.brand ?? ""} ${category}`).includes(
          normalizedQuery
        );

      return matchesFilter && matchesQuery;
    });
  }, [activeFilter, products, query]);

  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts];

    switch (activeSort) {
      case "Lancamentos":
        return list.reverse();
      case "Menor preco":
        return list.sort((a, b) => a.priceCents - b.priceCents);
      case "Maior preco":
        return list.sort((a, b) => b.priceCents - a.priceCents);
      case "Melhor avaliados":
        return list.sort((a, b) => previewRating(b) - previewRating(a));
      default:
        return list;
    }
  }, [activeSort, filteredProducts]);

  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / ITEMS_PER_PAGE));

  const paginatedProducts = useMemo(
    () => sortedProducts.slice((activePage - 1) * ITEMS_PER_PAGE, activePage * ITEMS_PER_PAGE),
    [activePage, sortedProducts]
  );

  const visiblePages = useMemo(() => {
    if (totalPages <= 3) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    if (activePage <= 2) {
      return [1, 2, 3];
    }

    if (activePage >= totalPages - 1) {
      return [totalPages - 2, totalPages - 1, totalPages];
    }

    return [activePage - 1, activePage, activePage + 1];
  }, [activePage, totalPages]);

  useEffect(() => {
    setActivePage(1);
  }, [activeFilter, activeSort, query]);

  const scrollCarousel = (direction: "left" | "right") => {
    carouselRef.current?.scrollBy({
      left: direction === "left" ? -260 : 260,
      behavior: "smooth"
    });
  };

  return (
    <div
      className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b]"
      data-belapop-page="skincare-public"
    >
      <main className="bg-[#fcf9f8]">
        <section className="bg-[#f6f1ed]">
          <Link href="/skin-scan" className="group block">
            <div className="relative overflow-hidden bg-[#f6f1ed] lg:min-h-[410px]">
              <div
                className="absolute inset-0 z-10"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(246,241,237,0.98) 0%, rgba(244,238,232,0.94) 24%, rgba(240,233,226,0.7) 44%, rgba(235,226,216,0.28) 68%, rgba(233,223,214,0) 100%)"
                }}
              />
              <Image
                alt="Close-up de pele iluminada"
                className="relative z-[1] h-[280px] w-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0 lg:h-[410px] lg:object-contain lg:object-right-top"
                height={820}
                priority
                sizes="100vw"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBNFRqFmSxF-LiL0_W_2fIwuymOiSnxO6akSIgQ2325O8jkQVoNNyHGgjDdK_QWsyisynuhJneqokGiGw0x3zxtQA_a7O4hzmqxw1Uo5lGrnpXmvqEC4znUasqovLLJw-7VkUadU8y3OoGLRvnmFVR0qBDCPbnugBbhslljRqWhWTedVh5V4DRVCdgeMU4h-a616YiMFZre2J9VIKkEyWgmSQJLM9eb60tr6Mzpa4g110tx1EEZH2fzvAILSfJuOirv3-1WEBmTXCgR"
                width={1600}
              />
              <div className="absolute inset-0 z-20 flex flex-col justify-end p-6 pb-8 lg:justify-center lg:px-16">
                <span className="mb-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#ed93d5]">
                  Inteligencia Artificial
                </span>
                <h1 className="max-w-[11ch] font-display text-[2.9rem] leading-[0.92] tracking-[-0.04em] text-[#603842] lg:text-[4.6rem]">
                  Skin Scan Bela
                </h1>
                <p className="mt-4 max-w-[18ch] text-lg leading-8 text-[#2e3538] lg:max-w-[30ch] lg:text-[1.1rem]">
                  Analise sua pele em segundos e receba sua rotina personalizada.
                </p>
                <div className="mt-7 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#603842]">
                  <span className="underline decoration-[#ed93d5] underline-offset-4">
                    Comecar agora
                  </span>
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </div>
            </div>
          </Link>
        </section>

        <section className="px-6 py-6 lg:hidden">
          <div className="rounded-[28px] border border-black/8 bg-[#f6f3f2] p-4">
            <div className="flex items-center gap-3 border-b border-black/8 pb-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#1c1b1b] shadow-[0_10px_24px_rgba(0,0,0,0.06)]">
                <Search className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <label
                  htmlFor="skincare-search"
                  className="mb-1 block text-[10px] uppercase tracking-[0.24em] text-[#444748]"
                >
                  Buscar skincare
                </label>
                <input
                  id="skincare-search"
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Serum, limpeza, hidratacao..."
                  className="h-11 w-full border-0 bg-transparent px-0 py-0 text-sm text-[#1c1b1b] placeholder:text-[#747878]/70 focus:outline-none focus:ring-0"
                />
              </div>
            </div>

            <div className="mt-4">
              <p className="mb-3 text-[10px] uppercase tracking-[0.28em] text-[#444748]">
                Categorias
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {primaryFilters.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setActiveFilter(filter)}
                    className={`shrink-0 rounded-full border px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors ${
                      activeFilter === filter
                        ? "border-black bg-black text-white"
                        : "border-black/10 bg-white text-[#1c1b1b] hover:bg-black hover:text-white"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <p className="mb-3 text-[10px] uppercase tracking-[0.28em] text-[#444748]">
                Filtros personalizados
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {refinementFilters.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setActiveRefinement(filter)}
                    className={`shrink-0 rounded-full border px-4 py-3 text-[11px] font-medium tracking-[0.08em] transition-colors ${
                      activeRefinement === filter
                        ? "border-[#1c1b1b] bg-[#1c1b1b] text-white"
                        : "border-black/10 bg-white text-[#5f595b] hover:border-[#c9b8be] hover:text-[#1c1b1b]"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#f6f3f2] py-16 lg:py-24">
          <div className="mx-auto mb-8 flex max-w-[1440px] items-end justify-between gap-4 px-6 lg:px-8">
            <div>
              <span className="mb-2 block text-[10px] uppercase tracking-[0.3em] text-[#444748]">
                Tendencias
              </span>
              <h2 className="font-display text-[2.2rem] leading-none text-[#1c1b1b] lg:text-[3.2rem]">
                Hot Products
              </h2>
            </div>

            <div className="flex items-end gap-4">
              <div className="flex gap-2">
                <button
                  type="button"
                  aria-label="Voltar produtos"
                  className="flex h-10 w-10 items-center justify-center border border-black/20 transition-colors hover:bg-white"
                  onClick={() => scrollCarousel("left")}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="Avancar produtos"
                  className="flex h-10 w-10 items-center justify-center border border-black/20 transition-colors hover:bg-white"
                  onClick={() => scrollCarousel("right")}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <Link
                href="/catalogo?categoria=skincare"
                className="border-b border-black pb-1 text-xs uppercase tracking-[0.18em]"
              >
                Ver tudo
              </Link>
            </div>
          </div>

          <div
            ref={carouselRef}
            className="flex snap-x snap-mandatory gap-6 overflow-x-auto px-6 pb-2 [scrollbar-width:none] lg:mx-auto lg:grid lg:max-w-[1440px] lg:grid-cols-2 lg:overflow-visible lg:px-8 [&::-webkit-scrollbar]:hidden"
          >
            {hotProducts.map((product, index) => (
              <article
                key={product.id || `${product.title}-${index}`}
                className="min-w-0 shrink-0 basis-[calc((100%-1.5rem)/2)] bg-white lg:basis-auto"
              >
                <Link href={`/produto/${product.slug}`} className="block">
                  <div className="relative aspect-[3/4] overflow-hidden bg-[#f1eeeb] lg:aspect-[4/5]">
                    {product.heroImageUrl ? (
                      <Image
                        alt={product.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1023px) 50vw, 40vw"
                        src={product.heroImageUrl}
                      />
                    ) : null}
                  </div>
                </Link>
                <div className="p-3 lg:p-6">
                  <span
                    className={`text-[10px] uppercase tracking-[0.18em] ${
                      index === 0 ? "font-bold text-[#ed93d5]" : "text-[#444748]"
                    }`}
                  >
                    {index === 0 ? "Limited Edition" : "Mais Vendido"}
                  </span>
                  <h3 className="mt-1 font-display text-[1.15rem] leading-tight text-[#1c1b1b] lg:text-[2rem]">
                    {product.title}
                  </h3>
                  <p className="mb-3 mt-1 text-[13px] leading-5 text-[#444748] lg:mb-5 lg:text-base lg:leading-7">
                    {product.brand || resolveCategory(product)}
                  </p>
                  <Link
                    href={`/produto/${product.slug}`}
                    className="inline-flex min-h-12 w-full items-center justify-center bg-black px-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition-colors hover:bg-black/90 lg:min-h-[56px]"
                  >
                    Adicionar a sacola
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-[#fcf9f8] px-6 py-24 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-[1440px]">
            <div className="mb-12 text-center">
              <h2 className="font-display text-[2.25rem] leading-none text-[#1c1b1b]">
                Nossa Colecao
              </h2>

              <div className="mt-5 hidden gap-6 overflow-x-auto pb-1 [scrollbar-width:none] lg:flex lg:justify-center [&::-webkit-scrollbar]:hidden">
                {primaryFilters.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setActiveFilter(filter)}
                    className={`shrink-0 border-b pb-1 font-display text-[1.02rem] leading-none transition-colors ${
                      activeFilter === filter
                        ? "border-[#1c1b1b] text-[#1c1b1b]"
                        : "border-transparent text-[#6b6467] hover:border-[#c9b8be] hover:text-[#4f474a]"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              <div className="mt-6 hidden gap-3 overflow-x-auto pb-1 [scrollbar-width:none] lg:flex lg:justify-center [&::-webkit-scrollbar]:hidden">
                {refinementFilters.map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setActiveRefinement(filter)}
                    className={`shrink-0 rounded-full border px-4 py-2 text-[11px] font-medium tracking-[0.08em] transition-colors ${
                      activeRefinement === filter
                        ? "border-[#1c1b1b] bg-[#1c1b1b] text-white"
                        : "border-black/10 bg-white text-[#5f595b] hover:border-[#c9b8be] hover:text-[#1c1b1b]"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              <div className="mt-5 flex flex-col items-center gap-3 lg:flex-row lg:justify-between">
                <p className="text-sm text-[#5f595b]">{filteredProducts.length} produtos em skincare</p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {sortOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setActiveSort(option)}
                      className={`rounded-full px-3 py-2 text-[11px] tracking-[0.08em] transition-colors ${
                        activeSort === option
                          ? "bg-[#efe8e2] text-[#1c1b1b]"
                          : "text-[#6b6467] hover:text-[#1c1b1b]"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <p className="mt-4 text-[11px] text-[#8a8486]">
                Curadoria refinada para explorar textura, ativos e performance.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-16 lg:grid-cols-5 lg:gap-x-6 lg:gap-y-20">
              {paginatedProducts.map((product) => (
                <article key={product.id} className="flex flex-col">
                  <Link href={`/produto/${product.slug}`} className="group block">
                    <div className="relative mb-4 aspect-[4/5] overflow-hidden bg-[#f6f3f2]">
                      {product.heroImageUrl ? (
                        <Image
                          alt={product.title}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                          sizes="(max-width: 1023px) 50vw, 20vw"
                          src={product.heroImageUrl}
                        />
                      ) : (
                        <div className="h-full w-full bg-[#ece7e2]" />
                      )}
                    </div>
                  </Link>
                  <p className="text-[10px] uppercase tracking-[0.24em] text-[#444748]">
                    {product.brand || "Bela Atelier"}
                  </p>
                  <h3 className="mt-1 font-display text-[1.2rem] leading-tight text-[#1c1b1b]">
                    {product.title}
                  </h3>
                  <p className="mt-1 text-sm text-[#444748]">
                    {formatPrice(product.priceCents, product.currency ?? "BRL")}
                  </p>
                  <Link
                    href={`/produto/${product.slug}`}
                    className="mt-4 inline-flex min-h-12 items-center justify-center bg-black px-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-white transition-colors hover:bg-black/90"
                  >
                    Ver produto
                  </Link>
                </article>
              ))}
            </div>

            {paginatedProducts.length === 0 ? (
              <div className="mt-10 rounded-[28px] border border-black/8 bg-[#f6f3f2] px-6 py-10 text-center">
                <p className="font-display text-2xl text-[#1c1b1b]">Nenhum item encontrado</p>
                <p className="mt-3 text-sm leading-6 text-[#444748]">
                  Tente outro termo ou ajuste a categoria para explorar a curadoria de skincare.
                </p>
              </div>
            ) : null}

            {totalPages > 1 ? (
              <div className="mt-12 flex items-center justify-center gap-3 lg:mt-14">
                {visiblePages.map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setActivePage(page)}
                    className={`flex h-11 min-w-[44px] items-center justify-center border px-4 text-sm font-semibold transition-colors ${
                      activePage === page
                        ? "border-black bg-black text-white"
                        : "border-black/12 bg-white text-[#1c1b1b] hover:bg-[#f6f3f2]"
                    }`}
                  >
                    {page}
                  </button>
                ))}

                {totalPages > 3 ? (
                  <>
                    <span className="px-1 text-sm text-[#747878]">...</span>
                    <button
                      type="button"
                      onClick={() => setActivePage(totalPages)}
                      className="flex h-11 min-w-[44px] items-center justify-center border border-black/12 bg-white px-4 text-sm font-semibold text-[#1c1b1b] transition-colors hover:bg-[#f6f3f2]"
                    >
                      {totalPages}
                    </button>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>

        <section className="border-t border-[#e7e0d9] bg-[#fcf9f8] px-8 py-24">
          <div className="mx-auto max-w-[1120px]">
            <div className="mx-auto mb-16 max-w-lg text-center">
              <span className="block text-[9px] uppercase tracking-[0.5em] text-[#6b6467]/80">
                The Routine
              </span>
              <h2 className="mt-4 font-display text-[2.25rem] leading-none text-[#1c1b1b]">
                O Seu Ritual BelaPop
              </h2>
              <div className="mx-auto mt-6 h-px w-10 bg-[#ed93d5]" />
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-16 lg:grid-cols-4">
              {ritualSteps.map((step) => {
                const Icon = step.icon;

                return (
                  <div key={step.title} className="flex flex-col items-center text-center">
                    <Icon className="mb-4 h-6 w-6 text-[#5e5a5d]" />
                    <h3 className="font-display text-lg text-[#1c1b1b]">{step.title}</h3>
                    <p className="mt-2 text-[11px] leading-relaxed text-[#5e5a5d]">
                      {step.description}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-20 text-center">
              <div className="mx-auto mb-2 h-px w-24 bg-black/10" />
              <span className="text-[8px] uppercase tracking-[0.3em] text-[#6b6467]/70">
                Dermatologicamente testado
              </span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
