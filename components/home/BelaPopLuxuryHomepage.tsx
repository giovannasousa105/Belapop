"use client";

/* eslint-disable @next/next/no-img-element */

import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, BadgeCheck, Check, CreditCard, PackageCheck, ShieldCheck, Sparkles, Truck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { BelaPopValidatedHeader } from "@/components/luxury/BelaPopValidatedHeader";
import { BelaPopValidatedFooter } from "@/components/luxury/BelaPopValidatedFooter";
import { HomeUniversesSection } from "@/components/home/HomeUniversesSection";
import { SkincareBundleSection } from "@/components/skincare/SkincareBundleSection";
import { CirculoForm } from "@/components/circulo/CirculoForm";

import { TrustSignals } from "@/components/legal/TrustSignals";
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
    title: product.title
  };
}


function LuxuryProductCard({
  brand,
  href,
  title,
  price,
  image
}: {
  brand: string;
  href: string;
  title: string;
  price: string;
  image: string;
}) {
  return (
    <article className="group transition duration-300 hover:-translate-y-1">
      <Link
        href={href}
        className="mb-6 block aspect-[3/4] overflow-hidden bg-[#f6f3f2] shadow-[0_18px_70px_rgba(28,27,27,0.06)] transition duration-300 group-hover:shadow-[0_28px_90px_rgba(28,27,27,0.12)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1c1b1b]"
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
      <h4 className="mb-2 font-body text-xs font-semibold uppercase tracking-[0.08em] text-black">
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
  "Faça seu diagnóstico BelaPop",
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

const heroSocialProof = "\u2605\u2605\u2605\u2605\u2605 4.9/5 \u2022 +12 mil rotinas montadas \u2022 Produtos coreanos originais";

const trustMetrics = [
  { label: "Rating médio", value: "4.9/5" },
  { label: "Rotinas montadas", value: "+12 mil" },
  { label: "Importação oficial", value: "Produtos originais" },
  { label: "Compra segura", value: "Suporte humano" }
] as const;

type BeforeAfterCase = {
  quote: string;
  detail: string;
  skin: string;
  routine: string;
  time: string;
  before: string;
  after: string;
  beforeImg: string;
  afterImg: string;
};

const realRoutineCards: BeforeAfterCase[] = [
  {
    quote: "Minha pele ficou mais uniforme em 14 dias",
    detail: "Rotina curta, com ordem clara e sem excesso de passos.",
    skin: "Mista e opaca",
    routine: "Kit Glow + rotina noturna",
    time: "14 dias",
    before: "Textura irregular",
    after: "Glow mais uniforme",
    beforeImg: "/hero-bela.jpg",
    afterImg: "/hero-bela-pop-editorial.jpg"
  },
  {
    quote: "Finalmente entendi o que comprar",
    detail: "A curadoria reduziu a indecisão entre produto solto e kit.",
    skin: "Oleosa e acneica",
    routine: "Acne Care essencial",
    time: "21 dias",
    before: "Brilho intenso",
    after: "Rotina mais equilibrada",
    beforeImg: "/editorial/login-hero-original.jpg",
    afterImg: "/editorial/belapop-skin-scan-hero-poster.jpg"
  },
  {
    quote: "A rotina veio pronta, sem confusão",
    detail: "Manhã, noite e objetivo de uso ficaram visíveis antes da compra.",
    skin: "Sensível",
    routine: "Barrier Repair",
    time: "10 dias",
    before: "Pele repuxando",
    after: "Conforto contínuo",
    beforeImg: "/editorial/belapop-skin-scan-hero-mobile-poster.jpg",
    afterImg: "/editorial/home-ai-card.jpg"
  }
];

const skinScanMetrics = [
  { label: "Textura", value: 86, detail: "leitura visual" },
  { label: "Hidratação", value: 72, detail: "sinal de conforto" },
  { label: "Brilho", value: 64, detail: "equilibrio do dia" }
] as const;

const completeRoutineSteps = [
  {
    step: "01",
    title: "Limpeza",
    detail: "Prepara sem remover conforto.",
    cue: "Funciona melhor com toner calmante",
    href: "/catalogo?categoria=limpeza"
  },
  {
    step: "02",
    title: "Toner",
    detail: "Deixa a pele receptiva ao tratamento.",
    cue: "Passo seguinte da rotina",
    href: "/catalogo?tag=toner"
  },
  {
    step: "03",
    title: "Serum",
    detail: "Concentra o objetivo principal.",
    cue: "Mais usado junto com hidratante",
    href: "/catalogo?tag=serum"
  },
  {
    step: "04",
    title: "Creme",
    detail: "Sela barreira e reduz abandono.",
    cue: "Combine com SPF pela manhã",
    href: "/catalogo?tag=hidratante"
  },
  {
    step: "05",
    title: "SPF",
    detail: "Finaliza a rotina inteligente.",
    cue: "Compra protegida para uso diário",
    href: "/catalogo?tag=spf"
  }
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
      {"Frete gr\u00e1tis acima de R$299 hoje \u2022 Kits selecionados com estoque limitado \u2022 Curadorias atualizadas semanalmente"}
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
              Seu diagnóstico começa aqui.
            </h2>
            <div className="max-w-2xl space-y-3 text-sm leading-7 text-white/72 sm:text-base">
              <p>Entenda sua pele em segundos.</p>
              <p>Uma nova geracao de curadoria personalizada.</p>
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
            Fazer diagnóstico BelaPop
            <Sparkles className="h-4 w-4 transition duration-300 group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </div>

        <div className="relative mx-auto w-full max-w-xl">
          <div className="absolute -inset-8 bg-[radial-gradient(circle_at_center,rgba(218,199,105,0.16),transparent_64%)] blur-2xl" aria-hidden="true" />
          <div className="relative overflow-hidden border border-white/14 bg-white/[0.05] p-3 shadow-[0_36px_120px_rgba(0,0,0,0.36)] backdrop-blur-2xl">
            <div className="relative aspect-[4/5] overflow-hidden bg-[#151312]">
              <img
                src="/editorial/home-ai-card.jpg"
                alt="Interface elegante de diagnóstico visual de pele BelaPop"
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

function CompleteRoutineSection() {
  return (
    <section className="bg-[#f6f3f2] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.82fr)_minmax(360px,0.5fr)] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6c5e06]">
              Rotina completa BelaPop
            </p>
            <h2 className="mt-4 max-w-3xl font-headline text-3xl leading-[1.12] tracking-normal text-[#1c1b1b] sm:text-4xl">
              Compra inteligente: cada passo aumenta o valor da rotina.
            </h2>
          </div>
          <p className="text-sm leading-7 text-[#5f5a55] sm:text-base">
            Em vez de empurrar produtos soltos, a BelaPop mostra o que funciona melhor junto, qual é o próximo passo e quando o kit economiza.
          </p>
        </div>

        <div className="mt-10 grid gap-3 lg:grid-cols-5">
          {completeRoutineSteps.map((item) => (
            <Link
              key={item.step}
              href={item.href}
              className="group min-h-[230px] border border-[#ded6ce] bg-white/82 p-5 shadow-[0_18px_70px_rgba(28,27,27,0.05)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-[#c4b39f] hover:shadow-[0_26px_90px_rgba(28,27,27,0.10)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1c1b1b]"
            >
              <div className="flex items-center justify-between gap-4">
                <span className="font-headline text-3xl text-[#1c1b1b]/18">{item.step}</span>
                <ArrowUpRight className="h-4 w-4 text-[#6c5e06] transition duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" aria-hidden="true" />
              </div>
              <h3 className="mt-8 font-headline text-2xl leading-tight text-[#1c1b1b]">{item.title}</h3>
              <p className="mt-4 text-sm leading-6 text-[#5f5a55]">{item.detail}</p>
              <p className="mt-5 border-t border-[#e9e0d8] pt-4 text-xs font-semibold uppercase tracking-[0.06em] text-[#6c5e06]">
                {item.cue}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function RealRoutinesSection() {
  return (
    <section className="bg-[#111111] px-4 py-16 text-white sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-9 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#dac769]">
            Resultados reais
          </p>
          <h2 className="mt-4 font-headline text-3xl leading-[1.12] tracking-normal sm:text-4xl">
            Antes e depois editorial, com contexto de pele e rotina.
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {realRoutineCards.map((card) => (
            <article
              key={card.quote}
              className="group overflow-hidden border border-white/12 bg-white/[0.04] shadow-[0_28px_100px_rgba(0,0,0,0.22)] backdrop-blur transition duration-500 hover:-translate-y-1 hover:border-white/24"
            >
              <div className="grid grid-cols-2 border-b border-white/10">
                <div className="relative min-h-[190px] overflow-hidden bg-[#1b1816]">
                  <img
                    src={card.beforeImg}
                    alt={`Antes da rotina: ${card.before}`}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover opacity-56 grayscale transition duration-700 group-hover:scale-105"
                  />
                  <span className="absolute left-3 top-3 bg-black/42 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/78 backdrop-blur">
                    Antes
                  </span>
                  <p className="absolute bottom-3 left-3 right-3 text-xs leading-5 text-white/76">{card.before}</p>
                </div>
                <div className="relative min-h-[190px] overflow-hidden bg-[#201b13]">
                  <img
                    src={card.afterImg}
                    alt={`Depois da rotina: ${card.after}`}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover opacity-82 transition duration-700 group-hover:scale-105"
                  />
                  <span className="absolute left-3 top-3 bg-[#dac769] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#211b00]">
                    Depois
                  </span>
                  <p className="absolute bottom-3 left-3 right-3 text-xs leading-5 text-white">{card.after}</p>
                </div>
              </div>
              <div className="p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[#dac769]">
                  {"\u2605\u2605\u2605\u2605\u2605"}
                </p>
                <h3 className="mt-4 font-headline text-2xl leading-tight text-white">{card.quote}</h3>
                <p className="mt-4 text-sm leading-6 text-white/70">{card.detail}</p>
                <div className="mt-5 grid gap-2 border-t border-white/12 pt-4 text-xs leading-5 text-white/64">
                  <p><span className="text-white/92">Tipo de pele:</span> {card.skin}</p>
                  <p><span className="text-white/92">Rotina utilizada:</span> {card.routine}</p>
                  <p><span className="text-white/92">Tempo:</span> {card.time}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function CheckoutConfidenceRail() {
  return (
    <section className="bg-[#fcf9f8] px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl border border-[#ded8d2] bg-white/78 p-5 shadow-[0_24px_90px_rgba(28,27,27,0.05)] backdrop-blur lg:p-7">
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
          Diagnóstico
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
    <section className="bg-[#fcf9f8] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-2xl">
        <CirculoForm tone="light" source="website_footer_form" />
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
        <div className="hero-media relative order-1 flex h-[42svh] min-h-[300px] max-h-[380px] w-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_center,#0a0a0a_0%,#000_100%)] lg:order-2 lg:block lg:h-[clamp(360px,50vh,560px)] lg:min-h-0 lg:max-h-none lg:translate-x-2 lg:scale-[0.88] lg:bg-[#111] lg:opacity-90">
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
          <motion.div
            aria-hidden="true"
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ delay: 0.44, duration: 0.65, ease: "easeOut" }}
            className="pointer-events-none absolute bottom-5 right-5 hidden w-36 border border-white/18 bg-black/28 p-2.5 shadow-2xl backdrop-blur-xl md:block lg:bottom-auto lg:right-5 lg:top-1/2 lg:-translate-y-1/2 xl:w-40"
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
          </motion.div>
        </div>

        <div className="hero-content relative z-10 order-2 flex flex-col px-6 py-6 lg:order-1 lg:block lg:h-auto lg:px-0 lg:py-0">
          <motion.div initial={entranceStart} animate={entrance} className="max-w-[680px]">
            <motion.p
              initial={entranceStart}
              animate={entrance}
              transition={{ delay: 0.12, duration: 0.8, ease: "easeOut" }}
              className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-[#dac769] lg:mb-4"
            >
              Beauty tech curada
            </motion.p>
            <motion.h1
              initial={entranceStart}
              animate={entrance}
              transition={{ delay: 0.2, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="hero-title max-w-[13em] font-headline text-[27px] font-bold leading-[1.16] tracking-normal text-white min-[390px]:text-[29px] lg:max-w-[620px] lg:text-[clamp(2.6rem,3.6vw,4.25rem)] lg:leading-[1]"
            >
              Seu skincare começa por um diagnóstico.
            </motion.h1>
            <motion.p
              initial={entranceStart}
              animate={entrance}
              transition={{ delay: 0.32, duration: 0.8, ease: "easeOut" }}
              className="mt-3 max-w-[21rem] text-sm leading-6 text-white/84 lg:mt-4 lg:max-w-md lg:text-lg lg:leading-7"
            >
              Faça seu diagnóstico BelaPop e descubra a rotina certa para sua pele.
            </motion.p>
            <motion.div
              initial={entranceStart}
              animate={entrance}
              transition={{ delay: 0.44, duration: 0.8, ease: "easeOut" }}
              className="hero-buttons mt-5 flex flex-col gap-3 lg:mt-5 lg:flex-row"
            >
              <Link
                href="/skin-scan"
                className="hero-cta group inline-flex h-[52px] w-full items-center justify-center rounded bg-white px-6 text-xs font-semibold uppercase tracking-[0.08em] text-black shadow-[0_18px_42px_rgba(255,255,255,0.14)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#dac769] hover:shadow-[0_22px_52px_rgba(218,199,105,0.18)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white lg:min-h-14 lg:w-auto lg:min-w-64 lg:rounded-none"
              >
                Descobrir minha rotina
                <Sparkles className="ml-3 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <Link
                href="/kits"
                className="inline-flex h-[52px] w-full items-center justify-center rounded border border-white/28 bg-white/[0.07] px-6 text-xs font-semibold uppercase tracking-[0.08em] text-white backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-white hover:bg-white/14 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white lg:min-h-14 lg:w-auto lg:min-w-64 lg:rounded-none"
              >
                Ver kits recomendados
              </Link>
            </motion.div>
            <motion.p
              initial={entranceStart}
              animate={entrance}
              transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
              className="mt-3 rounded border border-white/16 bg-white/[0.08] px-3 py-3 text-xs font-medium uppercase tracking-[0.04em] text-white/86 backdrop-blur-md lg:mt-4 lg:inline-flex lg:max-w-none lg:px-4"
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

        <SkinScanTechnologySection />

        <HomeUniversesSection />

        <CompleteRoutineSection />

        <SkincareBundleSection mode="home" />

        <RealRoutinesSection />

        <section className="bg-[#111111] px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#dac769]">
              Skin Scan BelaPop
            </p>
            <h2 className="mt-4 font-headline text-3xl leading-tight tracking-normal text-white sm:text-4xl">
              Descubra sua rotina em 45 segundos
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/70 sm:text-base">
              Três perguntas. Uma direção clara. Sem criar conta.
            </p>
            <Link
              href="/skin-scan/foco"
              className="mt-8 inline-flex min-h-14 items-center justify-center gap-3 bg-white px-8 text-xs font-semibold uppercase tracking-[0.08em] text-black shadow-[0_20px_70px_rgba(255,255,255,0.08)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#dac769] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              Começar agora
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>

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
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#444748]">
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

        <section className="bg-[#f6f3f2] px-4 py-20 sm:px-6 lg:px-8 lg:py-32">
          <div className="mx-auto max-w-7xl">
            <h3 className="mb-14 text-center font-headline text-3xl leading-tight text-black sm:text-4xl">
              Menos excesso. Mais precisão.
            </h3>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
              <article className="bg-white p-6 sm:p-8 lg:col-span-7 lg:p-12">
                <div className="flex h-full flex-col justify-between gap-8">
                  <div>
                    <span className="mb-6 block text-xs font-semibold uppercase tracking-[0.08em] text-[#6c5e06]">
                      Posicionamento
                    </span>
                    <h4 className="font-headline text-2xl leading-tight text-black sm:text-3xl">
                      Skincare não deve depender de tentativa.
                    </h4>
                    <p className="mt-8 text-base leading-relaxed text-[#444748]">
                      <span className="block">
                        Acreditamos que skincare não deve ser confuso, nem baseado em tentativa.
                      </span>
                      <span className="mt-4 block">
                        Cuidar da pele e entender, ajustar e manter.
                      </span>
                    </p>
                  </div>

                  <img
                    src="/editorial/essencia-sensorial.svg"
                    alt="Close de formulação em detalhe"
                    loading="lazy"
                    decoding="async"
                    className="h-72 w-full object-cover grayscale sm:h-80"
                  />
                </div>
              </article>

              <div className="flex flex-col gap-8 lg:col-span-5">
                <article className="flex-1 bg-black p-8 text-white sm:p-10">
                  <h4 className="font-headline text-2xl leading-tight sm:text-3xl">
                    Cuidar da pele e entender, ajustar e manter.
                  </h4>
                  <Link
                    href="/skin-scan"
                    className="mt-8 inline-flex border-b border-white pb-1 text-xs font-semibold uppercase tracking-[0.08em]"
                  >
                    Entender minha pele
                  </Link>
                </article>

                <Link href="/skin-scan" className="group relative block min-h-[320px] overflow-hidden">
                  <img
                    src="/editorial/presenca-diurna.svg"
                    alt="Pele em close com luz suave"
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/40" />
                  <div className="absolute inset-0 flex items-center justify-center p-8">
                    <h4 className="text-center font-headline text-2xl text-white">
                      Uma interface de decisão em skincare.
                    </h4>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#fcf9f8] px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <TrustSignals />
          </div>
        </section>

        <CheckoutConfidenceRail />

        <NewsletterSection />
      </div>

      <BelaPopValidatedFooter />
    </div>
  );
}
