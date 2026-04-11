"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { Heart, Menu, Search, ShoppingBag, Sparkles, Star, User, X } from "lucide-react";
import { useEffect, useState } from "react";

import { popClubPaths, skinScanJourneyLinks } from "@/lib/popclub/navigation";

type HeaderSection = "skincare" | "maquiagem" | "cabelos" | "perfumes" | "skin-scan";

type DesktopNavItem = {
  accent?: boolean;
  href: string;
  label: string;
  section: HeaderSection;
};

const desktopNavItems: DesktopNavItem[] = [
  { label: "Skincare", href: "/skincare", section: "skincare" },
  { label: "Maquiagem", href: "/maquiagem", section: "maquiagem" },
  { label: "Cabelos", href: "/cabelos", section: "cabelos" },
  { label: "Perfumes", href: "/perfumes", section: "perfumes" },
  { label: "Skin Scan Bela", href: popClubPaths.skinScan, accent: true, section: "skin-scan" }
];

const mobileMenuItems = [
  { label: "Skincare", href: "/skincare" },
  { label: "Maquiagem", href: "/maquiagem" },
  { label: "Cabelos", href: "/cabelos" },
  { label: "Perfumes", href: "/perfumes" },
  { label: "Skin Scan Bela", href: popClubPaths.skinScan },
  { label: "Diario BelaPop", href: "/diario" },
  { label: "Vitrine", href: "/vitrine" },
  { label: "Minha Conta", href: "/conta" },
  { label: "Favoritos", href: "/conta/favoritos" }
] as const;

function NavItem({
  href,
  label,
  active = false,
  accent = false
}: {
  href: string;
  label: string;
  active?: boolean;
  accent?: boolean;
}) {
  const className = active
    ? "border-b border-white pb-1 text-white"
    : accent
      ? "text-[#dac769] hover:text-white"
      : "text-gray-400 hover:text-white";

  return (
    <Link
      href={href}
      className={`text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors duration-300 ${className}`}
    >
      {label}
    </Link>
  );
}

export function BelaPopValidatedHeader({
  activeSection = "skincare",
  featureSet = "default"
}: {
  activeSection?: HeaderSection;
  featureSet?: "default" | "skin-scan";
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const hasSkinScanFeatureSet = featureSet === "skin-scan";

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1680px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 lg:gap-8">
            <button
              type="button"
              aria-label="Abrir menu"
              onClick={() => setMobileMenuOpen(true)}
              className="inline-flex h-11 w-11 items-center justify-center text-white transition-colors hover:text-[#dac769] lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            <Link href="/" className="shrink-0">
              <img src="/logo-dark.svg" alt="BelaPop" className="h-9 w-auto invert" />
            </Link>

            <nav className="hidden items-center gap-8 lg:flex xl:gap-10">
              {desktopNavItems.map((item) => (
                <NavItem
                  key={item.label}
                  href={item.href}
                  label={item.label}
                  accent={item.accent}
                  active={item.section === activeSection}
                />
              ))}
            </nav>
          </div>

          <div className="hidden xl:flex xl:w-full xl:max-w-md xl:flex-1 xl:px-8">
            <label className="relative block w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="BUSCAR PRODUTOS..."
                className="w-full border-none bg-white/5 py-2 pl-10 pr-4 text-[11px] uppercase tracking-[0.2em] text-white placeholder:text-gray-500 focus:ring-1 focus:ring-white/20"
              />
            </label>
          </div>

          <div className="flex items-center gap-1 sm:gap-3 lg:gap-6">
            {hasSkinScanFeatureSet ? (
              <Link
                href={popClubPaths.belaCode}
                className="hidden items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:text-[#ef75ce] md:flex"
              >
                <Sparkles className="h-4 w-4" />
                <span>SKINBELA</span>
              </Link>
            ) : null}
            <Link
              href={popClubPaths.landing}
              className="hidden items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:text-[#6c5e06] sm:flex"
            >
              <Star className="h-4 w-4" />
              <span>POPCLUB</span>
            </Link>
            <button
              type="button"
              className="hidden items-center gap-2 text-[10px] font-medium uppercase tracking-[0.2em] text-white transition-colors hover:text-gray-300 sm:flex"
            >
              <Heart className="h-4 w-4" />
              <span className="hidden md:inline">FAVORITOS</span>
            </button>
            <button
              type="button"
              aria-label="Buscar"
              className="inline-flex h-11 w-11 items-center justify-center text-white transition-colors hover:text-gray-300 xl:hidden"
            >
              <Search className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Conta"
              className="hidden h-11 w-11 items-center justify-center text-white transition-colors hover:text-gray-300 sm:inline-flex"
            >
              <User className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Sacola"
              className="inline-flex h-11 w-11 items-center justify-center text-white transition-colors hover:text-gray-300"
            >
              <ShoppingBag className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm lg:hidden">
          <div className="absolute inset-y-0 left-0 flex w-[90vw] max-w-[390px] flex-col overflow-y-auto bg-[linear-gradient(180deg,#070707,#111111_42%,#171313)] px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-5 text-white shadow-[0_30px_90px_rgba(0,0,0,0.42)]">
            <div className="mb-6 flex items-center justify-between">
              <img src="/logo-dark.svg" alt="BelaPop" className="h-8 w-auto invert" />
              <button
                type="button"
                aria-label="Fechar menu"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-white/6 text-white transition-colors hover:border-white/20 hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {hasSkinScanFeatureSet ? (
              <Link
                href={popClubPaths.skinScan}
                onClick={() => setMobileMenuOpen(false)}
                className="group mb-5 block rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.04))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.22)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/72">
                      Jornada de precisao
                    </p>
                    <h3 className="mt-3 font-headline text-[2rem] leading-[0.92] text-white">
                      Skin Scan
                    </h3>
                    <p className="mt-3 max-w-[22ch] text-sm leading-relaxed text-white/85">
                      Foco de cuidado, leitura ao vivo, diagnostico detalhado e concierge SkinBela.
                    </p>
                  </div>
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/14 bg-white/8 text-white transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1">
                    <Sparkles className="h-4 w-4" />
                  </span>
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/12 bg-white/6 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-white/82">
                    Foco
                  </span>
                  <span className="rounded-full border border-[#ef75ce]/30 bg-[#ef75ce]/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[#f7bfeb]">
                    Diagnostico
                  </span>
                  <span className="rounded-full border border-white/12 bg-white/6 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-white/82">
                    BelaCode
                  </span>
                </div>
              </Link>
            ) : null}

            <label className="relative mb-8 block">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="BUSCAR PRODUTOS..."
                className="w-full border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-[11px] uppercase tracking-[0.2em] text-white placeholder:text-gray-500 focus:ring-1 focus:ring-white/20"
              />
            </label>

            <div>
              <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/60">
                Navegacao principal
              </p>
              <nav className="flex flex-col gap-3">
                {mobileMenuItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4 font-headline text-2xl text-white transition hover:border-white/20 hover:bg-white/[0.05]"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            {hasSkinScanFeatureSet ? (
              <div className="mt-8">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/60">
                    Jornadas Skin Scan
                  </p>
                  <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-[#ef75ce]">
                    <Sparkles className="h-3.5 w-3.5" />
                    IA
                  </span>
                </div>
                <div className="space-y-3">
                  {skinScanJourneyLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-4 transition hover:border-[#ef75ce]/35 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.04))]"
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/60">
                        {item.eyebrow}
                      </p>
                      <div className="mt-2">
                        <h4 className="font-headline text-[1.45rem] leading-[0.96] text-white">
                          {item.label}
                        </h4>
                        <p className="mt-2 text-sm leading-relaxed text-white/82">
                          {item.description}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-auto space-y-4 pt-8">
              <Link
                href={popClubPaths.skinScan}
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-14 items-center justify-center rounded-full bg-white px-6 text-[11px] font-semibold uppercase tracking-[0.24em] text-black"
              >
                Iniciar Skin Scan
              </Link>
              <Link
                href={hasSkinScanFeatureSet ? popClubPaths.belaCode : "/diario"}
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-14 items-center justify-center rounded-full border border-white/20 px-6 text-[11px] font-semibold uppercase tracking-[0.24em] text-white"
              >
                {hasSkinScanFeatureSet ? "Abrir SkinBela" : "Explorar Diario"}
              </Link>
            </div>
          </div>
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 -z-10"
            onClick={() => setMobileMenuOpen(false)}
          />
        </div>
      ) : null}
    </>
  );
}
