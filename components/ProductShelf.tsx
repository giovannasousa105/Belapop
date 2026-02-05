"use client";

import Link from "next/link";

import { Product } from "@/lib/types";
import { ProductCard } from "@/components/ProductCard";
import { ProductFrame } from "@/components/ProductFrame";

type ProductShelfProps = {
  title: string;
  subtitle?: string;
  products: Product[];
  tone?: "light" | "dark";
  label?: string;
};

export const ProductShelf = ({
  title,
  subtitle,
  products,
  tone = "light",
  label = "Curadoria BelaPop"
}: ProductShelfProps) => {
  const isLight = tone === "light";
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p
            className={`text-xs uppercase tracking-[0.3em] ${
              isLight ? "text-noir-500" : "text-blush-100/60"
            }`}
          >
            {label}
          </p>
          <h2
            className={`mt-2 font-display text-2xl ${
              isLight ? "text-noir-950" : "text-blush-50"
            }`}
          >
            {title}
          </h2>
          {subtitle ? (
            <p
              className={`mt-2 text-sm ${
                isLight ? "text-noir-600" : "text-blush-100/70"
              }`}
            >
              {subtitle}
            </p>
          ) : null}
        </div>
        <Link
          href="/catalogo"
          className={`text-xs uppercase tracking-[0.2em] ${
            isLight
              ? "text-noir-500 hover:text-luxe-600"
              : "text-blush-100/60 hover:text-blush-50"
          }`}
        >
          Ver tudo
        </Link>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {products.map((product) => (
          <div key={product.id} className="min-w-[240px] flex-1">
            <ProductFrame>
              <ProductCard product={product} tone={tone} />
            </ProductFrame>
          </div>
        ))}
      </div>
    </section>
  );
};
