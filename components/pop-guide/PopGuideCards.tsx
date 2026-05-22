import Link from "next/link";
import { ArrowRight, BadgeCheck, Sparkles } from "lucide-react";

import {
  getBundleById,
  type IngredientGuide,
  type ProductRecommendation,
  type RoutineStep,
  type WeeklyCurationItem,
  type WorthInvestmentGuide
} from "@/lib/content/popGuide";
import { formatBundleCurrency } from "@/lib/skincare/skincareBundles";

export function ProductRecommendationCard({ product }: { product: ProductRecommendation }) {
  return (
    <article className="min-w-[250px] border border-[#ded8d2] bg-white p-5 shadow-[0_18px_60px_rgba(28,27,27,0.06)] md:min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#6c5e06]">
        {product.role}
      </p>
      <h3 className="mt-3 font-headline text-2xl leading-[0.98] tracking-[-0.035em] text-[#1c1b1b]">
        {product.name}
      </h3>
      <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[#8a8179]">
        {product.brand}
      </p>
      <div className="mt-5 flex items-end justify-between gap-4">
        <p className="font-headline text-2xl text-[#1c1b1b]">
          {formatBundleCurrency(product.price)}
        </p>
        <Link
          href={`/produto/${product.slug}`}
          className="inline-flex min-h-11 items-center justify-center gap-2 border border-[#1c1b1b] px-4 text-[10px] font-bold uppercase tracking-[0.18em] text-[#1c1b1b] transition hover:bg-[#1c1b1b] hover:text-white"
        >
          Ver
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </article>
  );
}

export function BundleRecommendationCard({
  bundleId,
  reason
}: {
  bundleId: string;
  reason?: string;
}) {
  const bundle = getBundleById(bundleId);
  if (!bundle) return null;

  return (
    <article className="border border-[#1c1b1b] bg-[#111111] p-5 text-white shadow-[0_24px_80px_rgba(17,17,17,0.16)]">
      <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-[#d8c46d]">
        Bundle recomendado
      </p>
      <h3 className="mt-3 font-headline text-3xl leading-[0.95] tracking-[-0.04em]">
        {bundle.name}
      </h3>
      <p className="mt-4 text-sm leading-6 text-white/72">{reason ?? bundle.promise}</p>
      <div className="mt-5 grid grid-cols-2 gap-3 border-y border-white/12 py-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/45">
            Separado
          </p>
          <p className="mt-1 text-sm text-white/55 line-through">
            {formatBundleCurrency(bundle.originalPrice)}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/45">
            Kit
          </p>
          <p className="mt-1 font-headline text-2xl">{formatBundleCurrency(bundle.bundlePrice)}</p>
        </div>
      </div>
      <Link
        href={`/kits#${bundle.id}`}
        className="mt-5 inline-flex min-h-[52px] w-full items-center justify-center gap-3 bg-white px-5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#111111]"
      >
        Adicionar kit ao carrinho
        <Sparkles className="h-4 w-4" />
      </Link>
    </article>
  );
}

export function RoutineStepCard({ step }: { step: RoutineStep }) {
  return (
    <li className="flex gap-4 border border-[#ded8d2] bg-white p-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#d6ccc2] text-xs font-bold text-[#6c5e06]">
        {step.order}
      </span>
      <span>
        <span className="block text-[10px] font-bold uppercase tracking-[0.22em] text-[#8a8179]">
          {step.productRole}
        </span>
        <strong className="mt-1 block text-base text-[#1c1b1b]">{step.title}</strong>
        <span className="mt-1 block text-sm leading-6 text-[#5f5a55]">{step.description}</span>
      </span>
    </li>
  );
}

export function IngredientGuideCard({ guide }: { guide: IngredientGuide }) {
  return (
    <Link
      href={`/guias/ativos/${guide.slug}`}
      className="group flex h-full flex-col border border-[#ded8d2] bg-white p-5 transition hover:-translate-y-1 hover:border-[#1c1b1b]"
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#6c5e06]">
        Guia de ativo
      </p>
      <h3 className="mt-4 font-headline text-3xl leading-[0.95] tracking-[-0.04em] text-[#1c1b1b]">
        {guide.name}
      </h3>
      <p className="mt-4 flex-1 text-sm leading-6 text-[#5f5a55]">{guide.summary}</p>
      <span className="mt-5 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#1c1b1b]">
        Ler e comprar melhor
        <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
      </span>
    </Link>
  );
}

export function WeeklyCurationCard({ item }: { item: WeeklyCurationItem }) {
  return (
    <article className="min-w-[280px] border border-[#ded8d2] bg-white p-5 md:min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#6c5e06]">
        {item.label}
      </p>
      <h3 className="mt-4 font-headline text-3xl leading-[0.95] tracking-[-0.04em] text-[#1c1b1b]">
        {item.title}
      </h3>
      <p className="mt-4 text-sm leading-6 text-[#5f5a55]">{item.description}</p>
      <Link
        href={item.href}
        className="mt-5 inline-flex min-h-[48px] items-center justify-center gap-2 border border-[#1c1b1b] px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#1c1b1b] transition hover:bg-[#1c1b1b] hover:text-white"
      >
        {item.cta}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </article>
  );
}

export function WorthInvestmentBlock({ guide }: { guide: WorthInvestmentGuide }) {
  const blocks = [
    ["O que promete", [guide.promise]],
    ["Para quem faz sentido", guide.makesSenseFor],
    ["Quando vale pagar mais", guide.worthPayingMoreWhen],
    ["Quando não vale", guide.notWorthWhen],
    ["Como encaixar na rotina", guide.routineFit]
  ] as const;

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      {blocks.map(([title, items]) => (
        <article key={title} className="border border-[#ded8d2] bg-white p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#6c5e06]">
            {title}
          </p>
          <ul className="mt-4 grid gap-3 text-sm leading-6 text-[#4c4744]">
            {items.map((item) => (
              <li key={item} className="flex gap-3">
                <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#6c5e06]" />
                {item}
              </li>
            ))}
          </ul>
        </article>
      ))}
    </section>
  );
}
