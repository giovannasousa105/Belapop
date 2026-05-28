"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Lock, ShieldCheck, Truck } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { CommerceLightFooter } from "@/components/commerce/CommerceLightFooter";
import { ShippingCalculator } from "@/components/ShippingCalculator";
import { BelaPopValidatedHeader } from "@/components/luxury/BelaPopValidatedHeader";
import { StripeCheckoutDemo } from "@/components/StripeCheckoutDemo";
import { brandSectionNames } from "@/lib/brand/sections";
import { useCart } from "@/lib/CartContext";
import { useViaCepFill } from "@/hooks/useViaCep";
import { usePublishedProducts } from "@/lib/hooks/useStoredProducts";
import { buildShippingItems } from "@/lib/shipping/prepareItems";
import type { Product } from "@/lib/types";

type PaymentMethod = "credit" | "pix";
type Step = "delivery" | "payment" | "processing";

type CheckoutAddressForm = {
  fullName: string;
  email: string;
  cpf: string;
  phone: string;
  zip: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
};

type FormErrors = Partial<Record<keyof CheckoutAddressForm, string>>;

type CheckoutPaymentIntent = {
  clientSecret: string;
  orderId: string;
  orderCode?: string;
  paymentIntentId?: string;
  totalAmountCents: number;
};

type CheckoutSummaryItem = {
  image: string;
  quantity: number;
  stockQuantity?: number;
  title: string;
  total: number;
};

const formatCurrency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

const UF_OPTIONS = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO"
];

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
  if (data?.error === "SELLER_NOT_CONNECTED")
    return "Este seller ainda não está habilitado para pagamento. Escolha outro item ou fale com o concierge.";
  if (data?.code === "SHIPPING_PROVIDER_NOT_CONFIGURED")
    return "O cálculo de frete está temporariamente indisponível. Tente novamente em instantes.";
  return data?.error ?? "Não foi possível iniciar o pagamento agora. Tente novamente ou fale com o concierge.";
}

function validateForm(form: CheckoutAddressForm): FormErrors {
  const errors: FormErrors = {};
  if (!form.fullName.trim() || form.fullName.trim().length < 3)
    errors.fullName = "Nome completo obrigatório";
  if (!form.email.includes("@"))
    errors.email = "E-mail inválido";
  if (form.cpf.replace(/\D/g, "").length !== 11)
    errors.cpf = "CPF inválido (11 dígitos)";
  if (form.phone.replace(/\D/g, "").length < 10)
    errors.phone = "Telefone inválido";
  if (form.zip.replace(/\D/g, "").length !== 8)
    errors.zip = "CEP inválido";
  if (!form.street.trim())
    errors.street = "Logradouro obrigatório";
  if (!form.number.trim())
    errors.number = "Número obrigatório";
  if (!form.city.trim())
    errors.city = "Cidade obrigatória";
  if (form.state.trim().length !== 2)
    errors.state = "UF obrigatório (2 letras)";
  return errors;
}

function maskCpf(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function maskPhone(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{4,5})(\d{4})$/, "$1-$2");
}

function maskZip(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 8);
  return d.replace(/(\d{5})(\d{1,3})$/, "$1-$2");
}

// ─── Field component ────────────────────────────────────────────────────────
type FieldProps = {
  field: string;
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  error?: string;
  readOnly?: boolean;
  required?: boolean;
  autoComplete?: string;
  maxLength?: number;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  onChange: (value: string) => void;
};

function Field({
  field,
  label,
  type = "text",
  placeholder,
  value,
  error,
  readOnly,
  required,
  autoComplete,
  maxLength,
  inputMode,
  onChange
}: FieldProps) {
  return (
    <div data-field={field}>
      <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.17em] text-black/58">
        {label}
        {required ? <span className="ml-1 text-red-500">*</span> : null}
      </label>
      <input
        name={field}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        readOnly={readOnly}
        required={required}
        maxLength={maxLength}
        inputMode={inputMode}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${
          error
            ? "border-red-400 bg-red-50 focus:border-red-500"
            : readOnly
            ? "border-black/10 bg-[#f6f3f2] text-black/50"
            : "border-black/12 bg-[#fcf9f8] focus:border-black/30"
        }`}
      />
      {error ? <p className="mt-1.5 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

function StateSelect({
  value,
  error,
  required,
  onChange
}: {
  value: string;
  error?: string;
  required?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div data-field="state">
      <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.17em] text-black/58">
        UF
        {required ? <span className="ml-1 text-red-500">*</span> : null}
      </label>
      <select
        name="state"
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${
          error
            ? "border-red-400 bg-red-50 focus:border-red-500"
            : "border-black/12 bg-[#fcf9f8] focus:border-black/30"
        }`}
      >
        <option value="">UF</option>
        {UF_OPTIONS.map((uf) => (
          <option key={uf} value={uf}>
            {uf}
          </option>
        ))}
      </select>
      {error ? <p className="mt-1.5 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export function LuxuryCheckoutExperience() {
  const router = useRouter();
  const { anonId, cartId, items, markCartConverted, ready, totalShipping } = useCart();
  const { products, loading: productsLoading } = usePublishedProducts();

  const [step, setStep] = useState<Step>("delivery");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("credit");
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(true);

  const [address, setAddress] = useState<CheckoutAddressForm>({
    fullName: "",
    email: "",
    cpf: "",
    phone: "",
    zip: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
  });
  const cepFetched = useViaCepFill(address.zip, setAddress);

  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [paymentIntent, setPaymentIntent] = useState<CheckoutPaymentIntent | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [creatingPayment, setCreatingPayment] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const stripeFormRef = useRef<HTMLDivElement>(null);

  // ── Derived cart state ────────────────────────────────────────────────────
  const summaryItems = useMemo<CheckoutSummaryItem[]>(() => {
    return items
      .map((item): CheckoutSummaryItem | null => {
        const product = findProduct(products, item.productId);
        if (!product) return null;
        const summary: CheckoutSummaryItem = {
          image: resolveProductImage(product),
          quantity: item.quantity,
          title: product.name,
          total: product.price * item.quantity,
        };
        if (typeof product.stockQuantity === "number") summary.stockQuantity = product.stockQuantity;
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
  const hasUnresolvedItems = ready && !productsLoading && items.length > 0 && summaryItems.length !== items.length;
  const hasStockIssue = summaryItems.some(
    (item) =>
      typeof item.stockQuantity === "number" &&
      Number.isFinite(item.stockQuantity) &&
      item.quantity > item.stockQuantity
  );
  const isEmpty = ready && items.length === 0;

  // ── Address field update + masks + ViaCEP ────────────────────────────────
  const updateAddress = (field: keyof CheckoutAddressForm, raw: string) => {
    let value = raw;
    if (field === "cpf") value = maskCpf(raw);
    else if (field === "phone") value = maskPhone(raw);
    else if (field === "zip") value = maskZip(raw);
    else if (field === "state") value = raw.toUpperCase().slice(0, 2);

    setAddress((current) => ({ ...current, [field]: value }));
    if (formErrors[field]) setFormErrors((current) => ({ ...current, [field]: undefined }));

  };

  // ── Payment intent creation ───────────────────────────────────────────────
  const handleCreatePayment = async () => {
    if (creatingPayment) return;
    if (isEmpty) { router.push("/carrinho"); return; }
    if (isCartLoading) return;
    if (hasUnresolvedItems || summaryItems.length === 0) {
      setCheckoutError("Não conseguimos validar os itens do carrinho. Revise sua seleção antes de pagar.");
      return;
    }
    if (hasStockIssue) {
      setCheckoutError("Um ou mais itens ultrapassam o estoque disponível. Ajuste o carrinho antes de pagar.");
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
          body: JSON.stringify({ anonId, cartId, items, subtotalCents: 0 }),
        });
        const syncData = (await syncResponse.json().catch(() => null)) as { cartId?: string } | null;
        if (syncResponse.ok && syncData?.cartId) resolvedCartId = syncData.cartId;
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
          customer: {
            name: address.fullName.trim(),
            email: address.email.trim(),
            cpf: address.cpf.replace(/\D/g, ""),
            phone: `+55${address.phone.replace(/\D/g, "")}`,
          },
          address: {
            fullName: address.fullName.trim(),
            email: address.email.trim(),
            cpf: address.cpf.replace(/\D/g, ""),
            phone: `+55${address.phone.replace(/\D/g, "")}`,
            street: address.street.trim(),
            number: address.number.trim(),
            complement: address.complement.trim(),
            district: address.neighborhood.trim(),
            neighborhood: address.neighborhood.trim(),
            city: address.city.trim(),
            state: address.state.trim().toUpperCase(),
            country: "BR",
            zip: address.zip.replace(/\D/g, ""),
          },
        }),
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
        orderCode: data.orderCode,
        paymentIntentId: data.paymentIntentId,
        totalAmountCents: data.totalAmountCents,
      });
      setStep("payment");
      setTimeout(() => {
        stripeFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch {
      setCheckoutError("Não foi possível iniciar o pagamento agora. Tente novamente em instantes.");
    } finally {
      setCreatingPayment(false);
    }
  };

  // ── Step 1 → Step 2 transition ────────────────────────────────────────────
  const handleContinueToPayment = async () => {
    const errors = validateForm(address);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      const firstKey = Object.keys(errors)[0];
      formRef.current?.querySelector<HTMLElement>(`[data-field="${firstKey}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setFormErrors({});
    await handleCreatePayment();
  };

  // ── Post-payment redirect ─────────────────────────────────────────────────
  const handleCheckoutSuccess = async (result?: { orderId?: string; orderCode?: string }) => {
    const orderId = result?.orderId ?? paymentIntent?.orderId;
    const orderCode = result?.orderCode ?? paymentIntent?.orderCode;

    if (orderId) {
      setStep("processing");
      await markCartConverted(orderId);
      try {
        await fetch("/api/cart/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ anonId, cartId, items: [], subtotalCents: 0 })
        });
      } catch {}
      const suffix = new URLSearchParams({
        id: orderId,
        ...(orderCode ? { code: orderCode } : {})
      }).toString();
      router.push(`/conta/pedidos/confirmacao?${suffix}`);
    } else {
      router.push("/conta/pedidos?checkout=confirmado");
    }
  };

  const confirmReturnUrl =
    typeof window !== "undefined" && paymentIntent
      ? `${window.location.origin}/conta/pedidos/confirmacao?${new URLSearchParams({
          id: paymentIntent.orderId,
          ...(paymentIntent.orderCode ? { code: paymentIntent.orderCode } : {})
        }).toString()}`
      : undefined;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b] [font-family:var(--font-inter)]">
      <BelaPopValidatedHeader activeSection="skincare" />

      <main className="mx-auto max-w-[1440px] px-5 pb-24 pt-24 sm:px-8 lg:px-10 lg:pt-32">
        {/* Stepper breadcrumb */}
        <div className="mb-8 flex items-center gap-3 text-[10px] uppercase tracking-[0.18em] text-black/55 sm:text-xs">
          <span>Carrinho</span>
          <span className="text-black/25">-&gt;</span>
          <span className={step === "delivery" ? "font-semibold text-black/85" : "text-black/40 line-through"}>
            Identificação
          </span>
          <span className="text-black/25">-&gt;</span>
          <span className={step === "payment" || step === "processing" ? "font-semibold text-black/85" : "text-black/40"}>
            Pagamento
          </span>
          <span className="text-black/25">-&gt;</span>
          <span className={step === "processing" ? "font-semibold text-black/85" : "text-black/40"}>
            Confirmação
          </span>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-14">
          {/* ── Left column ─────────────────────────────────────────────── */}
          <section className="space-y-10 lg:col-span-7">
            <header className="space-y-2">
              <h1 className="[font-family:var(--font-playfair)] text-4xl font-semibold tracking-[-0.02em] sm:text-5xl">
                {step === "delivery" ? "Checkout" : step === "processing" ? "Confirmação" : "Pagamento"}
              </h1>
              <p className="text-sm leading-relaxed text-black/60">
                {step === "delivery"
                  ? "Finalize com entrega segura e pagamento validado."
                  : step === "processing"
                    ? "Estamos confirmando seu pedido e limpando o carrinho."
                  : "Conclua o pagamento para confirmar seu pedido."}
              </p>
            </header>

            {step === "delivery" ? (
              <>
                {/* Delivery form */}
                <div ref={formRef} className="rounded-2xl border border-black/10 bg-white p-6 sm:p-8">
                  <h2 className="[font-family:var(--font-playfair)] text-3xl font-medium tracking-[-0.01em]">
                    Dados de entrega
                  </h2>

                  <div className="mt-7 space-y-5">
                    {/* Nome + E-mail */}
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field
                        field="fullName"
                        label="Nome completo"
                        placeholder="Como no documento"
                        autoComplete="name"
                        value={address.fullName}
                        error={formErrors.fullName}
                        required
                        onChange={(v) => updateAddress("fullName", v)}
                      />
                      <Field
                        field="email"
                        label="E-mail"
                        type="email"
                        placeholder="você@email.com"
                        autoComplete="email"
                        value={address.email}
                        error={formErrors.email}
                        required
                        onChange={(v) => updateAddress("email", v)}
                      />
                    </div>

                    {/* CPF + Telefone */}
                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field
                        field="cpf"
                        label="CPF"
                        placeholder="000.000.000-00"
                        autoComplete="off"
                        inputMode="numeric"
                        value={address.cpf}
                        error={formErrors.cpf}
                        required
                        onChange={(v) => updateAddress("cpf", v)}
                      />
                      <Field
                        field="phone"
                        label="Telefone / WhatsApp"
                        placeholder="(00) 00000-0000"
                        autoComplete="tel"
                        inputMode="numeric"
                        value={address.phone}
                        error={formErrors.phone}
                        required
                        onChange={(v) => updateAddress("phone", v)}
                      />
                    </div>

                    {/* CEP + Cidade + UF */}
                    <div className="grid gap-5 sm:grid-cols-3">
                      <Field
                        field="zip"
                        label="CEP"
                        placeholder="00000-000"
                        autoComplete="postal-code"
                        inputMode="numeric"
                        value={address.zip}
                        error={formErrors.zip}
                        required
                        onChange={(v) => updateAddress("zip", v)}
                      />
                      <Field
                        field="city"
                        label="Cidade"
                        placeholder="São Paulo"
                        autoComplete="address-level2"
                        value={address.city}
                        error={formErrors.city}
                        readOnly={cepFetched && Boolean(address.city)}
                        required
                        onChange={(v) => updateAddress("city", v)}
                      />
                      <StateSelect
                        value={address.state}
                        error={formErrors.state}
                        required
                        onChange={(v) => updateAddress("state", v)}
                      />
                    </div>

                    {/* Logradouro */}
                    <Field
                      field="street"
                      label="Rua / Logradouro"
                      placeholder="Ex: Rua das Flores"
                      autoComplete="street-address"
                      value={address.street}
                      error={formErrors.street}
                      readOnly={cepFetched && Boolean(address.street)}
                      required
                      onChange={(v) => updateAddress("street", v)}
                    />

                    {/* Número + Complemento + Bairro */}
                    <div className="grid gap-5 sm:grid-cols-3">
                      <Field
                        field="number"
                        label="Número"
                        placeholder="Ex: 123"
                        autoComplete="address-line2"
                        value={address.number}
                        error={formErrors.number}
                        required
                        onChange={(v) => updateAddress("number", v)}
                      />
                      <Field
                        field="complement"
                        label="Complemento"
                        placeholder="Apto, bloco..."
                        autoComplete="address-line3"
                        value={address.complement}
                        onChange={(v) => updateAddress("complement", v)}
                      />
                      <Field
                        field="neighborhood"
                        label="Bairro"
                        placeholder="Ex: Centro"
                        autoComplete="address-level3"
                        value={address.neighborhood}
                        error={formErrors.neighborhood}
                        readOnly={cepFetched && Boolean(address.neighborhood)}
                        onChange={(v) => updateAddress("neighborhood", v)}
                      />
                    </div>
                  </div>
                </div>

                {/* Payment method selection */}
                <div className="rounded-2xl border border-black/10 bg-white p-6 sm:p-8">
                  <h2 className="[font-family:var(--font-playfair)] text-3xl font-medium tracking-[-0.01em]">
                    Forma de pagamento
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
                </div>

                {/* Shipping calculator */}
                {liveShippingItems.length > 0 ? (
                  <ShippingCalculator cartItems={liveShippingItems} tone="light" />
                ) : null}
              </>
            ) : (
              /* Payment step */
              <div ref={stripeFormRef} className="scroll-mt-28 space-y-6">
                <button
                  type="button"
                  onClick={() => {
                    setStep("delivery");
                    setPaymentIntent(null);
                    setCheckoutError(null);
                  }}
                  className="inline-flex items-center gap-2 text-sm text-black/60 underline underline-offset-4 hover:text-black"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar para dados de entrega
                </button>

                {paymentIntent ? (
                  <StripeCheckoutDemo
                    amountCents={paymentIntent.totalAmountCents}
                    clientSecret={paymentIntent.clientSecret}
                    currency="brl"
                    ctaLabel={paymentMethod === "pix" ? "Gerar QR Code Pix" : "Pagar com segurança"}
                    orderCode={paymentIntent.orderCode}
                    orderId={paymentIntent.orderId}
                    paymentIntentId={paymentIntent.paymentIntentId}
                    returnUrl={confirmReturnUrl}
                    onSuccess={handleCheckoutSuccess}
                  />
                ) : null}

                {checkoutError ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-700">
                    {checkoutError}
                  </div>
                ) : null}
              </div>
            )}
          </section>

          {/* ── Right aside — order summary ──────────────────────────────── */}
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

                {/* Cart items */}
                {isCartLoading ? (
                  <p className="mt-6 border-b border-black/10 pb-6 text-sm leading-relaxed text-black/62">
                    Carregando os itens do carrinho...
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
                          <p className="mt-2 text-sm text-black/58">Qtd: {summary.quantity}</p>
                          {typeof summary.stockQuantity === "number" &&
                          summary.quantity > summary.stockQuantity ? (
                            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-red-700">
                              Estoque disponível: {summary.stockQuantity}
                            </p>
                          ) : null}
                          <p className="mt-3 text-base font-semibold">
                            {formatCurrency.format(summary.total)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Totals */}
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

                {/* CTA — only on delivery step */}
                {step === "delivery" ? (
                  <>
                    {checkoutError ? (
                      <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-700">
                        {checkoutError}
                      </div>
                    ) : null}

                    <button
                      type="button"
                      onClick={handleContinueToPayment}
                      disabled={
                        creatingPayment ||
                        isCartLoading ||
                        isEmpty ||
                        hasUnresolvedItems ||
                        hasStockIssue
                      }
                      className="mt-7 inline-flex min-h-14 w-full items-center justify-center gap-2 bg-black px-5 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-black/90 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      {creatingPayment ? "Aguarde..." : "Continuar para pagamento"}
                      {!creatingPayment ? <ArrowRight className="h-4 w-4" /> : null}
                    </button>

                    <p className="mt-4 text-center text-[10px] leading-relaxed text-black/55">
                      A conclusão da compra depende da aprovação do pagamento e das condições exibidas pela BelaPop.
                    </p>
                  </>
                ) : null}

                {/* Trust badges */}
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
