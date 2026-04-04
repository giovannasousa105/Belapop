"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Lock, Minus, Plus, ShieldCheck, Truck, X } from "lucide-react";
import { useMemo, useState } from "react";

import { CurationFlowHeader, type CurationHeaderItem } from "@/components/curation-flow/CurationFlowHeader";
import { PurchaseTrustSummary } from "@/components/legal/PurchaseTrustSummary";
import { useCart } from "@/lib/CartContext";
import { useStoredProducts } from "@/lib/hooks/useStoredProducts";
import type { Product } from "@/lib/types";

type LiveCartEntry = {
  price: number;
  product: Product;
  productId: string;
  quantity: number;
};

type DisplayCartEntry = {
  brand: string;
  description: string;
  image: string;
  key: string;
  price: number;
  productId?: string;
  quantity: number;
  title: string;
};

const fallbackImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuB5AQX3sQ7KxwXXPeiGQWMjcrWVBf-BxbFf6k07DOwzPxv522pofJVdBn8f1P-7pLOEKc6iY0510A8wAgFXVoP7ngHQizWVHOORqITiPTEG27gVtOKYIWpvbsYeL9fRWY45VSFp4ZPp6cJW0OhnKAvNhBGt4URiUqNv8fw-Ldu0BoT_4rfvQvwb96XeLrdcM_5WJ5MBbiJh76aEjZa3EN1M6q6n6eIjauT0Ux8psVhb5sFU3P55NKsPAAlojAZskFpOSxEkVrXSeIxT";

const primaryItems: CurationHeaderItem[] = [
  { label: "Skincare", href: "/skincare" },
  { label: "Maquiagem", href: "/maquiagem" },
  { label: "Cabelos", href: "/cabelos" },
  { label: "Perfumes", href: "/perfumes" }
];

const secondaryItems: CurationHeaderItem[] = [
  { label: "Favoritos", href: "/conta/favoritos" },
  { label: "POPCLUB", href: "/conta", active: true }
];

const formatPrice = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

function resolveProductImage(product: Product) {
  return product.imageUrls?.[0] || product.images?.[0] || fallbackImage;
}

export function CurationCartExperience() {
  const router = useRouter();
  const { items, removeItem, updateQuantity } = useCart();
  const { products } = useStoredProducts();
  const [sampleQuantity, setSampleQuantity] = useState(1);
  const [sampleRemoved, setSampleRemoved] = useState(false);
  const [preparingCheckout, setPreparingCheckout] = useState(false);
  const [checkoutReady, setCheckoutReady] = useState(false);

  const liveEntries = useMemo(
    () =>
      items
        .map((item) => {
          const product = products.find((candidate) => candidate.id === item.productId);
          if (!product) return null;
          return {
            price: product.price * item.quantity,
            product,
            productId: item.productId,
            quantity: item.quantity
          };
        })
        .filter((entry): entry is LiveCartEntry => Boolean(entry)),
    [items, products]
  );

  const displayEntries = useMemo<DisplayCartEntry[]>(() => {
    if (liveEntries.length) {
      return liveEntries.map((entry) => ({
        brand: entry.product.brand || entry.product.category,
        description: entry.product.description || "Curadoria premium preparada para a sua rotina.",
        image: resolveProductImage(entry.product),
        key: entry.productId,
        price: entry.price,
        productId: entry.productId,
        quantity: entry.quantity,
        title: entry.product.name
      }));
    }

    if (sampleRemoved) {
      return [];
    }

    return [
      {
        brand: "LA MER",
        description: "The moisturizing cream that started it all.",
        image: fallbackImage,
        key: "sample-creme-de-la-mer",
        price: 2450 * sampleQuantity,
        quantity: sampleQuantity,
        title: "Creme de la Mer"
      }
    ];
  }, [liveEntries, sampleQuantity, sampleRemoved]);

  const subtotal = useMemo(
    () => displayEntries.reduce((total, entry) => total + entry.price, 0),
    [displayEntries]
  );

  const isEmpty = displayEntries.length === 0;

  const handleDecrease = (entry: DisplayCartEntry) => {
    if (entry.productId) {
      updateQuantity(entry.productId, entry.quantity - 1);
      return;
    }

    setSampleQuantity((current) => Math.max(1, current - 1));
  };

  const handleIncrease = (entry: DisplayCartEntry) => {
    if (entry.productId) {
      updateQuantity(entry.productId, entry.quantity + 1);
      return;
    }

    setSampleQuantity((current) => current + 1);
  };

  const handleRemove = (entry: DisplayCartEntry) => {
    if (entry.productId) {
      removeItem(entry.productId);
      return;
    }

    setSampleRemoved(true);
  };

  const handleCheckout = () => {
    if (isEmpty || preparingCheckout || checkoutReady) return;

    setPreparingCheckout(true);

    window.setTimeout(() => {
      setPreparingCheckout(false);
      setCheckoutReady(true);
      router.push("/checkout");
    }, 900);
  };

  const buttonLabel = checkoutReady
    ? "FINALIZADO"
    : preparingCheckout
      ? "PREPARANDO..."
      : "FINALIZAR CURADORIA";

  return (
    <div className="bg-[#fcf9f8] text-[#1c1b1b]" data-belapop-page="curation-cart-public">
      <CurationFlowHeader
        theme="dark"
        logoPosition="left"
        primaryItems={primaryItems}
        secondaryItems={secondaryItems}
        mobileCtaHref="/skin-scan/diagnostico"
        mobileCtaLabel="Voltar ao Skin Scan"
      />

      <main className="mx-auto min-h-screen max-w-screen-2xl px-4 pb-16 pt-24 sm:px-6 lg:px-8 lg:pb-24 lg:pt-32">
        <header className="mb-12 max-w-3xl lg:mb-16">
          <h1 className="font-editorial text-4xl font-bold tracking-[-0.06em] sm:text-5xl lg:text-7xl">
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
                {displayEntries.map((entry) => (
                  <article key={entry.key} className="overflow-hidden bg-[#f6f3f2] p-5 sm:p-6 lg:p-8">
                    <div className="flex flex-col gap-6 md:flex-row md:gap-8">
                      <div className="h-72 w-full overflow-hidden bg-white sm:h-80 md:w-64 md:shrink-0">
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
                            <h2 className="font-editorial text-2xl font-bold sm:text-3xl">
                              {entry.title}
                            </h2>
                            <p className="mt-2 text-sm leading-7 text-[#444748]">
                              {entry.description}
                            </p>
                          </div>

                          <button
                            type="button"
                            aria-label="Remover item"
                            onClick={() => handleRemove(entry)}
                            className="inline-flex h-11 w-11 items-center justify-center border border-black/8 text-[#747878] transition-colors hover:border-black hover:text-black"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="mt-auto flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                          <div className="inline-flex min-h-14 items-center gap-4 border border-black/10 bg-white px-4 py-2">
                            <button
                              type="button"
                              onClick={() => handleDecrease(entry)}
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
                              onClick={() => handleIncrease(entry)}
                              className="inline-flex h-10 w-10 items-center justify-center transition-colors hover:text-[#ef75ce]"
                              aria-label="Aumentar quantidade"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="text-left sm:text-right">
                            <span className="font-editorial text-xl font-bold sm:text-2xl">
                              {formatPrice.format(entry.price)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}

                <section className="flex flex-col gap-6 bg-[#e5e2e1] p-6 sm:p-8 md:flex-row md:items-center lg:p-10">
                  <div className="flex-1">
                    <h3 className="font-editorial text-xl font-bold">Um presente do Atelier</h3>
                    <p className="mt-2 text-sm leading-7 text-[#444748]">
                      Como parte desta curadoria exclusiva, voce recebeu duas amostras premium
                      complementares da linha The Rejuvenating Night Cream.
                    </p>
                  </div>
                  <CheckCircle2 className="h-10 w-10 text-[#6c5e06]" />
                </section>
              </>
            ) : (
              <section className="bg-[#f6f3f2] p-6 sm:p-8 lg:p-10">
                <div className="flex flex-col items-start gap-5">
                  <div className="flex h-14 w-14 items-center justify-center bg-black text-white">
                    <ShoppingBagIcon />
                  </div>
                  <div>
                    <h2 className="font-editorial text-3xl font-bold">Sacola vazia</h2>
                    <p className="mt-3 max-w-xl text-sm leading-7 text-[#444748]">
                      Sua selecao foi removida. Continue explorando para montar uma nova curadoria
                      premium com foco em textura, ritual e performance.
                    </p>
                  </div>
                  <Link
                    href="/skin-scan/diagnostico"
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
                <h2 className="font-editorial text-2xl font-bold">Resumo</h2>

                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="uppercase tracking-[0.16em] text-[#747878]">Subtotal</span>
                    <span className="font-bold">{formatPrice.format(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="uppercase tracking-[0.16em] text-[#747878]">Frete</span>
                    <span className="font-bold text-[#6c5e06]">Gratis (Cortesia Atelier)</span>
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-between border-t border-black/10 pt-8">
                  <span className="font-editorial text-xl font-bold">Total</span>
                  <span className="font-editorial text-2xl font-bold">{formatPrice.format(subtotal)}</span>
                </div>

                <div className="mt-8 space-y-4">
                  <button
                    type="button"
                    onClick={handleCheckout}
                    disabled={isEmpty || preparingCheckout || checkoutReady}
                    className="inline-flex min-h-14 w-full items-center justify-center gap-3 bg-black px-5 text-xs font-bold uppercase tracking-[0.22em] text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {buttonLabel}
                    {checkoutReady ? <CheckCircle2 className="h-4 w-4" /> : null}
                  </button>

                  <Link
                    href="/skin-scan/diagnostico"
                    className="block text-center text-xs font-bold uppercase tracking-[0.2em] text-black underline decoration-[#ed93d5] underline-offset-8"
                  >
                    Continuar explorando
                  </Link>
                </div>

                <div className="mt-10 grid grid-cols-2 gap-4 border-t border-black/10 pt-8">
                  <div className="flex flex-col items-center gap-2 p-4 text-center">
                    <Lock className="h-5 w-5 text-[#444748]" />
                    <span className="text-[10px] uppercase tracking-[0.18em]">Pagamento Seguro</span>
                  </div>
                  <div className="flex flex-col items-center gap-2 p-4 text-center">
                    <ShieldCheck className="h-5 w-5 text-[#444748]" />
                    <span className="text-[10px] uppercase tracking-[0.18em]">Autenticidade Garantida</span>
                  </div>
                  <div className="col-span-2 flex flex-col items-center gap-2 p-4 text-center">
                    <Truck className="h-5 w-5 text-[#444748]" />
                    <span className="text-[10px] uppercase tracking-[0.18em]">Entrega Concierge</span>
                  </div>
                </div>

                <PurchaseTrustSummary context="cart" className="mt-6" />
              </section>
            </div>
          </aside>
        </div>
      </main>

      <footer className="mt-24 bg-black px-6 py-16 text-white sm:px-8 lg:px-12 lg:py-20">
        <div className="mx-auto flex max-w-screen-2xl flex-col items-start gap-12 md:flex-row md:justify-between">
          <div className="max-w-xs space-y-6">
            <span className="font-editorial text-xl">BelaPop</span>
            <p className="text-xs tracking-wider text-white/60">
              Elevando a beleza ao estado de arte digital. Curadoria seleta para o olhar
              contemporaneo.
            </p>
          </div>

          <div className="max-w-sm space-y-2 text-xs leading-6 text-white/60">
            <p>63.945.608 GIOVANNA DE SOUSA FERREIRA SANTOS</p>
            <p>CNPJ 63.945.608/0001-09</p>
            <p>Rua Coromandel, 189, Bairro Amorim, Araguari/MG, CEP 38446-093</p>
            <p className="uppercase tracking-[0.16em] text-white/45">
              E-mail institucional e canal de privacidade pendentes de validacao operacional.
            </p>
          </div>

          <div className="flex flex-col gap-12 md:flex-row md:gap-24">
            <div className="space-y-4">
              <h5 className="text-xs font-bold uppercase tracking-[0.22em] text-[#ed93d5]">
                Explorar
              </h5>
              <div className="space-y-2 text-xs uppercase tracking-[0.18em] text-white/60">
                <Link className="block transition-colors hover:text-[#ed93d5]" href="/aviso-de-privacidade">
                  Privacidade
                </Link>
                <Link className="block transition-colors hover:text-[#ed93d5]" href="/termos-e-condicoes">
                  Termos de Uso
                </Link>
              </div>
            </div>

            <div className="space-y-4">
              <h5 className="text-xs font-bold uppercase tracking-[0.22em] text-[#ed93d5]">
                Atendimento
              </h5>
              <div className="space-y-2 text-xs uppercase tracking-[0.18em] text-white/60">
                <Link className="block transition-colors hover:text-[#ed93d5]" href="/seguranca">
                  Sustentabilidade
                </Link>
                <Link className="block transition-colors hover:text-[#ed93d5]" href="/rastreio">
                  Rastreio
                </Link>
                <Link className="block transition-colors hover:text-[#ed93d5]" href="/contato">
                  Contato
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-12 flex max-w-screen-2xl flex-col items-start justify-between gap-6 border-t border-white/10 pt-8 text-xs uppercase tracking-[0.18em] text-white/60 md:flex-row md:items-center">
          <p>© 2024 BelaPop Atelie Digital. Todos os direitos reservados.</p>
          <div className="flex gap-6">
            <span className="transition-colors hover:text-white">Public</span>
            <span className="transition-colors hover:text-white">Hub</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ShoppingBagIcon() {
  return <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 stroke-current" strokeWidth="1.8"><path d="M6 8h12l-1 11H7L6 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg>;
}
