/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";

import type { BelaPopUniverse } from "@/lib/discovery/universes";
import type { EditorialProduct } from "@/lib/queries/products";

type UniverseProductRailProps = {
  universe: BelaPopUniverse;
  products: EditorialProduct[];
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);

function ProductTile({
  product,
  universe,
  compact = false
}: {
  product: EditorialProduct;
  universe: BelaPopUniverse;
  compact?: boolean;
}) {
  return (
    <Link
      href={`/produto/${product.slug}`}
      className={`group block shrink-0 snap-center overflow-hidden border border-[#ded8d2] bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_80px_rgba(28,27,27,0.08)] ${
        compact ? "w-[78vw] sm:w-auto" : ""
      }`}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-[#f6f3f2]">
        <img
          src={product.coverImage}
          alt={product.title}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span
            className="bg-white/92 px-3 py-2 text-[9px] font-bold uppercase tracking-[0.18em]"
            style={{ color: universe.theme.ink }}
          >
            {product.badge}
          </span>
        </div>
      </div>
      <div className="p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.20em] text-[#7a736d]">
          {product.brand}
        </p>
        <h3 className="mt-2 font-headline text-2xl leading-tight tracking-normal text-[#1c1b1b]">
          {product.title}
        </h3>
        <p className="mt-3 min-h-[48px] text-sm leading-6 text-[#5f5a55]">
          {product.editorialReason}
        </p>
        <div className="mt-5 flex items-center justify-between gap-4 border-t border-[#ece6e0] pt-4">
          <span className="font-headline text-xl text-[#1c1b1b]">{formatCurrency(product.price)}</span>
          <ArrowUpRight className="h-4 w-4 text-[#6c5e06]" aria-hidden="true" />
        </div>
      </div>
    </Link>
  );
}

export function UniverseProductRail({ universe, products }: UniverseProductRailProps) {
  if (!products.length) return null;

  const spotlight = products.find((product) => product.id === universe.weeklyCuration.productId) ?? products[0];
  const railProducts = products.filter((product) => product.id !== spotlight.id);

  return (
    <section id="produtos" className="bg-[#f6f3f2] px-5 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-9 grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(320px,0.45fr)] lg:items-end">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#6c5e06]">
              Produtos vinculados
            </p>
            <h2 className="mt-4 font-headline text-4xl leading-tight tracking-normal sm:text-5xl">
              Produtos escondidos dentro de uma historia, nao em um grid seco.
            </h2>
          </div>
          <p className="text-sm leading-7 text-[#5f5a55]">{universe.discoveryPrompt}</p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
          <Link
            href={`/produto/${spotlight.slug}`}
            className="group relative min-h-[520px] overflow-hidden bg-[#111111] text-white"
          >
            <img
              src={spotlight.coverImage}
              alt={spotlight.title}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover opacity-88 transition duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.10)_0%,rgba(0,0,0,0.38)_48%,rgba(0,0,0,0.86)_100%)]" />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
              <div className="mb-5 inline-flex items-center gap-2 bg-white/12 px-3 py-2 text-[9px] font-bold uppercase tracking-[0.18em] text-white backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-[#DAC769]" aria-hidden="true" />
                {universe.weeklyCuration.label}
              </div>
              <h3 className="max-w-xl font-headline text-4xl leading-none tracking-normal sm:text-5xl">
                {universe.weeklyCuration.title}
              </h3>
              <p className="mt-4 max-w-lg text-sm leading-7 text-white/78">
                {universe.weeklyCuration.description}
              </p>
              <span className="mt-6 inline-flex min-h-12 items-center gap-3 border border-white/28 px-5 text-[10px] font-bold uppercase tracking-[0.22em] text-white transition group-hover:border-white group-hover:bg-white group-hover:text-black">
                Ver achado
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
          </Link>

          <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-width:none] md:grid md:grid-cols-2 md:overflow-visible md:pb-0 [&::-webkit-scrollbar]:hidden">
            {[spotlight, ...railProducts].slice(0, 4).map((product) => (
              <ProductTile key={product.id} product={product} universe={universe} compact />
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/catalogo"
            className="inline-flex min-h-[52px] items-center justify-center border border-[#1c1b1b] px-6 text-[10px] font-bold uppercase tracking-[0.22em] text-[#1c1b1b] transition hover:bg-[#1c1b1b] hover:text-white"
          >
            Ver catalogo completo
          </Link>
          <span className="text-xs leading-6 text-[#6f6862]">
            Tags: {universe.tags.join(", ")}
          </span>
        </div>
      </div>
    </section>
  );
}
