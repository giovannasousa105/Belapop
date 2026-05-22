/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { BundleAddToCartButton } from "@/components/bundles/BundleAddToCartButton";
import type { BelaPopUniverse } from "@/lib/discovery/universes";
import { formatBundleCurrency, type SkinBundle } from "@/lib/skincare/skincareBundles";

type UniverseBundleRailProps = {
  universe: BelaPopUniverse;
  bundles: SkinBundle[];
};

export function UniverseBundleRail({ universe, bundles }: UniverseBundleRailProps) {
  if (!bundles.length) return null;

  return (
    <section id="kits" className="bg-[#fcf9f8] px-5 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-9 grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(320px,0.45fr)] lg:items-end">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#6c5e06]">
              Bundles vinculados
            </p>
            <h2 className="mt-4 font-headline text-4xl leading-tight tracking-normal sm:text-5xl">
              Kits que transformam desejo em rotina compravel.
            </h2>
          </div>
          <p className="text-sm leading-7 text-[#5f5a55]">
            Cada kit aparece como uma decisao pronta: produto, ordem de uso, economia e proxima acao.
          </p>
        </div>

        <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-3 [scrollbar-width:none] md:grid md:grid-cols-2 md:overflow-visible xl:grid-cols-3 [&::-webkit-scrollbar]:hidden">
          {bundles.map((bundle, index) => (
            <article
              key={bundle.id}
              id={bundle.id}
              className="group flex min-w-[82vw] snap-center flex-col overflow-hidden border border-[#ded8d2] bg-white shadow-[0_24px_80px_rgba(28,27,27,0.07)] transition duration-300 hover:-translate-y-1 sm:min-w-0"
            >
              <div className="relative aspect-[5/4] overflow-hidden bg-[#111111]">
                <img
                  src={bundle.image}
                  alt={bundle.imageAlt}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover opacity-92 transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/18 to-transparent" />
                <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                  <span className="bg-white/92 px-3 py-2 text-[9px] font-bold uppercase tracking-[0.18em] text-[#1c1b1b]">
                    {bundle.badge}
                  </span>
                  {index === 0 ? (
                    <span
                      className="px-3 py-2 text-[9px] font-bold uppercase tracking-[0.18em]"
                      style={{ backgroundColor: universe.theme.accentSoft, color: universe.theme.ink }}
                    >
                      Comece por aqui
                    </span>
                  ) : null}
                </div>
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#DAC769]">
                    {bundle.goalLabel}
                  </p>
                  <h3 className="mt-2 font-headline text-3xl leading-none tracking-normal">
                    {bundle.name}
                  </h3>
                  <p className="mt-2 text-sm leading-5 text-white/78">{bundle.subtitle}</p>
                </div>
              </div>

              <div className="flex flex-1 flex-col p-5">
                <p className="text-sm leading-6 text-[#4c4744]">{bundle.description}</p>
                <div className="mt-5 grid grid-cols-[1fr_auto] gap-4 border-y border-[#ece6e0] py-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.20em] text-[#8a8179]">
                      Separado
                    </p>
                    <p className="mt-1 text-sm text-[#6f6862] line-through">
                      {formatBundleCurrency(bundle.originalPrice)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-[0.20em] text-[#8a8179]">Kit</p>
                    <p className="mt-1 font-headline text-2xl text-[#1c1b1b]">
                      {formatBundleCurrency(bundle.bundlePrice)}
                    </p>
                  </div>
                </div>
                <ol className="mt-5 grid gap-2">
                  {bundle.products.slice(0, 3).map((product) => (
                    <li key={`${bundle.id}-${product.productId}`} className="flex gap-3 text-sm leading-5 text-[#4c4744]">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center border border-[#d7cec6] text-[10px] font-bold text-[#6c5e06]">
                        {product.step}
                      </span>
                      <span>
                        <strong className="text-[#1c1b1b]">{product.name}</strong>
                        <span className="block text-xs text-[#7a736d]">{product.benefit}</span>
                      </span>
                    </li>
                  ))}
                </ol>
                <div className="mt-auto grid gap-3 pt-5">
                  <BundleAddToCartButton bundle={bundle} label="Adicionar kit ao carrinho" />
                  <Link
                    href={`/kits/${bundle.slug}`}
                    className="inline-flex min-h-12 items-center justify-center gap-2 border border-[#1c1b1b] px-5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#1c1b1b] transition hover:bg-[#1c1b1b] hover:text-white"
                  >
                    Ver detalhes do kit
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
