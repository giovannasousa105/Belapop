"use client";

import React from "react";

import { ProductCard, type ProductCardData } from "@/components/ProductCard";
import { ProductFrame } from "@/components/ProductFrame";
import { useWishlist } from "@/lib/hooks/useWishlist";
import { WishlistLoginModal } from "@/components/WishlistLoginModal";

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
  const { isWishlisted, toggle, promptOpen, closePrompt } = useWishlist();

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <ProductFrame key={product.id} className="h-full">
            <ProductCard
              product={product}
              tone={tone}
              isWishlisted={isWishlisted(product.id)}
              onToggleWishlist={toggle}
              ratingAvg={ratings?.[product.id]?.avg}
              ratingCount={ratings?.[product.id]?.count}
            />
          </ProductFrame>
        ))}
      </div>
      <WishlistLoginModal open={promptOpen} onClose={closePrompt} />
    </>
  );
};
