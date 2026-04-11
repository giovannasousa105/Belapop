"use client";

/* eslint-disable @next/next/no-img-element */

import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, CreditCard, Lock, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";

import { useCart } from "@/lib/CartContext";
import { useStoredProducts } from "@/lib/hooks/useStoredProducts";
import type { Product } from "@/lib/types";

import { LuxuryPreviewFrame } from "./luxury-preview-frame";
import {
  previewHeadlineFont,
  previewInputClass,
  previewPrimaryButtonClass
} from "./luxury-preview-theme";
import { getBelapopHref, type BelapopRenderMode } from "./routes";

type PaymentMethod = "saved-card" | "new-card" | "pix";

type CheckoutPreviewScreenProps = {
  mode?: BelapopRenderMode;
};

type LiveCartEntry = {
  productId: string;
  quantity: number;
  sellerId: string;
  product: Product;
};

const formatCurrency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

export function CheckoutPreviewScreen({ mode = "preview" }: CheckoutPreviewScreenProps) {
  const router = useRouter();
  const { items } = useCart();
  const { products } = useStoredProducts();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("saved-card");
  const [saveCard, setSaveCard] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [address, setAddress] = useState({
    fullName: "",
    street: "",
    number: "",
    city: "",
    state: "",
    zip: ""
  });
  const [message, setMessage] = useState<string | null>(null);

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

  const product = liveEntries[0]?.product;
  const quantity = liveEntries[0]?.quantity ?? 1;
  const subtotal = liveEntries.reduce(
    (total, entry) => total + entry.product.price * entry.quantity,
    0
  );
  const total = subtotal;
  const orderHref = getBelapopHref(mode, "order");
  const isLive = mode === "live";
  const displayTitle = product?.name ?? "Soro Regenerador Orquidea Imperial";
  const displayBrand = product?.brand || product?.category || "Orchidee Imperiale";
  const displayImage =
    product?.imageUrls?.[0] ||
    product?.images?.[0] ||
    "https://lh3.googleusercontent.com/aida-public/AB6AXuD_xJrwgu8KHFUzBvSS_kz-MYIa6rDAeJIk1AtNZdmcd_17MRSP7snMFgqFdtpTrVqHISL52yC5I44AMS0aCGW1x12tq3pP07LQ5VIVSdA5YnXISBssJcGs6V4bpVj7-6OT-jS1rlQ9bdw29sixgQYJCmETKTQbLBjFaaIx3H7Owb5hHtfBiLJpaXA8ggiN3-Q5X5bAfxcx8qROdXInmgmOcfk4BmfwyH4foZYvc-O1WpDwU7Zdg5wc2eD8W1e4qFk8xQDr5bJNv6vV";

  const handleConfirmPayment = () => {
    if (isSubmitting) return;
    if (isLive && liveEntries.length === 0) {
      setMessage("Sua sacola esta vazia.");
      return;
    }

    if (
      !address.fullName.trim() ||
      !address.street.trim() ||
      !address.number.trim() ||
      !address.city.trim() ||
      !address.state.trim() ||
      !address.zip.trim()
    ) {
      setMessage("Preencha os dados essenciais de entrega.");
      return;
    }

    setMessage(null);
    setIsSubmitting(true);

    window.setTimeout(() => {
      router.push(orderHref);
    }, 700);
  };

  return (
    <LuxuryPreviewFrame activeItem="Skincare" mode={mode}>
      <main className="bg-[#fcf9f8] pt-[72px]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <header className="mb-14 max-w-3xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#444748]">
              Finalizacao de pedido
            </p>
            <h1
              className={`${previewHeadlineFont.className} mt-4 text-4xl font-light tracking-[-0.05em] sm:text-5xl lg:text-6xl`}
            >
              Finalizacao de Curadoria
            </h1>
            <p className="mt-5 text-base leading-7 text-[#444748]">
              Revise entrega, pagamento e detalhes da sua curadoria em um fluxo elegante,
              discreto e pensado para concluir o ritual sem friccao.
            </p>
          </header>

          <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
            <aside className="order-first lg:order-last lg:col-span-5">
              <div className="space-y-6 lg:sticky lg:top-28">
                <div className="bg-[#f6f3f2] p-6 sm:p-8 lg:p-10">
                  <h2
                    className={`${previewHeadlineFont.className} text-2xl font-light uppercase`}
                  >
                    Sumario da Curadoria
                  </h2>

                  <div className="mt-8 flex gap-5 border-b border-black/10 pb-8">
                    <div className="h-36 w-28 shrink-0 overflow-hidden bg-white">
                      <img alt={displayTitle} className="h-full w-full object-cover" src={displayImage} />
                    </div>
                    <div className="flex flex-1 flex-col justify-between">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.22em] text-[#747878]">
                          {displayBrand}
                        </p>
                        <h3 className="mt-2 text-xl font-bold leading-tight">{displayTitle}</h3>
                        <p className="mt-2 text-sm text-[#747878]">Quantidade: {quantity}</p>
                      </div>
                      <p className="text-lg font-bold">
                        {formatCurrency.format(subtotal || 1280)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div className="flex items-center justify-between text-sm text-[#444748]">
                      <span>Subtotal</span>
                      <span>{formatCurrency.format(subtotal || 1280)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-[#444748]">
                      <span>Frete Express</span>
                      <span className="font-medium text-black">Gratis</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-[#444748]">
                      <span>Embalagem Atelier</span>
                      <span>Cortesia</span>
                    </div>
                    <div className="mt-6 flex items-center justify-between border-t border-black pt-6">
                      <span className={`${previewHeadlineFont.className} text-2xl font-light`}>
                        Total
                      </span>
                      <span className={`${previewHeadlineFont.className} text-2xl font-light`}>
                        {formatCurrency.format(total || 1280)}
                      </span>
                    </div>
                    <p className="text-right text-[10px] italic text-[#747878]">
                      Em ate 10x sem juros
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleConfirmPayment}
                    disabled={isSubmitting}
                    className={`${previewPrimaryButtonClass} mt-8 w-full px-5`}
                  >
                    {isSubmitting ? "Preparando pedido" : "Confirmar pagamento"}
                    {isSubmitting ? <CheckCircle2 className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
                  </button>
                </div>

                <div className="flex items-start gap-4 px-2">
                  <ShieldCheck className="mt-0.5 h-5 w-5 text-[#444748]" />
                  <p className="text-[10px] uppercase leading-5 tracking-[0.18em] text-[#747878]">
                    Sua transacao e protegida por criptografia ponta a ponta e politica de
                    privacidade premium.
                  </p>
                </div>
              </div>
            </aside>

            <div className="space-y-16 lg:col-span-7">
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className={`${previewHeadlineFont.className} text-3xl font-bold`}>
                    Endereco de Entrega
                  </h2>
                </div>

                <div className="border-l-4 border-black bg-[#f6f3f2] p-6 sm:p-8">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input
                      type="text"
                      value={address.fullName}
                      onChange={(event) =>
                        setAddress((current) => ({ ...current, fullName: event.target.value }))
                      }
                      placeholder="Nome completo"
                      className={`${previewInputClass} text-lg placeholder:text-[#c4c7c7]`}
                    />
                    <input
                      type="text"
                      value={address.street}
                      onChange={(event) =>
                        setAddress((current) => ({ ...current, street: event.target.value }))
                      }
                      placeholder="Rua"
                      className={`${previewInputClass} text-lg placeholder:text-[#c4c7c7]`}
                    />
                    <input
                      type="text"
                      value={address.number}
                      onChange={(event) =>
                        setAddress((current) => ({ ...current, number: event.target.value }))
                      }
                      placeholder="Numero"
                      className={`${previewInputClass} text-lg placeholder:text-[#c4c7c7]`}
                    />
                    <input
                      type="text"
                      value={address.city}
                      onChange={(event) =>
                        setAddress((current) => ({ ...current, city: event.target.value }))
                      }
                      placeholder="Cidade"
                      className={`${previewInputClass} text-lg placeholder:text-[#c4c7c7]`}
                    />
                    <input
                      type="text"
                      value={address.state}
                      onChange={(event) =>
                        setAddress((current) => ({ ...current, state: event.target.value }))
                      }
                      placeholder="Estado"
                      className={`${previewInputClass} text-lg placeholder:text-[#c4c7c7]`}
                    />
                    <input
                      type="text"
                      value={address.zip}
                      onChange={(event) =>
                        setAddress((current) => ({ ...current, zip: event.target.value }))
                      }
                      placeholder="CEP"
                      className={`${previewInputClass} text-lg placeholder:text-[#c4c7c7]`}
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-6">
                <h2 className={`${previewHeadlineFont.className} text-3xl font-bold`}>
                  Metodo de Pagamento
                </h2>

                <div className="grid gap-4 sm:grid-cols-2">
                  <button className="min-h-16 bg-black px-5 text-lg font-bold italic text-white transition-opacity hover:opacity-90">
                    Apple Pay
                  </button>
                  <button className="min-h-16 border border-black/10 bg-white px-5 text-lg font-medium transition-colors hover:bg-[#f6f3f2]">
                    Google Pay
                  </button>
                </div>

                <div className="space-y-4">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("saved-card")}
                    className={`flex w-full items-center gap-4 border-b pb-4 text-left ${
                      paymentMethod === "saved-card" ? "border-black" : "border-black/10"
                    }`}
                  >
                    <span className="h-5 w-5 rounded-full border border-black/40 p-1">
                      <span
                        className={`block h-full w-full rounded-full ${
                          paymentMethod === "saved-card" ? "bg-black" : "bg-transparent"
                        }`}
                      />
                    </span>
                    <CreditCard className="h-5 w-5 text-[#747878]" />
                    <span className="font-medium">Mastercard **** 8842</span>
                  </button>

                  <div className="bg-white p-6 shadow-sm sm:p-8">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("new-card")}
                      className="mb-8 flex items-center gap-4 text-left"
                    >
                      <span className="h-5 w-5 rounded-full border border-black/40 p-1">
                        <span
                          className={`block h-full w-full rounded-full ${
                            paymentMethod === "new-card" ? "bg-black" : "bg-transparent"
                          }`}
                        />
                      </span>
                      <span className="text-lg font-bold">Novo Cartao de Credito</span>
                    </button>

                    <div className="grid gap-6 sm:grid-cols-2">
                      <input
                        type="text"
                        placeholder="0000 0000 0000 0000"
                        className={`${previewInputClass} text-lg placeholder:text-[#c4c7c7] sm:col-span-2`}
                      />
                      <input
                        type="text"
                        placeholder="NOME COMO NO CARTAO"
                        className={`${previewInputClass} text-lg uppercase placeholder:text-[#c4c7c7] sm:col-span-2`}
                      />
                      <input
                        type="text"
                        placeholder="MM/AA"
                        className={`${previewInputClass} text-lg placeholder:text-[#c4c7c7]`}
                      />
                      <input
                        type="text"
                        placeholder="123"
                        className={`${previewInputClass} text-lg placeholder:text-[#c4c7c7]`}
                      />
                    </div>

                    <label className="mt-8 flex items-center gap-3 text-sm font-medium text-[#444748]">
                      <input
                        type="checkbox"
                        checked={saveCard}
                        onChange={() => setSaveCard((current) => !current)}
                        className="h-4 w-4 rounded-none border-black/20 text-black focus:ring-0"
                      />
                      Salvar este cartao para compras futuras
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("pix")}
                    className={`flex w-full items-center justify-between gap-4 border p-6 text-left transition-colors ${
                      paymentMethod === "pix"
                        ? "border-black bg-white"
                        : "border-black/10 bg-transparent hover:bg-[#f6f3f2]"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="h-5 w-5 rounded-full border border-black/40 p-1">
                        <span
                          className={`block h-full w-full rounded-full ${
                            paymentMethod === "pix" ? "bg-black" : "bg-transparent"
                          }`}
                        />
                      </span>
                      <span className="text-lg font-bold">Pix</span>
                    </div>
                    <span className="bg-[#ed93d5]/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-[#ed93d5]">
                      Aprovacao instantanea
                    </span>
                  </button>
                </div>
              </section>

              {message ? (
                <div className="rounded-xl bg-[#fff5f8] px-4 py-3 text-sm text-[#9f1239]">
                  {message}
                </div>
              ) : null}

              <section className="grid gap-4 sm:grid-cols-3">
                {[
                  {
                    title: "Entrega acompanhada",
                    body: "Seu pedido segue com rastreio claro e atualizacoes elegantes em cada etapa."
                  },
                  {
                    title: "Pagamento protegido",
                    body: "Confirmacao segura, ambiente criptografado e finalizacao sem ruido visual."
                  },
                  {
                    title: "Embalagem atelier",
                    body: "Cada detalhe da entrega preserva a sensacao de curadoria e luxo da BelaPop."
                  }
                ].map((item) => (
                  <article
                    key={item.title}
                    className="border border-black/8 bg-white p-5"
                  >
                    <Lock className="h-5 w-5 text-[#ed93d5]" />
                    <h3
                      className={`${previewHeadlineFont.className} mt-4 text-2xl font-bold italic`}
                    >
                      {item.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-[#444748]">{item.body}</p>
                  </article>
                ))}
              </section>
            </div>
          </div>
        </div>
      </main>
    </LuxuryPreviewFrame>
  );
}
