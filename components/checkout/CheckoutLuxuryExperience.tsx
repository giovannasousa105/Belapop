"use client";

/* eslint-disable @next/next/no-img-element */

import { useRouter } from "next/navigation";
import { ArrowRight, Lock, ShieldCheck, Truck } from "lucide-react";
import { useMemo, useState } from "react";

import { PurchaseTrustSummary } from "@/components/legal/PurchaseTrustSummary";
import { BelaPopValidatedFooter } from "@/components/luxury/BelaPopValidatedFooter";
import { BelaPopValidatedHeader } from "@/components/luxury/BelaPopValidatedHeader";
import { useCart } from "@/lib/CartContext";
import { useStoredProducts } from "@/lib/hooks/useStoredProducts";
import type { Product } from "@/lib/types";

type PaymentMethod = "credit" | "pix";

const fallbackImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCKaCm8GffGhvkwjEIUwKj8ESM6Vq3V3_IE8xCnmGxTcnaHGYtxkQ0Jia5rvBNQ03l89ahkcogFtyILTlxZpKBokuLmomdNE0LdSCoryycTdFN7owqzgGbjpqxLTuRSND4-Otmd-C0ic9ZxtUteuLOFrQmZNLMluybcazl8vv7NTtX7lhojX2FQav0Z8kdkeVTuJt2mmR4nWqvu_AAhUvH3XTXaCmd4lN06-3nqdBh8zD34vU2Wv-x7qPxI4Vv8fp_CEpVAERTwqMJW";

const formatCurrency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

function findProduct(products: Product[], id: string) {
  return products.find((candidate) => candidate.id === id) ?? null;
}

export function CheckoutLuxuryExperience() {
  const router = useRouter();
  const { items } = useCart();
  const { products } = useStoredProducts();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("credit");
  const [saveCard, setSaveCard] = useState(false);
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);

  const cartProduct = useMemo(() => {
    const item = items[0];
    if (!item) return null;
    const product = findProduct(products, item.productId);
    if (!product) return null;
    return { product, quantity: item.quantity };
  }, [items, products]);

  const displayProduct = cartProduct?.product;
  const quantity = cartProduct?.quantity ?? 1;
  const subtotal = cartProduct ? cartProduct.product.price * cartProduct.quantity : 2450;

  const productTitle = displayProduct?.name ?? "Creme de la Mer";
  const productBrand = displayProduct?.brand ?? "LA MER";
  const productImage = displayProduct?.imageUrls?.[0] ?? displayProduct?.images?.[0] ?? fallbackImage;

  const handleSubmit = () => {
    router.push("/pedido");
  };

  return (
    <div className="bg-[#fcf9f8] text-[#1c1b1b]" data-belapop-page="checkout-luxury-public">
      <BelaPopValidatedHeader />

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-24 sm:px-6 lg:px-8 lg:pb-24 lg:pt-32">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-start lg:gap-16">
          <div className="space-y-14 lg:col-span-7 lg:space-y-16">
            <section>
              <div className="mb-8 flex items-end justify-between">
                <h2 className="font-headline text-3xl text-[#1c1b1b] sm:text-4xl">Dados de Entrega</h2>
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#444748]">Passo 01</span>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
                {[
                  { label: "Nome completo", placeholder: "Como no documento", type: "text" },
                  { label: "E-mail", placeholder: "seu@email.com", type: "email" },
                  { label: "Endereco", placeholder: "Rua, numero e complemento", type: "text", span: true },
                  { label: "Cidade", placeholder: "Ex: Sao Paulo", type: "text" },
                  { label: "CEP", placeholder: "00000-000", type: "text" }
                ].map((field) => (
                  <div key={field.label} className={field.span ? "flex flex-col gap-2 md:col-span-2" : "flex flex-col gap-2"}>
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#444748]">{field.label}</label>
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      className="border-0 border-b border-black/15 bg-white px-0 py-3 text-sm focus:border-[#ed93d5] focus:outline-none focus:ring-0"
                    />
                  </div>
                ))}
              </div>
            </section>

            <section>
              <div className="mb-8 flex items-end justify-between">
                <h2 className="font-headline text-3xl text-[#1c1b1b] sm:text-4xl">Metodo de Pagamento</h2>
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#444748]">Passo 02</span>
              </div>

              <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <button className="flex min-h-14 items-center justify-center gap-2 border border-black/15 px-4 transition-all duration-300 hover:bg-black hover:text-white">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Apple Pay</span>
                </button>
                <button className="flex min-h-14 items-center justify-center gap-2 border border-black/15 px-4 transition-all duration-300 hover:bg-black hover:text-white">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Google Pay</span>
                </button>
              </div>

              <div className="mb-8 flex items-center gap-4">
                <div className="h-px flex-1 bg-black/10" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#444748]">Ou pague com</span>
                <div className="h-px flex-1 bg-black/10" />
              </div>

              <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className={`flex cursor-pointer items-center gap-4 p-6 ${paymentMethod === "credit" ? "border border-black bg-white" : "border border-black/10 bg-[#f6f3f2]"}`}>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === "credit"}
                    onChange={() => setPaymentMethod("credit")}
                    className="border-black/20 text-black focus:ring-0"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold uppercase tracking-[0.2em]">Cartao de Credito</span>
                    <span className="text-[10px] text-[#444748]">Ate 10x sem juros</span>
                  </div>
                </label>

                <label className={`flex cursor-pointer items-center gap-4 p-6 ${paymentMethod === "pix" ? "border border-black bg-white" : "border border-black/10 bg-[#f6f3f2]"}`}>
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === "pix"}
                    onChange={() => setPaymentMethod("pix")}
                    className="border-black/20 text-black focus:ring-0"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold uppercase tracking-[0.2em]">Pix</span>
                    <span className="text-[10px] text-[#444748]">Confirmacao instantanea</span>
                  </div>
                </label>
              </div>

              {paymentMethod === "credit" ? (
                <div className="space-y-8">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#444748]">Cartoes salvos</label>
                    <div className="relative">
                      <select className="w-full appearance-none border-0 border-b border-black/15 bg-white px-0 py-3 text-sm focus:border-[#ed93d5] focus:outline-none focus:ring-0">
                        <option>Usar um novo cartao</option>
                        <option>•••• 4242 (Visa)</option>
                        <option>•••• 8888 (Mastercard)</option>
                      </select>
                      <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-sm">⌄</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#444748]">Numero do Cartao</label>
                    <input className="border-0 border-b border-black/15 bg-white px-0 py-3 text-sm focus:border-[#ed93d5] focus:outline-none focus:ring-0" placeholder="0000 0000 0000 0000" type="text" />
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#444748]">Validade</label>
                      <input className="border-0 border-b border-black/15 bg-white px-0 py-3 text-sm focus:border-[#ed93d5] focus:outline-none focus:ring-0" placeholder="MM/AA" type="text" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#444748]">CVV</label>
                      <input className="border-0 border-b border-black/15 bg-white px-0 py-3 text-sm focus:border-[#ed93d5] focus:outline-none focus:ring-0" placeholder="123" type="text" />
                    </div>
                  </div>

                  <label className="flex items-center gap-3 pt-2">
                    <input
                      type="checkbox"
                      checked={saveCard}
                      onChange={() => setSaveCard((current) => !current)}
                      className="h-4 w-4 rounded-none border-black/20 text-black focus:ring-0"
                    />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#444748]">
                      Salvar este cartao para futuras curadorias
                    </span>
                  </label>
                </div>
              ) : (
                <div className="border border-black/10 bg-white p-6 text-sm leading-7 text-[#444748]">
                  Gere o QR Code do Pix na etapa seguinte e conclua com confirmacao instantanea.
                </div>
              )}
            </section>
          </div>

          <aside className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <button
                type="button"
                onClick={() => setMobileSummaryOpen((current) => !current)}
                className="flex min-h-14 w-full items-center justify-between bg-[#f6f3f2] px-5 text-left lg:hidden"
              >
                <span className="font-headline text-2xl">Resumo da Curadoria</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{mobileSummaryOpen ? "Fechar" : "Abrir"}</span>
              </button>

              <div className={`${mobileSummaryOpen ? "mt-4 block" : "hidden"} space-y-10 bg-[#f6f3f2] p-8 lg:mt-0 lg:block lg:p-12`}>
                <h3 className="font-headline text-3xl">Resumo da Curadoria</h3>

                <div className="flex items-start gap-6 border-b border-black/10 pb-8">
                  <div className="h-32 w-24 shrink-0 overflow-hidden bg-white">
                    <img alt={productTitle} className="h-full w-full object-cover" src={productImage} />
                  </div>
                  <div className="flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#444748]">{productBrand}</span>
                    <h4 className="mt-2 text-sm font-medium text-[#1c1b1b]">{productTitle}</h4>
                    <span className="mt-1 block text-[10px] text-[#444748]">Quantidade: {quantity}</span>
                    <span className="mt-4 block text-sm font-bold">{formatCurrency.format(subtotal)}</span>
                  </div>
                  <button type="button" className="text-[#444748] transition-colors hover:text-[#ba1a1a]">×</button>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between text-xs uppercase tracking-[0.2em]">
                    <span className="text-[#444748]">Subtotal</span>
                    <span>{formatCurrency.format(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-xs uppercase tracking-[0.2em]">
                    <span className="text-[#444748]">Entrega Especial</span>
                    <span>Gratis</span>
                  </div>
                  <div className="flex justify-between border-t border-black/10 pt-4 font-headline text-2xl">
                    <span>Total</span>
                    <span className="font-bold">{formatCurrency.format(subtotal)}</span>
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="group flex min-h-14 w-full items-center justify-center gap-2 bg-black px-5 text-xs font-bold uppercase tracking-[0.2em] text-white transition-all duration-500 hover:bg-[#ed93d5]"
                  >
                    Concluir Curadoria
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                  <p className="px-4 text-center text-[10px] leading-relaxed text-[#444748]">
                    A conclusao da compra depende da aprovacao do pagamento, da analise antifraude
                    e das condicoes exibidas pela BelaPop.
                  </p>
                </div>

                <div className="flex justify-center gap-8 pt-6 text-black/40">
                  <ShieldCheck className="h-5 w-5" />
                  <Lock className="h-5 w-5" />
                  <Truck className="h-5 w-5" />
                </div>

                <PurchaseTrustSummary context="checkout" className="mt-6" />
              </div>
            </div>
          </aside>
        </div>
      </main>

      <BelaPopValidatedFooter />
    </div>
  );
}
