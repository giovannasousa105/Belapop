"use client";

import { useMemo } from "react";

import { PageHeading } from "@/components/PageHeading";
import { ProductGrid } from "@/components/ProductGrid";
import { useWishlist } from "@/lib/hooks/useWishlist";
import { formatPrice } from "@/lib/utils";

export default function AccountFavoritesPage() {
  const { items, loading } = useWishlist();

  const products = useMemo(
    () =>
      items
        .map((item) => item.products)
        .filter((product): product is NonNullable<typeof product> => Boolean(product))
        .map((product) => ({
          id: product.id,
          name: product.name,
          price: Number(product.price_cents ?? 0) / 100,
          category: product.category ?? "Categoria",
          sellerId: product.seller_id ?? ""
        })),
    [items]
  );

  const ratingMap = useMemo(() => {
    return products.reduce<Record<string, { avg: number; count: number }>>(
      (acc, product) => {
        acc[product.id] = { avg: 0, count: 0 };
        return acc;
      },
      {}
    );
  }, [products]);

  return (
    <div className="space-y-6">
      <PageHeading
        title="Favoritos"
        subtitle="Sua lista de desejos com assinatura editorial."
      />
      {loading ? (
        <p className="text-sm text-noir-500">Carregando...</p>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-black/10 bg-white p-6 text-sm text-noir-600">
          Nada salvo ainda. Explore a curadoria e guarde seus favoritos.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-black/10 bg-white p-4 text-xs text-noir-500">
            Favoritos salvos:{" "}
            <span className="font-semibold text-noir-900">
              {products.length}
            </span>
            {products.length ? (
              <span className="ml-2">
                Total estimado:{" "}
                <span className="font-semibold text-noir-900">
                  {formatPrice(
                    products.reduce((acc, product) => acc + product.price, 0)
                  )}
                </span>
              </span>
            ) : null}
          </div>
          <ProductGrid products={products} tone="light" ratings={ratingMap} />
        </div>
      )}
    </div>
  );
}
