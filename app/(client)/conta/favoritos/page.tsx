"use client";

import Link from "next/link";
import { ArrowRight, Heart, X } from "lucide-react";

import { CATALOG_PRODUCTS } from "@/lib/catalog-search";
import { useFavorites } from "@/lib/favorites";

const categoryStyles: Record<string, string> = {
  limpeza: "bg-blue-50 text-blue-700 border-blue-100",
  tonico: "bg-pink-50 text-pink-700 border-pink-100",
  serum: "bg-amber-50 text-amber-700 border-amber-100",
  hidratante: "bg-emerald-50 text-emerald-700 border-emerald-100",
  protecao: "bg-yellow-50 text-yellow-700 border-yellow-100",
  olhos: "bg-purple-50 text-purple-700 border-purple-100",
};

function formatCatalogPrice(price: number | null) {
  if (!price) return "Ver preco";
  return price.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

export default function ContaFavoritosPage() {
  const { favorites, toggleFavorite, isLoaded } = useFavorites();
  const favoriteProducts = CATALOG_PRODUCTS.filter((product) =>
    favorites.includes(product.slug),
  );

  if (!isLoaded) {
    return (
      <div className="p-8 text-center text-sm text-bpGraphite/60">
        Carregando favoritos...
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/60">
              Selecoes salvas
            </p>
            <h1 className="mt-3 font-display text-4xl text-bpBlack">
              Favoritos
            </h1>
            <p className="mt-3 text-sm leading-6 text-bpGraphite/75">
              {favoriteProducts.length > 0
                ? `${favoriteProducts.length} produto${favoriteProducts.length > 1 ? "s" : ""} salvo${favoriteProducts.length > 1 ? "s" : ""} para comparar depois.`
                : "Sua selecao salva para voltar, comparar e decidir melhor."}
            </p>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-bpPink/10 text-bpPink">
            <Heart className="h-5 w-5" fill="currentColor" />
          </div>
        </div>
      </section>

      {favoriteProducts.length > 0 ? (
        <div className="space-y-3">
          {favoriteProducts.map((product) => {
            const categoryClass =
              categoryStyles[product.category] ??
              "border-neutral-100 bg-neutral-50 text-neutral-600";

            return (
              <article
                key={product.slug}
                className="flex items-center gap-4 rounded-3xl border border-black/10 bg-white p-4 shadow-sm"
              >
                <div
                  className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border text-xs font-semibold uppercase tracking-[0.12em] ${categoryClass}`}
                >
                  {product.category.slice(0, 3)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-bpBlack">
                    {product.name}
                  </p>
                  <p className="mt-1 text-xs text-bpGraphite/70">
                    {formatCatalogPrice(product.price)}
                  </p>
                  <p className="mt-2 line-clamp-1 text-xs text-bpGraphite/55">
                    {product.keyActives.slice(0, 3).join(" + ")}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    href={`/produto/${product.slug}`}
                    className="inline-flex h-10 items-center gap-2 rounded-full border border-black/10 px-4 text-xs font-semibold uppercase tracking-[0.14em] text-bpBlack transition hover:border-black/30"
                  >
                    Ver
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggleFavorite(product.slug)}
                    aria-label={`Remover ${product.name} dos favoritos`}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-red-100 bg-red-50 text-red-500 transition hover:bg-red-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <section className="rounded-3xl border border-black/10 bg-white px-6 py-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-bpPink/10 text-bpPink">
            <Heart className="h-6 w-6" />
          </div>
          <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-bpGraphite/70">
            Explore a loja e guarde os produtos que quer rever depois.
          </p>
          <Link
            href="/catalogo"
            className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-black px-6 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-black/85"
          >
            Explorar catalogo
          </Link>
        </section>
      )}
    </div>
  );
}
