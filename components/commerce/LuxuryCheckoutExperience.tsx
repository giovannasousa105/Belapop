"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock, ShieldCheck, Truck } from "lucide-react";
import { useMemo, useState } from "react";

import { CommerceLightFooter } from "@/components/commerce/CommerceLightFooter";
import { ShippingCalculator } from "@/components/ShippingCalculator";
import { BelaPopValidatedHeader } from "@/components/luxury/BelaPopValidatedHeader";
import { StripeCheckoutDemo } from "@/components/StripeCheckoutDemo";
import { brandCtas } from "@/lib/brand/ctas";
import { brandSectionNames } from "@/lib/brand/sections";
import { useCart } from "@/lib/CartContext";
import { usePublishedProducts } from "@/lib/hooks/useStoredProducts";
import { buildShippingItems } from "@/lib/shipping/prepareItems";
import type { Product } from "@/lib/types";

type PaymentMethod = "credit" | "pix";

type CheckoutSummaryItem = {
  image: string;
  quantity: number;
  stockQuantity?: number;
  title: string;
  total: number;
};

type CheckoutAddressForm = {
  fullName: string;
  email: string;
  street: string;
  city: string;
  zip: string;
};

type CheckoutPaymentIntent = {
  clientSecret: string;
  orderId: string;
  totalAmountCents: number;
};

const formatCurrency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

const fallbackProductImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAECpaxnOIZxdlmWaehm5yo126HIkZLFm9GGrwxqc1gyMj2gUFi06s1QGSvWftIj5Vd7OsndSy0Rr2YFMN0mO2K9XRS3slrXezGsr65J7waw80q4rtPP6J7KZsLHO8HdQnYzluIq9dA-Ww2QkKOrq9VJbCAU5JIq1lW_tQG54e7a8u40J8ppAL29S4YAAKwv38kQLbtPRr8zCsI1s44VyfPACdT6MjiC6cCGDXupDQgcob4HfUvlc8K9O7wvbfjSaARPLzQE9YrPE99";

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

function resolveCheckoutError(status: number, data: { error?: string; code?: string } | null) {
  if (status === 401) return "Entre na sua conta para finalizar o pedido com segurança.";
  if (data?.code === "CART_EMPTY") return "Seu carrinho está vazio. Adicione um produto antes de continuar.";
  if (data?.error === "SELLER_NOT_CONNECTED") {
    return "Este seller ainda não está habilitado para pagamento. Escolha outro item ou fale com o concierge.";
  }
  if (data?.code === "SHIPPING_PROVIDER_NOT_CONFIGURED") {
    return "O cálculo de frete está temporariamente indisponível. Tente novamente em instantes.";
  }
  return "Não foi possível iniciar o pagamento agora. Tente novamente ou fale com o concierge.";
}

export function LuxuryCheckoutExperience() {
  const router = useRouter();
  const { anonId, cartId, items, markCartConverted, ready, totalShipping } = useCart();
  const { products, loading: productsLoading } = usePublishedProducts();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("credit");
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(true);
  const [address, setAddress] = useState<CheckoutAddressForm>({
    fullName: "",
    email: "",
    street: "",
    city: "",
    zip: ""
  });
  const [paymentIntent, setPaymentIntent] = useState<CheckoutPaymentIntent | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [creatingPayment, setCreatingPayment] = useState(false);

  const summaryItems = useMemo<CheckoutSummaryItem[]>(() => {
    return items
      .map((item): CheckoutSummaryItem | null => {
        const product = findProduct(products, item.productId);
        if (!product) return null;
        const summary: CheckoutSummaryItem = {
          image: resolveProductImage(product),
          quantity: item.quantity,
          title: product.name,
          total: product.price * item.quantity
        };
        if (typeof product.stockQuantity === "number") {
          summary.stockQuantity = product.stockQuantity;
        }
        return summary;
      })
      .filter((item): item is CheckoutSummaryItem => Boolean(item));
  }, [items, products]);

  const liveShippingItems = useMemo(
    () =>
      buildShippingItems(
        items
          .map((item) => {
            const product = findProduct(products, item.productId);
            if (!product) return null;
            return { product, quantity: item.quantity };
          })
          .filter((entry): entry is { product: Product; quantity: number } => Boolean(entry))
      ),
    [items, products]
  );

  const subtotal = summaryItems.reduce((sum, item) => sum + item.total, 0);
  const total = subtotal + totalShipping;
  const isCartLoading = !ready || (items.length > 0 && productsLoading);
  const hasUnresolvedItems =
    ready && !productsLoading && items.length > 0 && summaryItems.length !== items.length;
  const hasStockIssue = summaryItems.some(
    (item) =>
      typeof item.stockQuantity === "number" &&
      Number.isFinite(item.stockQuantity) &&
      item.quantity > item.stockQuantity
  );
  const isEmpty = ready && items.length === 0;
  const addressComplete =
    address.fullName.trim().length > 2 &&
    address.email.includes("@") &&
    address.street.trim().length > 4 &&
    address.city.trim().length > 2 &&
    address.zip.replace(/\D/g, "").length >= 8;

  const updateAddress = (field: keyof CheckoutAddressForm, value: string) => {
    setAddress((current) => ({ ...current, [field]: value }));
    setPaymentIntent(null);
    setCheckoutError(null);
  };

  const handleCreatePayment = async () => {
    if (creatingPayment) return;
    if (isEmpty) {
      router.push("/carrinho");
      return;
    }
    if (isCartLoading) return;
    if (hasUnresolvedItems || summaryItems.length === 0) {
      setCheckoutError("Não conseguimos validar os itens do carrinho. Revise sua seleção antes de pagar.");
      return;
    }
    if (hasStockIssue) {
      setCheckoutError("Um ou mais itens ultrapassam o estoque disponível. Ajuste o carrinho antes de pagar.");
      return;
    }
    if (!addressComplete) {
      setCheckoutError("Preencha os dados de entrega antes de iniciar o pagamento seguro.");
      return;
    }

    setCreatingPayment(true);
    setCheckoutError(null);
    try {
      let resolvedCartId = cartId;
      if (!resolvedCartId && anonId) {
        const syncResponse = await fetch("/api/cart/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          cache: "no-store",
          body: JSON.stringify({
            anonId,
            cartId,
            items,
            subtotalCents: 0
          })
        });
        const syncData = (await syncResponse.json().catch(() => null)) as { cartId?: string } | null;
        if (syncResponse.ok && syncData?.cartId) {
          resolvedCartId = syncData.cartId;
        }
      }

      const response = await fetch("/api/stripe/payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({
          cartId: resolvedCartId,
          paymentMethod: paymentMethod === "pix" ? "pix" : "cartao",
          requestedPopClubCreditsCents: 0,
          address: {
            fullName: address.fullName.trim(),
            street: address.street.trim(),
            number: "s/n",
            city: address.city.trim(),
            state: "BR",
            zip: address.zip.trim()
          }
        })
      });
      const data = (await response.json().catch(() => null)) as
        | (CheckoutPaymentIntent & { error?: string; code?: string })
        | null;

      if (response.status === 401) {
        router.push("/login?tab=customer&returnTo=%2Fcheckout");
        return;
      }

      if (!response.ok || !data?.clientSecret || !data.orderId) {
        setCheckoutError(resolveCheckoutError(response.status, data));
        return;
      }

      setPaymentIntent({
        clientSecret: data.clientSecret,
        orderId: data.orderId,
        totalAmountCents: data.totalAmountCents
      });
  } catch {
      setCheckoutError("Não foi possível iniciar o pagamento agora. Tente novamente em instantes.");
    } finally {
      setCreatingPayment(false);
    }
  };

  const handleCheckoutSuccess = async () => {
    if (paymentIntent?.orderId) {
      await markCartConverted(paymentIntent.orderId);
    }
    router.push("/conta/pedidos?checkout=confirmado");
  };

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b] [font-family:var(--font-inter)]">
      <BelaPopValidatedHeader activeSection="skincare" />

      <main className="mx-auto max-w-[1440px] px-5 pb-24 pt-24 sm:px-8 lg:px-10 lg:pt-32">
        <div className="mb-8 flex items-center gap-3 text-[10px] uppercase tracking-[0.18em] text-black/55 sm:text-xs">
          <span className="text-black/55">Carrinho</span>
          <span>•</span>
          <span className="font-semibold text-black/80">Identificação</span>
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
                  { field: "fullName", label: "Nome completo", placeholder: "Como no documento", type: "text" },
                  { field: "email", label: "E-mail", placeholder: "você@email.com", type: "email" },
                  {
                    field: "street",
                    label: "Endereço",
                    placeholder: "Rua, número e complemento",
                    type: "text",
                    full: true
                  },
                  { field: "city", label: "Cidade", placeholder: "Ex: Sao Paulo", type: "text" },
                  { field: "zip", label: "CEP", placeholder: "00000-000", type: "text" }
                ].map((field) => (
                  <label key={field.label} className={field.full ? "sm:col-span-2" : ""}>
                    <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.17em] text-black/58">
                      {field.label}
                    </span>
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      value={address[field.field as keyof CheckoutAddressForm]}
                      onChange={(event) =>
                        updateAddress(field.field as keyof CheckoutAddressForm, event.target.value)
                      }
                      className="w-full rounded-xl border border-black/12 bg-[#fcf9f8] px-4 py-3 text-sm outline-none transition focus:border-black/30"
                    />
                  </label>
                ))}
              </div>

              {liveShippingItems.length > 0 ? (
                <div className="mt-8">
                  <ShippingCalculator cartItems={liveShippingItems} tone="light" />
                </div>
              ) : null}
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
                    onChange={() => {
                      setPaymentMethod("credit");
                      setPaymentIntent(null);
                      setCheckoutError(null);
                    }}
                    className="h-4 w-4 border-black/30 text-black focus:ring-0"
                  />
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">
                      Cartão de crédito
                    </p>
                    <p className="text-[11px] text-black/55">Até 10x sem juros</p>
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
                    onChange={() => {
                      setPaymentMethod("pix");
                      setPaymentIntent(null);
                      setCheckoutError(null);
                    }}
                    className="h-4 w-4 border-black/30 text-black focus:ring-0"
                  />
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">Pix</p>
                    <p className="text-[11px] text-black/55">Confirmação imediata</p>
                  </div>
                </label>
              </div>

              {checkoutError ? (
                <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-700">
                  {checkoutError}
                </div>
              ) : null}

              {paymentIntent ? (
                <div className="mt-6">
                  <StripeCheckoutDemo
                    amountCents={paymentIntent.totalAmountCents}
                    clientSecret={paymentIntent.clientSecret}
                    currency="brl"
                    ctaLabel="Pagar com segurança"
                    onSuccess={handleCheckoutSuccess}
                  />
                </div>
              ) : (
                <p className="mt-6 rounded-xl border border-black/10 bg-[#fcf9f8] p-4 text-sm leading-relaxed text-black/62">
                  Os dados de pagamento são informados apenas depois da criação segura da sessão Stripe.
                  Preencha a entrega e avance pelo resumo do pedido.
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
                  {brandSectionNames.cart.orderSummary}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.17em] text-black/58">
                  {mobileSummaryOpen ? "Fechar" : "Abrir"}
                </span>
              </button>

              <div
                className={`${mobileSummaryOpen ? "mt-4 block" : "hidden"} rounded-2xl border border-black/10 bg-white p-6 sm:p-8 lg:mt-0 lg:block`}
              >
                <h3 className="[font-family:var(--font-playfair)] text-3xl font-medium tracking-[-0.01em]">
                  {brandSectionNames.cart.orderSummary}
                </h3>

                {isCartLoading ? (
                  <p className="mt-6 border-b border-black/10 pb-6 text-sm leading-relaxed text-black/62">
                    Carregando os itens reais do carrinho.
                  </p>
                ) : isEmpty ? (
                  <p className="mt-6 border-b border-black/10 pb-6 text-sm leading-relaxed text-black/62">
                    Seu carrinho está vazio.
                  </p>
                ) : hasUnresolvedItems ? (
                  <p className="mt-6 border-b border-black/10 pb-6 text-sm leading-relaxed text-black/62">
                    Não conseguimos validar os itens adicionados.
                  </p>
                ) : (
                  <div className="mt-6 space-y-5 border-b border-black/10 pb-6">
                    {summaryItems.map((summary) => (
                      <div key={summary.title} className="flex gap-4">
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
                          {typeof summary.stockQuantity === "number" &&
                          summary.quantity > summary.stockQuantity ? (
                            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-red-700">
                              Estoque disponível: {summary.stockQuantity}
                            </p>
                          ) : null}
                          <p className="mt-3 text-base font-semibold">{formatCurrency.format(summary.total)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-6 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-black/58">Subtotal</span>
                    <span className="font-medium">{formatCurrency.format(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-black/58">Entrega</span>
                    <span className="font-medium">
                      {totalShipping > 0 ? formatCurrency.format(totalShipping) : "A calcular"}
                    </span>
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
                  onClick={handleCreatePayment}
                  disabled={
                    creatingPayment ||
                    Boolean(paymentIntent) ||
                    isCartLoading ||
                    isEmpty ||
                    hasUnresolvedItems ||
                    hasStockIssue
                  }
                  className="mt-7 inline-flex min-h-14 w-full items-center justify-center gap-2 bg-black px-5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {creatingPayment
                    ? "Criando pagamento..."
                    : paymentIntent
                      ? "Pagamento seguro criado"
                      : brandCtas.primary.checkout}
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
