"use client";

import Link from "next/link";

import { BundleCard } from "@/components/bundles/BundleCard";
import { skincareBundles } from "@/lib/skincare/skincareBundles";

type BundleRecommendationStripProps = {
  title?: string;
  subtitle?: string;
  limit?: number;
  className?: string;
};

export function BundleRecommendationStrip({
  title = "Kits BelaPop para completar sua rotina",
  subtitle = "Bundles pensados por intencao de cuidado, com ordem de uso e economia visivel.",
  limit = 3,
  className = ""
}: BundleRecommendationStripProps) {
  const bundles = skincareBundles.slice(0, limit);

  return (
    <section className={`bg-[#fcf9f8] px-4 py-14 text-[#1c1b1b] sm:px-6 lg:px-8 ${className}`}>
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#6c5e06]">
              Curadoria compravel
            </p>
            <h2 className="mt-3 max-w-2xl font-headline text-3xl leading-[0.98] tracking-[-0.04em] sm:text-5xl">
              {title}
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#5f5a55]">{subtitle}</p>
          </div>
          <Link
            href="/kits"
            className="inline-flex min-h-12 items-center justify-center border border-[#1c1b1b] px-5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#1c1b1b] transition hover:bg-[#1c1b1b] hover:text-white"
          >
            Ver todos os kits
          </Link>
        </div>
        <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-3 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3">
          {bundles.map((bundle, index) => (
            <BundleCard key={bundle.id} bundle={bundle} compact featured={index === 0} />
          ))}
        </div>
      </div>
    </section>
  );
}
