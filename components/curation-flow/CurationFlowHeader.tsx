"use client";

import Link from "next/link";
import { Heart, Menu, Search, ShoppingBag, Sparkles, User, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type HeaderTheme = "light" | "dark";
type LogoPosition = "center" | "left";

export type CurationHeaderItem = {
  accent?: boolean;
  active?: boolean;
  href: string;
  label: string;
};

type CurationFlowHeaderProps = {
  mobileCtaHref?: string;
  mobileCtaLabel?: string;
  primaryItems?: CurationHeaderItem[];
  secondaryItems?: CurationHeaderItem[];
  theme?: HeaderTheme;
  logoPosition?: LogoPosition;
};

function navItemClass(theme: HeaderTheme, item: CurationHeaderItem) {
  if (item.active) {
    return theme === "dark"
      ? "border-b border-white pb-1 text-white"
      : "border-b border-black pb-1 text-black";
  }

  if (item.accent) {
    return theme === "dark"
      ? "text-[#dac769] hover:text-white"
      : "text-[#6c5e06] hover:text-black";
  }

  return theme === "dark"
    ? "text-white/70 hover:text-white"
    : "text-black/60 hover:text-black";
}

export function CurationFlowHeader({
  mobileCtaHref = "/skin-scan",
  mobileCtaLabel = "Skin Scan Bela",
  primaryItems = [],
  secondaryItems = [],
  theme = "light",
  logoPosition = "center"
}: CurationFlowHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileMenuOpen]);

  const mergedItems = useMemo(() => {
    const seen = new Set<string>();
    const items = [...primaryItems, ...secondaryItems].filter((item) => {
      const key = `${item.label}:${item.href}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return items;
  }, [primaryItems, secondaryItems]);

  const isDark = theme === "dark";
  const headerClass = isDark
    ? "border-white/10 bg-black/95 text-white"
    : "border-black/5 bg-[#fcf9f8]/90 text-black";
  const iconClass = isDark ? "text-white hover:text-[#dac769]" : "text-black hover:text-[#ed93d5]";
  const drawerBorder = isDark ? "border-white/10" : "border-black/10";
  const drawerBg = isDark ? "bg-black text-white" : "bg-[#fcf9f8] text-black";
  const logoClass = isDark ? "text-white" : "text-black";

  return (
    <>
      <header className={`fixed inset-x-0 top-0 z-50 border-b backdrop-blur-md ${headerClass}`}>
        <div className="relative mx-auto flex h-16 items-center justify-between px-4 lg:hidden">
          <button
            type="button"
            aria-label="Abrir menu"
            onClick={() => setMobileMenuOpen(true)}
            className={`inline-flex h-11 w-11 items-center justify-center transition-colors ${iconClass}`}
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link
            href="/"
            className={`pointer-events-auto absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-editorial text-2xl font-bold tracking-[-0.05em] ${logoClass}`}
          >
            BelaPop
          </Link>

          <div className="flex items-center gap-1">
            <Link
              href="/catalogo"
              aria-label="Buscar produtos"
              className={`inline-flex h-11 w-11 items-center justify-center transition-colors ${iconClass}`}
            >
              <Search className="h-5 w-5" />
            </Link>
            <Link
              href="/carrinho"
              aria-label="Abrir sacola"
              className={`inline-flex h-11 w-11 items-center justify-center transition-colors ${iconClass}`}
            >
              <ShoppingBag className="h-5 w-5" />
            </Link>
          </div>
        </div>

        {logoPosition === "center" ? (
          <div className="mx-auto hidden h-20 max-w-[1800px] items-center justify-between px-6 lg:flex">
            <div className="flex flex-1 items-center gap-12">
              <nav className="flex items-center gap-8">
                {primaryItems.map((item) => (
                  <Link
                    key={`${item.label}-${item.href}`}
                    href={item.href}
                    className={`text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors ${navItemClass(theme, item)}`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            <Link href="/" className={`font-editorial text-[2.2rem] font-bold tracking-[-0.05em] ${logoClass}`}>
              BelaPop
            </Link>

            <div className="flex flex-1 items-center justify-end gap-10">
              <nav className="flex items-center gap-8">
                {secondaryItems.map((item) => (
                  <Link
                    key={`${item.label}-${item.href}`}
                    href={item.href}
                    className={`text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors ${navItemClass(theme, item)}`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <div className="flex items-center gap-4">
                <Link
                  href="/catalogo"
                  aria-label="Buscar produtos"
                  className={`inline-flex h-11 w-11 items-center justify-center transition-colors ${iconClass}`}
                >
                  <Search className="h-5 w-5" />
                </Link>
                <Link
                  href="/conta"
                  aria-label="Minha conta"
                  className={`inline-flex h-11 w-11 items-center justify-center transition-colors ${iconClass}`}
                >
                  <User className="h-5 w-5" />
                </Link>
                <Link
                  href="/carrinho"
                  aria-label="Abrir sacola"
                  className={`relative inline-flex h-11 w-11 items-center justify-center transition-colors ${iconClass}`}
                >
                  <ShoppingBag className="h-5 w-5" />
                  <span className={`absolute right-2 top-2 h-1.5 w-1.5 rounded-full ${isDark ? "bg-white" : "bg-black"}`} />
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto hidden h-20 max-w-[1800px] items-center justify-between px-6 lg:flex">
            <div className="flex items-center gap-12">
              <Link href="/" className={`font-editorial text-[2.2rem] font-bold tracking-[-0.05em] ${logoClass}`}>
                BelaPop
              </Link>

              <nav className="flex items-center gap-8">
                {primaryItems.map((item) => (
                  <Link
                    key={`${item.label}-${item.href}`}
                    href={item.href}
                    className={`text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors ${navItemClass(theme, item)}`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-10">
              {secondaryItems.length ? (
                <nav className="flex items-center gap-8">
                  {secondaryItems.map((item) => (
                    <Link
                      key={`${item.label}-${item.href}`}
                      href={item.href}
                      className={`text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors ${navItemClass(theme, item)}`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
              ) : null}

              <div className="flex items-center gap-4">
                <Link
                  href="/catalogo"
                  aria-label="Buscar produtos"
                  className={`inline-flex h-11 w-11 items-center justify-center transition-colors ${iconClass}`}
                >
                  <Search className="h-5 w-5" />
                </Link>
                <Link
                  href="/conta"
                  aria-label="Minha conta"
                  className={`inline-flex h-11 w-11 items-center justify-center transition-colors ${iconClass}`}
                >
                  <User className="h-5 w-5" />
                </Link>
                <Link
                  href="/carrinho"
                  aria-label="Abrir sacola"
                  className={`relative inline-flex h-11 w-11 items-center justify-center transition-colors ${iconClass}`}
                >
                  <ShoppingBag className="h-5 w-5" />
                  <span className={`absolute right-2 top-2 h-1.5 w-1.5 rounded-full ${isDark ? "bg-white" : "bg-black"}`} />
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm lg:hidden">
          <div className={`absolute inset-y-0 left-0 flex h-full w-[88%] max-w-sm flex-col px-5 py-5 ${drawerBg}`}>
            <div className={`flex items-center justify-between border-b pb-4 ${drawerBorder}`}>
              <span className="font-editorial text-2xl font-bold tracking-[-0.05em]">BelaPop</span>
              <button
                type="button"
                aria-label="Fechar menu"
                onClick={() => setMobileMenuOpen(false)}
                className={`inline-flex h-11 w-11 items-center justify-center transition-colors ${iconClass}`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <Link
              href={mobileCtaHref}
              onClick={() => setMobileMenuOpen(false)}
              className={`mt-5 inline-flex min-h-14 items-center justify-between gap-3 px-4 text-[11px] font-semibold uppercase tracking-[0.24em] ${
                isDark ? "bg-white text-black" : "bg-black text-white"
              }`}
            >
              <span>{mobileCtaLabel}</span>
              <Sparkles className="h-4 w-4" />
            </Link>

            <nav className="mt-6 flex flex-col">
              {mergedItems.map((item) => (
                <Link
                  key={`${item.label}-${item.href}`}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`border-b py-4 text-base font-medium ${drawerBorder}`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Link
                href="/catalogo"
                onClick={() => setMobileMenuOpen(false)}
                className={`inline-flex min-h-12 items-center justify-center gap-2 border px-4 text-[11px] font-semibold uppercase tracking-[0.2em] ${drawerBorder}`}
              >
                <Search className="h-4 w-4" />
                Buscar
              </Link>
              <Link
                href="/conta/favoritos"
                onClick={() => setMobileMenuOpen(false)}
                className={`inline-flex min-h-12 items-center justify-center gap-2 border px-4 text-[11px] font-semibold uppercase tracking-[0.2em] ${drawerBorder}`}
              >
                <Heart className="h-4 w-4" />
                Favoritos
              </Link>
            </div>

            <Link
              href="/carrinho"
              onClick={() => setMobileMenuOpen(false)}
              className={`mt-auto inline-flex min-h-14 items-center justify-center gap-2 px-5 text-[11px] font-semibold uppercase tracking-[0.24em] ${
                isDark ? "bg-[#ed93d5] text-white" : "bg-black text-white"
              }`}
            >
              <ShoppingBag className="h-4 w-4" />
              Ver Sacola
            </Link>
          </div>
        </div>
      ) : null}
    </>
  );
}
