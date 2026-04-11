import { Suspense } from "react";

import { ProductsClient } from "@/app/products/ProductsClient";

export default function ProductsPage() {
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
                  key={`products-fallback-skeleton-${index}`}
                  className="h-64 animate-pulse rounded-3xl border border-black/10 bg-white"
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

