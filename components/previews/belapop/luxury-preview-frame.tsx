"use client";

import Link from "next/link";
import { Heart, Menu, Search, ShoppingBag, Star, User, X } from "lucide-react";
import { useEffect, useState } from "react";

import { BelaPopValidatedFooter } from "@/components/luxury/BelaPopValidatedFooter";
import {
  previewBodyFont,
  previewHeadlineFont,
  previewPrimaryButtonClass,
  previewSecondaryButtonClass
} from "./luxury-preview-theme";
import { getBelapopHref, type BelapopRenderMode } from "./routes";

const navigation = [
  { label: "Skincare", href: "/catalogo?categoria=skincare" },
  { label: "Maquiagem", href: "/catalogo?categoria=maquiagem" },
  { label: "Cabelos", href: "/catalogo?categoria=cabelos" },
  { label: "Perfumes", href: "/catalogo?categoria=perfumes" }
] as const;

type ActiveItem = (typeof navigation)[number]["label"] | "Skin Scan Bela" | "POPCLUB" | "Entrar";

export function LuxuryPreviewFrame({
  children,
  activeItem = "Skincare",
  hideFooter = false,
  mode = "preview"
}: {
  children: React.ReactNode;
  activeItem?: ActiveItem;
  hideFooter?: boolean;
  mode?: BelapopRenderMode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <div
      className={`${previewBodyFont.className} min-h-screen bg-[#fcf9f8] text-[#1c1b1b] selection:bg-[#6c5e06] selection:text-white`}
    >
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/95 backdrop-blur">
        <div className="relative mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <button
            type="button"
            className="absolute left-4 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 text-white lg:hidden sm:left-6"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menu"
          >
              <Menu className="h-5 w-5" />
          </button>

          <div className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-2 sm:hidden">
            <Link
              href="/catalogo"
              className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/15 text-white transition-colors hover:text-gray-300"
              aria-label="Buscar produtos"
            >
              <Search className="h-5 w-5" />
            </Link>
            <Link
              href={getBelapopHref(mode, "cart")}
              className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/15 text-white transition-colors hover:text-gray-300"
              aria-label="Abrir sacola"
            >
              <ShoppingBag className="h-5 w-5" />
            </Link>
          </div>

          <Link
            href={getBelapopHref(mode, "home")}
            className={`${previewHeadlineFont.className} pl-14 text-[1.9rem] font-bold tracking-[-0.05em] text-white sm:pl-16 sm:text-[2.1rem] lg:pl-0`}
          >
            BelaPop
          </Link>

          <nav className="hidden items-center gap-8 lg:flex">
            {navigation.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`text-[11px] uppercase tracking-[0.22em] transition-colors ${
                  activeItem === item.label
                    ? "border-b border-white pb-1 font-bold text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href={getBelapopHref(mode, "scan")}
              className={`text-[11px] font-bold uppercase tracking-[0.22em] transition-colors ${
                activeItem === "Skin Scan Bela"
                  ? "border-b border-white pb-1 text-white"
                  : "text-[#dac769] hover:text-white"
              }`}
            >
              Skin Scan Bela
            </Link>
          </nav>

          <div className="hidden items-center gap-3 xl:flex">
            <div className="flex min-h-12 items-center gap-2 border border-white/10 bg-white/5 px-3 text-white/70">
              <Search className="h-4 w-4" />
              <input
                className="w-44 border-none bg-transparent p-0 text-[11px] uppercase tracking-[0.2em] text-white placeholder:text-gray-500 focus:outline-none focus:ring-0"
                placeholder="Buscar produtos..."
                type="text"
              />
            </div>
          </div>

          <div className="hidden items-center gap-4 text-white sm:flex">
            <Link
              href={getBelapopHref(mode, "rewards")}
              className={`inline-flex min-h-12 items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] transition-colors ${
                activeItem === "POPCLUB" ? "text-[#dac769]" : "hover:text-[#dac769]"
              }`}
            >
              <Star className="h-4 w-4" />
              POPCLUB
            </Link>
            <Link
              href="/conta/favoritos"
              className="inline-flex min-h-12 items-center gap-2 text-[10px] font-medium uppercase tracking-[0.2em] transition-colors hover:text-gray-300"
            >
              <Heart className="h-4 w-4" />
              <span className="hidden md:inline">Favoritos</span>
            </Link>
            <Link
              href={getBelapopHref(mode, "login")}
              className="inline-flex h-11 w-11 items-center justify-center transition-colors hover:text-gray-300"
              aria-label="Perfil"
            >
              <User className="h-5 w-5" />
            </Link>
            <Link
              href={getBelapopHref(mode, "cart")}
              className="inline-flex h-11 w-11 items-center justify-center transition-colors hover:text-gray-300"
              aria-label="Sacola"
            >
              <ShoppingBag className="h-5 w-5" />
            </Link>
          </div>

        </div>
      </header>

      {menuOpen ? (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm lg:hidden">
          <div className="absolute inset-y-0 left-0 mr-auto flex h-full w-[88%] max-w-sm flex-col bg-[#fcf9f8] px-5 py-5">
            <div className="flex items-center justify-between border-b border-black/10 pb-4">
              <span className={`${previewHeadlineFont.className} text-2xl font-bold tracking-[-0.04em]`}>
                BelaPop
              </span>
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10"
                onClick={() => setMenuOpen(false)}
                aria-label="Fechar menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 flex items-center gap-2 border border-black/10 bg-white px-4 py-3">
              <Search className="h-4 w-4 text-[#444748]" />
              <input
                className="w-full border-none bg-transparent p-0 text-sm placeholder:text-[#747878] focus:outline-none focus:ring-0"
                placeholder="Buscar produtos"
                type="text"
              />
            </div>

            <Link
              href="/belacode"
              className="mt-5 inline-flex min-h-14 items-center justify-between gap-3 bg-[#ef75ce] px-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-white transition-opacity hover:opacity-90"
              onClick={() => setMenuOpen(false)}
            >
              <span>Skin Bela Code</span>
              <Star className="h-4 w-4" />
            </Link>

            <nav className="mt-6 flex flex-col">
              {navigation.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                  className="border-b border-black/8 py-4 text-base font-medium"
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href={getBelapopHref(mode, "scan")}
                className="border-b border-black/8 py-4 text-base font-semibold text-[#6c5e06]"
                onClick={() => setMenuOpen(false)}
              >
                Skin Scan Bela
              </Link>
            </nav>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Link
                href="/conta/favoritos"
                className={`${previewPrimaryButtonClass} px-4`}
              >
                <Heart className="h-4 w-4" />
                Favoritos
              </Link>
              <Link
                href={getBelapopHref(mode, "cart")}
                className={`${previewSecondaryButtonClass} px-4`}
              >
                <ShoppingBag className="h-4 w-4" />
                Sacola
              </Link>
            </div>

            <div className="mt-auto space-y-3">
              <Link
                href={getBelapopHref(mode, "member")}
                className={`${previewPrimaryButtonClass} w-full px-5`}
                onClick={() => setMenuOpen(false)}
              >
                <User className="h-4 w-4" />
                Minha Conta
              </Link>
              <Link
                href={getBelapopHref(mode, "rewards")}
                className={`${previewPrimaryButtonClass} w-full px-5`}
                onClick={() => setMenuOpen(false)}
              >
                <Star className="h-4 w-4" />
                Entrar no POPCLUB
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      {children}

      {hideFooter ? null : <BelaPopValidatedFooter />}
    </div>
  );
}
