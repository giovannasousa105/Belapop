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
import { useAuth } from "@/lib/AuthContext";

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  is_verified: boolean;
  created_at: string;
  profiles?: { full_name: string | null } | null;
};

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
  const { user } = useAuth();
  const { products } = useStoredProducts();
  const productId = String(params?.id ?? "");

  const product = useMemo(
    () => products.find((item) => item.id === productId),
    [productId, products]
  );
  const [sellerName, setSellerName] = useState<string>("");
  const [sellerBio, setSellerBio] = useState<string | null>(null);
  const [sellerApproved, setSellerApproved] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [ratingAvg, setRatingAvg] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewStatus, setReviewStatus] = useState<string | null>(null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

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
    if (!productId) return;
    const loadReviews = async () => {
      const res = await fetch(`/api/reviews?productId=${productId}`);
      const json = (await res.json()) as {
        reviews: Review[];
        ratingAvg: number;
        ratingCount: number;
      };
      setReviews(json.reviews ?? []);
      setRatingAvg(json.ratingAvg ?? 0);
      setRatingCount(json.ratingCount ?? 0);
    };
    void loadReviews();
  }, [productId]);

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
            <div className="mt-2 flex items-center gap-2 text-xs text-noir-600">
              <span className="font-semibold text-noir-900">
                {ratingAvg ? ratingAvg.toFixed(1) : "0.0"}
              </span>
              <span className="text-noir-400">•</span>
              <span>{ratingCount} avaliações</span>
            </div>
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
          <ShippingCalculator cartItems={shippingItems} tone="light" mode="merge" />
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

          <div
            id="avaliacoes"
            className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-noir-500">
              Avaliações
            </p>
            <h3 className="mt-3 font-display text-2xl text-noir-950">
              Impressões reais, curadoria honesta
            </h3>
            <p className="mt-2 text-sm text-noir-600">
              {ratingCount
                ? `${ratingAvg.toFixed(1)} • ${ratingCount} avaliações`
                : "Ainda não há avaliações para este produto."}
            </p>

            <div className="mt-6 space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-2xl border border-black/10 bg-noir-50 p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-noir-900">
                      {review.profiles?.full_name ?? "Cliente BelaPop"}
                    </p>
                    {review.is_verified ? (
                      <span className="rounded-full bg-luxe-600/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-luxe-700">
                        Compra verificada
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-xs text-noir-500">
                    Nota {review.rating} •{" "}
                    {new Date(review.created_at).toLocaleDateString("pt-BR")}
                  </p>
                  {review.comment ? (
                    <p className="mt-2 text-sm text-noir-700">
                      {review.comment}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-2xl border border-black/10 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-noir-500">
                Sua avaliação
              </p>
              {user ? (
                <form
                  onSubmit={async (event) => {
                    event.preventDefault();
                    setReviewSubmitting(true);
                    setReviewStatus(null);
                    const res = await fetch("/api/reviews", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        productId: product.id,
                        rating: reviewRating,
                        comment: reviewComment
                      })
                    });
                    if (!res.ok) {
                      setReviewStatus(
                        "Somente clientes que compraram podem avaliar."
                      );
                    } else {
                      setReviewStatus("Avaliação enviada com sucesso.");
                      setReviewComment("");
                      const refreshed = await fetch(
                        `/api/reviews?productId=${product.id}`
                      );
                      const json = (await refreshed.json()) as {
                        reviews: Review[];
                        ratingAvg: number;
                        ratingCount: number;
                      };
                      setReviews(json.reviews ?? []);
                      setRatingAvg(json.ratingAvg ?? 0);
                      setRatingCount(json.ratingCount ?? 0);
                    }
                    setReviewSubmitting(false);
                  }}
                  className="mt-4 space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-noir-600">Nota (1-5)</label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={reviewRating}
                      onChange={(event) =>
                        setReviewRating(Number(event.target.value))
                      }
                      className="w-20 rounded-xl border border-black/10 px-3 py-2 text-sm"
                    />
                  </div>
                  <textarea
                    value={reviewComment}
                    onChange={(event) => setReviewComment(event.target.value)}
                    placeholder="Escreva sua experiência com o produto."
                    className="min-h-[120px] w-full rounded-2xl border border-black/10 px-4 py-3 text-sm text-noir-700"
                  />
                  {reviewStatus ? (
                    <p className="text-xs text-noir-500">{reviewStatus}</p>
                  ) : null}
                  <LuxuryButton
                    type="submit"
                    size="sm"
                    tone="retail"
                    disabled={reviewSubmitting}
                  >
                    Enviar avaliação
                  </LuxuryButton>
                </form>
              ) : (
                <div className="mt-4 text-sm text-noir-600">
                  Entre para avaliar este produto.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
