"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { LuxuryButton } from "@/components/LuxuryButton";
import { sellers } from "@/data/sellers";
import { useCart } from "@/lib/CartContext";
import { getProductDisplayImage } from "@/lib/product/productCovers";
import { getSupabaseClient } from "@/lib/supabase/client";
import { type ProductImageTone } from "@/lib/types";

export type ProductCardData = {
  id: string;
  slug?: string;
  name: string;
  price: number;
  category: string;
  sellerId: string;
  imageUrl?: string | null;
  images?: string[] | null;
  imageTone?: ProductImageTone;
};

const toneStyles: Record<NonNullable<ProductImageTone>, string> = {
  rose: "from-bpPinkSoft/30 via-bpPinkSoft/10 to-transparent",
  blush: "from-bpPinkSoft/40 via-white/10 to-transparent",
  noir: "from-bpBlackSoft/15 via-bpBlackSoft/5 to-transparent",
  plum: "from-bpPink/25 via-bpPinkSoft/10 to-transparent"
};

type ProductCardProps = {
  product: ProductCardData;
  tone?: "light" | "dark";
  ratingAvg?: number;
  ratingCount?: number;
  isWishlisted?: boolean;
  onToggleWishlist?: (productId: string) => void;
};

export const ProductCard = ({
  product,
  tone = "light",
  ratingAvg,
  ratingCount,
  isWishlisted,
  onToggleWishlist
}: ProductCardProps) => {
  const [sellerName, setSellerName] = useState("BelaPop");
  const { addItem } = useCart();
  const isLight = tone === "light";

  const productHref = `/produto/${product.slug ?? product.id}`;
  const imageUrl = useMemo(
    () =>
      getProductDisplayImage({
        category: product.category,
        heroImageUrl: product.imageUrl,
        coverImage: Array.isArray(product.images) ? product.images[0] : null
      }),
    [product.category, product.imageUrl, product.images]
  );
  const imageIsSvg = imageUrl.toLowerCase().includes(".svg");

  const rating = useMemo(() => {
    if (typeof ratingAvg === "number" && ratingAvg > 0) {
      return ratingAvg.toFixed(1);
    }
    return (4.6 + (product.name.length % 3) * 0.1).toFixed(1);
  }, [ratingAvg, product.name.length]);

  const reviewCount = useMemo(() => {
    if (typeof ratingCount === "number" && ratingCount > 0) {
      return ratingCount;
    }
    return 120 + ((product.name.length * 37) % 900);
  }, [ratingCount, product.name.length]);

  useEffect(() => {
    let active = true;
    const supabase = getSupabaseClient();
    const load = async () => {
      const { data } = await supabase.from("sellers").select("store_name").eq("id", product.sellerId).maybeSingle();
      if (!active) return;
      if (data?.store_name) {
        setSellerName(data.store_name);
        return;
      }
      const fallback = sellers.find((item) => item.id === product.sellerId);
      if (fallback?.name) {
        setSellerName(fallback.name);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [product.sellerId]);

  const toggleFavorite = () => {
    if (!onToggleWishlist) return;
    onToggleWishlist(product.id);
  };

  return (
    <div className="group flex h-full flex-col overflow-hidden bg-white">
      <div className="relative">
        <Link href={productHref} aria-label={`Ver ${product.name}`}>
          <div className="relative h-56 w-full overflow-hidden bg-bpOffWhite">
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 767px) 90vw, (max-width: 1279px) 33vw, 25vw"
              className="object-cover transition duration-500 group-hover:scale-[1.02]"
              unoptimized={imageIsSvg}
            />
            <div
              className={`absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t ${toneStyles[product.imageTone ?? "rose"]}`}
            />
            <div className="absolute left-4 top-4 rounded-full border border-[#F6D6E2] bg-white/92 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-bpBlackSoft">
              Curadoria BelaPop
            </div>
          </div>
        </Link>
        <button
          type="button"
          onClick={toggleFavorite}
          aria-label={isWishlisted ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          aria-pressed={isWishlisted}
          className={`absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bpPink/70 ${
            isLight
              ? "border-black/10 bg-white/92 text-bpGraphite/80 hover:text-bpPink"
              : "border-white/20 bg-bpBlack/70 text-bpPinkSoft/80 hover:text-bpOffWhite"
          }`}
        >
          <Heart size={16} fill={isWishlisted ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <p
          className={`text-[11px] uppercase tracking-[0.3em] ${
            isLight ? "text-bpGraphite/70" : "text-bpPinkSoft/60"
          }`}
        >
          {sellerName}
        </p>
        <h3
          className={`line-clamp-2 font-display text-lg ${
            isLight ? "text-bpBlack" : "text-bpOffWhite"
          }`}
        >
          {product.name}
        </h3>
        <div
          className={`flex items-center gap-2 text-xs ${
            isLight ? "text-bpGraphite/80" : "text-bpPinkSoft/60"
          }`}
        >
          <span className="flex items-center gap-1 text-amber-500">
            <Star size={14} fill="currentColor" stroke="none" />
            {rating}
          </span>
          <span className={isLight ? "text-bpGraphite/70" : "text-bpPinkSoft/60"}>
            ({reviewCount})
          </span>
        </div>

        <div className="mt-auto space-y-2">
          <LuxuryButton
            size="sm"
            variant="primary"
            className="w-full rounded-full text-[11px] uppercase tracking-[0.2em]"
            href={productHref}
            ariaLabel={`Ver preco de ${product.name}`}
          >
            Ver preco
          </LuxuryButton>
          <p className={`text-xs ${isLight ? "text-bpGraphite/70" : "text-bpPinkSoft/60"}`}>
            Valor exibido ao abrir o produto.
          </p>
        </div>

        <LuxuryButton
          type="button"
          size="sm"
          variant="secondary"
          className="w-full rounded-full text-[11px] uppercase tracking-[0.2em]"
          onClick={() => addItem(product.id, 1, product.sellerId)}
        >
          Adicionar a sacola
        </LuxuryButton>
      </div>
    </div>
  );
};
