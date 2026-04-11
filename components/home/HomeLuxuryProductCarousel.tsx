"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { getProductDisplayImage } from "@/lib/product/productCovers";
import type { EditorialProduct } from "@/lib/queries/products";
import { formatPrice } from "@/lib/utils";

type HomeLuxuryProductCarouselProps = {
  products: EditorialProduct[];
  theme?: "light" | "dark";
};

export function HomeLuxuryProductCarousel({
  products,
  theme = "light"
}: HomeLuxuryProductCarouselProps) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const isLight = theme === "light";

  const palette = useMemo(
    () =>
      isLight
        ? {
            card: "border-[#DDD3CA] bg-white/80",
            media: "bg-[#EFE7DE]",
            tag: "text-[#C88FA3]",
            text: "text-[#1B1A18]",
            muted: "text-[#5F5A55]",
            price: "text-[#1B1A18]",
            button:
              "border-[#DDD3CA] text-[#1B1A18] hover:border-[#C88FA3] hover:bg-[#C88FA3] hover:text-white",
            nav:
              "border-[#DDD3CA] bg-white/80 text-[#1B1A18] hover:border-[#C88FA3] hover:text-[#C88FA3]"
          }
        : {
            card: "border-white/10 bg-[#0f0f0f]",
            media: "bg-[#171717]",
            tag: "text-[#e7b8c9]",
            text: "text-white",
            muted: "text-white/60",
            price: "text-white",
            button:
              "border-white/10 text-white hover:border-[#e7b8c9] hover:bg-[#e7b8c9] hover:text-black",
            nav:
              "border-white/10 bg-[#111111] text-white hover:border-[#e7b8c9] hover:text-[#e7b8c9]"
          },
    [isLight]
  );

  const syncScrollState = () => {
    const rail = railRef.current;
    if (!rail) return;

    const maxScroll = Math.max(rail.scrollWidth - rail.clientWidth, 0);
    setCanScrollPrev(rail.scrollLeft > 8);
    setCanScrollNext(rail.scrollLeft < maxScroll - 8);
  };

  const getScrollStep = () => {
    const rail = railRef.current;
    if (!rail) return 320;

    const firstCard = rail.querySelector<HTMLElement>("[data-carousel-card]");
    if (!firstCard) return 320;

    const cardWidth = firstCard.offsetWidth;
    const gap = 24;
    return cardWidth + gap;
  };

  const scrollRail = (direction: "left" | "right") => {
    const rail = railRef.current;
    if (!rail) return;

    const delta = getScrollStep() * (direction === "left" ? -1 : 1);
    rail.scrollBy({ left: delta, behavior: "smooth" });
  };

  useEffect(() => {
    syncScrollState();
    const rail = railRef.current;
    if (!rail) return;

    rail.addEventListener("scroll", syncScrollState, { passive: true });
    window.addEventListener("resize", syncScrollState);

    return () => {
      rail.removeEventListener("scroll", syncScrollState);
      window.removeEventListener("resize", syncScrollState);
    };
  }, [products.length]);

  if (!products.length) return null;

  return (
    <div className="relative">
      <div className="mb-6 flex items-center justify-end gap-3">
        <button
          type="button"
          aria-label="Produtos anteriores"
          onClick={() => scrollRail("left")}
          disabled={!canScrollPrev}
          className={`inline-flex h-11 w-11 items-center justify-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-35 ${palette.nav}`}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Proximos produtos"
          onClick={() => scrollRail("right")}
          disabled={!canScrollNext}
          className={`inline-flex h-11 w-11 items-center justify-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-35 ${palette.nav}`}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div
        ref={railRef}
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((product) => {
          const imageUrl = getProductDisplayImage({
            category: product.category,
            heroImageUrl: product.hero_image_url,
            coverImage: product.coverImage
          });

          return (
            <article
              key={product.id}
              data-carousel-card
              className={`group min-w-[286px] max-w-[286px] snap-start rounded-[32px] border p-5 transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_70px_rgba(0,0,0,0.06)] sm:min-w-[320px] sm:max-w-[320px] ${palette.card}`}
            >
              <Link href={`/produto/${product.slug}`} className="block">
                <div className={`relative h-72 overflow-hidden rounded-[24px] ${palette.media}`}>
                  <Image
                    src={imageUrl}
                    alt={product.title}
                    fill
                    className="object-cover transition duration-700 group-hover:scale-105"
                    sizes="(max-width: 640px) 80vw, 320px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-white/20" />
                  <div className="absolute bottom-4 left-4 rounded-full border border-white/50 bg-white/70 px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-[#1B1A18] backdrop-blur-sm">
                    {product.badge || "BelaPick"}
                  </div>
                </div>
              </Link>

              <div className="mt-5">
                <p className={`text-[11px] uppercase tracking-[0.28em] ${palette.tag}`}>
                  {product.category}
                </p>
                <h4 className={`mt-3 font-display text-2xl leading-tight ${palette.text}`}>
                  {product.title}
                </h4>
                <p className={`mt-3 text-sm leading-6 ${palette.muted}`}>
                  {product.editorialReason}
                </p>
                <div className="mt-5 flex items-center justify-between gap-4">
                  <span className={`text-sm uppercase tracking-[0.2em] ${palette.price}`}>
                    {formatPrice(product.price)}
                  </span>
                  <Link
                    href={`/produto/${product.slug}`}
                    className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.22em] transition ${palette.button}`}
                  >
                    Comprar
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
