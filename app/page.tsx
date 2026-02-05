"use client";

import Link from "next/link";
import { useEffect } from "react";

import { BannerPanel } from "@/components/BannerPanel";
import HeroEditorialBlack from "@/components/HeroEditorialBlack";
import HeroLuxuryPanels from "@/components/HeroLuxuryPanels";
import LuxuryTilesCarousel from "@/components/LuxuryTilesCarousel";
import { EssentialsCarousel } from "@/components/EssentialsCarousel";
import { LuxuryButton } from "@/components/LuxuryButton";
import { NewsletterForm } from "@/components/NewsletterForm";
import { ProductCard } from "@/components/ProductCard";
import { ProductFrame } from "@/components/ProductFrame";
import { QuoteBlock } from "@/components/QuoteBlock";
import { SectionFrame } from "@/components/SectionFrame";
import { trackEvent } from "@/lib/analytics/tracker";
import { usePublishedDiaryPosts } from "@/lib/hooks/useDiaryPosts";
import { usePublishedProducts } from "@/lib/hooks/useStoredProducts";
import { Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

const pickByCategory = (items: Product[], category: string) =>
  items.filter((product) => product.category === category);

const editorialHighlights = [
  {
    title: "Frete cuidadoso",
    text: "Embalagens e envios pensados para manter o ritual de beleza intacto."
  },
  {
    title: "Assinatura editorial",
    text: "Produtos escolhidos diariamente pela equipe BelaPop."
  },
  {
    title: "Consultoria concierge",
    text: "Consultoras disponíveis para montar presentes e rotinas."
  }
];

const gridClasses =
  "grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4";

const editorialBanner = {
  detail: "Editorial BelaPop",
  title: "Curadoria Editorial",
  description:
    "Seleções cruzadas com textura refinada e presença em cada detalhe da sua rotina.",
  cta: {
    label: "Ver curadoria",
    href: "/catalogo",
    variant: "secondary" as const
  }
};

const diaryBanner = {
  detail: "Diário BelaPop",
  title: "Diário BelaPop",
  description:
    "Histórias, rotina e autocuidado com olhar clínico e estética refinada.",
  cta: {
    label: "Ler o diário",
    href: "/diario",
    variant: "primary" as const
  }
};

const specialBanner = {
  detail: "Curadoria BelaPop",
  title: "Rotina BelaPop",
  description:
    "Rituais essenciais para acompanhar dias intensos com leveza e sofisticação.",
  cta: {
    label: "Explorar a seleção",
    href: "/catalogo",
    variant: "secondary" as const
  }
};

export default function HomePage() {
  const { products } = usePublishedProducts();
  const { posts } = usePublishedDiaryPosts();

  useEffect(() => {
    void trackEvent({ type: "view_home" });
  }, []);

  const curadoriaSemana = products.slice(0, 8);
  const ofertasDestaques = [...products].reverse().slice(0, 8);
  const favoritosGigi = products.slice(2, 8);
  const viralTikTok = products.filter((_, index) => index % 2 === 0).slice(0, 6);
  const skincarePremium = pickByCategory(products, "Skincare").slice(0, 6);
  const essenciais = pickByCategory(products, "Bem-estar").slice(0, 8);
  const destaqueSemana = curadoriaSemana.slice(0, 3);

  const diaryCards = posts.length
    ? posts.slice(0, 3)
    : [
        {
          id: "mock-1",
          title: "O ritual da noite elegante",
          category: "Diário BelaPop",
          slug: "ritual-noite",
          excerpt:
            "Texturas cremosas e velas aromáticas para fechar o dia com intenção."
        },
        {
          id: "mock-2",
          title: "Skincare minimalista e eficaz",
          category: "Diário BelaPop",
          slug: "skincare-minimalista",
          excerpt:
            "O novo básico para peles sensíveis: ingredientes ativos e glow suave."
        },
        {
          id: "mock-3",
          title: "Perfumes que contam histórias",
          category: "Diário BelaPop",
          slug: "perfumaria-historias",
          excerpt:
            "Notas florais e madeiras nobres para marcar presença feminina moderna."
        }
      ];

  return (
    <div className="min-h-screen bg-white text-noir-950">
      <HeroEditorialBlack />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-4">
        <LuxuryTilesCarousel />
        <HeroLuxuryPanels />

        {/* Destaques da semana - 3 produtos em slides escuros */}
        {destaqueSemana.length > 0 && (
          <SectionFrame className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.35em] text-noir-500">Curadoria BelaPop</p>
                <h2 className="font-display text-3xl text-noir-950">Destaques da Semana</h2>
                <p className="text-sm text-noir-600">Três escolhas para inspirar seus rituais nos próximos dias.</p>
              </div>
            </div>
            <div className="relative overflow-hidden">
              <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
                {destaqueSemana.map((product) => (
                  <div
                    key={product.id}
                    className="snap-center min-w-[260px] md:min-w-[320px] rounded-3xl bg-gradient-to-br from-[#0b0b10] via-[#141016] to-[#b80f5a] border border-pink-500/25 shadow-[0_20px_50px_rgba(184,15,90,0.18)] p-6 text-white"
                  >
                    <p className="text-[11px] uppercase tracking-[0.3em] text-white/70">Campanha Editorial</p>
                    <h3 className="mt-3 font-display text-2xl leading-tight">{product.name}</h3>
                    <p className="mt-2 text-sm text-white/80 line-clamp-3">
                      {product.description ?? "Produto selecionado pela curadoria para performance e presença."}
                    </p>
                    <div className="mt-4 text-lg font-semibold">{formatPrice(product.price)}</div>
                    <div className="mt-4">
                      <LuxuryButton tone="retail" variant="secondary" href={`/produto/${product.id}`} className="border-white/50 text-white">
                        Ver produto
                      </LuxuryButton>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SectionFrame>
        )}

        {/* CTA móvel fixo para compra rápida */}
        <div className="md:hidden fixed bottom-4 left-4 right-4 z-40">
          <LuxuryButton
            href="/catalogo"
            tone="retail"
            className="w-full rounded-full text-[12px] uppercase tracking-[0.25em] shadow-lg"
          >
            Ver ofertas e comprar agora
          </LuxuryButton>
        </div>

        <SectionFrame className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.4em] text-noir-500">
                Curadoria BelaPop
              </p>
              <h2 className="font-display text-3xl text-noir-950">Curadoria da Semana</h2>
              <p className="text-sm text-noir-600">
                Seleção de alta performance para rotina, pele e presença.
              </p>
            </div>
            <Link
              href="/catalogo"
              className="text-xs uppercase tracking-[0.3em] text-noir-600 hover:text-noir-900"
            >
              Ver tudo
            </Link>
          </div>
          <div className={gridClasses}>
            {curadoriaSemana.map((product) => (
              <ProductFrame key={product.id}>
                <ProductCard product={product} tone="light" />
              </ProductFrame>
            ))}
          </div>
        </SectionFrame>

        <SectionFrame className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.4em] text-noir-500">
                Curadoria BelaPop
              </p>
              <h2 className="font-display text-3xl text-noir-950">Ofertas & Destaques</h2>
              <p className="text-sm text-noir-600">
                Favoritos com condições especiais — sem perder a elegância.
              </p>
            </div>
            <Link
              href="/catalogo"
              className="text-xs uppercase tracking-[0.3em] text-noir-600 hover:text-noir-900"
            >
              Ver tudo
            </Link>
          </div>
          <div className={gridClasses}>
            {ofertasDestaques.map((product) => (
              <ProductFrame key={product.id}>
                <ProductCard product={product} tone="light" />
              </ProductFrame>
            ))}
          </div>
        </SectionFrame>

        <SectionFrame>
          <BannerPanel {...editorialBanner} />
        </SectionFrame>

        {/* Vitrines de luxo inspiradas em Dior / Sephora */}
        {false && (
        <SectionFrame className="grid gap-4 sm:grid-cols-2">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-black via-noir-800 to-[#B80F5A] px-8 py-10 shadow-xl">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
            <div className="space-y-3 text-white">
              <p className="text-[11px] uppercase tracking-[0.35em] text-white/80">Edição Couture</p>
              <h3 className="font-display text-3xl leading-tight">Luxo Parisiense</h3>
              <p className="text-sm text-white/80">
                Paletas, fragrâncias e skincare com acabamento de alta costura para rituais noturnos.
              </p>
              <LuxuryButton tone="retail" variant="secondary" href="/catalogo" className="border-white/40 text-white">
                Ver curadoria
              </LuxuryButton>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white via-[#f7e8ee] to-[#fde3f0] px-8 py-10 shadow-xl">
            <div className="absolute -left-16 -bottom-8 h-40 w-40 rounded-full bg-[#B80F5A]/15 blur-3xl" />
            <div className="space-y-3 text-noir-900">
              <p className="text-[11px] uppercase tracking-[0.35em] text-noir-600">Boutique Glow</p>
              <h3 className="font-display text-3xl leading-tight">Sephora-Style Picks</h3>
              <p className="text-sm text-noir-700">
                Kits assinatura, miniaturas desejo e lançamentos com seleção de concierge BelaPop.
              </p>
              <LuxuryButton tone="retail" variant="primary" href="/catalogo">
                Comprar agora
              </LuxuryButton>
            </div>
          </div>
        </SectionFrame>
        )}

        <SectionFrame>
          <BannerPanel {...diaryBanner} />
        </SectionFrame>

        <SectionFrame>
          <EssentialsCarousel
            title="Essenciais para noites restauradoras"
            subtitle="Texturas, aromas e rituais para desacelerar."
            products={essenciais}
            tone="light"
          />
        </SectionFrame>

        <SectionFrame className="space-y-6">
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-[0.35em] text-noir-500">
              Diário BelaPop
            </p>
            <h2 className="font-display text-3xl text-noir-950">Diário BelaPop</h2>
            <p className="text-sm text-noir-600 text-center">
              Histórias, rotina e autocuidado com olhar clínico e estética refinada.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {diaryCards.map((post) => (
              <Link
                key={post.id}
                href={`/diario/${post.slug}`}
                className="flex h-full flex-col gap-3 rounded-2xl border border-white/10 bg-noir-950 p-5 text-sm text-blush-50 shadow-lg shadow-black/20"
              >
                <p className="text-[10px] uppercase tracking-[0.4em] text-blush-200">
                  {post.category}
                </p>
                <h3 className="text-lg font-semibold text-blush-50">{post.title}</h3>
                <p className="text-sm text-blush-200">{post.excerpt}</p>
                <span className="mt-auto text-xs uppercase tracking-[0.3em] text-[#B80F5A]">
                  Ler o Diário
                </span>
              </Link>
            ))}
          </div>
        </SectionFrame>

        <SectionFrame>
          <BannerPanel {...specialBanner} />
        </SectionFrame>

        <SectionFrame className="space-y-6">
          <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-3xl border border-white/40 bg-white p-8">
              <QuoteBlock quote="Autocuidado é elegância em forma de rotina." tone="light" />
            </div>
            <div className="rounded-3xl border border-white/40 bg-white p-8">
              <NewsletterForm tone="light" />
            </div>
          </div>
        </SectionFrame>

        <SectionFrame>
          <div className="grid gap-4 rounded-2xl">
            <h2 className="font-display text-3xl text-noir-950">Demo BelaPop Marketplace</h2>
            <p className="text-sm text-noir-600">
              Esta interface conecta o site editorial à API FastAPI/Postgres com carrinho
              multi-lojista e envios separados.
            </p>
            <div className="flex flex-wrap gap-3">
              <LuxuryButton variant="primary" href="/belapop" tone="retail">
                Acessar painel BelaPop
              </LuxuryButton>
              <LuxuryButton variant="secondary" href="/lojistas" tone="retail">
                Quero vender
              </LuxuryButton>
            </div>
          </div>
        </SectionFrame>

        <SectionFrame className="space-y-4">
          <div className="grid gap-6 md:grid-cols-3">
            {editorialHighlights.map((item) => (
              <div key={item.title} className="rounded-2xl border border-[#F6D6E2] bg-white p-6 text-sm text-noir-600 shadow-sm">
                <p className="text-[10px] uppercase tracking-[0.4em] text-noir-500">{item.title}</p>
                <p className="mt-3 text-base text-noir-900">{item.text}</p>
              </div>
            ))}
          </div>
        </SectionFrame>

      </main>
    </div>
  );
}
