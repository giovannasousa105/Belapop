"use client";

import Link from "next/link";
import { Heart, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { LuxuryButton } from "@/components/LuxuryButton";
import { useCart } from "@/lib/CartContext";
import { sellers } from "@/data/sellers";
import { getSupabaseClient } from "@/lib/supabase/client";
import { type ProductImageTone } from "@/lib/types";

export type ProductCardData = {
  id: string;
  name: string;
  price: number;
  category: string;
  sellerId: string;
  imageTone?: ProductImageTone;
};

const toneStyles: Record<NonNullable<ProductImageTone>, string> = {
  rose: "from-bpPinkSoft/30 via-bpPinkSoft/10 to-white",
  blush: "from-bpPinkSoft/40 via-white to-white",
  noir: "from-bpBlackSoft/10 via-white to-white",
  plum: "from-bpPink/20 via-bpPinkSoft/10 to-white"
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
      const { data } = await supabase
        .from("sellers")
        .select("store_name")
        .eq("id", product.sellerId)
        .maybeSingle();
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
        <Link href={`/produto/${product.id}`} aria-label={`Ver ${product.name}`}>
          <div
            className={`relative flex h-56 w-full items-center justify-center bg-gradient-to-br ${
              toneStyles[product.imageTone ?? "rose"]
            }`}
          >
            <div className="absolute left-4 top-4 rounded-full border border-[#F6D6E2] bg-white/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-bpBlackSoft">
              Curadoria BelaPop
            </div>
          </div>
        </Link>
        <button
          type="button"
          onClick={toggleFavorite}
          aria-label={
            isWishlisted ? "Remover dos favoritos" : "Adicionar aos favoritos"
          }
          aria-pressed={isWishlisted}
          className={`absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bpPink/70 ${
            isLight
              ? "border-black/10 bg-white text-bpGraphite/80 hover:text-bpPink"
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
            href={`/produto/${product.id}`}
            ariaLabel={`Ver preço de ${product.name}`}
          >
            Ver preço
          </LuxuryButton>
          <p
            className={`text-xs ${isLight ? "text-bpGraphite/70" : "text-bpPinkSoft/60"}`}
          >
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
          Adicionar à sacola
        </LuxuryButton>
      </div>
    </div>
  );
};
