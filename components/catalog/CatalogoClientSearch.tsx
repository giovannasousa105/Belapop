"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import {
  CATALOG_PRODUCTS,
  QUICK_SEARCHES,
  searchProducts,
  type ConcernFilter,
  type ProductCategory,
  type SkinTypeFilter,
} from "@/lib/catalog-search";

const CATEGORY_LABELS: Record<string, string> = {
  limpeza: "Limpeza",
  tonico: "Tonico",
  serum: "Seruns",
  hidratante: "Hidratacao",
  protecao: "Protecao",
  olhos: "Olhos",
  cabelos: "Cabelos",
  maquiagem: "Maquiagem",
};

const SKIN_TYPE_LABELS: Record<string, string> = {
  oleosa: "Oleosa",
  seca: "Seca",
  mista: "Mista",
  normal: "Normal",
  sensivel: "Sensivel",
};

const CONCERN_LABELS: Record<string, string> = {
  acne: "Acne",
  manchas: "Manchas",
  oleosidade: "Oleosidade",
  hidratacao: "Hidratacao",
  "linhas-finas": "Linhas Finas",
  poros: "Poros",
  luminosidade: "Luminosidade",
  olheiras: "Olheiras",
  textura: "Textura",
};

const CATEGORY_ICONS: Record<string, string> = {
  limpeza: "🫧",
  tonico: "💧",
  serum: "✨",
  hidratante: "🌿",
  protecao: "☀️",
  olhos: "👁️",
  cabelos: "💇",
  maquiagem: "💄",
};

export function CatalogoClientSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [inputValue, setInputValue] = useState(searchParams.get("q") ?? "");
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [activeCategory, setActiveCategory] = useState<ProductCategory | null>(null);
  const [activeSkinType, setActiveSkinType] = useState<SkinTypeFilter | null>(null);
  const [activeConcern, setActiveConcern] = useState<ConcernFilter | null>(null);
  const [sortBy, setSortBy] = useState<"relevance" | "price_asc" | "price_desc" | "new">("relevance");
  const [showFilters, setShowFilters] = useState(false);

  const updateURL = useCallback(
    (nextQuery: string) => {
      const params = new URLSearchParams();
      if (nextQuery) params.set("q", nextQuery);
      router.replace(`/catalogo${params.toString() ? `?${params.toString()}` : ""}`, { scroll: false });
    },
    [router]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(inputValue);
      updateURL(inputValue);
    }, 280);
    return () => clearTimeout(timer);
  }, [inputValue, updateURL]);

  const results = useMemo(() => {
    let products = searchProducts(query, {
      category: activeCategory,
      skinType: activeSkinType,
      concern: activeConcern,
    });

    if (sortBy === "price_asc") {
      products = [...products].sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    } else if (sortBy === "price_desc") {
      products = [...products].sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    } else if (sortBy === "new") {
      products = [...products].sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    }

    return products;
  }, [query, activeCategory, activeSkinType, activeConcern, sortBy]);

  const hasActiveFilters = !!(activeCategory || activeSkinType || activeConcern);

  function clearFilters() {
    setActiveCategory(null);
    setActiveSkinType(null);
    setActiveConcern(null);
  }

  return (
    <div className="min-h-screen pb-28">
      {/* Search bar sticky */}
      <div className="sticky top-0 z-30 border-b border-neutral-100 bg-white/95 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 transition-colors focus-within:border-black">
            <svg className="h-4 w-4 shrink-0 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              placeholder="Serum, niacinamida, protetor..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-neutral-400"
            />
            {inputValue && (
              <button
                type="button"
                onClick={() => { setInputValue(""); setQuery(""); }}
                className="text-neutral-400 hover:text-black"
                aria-label="Limpar busca"
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs tracking-wider transition-colors ${
              hasActiveFilters
                ? "border-black bg-black text-white"
                : "border-neutral-200 bg-white text-neutral-600 hover:border-black"
            }`}
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M7 12h10M11 20h2" />
            </svg>
            FILTROS
            {hasActiveFilters && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-black">
                {[activeCategory, activeSkinType, activeConcern].filter(Boolean).length}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4">
        {/* Painel de filtros */}
        {showFilters && (
          <div className="mt-4 space-y-5 rounded-2xl bg-neutral-50 p-4">
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-neutral-500">Categoria</p>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(CATEGORY_LABELS) as ProductCategory[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveCategory(activeCategory === key ? null : key)}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                      activeCategory === key
                        ? "border-black bg-black text-white"
                        : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400"
                    }`}
                  >
                    <span>{CATEGORY_ICONS[key]}</span>
                    {CATEGORY_LABELS[key]}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-neutral-500">Tipo de Pele</p>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(SKIN_TYPE_LABELS) as SkinTypeFilter[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveSkinType(activeSkinType === key ? null : key)}
                    className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                      activeSkinType === key
                        ? "border-black bg-black text-white"
                        : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400"
                    }`}
                  >
                    {SKIN_TYPE_LABELS[key]}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-neutral-500">Necessidade</p>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(CONCERN_LABELS) as ConcernFilter[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveConcern(activeConcern === key ? null : key)}
                    className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                      activeConcern === key
                        ? "border-black bg-black text-white"
                        : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400"
                    }`}
                  >
                    {CONCERN_LABELS[key]}
                  </button>
                ))}
              </div>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs text-neutral-500 underline hover:text-black"
              >
                Limpar filtros
              </button>
            )}
          </div>
        )}

        {/* Buscas rápidas */}
        {!query && !hasActiveFilters && (
          <div className="mt-5 space-y-3">
            <p className="text-[10px] uppercase tracking-widest text-neutral-500">Buscas frequentes</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_SEARCHES.map((qs) => (
                <button
                  key={qs.label}
                  type="button"
                  onClick={() => {
                    if (qs.query) setInputValue(qs.query);
                    if (qs.filter.category) setActiveCategory(qs.filter.category);
                    if (qs.filter.skinType) setActiveSkinType(qs.filter.skinType);
                    if (qs.filter.concern) setActiveConcern(qs.filter.concern);
                  }}
                  className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs text-neutral-600 transition-colors hover:border-black hover:text-black"
                >
                  {qs.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Contagem + ordenação */}
        <div className="mt-5 flex items-center justify-between">
          <p className="text-xs text-neutral-500">
            <span className="font-medium text-black">{results.length}</span>{" "}
            produto{results.length !== 1 ? "s" : ""} encontrado{results.length !== 1 ? "s" : ""}
          </p>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="cursor-pointer bg-transparent text-xs text-neutral-600 outline-none"
          >
            <option value="relevance">Recomendados</option>
            <option value="price_asc">Menor preco</option>
            <option value="price_desc">Maior preco</option>
            <option value="new">Novidades</option>
          </select>
        </div>

        {/* Grid de produtos */}
        {results.length > 0 ? (
          <div className="mt-4 grid grid-cols-2 gap-3">
            {results.map((product) => (
              <Link
                key={product.slug}
                href={`/produto/${product.slug}`}
                className="group block overflow-hidden rounded-2xl border border-neutral-100 bg-white transition-all hover:border-neutral-300 hover:shadow-sm"
              >
                <div
                  className={`flex aspect-square items-center justify-center text-4xl ${
                    product.category === "limpeza" ? "bg-blue-50"
                    : product.category === "tonico" ? "bg-pink-50"
                    : product.category === "serum" ? "bg-amber-50"
                    : product.category === "hidratante" ? "bg-green-50"
                    : product.category === "protecao" ? "bg-yellow-50"
                    : product.category === "olhos" ? "bg-purple-50"
                    : product.category === "cabelos" ? "bg-orange-50"
                    : "bg-rose-50"
                  }`}
                >
                  <span>{CATEGORY_ICONS[product.category] ?? "✦"}</span>
                </div>
                <div className="space-y-2 p-3">
                  <div className="flex gap-1">
                    {product.isNew && (
                      <span className="rounded bg-black px-1.5 py-0.5 text-[9px] tracking-widest text-white">
                        NOVO
                      </span>
                    )}
                    {product.isBestSeller && (
                      <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[9px] tracking-widest text-neutral-600">
                        MAIS VENDIDO
                      </span>
                    )}
                  </div>
                  <p className="line-clamp-2 text-xs font-medium leading-tight group-hover:text-neutral-700">
                    {product.name}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {product.keyActives.slice(0, 2).map((ativo) => (
                      <span
                        key={ativo}
                        className="rounded-full border border-neutral-100 bg-neutral-50 px-1.5 py-0.5 text-[9px] text-neutral-500"
                      >
                        {ativo}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm font-medium">
                    {product.price
                      ? `R$ ${product.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                      : "Ver preco"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-12 space-y-5 text-center">
            <div className="text-5xl">🔍</div>
            <div className="space-y-1">
              <p className="font-medium">Nenhum produto encontrado</p>
              <p className="text-sm text-neutral-500">
                Tente termos como &quot;serum&quot;, &quot;hidratante&quot; ou &quot;protetor solar&quot;
              </p>
            </div>
            {(query || hasActiveFilters) && (
              <button
                type="button"
                onClick={() => { setInputValue(""); clearFilters(); }}
                className="text-sm text-neutral-500 underline hover:text-black"
              >
                Limpar busca e filtros
              </button>
            )}
          </div>
        )}

        {/* CTA Skin Scan */}
        <div className="mt-10 space-y-3 rounded-2xl bg-black p-6 text-center text-white">
          <p className="text-[10px] uppercase tracking-widest text-neutral-400">
            Nao sabe por onde comecar?
          </p>
          <p className="font-serif text-xl">Faca o diagnostico da sua pele</p>
          <p className="text-xs text-neutral-400">
            A IA analisa sua pele em segundos e monta a rotina ideal
          </p>
          <Link
            href="/skin-scan"
            className="mt-2 inline-block rounded-xl bg-white px-6 py-3 text-xs tracking-widest text-black transition-colors hover:bg-neutral-100"
          >
            INICIAR SKIN SCAN →
          </Link>
        </div>
      </div>
    </div>
  );
}
