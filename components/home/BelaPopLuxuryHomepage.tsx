"use client";

/* eslint-disable @next/next/no-img-element */

import { motion, useReducedMotion } from "framer-motion";
import { BadgeCheck, Check, CreditCard, PackageCheck, ShieldCheck, ShoppingBag, Sparkles, Truck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { BelaPopValidatedHeader } from "@/components/luxury/BelaPopValidatedHeader";
import { BelaPopValidatedFooter } from "@/components/luxury/BelaPopValidatedFooter";
import { HomeUniversesSection } from "@/components/home/HomeUniversesSection";
import { SkincareBundleSection } from "@/components/skincare/SkincareBundleSection";
import { CirculoForm } from "@/components/circulo/CirculoForm";
import { artigos } from "@/lib/diario/data";

import { TrustSignals } from "@/components/legal/TrustSignals";
import { useCart } from "@/lib/CartContext";
import { brandCtas } from "@/lib/brand/ctas";
import { brandSectionNames } from "@/lib/brand/sections";
import { getProductDisplayImage } from "@/lib/product/productCovers";
import { formatPrice } from "@/lib/utils";

type HomeProduct = {
  brand?: string | null;
  category?: string | null;
  coverImage?: string | null;
  hero_image_url?: string | null;
  id: string;
  price_cents: number;
  sellerId?: string | null;
  slug: string;
  title: string;
};

function toHomeProductCard(product: HomeProduct) {
  return {
    brand: product.brand?.trim() || "BelaPop",
    href: `/produto/${product.slug || product.id}`,
    image: getProductDisplayImage({
      category: product.category,
      coverImage: product.coverImage,
      heroImageUrl: product.hero_image_url
    }),
    price: formatPrice(product.price_cents / 100),
    priceCents: product.price_cents,
    productId: product.id,
    sellerId: product.sellerId ?? "unknown",
    title: product.title
  };
}


function LuxuryProductCard({
  brand,
  href,
  title,
  price,
  priceCents,
  image,
  productId,
  sellerId,
}: {
  brand: string;
  href: string;
  title: string;
  price: string;
  priceCents: number;
  image: string;
  productId: string;
  sellerId: string;
}) {
  const { addItem } = useCart();
  const [addStatus, setAddStatus] = useState<"idle" | "adding" | "added">("idle");

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (addStatus !== "idle") return;
    setAddStatus("adding");
    addItem(productId, 1, sellerId, { name: title, price: priceCents / 100 });
    setTimeout(() => setAddStatus("added"), 260);
    setTimeout(() => setAddStatus("idle"), 2500);
  }

  return (
    <article className="group relative transition duration-300 hover:-translate-y-1">
      <div className="relative mb-6">
        <Link
          href={href}
          className="block aspect-[3/4] overflow-hidden bg-[#f6f3f2] shadow-[0_18px_70px_rgba(28,27,27,0.06)] transition duration-300 group-hover:shadow-[0_28px_90px_rgba(28,27,27,0.12)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1c1b1b]"
        >
          <img
            src={image}
            alt={title}
            loading="lazy"
            decoding="async"
            width={640}
            height={853}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        </Link>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-full transition-transform duration-300 group-hover:pointer-events-auto group-hover:translate-y-0">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={addStatus !== "idle"}
            aria-label={addStatus === "added" ? "Adicionado ao carrinho" : "Adicionar ao carrinho"}
            className="flex w-full items-center justify-center gap-2 bg-[#1c1b1b]/92 py-3.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white backdrop-blur-sm transition-colors hover:bg-black disabled:opacity-60"
          >
            <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
            {addStatus === "added" ? "Adicionado ✓" : addStatus === "adding" ? "…" : "Adicionar ao carrinho"}
          </button>
        </div>
      </div>
      <h4 className="mb-2 font-display text-[13px] font-normal normal-case tracking-[0.01em] text-[#3a3535]">
        {brand}
      </h4>
      <p className="mb-4 text-sm leading-relaxed text-[#444748]">{title}</p>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.06em] text-[#6c5e06]">
        Selecionado pela BelaPop
      </p>
      <span className="font-body font-bold text-black">{price}</span>
    </article>
  );
}

const heroTrustSignals = [
  "Faça sua leitura BelaPop",
  "Descubra a rotina certa para sua pele",
  "Curadoria baseada nas necessidades reais da sua pele"
] as const;

const seasonalHeroVideos = [
  {
    id: "skin-scan-editorial-2026",
    label: "Skin Scan Editorial",
    poster: "/editorial/belapop-skin-scan-hero-poster.jpg",
    mobilePoster: "/editorial/belapop-skin-scan-hero-mobile-poster.jpg",
    mobile: {
      webm: "/editorial/belapop-skin-scan-hero-mobile.webm",
      mp4: "/editorial/belapop-skin-scan-hero-mobile.mp4"
    },
    desktop: {
      webm: "/editorial/belapop-skin-scan-hero-desktop.webm",
      mp4: "/editorial/belapop-skin-scan-hero-desktop.mp4"
    }
  }
] as const;

const heroSocialProof = "Skin Scan personalizado \u00b7 produtos originais";

const trustMetrics = [
  { label: "Skin Scan", value: "Leitura personalizada" },
  { label: "Importação oficial", value: "Produtos originais" },
  { label: "Compra segura", value: "Suporte humano" }
] as const;

const skinScanMetrics = [
  { label: "Textura", value: 86, detail: "leitura visual" },
  { label: "Hidratação", value: 72, detail: "sinal de conforto" },
  { label: "Brilho", value: 64, detail: "equilíbrio do dia" }
] as const;


const confidenceItems = [
  { label: "Compra protegida", detail: "camadas de segurança no pagamento", icon: ShieldCheck },
  { label: "Entrega rastreada", detail: "pedido acompanhado do envio à chegada", icon: Truck },
  { label: "Pagamento seguro", detail: "fluxo claro e baixa fricção", icon: CreditCard },
  { label: "Produtos originais", detail: "curadoria e procedência verificadas", icon: BadgeCheck },
  { label: "Importação oficial", detail: "sellers e marcas aprovadas", icon: PackageCheck }
] as const;

function ConversionBar() {
  return (
    <aside className="border-y border-[#e1d8d0] bg-[#f6f3f2] px-4 py-3 text-center text-xs font-medium uppercase tracking-[0.06em] text-[#5f584f] sm:px-6 lg:px-8">
      {"Frete gr\u00e1tis acima de R$350 hoje \u2022 Kits selecionados com estoque limitado \u2022 Curadorias atualizadas semanalmente"}
    </aside>
  );
}

function TrustMetricsStrip() {
  return (
    <section className="bg-[#fcf9f8] px-4 py-7 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {trustMetrics.map((metric) => (
          <div
            key={metric.label}
            className="border border-[#e1d8d0] bg-white/88 px-4 py-4 shadow-[0_18px_60px_rgba(28,27,27,0.04)] backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:border-[#c9baa9]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[#8a8179]">
              {metric.label}
            </p>
            <p className="mt-2 font-headline text-xl leading-tight text-[#1c1b1b]">{metric.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function SkinScanTechnologySection() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="como-funciona" className="overflow-hidden bg-[#0c0b0a] px-4 py-16 text-white sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(360px,0.72fr)] lg:items-center">
        <div className="space-y-8">
          <div className="space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#dac769]">
              Skin Scan BelaPop
            </p>
            <h2 className="max-w-3xl font-headline text-3xl leading-[1.12] tracking-normal sm:text-4xl">
              Sua leitura começa aqui.
            </h2>
            <div className="max-w-2xl space-y-3 text-sm leading-7 text-white/72 sm:text-base">
              <p>Entenda sua pele em segundos.</p>
              <p>Uma nova geração de curadoria personalizada.</p>
              <p>Curadoria baseada nas necessidades reais da sua pele, sem excesso e sem tentativa cega.</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {["Leitura facial elegante", "Rotina mais precisa", "Produtos originais"].map((item) => (
              <div key={item} className="border border-white/12 bg-white/[0.05] px-4 py-4 backdrop-blur-xl">
                <p className="text-xs font-semibold uppercase tracking-[0.06em] text-white/68">{item}</p>
              </div>
            ))}
          </div>

          <Link
            href="/skin-scan"
            className="group inline-flex min-h-14 items-center justify-center gap-3 bg-white px-7 text-xs font-semibold uppercase tracking-[0.08em] text-black shadow-[0_20px_70px_rgba(255,255,255,0.08)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#dac769] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            Fazer leitura BelaPop
            <Sparkles className="h-4 w-4 transition duration-300 group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </div>

        <div className="relative mx-auto w-full max-w-xl">
          <div className="absolute -inset-8 bg-[radial-gradient(circle_at_center,rgba(218,199,105,0.16),transparent_64%)] blur-2xl" aria-hidden="true" />
          <div className="relative overflow-hidden border border-white/14 bg-white/[0.05] p-3 shadow-[0_36px_120px_rgba(0,0,0,0.36)] backdrop-blur-2xl">
            <div className="relative aspect-[4/5] overflow-hidden bg-[#151312]">
              <img
                src="/editorial/home-ai-card.jpg"
                alt="Interface elegante de leitura visual de pele BelaPop"
                loading="lazy"
                decoding="async"
                width={900}
                height={1125}
                className="h-full w-full object-cover opacity-76"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,9,8,0.06),rgba(10,9,8,0.72))]" />
              <motion.div
                aria-hidden="true"
                initial={reduceMotion ? false : { opacity: 0.5, y: -16 }}
                animate={reduceMotion ? undefined : { opacity: [0.42, 0.72, 0.42], y: [0, 16, 0] }}
                transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-x-8 top-12 h-px bg-[#dac769]/70 shadow-[0_0_36px_rgba(218,199,105,0.55)]"
              />
              <div className="absolute inset-x-5 bottom-5 border border-white/16 bg-black/34 p-4 backdrop-blur-2xl">
                <div className="mb-4 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.08em] text-white/62">
                  <span>Skin intelligence</span>
                  <span>Live</span>
                </div>
                <div className="space-y-4">
                  {skinScanMetrics.map((metric) => (
                    <div key={metric.label}>
                      <div className="mb-1.5 flex items-center justify-between text-xs uppercase tracking-[0.06em] text-white/76">
                        <span>{metric.label}</span>
                        <span>{metric.value}%</span>
                      </div>
                      <div className="h-px bg-white/16">
                        <motion.div
                          className="h-px bg-[#dac769]"
                          initial={{ width: reduceMotion ? `${metric.value}%` : "18%" }}
                          whileInView={{ width: `${metric.value}%` }}
                          viewport={{ once: true, amount: 0.1 }}
                          transition={{ duration: 0.9, ease: "easeOut" }}
                        />
                      </div>
                      <p className="mt-1 text-[10px] uppercase tracking-[0.06em] text-white/42">{metric.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


function CheckoutConfidenceRail() {
  return (
    <section className="bg-white px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl border border-[#ded8d2] bg-white p-5 shadow-[0_24px_90px_rgba(28,27,27,0.05)] lg:p-7">
        <div className="grid gap-3 md:grid-cols-5">
          {confidenceItems.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex gap-3 border-[#ece6e0] py-2 md:border-r md:pr-4 md:last:border-r-0">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#6c5e06]" aria-hidden="true" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[#1c1b1b]">{item.label}</p>
                  <p className="mt-1 text-xs leading-5 text-[#6f6862]">{item.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function MobileStickyCta() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const updateVisibility = () => setVisible(window.scrollY > 640);
    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    return () => window.removeEventListener("scroll", updateVisibility);
  }, []);

  return (
    <div
      aria-hidden={!visible}
      className={`fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 rounded-[8px] border border-white/18 bg-[#111111]/86 p-2 shadow-[0_18px_70px_rgba(0,0,0,0.34)] backdrop-blur-2xl transition duration-300 md:hidden ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <Link
          href="/skin-scan"
          tabIndex={visible ? 0 : -1}
          className="inline-flex min-h-12 items-center justify-center rounded-[6px] bg-white px-4 text-xs font-semibold uppercase tracking-[0.06em] text-black"
        >
          Leitura de pele
        </Link>
        <Link
          href="/kits"
          aria-label="Ver kits recomendados"
          tabIndex={visible ? 0 : -1}
          className="inline-flex min-h-12 w-12 items-center justify-center rounded-[6px] border border-white/18 text-white"
        >
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

function NewsletterSection() {
  return (
    <section className="bg-[#111111] px-4 py-16 sm:px-6 lg:px-8 lg:py-28">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="space-y-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#e8a8b0]">
            Círculo BelaPop
          </p>
          <h2 className="font-headline text-3xl leading-tight tracking-normal text-white sm:text-4xl">
            Drops quinzenais. Acesso exclusivo.
          </h2>
          <p className="text-sm leading-6 text-white/60">
            Skincare coreano curado, com janela de compra de 48h e atendimento direto pelo WhatsApp.{" "}
            <Link href="/circulo" className="font-medium text-white/80 underline underline-offset-4 transition-colors hover:text-white">
              Conheça o Círculo →
            </Link>
          </p>
        </div>
        <CirculoForm tone="dark" source="website_footer_form" />
      </div>
    </section>
  );
}

function LuxuryVideoHero() {
  const [prefersStaticHero, setPrefersStaticHero] = useState(false);
  const reduceMotion = useReducedMotion();
  const heroVideo = seasonalHeroVideos[0];
  const entrance = reduceMotion
    ? { opacity: 1, y: 0 }
    : { opacity: 1, y: 0, transition: { duration: 0.72, ease: [0.22, 1, 0.36, 1] } };
  const entranceStart = reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 };

  useEffect(() => {
    const connection = (
      navigator as Navigator & {
        connection?: {
          effectiveType?: string;
          saveData?: boolean;
        };
      }
    ).connection;

    if (connection?.saveData || connection?.effectiveType === "slow-2g" || connection?.effectiveType === "2g") {
      setPrefersStaticHero(true);
    }
  }, []);

  return (
    <section className="hero flex flex-col overflow-hidden bg-[#090807] text-white lg:block">
      <div className="mx-auto flex w-full max-w-[1580px] flex-col lg:grid lg:min-h-[clamp(520px,66vh,720px)] lg:grid-cols-[minmax(0,0.95fr)_minmax(390px,0.82fr)] lg:items-center lg:gap-7 lg:px-[clamp(40px,5vw,76px)] lg:py-[clamp(34px,4.6vw,64px)]">
        <div className="hero-media relative order-1 flex h-[42svh] min-h-[300px] max-h-[380px] w-full items-center justify-center overflow-hidden bg-[#090807] lg:order-2 lg:block lg:h-[clamp(360px,50vh,560px)] lg:min-h-0 lg:max-h-none lg:translate-x-2 lg:scale-[0.88] lg:opacity-90">
          <Image
            src="/editorial/belapop-skin-scan-hero-mobile-poster.jpg"
            alt=""
            aria-hidden="true"
            fill
            priority
            sizes="(max-width: 1023px) 100vw, 50vw"
            className="object-cover object-center"
          />
          {prefersStaticHero ? (
            <picture className="block h-full w-full">
              <source srcSet={heroVideo.mobilePoster} media="(max-width: 767px)" />
              <img
                src={heroVideo.poster}
                alt="Mulher usando o Skin Scan BelaPop em uma cena editorial de skincare"
                decoding="async"
                fetchPriority="high"
                className="h-full w-full object-cover object-center opacity-90"
              />
            </picture>
          ) : (
            <>
              <video
                aria-label="Mulher usando o Skin Scan BelaPop em uma cena editorial de skincare"
                autoPlay
                className="block h-full w-full object-cover object-center opacity-90 lg:hidden"
                loop
                muted
                playsInline
                poster={heroVideo.mobilePoster}
                preload="none"
              >
                <source src={heroVideo.mobile.webm} type="video/webm" />
                <source src={heroVideo.mobile.mp4} type="video/mp4" />
                <img
                  src={heroVideo.mobilePoster}
                  alt="Preview editorial BelaPop Skin Scan"
                  className="h-auto w-full object-contain"
                />
              </video>
              <video
                aria-label="Mulher usando o Skin Scan BelaPop em uma cena editorial de skincare"
                autoPlay
                className="hidden h-full w-full object-cover object-center opacity-90 lg:block"
                loop
                muted
                playsInline
                poster={heroVideo.poster}
                preload="none"
              >
                <source src={heroVideo.desktop.webm} type="video/webm" />
                <source src={heroVideo.desktop.mp4} type="video/mp4" />
                <img
                  src={heroVideo.poster}
                  alt="Preview editorial BelaPop Skin Scan"
                  className="h-full w-full object-cover object-center"
                />
              </video>
            </>
          )}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.04),rgba(0,0,0,0.18))] lg:bg-[linear-gradient(90deg,rgba(0,0,0,0.30),rgba(0,0,0,0.07)_45%,rgba(0,0,0,0.36))]" />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-[-50px] right-[-50px] z-[1] h-[260px] w-[260px] rounded-full bg-[radial-gradient(circle_at_38%_38%,rgba(193,122,144,0.82)_0%,rgba(193,122,144,0.50)_32%,rgba(213,160,175,0.20)_55%,transparent_70%)] blur-sm animate-bela-pulse md:hidden"
          />
          <motion.div
            initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.44, duration: 0.65, ease: "easeOut" }}
            className="absolute bottom-3 right-3 z-10 block w-28 md:bottom-5 md:right-5 md:w-36 lg:bottom-auto lg:right-5 lg:top-1/2 lg:-translate-y-1/2 xl:w-40"
          >
            <Link
              href="/skin-scan"
              aria-label="Abrir leitura Skin AI"
              className="block border border-white/18 bg-black/28 p-2.5 shadow-2xl backdrop-blur-xl transition-colors duration-300 hover:border-white/36 hover:bg-black/38 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              <div className="mb-2.5 flex items-center justify-between text-[8px] uppercase tracking-[0.08em] text-white/68">
                <span>Skin AI</span>
                <span>Live</span>
              </div>
              <div className="space-y-2">
                {[
                  ["Textura", "86%"],
                  ["Hidratação", "72%"],
                  ["Brilho", "64%"]
                ].map(([label, value]) => (
                  <div key={label}>
                    <div className="mb-1.5 flex items-center justify-between text-[9px] uppercase tracking-[0.06em] text-white/74">
                      <span>{label}</span>
                      <span>{value}</span>
                    </div>
                    <div className="h-px bg-white/18">
                      <div className="h-px bg-[#dac769]" style={{ width: value }} />
                    </div>
                  </div>
                ))}
              </div>
            </Link>
          </motion.div>
        </div>

        <div className="hero-content relative z-10 order-2 flex flex-col px-6 py-6 lg:order-1 lg:block lg:h-auto lg:px-0 lg:py-0">
          <motion.div initial={entranceStart} animate={entrance} className="max-w-[680px]">
            <motion.p
              initial={entranceStart}
              animate={entrance}
              transition={{ delay: 0.12, duration: 0.8, ease: "easeOut" }}
              className="mb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-[#dac769] lg:mb-4"
            >
              Beauty tech curada
            </motion.p>
            <motion.h1
              initial={entranceStart}
              animate={entrance}
              transition={{ delay: 0.2, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="hero-title max-w-[13em] font-headline text-[26px] font-semibold leading-[1.20] tracking-[-0.01em] text-white min-[390px]:text-[28px] lg:max-w-[620px] lg:text-[clamp(2.6rem,3.6vw,4.25rem)] lg:leading-[1] lg:font-bold lg:tracking-normal"
            >
              Skincare coreano curado para a sua pele.
            </motion.h1>
            <motion.p
              initial={entranceStart}
              animate={entrance}
              transition={{ delay: 0.32, duration: 0.8, ease: "easeOut" }}
              className="mt-3 max-w-[21rem] text-sm leading-6 text-white/84 lg:mt-4 lg:max-w-md lg:text-lg lg:leading-7"
            >
              Produtos selecionados com critério. Leitura personalizada incluída. Compre com quem entende de pele.
            </motion.p>
            <motion.div
              initial={entranceStart}
              animate={entrance}
              transition={{ delay: 0.44, duration: 0.8, ease: "easeOut" }}
              className="hero-buttons mt-5 flex flex-col gap-3 lg:mt-5 lg:flex-row"
            >
              <Link
                href="/skin-scan"
                className="hero-cta group inline-flex h-[52px] w-full items-center justify-center rounded bg-white px-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-black shadow-[0_18px_42px_rgba(255,255,255,0.14)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#dac769] hover:shadow-[0_22px_52px_rgba(218,199,105,0.18)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white lg:min-h-14 lg:w-auto lg:min-w-64 lg:rounded-none"
              >
                Descobrir minha rotina
                <Sparkles className="ml-3 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <Link
                href="/catalogo"
                className="inline-flex h-[52px] w-full items-center justify-center rounded border border-white/28 bg-white/[0.07] px-6 text-[11px] font-medium uppercase tracking-[0.16em] text-white/90 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-white hover:bg-white/14 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white lg:min-h-14 lg:w-auto lg:min-w-48 lg:rounded-none"
              >
                Ver produtos
              </Link>
              <Link
                href="/kits"
                className="inline-flex h-[52px] w-full items-center justify-center rounded border border-white/14 bg-transparent px-6 text-[11px] font-medium uppercase tracking-[0.14em] text-white/50 backdrop-blur-md transition-all duration-300 hover:border-white/28 hover:text-white/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white lg:min-h-14 lg:w-auto lg:min-w-48 lg:rounded-none"
              >
                Ver kits
              </Link>
            </motion.div>
            <motion.p
              initial={entranceStart}
              animate={entrance}
              transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
              className="mt-3 rounded border border-white/16 bg-white/[0.08] px-3 py-3 text-[11px] font-normal normal-case tracking-normal text-white/86 backdrop-blur-md lg:mt-4 lg:inline-flex lg:max-w-none lg:px-4"
            >
              {heroSocialProof}
            </motion.p>
            <motion.ul
              initial={entranceStart}
              animate={entrance}
              transition={{ delay: 0.56, duration: 0.8, ease: "easeOut" }}
              className="mt-4 grid gap-2 text-xs font-medium uppercase tracking-[0.04em] text-white/76 lg:mt-5 lg:grid-cols-3 lg:gap-4"
            >
              {heroTrustSignals.map((signal) => (
                <li key={signal} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#dac769]" />
                  <span>{signal}</span>
                </li>
              ))}
            </motion.ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default function BelaPopLuxuryHomepage({
  featuredProducts = []
}: {
  featuredProducts?: HomeProduct[];
}) {
  const productCards = featuredProducts.slice(0, 3).map(toHomeProductCard);
  const primaryProduct = featuredProducts[0] ? toHomeProductCard(featuredProducts[0]) : null;
  const secondaryProduct = featuredProducts[1] ? toHomeProductCard(featuredProducts[1]) : null;

  return (
    <div className="bg-[#fcf9f8] text-[#1c1b1b]" data-belapop-page="home-public">
      <BelaPopValidatedHeader activeSection="loja" />
      <MobileStickyCta />

      <div>
        <LuxuryVideoHero />

        <ConversionBar />

        <TrustMetricsStrip />

        <section className="bg-[#fcf9f8] px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <TrustSignals />
          </div>
        </section>

        <CheckoutConfidenceRail />

        <SkinScanTechnologySection />

        <HomeUniversesSection />

        <SkincareBundleSection mode="home" />

        <section className="overflow-hidden bg-[#f6f3f2] px-4 py-20 sm:px-6 lg:px-8 lg:py-32">
          <div className="mx-auto grid max-w-screen-2xl grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center lg:gap-12">
            <div className="order-2 flex flex-col justify-center space-y-8 lg:order-1 lg:col-span-5 lg:space-y-12">
              <div className="space-y-5">
                <span className="block text-xs font-semibold uppercase tracking-[0.08em] text-[#6c5e06]">
                  Produto em destaque
                </span>
                <h2 className="font-headline text-3xl leading-tight tracking-normal text-[#1c1b1b] sm:text-4xl">
                  {brandSectionNames.home.newCuratorship}
                </h2>
                <div className="h-px w-24 bg-[#6c5e06]" />
              </div>

              <div className="max-w-md space-y-7">
                <p className="font-display text-[13px] font-normal normal-case tracking-[0.01em] text-[#3a3535]">
                  {primaryProduct?.title ?? "Catálogo em atualização"}
                </p>
                <p className="font-headline text-xl italic leading-relaxed text-[#444748] sm:text-2xl">
                  &ldquo;Cada produto disponível na BelaPop passa por avaliação de procedência e
                  formulação.&rdquo;
                </p>
                <p className="text-base leading-relaxed text-[#444748]/90">
                  Trabalhamos com sellers verificados e marcas com distribuição oficial,
                  com validação de procedência e consistência.
                </p>
                <div className="flex flex-col gap-5 pt-2 sm:flex-row sm:items-center sm:gap-8">
                  <Link
                    href={primaryProduct?.href ?? "/catalogo"}
                    className="inline-flex min-h-14 items-center justify-center bg-black px-8 text-xs font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#6c5e06]"
                  >
                    {brandCtas.editorial.seeBelaPopSelection}
                  </Link>
                  {primaryProduct ? (
                    <span className="font-headline text-2xl text-black">{primaryProduct.price}</span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="order-1 relative flex justify-end lg:order-2 lg:col-span-7">
              <div className="relative w-full max-w-2xl overflow-hidden bg-white shadow-2xl">
                {primaryProduct ? (
                  <img
                    src={primaryProduct.image}
                    alt={primaryProduct.title}
                    loading="lazy"
                    decoding="async"
                    className="aspect-[3/4] h-full w-full object-cover transition-transform duration-1000 hover:scale-105"
                  />
                ) : (
                  <div className="flex aspect-[3/4] h-full w-full items-center justify-center bg-[#f6f3f2] p-10 text-center font-headline text-3xl text-[#1c1b1b]/60">
                    BelaPop
                  </div>
                )}
                <div className="pointer-events-none absolute right-[-30px] top-10 hidden rotate-90 xl:block">
                    <span className="whitespace-nowrap text-[64px] font-black uppercase tracking-normal text-black/5">
                    CURADORIA
                  </span>
                </div>
              </div>

              {secondaryProduct ? (
                <div className="absolute -bottom-10 -left-6 hidden h-72 w-56 overflow-hidden border-[18px] border-white bg-[#fcf9f8] shadow-xl xl:block">
                  <img
                    src={secondaryProduct.image}
                    alt={secondaryProduct.title}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="bg-[#fcf9f8] px-4 py-20 sm:px-6 lg:px-8 lg:py-32">
          <div className="mx-auto max-w-7xl">
            <div className="mb-14 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-4">
                <div className="mb-2 flex items-center gap-3">
                  <img src="/logo-dark.svg" alt="BelaPop selo" className="h-8 w-auto rounded-full shadow-sm" />
                  <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6c5e06]">
                    {brandSectionNames.home.careWithSafety}
                  </span>
                </div>
                <span className="text-xs uppercase tracking-[0.06em] text-[#444748]">
                  Decisão guiada
                </span>
                <h3 className="font-headline text-3xl leading-tight text-black sm:text-4xl">{brandSectionNames.home.selectedBrands}</h3>
                <p className="max-w-2xl text-sm leading-relaxed text-[#444748] sm:text-base">
                  Selecionamos produtos com base em critérios técnicos. A venda é realizada por
                  parceiros aprovados dentro da plataforma. Você compra com transparência e
                  acompanhamento.
                </p>
              </div>
              <Link
                href="/skincare"
                className="w-fit border-b border-black pb-1 text-xs font-semibold uppercase tracking-[0.08em] text-black"
              >
                {brandCtas.editorial.seeBelaPopSelection}
              </Link>
            </div>

            {productCards.length > 0 ? (
              <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
                {productCards.map((product) => (
                  <LuxuryProductCard key={product.href} {...product} />
                ))}
              </div>
            ) : (
              <div className="bg-[#f6f3f2] px-6 py-10 text-center">
                <p className="font-headline text-2xl text-black">Catálogo em atualização</p>
                <p className="mt-3 text-sm leading-6 text-[#444748]">
                  Produtos publicados, com estoque e seller ativo aparecerão aqui automaticamente.
                </p>
              </div>
            )}
          </div>
        </section>

        <NewsletterSection />

        <section className="bg-[#f6f3f2] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 flex items-end justify-between gap-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6c5e06]">
                  Diário BelaPop
                </p>
                <h2 className="mt-2 font-headline text-2xl leading-tight text-[#1c1b1b] sm:text-3xl">
                  Guias, ingredientes e skincare sem excesso.
                </h2>
              </div>
              <Link
                href="/diario"
                className="shrink-0 border-b border-black pb-0.5 text-xs font-semibold uppercase tracking-[0.08em] text-black transition-colors hover:text-[#6c5e06]"
              >
                Ver Diário →
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
              {artigos.slice(0, 3).map((artigo) => (
                <Link
                  key={artigo.slug}
                  href={`/diario/${artigo.slug}`}
                  className="group block"
                >
                  {artigo.coverUrl ? (
                    <div className="mb-4 aspect-[16/9] overflow-hidden bg-[#e8e1d8]">
                      <img
                        src={artigo.coverUrl}
                        alt={artigo.title}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  ) : null}
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#6c5e06]">
                    {artigo.tag} · {artigo.readTime} min
                  </p>
                  <h3 className="font-headline text-base leading-snug text-[#1c1b1b] transition-colors group-hover:text-[#6c5e06] sm:text-lg">
                    {artigo.title}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>

      <BelaPopValidatedFooter />
    </div>
  );
}
