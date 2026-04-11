"use client";

import Image from "next/image";
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
import { ProductPurchaseActions } from "@/components/product/ProductPurchaseActions";
import { formatPrice } from "@/lib/utils";

type ProductGalleryItem = {
  alt?: string;
  url: string;
};

type ProductLuxuryExperienceProduct = {
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

type HeaderSection = "skincare" | "maquiagem" | "cabelos" | "perfumes";

const FALLBACK_GALLERY: ProductGalleryItem[] = [
  {
    url: "https://lh3.googleusercontent.com/aida-public/AB6AXuAU2BbAbeAwR5Vu09mQLjv0INQ3dKGhvUBcc4k7j91FBWyYf2Nh_x7eKFzKwzEIeHMhRGItg2_LrBVpLY5p5Wmpu72xuexID-FBVP9zl9y-CMTQhkGxyOgGaMcYPMeRYA8uqeIlLlmBTUZNy0BJGadN2Y3rx9ERHNwR8MHZiwkO_0yTkHqvh8fIgzJEGrlQUORnbsGhg-kq9Xo1u2cMDOMH250uY6mwOXRi2IyI044h_7bIyqWL5teoU-2_lDCCvSf2l9fu8VBu14OJ",
    alt: "Packshot do sérum em fundo off-white."
  },
  {
    url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDUsV-42Fm_NmyAAmgNIXMTnYW-9Gp3NRScNNj0iD-tS-7WvHwTXN2SGRq9jp_xqGq4V3sheVMrqUccCXn9iAla4WBQT4DAnANg3O5kd-TRIV-AbQT63ZndWmKF1oxfzQHQ6NT1w9TRK2EjGBbfG7cnM_JBDLg-hyr0TCxKPqqV9uJ7t6kN2cnUFqDJ543kFkFsu2t9rSRO3kdMsc-G-gdw5XPrEfX1HdoVM62Zof5M9ExDWXGyOzhjMQMN6jn3e5vz3576T2QTmeOl",
    alt: "Textura do sérum em macro."
  },
  {
    url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDx4QqBs-OI7R_d-TTai2nIqjhpE66x7FT4NKmm5cqnQ-S9GICzlkfoZ7FmRHCVEkdenmcssFNuy76JrSg1uG1OgkV6B4z3qrJAp27ibnmEphm4J8PxvtNFbwIu4UiBBvdfANDcnHoc08uIDCOAiczFb2C6i-ZpDvp_BXH5KlImfx7tI9VEO8JQUOOixBP9jC2p6Zcwt0FDFx_v3W2TNsHTtj02oc025UnncevKG7giyoRj0nYLie9rMjq5OaaIM4rL7cbWq3y1hiLK",
    alt: "Detalhe da composição com orquídea."
  },
  {
    url: "https://lh3.googleusercontent.com/aida-public/AB6AXuB79WAf8yVglJIsXN0Oip8fyOZLgtyQlSELikq51_DOqKQsYc60qfd5Dr8ljQktwA6iGdWfpfQB9oLtj42x0SYnpZLA2d0fRuoek0XdOc_Nw9GC9RNozLB5_i4X_08-pO-FQJuFN_hAz-SBK23MTBfIv0dJwcoErnz4EtcAHEooN8-RKu7qeZ1SRyiYt15AjkyryF1bhXMlvZHSq1_s3ZkKeeL8eTsZOazXdxZER5iBnuWg4B9N6DJMtUcCqrns21Rfdx1lvpcRpW0s",
    alt: "Lifestyle com aplicação na rotina."
  }
];

const HOW_TO_USE_FALLBACK = [
  "Aplique sobre a pele limpa e seca.",
  "Distribua com movimentos suaves do centro para fora.",
  "Finalize com o hidratante da sua rotina."
];

const FAQ_ITEMS = [
  {
    question: "O produto é original?",
    answer: "Sim. Este item é vendido por parceiro verificado com controle de procedência."
  },
  {
    question: "Qual é o prazo de entrega?",
    answer:
      "O prazo é definido pelo seller no checkout, com rastreio após a confirmação do pedido."
  },
  {
    question: "Posso usar com outros ativos?",
    answer: "Sim. Mantenha o uso em camadas leves e ajuste conforme a resposta da sua pele."
  }
] as const;

const REVIEWS = [
  {
    author: "Mariana S.",
    text: "Textura leve, absorção rápida e acabamento luminoso desde a primeira semana."
  },
  {
    author: "Clara P.",
    text: "Produto consistente no uso diário e fácil de encaixar na rotina da manhã."
  },
  {
    author: "Beatriz M.",
    text: "Entrega dentro do prazo informado e produto em embalagem original."
  }
] as const;

function resolveActiveSection(category: string | null | undefined): HeaderSection {
  const value = (category ?? "").toLowerCase();
  if (value.includes("maqui")) return "maquiagem";
  if (value.includes("cabel")) return "cabelos";
  if (value.includes("perf")) return "perfumes";
  return "skincare";
}

function resolveSubtitle(category: string | null | undefined) {
  const value = (category ?? "").toLowerCase();
  if (value.includes("maqui")) return "Cobertura construível com acabamento uniforme.";
  if (value.includes("cabel")) return "Tratamento capilar de toque leve e controle diário.";
  if (value.includes("perf")) return "Fragrância de presença equilibrada para uso diário.";
  return "Tratamento diário com textura leve e acabamento luminoso.";
}

function normalizeUrl(value: string | null | undefined) {
  const clean = value?.trim();
  return clean && clean.length > 0 ? clean : null;
}

function buildGallery(product: ProductLuxuryExperienceProduct): ProductGalleryItem[] {
  const initial: ProductGalleryItem[] = [];

  (product.gallery ?? []).forEach((item) => {
    const url = normalizeUrl(item?.url);
    if (!url) return;
    initial.push({
      url,
      alt: item?.alt?.trim() || `${product.title} - galeria`
    });
  });

  const hero = normalizeUrl(product.hero_image_url);
  if (hero) {
    initial.push({ url: hero, alt: `${product.title} - imagem principal` });
  }

  const cover = normalizeUrl(product.coverImage);
  if (cover) {
    initial.push({ url: cover, alt: `${product.title} - imagem de capa` });
  }

  const unique = new Map<string, ProductGalleryItem>();
  [...initial, ...FALLBACK_GALLERY].forEach((item) => {
    if (!unique.has(item.url)) unique.set(item.url, item);
  });

  const normalized = Array.from(unique.values());
  while (normalized.length < 4) {
    normalized.push(FALLBACK_GALLERY[normalized.length % FALLBACK_GALLERY.length]);
  }

  return normalized;
}

function resolvePrice(product: ProductLuxuryExperienceProduct) {
  if (typeof product.price === "number" && Number.isFinite(product.price)) return product.price;
  if (typeof product.price_cents === "number" && Number.isFinite(product.price_cents)) {
    return product.price_cents / 100;
  }
  return 0;
}

function MicroProofs() {
  const items = [
    { icon: ShieldCheck, label: "Autenticidade garantida" },
    { icon: Truck, label: "Envio rápido" },
    { icon: RotateCcw, label: "Devolução fácil" },
    { icon: CreditCard, label: "Pagamento seguro" }
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-2 rounded-2xl border border-black/10 bg-white/70 px-3 py-3"
        >
          <item.icon className="h-4 w-4 text-black/70" />
          <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-black/75">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
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
        4.9 (120 avaliações)
      </span>
    </div>
  );
}

function PurchasePanel({
  product,
  price
}: {
  price: number;
  product: ProductLuxuryExperienceProduct;
}) {
  const installment = price > 0 ? formatPrice(price / 6) : "R$ 0,00";
  const sellerId = product.sellerId || "unknown";

  return (
    <div className="space-y-6">
      <RatingRow />

      <div className="space-y-2">
        <h1 className="font-editorial text-[2.2rem] leading-[0.95] tracking-[-0.03em] text-black sm:text-[2.8rem]">
          {product.title}
        </h1>
        <p className="text-sm leading-relaxed text-black/65">{resolveSubtitle(product.category)}</p>
      </div>

      <div className="space-y-1">
        <p className="font-editorial text-4xl leading-none text-black sm:text-5xl">
          {formatPrice(price)}
        </p>
        <p className="text-xs uppercase tracking-[0.16em] text-black/55">
          Em até 6x de {installment} sem juros
        </p>
      </div>

      <div className="space-y-3">
        <ProductPurchaseActions
          mode="single"
          productId={product.id}
          sellerId={sellerId}
          primaryTarget="cart"
          primaryLabel="Adicionar à sacola"
          containerClassName="w-full"
          primaryClassName="min-h-14 w-full rounded-none bg-black px-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-black/90"
        />
        <ProductPurchaseActions
          mode="single"
          productId={product.id}
          sellerId={sellerId}
          primaryTarget="checkout"
          primaryLabel="Comprar agora"
          containerClassName="w-full"
          primaryClassName="min-h-14 w-full rounded-none border border-black bg-transparent px-6 text-[11px] font-semibold uppercase tracking-[0.22em] text-black transition hover:bg-black hover:text-white"
        />
      </div>

      <MicroProofs />

      <div className="space-y-3 border-t border-black/10 pt-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/70">
          Por que você vai amar
        </p>
        <ul className="space-y-2">
          <li className="flex items-start gap-2 text-sm leading-relaxed text-black/72">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-black" />
            Hidratação imediata com conforto durante o dia.
          </li>
          <li className="flex items-start gap-2 text-sm leading-relaxed text-black/72">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-black" />
            Textura leve que não pesa na rotina.
          </li>
          <li className="flex items-start gap-2 text-sm leading-relaxed text-black/72">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-black" />
            Acabamento luminoso com aplicação simples.
          </li>
        </ul>
      </div>

      <p className="text-xs text-black/58">
        Vendido por parceiro verificado. Condições variam conforme seller.
      </p>
    </div>
  );
}

export function ProductLuxuryExperience({
  product
}: {
  product: ProductLuxuryExperienceProduct;
}) {
  const gallery = useMemo(() => buildGallery(product), [product]);
  const price = resolvePrice(product);
  const mobileTrackRef = useRef<HTMLDivElement | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (currentImageIndex > gallery.length - 1) {
      setCurrentImageIndex(0);
    }
  }, [currentImageIndex, gallery.length]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    gallery.forEach((item) => {
      const image = new window.Image();
      image.src = item.url;
    });
  }, [gallery]);

  const handleCarouselScroll = (event: UIEvent<HTMLDivElement>) => {
    const element = event.currentTarget;
    if (element.clientWidth === 0) return;
    const index = Math.round(element.scrollLeft / element.clientWidth);
    if (index !== currentImageIndex) {
      setCurrentImageIndex(Math.max(0, Math.min(index, gallery.length - 1)));
    }
  };

  const scrollToImage = (index: number) => {
    setCurrentImageIndex(index);
    const element = mobileTrackRef.current;
    if (!element) return;
    const left = element.clientWidth * index;
    element.scrollTo({ left, behavior: "smooth" });
  };

  const howToUse = product.howToUse?.length ? product.howToUse.slice(0, 3) : HOW_TO_USE_FALLBACK;
  const activeSection = resolveActiveSection(product.category);
  const sellerId = product.sellerId || "unknown";

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b]" data-belapop-page="product-luxury">
      <BelaPopValidatedHeader activeSection={activeSection} />

      <main className="pb-24 pt-16 md:pb-0">
        <section className="bg-[#f6f3f2]">
          <div className="md:hidden">
            <div className="relative h-[70svh] min-h-[460px] w-full overflow-hidden bg-[#efe9e4]">
              <div
                ref={mobileTrackRef}
                onScroll={handleCarouselScroll}
                className="flex h-full snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {gallery.map((image, index) => (
                  <div key={image.url} className="relative h-full min-w-full snap-start">
                    <Image
                      src={image.url}
                      alt={image.alt || `${product.title} - imagem ${index + 1}`}
                      fill
                      unoptimized
                      sizes="100vw"
                      className="object-cover"
                      priority={index === 0}
                    />
                  </div>
                ))}
              </div>

              <div className="absolute bottom-5 left-0 right-0 flex justify-center gap-2">
                {gallery.map((image, index) => (
                  <button
                    key={`${image.url}-dot`}
                    type="button"
                    onClick={() => scrollToImage(index)}
                    className={`h-1.5 rounded-full transition-all ${
                      currentImageIndex === index ? "w-7 bg-black" : "w-2 bg-black/25"
                    }`}
                    aria-label={`Ir para imagem ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            <div className="px-5 py-8">
              <PurchasePanel product={product} price={price} />
            </div>
          </div>

          <div className="mx-auto hidden max-w-[1440px] grid-cols-[58%_42%] gap-0 md:grid">
            <div className="bg-[#f3eeea] px-12 py-12 lg:px-16 lg:py-16">
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-white/70">
                <Image
                  src={gallery[currentImageIndex]?.url || FALLBACK_GALLERY[0].url}
                  alt={gallery[currentImageIndex]?.alt || `${product.title} - imagem principal`}
                  fill
                  unoptimized
                  sizes="(min-width: 1024px) 58vw, 100vw"
                  className="object-cover"
                  priority
                />
              </div>
              <div className="mt-5 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {gallery.map((image, index) => (
                  <button
                    key={`${image.url}-thumb`}
                    type="button"
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative h-24 w-24 shrink-0 overflow-hidden border transition ${
                      currentImageIndex === index
                        ? "border-black"
                        : "border-black/10 hover:border-black/35"
                    }`}
                    aria-label={`Selecionar imagem ${index + 1}`}
                  >
                    <Image
                      src={image.url}
                      alt={image.alt || `${product.title} - miniatura ${index + 1}`}
                      fill
                      unoptimized
                      sizes="(min-width: 1024px) 12vw, 25vw"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[#fcf9f8] px-10 py-12 lg:px-14 lg:py-16">
              <PurchasePanel product={product} price={price} />
            </div>
          </div>
        </section>

        <section className="border-y border-black/10 bg-[#fcf9f8] px-5 py-10 md:px-8">
          <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-6 md:grid-cols-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-black/75" />
              <span className="text-[11px] uppercase tracking-[0.18em] text-black/72">
                Produto original
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Truck className="h-5 w-5 text-black/75" />
              <span className="text-[11px] uppercase tracking-[0.18em] text-black/72">
                Envio com rastreio
              </span>
            </div>
            <div className="flex items-center gap-3">
              <RotateCcw className="h-5 w-5 text-black/75" />
              <span className="text-[11px] uppercase tracking-[0.18em] text-black/72">
                Troca facilitada
              </span>
            </div>
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-black/75" />
              <span className="text-[11px] uppercase tracking-[0.18em] text-black/72">
                Pagamento seguro
              </span>
            </div>
          </div>
        </section>

        <section className="bg-[#fcf9f8] px-5 py-14 md:px-8 md:py-20">
          <div className="mx-auto max-w-[1440px] space-y-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-black/50">
                  Recomendação
                </p>
                <h2 className="mt-3 font-editorial text-3xl leading-tight text-black sm:text-4xl">
                  Por que recomendamos para você
                </h2>
              </div>
              <div className="inline-flex items-end gap-2 border-b border-black/15 pb-1">
                <span className="font-editorial text-5xl leading-none text-black">92%</span>
                <span className="pb-1 text-[10px] uppercase tracking-[0.2em] text-black/55">
                  Compatibilidade
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <article className="rounded-2xl border border-black/10 bg-white px-5 py-6">
                <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-black/70">
                  Alinhado ao seu tipo de pele
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-black/70">
                  Fórmula de absorção leve para manter conforto e uso diário contínuo.
                </p>
              </article>
              <article className="rounded-2xl border border-black/10 bg-white px-5 py-6">
                <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-black/70">
                  Melhora de textura
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-black/70">
                  Aplicação uniforme para reduzir sensação de aspereza e reforçar maciez.
                </p>
              </article>
              <article className="rounded-2xl border border-black/10 bg-white px-5 py-6">
                <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-black/70">
                  Encaixe na rotina
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-black/70">
                  Uso simples em poucos passos, sem aumentar complexidade no cuidado.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="bg-[#f6f3f2] px-5 py-14 md:px-8 md:py-20">
          <div className="mx-auto max-w-[1440px]">
            <h2 className="font-editorial text-3xl text-black sm:text-4xl">Características do produto</h2>
            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
              <article className="rounded-2xl bg-white/80 px-4 py-5 text-center">
                <Droplets className="mx-auto h-6 w-6 text-black/75" />
                <h3 className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-black/70">
                  Hidratação
                </h3>
              </article>
              <article className="rounded-2xl bg-white/80 px-4 py-5 text-center">
                <SunMedium className="mx-auto h-6 w-6 text-black/75" />
                <h3 className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-black/70">
                  Luminosidade
                </h3>
              </article>
              <article className="rounded-2xl bg-white/80 px-4 py-5 text-center">
                <Layers3 className="mx-auto h-6 w-6 text-black/75" />
                <h3 className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-black/70">
                  Textura
                </h3>
              </article>
              <article className="rounded-2xl bg-white/80 px-4 py-5 text-center">
                <Sparkles className="mx-auto h-6 w-6 text-black/75" />
                <h3 className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-black/70">
                  Conforto
                </h3>
              </article>
            </div>
          </div>
        </section>

        <section className="bg-[#fcf9f8] px-5 py-14 md:px-8 md:py-20">
          <div className="mx-auto max-w-[1100px]">
            <h2 className="text-center font-editorial text-3xl text-black sm:text-4xl">Como usar</h2>
            <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3">
              {howToUse.map((step, index) => (
                <article key={step} className="text-center">
                  <p className="font-editorial text-5xl leading-none text-black/20">{`0${index + 1}`}</p>
                  <p className="mt-3 text-sm leading-relaxed text-black/70">{step}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-black/10 bg-white px-5 py-14 md:px-8 md:py-20">
          <div className="mx-auto max-w-[1200px]">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="font-editorial text-3xl text-black sm:text-4xl">Avaliações</h2>
                <p className="mt-2 text-sm text-black/60">Nota média 4.9 baseada em 120 avaliações</p>
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
                  <p className="text-sm leading-relaxed text-black/70">&ldquo;{review.text}&rdquo;</p>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-black/65">
                    {review.author}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#f6f3f2] px-5 py-14 md:px-8 md:py-20">
          <div className="mx-auto max-w-[920px]">
            <h2 className="text-center font-editorial text-3xl text-black sm:text-4xl">
              Perguntas frequentes
            </h2>
            <div className="mt-8 space-y-3">
              {FAQ_ITEMS.map((item) => (
                <details
                  key={item.question}
                  className="group rounded-2xl border border-black/10 bg-white px-5 py-4"
                >
                  <summary className="flex list-none items-center justify-between gap-4 text-left">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-black/75">
                      {item.question}
                    </span>
                    <ChevronDown className="h-4 w-4 shrink-0 text-black/55 transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="pt-3 text-sm leading-relaxed text-black/68">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <BelaPopValidatedFooter />

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-black/10 bg-[#fcf9f8]/95 px-4 py-3 backdrop-blur md:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-[96px]">
            <p className="text-[10px] uppercase tracking-[0.18em] text-black/55">Total</p>
            <p className="font-editorial text-lg leading-none text-black">{formatPrice(price)}</p>
          </div>
          <ProductPurchaseActions
            mode="single"
            productId={product.id}
            sellerId={sellerId}
            primaryTarget="cart"
            primaryLabel="Adicionar à sacola"
            containerClassName="flex-1"
            primaryClassName="min-h-12 w-full rounded-none bg-black px-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-black/90"
          />
        </div>
      </div>
    </div>
  );
}
