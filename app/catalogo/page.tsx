import { Suspense } from "react";

import { CatalogoClient } from "@/app/catalogo/CatalogoClient";

export default function CatalogoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white text-noir-900">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-16">
            <div className="rounded-3xl border border-black/10 bg-white p-8 shadow-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-noir-500">
                Catálogo BelaPop
              </p>
              <h1 className="mt-3 font-display text-3xl text-noir-950">
                Carregando curadoria...
              </h1>
            </div>
          </div>
        </div>
      }
    >
      <CatalogoClient />
    </Suspense>
  );
}
