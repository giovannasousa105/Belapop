"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Minus, Plus, ShoppingBag, X } from "lucide-react";
import { useMemo, useState } from "react";

import { CommerceTrustMarkers } from "@/components/commerce/CommerceTrustMarkers";
import { CommerceLightFooter } from "@/components/commerce/CommerceLightFooter";
import { ShippingCalculator } from "@/components/ShippingCalculator";
import { BelaPopValidatedHeader } from "@/components/luxury/BelaPopValidatedHeader";
import { useAuth } from "@/lib/AuthContext";
import { brandCtas } from "@/lib/brand/ctas";
import { brandSectionNames } from "@/lib/brand/sections";
import { useCart } from "@/lib/CartContext";
import { usePublishedProducts } from "@/lib/hooks/useStoredProducts";
import { buildShippingItems } from "@/lib/shipping/prepareItems";
import type { Product } from "@/lib/types";

type CartEntry = {
  id: string;
  image: string;
  name: string;
  quantity: number;
  stockQuantity?: number;
  subtitle: string;
  unitPrice: number;
};

const formatCurrency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

const FREE_SHIPPING_THRESHOLD = 350;

const fallbackProductImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDJXqXTITm_Xfyh7Aup7xRF7cw3ZCJAPF-g7Z1m9vfxONcW7F0Kz0GpiRZoGzo5aDKM0SyWs2s2idW361OESpfNyRkN3vctpYBMbfzu0EYz8-ZFpzJ-6Wxy5TpkCC3pKGvt6FVT46b_-YSlPgOKtoriRYya1cUW3FGTxaR2HDEPrIKR9WgwrLeABkHsG7fZ3dJGwbvzfR3TIYpSLLR4OdCUgCoA5azYw5LVgEx4HCm2ljzlnK0Exv5V1VuPy8WtdeKf8xj5Z4Jm_GI5";

function isRenderableProductImage(value?: string | null) {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return false;
  if (normalized === "/logo.svg" || normalized === "/logo-dark.svg") return false;
  if (normalized.includes("/editorial/product-hero-")) return false;
  if (normalized.includes("/editorial/") && normalized.endsWith(".svg")) return false;
  return true;
}

function resolveProductImage(product: Product) {
  const images = [...(product.imageUrls ?? []), ...(product.images ?? [])];
  const image = images.find((item) => isRenderableProductImage(item));
  return image || fallbackProductImage;
}

function resolveProductSubtitle(product: Product) {
  const category = product.category || "Skincare";
  const quantity = product.weightKg ? `${Math.round(product.weightKg * 1000)}g` : "30ml";
  return `${category} • ${quantity}`;
}

function mapCartEntries(items: { productId: string; quantity: number }[], products: Product[]) {
  return items.reduce<CartEntry[]>((entries, item) => {
    const product = products.find((candidate) => candidate.id === item.productId);
    if (!product) {
      return entries;
    }

    entries.push({
      id: item.productId,
      image: resolveProductImage(product),
      name: product.name,
      quantity: item.quantity,
      stockQuantity: product.stockQuantity,
      subtitle: resolveProductSubtitle(product),
      unitPrice: product.price
    });

    return entries;
  }, []);
}

export function LuxuryCartExperience() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, ready, removeItem, updateQuantity, totalShipping } = useCart();
  const { products, loading: productsLoading } = usePublishedProducts();

  // Cupom: desativado — validação é server-side no checkout, não no carrinho

  const cartEntries = useMemo(() => mapCartEntries(items, products), [items, products]);
  const liveShippingItems = useMemo(
    () =>
      buildShippingItems(
        items
          .map((item) => {
            const product = products.find((candidate) => candidate.id === item.productId);
            if (!product) return null;
            return { product, quantity: item.quantity };
          })
          .filter((entry): entry is { product: Product; quantity: number } => Boolean(entry))
      ),
    [items, products]
  );
  const displayedEntries = cartEntries;
  const isEmpty = displayedEntries.length === 0;
  const isCartLoading = !ready || (items.length > 0 && productsLoading);
  const hasUnresolvedItems = ready && !productsLoading && items.length > 0 && cartEntries.length !== items.length;
  const hasStockIssue = displayedEntries.some(
    (entry) =>
      typeof entry.stockQuantity === "number" &&
      Number.isFinite(entry.stockQuantity) &&
      entry.quantity > entry.stockQuantity
  );

  const subtotal = useMemo(
    () => displayedEntries.reduce((total, entry) => total + entry.unitPrice * entry.quantity, 0),
    [displayedEntries]
  );
  const total = subtotal + totalShipping;

  const decreaseQuantity = (entry: CartEntry) => {
    updateQuantity(entry.id, entry.quantity - 1);
  };

  const increaseQuantity = (entry: CartEntry) => {
    updateQuantity(entry.id, entry.quantity + 1);
  };

  const removeEntry = (entry: CartEntry) => {
    removeItem(entry.id);
  };

  const goToCheckout = () => {
    if (isEmpty || hasUnresolvedItems || isCartLoading || hasStockIssue) return;
    if (!user) {
      router.push("/login?tab=customer&returnTo=%2Fcheckout");
      return;
    }
    router.push("/checkout");
  };

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b] [font-family:var(--font-inter)]">
      <BelaPopValidatedHeader activeSection="skincare" />

      <main className="mx-auto max-w-[1440px] px-5 pb-28 pt-24 sm:px-8 lg:px-10 lg:pb-20 lg:pt-32">
        <div className="mb-8 flex items-center gap-3 text-[10px] uppercase tracking-[0.18em] text-black/55 sm:text-xs">
          <span className="font-semibold text-black/80">Carrinho</span>
          <span>•</span>
          <span>Identificação</span>
          <span>•</span>
          <span>Pagamento</span>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-14">
          <section className="space-y-8 lg:col-span-7">
            <header className="space-y-2">
              <h1 className="[font-family:var(--font-playfair)] text-4xl font-semibold tracking-[-0.02em] sm:text-5xl">
                {brandSectionNames.cart.selection}
              </h1>
              <p className="text-sm leading-relaxed text-black/60">
                Itens selecionados para a sua rotina de cuidado.
              </p>
            </header>

            {!isEmpty && !isCartLoading ? (
              <div className="rounded-2xl border border-black/10 bg-white p-4 sm:p-5">
                {subtotal >= FREE_SHIPPING_THRESHOLD ? (
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1D9E75]">
                    Você garantiu frete grátis!
                  </p>
                ) : (
                  <p className="text-xs font-medium leading-relaxed text-black/70">
                    Faltam{" "}
                    <span className="font-semibold">
                      {formatCurrency.format(FREE_SHIPPING_THRESHOLD - subtotal)}
                    </span>{" "}
                    para você ganhar frete grátis.
                  </p>
                )}
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#f0ebe6]">
                  <div
                    className="h-full rounded-full bg-[#1D9E75] transition-all duration-300"
                    style={{
                      width: `${Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)}%`
                    }}
                  />
                </div>
              </div>
            ) : null}

            {isCartLoading ? (
              <article className="rounded-2xl border border-black/10 bg-white p-8">
                <h2 className="[font-family:var(--font-playfair)] text-2xl font-medium">
                  Carregando seu carrinho
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-black/62">
                  Estamos recuperando os itens adicionados para manter valores e disponibilidade corretos.
                </p>
              </article>
            ) : hasUnresolvedItems ? (
              <article className="rounded-2xl border border-black/10 bg-white p-8">
                <h2 className="[font-family:var(--font-playfair)] text-2xl font-medium">
                  Nao conseguimos carregar estes itens
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-black/62">
                  Revise a selecao no catalogo antes de finalizar a compra.
                </p>
                <Link
                  href="/catalogo"
                  className="mt-6 inline-flex min-h-12 items-center justify-center border border-black px-6 text-[11px] font-semibold uppercase tracking-[0.2em] transition hover:bg-black hover:text-white"
                >
                  Voltar ao catalogo
                </Link>
              </article>
            ) : isEmpty ? (
              <article className="rounded-2xl border border-black/10 bg-white p-8">
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#f6f3f2]">
                    <ShoppingBag className="h-9 w-9 text-black/30" />
                  </div>
                  <h2 className="mt-6 [font-family:var(--font-playfair)] text-2xl font-medium">
                    Sua seleção está vazia
                  </h2>
                  <p className="mt-3 max-w-xs text-sm leading-relaxed text-black/60">
                    Explore a curadoria BelaPop e adicione produtos à sua rotina.
                  </p>
                </div>
                {products.length > 0 && (
                  <div className="mt-8 grid grid-cols-3 gap-3 sm:gap-4">
                    {products.slice(0, 3).map((product) => (
                      <Link
                        key={product.id}
                        href="/catalogo"
                        className="group flex flex-col gap-2"
                      >
                        <div className="relative aspect-square overflow-hidden rounded-xl bg-[#f6f3f2]">
                          <Image
                            src={resolveProductImage(product)}
                            alt={product.name}
                            fill
                            unoptimized
                            sizes="(max-width: 640px) calc(33vw - 28px), 160px"
                            className="object-cover transition group-hover:scale-105"
                          />
                        </div>
                        <p className="line-clamp-2 text-[11px] font-medium leading-snug">{product.name}</p>
                        <p className="text-[11px] font-semibold">{formatCurrency.format(product.price)}</p>
                      </Link>
                    ))}
                  </div>
                )}
                <div className="mt-8 flex justify-center">
                  <Link
                    href="/catalogo"
                    className="inline-flex min-h-12 items-center justify-center border border-black px-6 text-[11px] font-semibold uppercase tracking-[0.2em] transition hover:bg-black hover:text-white"
                  >
                    Ver todos os produtos
                  </Link>
                </div>
              </article>
            ) : (
              <div className="space-y-6">
                {displayedEntries.map((entry) => {
                  const lineTotal = entry.unitPrice * entry.quantity;
                  return (
                    <article
                      key={entry.id}
                      className="rounded-2xl border border-black/10 bg-white p-4 sm:p-5 lg:p-6"
                    >
                      <div className="flex gap-4 sm:gap-5">
                        <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-xl bg-[#f6f3f2] sm:h-36 sm:w-28">
                          <Image
                            src={entry.image}
                            alt={entry.name}
                            fill
                            unoptimized
                            sizes="(max-width: 640px) 96px, 112px"
                            className="object-cover"
                          />
                        </div>

                        <div className="flex min-w-0 flex-1 flex-col justify-between">
                          <div className="space-y-1.5">
                            <div className="flex items-start justify-between gap-2">
                              <h2 className="[font-family:var(--font-playfair)] text-lg font-medium leading-tight sm:text-xl">
                                {entry.name}
                              </h2>
                              <button
                                type="button"
                                onClick={() => removeEntry(entry)}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-black/60 transition hover:border-black hover:text-black"
                                aria-label="Remover item"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                            <p className="text-[11px] uppercase tracking-[0.14em] text-black/55">
                              {entry.subtitle}
                            </p>
                          </div>

                          <div className="mt-4 flex items-center justify-between">
                            <div className="inline-flex items-center rounded-full border border-black/15 bg-[#f6f3f2] px-2 py-1">
                              <button
                                type="button"
                                onClick={() => decreaseQuantity(entry)}
                                className="inline-flex h-8 w-8 items-center justify-center text-black/70 transition hover:text-black"
                                aria-label="Diminuir quantidade"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="min-w-[28px] text-center text-sm font-semibold">
                                {entry.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => increaseQuantity(entry)}
                                disabled={
                                  typeof entry.stockQuantity === "number" &&
                                  entry.quantity >= entry.stockQuantity
                                }
                                className="inline-flex h-8 w-8 items-center justify-center text-black/70 transition hover:text-black"
                                aria-label="Aumentar quantidade"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                            <p className="[font-family:var(--font-playfair)] text-xl font-semibold tracking-[-0.01em] sm:text-2xl">
                              {formatCurrency.format(lineTotal)}
                            </p>
                          </div>
                          {typeof entry.stockQuantity === "number" && entry.quantity > entry.stockQuantity ? (
                            <p className="mt-3 text-xs font-semibold text-red-700">
                              Estoque disponivel: {entry.stockQuantity}. Ajuste a quantidade para continuar.
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            <section className="rounded-2xl bg-[#f6f3f2] p-6">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-black/65">
                PopClub Rewards
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-black/62">
                Faca login para acumular pontos na compra e liberar beneficios exclusivos.
              </p>
              <button
                type="button"
                onClick={() => router.push(user ? "/conta" : "/login?tab=customer&returnTo=%2Fcarrinho")}
                className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] underline underline-offset-4"
              >
                Acessar conta
              </button>
            </section>

            {liveShippingItems.length > 0 ? (
              <ShippingCalculator cartItems={liveShippingItems} tone="light" />
            ) : null}

            <CommerceTrustMarkers compact />
          </section>

          <aside className="lg:col-span-5">
            <div className="rounded-2xl border border-black/10 bg-white p-6 sm:p-8 lg:sticky lg:top-28">
              <h2 className="[font-family:var(--font-playfair)] text-3xl font-medium tracking-[-0.01em]">
                {brandSectionNames.cart.orderSummary}
              </h2>

              <div className="mt-6 border-t border-black/10 pt-5">
                <p className="text-xs text-black/45">
                  Cupons e descontos são aplicados no checkout.
                </p>
              </div>

              <div className="mt-6 space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-black/60">Subtotal</span>
                  <span className="font-medium">{formatCurrency.format(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black/60">Frete</span>
                  <span className="font-medium text-[#6c5e06]">
                    {totalShipping > 0 ? formatCurrency.format(totalShipping) : "A calcular"}
                  </span>
                </div>
              </div>

              <div className="mt-6 border-t border-black/10 pt-6">
                <div className="flex items-end justify-between">
                  <span className="text-xs uppercase tracking-[0.16em] text-black/55">Total</span>
                  <span className="[font-family:var(--font-playfair)] text-4xl font-semibold tracking-[-0.015em]">
                    {formatCurrency.format(total)}
                  </span>
                </div>
              </div>

              {!isEmpty && total > 0 && (
                <div className="mt-6 flex items-center gap-2 rounded-xl border border-[#1D9E75]/30 bg-[#f0faf5] px-4 py-3">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#1D9E75]">Pix</span>
                  <span className="text-[11px] text-black/55">5% OFF — aplicado automaticamente no pagamento</span>
                </div>
              )}

              <button
                type="button"
                onClick={goToCheckout}
                disabled={isEmpty || hasUnresolvedItems || isCartLoading || hasStockIssue}
                className="mt-4 min-h-14 w-full bg-black px-6 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {brandCtas.primary.checkout}
              </button>

              <p className="mt-4 text-center text-[11px] leading-relaxed text-black/55">
                Ao continuar, você confirma os termos da plataforma e condições do seller.
              </p>

            </div>
          </aside>
        </div>
      </main>

      <CommerceLightFooter />
    </div>
  );
}
