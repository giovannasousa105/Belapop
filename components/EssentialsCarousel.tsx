"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef } from "react";

import { ProductCard } from "@/components/ProductCard";
import { ProductFrame } from "@/components/ProductFrame";
import { Product } from "@/lib/types";

type EssentialsCarouselProps = {
  title: string;
  subtitle: string;
  products: Product[];
  tone?: "light" | "dark";
};

export const EssentialsCarousel = ({
  title,
  subtitle,
  products,
  tone = "light"
}: EssentialsCarouselProps) => {
  const isLight = tone === "light";
  const containerRef = useRef<HTMLDivElement | null>(null);

  const scrollBy = (offset: number) => {
    if (!containerRef.current) return;
    containerRef.current.scrollBy({ left: offset, behavior: "smooth" });
  };

  return (
    <section
      className={`rounded-3xl p-8 ${
        isLight
          ? "border border-black/10 bg-white shadow-sm"
          : "glass-panel"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p
            className={`text-xs uppercase tracking-[0.3em] ${
              isLight ? "text-bpGraphite/70" : "text-bpPinkSoft/60"
            }`}
          >
            Essenciais BelaPop
          </p>
          <h2
            className={`mt-2 font-display text-3xl ${
              isLight ? "text-bpBlack" : "text-bpOffWhite"
            }`}
          >
            {title}
          </h2>
          <p
            className={`mt-2 text-sm ${
              isLight ? "text-bpGraphite/80" : "text-bpPinkSoft/70"
            }`}
          >
            {subtitle}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => scrollBy(-320)}
            className={`flex h-10 w-10 items-center justify-center rounded-full border transition ${
              isLight
                ? "border-black/10 text-bpGraphite/80 hover:border-bpPink/60 hover:text-bpBlackSoft"
                : "border-white/20 text-bpOffWhite hover:border-bpPink/60"
            }`}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => scrollBy(320)}
            className={`flex h-10 w-10 items-center justify-center rounded-full border transition ${
              isLight
                ? "border-black/10 text-bpGraphite/80 hover:border-bpPink/60 hover:text-bpBlackSoft"
                : "border-white/20 text-bpOffWhite hover:border-bpPink/60"
            }`}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div ref={containerRef} className="mt-6 flex gap-4 overflow-x-auto pb-4">
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
