import type { Metadata } from "next";
import { Suspense } from "react";

import { ProductsClient } from "@/app/products/ProductsClient";

export const revalidate = 60;

type CatalogPageProps = {
  searchParams?: {
    ritual?: string;
    category?: string;
    q?: string;
  };
};

export function generateMetadata({ searchParams }: CatalogPageProps): Metadata {
  const activeFilter =
    searchParams?.ritual || searchParams?.category || searchParams?.q || "Curadoria";

  return {
    title: `${activeFilter} — Catalogo | BelaPop`,
    description:
      "Catalogo editorial com filtros por ritual, textura, sensacao, resultado e preco."
  };
}

export default function CatalogoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bpOffWhite text-bpBlackSoft">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-16">
            <div className="rounded-3xl border border-black/10 bg-white p-8 shadow-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Catalogo BelaPop</p>
              <h1 className="mt-3 font-display text-3xl text-bpBlack">Preparando sua selecao...</h1>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={`catalog-fallback-skeleton-${index}`}
                  className="h-64 animate-pulse rounded-3xl border border-black/10 bg-bpOffWhite"
                />
              ))}
            </div>
          </div>
        </div>
      }
    >
      <ProductsClient />
    </Suspense>
  );
}


