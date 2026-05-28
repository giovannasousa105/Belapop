import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";

import { BundleAddToCartButton } from "@/components/bundles/BundleAddToCartButton";
import {
  formatBundleCurrency,
  type SkinBundle
} from "@/lib/skincare/skincareBundles";

type BundleCardProps = {
  bundle: SkinBundle;
  featured?: boolean;
  compact?: boolean;
};

export function BundleCard({ bundle, featured = false, compact = false }: BundleCardProps) {
  const smartPairingItems = [
    {
      label: "Funciona melhor com",
      value: bundle.products[1]?.name ?? bundle.routineSteps[1] ?? bundle.name
    },
    {
      label: "Passo seguinte da rotina",
      value: bundle.routineSteps[2] ?? bundle.routineSteps[1] ?? "Hidratação"
    },
    {
      label: "Mais usado junto",
      value: bundle.products[2]?.name ?? bundle.products[0]?.name ?? bundle.name
    }
  ];

  return (
    <article
      id={bundle.id}
      data-bundle-card={bundle.id}
      className={`group flex h-full min-w-[82vw] snap-center flex-col overflow-hidden border bg-white shadow-[0_24px_80px_rgba(28,27,27,0.07)] transition-[transform,box-shadow,border-color] duration-500 will-change-transform hover:-translate-y-1 hover:shadow-[0_34px_110px_rgba(28,27,27,0.13)] motion-reduce:transform-none sm:min-w-0 ${
        featured
          ? "border-[#1c1b1b] ring-1 ring-[#1c1b1b]/80"
          : "border-[#ded8d2]"
      }`}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-[#111] sm:aspect-[5/4]">
        <Image
          src={bundle.image}
          alt={bundle.imageAlt}
          fill
          sizes="(max-width: 768px) 82vw, (max-width: 1280px) 50vw, 33vw"
          className="object-cover transition duration-700 group-hover:scale-[1.035]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/74 via-black/18 to-transparent" />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span className="bg-white/92 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#1c1b1b]">
            {bundle.badge}
          </span>
          {bundle.conversionBadge ? (
            <span className="bg-[#111111]/82 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-white backdrop-blur">
              {bundle.conversionBadge}
            </span>
          ) : null}
          {featured ? (
            <span className="bg-[#dac769] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#211b00]">
              Mais recomendado
            </span>
          ) : null}
        </div>
        <div className="absolute inset-x-0 bottom-0 p-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#dac769]">
            {bundle.goalLabel}
          </p>
          <h3 className="mt-2 font-headline text-2xl leading-[1.06] tracking-normal sm:text-3xl">
            {bundle.name}
          </h3>
          <p className="mt-2 text-sm leading-5 text-white/78">{bundle.subtitle}</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-5 py-5">
        <div className="mb-4 border-l-2 border-[#6c5e06] pl-3">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#8a8179]">
            Objetivo da rotina
          </p>
          <p className="mt-1 text-sm font-semibold text-[#1c1b1b]">{bundle.objective}</p>
        </div>
        <p className="text-sm leading-6 text-[#4c4744]">{bundle.description}</p>
        <p className="mt-3 text-xs uppercase tracking-[0.06em] text-[#8a8179]">
          {bundle.benefit}
        </p>

        <div className="mt-5 grid grid-cols-[1fr_auto] gap-4 border-y border-[#ece6e0] py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.06em] text-[#8a8179]">
              {bundle.products.length} itens
            </p>
            <p className="mt-1 text-sm text-[#6f6862] line-through">
              {formatBundleCurrency(bundle.originalPrice)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.06em] text-[#8a8179]">
              Kit
            </p>
            <p className="mt-1 font-headline text-xl text-[#1c1b1b]">
              {formatBundleCurrency(bundle.bundlePrice)}
            </p>
          </div>
          {bundle.savings > 0 ? (
            <div className="col-span-2 flex items-center justify-between gap-2 bg-[#f7f0d3] px-3 py-2">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.06em] text-[#6c5e06]">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Economize {formatBundleCurrency(bundle.savings)}
              </div>
              <span className="rounded bg-[#1D9E75] px-2 py-0.5 text-[10px] font-bold text-white">
                {Math.round((bundle.savings / bundle.originalPrice) * 100)}% off
              </span>
            </div>
          ) : null}
        </div>

        <div className="mt-5 space-y-2 border-b border-[#ece6e0] pb-4 text-sm leading-6 text-[#4c4744]">
          <p>
            <span className="font-semibold text-[#1c1b1b]">Inclui: </span>
            {bundle.routineSteps.slice(0, 4).join(", ")}
          </p>
          <p>
            <span className="font-semibold text-[#1c1b1b]">Contexto de uso: </span>
            {bundle.useMoment.join(" / ")} para pele {bundle.skinTypes.slice(0, 3).join(", ")}
          </p>
        </div>

        <div className="mt-5 grid gap-2 border border-[#efe7df] bg-[#fbf7f3] p-3">
          {smartPairingItems.map((item) => (
            <div key={`${bundle.id}-${item.label}`} className="grid grid-cols-[minmax(0,0.78fr)_minmax(0,1fr)] gap-3 border-b border-[#e8ded5] pb-2 last:border-b-0 last:pb-0">
              <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#8a8179]">
                {item.label}
              </span>
              <span className="text-xs font-semibold leading-5 text-[#1c1b1b]">{item.value}</span>
            </div>
          ))}
        </div>

        {!compact ? (
          <ol className="mt-5 grid gap-2">
            {bundle.products.slice(0, 4).map((product) => (
              <li key={`${bundle.id}-${product.productId}`} className="flex gap-3 text-sm leading-5 text-[#4c4744]">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#d7cec6] text-[10px] font-bold text-[#6c5e06]">
                  {product.step}
                </span>
                <span>
                  <strong className="text-[#1c1b1b]">{product.name}</strong>
                  <span className="block text-xs text-[#7a736d]">{product.benefit}</span>
                </span>
              </li>
            ))}
          </ol>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-2">
          {[...bundle.skinTypes.slice(0, 2), ...bundle.useMoment.slice(0, 1), bundle.priceRange].map((tag) => (
            <span
              key={`${bundle.id}-${tag}`}
              className="border border-[#e5ddd5] px-3 py-1 text-[10px] uppercase tracking-[0.06em] text-[#6f6862]"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-auto grid gap-3 pt-5">
          <BundleAddToCartButton bundle={bundle} label={bundle.cta} />
          <Link
            href={`/kits/${bundle.slug}`}
            className="inline-flex min-h-12 items-center justify-center gap-1.5 border border-black/20 px-5 text-xs font-medium uppercase tracking-[0.08em] text-black/60 transition hover:border-black hover:text-black"
          >
            {bundle.secondaryCta}
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
