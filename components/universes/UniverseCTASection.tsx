"use client";

import Link from "next/link";
import { MessageCircleMore, ScanFace, ShoppingBag } from "lucide-react";

import { BundleAddToCartButton } from "@/components/bundles/BundleAddToCartButton";
import type { BelaPopUniverse } from "@/lib/discovery/universes";
import { dispatchConsultoraBelaPopOpen } from "@/lib/assistant/events";
import type { SkinBundle } from "@/lib/skincare/skincareBundles";

type UniverseCTASectionProps = {
  universe: BelaPopUniverse;
  bundle?: SkinBundle;
  variant?: "light" | "dark";
  mobileSticky?: boolean;
  sectionId?: string;
};

export function UniverseCTASection({
  universe,
  bundle,
  variant = "light",
  mobileSticky = false,
  sectionId = "concierge"
}: UniverseCTASectionProps) {
  const dark = variant === "dark";
  const openConcierge = () =>
    dispatchConsultoraBelaPopOpen({
      origin: `universe_${universe.slug}`,
      flow: universe.slug === "presentes" ? "gift" : "routine"
    });

  const shellClass = dark
    ? "bg-[#111111] text-white"
    : "bg-[#fcf9f8] text-[#1c1b1b]";
  const mutedClass = dark ? "text-white/70" : "text-[#5f5a55]";
  const outlineClass = dark
    ? "border-white/30 text-white hover:bg-white hover:text-black"
    : "border-[#1c1b1b] text-[#1c1b1b] hover:bg-[#1c1b1b] hover:text-white";

  return (
    <>
      <section id={sectionId} className={`${shellClass} px-5 py-12 sm:px-6 lg:px-8 lg:py-16`}>
        <div className="mx-auto grid max-w-[1440px] gap-6 border-y py-9 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,0.48fr)] lg:items-center" style={{ borderColor: dark ? "rgba(255,255,255,0.14)" : "#ded8d2" }}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.30em]" style={{ color: dark ? "#DAC769" : universe.theme.accent }}>
              Compra assistida
            </p>
            <h2 className="mt-4 font-headline text-4xl leading-tight tracking-normal sm:text-5xl">
              Transforme este universo em uma compra coerente.
            </h2>
            <p className={`mt-4 max-w-2xl text-sm leading-7 ${mutedClass}`}>
              {universe.conciergePrompt}
            </p>
          </div>
          <div className="grid gap-3">
            {bundle ? (
              <BundleAddToCartButton bundle={bundle} label="Adicionar kit ao carrinho" />
            ) : (
              <Link
                href={universe.primaryCTA.href}
                className="inline-flex min-h-[52px] items-center justify-center gap-3 bg-[#111111] px-5 text-[10px] font-bold uppercase tracking-[0.22em] text-white transition hover:bg-[#6c5e06]"
              >
                <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                {universe.primaryCTA.label}
              </Link>
            )}
            <Link
              href="/skin-scan"
              className={`inline-flex min-h-[52px] items-center justify-center gap-3 border px-5 text-[10px] font-bold uppercase tracking-[0.22em] transition ${outlineClass}`}
            >
              <ScanFace className="h-4 w-4" aria-hidden="true" />
              Fazer Skin Scan
            </Link>
            <button
              type="button"
              onClick={openConcierge}
              className={`inline-flex min-h-[52px] items-center justify-center gap-3 border px-5 text-[10px] font-bold uppercase tracking-[0.22em] transition ${outlineClass}`}
            >
              <MessageCircleMore className="h-4 w-4" aria-hidden="true" />
              Falar com concierge
            </button>
          </div>
        </div>
      </section>

      {mobileSticky ? (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[#ded8d2] bg-[#fcf9f8]/96 px-4 py-3 shadow-[0_-18px_48px_rgba(17,17,17,0.12)] backdrop-blur md:hidden">
          {bundle ? (
            <BundleAddToCartButton
              bundle={bundle}
              label="Adicionar kit ao carrinho"
              className="inline-flex min-h-[52px] w-full items-center justify-center gap-3 bg-[#111111] px-5 text-[10px] font-bold uppercase tracking-[0.20em] text-white transition hover:bg-[#6c5e06]"
            />
          ) : (
            <Link
              href={universe.primaryCTA.href}
              className="inline-flex min-h-[52px] w-full items-center justify-center gap-3 bg-[#111111] px-5 text-[10px] font-bold uppercase tracking-[0.20em] text-white"
            >
              {universe.primaryCTA.label}
            </Link>
          )}
        </div>
      ) : null}
    </>
  );
}
