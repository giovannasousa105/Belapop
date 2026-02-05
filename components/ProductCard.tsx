"use client";

import Link from "next/link";
import { Heart, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { LuxuryButton } from "@/components/LuxuryButton";
import { useCart } from "@/lib/CartContext";
import { sellers } from "@/data/sellers";
import { readStorage, storageKeys, writeStorage } from "@/lib/storage";
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";
import { Product } from "@/lib/types";

const toneStyles: Record<NonNullable<Product["imageTone"]>, string> = {
  rose: "from-blush-100/30 via-blush-100/10 to-white",
  blush: "from-blush-100/40 via-white to-white",
  noir: "from-noir-900/10 via-white to-white",
  plum: "from-luxe-600/20 via-blush-100/10 to-white"
};

type ProductCardProps = {
  product: Product;
  tone?: "light" | "dark";
};

export const ProductCard = ({ product, tone = "light" }: ProductCardProps) => {
  const [sellerName, setSellerName] = useState("BelaPop");
  const [isFavorite, setIsFavorite] = useState(false);
  const { addItem } = useCart();
  const isLight = tone === "light";

  const rating = useMemo(
    () => (4.6 + (product.name.length % 3) * 0.1).toFixed(1),
    [product.name]
  );
  const reviewCount = useMemo(
    () => 120 + ((product.name.length * 37) % 900),
    [product.name]
  );

  useEffect(() => {
    let active = true;
    const supabase = getSupabaseBrowserClient();
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

  useEffect(() => {
    const favorites = readStorage<string[]>(storageKeys.favorites, []);
    setIsFavorite(favorites.includes(product.id));
  }, [product.id]);

  const toggleFavorite = () => {
    const favorites = readStorage<string[]>(storageKeys.favorites, []);
    const next = favorites.includes(product.id)
      ? favorites.filter((id) => id !== product.id)
      : [...favorites, product.id];
    writeStorage(storageKeys.favorites, next);
    setIsFavorite(next.includes(product.id));
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
            <div className="absolute left-4 top-4 rounded-full border border-[#F6D6E2] bg-white/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-noir-900">
              Curadoria BelaPop
            </div>
          </div>
        </Link>
        <button
          type="button"
          onClick={toggleFavorite}
          aria-label={
            isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"
          }
          aria-pressed={isFavorite}
          className={`absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-luxe-600/70 ${
            isLight
              ? "border-black/10 bg-white text-noir-600 hover:text-luxe-600"
              : "border-white/20 bg-noir-950/70 text-blush-100/80 hover:text-blush-50"
          }`}
        >
          <Heart size={16} fill={isFavorite ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <p
          className={`text-[11px] uppercase tracking-[0.3em] ${
            isLight ? "text-noir-500" : "text-blush-100/60"
          }`}
        >
          {sellerName}
        </p>
        <h3
          className={`line-clamp-2 font-display text-lg ${
            isLight ? "text-noir-950" : "text-blush-50"
          }`}
        >
          {product.name}
        </h3>
        <div
          className={`flex items-center gap-2 text-xs ${
            isLight ? "text-noir-600" : "text-blush-100/60"
          }`}
        >
          <span className="flex items-center gap-1 text-amber-500">
            <Star size={14} fill="currentColor" stroke="none" />
            {rating}
          </span>
          <span className={isLight ? "text-noir-500" : "text-blush-100/60"}>
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
          <p className={`text-xs ${isLight ? "text-noir-500" : "text-blush-100/60"}`}>
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
