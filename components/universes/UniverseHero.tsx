/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { ArrowDown, ScanFace } from "lucide-react";

import type { BelaPopUniverse } from "@/lib/discovery/universes";

type UniverseHeroProps = {
  universe: BelaPopUniverse;
};

export function UniverseHero({ universe }: UniverseHeroProps) {
  return (
    <section className="relative min-h-[68vh] overflow-hidden bg-[#111111] text-white lg:min-h-[72vh]">
      <img
        src={universe.heroImage}
        alt={universe.heroImageAlt}
        className="absolute inset-0 h-full w-full object-cover object-center opacity-88"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.82)_0%,rgba(0,0,0,0.50)_48%,rgba(0,0,0,0.18)_100%)]" />
      <div className="relative z-10 flex min-h-[68vh] items-end px-5 py-12 sm:px-8 lg:min-h-[72vh] lg:px-12 lg:py-16">
        <div className="max-w-5xl">
          <nav className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/70">
            <Link href="/universos" className="transition hover:text-white">
              Universos
            </Link>{" "}
            / {universe.name}
          </nav>
          <div className="mt-8 flex flex-wrap gap-2">
            <span
              className="bg-white px-3 py-2 text-[9px] font-bold uppercase tracking-[0.18em]"
              style={{ color: universe.theme.ink }}
            >
              {universe.badge}
            </span>
            <span className="border border-white/20 bg-white/10 px-3 py-2 text-[9px] font-bold uppercase tracking-[0.18em] text-white/82 backdrop-blur">
              {universe.tone}
            </span>
          </div>
          <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.32em] text-[#DAC769]">
            {universe.subtitle}
          </p>
          <h1 className="mt-4 max-w-[10ch] font-headline text-6xl leading-none tracking-normal sm:text-7xl lg:text-9xl">
            {universe.name}
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-white/84 lg:text-lg">
            {universe.description}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={universe.primaryCTA.href}
              className="inline-flex min-h-14 items-center justify-center gap-3 bg-white px-7 text-[10px] font-bold uppercase tracking-[0.22em] text-black transition hover:bg-[#DAC769]"
            >
              {universe.primaryCTA.label}
              <ArrowDown className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href={universe.secondaryCTA.href}
              className="inline-flex min-h-14 items-center justify-center gap-3 border border-white/30 bg-white/10 px-7 text-[10px] font-bold uppercase tracking-[0.22em] text-white backdrop-blur transition hover:border-white hover:bg-white/16"
            >
              {universe.secondaryCTA.label}
            </Link>
            <Link
              href="/skin-scan"
              className="inline-flex min-h-14 items-center justify-center gap-3 border border-white/20 px-7 text-[10px] font-bold uppercase tracking-[0.22em] text-white transition hover:border-[#DAC769] hover:text-[#DAC769]"
            >
              Fazer Skin Scan
              <ScanFace className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
