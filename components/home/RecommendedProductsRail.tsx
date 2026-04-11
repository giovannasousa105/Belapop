"use client";

import { useEffect, useMemo, useState } from "react";

import { CatalogProductCard } from "@/components/catalog/ProductCard";
import { useAuth } from "@/lib/AuthContext";
import { getCustomerRecommendations } from "@/lib/customer/api";

type RecommendedRailProduct = {
  id: string;
  slug: string;
  title: string;
  brand?: string | null;
  category?: string | null;
  price_cents?: number;
  badges?: string[] | null;
  tags?: string[] | null;
  hero_image_url?: string | null;
  coverImage?: string | null;
};

type RecommendedProductsRailProps = {
  fallbackProducts: RecommendedRailProduct[];
};

const mapRecommendationToCard = (item: Awaited<ReturnType<typeof getCustomerRecommendations>>["items"][number]): RecommendedRailProduct => ({
  id: item.id,
  slug: item.slug,
  title: item.title,
  brand: item.brand,
  category: item.category,
  price_cents: item.price_cents ?? 0,
  badges: item.badges,
  tags: item.tags,
  hero_image_url: item.hero_image_url
});

export function RecommendedProductsRail({ fallbackProducts }: RecommendedProductsRailProps) {
  const { ready, user } = useAuth();
  const [products, setProducts] = useState<RecommendedRailProduct[]>(fallbackProducts);
  const [personalized, setPersonalized] = useState(false);

  useEffect(() => {
    let active = true;

    if (!ready) return () => void 0;

    if (!user) {
      setProducts(fallbackProducts);
      setPersonalized(false);
      return () => {
        active = false;
      };
    }

    const load = async () => {
      try {
        const response = await getCustomerRecommendations(4);
        if (!active || !response.items.length) return;
        setProducts(response.items.map(mapRecommendationToCard));
        setPersonalized(true);
      } catch {
        if (!active) return;
        setProducts(fallbackProducts);
        setPersonalized(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [fallbackProducts, ready, user]);

  const subtitle = useMemo(() => {
    if (personalized) return "Baseado no que voce viu, favoritou e pesquisou recentemente.";
    if (user) return "Seu bloco personalizado entra assim que os sinais de descoberta comecarem a chegar.";
    return "Entre na sua conta para transformar este trilho em recomendacao personalizada.";
  }, [personalized, user]);

  if (!products.length) return null;

  return (
    <div>
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-bpPink">Discovery engine</p>
          <h2 className="mt-2 font-display text-3xl text-bpBlack md:text-4xl">Recomendado para voce</h2>
          <p className="mt-3 max-w-2xl text-[0.92rem] leading-6 text-bpGraphite/86 sm:text-sm sm:leading-relaxed">{subtitle}</p>
          <p className="mt-2 text-xs uppercase tracking-[0.22em] text-bpGraphite/55 md:hidden">
            Deslize para ver mais
          </p>
        </div>
      </div>

          <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden md:hidden">
        {products.map((product) => (
          <div key={product.id} className="w-[72vw] max-w-[264px] shrink-0 snap-start">
            <CatalogProductCard product={product} />
          </div>
        ))}
      </div>

      <div className="hidden grid-cols-2 gap-4 md:grid md:grid-cols-4">
        {products.map((product) => (
          <CatalogProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
