"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";

import { ProductGrid } from "@/components/ProductGrid";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { parseListParam } from "@/lib/search";
import { formatPrice } from "@/lib/utils";

type FacetCount = { name: string; count: number };
type Facets = {
  brands: FacetCount[];
  categories: FacetCount[];
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
  priceRange: { min: 0, max: 0 }
};

const sortOptions = [
  { value: "relevance", label: "Relevância" },
  { value: "newest", label: "Novidades" },
  { value: "price_asc", label: "Menor preço" },
  { value: "price_desc", label: "Maior preço" },
  { value: "best_rated", label: "Melhor avaliados" }
];

const buildParams = (params: URLSearchParams, key: string, value: string | null) => {
  if (!value) {
    params.delete(key);
    return;
  }
  params.set(key, value);
};

export const ProductsClient = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [data, setData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [priceMinInput, setPriceMinInput] = useState("");
  const [priceMaxInput, setPriceMaxInput] = useState("");

  const paramsString = searchParams.toString();
  const debouncedParams = useDebounce(paramsString, 250);

  const q = searchParams.get("q") ?? "";
  const brands = parseListParam(searchParams.get("brand"));
  const categories = parseListParam(searchParams.get("category"));
  const curated = searchParams.get("curated") === "1";
  const isNew = searchParams.get("new") === "1";
  const inStock = searchParams.get("in_stock") === "1";
  const sort = searchParams.get("sort") ?? (q ? "relevance" : "newest");
  const min = searchParams.get("min") ?? "";
  const max = searchParams.get("max") ?? "";

  useEffect(() => {
    setPriceMinInput(min);
    setPriceMaxInput(max);
  }, [min, max]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      const res = await fetch(`/api/products/search?${debouncedParams}`);
      const json = (await res.json()) as SearchResponse;
      setData(json);
      setLoading(false);
    };
    void fetchProducts();
  }, [debouncedParams]);

  const updateQuery = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      buildParams(params, key, value);
    });
    router.replace(`/products?${params.toString()}`, { scroll: false });
  };

  const toggleListValue = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const current = parseListParam(params.get(key));
    const next = current.includes(value)
      ? current.filter((item) => item !== value)
      : [...current, value];
    buildParams(params, key, next.length ? next.join(",") : null);
    router.replace(`/products?${params.toString()}`, { scroll: false });
  };

  const applyPriceRange = () => {
    updateQuery({
      min: priceMinInput ? priceMinInput : null,
      max: priceMaxInput ? priceMaxInput : null
    });
  };

  const clearFilters = () => {
    if (q) {
      router.replace(`/products?q=${encodeURIComponent(q)}`);
      return;
    }
    router.replace("/products");
  };

  const items = data?.items ?? [];
  const facets = data?.facets ?? DEFAULT_FACETS;

  const cardProducts = items.map((item) => ({
    id: item.id,
    name: item.name,
    price: item.price,
    category: item.category ?? "Categoria",
    sellerId: item.sellerId ?? ""
  }));

  const ratingMap = useMemo(() => {
    return items.reduce<Record<string, { avg: number; count: number }>>(
      (acc, item) => {
        acc[item.id] = { avg: item.ratingAvg, count: item.ratingCount };
        return acc;
      },
      {}
    );
  }, [items]);

  const activeChips = [
    ...brands.map((brand) => ({ key: "brand", label: brand, value: brand })),
    ...categories.map((category) => ({
      key: "category",
      label: category,
      value: category
    })),
    curated ? { key: "curated", label: "Curadoria", value: "1" } : null,
    isNew ? { key: "new", label: "Novidade", value: "1" } : null,
    inStock ? { key: "in_stock", label: "Disponível", value: "1" } : null,
    min ? { key: "min", label: `Min ${min}`, value: min } : null,
    max ? { key: "max", label: `Max ${max}`, value: max } : null
  ].filter(Boolean) as { key: string; label: string; value: string }[];

  return (
    <div className="min-h-screen bg-white text-noir-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-10">
        <div className="rounded-3xl border border-black/10 bg-white p-8 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-noir-500">
            Produtos BelaPop
          </p>
          <h1 className="mt-3 font-display text-3xl text-noir-950">
            Curadoria com filtros inteligentes
          </h1>
          <p className="mt-2 text-sm text-noir-600">
            Selecione por categoria, marca, faixa de preço ou curadoria.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {activeChips.map((chip) => (
              <button
                key={`${chip.key}-${chip.value}`}
                type="button"
                onClick={() => {
                  if (chip.key === "brand" || chip.key === "category") {
                    toggleListValue(chip.key, chip.value);
                  } else {
                    updateQuery({ [chip.key]: null });
                  }
                }}
                className="rounded-full border border-black/10 px-3 py-1 text-xs text-noir-700 hover:border-luxe-600/40"
              >
                {chip.label} ×
              </button>
            ))}
            {activeChips.length ? (
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-full border border-black/10 px-3 py-1 text-xs text-noir-500 hover:border-luxe-600/40"
              >
                Limpar filtros
              </button>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-noir-700 md:hidden"
            >
              <SlidersHorizontal size={14} />
              Filtros
            </button>
            <select
              value={sort}
              onChange={(event) => updateQuery({ sort: event.target.value })}
              className="rounded-full border border-black/10 bg-white px-4 py-2 text-xs uppercase tracking-[0.3em] text-noir-700"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-[280px_1fr]">
          <aside className="hidden space-y-6 md:block">
            <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-noir-500">
                Filtros
              </p>
              <div className="mt-5 space-y-6 text-sm text-noir-700">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-noir-500">
                    Preço
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <input
                      value={priceMinInput}
                      onChange={(event) => setPriceMinInput(event.target.value)}
                      onBlur={applyPriceRange}
                      placeholder={`Min ${formatPrice(facets.priceRange.min)}`}
                      className="rounded-xl border border-black/10 px-3 py-2 text-xs text-noir-700"
                    />
                    <input
                      value={priceMaxInput}
                      onChange={(event) => setPriceMaxInput(event.target.value)}
                      onBlur={applyPriceRange}
                      placeholder={`Max ${formatPrice(facets.priceRange.max)}`}
                      className="rounded-xl border border-black/10 px-3 py-2 text-xs text-noir-700"
                    />
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-noir-500">
                    Marcas
                  </p>
                  <div className="mt-3 space-y-2">
                    {facets.brands.map((brand) => (
                      <label key={brand.name} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={brands.includes(brand.name)}
                          onChange={() => toggleListValue("brand", brand.name)}
                        />
                        <span>
                          {brand.name} ({brand.count})
                        </span>
                      </label>
                    ))}
                    {!facets.brands.length ? (
                      <p className="text-xs text-noir-400">Sem marcas.</p>
                    ) : null}
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-noir-500">
                    Categorias
                  </p>
                  <div className="mt-3 space-y-2">
                    {facets.categories.map((category) => (
                      <label key={category.name} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={categories.includes(category.name)}
                          onChange={() => toggleListValue("category", category.name)}
                        />
                        <span>
                          {category.name} ({category.count})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={curated}
                      onChange={() => updateQuery({ curated: curated ? null : "1" })}
                    />
                    <span>Curadoria BelaPop</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isNew}
                      onChange={() => updateQuery({ new: isNew ? null : "1" })}
                    />
                    <span>Novidades</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={inStock}
                      onChange={() => updateQuery({ in_stock: inStock ? null : "1" })}
                    />
                    <span>Disponível</span>
                  </label>
                </div>
              </div>
            </div>
          </aside>

          <section className="space-y-6">
            {loading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={`skeleton-${index}`}
                    className="h-64 rounded-3xl border border-black/10 bg-white/70"
                  />
                ))}
              </div>
            ) : items.length ? (
              <ProductGrid products={cardProducts} tone="light" ratings={ratingMap} />
            ) : (
              <div className="rounded-2xl border border-black/10 bg-white p-6 text-sm text-noir-600 shadow-sm">
                Nenhum produto encontrado com os filtros selecionados.
              </div>
            )}
          </section>
        </div>
      </div>

      {filtersOpen ? (
        <div className="fixed inset-0 z-[70] bg-black/40 md:hidden">
          <div className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-white p-6">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.3em] text-noir-500">
                Filtros
              </p>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="text-xs uppercase tracking-[0.3em] text-noir-700"
              >
                Fechar
              </button>
            </div>
            <div className="mt-6 space-y-6 text-sm text-noir-700">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-noir-500">
                  Preço
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <input
                    value={priceMinInput}
                    onChange={(event) => setPriceMinInput(event.target.value)}
                    onBlur={applyPriceRange}
                    placeholder={`Min ${formatPrice(facets.priceRange.min)}`}
                    className="rounded-xl border border-black/10 px-3 py-2 text-xs text-noir-700"
                  />
                  <input
                    value={priceMaxInput}
                    onChange={(event) => setPriceMaxInput(event.target.value)}
                    onBlur={applyPriceRange}
                    placeholder={`Max ${formatPrice(facets.priceRange.max)}`}
                    className="rounded-xl border border-black/10 px-3 py-2 text-xs text-noir-700"
                  />
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-noir-500">
                  Marcas
                </p>
                <div className="mt-3 space-y-2">
                  {facets.brands.map((brand) => (
                    <label key={brand.name} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={brands.includes(brand.name)}
                        onChange={() => toggleListValue("brand", brand.name)}
                      />
                      <span>
                        {brand.name} ({brand.count})
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-noir-500">
                  Categorias
                </p>
                <div className="mt-3 space-y-2">
                  {facets.categories.map((category) => (
                    <label key={category.name} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={categories.includes(category.name)}
                        onChange={() => toggleListValue("category", category.name)}
                      />
                      <span>
                        {category.name} ({category.count})
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={curated}
                    onChange={() => updateQuery({ curated: curated ? null : "1" })}
                  />
                  <span>Curadoria BelaPop</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isNew}
                    onChange={() => updateQuery({ new: isNew ? null : "1" })}
                  />
                  <span>Novidades</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={inStock}
                    onChange={() => updateQuery({ in_stock: inStock ? null : "1" })}
                  />
                  <span>Disponível</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
