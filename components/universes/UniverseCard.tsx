"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import type { BelaPopUniverse } from "@/lib/discovery/universes";

type UniverseCardProps = {
  universe: BelaPopUniverse;
  featured?: boolean;
  source?: string;
};

function trackUniverseClick(universe: BelaPopUniverse, source: string) {
  const payload = JSON.stringify({
    type: "belapop_universe_clicked",
    timestamp: new Date().toISOString(),
    metadata: {
      source,
      universeId: universe.id,
      universeSlug: universe.slug,
      universeTags: universe.tags
    }
  });

  if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
    navigator.sendBeacon("/api/analytics/event", new Blob([payload], { type: "application/json" }));
    return;
  }

  void fetch("/api/analytics/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true
  });
}

export function UniverseCard({
  universe,
  featured = false,
  source = "universes_grid"
}: UniverseCardProps) {
  return (
    <Link
      href={`/universos/${universe.slug}`}
      onClick={() => trackUniverseClick(universe, source)}
      className={`group relative flex min-h-[430px] shrink-0 snap-center overflow-hidden border bg-[#111111] text-white shadow-[0_28px_90px_rgba(28,27,27,0.14)] transition duration-500 hover:-translate-y-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#9A7A2F] sm:min-h-[480px] lg:min-h-[520px] ${
        featured ? "w-[84vw] sm:w-[430px] lg:w-auto" : "w-[78vw] sm:w-[390px] lg:w-auto"
      }`}
      style={{ borderColor: `${universe.theme.accent}33` }}
      aria-label={`Explorar universo ${universe.name}`}
    >
      <img
        src={universe.image}
        alt={universe.imageAlt}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover object-center opacity-85 transition duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08)_0%,rgba(0,0,0,0.34)_45%,rgba(0,0,0,0.86)_100%)]" />
      <div className="relative z-10 mt-auto flex min-h-[250px] w-full flex-col justify-end p-6 sm:p-7 lg:p-8">
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span
            className="bg-white/92 px-3 py-2 text-[9px] font-bold uppercase tracking-[0.18em] text-[#171412]"
            style={{ color: universe.theme.ink }}
          >
            {universe.badge}
          </span>
          <span className="border border-white/22 bg-white/10 px-3 py-2 text-[9px] font-bold uppercase tracking-[0.18em] text-white/82 backdrop-blur">
            Universo BelaPop
          </span>
        </div>
        <h3 className="max-w-[11ch] font-headline text-4xl leading-none tracking-normal sm:text-5xl">
          {universe.name}
        </h3>
        <p className="mt-4 max-w-[28ch] text-sm leading-6 text-white/82">{universe.subtitle}</p>
        <div className="mt-6 flex items-center justify-between gap-4 border-t border-white/16 pt-5">
          <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-white">
            {universe.primaryCTA.label}
          </span>
          <span
            className="inline-flex h-10 w-10 items-center justify-center border border-white/20 bg-white/10 text-white transition group-hover:bg-white group-hover:text-black"
            aria-hidden="true"
          >
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
