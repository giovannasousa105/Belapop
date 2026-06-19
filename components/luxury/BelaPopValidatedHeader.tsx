"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Heart,
  Menu,
  Search,
  ShoppingBag,
  Sparkles,
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
  | "circulo"
  | "kits"
  | "diario";

type HeaderVariant = "dark" | "light";
type HeaderFeatureSet = "default" | "skin-scan";

type BelaPopValidatedHeaderProps = {
  activeSection?: HeaderSection;
  featureSet?: HeaderFeatureSet;
  managedByShell?: boolean;
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
  { href: "/popclub", label: "PopClub", key: "popclub" },
  { href: "/circulo", label: "Círculo", key: "circulo" },
  { href: "/skincare", label: "Skincare", key: "skincare" },
  { href: "/cabelos", label: "Cabelos", key: "cabelos" },
  { href: "/rituais", label: "Autocuidado", key: "autocuidado" },
  { href: "/maquiagem", label: "Maquiagem", key: "maquiagem" },
  { href: "/universos", label: "Universos", key: "universos" },
  { href: "/kits", label: "Kits", key: "kits" }
];

const explorarLinks: readonly DrawerNavLink[] = [
  { href: "/skin-scan", label: "Entender minha pele" },
  { href: "/circulo", label: "Círculo BelaPop" },
  { href: "/diario", label: "Diário BelaPop" },
  { href: "/skincare", label: "Skincare" },
  { href: "/cabelos", label: "Cabelos" },
  { href: "/rituais", label: "Autocuidado" },
  { href: "/maquiagem", label: "Maquiagem" },
  { href: "/kits", label: "Kits" },
  { href: "/universos", label: "Universos" }
];

const secondaryLinks: readonly DrawerNavLink[] = [
  { href: "/contato", label: "Atendimento" },
  { href: "/termos-de-uso", label: "Políticas e Termos" }
];

const ShellManagedHeaderContext = createContext(false);

export function ShellManagedHeaderProvider({
  children,
  enabled
}: {
  children: ReactNode;
  enabled: boolean;
}) {
  return (
    <ShellManagedHeaderContext.Provider value={enabled}>
      {children}
    </ShellManagedHeaderContext.Provider>
  );
}

export function BelaPopValidatedHeader(props: BelaPopValidatedHeaderProps) {
  const shellManagedHeader = useContext(ShellManagedHeaderContext);

  if (shellManagedHeader && !props.managedByShell) {
    return null;
  }

  return <BelaPopValidatedHeaderContent {...props} />;
}

function BelaPopValidatedHeaderContent({
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

  const myAccountLinks: DrawerNavLink[] = [
    { href: favoritesHref, label: "Favoritos" },
    { href: accountHref, label: "Minha conta" },
    { href: ordersHref, label: "Meus pedidos" }
  ];

  useEffect(() => {
    const onScroll = () => setIsCondensed(window.scrollY > 10);
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

  // Desktop shell — only applied at tablet+ breakpoint
  const shellClass = dark
    ? "lg:border-[rgba(193,122,144,0.18)] lg:bg-[linear-gradient(180deg,rgba(8,5,7,0.99)_0%,rgba(12,9,11,0.97)_100%)] lg:text-[#FCF7F1] lg:shadow-[0_2px_32px_rgba(0,0,0,0.45)]"
    : "lg:bg-[linear-gradient(180deg,rgba(252,249,248,0.96),rgba(252,249,248,0.9))] lg:text-[#151312] lg:shadow-[0_14px_36px_rgba(28,24,24,0.08)]";

  const activeClass = dark ? "text-white" : "text-black";
  const idleClass = dark ? "text-[#F5EEE8] hover:text-white" : "text-black/58 hover:text-black";
  const iconClass = dark ? "text-[#F5EEE8]" : "text-[#151312]";
  const iconHoverClass = dark ? "hover:bg-[rgba(255,255,255,0.08)]" : "hover:bg-black/5";
  // #C17A90 on dark bg: 6.14:1 contrast ratio ✅ WCAG AA
  const iconAccentClass = dark ? "text-[#C17A90]" : "text-[#8E5B68]";

  // Mobile header: transparent dark at top → cream on scroll
  const mobileBgClass = isCondensed
    ? "bg-[rgba(252,249,248,0.98)] text-[#1c1b1b] shadow-[0_2px_16px_rgba(28,24,24,0.10)]"
    : "bg-[rgba(0,0,0,0.60)] text-[#FCF7F1]";
  const mobileHover = isCondensed ? "hover:bg-black/5" : "hover:bg-white/10";
  const mobileIconClass = isCondensed ? "text-[#2c2828]" : "text-[#FCF7F1]";
  const mobileBorder = isCondensed ? "border-black/8" : "border-transparent";

  const linkBase =
    "group flex min-h-[52px] items-center justify-between px-5 text-[0.95rem] font-medium transition-colors hover:bg-[#f1ecea] focus-visible:bg-[#f1ecea] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#8E5B68]";

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      {/* ── Announcement bar ─────────────────────────────────────────────── */}
      <div
        className="fixed inset-x-0 top-0 z-[71] flex h-[28px] items-center overflow-hidden border-b border-[rgba(193,122,144,0.25)] bg-[linear-gradient(90deg,#16090d_0%,#20101a_50%,#16090d_100%)] lg:h-[36px]"
        aria-hidden="true"
      >
        <div className="animate-marquee flex shrink-0 whitespace-nowrap">
          {[0, 1].map((i) => (
            <span
              key={i}
              className="flex shrink-0 items-center px-6 text-[9px] font-medium uppercase tracking-[0.09em] text-[#F0E6E0] lg:text-[11px]"
            >
              Frete grátis acima de R$&nbsp;350&nbsp;
              <span className="mx-2 text-[#C9956A]">·</span>
              Compra segura&nbsp;
              <span className="mx-2 text-[#C9956A]">·</span>
              Produtos originais&nbsp;
              <span className="mx-2 text-[#C9956A]">·</span>
              Troca em até 30 dias&nbsp;
              <span className="mx-2 text-[#C9956A]">·</span>
              Atendimento humano no pós-compra&nbsp;
              <span className="mx-2 text-[#C9956A]">·</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Main header ──────────────────────────────────────────────────── */}
      <header
        className={`fixed inset-x-0 top-[28px] z-[70] border-b backdrop-blur-xl transition-all duration-300 lg:top-[36px] ${shellClass} ${mobileBorder} ${
          isCondensed ? "lg:h-[80px]" : "lg:h-[88px]"
        } h-[72px]`}
      >
        {/* Mobile row — hidden at lg+ */}
        <div
          className={`mx-auto flex h-[72px] max-w-[1440px] items-center px-5 transition-all duration-300 lg:hidden ${mobileBgClass}`}
        >
          <div className="flex w-full items-center justify-between gap-4">
            {/* P1: aria-label on logo */}
            <Link
              href="/"
              aria-label="BelaPop — Página inicial"
              className="text-[1.08rem] font-bold uppercase tracking-[0.32em] lg:tracking-[0.28em] transition-colors"
            >
              BelaPop
            </Link>

            <div className="ml-auto flex items-center justify-end gap-1">
              <button
                type="button"
                aria-label="Buscar produtos"
                className={`inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C17A90] ${mobileHover} ${mobileIconClass}`}
                onClick={() => setSearchOpen(true)}
              >
                <Search size={19} />
              </button>
              <Link
                href={accountHref}
                aria-label={authReady && user ? "Minha conta" : "Entrar"}
                className={`inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C17A90] ${mobileHover} ${mobileIconClass}`}
              >
                <User size={19} />
              </Link>
              {/* P10: Favorites shortcut in mobile header */}
              <Link
                href={favoritesHref}
                aria-label="Favoritos"
                className={`inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C17A90] ${mobileHover} ${mobileIconClass}`}
              >
                <Heart size={19} />
              </Link>
              {sidebarEnabled ? (
                <button
                  ref={triggerButtonRef}
                  type="button"
                  aria-label="Abrir menu"
                  aria-expanded={menuOpen}
                  aria-controls="belapop-mobile-nav"
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C17A90] ${mobileHover} ${mobileIconClass}`}
                  onClick={() => setMenuOpen(true)}
                >
                  <Menu size={20} />
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {/* Desktop row — visible at lg+ (1024px) */}
        <div className="mx-auto hidden h-full max-w-[1440px] items-center px-8 lg:flex">
          <div
            className={`flex w-full items-center gap-6 transition-all duration-300 ${
              isCondensed ? "h-[80px]" : "h-[88px]"
            }`}
          >
            {/* Logo — esquerda */}
            <Link
              href="/"
              aria-label="BelaPop — Página inicial"
              className={`shrink-0 text-[1.08rem] font-semibold uppercase transition-colors ${dark ? "tracking-[0.38em] text-white" : `tracking-[0.34em] ${activeClass}`}`}
              style={dark ? { textShadow: "0 0 20px rgba(193,122,144,0.35)" } : undefined}
            >
              BelaPop
            </Link>

            {/* Nav principal */}
            <nav className="flex items-center gap-3 xl:gap-5" aria-label="Menu principal">
              {primaryNav.map((item) => {
                const active = activeSection === item.key;
                const isCta = item.key === "skin-scan";

                if (isCta && dark) {
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      className={`rounded-[20px] border border-[rgba(193,122,144,0.30)] bg-[rgba(193,122,144,0.12)] px-[12px] py-[5px] text-[12px] font-medium tracking-[0.06em] transition hover:bg-[rgba(193,122,144,0.22)] hover:text-white xl:text-[13px] ${
                        active ? "text-white" : "text-[#F0B8C8]"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                }

                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={`group relative pb-1 text-[12px] font-medium tracking-[0.06em] transition xl:text-[13px] ${
                      active ? activeClass : idleClass
                    }`}
                    style={dark && !active ? { textShadow: "0 1px 3px rgba(0,0,0,0.4)" } : undefined}
                  >
                    {item.label}
                    <span
                      className={`absolute inset-x-0 -bottom-px h-px origin-left bg-[#C17A90] transition-transform duration-300 ${
                        active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                      }`}
                    />
                  </Link>
                );
              })}
            </nav>

            {/* Espaçador */}
            <div className="flex-1" />

            {/* Ícones — direita */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Buscar produtos"
                className={`inline-flex h-10 w-10 items-center justify-center rounded-full transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${iconClass} ${iconHoverClass}`}
                onClick={() => setSearchOpen(true)}
              >
                <Search size={17} />
              </button>
              <Link
                href={favoritesHref}
                aria-label="Favoritos"
                className={`inline-flex h-10 w-10 items-center justify-center rounded-full transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${iconAccentClass} ${iconHoverClass}`}
              >
                <Heart size={17} />
              </Link>
              <Link
                href={accountHref}
                aria-label={authReady && user ? "Minha conta" : "Entrar"}
                className={`inline-flex h-10 w-10 items-center justify-center rounded-full transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${iconAccentClass} ${iconHoverClass}`}
              >
                <User size={17} />
              </Link>
              <Link
                href="/carrinho"
                aria-label="Carrinho"
                className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${iconAccentClass} ${iconHoverClass}`}
              >
                <ShoppingBag size={17} />
                {cartCount > 0 ? (
                  <span className="absolute right-1 top-1 inline-flex min-h-[15px] min-w-[15px] items-center justify-center rounded-full bg-[#E8A8B8] px-1 text-[9px] font-semibold text-[#1c1b1b]">
                    {cartCount}
                  </span>
                ) : null}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile sidebar ───────────────────────────────────────────────── */}
      {sidebarEnabled ? (
        <div
          className={`fixed inset-0 z-[95] lg:hidden ${menuOpen ? "pointer-events-auto" : "pointer-events-none"}`}
          aria-hidden={!menuOpen}
        >
          {/* Overlay: bg-black/60 ✅ */}
          <button
            type="button"
            className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
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
              {/* Header + tagline + micro CTA */}
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="text-[1.15rem] font-semibold uppercase tracking-[0.24em] text-[#1c1b1b]">
                    BelaPop
                  </p>
                  <p className="mt-3 max-w-[230px] text-sm leading-6 text-[#5a5252]">{sidebarLead}</p>
                  <Link
                    href="/skin-scan"
                    className="mt-3 inline-block text-xs font-medium text-[#8E5B68] underline underline-offset-4 transition-opacity hover:opacity-70"
                    onClick={closeMenu}
                  >
                    Fazer diagnóstico →
                  </Link>
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

              {/* P7: PopClub featured card — spans to <p> tags */}
              <Link
                href="/popclub"
                className="mt-7 flex min-h-[86px] items-center justify-between gap-4 rounded-[26px] bg-[#1c1b1b] px-5 py-4 text-[#fcf9f8] shadow-[0_18px_48px_rgba(28,27,27,0.22)] transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8E5B68]"
                onClick={closeMenu}
              >
                <span className="flex min-w-0 items-center gap-4">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/12 text-[#f7dce5]">
                    <Sparkles size={18} />
                  </span>
                  <span className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.28em] text-white/60">
                      Clube BelaPop
                    </p>
                    <p className="mt-1 text-[1rem] font-bold text-white">
                      Entrar no PopClub
                    </p>
                    <p className="mt-1 text-sm leading-5 text-white/70">
                      Pontos, créditos e acesso antecipado.
                    </p>
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-[#f7dce5]" />
              </Link>

              {/* P7: Kits mini-card */}
              <Link
                href="/kits"
                className="mt-3 flex min-h-[56px] items-center justify-between gap-4 rounded-[20px] border border-black/10 bg-white/60 px-5 py-3 text-[#1c1b1b] transition-colors hover:bg-[#f1ecea] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8E5B68]"
                onClick={closeMenu}
              >
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[#8E5B68]">Rotinas prontas</p>
                  <p className="mt-0.5 text-[0.9rem] font-semibold">Ver todos os Kits</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-[#8E5B68]" />
              </Link>

              {/* P1: Single card with 3 groups */}
              <nav className="mt-6" aria-label="Navegação mobile BelaPop">
                <div className="rounded-[26px] border border-black/10 bg-white/70 shadow-[0_20px_60px_rgba(28,20,20,0.08)]">
                  {/* GRUPO 1 — Explorar */}
                  <p className="px-5 pt-4 pb-2 text-[10px] uppercase tracking-[0.16em] text-[#9a8f8b]">
                    Explorar
                  </p>
                  <div className="divide-y divide-black/10">
                    {explorarLinks.map((item) => (
                      <Link
                        key={item.label}
                        href={item.href}
                        className={`${linkBase} text-[#1c1b1b]`}
                        onClick={closeMenu}
                      >
                        <span>{item.label}</span>
                        <ArrowRight className="h-4 w-4 text-[#8E5B68] opacity-45 transition-transform group-hover:translate-x-1 group-hover:opacity-100" />
                      </Link>
                    ))}
                  </div>

                  {/* GRUPO 2 — Minha conta */}
                  <hr className="mx-5 border-black/10" />
                  <p className="px-5 pt-4 pb-2 text-[10px] uppercase tracking-[0.16em] text-[#9a8f8b]">
                    Minha conta
                  </p>
                  <div className="divide-y divide-black/10">
                    {myAccountLinks.map((item) => (
                      <Link
                        key={item.label}
                        href={item.href}
                        className={`${linkBase} text-[#1c1b1b]`}
                        onClick={closeMenu}
                      >
                        <span>{item.label}</span>
                        <ArrowRight className="h-4 w-4 text-[#8E5B68] opacity-45 transition-transform group-hover:translate-x-1 group-hover:opacity-100" />
                      </Link>
                    ))}
                  </div>

                  {/* GRUPO 3 — Links secundários */}
                  <hr className="mx-5 border-black/10" />
                  <div className="divide-y divide-black/10 pb-1">
                    {secondaryLinks.map((item) => (
                      <Link
                        key={item.label}
                        href={item.href}
                        className={`${linkBase} text-sm text-[#6c6262]`}
                        onClick={closeMenu}
                      >
                        <span>{item.label}</span>
                        <ArrowRight className="h-4 w-4 text-[#9a928e] opacity-45 transition-transform group-hover:translate-x-1 group-hover:opacity-100" />
                      </Link>
                    ))}
                  </div>
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
