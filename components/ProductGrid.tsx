"use client";

import React from "react";

import { Product } from "@/lib/types";
import { ProductCard } from "@/components/ProductCard";
import { ProductFrame } from "@/components/ProductFrame";

type ProductGridProps = {
  products: Product[];
  tone?: "light" | "dark";
};

export const ProductGrid = ({ products, tone = "light" }: ProductGridProps) => {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductFrame key={product.id} className="h-full">
          <ProductCard product={product} tone={tone} />
        </ProductFrame>
      ))}
    </div>
  );
};
