"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Heart,
  Menu,
  Search,
  ShoppingBag,
  User,
  X
} from "lucide-react";

import { GlobalProductSearchOverlay } from "@/components/layout/GlobalProductSearchOverlay";
import { useAuth } from "@/lib/AuthContext";
import { buildLoginHref } from "@/lib/auth/redirects";
import { useCart } from "@/lib/CartContext";

export type HeaderSection =
  | "loja"
  | "universos"
  | "skincare"
  | "maquiagem"
  | "cabelos"
  | "autocuidado"
  | "perfumes"
  | "skin-scan"
  | "popclub"
  | "diario";

type HeaderVariant = "dark" | "light";
type HeaderFeatureSet = "default" | "skin-scan";

type BelaPopValidatedHeaderProps = {
  activeSection?: HeaderSection;
  featureSet?: HeaderFeatureSet;
  mobileSidebarEnabled?: boolean;
  variant?: HeaderVariant;
};

type PrimaryNavLink = {
  href: string;
  label: string;
  key: HeaderSection;
};

type DrawerNavLink = {
  href: string;
  label: string;
};

const primaryNav: readonly PrimaryNavLink[] = [
  { href: "/skin-scan", label: "Entender minha pele", key: "skin-scan" },
  { href: "/skincare", label: "Skincare", key: "skincare" },
  { href: "/cabelos", label: "Cabelos", key: "cabelos" },
  { href: "/rituais", label: "Autocuidado", key: "autocuidado" },
  { href: "/maquiagem", label: "Maquiagem", key: "maquiagem" }
];

export function BelaPopValidatedHeader({
  activeSection = "loja",
  featureSet = "default",
  mobileSidebarEnabled,
  variant = "dark"
}: BelaPopValidatedHeaderProps) {
  const { user, ready: authReady } = useAuth();
  const { itemCount, ready: cartReady } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isCondensed, setIsCondensed] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const triggerButtonRef = useRef<HTMLButtonElement | null>(null);

  const accountHref =
    authReady && user
      ? user.role === "seller"
        ? "/parceiro"
        : "/conta"
      : buildLoginHref("/conta");
  const favoritesHref =
    authReady && user ? "/conta/favoritos" : buildLoginHref("/conta/favoritos");
  const ordersHref =
    authReady && user ? "/conta/pedidos" : buildLoginHref("/conta/pedidos");
  const sidebarEnabled = mobileSidebarEnabled ?? true;
  const cartCount = cartReady && itemCount > 0 ? itemCount : 0;
  const sidebarLead =
    featureSet === "skin-scan"
      ? "Sua leitura de pele continua ligada a rotina e compra."
      : "Sua rotina começa por um diagnóstico claro.";
  const mobileSidebarLinks: readonly DrawerNavLink[] = [
    { href: "/skin-scan", label: "Entender minha pele" },
    { href: "/skincare", label: "Skincare" },
    { href: "/cabelos", label: "Cabelos" },
    { href: "/rituais", label: "Autocuidado" },
    { href: "/maquiagem", label: "Maquiagem" },
    { href: favoritesHref, label: "Favoritos" },
    { href: accountHref, label: "Minha conta" },
    { href: ordersHref, label: "Meus pedidos" },
    { href: "/contato", label: "Atendimento" },
    { href: "/termos-e-condições", label: "Políticas e Termos" }
  ];

  useEffect(() => {
    const onScroll = () => setIsCondensed(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow = document.body.style.overflow;
    const triggerButton = triggerButtonRef.current;
    document.body.style.overflow = "hidden";
    const timeout = window.setTimeout(() => closeButtonRef.current?.focus(), 40);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      window.clearTimeout(timeout);
      triggerButton?.focus();
    };
  }, [menuOpen]);

  const dark = variant === "dark";
  const shellClass = dark
    ? "border-white/10 bg-[linear-gradient(180deg,rgba(10,8,9,0.98),rgba(14,11,12,0.9))] text-[#FCF7F1] shadow-[0_20px_48px_rgba(0,0,0,0.28)]"
    : "border-black/8 bg-[linear-gradient(180deg,rgba(252,249,248,0.96),rgba(252,249,248,0.9))] text-[#151312] shadow-[0_14px_36px_rgba(28,24,24,0.08)]";
  const dividerClass = dark ? "border-white/10" : "border-black/8";
  const activeClass = dark ? "text-white" : "text-black";
  const idleClass = dark ? "text-[#E5DBD3]/78 hover:text-white" : "text-black/58 hover:text-black";
  const iconClass = dark ? "text-[#FCF7F1]" : "text-[#151312]";
  const iconAccentClass = dark ? "text-[#7E4858]" : "text-[#8E5B68]";

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-[70] border-b backdrop-blur-xl transition-all duration-300 ${shellClass} ${
          isCondensed ? "lg:h-[80px]" : "lg:h-[88px]"
        } h-[72px]`}
      >
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center bg-[#fcf9f8]/96 px-5 text-[#1c1b1b] lg:hidden">
          <div className="flex w-full items-center justify-between gap-4">
            <Link
              href="/"
              className="text-[1.08rem] font-semibold uppercase tracking-[0.26em] text-[#1c1b1b]"
            >
              BelaPop
            </Link>

            <div className="ml-auto flex items-center justify-end gap-1">
              <button
                type="button"
                aria-label="Buscar produtos"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[#1c1b1b] transition-colors hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8E5B68]"
                onClick={() => setSearchOpen(true)}
              >
                <Search size={19} />
              </button>
              <Link
                href={accountHref}
                aria-label={authReady && user ? "Minha conta" : "Entrar"}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[#1c1b1b] transition-colors hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8E5B68]"
              >
                <User size={19} />
              </Link>
              {sidebarEnabled ? (
                <button
                  ref={triggerButtonRef}
                  type="button"
                  aria-label="Abrir menu"
                  aria-expanded={menuOpen}
                  aria-controls="belapop-mobile-nav"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full text-[#1c1b1b] transition-colors hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8E5B68]"
                  onClick={() => setMenuOpen(true)}
                >
                  <Menu size={20} />
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mx-auto hidden h-full max-w-[1440px] items-center px-8 lg:flex">
          <div
            className={`grid w-full grid-cols-[1fr_auto_1fr] items-center transition-all duration-300 ${
              isCondensed ? "h-[80px]" : "h-[88px]"
            }`}
          >
            <nav className="flex items-center gap-5 xl:gap-7" aria-label="Menu principal">
              {primaryNav.map((item) => {
                const active = activeSection === item.key;

                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={`group relative pb-1 text-[12px] font-medium tracking-[0.08em] transition ${
                      active ? activeClass : idleClass
                    }`}
                  >
                    {item.label}
                    <span
                      className={`absolute inset-x-0 -bottom-px h-px origin-left bg-[#8E5B68] transition-transform duration-300 ${
                        active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                      }`}
                    />
                  </Link>
                );
              })}
            </nav>

            <Link
              href="/"
              className={`justify-self-center text-center text-[1.08rem] font-semibold uppercase tracking-[0.34em] ${activeClass}`}
            >
              BelaPop
            </Link>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                aria-label="Buscar produtos"
                className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition ${dividerClass} ${iconClass}`}
                onClick={() => setSearchOpen(true)}
              >
                <Search size={17} />
              </button>
              <Link
                href={favoritesHref}
                aria-label="Favoritos"
                className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition ${dividerClass} ${iconAccentClass}`}
              >
                <Heart size={17} />
              </Link>
              <Link
                href={accountHref}
                aria-label={authReady && user ? "Minha conta" : "Entrar"}
                className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition ${dividerClass} ${iconAccentClass}`}
              >
                <User size={17} />
              </Link>
              <Link
                href="/carrinho"
                aria-label="Carrinho"
                className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full border transition ${dividerClass} ${iconAccentClass}`}
              >
                <ShoppingBag size={17} />
                {cartCount > 0 ? (
                  <span className="absolute right-1 top-1 inline-flex min-h-[15px] min-w-[15px] items-center justify-center rounded-full bg-[#8E5B68] px-1 text-[9px] font-semibold text-white">
                    {cartCount}
                  </span>
                ) : null}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {sidebarEnabled ? (
        <div
          className={`fixed inset-0 z-[95] lg:hidden ${menuOpen ? "pointer-events-auto" : "pointer-events-none"}`}
          aria-hidden={!menuOpen}
        >
          <button
            type="button"
            className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
              menuOpen ? "opacity-100" : "opacity-0"
            }`}
            aria-label="Fechar menu"
            onClick={closeMenu}
          />

          <aside
            id="belapop-mobile-nav"
            className={`relative flex h-full w-full max-w-[390px] flex-col overflow-y-auto border-r border-black/10 bg-[#fcf9f8] text-[#1c1b1b] shadow-2xl transition-transform duration-300 ${
              menuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
            role="dialog"
            aria-modal="true"
            aria-label="Menu BelaPop"
          >
            <div className="flex-1 px-6 pb-8 pt-8">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="text-[1.15rem] font-semibold uppercase tracking-[0.24em] text-[#1c1b1b]">
                    BelaPop
                  </p>
                  <p className="mt-3 max-w-[230px] text-sm leading-6 text-[#5a5252]">{sidebarLead}</p>
                </div>
                <button
                  ref={closeButtonRef}
                  type="button"
                  aria-label="Fechar menu"
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-black/10 text-[#1c1b1b] transition-colors hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8E5B68]"
                  onClick={closeMenu}
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="mt-8" aria-label="Navegacao mobile BelaPop">
                <div className="divide-y divide-black/10 rounded-[26px] border border-black/10 bg-white/70 shadow-[0_20px_60px_rgba(28,20,20,0.08)]">
                  {mobileSidebarLinks.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="group flex min-h-[52px] items-center justify-between px-5 text-[0.95rem] font-medium text-[#1c1b1b] transition-colors hover:bg-[#f1ecea] focus-visible:bg-[#f1ecea] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#8E5B68]"
                      onClick={closeMenu}
                    >
                      <span>{item.label}</span>
                      <ArrowRight className="h-4 w-4 text-[#8E5B68] opacity-45 transition-transform group-hover:translate-x-1 group-hover:opacity-100" />
                    </Link>
                  ))}
                </div>
              </nav>
            </div>

            <footer className="mt-auto border-t border-black/10 px-6 py-6">
              <Link
                href="/carrinho"
                className="flex min-h-12 items-center justify-between rounded-full bg-[#1c1b1b] px-5 text-sm font-semibold text-[#fcf9f8] transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8E5B68]"
                onClick={closeMenu}
              >
                <span>Ver carrinho</span>
                {cartCount > 0 ? (
                  <span className="rounded-full bg-white/12 px-2.5 py-1 text-xs">
                    {cartCount}
                  </span>
                ) : null}
              </Link>
              <p className="mt-4 text-xs leading-5 text-[#6c6262]">
                Produtos originais, compra segura e atendimento humano no pós-compra.
              </p>
            </footer>
          </aside>
        </div>
      ) : null}

      <GlobalProductSearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
