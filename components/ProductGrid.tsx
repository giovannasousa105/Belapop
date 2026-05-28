"use client";

import React from "react";

import { ProductCard, type ProductCardData } from "@/components/ProductCard";
import { ProductFrame } from "@/components/ProductFrame";
import { useFavorites } from "@/lib/favorites";

type ProductGridProps = {
  products: ProductCardData[];
  tone?: "light" | "dark";
  ratings?: Record<string, { avg: number; count: number }>;
};

export const ProductGrid = ({
  products,
  tone = "light",
  ratings
}: ProductGridProps) => {
  const { isFavorite, toggleFavorite } = useFavorites();

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => {
        const favoriteKey = product.slug ?? product.id;

        return (
          <ProductFrame key={product.id} className="h-full">
            <ProductCard
              product={product}
              tone={tone}
              isWishlisted={isFavorite(favoriteKey)}
              onToggleWishlist={toggleFavorite}
              ratingAvg={ratings?.[product.id]?.avg}
              ratingCount={ratings?.[product.id]?.count}
            />
          </ProductFrame>
        );
      })}
    </div>
  );
};
