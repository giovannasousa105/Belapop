"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Lock, Minus, Plus, ShoppingBag, Sparkles, X } from "lucide-react";
import { useMemo, useState } from "react";

import { useCart } from "@/lib/CartContext";
import { useStoredProducts } from "@/lib/hooks/useStoredProducts";
import type { Product } from "@/lib/types";

import { LuxuryPreviewFrame } from "./luxury-preview-frame";
import {
  previewHeadlineFont,
  previewPrimaryButtonClass
} from "./luxury-preview-theme";
import { getBelapopHref, type BelapopRenderMode } from "./routes";

const UNIT_PRICE = 2450;

const formatPrice = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

type CartPreviewScreenProps = {
  mode?: BelapopRenderMode;
};

type LiveCartEntry = {
  productId: string;
  quantity: number;
  sellerId: string;
  product: Product;
};

type DisplayCartEntry = {
  key: string;
  productId?: string;
  brand: string;
  title: string;
  description: string;
  image: string;
  quantity: number;
  price: number;
};

const resolveProductImage = (product: Product) =>
  product.imageUrls?.[0] ||
  product.images?.[0] ||
  "/editorial/home-ai-card.jpg";

export function CartPreviewScreen({ mode = "preview" }: CartPreviewScreenProps) {
  const router = useRouter();
  const { items, updateQuantity, removeItem } = useCart();
  const { products } = useStoredProducts();
  const [sampleQuantity, setSampleQuantity] = useState(1);
  const [samplePreparing, setSamplePreparing] = useState(false);
  const [sampleFinished, setSampleFinished] = useState(false);
  const [sampleRemoved, setSampleRemoved] = useState(false);
  const [livePending, setLivePending] = useState(false);

  const isLive = mode === "live";
  const cartHref = getBelapopHref(mode, "cart");
  const checkoutHref = getBelapopHref(mode, "checkout");
  const homeHref = getBelapopHref(mode, "home");

  const liveEntries = useMemo(
    () =>
      items
        .map((item) => {
          const product = products.find((candidate) => candidate.id === item.productId);
          if (!product) return null;
          return { ...item, product };
        })
        .filter((item): item is LiveCartEntry => Boolean(item)),
    [items, products]
  );

  const liveSubtotal = useMemo(
    () =>
      liveEntries.reduce((total, entry) => total + entry.product.price * entry.quantity, 0),
    [liveEntries]
  );

  const sampleSubtotal = sampleRemoved ? 0 : UNIT_PRICE * sampleQuantity;
  const subtotal = isLive ? liveSubtotal : sampleSubtotal;
  const isEmpty = isLive ? liveEntries.length === 0 : sampleRemoved;

  const buttonLabel = isLive
    ? livePending
      ? "PREPARANDO..."
      : "FINALIZAR CURADORIA"
    : sampleFinished
      ? "FINALIZADO"
      : samplePreparing
        ? "PREPARANDO..."
        : "FINALIZAR CURADORIA";

  const handleDecrease = (productId?: string, currentQuantity?: number) => {
    if (isLive && productId && currentQuantity) {
      updateQuantity(productId, currentQuantity - 1);
      return;
    }
    setSampleQuantity((current) => Math.max(1, current - 1));
  };

  const handleIncrease = (productId?: string, currentQuantity?: number) => {
    if (isLive && productId && currentQuantity) {
      updateQuantity(productId, currentQuantity + 1);
      return;
    }
    setSampleQuantity((current) => current + 1);
  };

  const handleRemove = (productId?: string) => {
    if (isLive && productId) {
      removeItem(productId);
      return;
    }
    setSampleRemoved(true);
  };

  const handleCheckout = () => {
    if (isEmpty) return;

    if (isLive) {
      setLivePending(true);
      router.push(checkoutHref);
      return;
    }

    if (samplePreparing || sampleFinished) return;
    setSamplePreparing(true);

    window.setTimeout(() => {
      setSamplePreparing(false);
      setSampleFinished(true);
      router.push(checkoutHref);
    }, 900);
  };

  const displayEntries = useMemo<DisplayCartEntry[]>(
    () => {
      const sampleItem = {
        brand: "LA MER",
        name: "Creme de la Mer",
        description: "The moisturizing cream that started it all.",
        price: UNIT_PRICE,
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuB5AQX3sQ7KxwXXPeiGQWMjcrWVBf-BxbFf6k07DOwzPxv522pofJVdBn8f1P-7pLOEKc6iY0510A8wAgFXVoP7ngHQizWVHOORqITiPTEG27gVtOKYIWpvbsYeL9fRWY45VSFp4ZPp6cJW0OhnKAvNhBGt4URiUqNv8fw-Ldu0BoT_4rfvQvwb96XeLrdcM_5WJ5MBbiJh76aEjZa3EN1M6q6n6eIjauT0Ux8psVhb5sFU3P55NKsPAAlojAZskFpOSxEkVrXSeIxT",
        quantity: sampleQuantity
      };

      return isLive
        ? liveEntries.map((entry) => ({
            key: entry.productId,
            productId: entry.productId,
            brand: entry.product.brand || entry.product.category,
            title: entry.product.name,
            description: entry.product.description,
            image: resolveProductImage(entry.product),
            quantity: entry.quantity,
            price: entry.product.price * entry.quantity
          }))
        : sampleRemoved
          ? []
          : [
              {
                key: sampleItem.name,
                brand: sampleItem.brand,
                title: sampleItem.name,
                description: sampleItem.description,
                image: sampleItem.image,
                quantity: sampleItem.quantity,
                price: sampleItem.price * sampleItem.quantity
              }
            ];
    },
    [isLive, liveEntries, sampleQuantity, sampleRemoved]
  );

  return (
    <LuxuryPreviewFrame activeItem="POPCLUB" mode={mode}>
      <main className="bg-[#fcf9f8] pt-[72px]">
        <div className="mx-auto max-w-screen-2xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <header className="mb-12 max-w-3xl lg:mb-16">
            <h1
              className={`${previewHeadlineFont.className} text-4xl font-bold tracking-[-0.05em] sm:text-5xl lg:text-7xl`}
            >
              Sua Sacola
            </h1>
            <p className="mt-4 text-base italic leading-7 text-[#444748] sm:text-lg">
              &ldquo;Sua curadoria de luxo esta pronta para ser enviada.&rdquo;
            </p>
          </header>

          <div className="grid gap-8 lg:grid-cols-12 lg:items-start lg:gap-12">
            <section className="space-y-8 lg:col-span-8 lg:space-y-12">
              {!isEmpty ? (
                <>
                  {displayEntries.map((entry) => {
                    return (
                      <article
                        key={entry.key}
                        className="overflow-hidden bg-[#f6f3f2] p-5 sm:p-6 lg:p-8"
                      >
                        <div className="flex flex-col gap-6 md:flex-row md:gap-8">
                          <div className="h-72 w-full overflow-hidden bg-white sm:h-80 md:w-64 md:flex-shrink-0">
                            <img
                              alt={entry.title}
                              className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                              src={entry.image}
                            />
                          </div>

                          <div className="flex flex-1 flex-col">
                            <div className="mb-6 flex items-start justify-between gap-4">
                              <div>
                                <p className="mb-1 text-[11px] uppercase tracking-[0.22em] text-[#747878]">
                                  {entry.brand}
                                </p>
                                <h2
                                  className={`${previewHeadlineFont.className} text-2xl font-bold sm:text-3xl`}
                                >
                                  {entry.title}
                                </h2>
                                <p className="mt-2 text-sm leading-7 text-[#444748]">
                                  {entry.description}
                                </p>
                              </div>

                              <button
                                type="button"
                                aria-label="Remover item"
                                onClick={() => handleRemove(entry.productId)}
                                className="inline-flex h-11 w-11 items-center justify-center border border-black/8 text-[#747878] transition-colors hover:border-black hover:text-black"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="mt-auto flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                              <div className="inline-flex min-h-14 items-center gap-4 border border-black/10 bg-white px-4 py-2">
                                <button
                                  type="button"
                                  onClick={() => handleDecrease(entry.productId, entry.quantity)}
                                  className="inline-flex h-10 w-10 items-center justify-center transition-colors hover:text-[#ef75ce]"
                                  aria-label="Diminuir quantidade"
                                >
                                  <Minus className="h-4 w-4" />
                                </button>
                                <span className="min-w-[20px] text-center text-sm font-bold">
                                  {entry.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleIncrease(entry.productId, entry.quantity)}
                                  className="inline-flex h-10 w-10 items-center justify-center transition-colors hover:text-[#ef75ce]"
                                  aria-label="Aumentar quantidade"
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              </div>

                              <div className="text-left sm:text-right">
                                <span
                                  className={`${previewHeadlineFont.className} text-xl font-bold sm:text-2xl`}
                                >
                                  {formatPrice.format(entry.price)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}

                  <section className="flex flex-col gap-6 bg-[#e5e2e1] p-6 sm:p-8 md:flex-row md:items-center lg:p-10">
                    <div className="flex-1">
                      <h3 className={`${previewHeadlineFont.className} text-xl font-bold`}>
                        Um presente do Atelier
                      </h3>
                      <p className="mt-2 text-sm leading-7 text-[#444748]">
                        Como parte desta curadoria exclusiva, voce recebeu duas amostras premium
                        complementares da linha The Rejuvenating Night Cream.
                      </p>
                    </div>
                    <Sparkles className="h-10 w-10 text-[#6c5e06]" />
                  </section>
                </>
              ) : (
                <section className="bg-[#f6f3f2] p-6 sm:p-8 lg:p-10">
                  <div className="flex flex-col items-start gap-5">
                    <div className="flex h-14 w-14 items-center justify-center bg-black text-white">
                      <ShoppingBag className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className={`${previewHeadlineFont.className} text-3xl font-bold`}>
                        Sacola vazia
                      </h2>
                      <p className="mt-3 max-w-xl text-sm leading-7 text-[#444748]">
                        Sua selecao foi removida. Continue explorando para montar uma nova
                        curadoria premium com foco em textura, ritual e performance.
                      </p>
                    </div>
                    <Link
                      href={homeHref}
                      className="inline-flex min-h-14 items-center justify-center border border-black px-6 text-[11px] font-semibold uppercase tracking-[0.24em] transition-colors hover:bg-black hover:text-white"
                    >
                      Continuar explorando
                    </Link>
                  </div>
                </section>
              )}
            </section>

            <aside className="lg:col-span-4">
              <div className="space-y-6 lg:sticky lg:top-28">
                <section className="bg-[#f6f3f2] p-6 sm:p-8 lg:p-10">
                  <h2 className={`${previewHeadlineFont.className} text-2xl font-bold`}>
                    Resumo
                  </h2>

                  <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="uppercase tracking-[0.16em] text-[#747878]">
                        Subtotal
                      </span>
                      <span className="font-bold">{formatPrice.format(subtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="uppercase tracking-[0.16em] text-[#747878]">Frete</span>
                      <span className="font-bold text-[#6c5e06]">Gratis (Cortesia Atelier)</span>
                    </div>
                  </div>

                  <div className="mt-8 flex items-center justify-between border-t border-black/10 pt-8">
                    <span className={`${previewHeadlineFont.className} text-xl font-bold`}>
                      Total
                    </span>
                    <span className={`${previewHeadlineFont.className} text-2xl font-bold`}>
                      {formatPrice.format(subtotal)}
                    </span>
                  </div>

                  <div className="mt-8 space-y-4">
                    <button
                      type="button"
                      onClick={handleCheckout}
                      disabled={isEmpty || samplePreparing || sampleFinished || livePending}
                      className={`${previewPrimaryButtonClass} w-full`}
                    >
                      {buttonLabel}
                      {sampleFinished ? <CheckCircle2 className="h-4 w-4" /> : null}
                    </button>

                    <Link
                      href={homeHref}
                      className="inline-flex w-full justify-center py-2 text-[11px] font-bold uppercase tracking-[0.22em] underline decoration-[#6c5e06] decoration-2 underline-offset-8"
                    >
                      Continuar explorando
                    </Link>
                  </div>

                  <div className="mt-10 grid grid-cols-2 gap-4 border-t border-black/10 pt-8">
                    <div className="flex flex-col items-center p-4 text-center">
                      <Lock className="mb-2 h-5 w-5 text-[#747878]" />
                      <span className="text-[10px] uppercase tracking-[0.18em]">
                        Pagamento Seguro
                      </span>
                    </div>
                    <div className="flex flex-col items-center p-4 text-center">
                      <CheckCircle2 className="mb-2 h-5 w-5 text-[#747878]" />
                      <span className="text-[10px] uppercase tracking-[0.18em]">
                        Autenticidade Garantida
                      </span>
                    </div>
                  </div>
                </section>

                <section className="bg-black p-6 text-white sm:p-8">
                  <p className={`${previewHeadlineFont.className} text-xl font-bold`}>BelaPop</p>
                  <p className="mt-3 max-w-xs text-xs uppercase tracking-[0.18em] text-white/60">
                    Elevando a beleza ao estado de arte digital. Curadoria seleta para o olhar
                    contemporaneo.
                  </p>
                </section>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </LuxuryPreviewFrame>
  );
}
