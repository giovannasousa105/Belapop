"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type UIEvent } from "react";
import {
  Check,
  ChevronDown,
  CreditCard,
  Droplets,
  Layers3,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Star,
  SunMedium,
  Truck
} from "lucide-react";

import { BelaPopValidatedFooter } from "@/components/luxury/BelaPopValidatedFooter";
import { BelaPopValidatedHeader } from "@/components/luxury/BelaPopValidatedHeader";
import { useCart } from "@/lib/CartContext";
import { formatPrice } from "@/lib/utils";

type HeaderSection = "skincare" | "maquiagem" | "cabelos" | "perfumes";

type ProductGalleryItem = {
  alt?: string;
  url: string;
};

type ProductPdpPremiumMobileProduct = {
  brand?: string | null;
  category?: string | null;
  coverImage?: string | null;
  description?: string | null;
  gallery?: ProductGalleryItem[] | null;
  hero_image_url?: string | null;
  howToUse?: string[] | null;
  id: string;
  price?: number | null;
  price_cents?: number | null;
  sellerId?: string | null;
  title: string;
};

const GALLERY_FALLBACK: ProductGalleryItem[] = [
  {
    url: "https://lh3.googleusercontent.com/aida-public/AB6AXuAU2BbAbeAwR5Vu09mQLjv0INQ3dKGhvUBcc4k7j91FBWyYf2Nh_x7eKFzKwzEIeHMhRGItg2_LrBVpLY5p5Wmpu72xuexID-FBVP9zl9y-CMTQhkGxyOgGaMcYPMeRYA8uqeIlLlmBTUZNy0BJGadN2Y3rx9ERHNwR8MHZiwkO_0yTkHqvh8fIgzJEGrlQUORnbsGhg-kq9Xo1u2cMDOMH250uY6mwOXRi2IyI044h_7bIyqWL5teoU-2_lDCCvSf2l9fu8VBu14OJ",
    alt: "Packshot do serum em fundo claro."
  },
  {
    url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDUsV-42Fm_NmyAAmgNIXMTnYW-9Gp3NRScNNj0iD-tS-7WvHwTXN2SGRq9jp_xqGq4V3sheVMrqUccCXn9iAla4WBQT4DAnANg3O5kd-TRIV-AbQT63ZndWmKF1oxfzQHQ6NT1w9TRK2EjGBbfG7cnM_JBDLg-hyr0TCxKPqqV9uJ7t6kN2cnUFqDJ543kFkFsu2t9rSRO3kdMsc-G-gdw5XPrEfX1HdoVM62Zof5M9ExDWXGyOzhjMQMN6jn3e5vz3576T2QTmeOl",
    alt: "Textura do produto."
  },
  {
    url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDx4QqBs-OI7R_d-TTai2nIqjhpE66x7FT4NKmm5cqnQ-S9GICzlkfoZ7FmRHCVEkdenmcssFNuy76JrSg1uG1OgkV6B4z3qrJAp27ibnmEphm4J8PxvtNFbwIu4UiBBvdfANDcnHoc08uIDCOAiczFb2C6i-ZpDvp_BXH5KlImfx7tI9VEO8JQUOOixBP9jC2p6Zcwt0FDFx_v3W2TNsHTtj02oc025UnncevKG7giyoRj0nYLie9rMjq5OaaIM4rL7cbWq3y1hiLK",
    alt: "Detalhe de composicao."
  },
  {
    url: "https://lh3.googleusercontent.com/aida-public/AB6AXuB79WAf8yVglJIsXN0Oip8fyOZLgtyQlSELikq51_DOqKQsYc60qfd5Dr8ljQktwA6iGdWfpfQB9oLtj42x0SYnpZLA2d0fRuoek0XdOc_Nw9GC9RNozLB5_i4X_08-pO-FQJuFN_hAz-SBK23MTBfIv0dJwcoErnz4EtcAHEooN8-RKu7qeZ1SRyiYt15AjkyryF1bhXMlvZHSq1_s3ZkKeeL8eTsZOazXdxZER5iBnuWg4B9N6DJMtUcCqrns21Rfdx1lvpcRpW0s",
    alt: "Lifestyle de aplicacao."
  }
];

const LOVE_POINTS = [
  "Hidratacao imediata com conforto durante o dia.",
  "Textura leve que encaixa facil na rotina.",
  "Acabamento luminoso sem pesar na pele."
] as const;

const RECOMMENDATION_POINTS = [
  {
    title: "Alinhado ao seu tipo de pele",
    text: "Formula de absorcao leve para manter consistencia no uso diario."
  },
  {
    title: "Melhora de textura",
    text: "Aplicacao uniforme para reduzir aspecto irregular e reforcar maciez."
  },
  {
    title: "Encaixe na sua rotina",
    text: "Uso simples em poucos passos, sem aumentar complexidade."
  }
] as const;

const BENEFITS = [
  { icon: Droplets, label: "Hidratacao" },
  { icon: SunMedium, label: "Luminosidade" },
  { icon: Layers3, label: "Textura" },
  { icon: Sparkles, label: "Conforto" }
] as const;

const HOW_TO_USE_FALLBACK = [
  "Aplique sobre a pele limpa e seca.",
  "Distribua em camada uniforme com movimentos suaves.",
  "Finalize com hidratante e protetor solar na rotina diurna."
] as const;

const REVIEWS = [
  {
    author: "Mariana S.",
    text: "Textura leve, absorcao rapida e acabamento luminoso."
  },
  {
    author: "Clara P.",
    text: "Produto consistente no uso diario, facil de combinar com outros passos."
  },
  {
    author: "Beatriz M.",
    text: "Entrega no prazo informado e produto em embalagem original."
  }
] as const;

const FAQ_ITEMS = [
  {
    question: "O produto e original?",
    answer: "Sim. Item vendido por parceiro verificado com procedencia validada."
  },
  {
    question: "Qual o prazo de entrega?",
    answer: "O prazo e informado no checkout conforme seller e endereco de entrega."
  },
  {
    question: "Posso usar com outros ativos?",
    answer: "Sim. Mantenha camadas leves e ajuste de acordo com resposta da pele."
  },
  {
    question: "Como funciona devolucao?",
    answer: "Voce pode solicitar devolucao pelo fluxo de pedidos dentro da conta."
  }
] as const;

function resolveActiveSection(category: string | null | undefined): HeaderSection {
  const normalized = (category ?? "").toLowerCase();
  if (normalized.includes("maqui")) return "maquiagem";
  if (normalized.includes("cabel")) return "cabelos";
  if (normalized.includes("perf")) return "perfumes";
  return "skincare";
}

function resolveSubtitle(category: string | null | undefined) {
  const normalized = (category ?? "").toLowerCase();
  if (normalized.includes("maqui")) return "Cobertura uniforme com acabamento leve.";
  if (normalized.includes("cabel")) return "Tratamento capilar de toque leve e uso diario.";
  if (normalized.includes("perf")) return "Fragrancia de presenca equilibrada para uso diario.";
  return "Tratamento diario com textura leve e acabamento luminoso.";
}

function normalizeUrl(value: string | null | undefined) {
  const clean = value?.trim();
  return clean && clean.length > 0 ? clean : null;
}

function isLegacyPdpPlaceholder(url: string | null | undefined) {
  const normalized = normalizeUrl(url)?.toLowerCase();
  if (!normalized) return true;
  if (normalized === "/logo.svg" || normalized === "/logo-dark.svg") return true;
  if (normalized.includes("/editorial/product-hero-")) return true;
  if (normalized.includes("/editorial/") && normalized.endsWith(".svg")) return true;
  return false;
}

function resolvePrice(product: ProductPdpPremiumMobileProduct) {
  if (typeof product.price === "number" && Number.isFinite(product.price)) return product.price;
  if (typeof product.price_cents === "number" && Number.isFinite(product.price_cents)) {
    return product.price_cents / 100;
  }
  return 0;
}

function resolveGallery(product: ProductPdpPremiumMobileProduct) {
  const fromProduct: ProductGalleryItem[] = [];

  (product.gallery ?? []).forEach((item) => {
    const url = normalizeUrl(item?.url);
    if (!url || isLegacyPdpPlaceholder(url)) return;
    fromProduct.push({
      url,
      alt: item?.alt?.trim() || `${product.title} - imagem`
    });
  });

  const hero = normalizeUrl(product.hero_image_url);
  if (hero && !isLegacyPdpPlaceholder(hero)) {
    fromProduct.push({ url: hero, alt: `${product.title} - principal` });
  }

  const cover = normalizeUrl(product.coverImage);
  if (cover && !isLegacyPdpPlaceholder(cover)) {
    fromProduct.push({ url: cover, alt: `${product.title} - capa` });
  }

  const dedup = new Map<string, ProductGalleryItem>();
  [...fromProduct, ...GALLERY_FALLBACK].forEach((item) => {
    if (!dedup.has(item.url)) dedup.set(item.url, item);
  });

  const result = Array.from(dedup.values());
  while (result.length < 4) {
    result.push(GALLERY_FALLBACK[result.length % GALLERY_FALLBACK.length]);
  }

  return result.slice(0, 4);
}

function RatingRow() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5 text-black">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star key={index} className="h-3.5 w-3.5 fill-current" />
        ))}
      </div>
      <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-black/60">
        4.9 (120 avaliacoes)
      </span>
    </div>
  );
}

function ProofGrid() {
  const items = [
    { icon: ShieldCheck, label: "Autenticidade garantida" },
    { icon: Truck, label: "Envio rapido" },
    { icon: RotateCcw, label: "Devolucao facil" },
    { icon: CreditCard, label: "Pagamento seguro" }
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-3 py-3"
        >
          <item.icon className="h-4 w-4 text-black/65" />
          <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-black/70">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export function ProductPdpPremiumMobile({
  product
}: {
  product: ProductPdpPremiumMobileProduct;
}) {
  const router = useRouter();
  const { addItem } = useCart();

  const gallery = useMemo(() => resolveGallery(product), [product]);
  const price = resolvePrice(product);
  const installment = price > 0 ? formatPrice(price / 6) : "R$ 0,00";
  const sellerId = product.sellerId || "unknown";
  const activeSection = resolveActiveSection(product.category);
  const howToUse = product.howToUse?.length ? product.howToUse.slice(0, 3) : HOW_TO_USE_FALLBACK;

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [pendingAction, setPendingAction] = useState<"cart" | "checkout" | null>(null);
  const mobileTrackRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (activeImageIndex > gallery.length - 1) {
      setActiveImageIndex(0);
    }
  }, [activeImageIndex, gallery.length]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    gallery.forEach((item) => {
      const preload = new window.Image();
      preload.src = item.url;
    });
  }, [gallery]);

  const onTrackScroll = (event: UIEvent<HTMLDivElement>) => {
    const width = event.currentTarget.clientWidth;
    if (width <= 0) return;
    const index = Math.round(event.currentTarget.scrollLeft / width);
    if (index !== activeImageIndex) {
      setActiveImageIndex(Math.max(0, Math.min(index, gallery.length - 1)));
    }
  };

  const scrollToImage = (index: number) => {
    setActiveImageIndex(index);
    if (!mobileTrackRef.current) return;
    mobileTrackRef.current.scrollTo({
      left: mobileTrackRef.current.clientWidth * index,
      behavior: "smooth"
    });
  };

  const handleBuyAction = (target: "cart" | "checkout") => {
    if (pendingAction) return;
    setPendingAction(target);
    addItem(product.id, 1, sellerId);
    router.push(target === "cart" ? "/carrinho" : "/checkout");
  };

  return (
    <div
      className="min-h-screen bg-[#fcf9f8] [font-family:var(--font-inter)] tracking-[0.002em] text-[#1c1b1b]"
      data-belapop-page="pdp-premium-mobile"
    >
      <BelaPopValidatedHeader activeSection={activeSection} />

      <main className="pb-24 pt-16 md:pb-0">
        <section className="bg-[#f8f3ee]">
          <div className="md:hidden">
            <div className="relative h-[70svh] min-h-[460px] w-full overflow-hidden">
              <div
                ref={mobileTrackRef}
                onScroll={onTrackScroll}
                className="flex h-full snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {gallery.map((item, index) => (
                  <div key={`${item.url}-${index}`} className="relative h-full min-w-full snap-start">
                    <Image
                      src={item.url}
                      alt={item.alt || `${product.title} - imagem ${index + 1}`}
                      fill
                      unoptimized
                      sizes="100vw"
                      priority={index === 0}
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>

              <div className="absolute bottom-5 left-0 right-0 flex justify-center gap-2">
                {gallery.map((item, index) => (
                  <button
                    key={`${item.url}-dot`}
                    type="button"
                    onClick={() => scrollToImage(index)}
                    className={`h-1.5 rounded-full transition-all ${
                      activeImageIndex === index ? "w-7 bg-black" : "w-2 bg-black/25"
                    }`}
                    aria-label={`Ir para imagem ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            <div className="px-5 py-9">
              <div className="space-y-7">
                <RatingRow />

                <div className="space-y-2.5">
                  <h1 className="[font-family:var(--font-playfair)] text-[1.65rem] font-medium leading-[1.02] tracking-[-0.018em] text-black">
                    {product.title}
                  </h1>
                  <p className="text-[0.9rem] font-normal leading-[1.62] text-black/62">
                    {resolveSubtitle(product.category)}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <p className="[font-family:var(--font-playfair)] text-[2.2rem] font-semibold leading-[0.95] tracking-[-0.016em] text-black">
                    {formatPrice(price)}
                  </p>
                  <p className="text-[11px] font-medium uppercase tracking-[0.13em] text-black/54">
                    Em ate 6x de {installment} sem juros
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => handleBuyAction("cart")}
                    disabled={pendingAction !== null}
                    className="min-h-14 w-full bg-black px-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-black/90 disabled:opacity-60"
                  >
                    {pendingAction === "cart" ? "Adicionando..." : "Adicionar a sacola"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBuyAction("checkout")}
                    disabled={pendingAction !== null}
                    className="min-h-14 w-full border border-black bg-transparent px-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-black transition hover:bg-black hover:text-white disabled:opacity-60"
                  >
                    {pendingAction === "checkout" ? "Redirecionando..." : "Comprar agora"}
                  </button>
                </div>

                <p className="text-[11px] leading-[1.65] text-black/58">
                  Vendido por parceiro verificado. Condicoes variam conforme seller.
                </p>

                <ProofGrid />

                <div className="space-y-3.5 border-t border-black/10 pt-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.17em] text-black/70">
                    Por que voce vai amar
                  </p>
                  <ul className="space-y-2">
                    {LOVE_POINTS.map((point) => (
                      <li key={point} className="flex items-start gap-2 text-[0.94rem] leading-[1.66] text-black/72">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-black" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto hidden max-w-[1440px] grid-cols-[58%_42%] md:grid">
            <div className="bg-[#f2ebe5] px-10 py-10 lg:px-16 lg:py-14">
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-white">
                <Image
                  src={gallery[activeImageIndex]?.url || GALLERY_FALLBACK[0].url}
                  alt={gallery[activeImageIndex]?.alt || `${product.title} - principal`}
                  fill
                  unoptimized
                  sizes="(min-width: 1024px) 58vw, 100vw"
                  className="object-cover"
                  priority
                />
              </div>
              <div className="mt-4 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {gallery.map((item, index) => (
                  <button
                    key={`${item.url}-thumb`}
                    type="button"
                    onClick={() => setActiveImageIndex(index)}
                    className={`relative h-24 w-24 shrink-0 overflow-hidden border ${
                      activeImageIndex === index
                        ? "border-black"
                        : "border-black/10 transition hover:border-black/35"
                    }`}
                    aria-label={`Selecionar imagem ${index + 1}`}
                  >
                    <Image
                      src={item.url}
                      alt={item.alt || `${product.title} - miniatura ${index + 1}`}
                      fill
                      unoptimized
                      sizes="96px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[#fcf9f8] px-10 py-10 lg:px-14 lg:py-14">
              <div className="space-y-7">
                <RatingRow />

                <div className="space-y-2.5">
                  <h1 className="[font-family:var(--font-playfair)] text-[3.05rem] font-medium leading-[0.98] tracking-[-0.022em] text-black">
                    {product.title}
                  </h1>
                  <p className="text-[0.95rem] font-normal leading-[1.62] text-black/62">
                    {resolveSubtitle(product.category)}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <p className="[font-family:var(--font-playfair)] text-[3.35rem] font-semibold leading-[0.94] tracking-[-0.018em] text-black">
                    {formatPrice(price)}
                  </p>
                  <p className="text-[11px] font-medium uppercase tracking-[0.13em] text-black/54">
                    Em ate 6x de {installment} sem juros
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => handleBuyAction("cart")}
                    disabled={pendingAction !== null}
                    className="min-h-14 w-full bg-black px-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-black/90 disabled:opacity-60"
                  >
                    {pendingAction === "cart" ? "Adicionando..." : "Adicionar a sacola"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBuyAction("checkout")}
                    disabled={pendingAction !== null}
                    className="min-h-14 w-full border border-black bg-transparent px-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-black transition hover:bg-black hover:text-white disabled:opacity-60"
                  >
                    {pendingAction === "checkout" ? "Redirecionando..." : "Comprar agora"}
                  </button>
                </div>

                <p className="text-[11px] leading-[1.65] text-black/58">
                  Vendido por parceiro verificado. Condicoes variam conforme seller.
                </p>

                <ProofGrid />

                <div className="space-y-3.5 border-t border-black/10 pt-6">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.17em] text-black/70">
                    Por que voce vai amar
                  </p>
                  <ul className="space-y-2">
                    {LOVE_POINTS.map((point) => (
                      <li key={point} className="flex items-start gap-2 text-[0.94rem] leading-[1.66] text-black/72">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-black" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#fcf9f8] px-5 py-14 md:px-8 md:py-20">
          <div className="mx-auto max-w-[1280px] space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-black/50">
                  Recomendacao
                </p>
                <h2 className="mt-2 [font-family:var(--font-playfair)] text-[2.05rem] font-medium leading-[1.07] tracking-[-0.015em] text-black sm:text-[2.45rem]">
                  Por que recomendamos para voce
                </h2>
                <p className="mt-3 text-[0.95rem] leading-[1.62] text-black/64">
                  Analise de contexto para uma rotina com aplicacao simples e consistente.
                </p>
              </div>
              <div className="inline-flex items-end gap-2 border-b border-black/15 pb-1">
                <span className="[font-family:var(--font-playfair)] text-[3.2rem] font-semibold leading-none tracking-[-0.014em] text-black">
                  92%
                </span>
                <span className="pb-1 text-[10px] uppercase tracking-[0.2em] text-black/55">
                  Compatibilidade
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {RECOMMENDATION_POINTS.map((item) => (
                <article key={item.title} className="rounded-2xl border border-black/10 bg-white px-5 py-6">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/70">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-[0.94rem] leading-[1.62] text-black/70">{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#f6f1eb] px-5 py-14 md:px-8 md:py-20">
          <div className="mx-auto max-w-[1280px]">
            <h2 className="[font-family:var(--font-playfair)] text-[2rem] font-medium leading-[1.1] tracking-[-0.014em] text-black sm:text-[2.35rem]">
              Beneficios
            </h2>
            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              {BENEFITS.map((item) => (
                <article key={item.label} className="rounded-2xl bg-white px-4 py-5 text-center">
                  <item.icon className="mx-auto h-6 w-6 text-black/75" />
                  <h3 className="mt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-black/70">
                    {item.label}
                  </h3>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#fcf9f8] px-5 py-14 md:px-8 md:py-20">
          <div className="mx-auto max-w-[980px]">
            <h2 className="text-center [font-family:var(--font-playfair)] text-[2rem] font-medium leading-[1.1] tracking-[-0.014em] text-black sm:text-[2.35rem]">
              Como usar
            </h2>
            <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3">
              {howToUse.map((step, index) => (
                <article key={step} className="text-center">
                  <p className="[font-family:var(--font-playfair)] text-5xl font-medium leading-none tracking-[-0.012em] text-black/20">{`0${index + 1}`}</p>
                  <p className="mt-3 text-[0.94rem] leading-[1.62] text-black/70">{step}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-black/10 bg-white px-5 py-14 md:px-8 md:py-20">
          <div className="mx-auto max-w-[1180px]">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="[font-family:var(--font-playfair)] text-[2rem] font-medium leading-[1.1] tracking-[-0.014em] text-black sm:text-[2.35rem]">
                  Avaliacoes
                </h2>
                <p className="mt-2 text-[0.94rem] leading-[1.6] text-black/60">
                  Nota media 4.9 baseada em 120 avaliacoes
                </p>
              </div>
              <div className="flex items-center gap-2">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} className="h-4 w-4 fill-black text-black" />
                ))}
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
              {REVIEWS.map((review) => (
                <article key={review.author} className="rounded-2xl border border-black/10 px-5 py-6">
                  <p className="text-[0.94rem] leading-[1.66] text-black/70">&ldquo;{review.text}&rdquo;</p>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-black/65">
                    {review.author}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#f6f1eb] px-5 py-14 md:px-8 md:py-20">
          <div className="mx-auto max-w-[920px]">
            <h2 className="text-center [font-family:var(--font-playfair)] text-[2rem] font-medium leading-[1.1] tracking-[-0.014em] text-black sm:text-[2.35rem]">
              Perguntas frequentes
            </h2>
            <div className="mt-8 space-y-3">
              {FAQ_ITEMS.map((item) => (
                <details
                  key={item.question}
                  className="group rounded-2xl border border-black/10 bg-white px-5 py-4"
                >
                  <summary className="flex list-none items-center justify-between gap-4 text-left">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-black/75">
                      {item.question}
                    </span>
                    <ChevronDown className="h-4 w-4 shrink-0 text-black/55 transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="pt-3 text-[0.94rem] leading-[1.62] text-black/68">{item.answer}</p>
                </details>
              ))}
            </div>

            <p className="mt-8 text-center text-xs text-black/55">
              Mais detalhes na{" "}
              <Link href="/politica-de-cookies" className="underline underline-offset-4">
                politica da plataforma
              </Link>
              .
            </p>
          </div>
        </section>
      </main>

      <BelaPopValidatedFooter />

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-black/10 bg-[#fcf9f8]/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-[96px]">
            <p className="text-[10px] uppercase tracking-[0.18em] text-black/55">Total</p>
            <p className="[font-family:var(--font-playfair)] text-xl font-semibold leading-none tracking-[-0.012em] text-black">
              {formatPrice(price)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleBuyAction("cart")}
            disabled={pendingAction !== null}
            className="min-h-12 flex-1 bg-black px-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-black/90 disabled:opacity-60"
          >
            {pendingAction === "cart" ? "Adicionando..." : "Adicionar a sacola"}
          </button>
        </div>
      </div>
    </div>
  );
}
