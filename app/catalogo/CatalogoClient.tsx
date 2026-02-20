"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { FilterBar } from "@/components/FilterBar";
import { ProductGrid } from "@/components/ProductGrid";
import { trackEvent } from "@/lib/analytics/tracker";
import { usePublishedProducts } from "@/lib/hooks/useStoredProducts";

export const CatalogoClient = () => {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("featured");

  const { products } = usePublishedProducts();

  useEffect(() => {
    const query = searchParams.get("q");
    if (query) {
      setSearch(query);
    }
  }, [searchParams]);

  const categories = useMemo(
    () => Array.from(new Set(products.map((product) => product.category))),
    [products]
  );

  useEffect(() => {
    void trackEvent({ type: "view_catalog" });
  }, []);

  const filtered = useMemo(() => {
    const normalized = search.toLowerCase().trim();
    let result = products.filter((product) =>
      product.name.toLowerCase().includes(normalized)
    );

    if (category) {
      result = result.filter((product) => product.category === category);
    }

    if (sort === "asc") {
      result = [...result].sort((a, b) => a.price - b.price);
    }
    if (sort === "desc") {
      result = [...result].sort((a, b) => b.price - a.price);
    }

    return result;
  }, [search, category, sort, products]);

  return (
    <div className="min-h-screen bg-white text-bpBlackSoft">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-10">
        <div className="rounded-3xl border border-black/10 bg-white p-8 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">
            Catálogo BelaPop
          </p>
          <h1 className="mt-3 font-display text-3xl text-bpBlack">
            Explore a curadoria premium
          </h1>
          <p className="mt-2 text-sm text-bpGraphite/80">
            Selecione por categoria, encontre seu ritual e descubra novidades.
          </p>
        </div>
        <FilterBar
          search={search}
          category={category}
          sort={sort}
          categories={categories}
          onSearchChange={setSearch}
          onCategoryChange={setCategory}
          onSortChange={setSort}
          tone="light"
        />
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-black/10 bg-white p-6 text-sm text-bpGraphite/80 shadow-sm">
            Nenhum produto encontrado com os filtros selecionados.
          </div>
        ) : (
          <ProductGrid products={filtered} tone="light" />
        )}
      </div>
    </div>
  );
};
