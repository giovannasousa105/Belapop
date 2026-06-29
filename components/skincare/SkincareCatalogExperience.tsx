"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Flower2,
  Heart,
  Search,
  ShoppingBag,
  Sparkles,
  SunMedium,
  Waves,
  X
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { brandCtas } from "@/lib/brand/ctas";
import { useCart } from "@/lib/CartContext";
import {
  CATALOG_PRODUCTS,
  type CatalogProduct,
  type ConcernFilter,
  type SkinTypeFilter,
} from "@/lib/catalog-search";
import { useFavorites } from "@/lib/favorites";

type SkincareProductInput = {
  id: string;
  slug: string;
  title: string;
  category: string | null;
  brand: string | null;
  priceCents: number;
  currency: string | null;
  heroImageUrl: string | null;
};

type SkincareProduct = SkincareProductInput & { catalog: CatalogProduct };

type Props = { products: SkincareProductInput[] };

const primaryFilters = [
  "Todos",
  "Limpeza",
  "Seruns",
  "Hidratação",
  "Proteção",
  "Olhos",
  "Mascaras"
] as const;

type RefinementTab = "Tipo de pele" | "Necessidade";

const SKIN_TYPE_OPTIONS: { key: SkinTypeFilter; label: string }[] = [
  { key: "oleosa", label: "Oleosa" },
  { key: "seca", label: "Seca" },
  { key: "mista", label: "Mista" },
  { key: "normal", label: "Normal" },
  { key: "sensível", label: "Sensível" },
];

const CONCERN_OPTIONS: { key: ConcernFilter; label: string }[] = [
  { key: "acne", label: "Acne" },
  { key: "manchas", label: "Manchas" },
  { key: "oleosidade", label: "Oleosidade" },
  { key: "hidratação", label: "Hidratação" },
  { key: "linhas-finas", label: "Linhas Finas" },
  { key: "poros", label: "Poros" },
  { key: "luminosidade", label: "Luminosidade" },
  { key: "olheiras", label: "Olheiras" },
  { key: "textura", label: "Textura" },
];

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
      "Seruns e formulas de cuidado para apoiar uniformidade, conforto e luminosidade na rotina."
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

const CATEGORY_MAP: Record<(typeof primaryFilters)[number], string | null> = {
  Todos: null,
  Limpeza: "limpeza",
  Seruns: "serum",
  "Hidratação": "hidratante",
  "Proteção": "proteção",
  Olhos: "olhos",
  Mascaras: "olhos",
};

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
  if (/(fps|solar|proteção|uv)/.test(normalized)) return "Proteção";
  if (/(mascara|mask|esfoliante|detox)/.test(normalized)) return "Mascaras";

  return "Hidratação";
}

function previewRating(product: SkincareProduct) {
  return (product.title.length * 13 + product.priceCents) % 500;
}

function isPrimaryFilter(value: string | null): value is (typeof primaryFilters)[number] {
  return !!value && (primaryFilters as readonly string[]).includes(value);
}

function isSortOption(value: string | null): value is (typeof sortOptions)[number] {
  return !!value && (sortOptions as readonly string[]).includes(value);
}

function isSkinType(value: string | null): value is SkinTypeFilter {
  return !!value && SKIN_TYPE_OPTIONS.some((option) => option.key === value);
}

function isConcern(value: string | null): value is ConcernFilter {
  return !!value && CONCERN_OPTIONS.some((option) => option.key === value);
}

export function SkincareCatalogExperience({ products }: Props) {
  const { addItem } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [activeFilter, setActiveFilter] = useState<(typeof primaryFilters)[number]>(
    () => {
      const fromUrl = searchParams.get("categoria");
      return isPrimaryFilter(fromUrl) ? fromUrl : "Todos";
    }
  );
  const [activeRefinementTab, setActiveRefinementTab] = useState<RefinementTab | null>(null);
  const [activeSkinType, setActiveSkinType] = useState<SkinTypeFilter | null>(() => {
    const fromUrl = searchParams.get("tipoPele");
    return isSkinType(fromUrl) ? fromUrl : null;
  });
  const [activeConcern, setActiveConcern] = useState<ConcernFilter | null>(() => {
    const fromUrl = searchParams.get("necessidade");
    return isConcern(fromUrl) ? fromUrl : null;
  });
  const [activeSort, setActiveSort] = useState<(typeof sortOptions)[number]>(() => {
    const fromUrl = searchParams.get("ordenar");
    return isSortOption(fromUrl) ? fromUrl : "Mais desejados";
  });
  const [activePage, setActivePage] = useState(() => {
    const fromUrl = Number(searchParams.get("pagina"));
    return Number.isInteger(fromUrl) && fromUrl > 0 ? fromUrl : 1;
  });
  const [quickAdded, setQuickAdded] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (activeFilter !== "Todos") params.set("categoria", activeFilter);
    if (activeSkinType) params.set("tipoPele", activeSkinType);
    if (activeConcern) params.set("necessidade", activeConcern);
    if (activeSort !== "Mais desejados") params.set("ordenar", activeSort);
    if (activePage > 1) params.set("pagina", String(activePage));

    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [query, activeFilter, activeSkinType, activeConcern, activeSort, activePage, pathname, router]);

  const handleQuickAdd = (product: SkincareProduct, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    addItem(product.id, 1, "belapop");
    setQuickAdded(product.id);
    window.setTimeout(() => setQuickAdded(null), 1500);
  };

  const sourceProducts = useMemo<SkincareProduct[]>(() => {
    const apiProductsBySlug = new Map(products.map((product) => [product.slug, product]));

    return CATALOG_PRODUCTS
      .filter((product) => !["cabelos", "maquiagem"].includes(product.category))
      .map((catalogProduct) => {
        const apiProduct = apiProductsBySlug.get(catalogProduct.slug);

        return {
          brand: apiProduct?.brand ?? "BelaPop",
          catalog: catalogProduct,
          category: catalogProduct.category,
          currency: apiProduct?.currency ?? "BRL",
          heroImageUrl: apiProduct?.heroImageUrl ?? null,
          id: apiProduct?.id ?? catalogProduct.slug,
          priceCents: apiProduct?.priceCents ?? Math.round((catalogProduct.price ?? 0) * 100),
          slug: catalogProduct.slug,
          title: catalogProduct.name,
        };
      });
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = normalizeText(query);

    const filtered = sourceProducts.filter((product) => {
      const catalog = product.catalog;
      const targetCategory = CATEGORY_MAP[activeFilter];
      if (targetCategory && catalog.category !== targetCategory) return false;

      if (normalizedQuery.length > 0) {
        const searchable = normalizeText(
          [
            catalog.name,
            catalog.category,
            ...catalog.keyActives,
            ...catalog.tags,
            ...catalog.searchTerms,
            ...catalog.concerns,
            ...catalog.skinTypes,
          ].join(" "),
        );
        if (!searchable.includes(normalizedQuery)) return false;
      }

      if (
        activeSkinType &&
        catalog.skinTypes.length > 0 &&
        !catalog.skinTypes.includes(activeSkinType)
      ) {
        return false;
      }

      if (activeConcern && !catalog.concerns.includes(activeConcern)) {
        return false;
      }

      return true;
    });

    return filtered.filter(
      (product, index, self) =>
        self.findIndex((candidate) => candidate.slug === product.slug) === index,
    );
  }, [activeFilter, sourceProducts, query, activeSkinType, activeConcern]);

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
  }, [activeFilter, activeSort, query, activeSkinType, activeConcern]);


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
                  placeholder="Serum, limpeza, hidratação..."
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
                {(["Tipo de pele", "Necessidade"] as RefinementTab[]).map((tab) => {
                  const isActive = activeRefinementTab === tab;
                  const hasValue =
                    (tab === "Tipo de pele" && activeSkinType) ||
                    (tab === "Necessidade" && activeConcern);
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveRefinementTab(isActive ? null : tab)}
                      className={`shrink-0 rounded-full border px-4 py-3 text-[11px] font-medium tracking-[0.08em] transition-colors ${
                        isActive || hasValue
                          ? "border-[#1c1b1b] bg-[#1c1b1b] text-white"
                          : "border-black/10 bg-white text-[#5f595b] hover:border-[#c9b8be] hover:text-[#1c1b1b]"
                      }`}
                    >
                      {tab}
                    </button>
                  );
                })}
              </div>
              {activeRefinementTab === "Tipo de pele" && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {SKIN_TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setActiveSkinType(activeSkinType === opt.key ? null : opt.key)}
                      className={`rounded-full border px-3 py-1.5 text-[11px] transition-colors ${
                        activeSkinType === opt.key
                          ? "border-[#1c1b1b] bg-[#1c1b1b] text-white"
                          : "border-black/10 bg-white text-[#5f595b] hover:border-[#c9b8be]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
              {activeRefinementTab === "Necessidade" && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {CONCERN_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setActiveConcern(activeConcern === opt.key ? null : opt.key)}
                      className={`rounded-full border px-3 py-1.5 text-[11px] transition-colors ${
                        activeConcern === opt.key
                          ? "border-[#1c1b1b] bg-[#1c1b1b] text-white"
                          : "border-black/10 bg-white text-[#5f595b] hover:border-[#c9b8be]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="bg-[#f6f3f2] px-6 py-10 lg:px-8 lg:py-14">
          <div className="mx-auto max-w-[1440px] flex items-center justify-between gap-6 border-b border-black/10 pb-8">
            <div>
              <span className="block text-[10px] uppercase tracking-[0.3em] text-[#444748]">
                Curadoria BelaPop
              </span>
              <p className="mt-2 text-sm leading-7 text-[#5f595b]">
                Seleção atualizada semanalmente com foco em performance, textura e resultados reais.
              </p>
            </div>
            <time
              dateTime={new Date().toISOString().slice(0, 10)}
              className="shrink-0 text-[10px] uppercase tracking-[0.18em] text-[#8a8486]"
            >
              {new Date().toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}
            </time>
          </div>
        </section>

        <section className="bg-[#fcf9f8] px-6 py-24 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-[1440px]">
            <div className="mb-12 text-center">
              <h2 className="font-display text-[2.25rem] leading-none text-[#1c1b1b]">
                Nossa Colecao
              </h2>

              <div className="mx-auto mt-5 hidden max-w-md items-center gap-3 rounded-full border border-black/10 bg-white px-5 py-3 text-left shadow-sm lg:flex">
                <Search className="h-4 w-4 shrink-0 text-[#747878]" />
                <input
                  id="skincare-search-desktop"
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar por ativo, produto ou necessidade"
                  className="h-8 min-w-0 flex-1 border-0 bg-transparent text-sm text-[#1c1b1b] placeholder:text-[#747878]/70 focus:outline-none focus:ring-0"
                />
              </div>

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

              <div className="mt-6 hidden flex-col items-center gap-3 lg:flex">
                <div className="flex gap-3">
                  {(["Tipo de pele", "Necessidade"] as RefinementTab[]).map((tab) => {
                    const isActive = activeRefinementTab === tab;
                    const hasValue =
                      (tab === "Tipo de pele" && activeSkinType) ||
                      (tab === "Necessidade" && activeConcern);
                    return (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveRefinementTab(isActive ? null : tab)}
                        className={`shrink-0 rounded-full border px-4 py-2 text-[11px] font-medium tracking-[0.08em] transition-colors ${
                          isActive || hasValue
                            ? "border-[#1c1b1b] bg-[#1c1b1b] text-white"
                            : "border-black/10 bg-white text-[#5f595b] hover:border-[#c9b8be] hover:text-[#1c1b1b]"
                        }`}
                      >
                        {tab}
                      </button>
                    );
                  })}
                </div>
                {activeRefinementTab === "Tipo de pele" && (
                  <div className="flex flex-wrap justify-center gap-2">
                    {SKIN_TYPE_OPTIONS.map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setActiveSkinType(activeSkinType === opt.key ? null : opt.key)}
                        className={`rounded-full border px-3 py-1.5 text-[11px] transition-colors ${
                          activeSkinType === opt.key
                            ? "border-[#1c1b1b] bg-[#1c1b1b] text-white"
                            : "border-black/10 bg-white text-[#5f595b] hover:border-[#c9b8be]"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
                {activeRefinementTab === "Necessidade" && (
                  <div className="flex flex-wrap justify-center gap-2">
                    {CONCERN_OPTIONS.map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setActiveConcern(activeConcern === opt.key ? null : opt.key)}
                        className={`rounded-full border px-3 py-1.5 text-[11px] transition-colors ${
                          activeConcern === opt.key
                            ? "border-[#1c1b1b] bg-[#1c1b1b] text-white"
                            : "border-black/10 bg-white text-[#5f595b] hover:border-[#c9b8be]"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-5 flex flex-col items-center gap-3 lg:flex-row lg:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm text-[#5f595b]">
                    {filteredProducts.length} produto{filteredProducts.length !== 1 ? "s" : ""} encontrado{filteredProducts.length !== 1 ? "s" : ""}
                  </p>
                  {activeFilter !== "Todos" && (
                    <button
                      type="button"
                      onClick={() => setActiveFilter("Todos")}
                      className="inline-flex items-center gap-1 rounded-full border border-black bg-black px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white"
                    >
                      {activeFilter}
                      <X className="h-3 w-3" />
                    </button>
                  )}
                  {activeSkinType && (
                    <button
                      type="button"
                      onClick={() => setActiveSkinType(null)}
                      className="inline-flex items-center gap-1 rounded-full border border-black bg-black px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white"
                    >
                      {SKIN_TYPE_OPTIONS.find((o) => o.key === activeSkinType)?.label}
                      <X className="h-3 w-3" />
                    </button>
                  )}
                  {activeConcern && (
                    <button
                      type="button"
                      onClick={() => setActiveConcern(null)}
                      className="inline-flex items-center gap-1 rounded-full border border-black bg-black px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white"
                    >
                      {CONCERN_OPTIONS.find((o) => o.key === activeConcern)?.label}
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
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
              {paginatedProducts.map((product) => {
                const isAdded = quickAdded === product.id;
                return (
                  <article key={product.id} className="flex flex-col">
                    <div className="group relative mb-4 aspect-[4/5] overflow-hidden bg-[#f6f3f2]">
                      <Link href={`/produto/${product.slug}`} className="block h-full w-full">
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
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => handleQuickAdd(product, e)}
                        aria-label={isAdded ? "Adicionado ao carrinho" : `Adicionar ${product.title} ao carrinho`}
                        className={`absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] transition-all duration-200 ${
                          isAdded
                            ? "bg-[#1D9E75] text-white opacity-100"
                            : "translate-y-full bg-black/90 text-white opacity-0 group-hover:translate-y-0 group-hover:opacity-100"
                        }`}
                      >
                        {isAdded ? (
                          <><Check className="h-3.5 w-3.5" aria-hidden="true" /> Adicionado</>
                        ) : (
                          <><ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" /> Adicionar</>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          toggleFavorite(product.slug);
                        }}
                        aria-label={
                          isFavorite(product.slug)
                            ? `Remover ${product.title} dos favoritos`
                            : `Adicionar ${product.title} aos favoritos`
                        }
                        aria-pressed={isFavorite(product.slug)}
                        className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white/92 text-[#1c1b1b] shadow-sm transition hover:text-red-500"
                      >
                        <Heart
                          className="h-4 w-4"
                          fill={isFavorite(product.slug) ? "currentColor" : "none"}
                        />
                      </button>
                    </div>
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
                      className="mt-4 inline-flex min-h-12 items-center justify-center border border-black/20 px-4 text-[11px] font-medium uppercase tracking-[0.18em] text-black/70 transition-colors hover:border-black hover:text-black"
                    >
                      Ver produto
                    </Link>
                  </article>
                );
              })}
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
                Padrao BelaPop em revisao continua
              </span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
