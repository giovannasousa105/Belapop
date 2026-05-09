"use client";

import Link from "next/link";
import { Heart, Mail, Menu, Search, Share2, ShoppingBag, User, X } from "lucide-react";
import { useEffect, useState } from "react";

import {
  previewBodyFont,
  previewHeadlineFont,
  previewPrimaryButtonClass,
  previewSecondaryButtonClass
} from "./luxury-preview-theme";
import { getBelapopHref, type BelapopRenderMode } from "./routes";

const leftNavigation = [
  { label: "Skincare", href: "/preview/home" },
  { label: "Maquiagem", href: "/catalogo?categoria=maquiagem" },
  { label: "Cabelos", href: "/catalogo?categoria=cabelos" },
  { label: "Perfumes", href: "/catalogo?categoria=perfumes" }
] as const;

const footerLinks = [
  { label: "Privacidade", href: "/aviso-de-privacidade" },
  { label: "Termos de Uso", href: "/termos-e-condicoes" },
  { label: "Rastreamento", href: "/rastreio" },
  { label: "Contato", href: "/contato" }
] as const;

export function EditorialPreviewFrame({
  children,
  mode = "preview",
  hideMobileHeader = false,
  hideHeader = false,
  hideFooter = false
}: {
  children: React.ReactNode;
  mode?: BelapopRenderMode;
  hideMobileHeader?: boolean;
  hideHeader?: boolean;
  hideFooter?: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const handleShare = async () => {
    if (typeof window === "undefined") return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "BelaPop",
          text: "Veja esta experiencia BelaPop.",
          url: window.location.href
        });
        return;
      }

      await navigator.clipboard.writeText(window.location.href);
    } catch {
      // noop
    }
  };

  const resolvedLeftNavigation = leftNavigation.map((item) =>
    item.href === "/preview/home" ? { ...item, href: getBelapopHref(mode, "home") } : item
  );

  return (
    <div
      className={`${previewBodyFont.className} min-h-screen bg-[#fcf9f8] text-[#1c1b1b] selection:bg-[#f7e382] selection:text-black`}
    >
      {hideHeader ? null : (
      <header
        className={`fixed inset-x-0 top-0 z-50 border-b border-black/5 bg-white/90 backdrop-blur-md ${
          hideMobileHeader ? "hidden md:block" : ""
        }`}
      >
        <div className="mx-auto flex h-20 max-w-[1800px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex flex-1 items-center gap-3 lg:gap-12">
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 lg:hidden"
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <nav className="hidden items-center gap-8 lg:flex">
              {resolvedLeftNavigation.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/60 transition-colors hover:text-black"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex-shrink-0">
            <Link
              href={getBelapopHref(mode, "home")}
              className={`${previewHeadlineFont.className} text-[1.9rem] font-bold tracking-[-0.05em] text-black sm:text-[2.2rem]`}
            >
              BelaPop
            </Link>
          </div>

          <div className="flex flex-1 items-center justify-end gap-4 sm:gap-6 lg:gap-10">
            <nav className="hidden items-center gap-8 lg:flex">
              <Link
                href="/conta/favoritos"
                className="text-[11px] font-semibold uppercase tracking-[0.2em] text-black/60 transition-colors hover:text-black"
              >
                Favoritos
              </Link>
              <Link
                href={getBelapopHref(mode, "rewards")}
                className="border-b border-black text-[11px] font-semibold uppercase tracking-[0.2em] text-black"
              >
                POPCLUB
              </Link>
            </nav>

            <div className="flex items-center gap-3 sm:gap-4 lg:gap-5">
              <Link href="/catalogo" className="inline-flex h-11 w-11 items-center justify-center p-1 transition-colors hover:text-black/60" aria-label="Buscar">
                <Search className="h-[22px] w-[22px]" />
              </Link>
              <Link href={getBelapopHref(mode, "login")} className="inline-flex h-11 w-11 items-center justify-center p-1 transition-colors hover:text-black/60" aria-label="Perfil">
                <User className="h-[22px] w-[22px]" />
              </Link>
              <Link
                href={getBelapopHref(mode, "cart")}
                className="relative inline-flex h-11 w-11 items-center justify-center p-1 transition-colors hover:text-black/60"
                aria-label="Sacola"
              >
                <ShoppingBag className="h-[22px] w-[22px]" />
                <span className="absolute right-0 top-0 h-1.5 w-1.5 rounded-full bg-black" />
              </Link>
            </div>
          </div>
        </div>
      </header>
      )}

      {menuOpen ? (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm lg:hidden">
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

            <nav className="mt-6 flex flex-col">
              <Link
                href="/belacode"
                className="mb-2 inline-flex min-h-14 items-center justify-between gap-3 bg-[#ef75ce] px-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-white transition-opacity hover:opacity-90"
                onClick={() => setMenuOpen(false)}
              >
                <span>Skin Bela Code</span>
                <Heart className="h-4 w-4" />
              </Link>
              {resolvedLeftNavigation.map((item) => (
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
                href="/conta/favoritos"
                className="border-b border-black/8 py-4 text-base font-medium"
                onClick={() => setMenuOpen(false)}
              >
                Favoritos
              </Link>
              <Link
                href={getBelapopHref(mode, "rewards")}
                className="border-b border-black/8 py-4 text-base font-semibold"
                onClick={() => setMenuOpen(false)}
              >
                POPCLUB
              </Link>
            </nav>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <Link
                href="/catalogo"
                className={`${previewSecondaryButtonClass} px-4`}
                onClick={() => setMenuOpen(false)}
              >
                <Search className="h-4 w-4" />
                Buscar
              </Link>
              <Link
                href="/conta/favoritos"
                className={`${previewSecondaryButtonClass} px-4`}
                onClick={() => setMenuOpen(false)}
              >
                <Heart className="h-4 w-4" />
                Favoritos
              </Link>
            </div>

            <Link
              href={getBelapopHref(mode, "cart")}
              className={`${previewPrimaryButtonClass} mt-auto px-5`}
              onClick={() => setMenuOpen(false)}
            >
              <ShoppingBag className="h-4 w-4" />
              Ver Sacola
            </Link>
          </div>
        </div>
      ) : null}

      {children}

      {hideFooter ? null : (
      <footer className="flex w-full flex-col items-center justify-center gap-8 bg-stone-100 px-4 py-16 text-black sm:px-6 lg:px-8 lg:py-24">
        <div className={`${previewHeadlineFont.className} text-xl font-bold tracking-[-0.04em]`}>
          BelaPop
        </div>

        <div className="flex flex-wrap justify-center gap-6 text-[11px] uppercase tracking-[0.22em] text-stone-500 sm:gap-10 lg:gap-12">
          {footerLinks.map((item) => (
            <Link key={item.label} className="transition-colors hover:text-black" href={item.href}>
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-8 pt-2 text-stone-400">
          <button
            type="button"
            className="transition-colors hover:text-black"
            aria-label="Compartilhar"
            onClick={handleShare}
          >
            <Share2 className="h-5 w-5" />
          </button>
          <a
            href="mailto:concierge@belapopoficial.com.br?subject=Contato%20BelaPop"
            className="transition-colors hover:text-black"
            aria-label="Contato por email"
          >
            <Mail className="h-5 w-5" />
          </a>
        </div>

        <p className="mt-2 text-center text-[10px] uppercase tracking-[0.2em] text-stone-400">
          © 2026 BelaPop. Todos os direitos reservados.
        </p>
      </footer>
      )}
    </div>
  );
}
