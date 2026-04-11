"use client";

import Link from "next/link";
import { Heart, Menu, Search, ShoppingBag, Star, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";

const desktopNav = [
  { label: "SKINCARE", href: "/skincare", active: false },
  { label: "MAQUIAGEM", href: "/maquiagem", active: false },
  { label: "CABELOS", href: "/cabelos", active: false },
  { label: "PERFUMES", href: "/perfumes", active: false },
  { label: "SKIN SCAN BELA", href: "/skin-scan", active: true }
] as const;

const mobileMenu = [
  { label: "Skin Scan", href: "/skin-scan" },
  { label: "Objetivos", href: "/skin-scan/foco" },
  { label: "Captura", href: "/skin-scan/captura" },
  { label: "Diagnostico", href: "/skin-scan/diagnostico" },
  { label: "Skincare", href: "/skincare" },
  { label: "Maquiagem", href: "/maquiagem" },
  { label: "Cabelos", href: "/cabelos" },
  { label: "Perfumes", href: "/perfumes" },
  { label: "Vitrine", href: "/vitrine" },
  { label: "Diario", href: "/diario" }
] as const;

export function SkinScanTopBar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:h-[88px] lg:px-8">
          <div className="flex items-center gap-3 lg:gap-8 xl:gap-10">
            <button
              type="button"
              aria-label="Abrir menu"
              onClick={() => setMobileMenuOpen(true)}
              className="inline-flex h-11 w-11 items-center justify-center text-white transition-colors hover:text-gray-300 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            <Link href="/skin-scan" className="font-editorial text-2xl font-bold tracking-[-0.06em] text-white sm:text-3xl">
              BelaPop
            </Link>

            <nav className="hidden items-center gap-8 lg:flex xl:gap-10">
              {desktopNav.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`border-b pb-1 text-[11px] uppercase tracking-[0.24em] transition-colors ${
                    item.active
                      ? "border-white text-white"
                      : "border-transparent text-[#97a0b0] hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="hidden xl:flex xl:w-full xl:max-w-sm xl:flex-1 xl:px-8">
            <label className="relative block w-full">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9ba1aa]" />
              <input
                type="text"
                placeholder="BUSCAR PRODUTOS..."
                className="h-12 w-full border border-white/5 bg-[#0f0f12] pl-12 pr-4 text-[11px] uppercase tracking-[0.24em] text-white placeholder:text-[#5f6673] focus:ring-1 focus:ring-white/20"
              />
            </label>
          </div>

          <div className="flex items-center gap-2 text-white sm:gap-4 xl:gap-8">
            <Link
              href="/conta"
              className="hidden items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em] transition-colors hover:text-gray-300 sm:flex"
            >
              <Star className="h-4 w-4" />
              <span>POPCLUB</span>
            </Link>

            <button
              type="button"
              className="hidden items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em] transition-colors hover:text-gray-300 sm:flex"
            >
              <Heart className="h-4 w-4" />
              <span>FAVORITOS</span>
            </button>

            <button
              type="button"
              aria-label="Conta"
              className="hidden h-11 w-11 items-center justify-center transition-colors hover:text-gray-300 sm:inline-flex"
            >
              <UserRound className="h-5 w-5" />
            </button>

            <button
              type="button"
              aria-label="Sacola"
              className="inline-flex h-11 w-11 items-center justify-center transition-colors hover:text-gray-300"
            >
              <ShoppingBag className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm lg:hidden">
          <aside className="absolute inset-y-0 left-0 flex w-[84vw] max-w-sm flex-col bg-black px-5 pb-8 pt-5 text-white shadow-2xl">
            <div className="mb-8 flex items-center justify-between">
              <span className="font-editorial text-3xl tracking-[-0.06em]">BelaPop</span>
              <button
                type="button"
                aria-label="Fechar menu"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <label className="relative mb-8 block">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="BUSCAR PRODUTOS..."
                className="h-12 w-full border border-white/10 bg-white/5 pl-11 pr-4 text-[11px] uppercase tracking-[0.2em] text-white placeholder:text-gray-500 focus:ring-1 focus:ring-white/20"
              />
            </label>

            <nav className="flex flex-col gap-5">
              {mobileMenu.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="border-b border-white/10 pb-4 font-editorial text-2xl tracking-[-0.04em]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>

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
