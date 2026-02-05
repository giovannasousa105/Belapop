"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { LuxuryButton } from "@/components/LuxuryButton";
import { ShippingCalculator } from "@/components/ShippingCalculator";
import { PaymentBadges } from "@/components/PaymentBadges";
import { sellers } from "@/data/sellers";
import { useStoredProducts } from "@/lib/hooks/useStoredProducts";
import { useCart } from "@/lib/CartContext";
import { buildShippingItems } from "@/lib/shipping/prepareItems";
import { formatPrice } from "@/lib/utils";
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";
import { trackEvent } from "@/lib/analytics/tracker";

const toneMap: Record<string, string> = {
  rose: "from-luxe-600/30 via-blush-100/20 to-noir-950",
  blush: "from-blush-100/30 via-noir-900 to-noir-950",
  noir: "from-noir-900 via-noir-950 to-noir-900",
  plum: "from-luxe-600/20 via-noir-900 to-noir-950"
};

export default function ProdutoPage() {
  const params = useParams();
  const router = useRouter();
  const { addItem } = useCart();
  const { products } = useStoredProducts();
  const productId = String(params?.id ?? "");

  const product = useMemo(
    () => products.find((item) => item.id === productId),
    [productId, products]
  );
  const [sellerName, setSellerName] = useState<string>("");
  const [sellerBio, setSellerBio] = useState<string | null>(null);
  const [sellerApproved, setSellerApproved] = useState(true);

  useEffect(() => {
    if (!product) return;
    void trackEvent({
      type: "view_product",
      productId: product.id,
      sellerId: product.sellerId,
      metadata: {
        productName: product.name,
        category: product.category
      }
    });
  }, [product]);

  useEffect(() => {
    if (!product) return;
    let active = true;
    const supabase = getSupabaseBrowserClient();
    const load = async () => {
      const { data } = await supabase
        .from("sellers")
        .select("store_name,responsible_name,main_category,status,bio")
        .eq("id", product.sellerId)
        .maybeSingle();
      if (!active) return;
      if (data?.store_name) {
        setSellerName(data.store_name);
        if (data.responsible_name || data.main_category) {
          setSellerBio(
            `Responsável: ${data.responsible_name ?? "-"} • ${
              data.main_category ?? "-"
            }`
          );
        } else if (data.bio) {
          setSellerBio(data.bio);
        }
        if (data.status) {
          setSellerApproved(data.status === "approved");
        } else {
          setSellerApproved(true);
        }
        return;
      }
      const seller = sellers.find((item) => item.id === product.sellerId);
      setSellerName(seller?.name ?? "Curadoria BelaPop");
      setSellerBio(seller?.bio ?? null);
      setSellerApproved(true);
    };
    void load();
    return () => {
      active = false;
    };
  }, [product]);

  if (!product || product.status !== "published" || !sellerApproved) {
    return (
      <div className="min-h-screen bg-white text-noir-900">
        <div className="mx-auto flex min-h-[60vh] w-full max-w-4xl items-center justify-center px-6">
          <p className="text-noir-500">Produto indisponível no momento.</p>
        </div>
      </div>
    );
  }

  const handleBuyNow = () => {
    addItem(product.id, 1, product.sellerId);
    router.push("/checkout");
  };

  const shippingItems = buildShippingItems([{ product, quantity: 1 }]);

  return (
    <div className="min-h-screen bg-white text-noir-900">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-16 lg:flex-row">
        <div className="flex flex-1 flex-col gap-6">
          <div
            className={`flex h-80 items-end rounded-3xl border border-black/10 bg-gradient-to-br ${
              toneMap[product.imageTone ?? "rose"]
            } p-8 shadow-sm`}
          >
            <span className="rounded-full border border-luxe-600/40 bg-luxe-600 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white">
              Curadoria BelaPop
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {(product.images.length ? product.images : ["1", "2", "3"]).map(
              (image, index) => (
                <div
                  key={`${image}-${index}`}
                  className={`h-24 rounded-2xl border border-black/10 bg-gradient-to-br ${
                    toneMap[product.imageTone ?? "rose"]
                  } opacity-80`}
                />
              )
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-6">
          <div>
            <p className="text-xs uppercase tracking-luxe text-noir-500">
              {product.category}
            </p>
            <h1 className="mt-3 font-display text-3xl text-noir-950">
              {product.name}
            </h1>
            <p className="mt-4 text-sm text-noir-600">{product.description}</p>
          </div>
          {product.highlights?.length ? (
            <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-luxe text-noir-500">
                Destaques
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-4 text-sm text-noir-600">
                {product.highlights.map((highlight) => (
                  <li key={highlight}>{highlight}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {sellerName ? (
          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <p className="text-xs uppercase tracking-luxe text-noir-500">
              Vendedor
            </p>
            <h3 className="mt-3 font-display text-xl text-noir-950">
              {sellerName}
            </h3>
            {sellerBio ? (
              <p className="mt-2 text-sm text-noir-600">{sellerBio}</p>
            ) : null}
          </div>
        ) : null}
          <ShippingCalculator
            cartItems={shippingItems}
            tone="light"
            mode="merge"
          />
          <div className="flex items-center justify-between border-t border-black/10 pt-6">
            <span className="text-2xl font-semibold text-noir-950">
              {formatPrice(product.price)}
            </span>
            <PaymentBadges tone="light" />
          </div>
          <div className="flex flex-wrap gap-4">
            <LuxuryButton
              size="lg"
              onClick={() => addItem(product.id, 1, product.sellerId)}
              tone="retail"
            >
              Adicionar ao carrinho
            </LuxuryButton>
            <LuxuryButton
              variant="outline"
              size="lg"
              onClick={handleBuyNow}
              tone="retail"
            >
              Comprar agora
            </LuxuryButton>
          </div>
        </div>
      </div>
    </div>
  );
}
