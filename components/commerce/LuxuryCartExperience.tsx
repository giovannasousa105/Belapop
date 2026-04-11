"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Minus, Plus, ShieldCheck, Truck, X } from "lucide-react";
import { useMemo, useState } from "react";

import { CommerceLightFooter } from "@/components/commerce/CommerceLightFooter";
import { BelaPopValidatedHeader } from "@/components/luxury/BelaPopValidatedHeader";
import { useCart } from "@/lib/CartContext";
import { useStoredProducts } from "@/lib/hooks/useStoredProducts";
import type { Product } from "@/lib/types";

type CartEntry = {
  id: string;
  image: string;
  isSample: boolean;
  name: string;
  quantity: number;
  subtitle: string;
  unitPrice: number;
};

const formatCurrency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

const fallbackProductImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDJXqXTITm_Xfyh7Aup7xRF7cw3ZCJAPF-g7Z1m9vfxONcW7F0Kz0GpiRZoGzo5aDKM0SyWs2s2idW361OESpfNyRkN3vctpYBMbfzu0EYz8-ZFpzJ-6Wxy5TpkCC3pKGvt6FVT46b_-YSlPgOKtoriRYya1cUW3FGTxaR2HDEPrIKR9WgwrLeABkHsG7fZ3dJGwbvzfR3TIYpSLLR4OdCUgCoA5azYw5LVgEx4HCm2ljzlnK0Exv5V1VuPy8WtdeKf8xj5Z4Jm_GI5";

const sampleCartEntries: CartEntry[] = [
  {
    id: "sample-serum-vitamina-c",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDJXqXTITm_Xfyh7Aup7xRF7cw3ZCJAPF-g7Z1m9vfxONcW7F0Kz0GpiRZoGzo5aDKM0SyWs2s2idW361OESpfNyRkN3vctpYBMbfzu0EYz8-ZFpzJ-6Wxy5TpkCC3pKGvt6FVT46b_-YSlPgOKtoriRYya1cUW3FGTxaR2HDEPrIKR9WgwrLeABkHsG7fZ3dJGwbvzfR3TIYpSLLR4OdCUgCoA5azYw5LVgEx4HCm2ljzlnK0Exv5V1VuPy8WtdeKf8xj5Z4Jm_GI5",
    isSample: true,
    name: "Serum Iluminador Vitamina C+",
    quantity: 1,
    subtitle: "Skincare • 30ml",
    unitPrice: 189
  },
  {
    id: "sample-hidratante-noturno",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAECpaxnOIZxdlmWaehm5yo126HIkZLFm9GGrwxqc1gyMj2gUFi06s1QGSvWftIj5Vd7OsndSy0Rr2YFMN0mO2K9XRS3slrXezGsr65J7waw80q4rtPP6J7KZsLHO8HdQnYzluIq9dA-Ww2QkKOrq9VJbCAU5JIq1lW_tQG54e7a8u40J8ppAL29S4YAAKwv38kQLbtPRr8zCsI1s44VyfPACdT6MjiC6cCGDXupDQgcob4HfUvlc8K9O7wvbfjSaARPLzQE9YrPE99",
    isSample: true,
    name: "Hidratante Facial de Noite",
    quantity: 1,
    subtitle: "Skincare • 50g",
    unitPrice: 145
  }
];

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
    if (!product) return entries;

    entries.push({
      id: item.productId,
      image: resolveProductImage(product),
      isSample: false,
      name: product.name,
      quantity: item.quantity,
      subtitle: resolveProductSubtitle(product),
      unitPrice: product.price
    });

    return entries;
  }, []);
}

function TrustRow() {
  return (
    <section className="grid grid-cols-3 gap-3 rounded-2xl bg-[#f6f3f2] p-5">
      <div className="flex flex-col items-center gap-2 text-center">
        <ShieldCheck className="h-5 w-5 text-black/65" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/70">
          Ambiente seguro
        </span>
      </div>
      <div className="flex flex-col items-center gap-2 text-center">
        <Truck className="h-5 w-5 text-black/65" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/70">
          Logistica premium
        </span>
      </div>
      <div className="flex flex-col items-center gap-2 text-center">
        <Lock className="h-5 w-5 text-black/65" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/70">
          Pagamento seguro
        </span>
      </div>
    </section>
  );
}

export function LuxuryCartExperience() {
  const router = useRouter();
  const { items, removeItem, updateQuantity } = useCart();
  const { products } = useStoredProducts();
  const [sampleEntriesState, setSampleEntriesState] = useState<CartEntry[]>(sampleCartEntries);

  const cartEntries = useMemo(() => mapCartEntries(items, products), [items, products]);
  const showingSamples = cartEntries.length === 0;
  const displayedEntries = showingSamples ? sampleEntriesState : cartEntries;
  const isEmpty = displayedEntries.length === 0;

  const subtotal = useMemo(
    () => displayedEntries.reduce((total, entry) => total + entry.unitPrice * entry.quantity, 0),
    [displayedEntries]
  );
  const total = subtotal;

  const decreaseQuantity = (entry: CartEntry) => {
    if (!entry.isSample) {
      updateQuantity(entry.id, entry.quantity - 1);
      return;
    }
    setSampleEntriesState((current) =>
      current.map((item) =>
        item.id === entry.id ? { ...item, quantity: Math.max(1, item.quantity - 1) } : item
      )
    );
  };

  const increaseQuantity = (entry: CartEntry) => {
    if (!entry.isSample) {
      updateQuantity(entry.id, entry.quantity + 1);
      return;
    }
    setSampleEntriesState((current) =>
      current.map((item) => (item.id === entry.id ? { ...item, quantity: item.quantity + 1 } : item))
    );
  };

  const removeEntry = (entry: CartEntry) => {
    if (!entry.isSample) {
      removeItem(entry.id);
      return;
    }
    setSampleEntriesState((current) => current.filter((item) => item.id !== entry.id));
  };

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b] [font-family:var(--font-inter)]">
      <BelaPopValidatedHeader activeSection="skincare" />

      <main className="mx-auto max-w-[1440px] px-5 pb-28 pt-24 sm:px-8 lg:px-10 lg:pb-20 lg:pt-32">
        <div className="mb-8 flex items-center gap-3 text-[10px] uppercase tracking-[0.18em] text-black/55 sm:text-xs">
          <span className="font-semibold text-black/80">Sacola</span>
          <span>•</span>
          <span>Identificacao</span>
          <span>•</span>
          <span>Pagamento</span>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-14">
          <section className="space-y-8 lg:col-span-7">
            <header className="space-y-2">
              <h1 className="[font-family:var(--font-playfair)] text-4xl font-semibold tracking-[-0.02em] sm:text-5xl">
                Sua Curadoria
              </h1>
              <p className="text-sm leading-relaxed text-black/60">
                Itens selecionados para a sua rotina de cuidado.
              </p>
            </header>

            {isEmpty ? (
              <article className="rounded-2xl border border-black/10 bg-white p-8">
                <h2 className="[font-family:var(--font-playfair)] text-2xl font-medium">Sacola vazia</h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-black/62">
                  Adicione produtos para continuar com checkout seguro e acompanhamento do pedido.
                </p>
                <Link
                  href="/skincare"
                  className="mt-6 inline-flex min-h-12 items-center justify-center border border-black px-6 text-[11px] font-semibold uppercase tracking-[0.2em] transition hover:bg-black hover:text-white"
                >
                  Explorar produtos
                </Link>
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
              <button className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] underline underline-offset-4">
                Acessar conta
              </button>
            </section>

            <TrustRow />
          </section>

          <aside className="lg:col-span-5">
            <div className="rounded-2xl border border-black/10 bg-white p-6 sm:p-8 lg:sticky lg:top-28">
              <h2 className="[font-family:var(--font-playfair)] text-3xl font-medium tracking-[-0.01em]">
                Resumo do pedido
              </h2>

              <div className="mt-7 space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-black/60">Subtotal</span>
                  <span className="font-medium">{formatCurrency.format(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-black/60">Frete</span>
                  <span className="font-medium text-[#6c5e06]">Gratis</span>
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

              <button
                type="button"
                onClick={() => router.push("/checkout")}
                disabled={isEmpty}
                className="mt-8 min-h-14 w-full bg-black px-6 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-45"
              >
                Finalizar curadoria com seguranca
              </button>

              <p className="mt-4 text-center text-[11px] leading-relaxed text-black/55">
                Ao continuar, voce confirma os termos da plataforma e condicoes do seller.
              </p>
            </div>
          </aside>
        </div>
      </main>

      <CommerceLightFooter />
    </div>
  );
}
