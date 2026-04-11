"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock, ShieldCheck, Truck } from "lucide-react";
import { useMemo, useState } from "react";

import { CommerceLightFooter } from "@/components/commerce/CommerceLightFooter";
import { BelaPopValidatedHeader } from "@/components/luxury/BelaPopValidatedHeader";
import { useCart } from "@/lib/CartContext";
import { useStoredProducts } from "@/lib/hooks/useStoredProducts";
import type { Product } from "@/lib/types";

type PaymentMethod = "credit" | "pix";

type CheckoutSummary = {
  image: string;
  quantity: number;
  title: string;
  total: number;
};

const formatCurrency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

const fallbackProductImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAECpaxnOIZxdlmWaehm5yo126HIkZLFm9GGrwxqc1gyMj2gUFi06s1QGSvWftIj5Vd7OsndSy0Rr2YFMN0mO2K9XRS3slrXezGsr65J7waw80q4rtPP6J7KZsLHO8HdQnYzluIq9dA-Ww2QkKOrq9VJbCAU5JIq1lW_tQG54e7a8u40J8ppAL29S4YAAKwv38kQLbtPRr8zCsI1s44VyfPACdT6MjiC6cCGDXupDQgcob4HfUvlc8K9O7wvbfjSaARPLzQE9YrPE99";

const sampleCheckoutSummary: CheckoutSummary = {
  image:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDJXqXTITm_Xfyh7Aup7xRF7cw3ZCJAPF-g7Z1m9vfxONcW7F0Kz0GpiRZoGzo5aDKM0SyWs2s2idW361OESpfNyRkN3vctpYBMbfzu0EYz8-ZFpzJ-6Wxy5TpkCC3pKGvt6FVT46b_-YSlPgOKtoriRYya1cUW3FGTxaR2HDEPrIKR9WgwrLeABkHsG7fZ3dJGwbvzfR3TIYpSLLR4OdCUgCoA5azYw5LVgEx4HCm2ljzlnK0Exv5V1VuPy8WtdeKf8xj5Z4Jm_GI5",
  quantity: 2,
  title: "Curadoria BelaPop (2 itens)",
  total: 334
};

function isRenderableProductImage(value?: string | null) {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return false;
  if (normalized === "/logo.svg" || normalized === "/logo-dark.svg") return false;
  if (normalized.includes("/editorial/product-hero-")) return false;
  if (normalized.includes("/editorial/") && normalized.endsWith(".svg")) return false;
  return true;
}

function findProduct(products: Product[], productId: string) {
  return products.find((candidate) => candidate.id === productId) ?? null;
}

function resolveProductImage(product: Product | null) {
  if (!product) return fallbackProductImage;
  const images = [...(product.imageUrls ?? []), ...(product.images ?? [])];
  const image = images.find((item) => isRenderableProductImage(item));
  return image || fallbackProductImage;
}

export function LuxuryCheckoutExperience() {
  const router = useRouter();
  const { items } = useCart();
  const { products } = useStoredProducts();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("credit");
  const [saveCard, setSaveCard] = useState(true);
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(true);

  const liveSummary = useMemo<CheckoutSummary | null>(() => {
    const first = items[0];
    if (!first) return null;
    const product = findProduct(products, first.productId);
    if (!product) return null;
    return {
      image: resolveProductImage(product),
      quantity: first.quantity,
      title: product.name,
      total: product.price * first.quantity
    };
  }, [items, products]);

  const summary = liveSummary ?? sampleCheckoutSummary;
  const subtotal = summary.total;
  const total = subtotal;
  const isSampleSummary = !liveSummary;

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b] [font-family:var(--font-inter)]">
      <BelaPopValidatedHeader activeSection="skincare" />

      <main className="mx-auto max-w-[1440px] px-5 pb-24 pt-24 sm:px-8 lg:px-10 lg:pt-32">
        <div className="mb-8 flex items-center gap-3 text-[10px] uppercase tracking-[0.18em] text-black/55 sm:text-xs">
          <span className="text-black/55">Sacola</span>
          <span>•</span>
          <span className="font-semibold text-black/80">Identificacao</span>
          <span>•</span>
          <span>Pagamento</span>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-14">
          <section className="space-y-10 lg:col-span-7">
            <header className="space-y-2">
              <h1 className="[font-family:var(--font-playfair)] text-4xl font-semibold tracking-[-0.02em] sm:text-5xl">
                Checkout
              </h1>
              <p className="text-sm leading-relaxed text-black/60">
                Finalize com entrega segura e pagamento validado.
              </p>
            </header>

            <section className="rounded-2xl border border-black/10 bg-white p-6 sm:p-8">
              <h2 className="[font-family:var(--font-playfair)] text-3xl font-medium tracking-[-0.01em]">
                Dados de entrega
              </h2>
              <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
                {[
                  { label: "Nome completo", placeholder: "Como no documento", type: "text" },
                  { label: "E-mail", placeholder: "voce@email.com", type: "email" },
                  {
                    label: "Endereco",
                    placeholder: "Rua, numero e complemento",
                    type: "text",
                    full: true
                  },
                  { label: "Cidade", placeholder: "Ex: Sao Paulo", type: "text" },
                  { label: "CEP", placeholder: "00000-000", type: "text" }
                ].map((field) => (
                  <label key={field.label} className={field.full ? "sm:col-span-2" : ""}>
                    <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.17em] text-black/58">
                      {field.label}
                    </span>
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      className="w-full rounded-xl border border-black/12 bg-[#fcf9f8] px-4 py-3 text-sm outline-none transition focus:border-black/30"
                    />
                  </label>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-black/10 bg-white p-6 sm:p-8">
              <h2 className="[font-family:var(--font-playfair)] text-3xl font-medium tracking-[-0.01em]">
                Pagamento
              </h2>

              <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label
                  className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border px-4 ${
                    paymentMethod === "credit"
                      ? "border-black bg-[#fcf9f8]"
                      : "border-black/10 bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment-method"
                    checked={paymentMethod === "credit"}
                    onChange={() => setPaymentMethod("credit")}
                    className="h-4 w-4 border-black/30 text-black focus:ring-0"
                  />
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">
                      Cartao de credito
                    </p>
                    <p className="text-[11px] text-black/55">Ate 10x sem juros</p>
                  </div>
                </label>

                <label
                  className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border px-4 ${
                    paymentMethod === "pix"
                      ? "border-black bg-[#fcf9f8]"
                      : "border-black/10 bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment-method"
                    checked={paymentMethod === "pix"}
                    onChange={() => setPaymentMethod("pix")}
                    className="h-4 w-4 border-black/30 text-black focus:ring-0"
                  />
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">Pix</p>
                    <p className="text-[11px] text-black/55">Confirmacao imediata</p>
                  </div>
                </label>
              </div>

              {paymentMethod === "credit" ? (
                <div className="mt-6 space-y-5">
                  <label>
                    <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.17em] text-black/58">
                      Numero do cartao
                    </span>
                    <input
                      type="text"
                      placeholder="0000 0000 0000 0000"
                      className="w-full rounded-xl border border-black/12 bg-[#fcf9f8] px-4 py-3 text-sm outline-none transition focus:border-black/30"
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <label>
                      <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.17em] text-black/58">
                        Validade
                      </span>
                      <input
                        type="text"
                        placeholder="MM/AA"
                        className="w-full rounded-xl border border-black/12 bg-[#fcf9f8] px-4 py-3 text-sm outline-none transition focus:border-black/30"
                      />
                    </label>
                    <label>
                      <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.17em] text-black/58">
                        CVV
                      </span>
                      <input
                        type="text"
                        placeholder="123"
                        className="w-full rounded-xl border border-black/12 bg-[#fcf9f8] px-4 py-3 text-sm outline-none transition focus:border-black/30"
                      />
                    </label>
                  </div>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={saveCard}
                      onChange={() => setSaveCard((current) => !current)}
                      className="h-4 w-4 border-black/30 text-black focus:ring-0"
                    />
                    <span className="text-[11px] uppercase tracking-[0.15em] text-black/58">
                      Salvar cartao para proximas compras
                    </span>
                  </label>
                </div>
              ) : (
                <p className="mt-6 rounded-xl border border-black/10 bg-[#fcf9f8] p-4 text-sm leading-relaxed text-black/62">
                  O QR Code e exibido na etapa final. A confirmacao do Pix e instantanea.
                </p>
              )}
            </section>
          </section>

          <aside className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <button
                type="button"
                onClick={() => setMobileSummaryOpen((current) => !current)}
                className="flex min-h-14 w-full items-center justify-between rounded-2xl border border-black/10 bg-white px-5 lg:hidden"
              >
                <span className="[font-family:var(--font-playfair)] text-2xl font-medium">
                  Resumo da curadoria
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.17em] text-black/58">
                  {mobileSummaryOpen ? "Fechar" : "Abrir"}
                </span>
              </button>

              <div
                className={`${mobileSummaryOpen ? "mt-4 block" : "hidden"} rounded-2xl border border-black/10 bg-white p-6 sm:p-8 lg:mt-0 lg:block`}
              >
                <h3 className="[font-family:var(--font-playfair)] text-3xl font-medium tracking-[-0.01em]">
                  Resumo da curadoria
                </h3>

                {isSampleSummary ? (
                  <p className="mt-3 text-[11px] uppercase tracking-[0.15em] text-black/55">
                    Pre-visualizacao com selecao inicial
                  </p>
                ) : null}

                <div className="mt-6 flex gap-4 border-b border-black/10 pb-6">
                  <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-xl bg-[#f6f3f2]">
                    <Image
                      src={summary.image}
                      alt={summary.title}
                      fill
                      unoptimized
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-black/55">
                      Item selecionado
                    </p>
                    <h4 className="mt-1 [font-family:var(--font-playfair)] text-xl font-medium leading-tight">
                      {summary.title}
                    </h4>
                    <p className="mt-2 text-sm text-black/58">Quantidade: {summary.quantity}</p>
                    <p className="mt-3 text-base font-semibold">{formatCurrency.format(summary.total)}</p>
                  </div>
                </div>

                <div className="mt-6 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-black/58">Subtotal</span>
                    <span className="font-medium">{formatCurrency.format(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-black/58">Entrega</span>
                    <span className="font-medium">Gratis</span>
                  </div>
                </div>

                <div className="mt-5 border-t border-black/10 pt-5">
                  <div className="flex items-end justify-between">
                    <span className="text-xs uppercase tracking-[0.15em] text-black/58">Total</span>
                    <span className="[font-family:var(--font-playfair)] text-4xl font-semibold tracking-[-0.015em]">
                      {formatCurrency.format(total)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => router.push("/pedido/sucesso")}
                  className="mt-7 inline-flex min-h-14 w-full items-center justify-center gap-2 bg-black px-5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-black/90"
                >
                  Finalizar curadoria com seguranca
                  <ArrowRight className="h-4 w-4" />
                </button>

                <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-xl border border-black/10 bg-[#fcf9f8] p-3">
                    <ShieldCheck className="mx-auto h-4 w-4 text-black/65" />
                    <p className="mt-1 text-[10px] uppercase tracking-[0.13em] text-black/62">Seguro</p>
                  </div>
                  <div className="rounded-xl border border-black/10 bg-[#fcf9f8] p-3">
                    <Lock className="mx-auto h-4 w-4 text-black/65" />
                    <p className="mt-1 text-[10px] uppercase tracking-[0.13em] text-black/62">Criptografado</p>
                  </div>
                  <div className="rounded-xl border border-black/10 bg-[#fcf9f8] p-3">
                    <Truck className="mx-auto h-4 w-4 text-black/65" />
                    <p className="mt-1 text-[10px] uppercase tracking-[0.13em] text-black/62">Rastreio</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <CommerceLightFooter />
    </div>
  );
}
