"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { CatalogFilters } from "@/components/catalog/Filters";
import { ProductGrid } from "@/components/ProductGrid";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { parseListParam } from "@/lib/search";
import { formatPrice } from "@/lib/utils";

type FacetCount = { name: string; count: number };
type AvailabilityValue = "in_stock" | "ready_delivery" | "out_of_stock" | "all";
type SortValue =
  | "featured"
  | "newest"
  | "best_sellers"
  | "price_asc"
  | "price_desc"
  | "best_rated";

const SORT_VALUES = new Set<SortValue>([
  "featured",
  "newest",
  "best_sellers",
  "price_asc",
  "price_desc",
  "best_rated"
]);

const AVAILABILITY_VALUES = new Set<AvailabilityValue>([
  "in_stock",
  "ready_delivery",
  "out_of_stock",
  "all"
]);

type Facets = {
  brands: FacetCount[];
  categories: FacetCount[];
  rituals: FacetCount[];
  textures: FacetCount[];
  sensations: FacetCount[];
  results: FacetCount[];
  moments: FacetCount[];
  skinTypes: FacetCount[];
  finishes: FacetCount[];
  tags: FacetCount[];
  availability: {
    inStock: number;
    readyDelivery: number;
    outOfStock: number;
  };
  priceRange: { min: number; max: number };
};

type SearchItem = {
  id: string;
  name: string;
  brand: string | null;
  category: string | null;
  price: number;
  imageUrl: string | null;
  ratingAvg: number;
  ratingCount: number;
  curated: boolean;
  isNew: boolean;
  inStock: boolean;
  sellerId: string | null;
};

type SearchResponse = {
  items: SearchItem[];
  page: number;
  pageSize: number;
  total: number;
  facets: Facets;
};

const DEFAULT_FACETS: Facets = {
  brands: [],
  categories: [],
  rituals: [],
  textures: [],
  sensations: [],
  results: [],
  moments: [],
  skinTypes: [],
  finishes: [],
  tags: [],
  availability: {
    inStock: 0,
    readyDelivery: 0,
    outOfStock: 0
  },
  priceRange: { min: 0, max: 0 }
};

const LOADING_MESSAGE = "Preparando sua selecao...";
const EMPTY_MESSAGE = "Ainda em edicao. Explore outro ritual.";
const ERROR_MESSAGE = "Algo saiu do roteiro. Tentar novamente.";

const sortOptions: { value: SortValue; label: string }[] = [
  { value: "featured", label: "Recomendados" },
  { value: "newest", label: "Novidades" },
  { value: "best_sellers", label: "Mais vendidos" },
  { value: "price_asc", label: "Menor preco" },
  { value: "price_desc", label: "Maior preco" },
  { value: "best_rated", label: "Melhor avaliados" }
];

const buildParams = (params: URLSearchParams, key: string, value: string | null) => {
  if (!value) {
    params.delete(key);
    return;
  }
  params.set(key, value);
};

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();

export const ProductsClient = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [data, setData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [priceMinInput, setPriceMinInput] = useState("");
  const [priceMaxInput, setPriceMaxInput] = useState("");

  const q = searchParams.get("q") ?? "";
  const [searchInput, setSearchInput] = useState(q);
  const debouncedSearchInput = useDebounce(searchInput, 320);

  const brands = parseListParam(searchParams.get("brand"));
  const categories = parseListParam(searchParams.get("category"));
  const moments = parseListParam(searchParams.get("moment"));
  const rituals = parseListParam(searchParams.get("ritual"));
  const textures = parseListParam(searchParams.get("texture"));
  const finishes = parseListParam(searchParams.get("finish"));
  const skinTypes = parseListParam(searchParams.get("skin_type"));
  const sensations = parseListParam(searchParams.get("sensation"));
  const results = parseListParam(searchParams.get("result"));
  const tags = parseListParam(searchParams.get("tags"));
  const curated = searchParams.get("curated") === "1";
  const isNew = searchParams.get("new") === "1";
  const rawAvailability = searchParams.get("availability");
  const availability: AvailabilityValue =
    rawAvailability && AVAILABILITY_VALUES.has(rawAvailability as AvailabilityValue)
      ? (rawAvailability as AvailabilityValue)
      : "in_stock";
  const rawSort = searchParams.get("sort");
  const sort: SortValue =
    rawSort && SORT_VALUES.has(rawSort as SortValue) ? (rawSort as SortValue) : "featured";
  const min = searchParams.get("min") ?? "";
  const max = searchParams.get("max") ?? "";

  const paramsString = searchParams.toString();
  const debouncedParams = useDebounce(paramsString, 250);

  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  useEffect(() => {
    if (debouncedSearchInput === q) return;
    const params = new URLSearchParams(searchParams.toString());
    buildParams(params, "q", debouncedSearchInput || null);
    params.delete("page");
    const next = params.toString();
    router.replace(next ? `/catalogo?${next}` : "/catalogo", { scroll: false });
  }, [debouncedSearchInput, q, router, searchParams]);

  useEffect(() => {
    setPriceMinInput(min);
    setPriceMaxInput(max);
  }, [min, max]);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const fetchProducts = async () => {
      setLoading(true);
      setErrorMessage(null);

      try {
        const res = await fetch(`/api/products/search?${debouncedParams}`, {
          signal: controller.signal
        });

        if (!res.ok) {
          throw new Error(`Search failed with status ${res.status}`);
        }

        const json = (await res.json()) as SearchResponse;
        setData(json);
      } catch {
        setData(null);
        setErrorMessage(ERROR_MESSAGE);
      } finally {
        clearTimeout(timeout);
        setLoading(false);
      }
    };

    void fetchProducts();

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [debouncedParams, retryCount]);

  const updateQuery = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      buildParams(params, key, value);
    });
    params.delete("page");
    const next = params.toString();
    router.replace(next ? `/catalogo?${next}` : "/catalogo", { scroll: false });
  };

  const toggleListValue = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const current = parseListParam(params.get(key));
    const next = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];
    buildParams(params, key, next.length ? next.join(",") : null);
    params.delete("page");
    const query = params.toString();
    router.replace(query ? `/catalogo?${query}` : "/catalogo", { scroll: false });
  };

  const applyPriceRange = () => {
    updateQuery({
      min: priceMinInput ? priceMinInput : null,
      max: priceMaxInput ? priceMaxInput : null
    });
  };

  const selectPricePreset = (presetMin: number | null, presetMax: number | null) => {
    const minValue = presetMin === null ? "" : String(presetMin);
    const maxValue = presetMax === null ? "" : String(presetMax);
    setPriceMinInput(minValue);
    setPriceMaxInput(maxValue);
    updateQuery({
      min: minValue || null,
      max: maxValue || null
    });
  };

  const clearFilters = () => {
    router.replace("/catalogo?sort=featured&availability=in_stock", { scroll: false });
  };

  const items = data?.items ?? [];
  const facets = data?.facets ?? DEFAULT_FACETS;

  const cardProducts = items.map((item) => ({
    id: item.id,
    name: item.name,
    price: item.price,
    category: item.category ?? "Curadoria",
    sellerId: item.sellerId ?? ""
  }));

  const ratingMap = useMemo(() => {
    return items.reduce<Record<string, { avg: number; count: number }>>((acc, item) => {
      acc[item.id] = { avg: item.ratingAvg, count: item.ratingCount };
      return acc;
    }, {});
  }, [items]);

  const activeChips = [
    ...brands.map((brand) => ({ key: "brand", label: brand, value: brand })),
    ...categories.map((category) => ({ key: "category", label: category, value: category })),
    ...moments.map((moment) => ({ key: "moment", label: moment, value: moment })),
    ...rituals.map((ritual) => ({ key: "ritual", label: ritual, value: ritual })),
    ...textures.map((texture) => ({ key: "texture", label: texture, value: texture })),
    ...finishes.map((finish) => ({ key: "finish", label: finish, value: finish })),
    ...skinTypes.map((skinType) => ({ key: "skin_type", label: skinType, value: skinType })),
    ...sensations.map((sensation) => ({ key: "sensation", label: sensation, value: sensation })),
    ...results.map((result) => ({ key: "result", label: result, value: result })),
    ...tags.map((tag) => ({ key: "tags", label: tag, value: tag })),
    curated ? { key: "curated", label: "Curadoria", value: "1" } : null,
    isNew ? { key: "new", label: "Novidade", value: "1" } : null,
    availability !== "in_stock"
      ? { key: "availability", label: availability.replaceAll("_", " "), value: availability }
      : null,
    min ? { key: "min", label: `Min ${min}`, value: min } : null,
    max ? { key: "max", label: `Max ${max}`, value: max } : null
  ].filter(Boolean) as { key: string; label: string; value: string }[];

  const normalizedQuery = normalizeText(searchInput);
  const smartSuggestions = useMemo(() => {
    if (!normalizedQuery || normalizedQuery.length < 2) return [];
    const suggestions: { key: string; value: string; label: string }[] = [];
    const selected = new Set([
      ...finishes.map((item) => normalizeText(item)),
      ...skinTypes.map((item) => normalizeText(item)),
      ...tags.map((item) => normalizeText(item)),
      ...moments.map((item) => normalizeText(item))
    ]);

    const maybePush = (key: string, value: string, label: string, terms: string[]) => {
      if (!terms.some((term) => normalizedQuery.includes(term))) return;
      if (selected.has(normalizeText(value))) return;
      suggestions.push({ key, value, label });
    };

    maybePush("finish", "Glow elegante", "Aplicar: Glow elegante", ["glow", "ilumina"]);
    maybePush("skin_type", "Pele sensivel", "Aplicar: Pele sensivel", ["sensivel", "sensivel"]);
    maybePush("tags", "Sem fragrancia", "Aplicar: Sem fragrancia", ["sensivel", "fragrance"]);
    maybePush("tags", "Vegano", "Aplicar: Vegano", ["veg", "vegan"]);
    maybePush("moment", "Noite de autocuidado", "Aplicar: Noite de autocuidado", ["noite", "autocuidado"]);
    maybePush("moment", "Plantao", "Aplicar: Plantao", ["plantao", "duracao"]);

    return suggestions.slice(0, 4);
  }, [finishes, moments, normalizedQuery, skinTypes, tags]);

  const categoryTokens = categories.map((category) => normalizeText(category));
  const hasSkincareCategory =
    categoryTokens.some((category) => category.includes("skincare") || category.includes("pele")) ||
    categoryTokens.length === 0;
  const hasMakeCategory =
    categoryTokens.some((category) => category.includes("maquiagem") || category.includes("make")) ||
    categoryTokens.length === 0;

  return (
    <div className="min-h-screen bg-bpOffWhite text-bpBlackSoft">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-10">
        <div className="rounded-3xl border border-black/10 bg-white p-8 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Catalogo BelaPop</p>
          <h1 className="mt-3 font-display text-3xl text-bpBlack">Curadoria com filtros inteligentes</h1>
          <p className="mt-2 max-w-2xl text-sm text-bpGraphite/80">
            Encontre o produto ideal por marca, efeito, momento e faixa de preco sem perder o ritmo editorial.
          </p>
          <label htmlFor="catalog-search" className="mt-6 block text-xs uppercase tracking-[0.24em] text-bpGraphite/65">
            Busca
          </label>
          <div className="mt-2 flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3">
            <Search size={18} className="text-bpGraphite/55" />
            <input
              id="catalog-search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Buscar por marca, produto ou efeito..."
              className="w-full border-none bg-transparent p-0 text-sm text-bpBlack placeholder:text-bpGraphite/55 focus:outline-none focus:ring-0"
            />
          </div>
          {smartSuggestions.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {smartSuggestions.map((suggestion) => (
                <button
                  key={`${suggestion.key}-${suggestion.value}`}
                  type="button"
                  onClick={() => toggleListValue(suggestion.key, suggestion.value)}
                  className="rounded-full border border-bpPink/30 bg-bpPinkSoft/10 px-3 py-1 text-xs font-semibold text-bpPink hover:border-bpPink"
                >
                  {suggestion.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {activeChips.map((chip) => (
              <button
                key={`${chip.key}-${chip.value}`}
                type="button"
                onClick={() => {
                  if (
                    chip.key === "brand" ||
                    chip.key === "category" ||
                    chip.key === "moment" ||
                    chip.key === "ritual" ||
                    chip.key === "texture" ||
                    chip.key === "finish" ||
                    chip.key === "skin_type" ||
                    chip.key === "sensation" ||
                    chip.key === "result" ||
                    chip.key === "tags"
                  ) {
                    toggleListValue(chip.key, chip.value);
                    return;
                  }
                  updateQuery({ [chip.key]: null });
                }}
                className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs text-bpGraphite hover:border-bpPink/45"
              >
                {chip.label} x
              </button>
            ))}
            {activeChips.length ? (
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs text-bpGraphite/70 hover:border-bpPink/45"
              >
                Limpar tudo
              </button>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-xs uppercase tracking-[0.3em] text-bpGraphite md:hidden"
            >
              <SlidersHorizontal size={14} />
              Filtrar
            </button>
            <select
              value={sort}
              onChange={(event) => updateQuery({ sort: event.target.value })}
              className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs uppercase tracking-[0.24em] text-bpGraphite"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-[300px_1fr]">
          <CatalogFilters
            facets={facets}
            brands={brands}
            categories={categories}
            moments={moments}
            rituals={rituals}
            textures={textures}
            finishes={finishes}
            skinTypes={skinTypes}
            sensations={sensations}
            results={results}
            tags={tags}
            curated={curated}
            isNew={isNew}
            availability={availability}
            priceMinInput={priceMinInput}
            priceMaxInput={priceMaxInput}
            filtersOpen={filtersOpen}
            resultsCount={data?.total ?? 0}
            onClose={() => setFiltersOpen(false)}
            onClearFilters={clearFilters}
            onPriceMinChange={setPriceMinInput}
            onPriceMaxChange={setPriceMaxInput}
            onApplyPriceRange={applyPriceRange}
            onSelectPricePreset={selectPricePreset}
            onToggleBrand={(value) => toggleListValue("brand", value)}
            onToggleCategory={(value) => toggleListValue("category", value)}
            onToggleMoment={(value) => toggleListValue("moment", value)}
            onToggleRitual={(value) => toggleListValue("ritual", value)}
            onToggleTexture={(value) => toggleListValue("texture", value)}
            onToggleFinish={(value) => toggleListValue("finish", value)}
            onToggleSkinType={(value) => toggleListValue("skin_type", value)}
            onToggleSensation={(value) => toggleListValue("sensation", value)}
            onToggleResult={(value) => toggleListValue("result", value)}
            onToggleTag={(value) => toggleListValue("tags", value)}
            onToggleCurated={() => updateQuery({ curated: curated ? null : "1" })}
            onToggleIsNew={() => updateQuery({ new: isNew ? null : "1" })}
            onSetAvailability={(value) => updateQuery({ availability: value })}
            showSkincareFilters={hasSkincareCategory}
            showMakeFilters={hasMakeCategory}
            formatPrice={formatPrice}
          />

          <section className="space-y-6">
            <div className="flex items-center justify-between text-sm text-bpGraphite/75">
              <p>{loading ? "..." : `${data?.total ?? 0} produtos encontrados`}</p>
            </div>

            {loading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="md:col-span-2 lg:col-span-3">
                  <p className="text-sm text-bpGraphite/70">{LOADING_MESSAGE}</p>
                </div>
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={`skeleton-${index}`}
                    className="h-64 animate-pulse rounded-3xl border border-black/10 bg-white"
                  />
                ))}
              </div>
            ) : errorMessage ? (
              <div className="rounded-2xl border border-black/10 bg-white p-6 text-sm text-bpGraphite/80 shadow-sm">
                <p className="font-semibold text-bpBlackSoft">{errorMessage}</p>
                <button
                  type="button"
                  onClick={() => setRetryCount((value) => value + 1)}
                  className="mt-4 rounded-full border border-bpPink/40 px-4 py-2 text-xs uppercase tracking-[0.24em] text-bpPink hover:border-bpPink"
                >
                  Tentar novamente
                </button>
              </div>
            ) : items.length ? (
              <ProductGrid products={cardProducts} tone="light" ratings={ratingMap} />
            ) : (
              <div className="rounded-2xl border border-black/10 bg-white p-6 text-sm text-bpGraphite/80 shadow-sm">
                <p className="font-semibold text-bpBlackSoft">{EMPTY_MESSAGE}</p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-4 rounded-full bg-bpBlack px-5 py-2 text-xs uppercase tracking-[0.24em] text-bpOffWhite"
                >
                  Explorar Curadoria BelaPop
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
