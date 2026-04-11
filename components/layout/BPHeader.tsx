"use client";

import Link from "next/link";
import { Heart, Menu, Search, ShoppingCart, Sparkles, User, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { popClubPaths, skinScanJourneyLinks } from "@/lib/popclub/navigation";
import { useAuth } from "@/lib/AuthContext";
import { useCart } from "@/lib/CartContext";
import { getPublicAsset } from "@/lib/publicEnv";
import { GlobalProductSearchOverlay } from "@/components/layout/GlobalProductSearchOverlay";

const navItems = [
  { href: "/#home", label: "Home" },
  { href: popClubPaths.skinScan, label: "Skin Scan" },
  { href: "/#vitrine", label: "Vitrine" },
  { href: "/#diario", label: "Diario" }
];

const mobileFeatureItems = [
  {
    href: popClubPaths.landing,
    eyebrow: "Universo premium",
    label: "PopClub",
    description: "Landing, membership e toda a entrada premium conectada ao clube."
  },
  {
    href: popClubPaths.radar,
    eyebrow: "Acesso antecipado",
    label: "Radar de drops",
    description: "Acompanhe os produtos monitorados e os proximos movimentos da curadoria."
  },
  {
    href: popClubPaths.routine,
    eyebrow: "Skin Scan + clube",
    label: "Rotina personalizada",
    description: "Leve o diagnostico para uma rotina guiada, elegante e compravel."
  },
  {
    href: "/diario",
    eyebrow: "Editorial",
    label: "Diario BelaPop",
    description: "Rituais, ciencia cosmetica e repertorio premium traduzidos com clareza."
  }
];

const skinScanFeatureItems = skinScanJourneyLinks.map((item) => ({
  href: item.href,
  eyebrow: item.eyebrow,
  label: item.label,
  description: item.description
}));

export function BPHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { user, ready: authReady } = useAuth();
  const { itemCount, ready: cartReady } = useCart();
  const brandLogoUrl = getPublicAsset(process.env.NEXT_PUBLIC_LOGO_URL, "/logo.svg");
  const accountHref =
    authReady && user ? (user.role === "seller" ? "/parceiro" : "/conta") : "/login";
  const accountLabel = authReady && user ? "Conta" : "Entrar";

  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen && !searchOpen) {
      document.body.style.overflow = "";
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileMenuOpen, searchOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-bpBlack text-bpOffWhite">
      <div className="h-[2px] w-full bg-bpPink/85" />
      <div className="mx-auto flex h-[72px] w-full max-w-[1240px] items-center gap-6 px-4 md:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-white/6 text-bpOffWhite transition hover:border-bpPink/45 hover:bg-white/10 md:hidden"
            aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((value) => !value)}
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>

          <Link
            href="/"
            className="inline-flex shrink-0 items-center"
            aria-label="BelaPop"
          >
            <img
              src={brandLogoUrl}
              alt="BelaPop"
              className="h-12 w-auto md:h-14"
              loading="eager"
            />
          </Link>
        </div>

        <nav className="hidden items-center gap-6 text-xs uppercase tracking-[0.28em] md:flex">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : item.href.startsWith("/#")
                ? pathname === "/"
                : pathname?.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={isActive ? "text-bpPinkSoft" : "text-bpOffWhite/75 hover:text-bpOffWhite"}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden items-center gap-3 md:flex">
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-bpOffWhite/82 transition hover:border-bpPink/35 hover:text-bpOffWhite"
              aria-label="Buscar produtos"
              aria-haspopup="dialog"
              aria-expanded={searchOpen}
              onClick={() => {
                setMobileMenuOpen(false);
                setSearchOpen(true);
              }}
            >
              <Search size={16} />
            </button>
            <Link
              href={popClubPaths.landing}
              className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-bpOffWhite/82 transition hover:text-bpOffWhite"
            >
              <Sparkles size={15} />
              <span>PopClub</span>
            </Link>
            <Link
              href={authReady && user ? "/minha-conta" : "/login"}
              className="inline-flex h-9 w-9 items-center justify-center text-bpOffWhite/80 hover:text-bpOffWhite"
              aria-label="Conta"
            >
              <User size={16} />
            </Link>
            <Link
              href="/conta/favoritos"
              className="inline-flex h-9 w-9 items-center justify-center text-bpOffWhite/80 hover:text-bpOffWhite"
              aria-label="Favoritos"
            >
              <Heart size={16} />
            </Link>
            <Link
              href="/carrinho"
              className="relative inline-flex h-9 w-9 items-center justify-center text-bpOffWhite/80 hover:text-bpOffWhite"
              aria-label="Carrinho"
            >
              <ShoppingCart size={16} />
              {cartReady && itemCount > 0 ? (
                <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-bpPink px-1 text-[10px] font-semibold text-bpOffWhite">
                  {itemCount}
                </span>
              ) : null}
            </Link>
          </div>

          <Button href="/catalogo" size="sm" className="hidden md:inline-flex">
            Explorar curadoria
          </Button>

          <div className="flex items-center gap-2 md:hidden">
            <Link
              href={accountHref}
              className="inline-flex h-10 min-w-[40px] items-center justify-center rounded-full border border-bpPink/35 bg-white/5 px-2 text-bpOffWhite shadow-[0_0_0_1px_rgba(255,255,255,0.04)] min-[390px]:gap-2 min-[390px]:px-3"
              aria-label={authReady && user ? "Abrir conta" : "Fazer login"}
              title={authReady && user ? "Conta" : "Entrar"}
            >
              <User size={16} />
              <span className="hidden text-[11px] font-medium uppercase tracking-[0.18em] text-bpOffWhite min-[390px]:inline">
                {accountLabel}
              </span>
            </Link>
            <button
              type="button"
              className="inline-flex h-10 min-w-[40px] items-center justify-center rounded-full border border-white/10 bg-white/5 px-2 text-bpOffWhite/85"
              aria-label="Buscar no catalogo"
              aria-haspopup="dialog"
              aria-expanded={searchOpen}
              onClick={() => {
                setMobileMenuOpen(false);
                setSearchOpen(true);
              }}
            >
              <Search size={16} />
            </button>
            <Link
              href="/carrinho"
              className="relative inline-flex h-10 min-w-[40px] items-center justify-center rounded-full border border-white/10 bg-white/5 px-2 text-bpOffWhite/85 min-[390px]:gap-2 min-[390px]:px-3"
              aria-label="Carrinho"
            >
              <ShoppingCart size={16} />
              <span className="hidden text-[11px] font-medium uppercase tracking-[0.18em] text-bpOffWhite min-[390px]:inline">
                Carrinho
              </span>
              {cartReady && itemCount > 0 ? (
                <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-bpPink px-1 text-[10px] font-semibold text-bpOffWhite">
                  {itemCount}
                </span>
              ) : null}
            </Link>
          </div>
        </div>
      </div>

      <div
        className={`fixed inset-0 z-[70] bg-[rgba(18,14,16,0.46)] backdrop-blur-[2px] transition md:hidden ${
          mobileMenuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={mobileMenuOpen ? "false" : "true"}
      >
        <button
          type="button"
          className="absolute inset-0 h-full w-full cursor-default"
          aria-label="Fechar menu"
          onClick={() => setMobileMenuOpen(false)}
        />
        <aside
          className={`relative h-full w-[88vw] max-w-[380px] overflow-y-auto border-r border-white/10 bg-[linear-gradient(180deg,rgba(16,13,15,0.98),rgba(26,20,24,0.98))] px-5 pb-7 pt-5 text-white shadow-[0_24px_80px_rgba(0,0,0,0.34)] transition-transform duration-300 ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          role="dialog"
          aria-modal="true"
          aria-label="Menu BelaPop"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.34em] text-white/78">
                BelaPop
              </p>
              <p className="mt-2 max-w-[14ch] font-display text-3xl leading-[0.94] text-white">
                Navegue pela curadoria.
              </p>
            </div>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-white/6 text-bpOffWhite transition hover:border-bpPink/45 hover:bg-white/10"
              aria-label="Fechar menu"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-6 rounded-[28px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-4">
            <p className="text-[10px] uppercase tracking-[0.34em] text-white/74">
              Beauty Intelligence Platform
            </p>
            <p className="mt-3 text-sm leading-relaxed text-white/92">
              Editorial, tecnologia proprietaria e curadoria premium em uma experiencia de beleza silenciosa.
            </p>
          </div>

          <Link
            href={popClubPaths.landing}
            className="group mt-6 block rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.04))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.22)]"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/72">
                  Universo premium
                </p>
                <h3 className="mt-3 font-display text-[2rem] leading-[0.92] text-white">PopClub</h3>
                <p className="mt-3 max-w-[22ch] text-sm leading-relaxed text-white/85">
                  Membership, radar, rotina personalizada e acesso antecipado em um so hub.
                </p>
              </div>
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/14 bg-white/8 text-white transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1">
                <Sparkles size={16} />
              </span>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/12 bg-white/6 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-white/82">
                Membership
              </span>
              <span className="rounded-full border border-bpPink/30 bg-bpPink/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-white">
                Radar
              </span>
              <span className="rounded-full border border-white/12 bg-white/6 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-white/82">
                Rotina
              </span>
            </div>
          </Link>

          <div className="mt-8">
            <p className="text-[10px] uppercase tracking-[0.34em] text-white/72">Explorar</p>
            <nav className="mt-4 flex flex-col gap-2">
              {navItems.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === "/"
                    : item.href.startsWith("/#")
                    ? pathname === "/"
                    : pathname?.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`rounded-[24px] border px-4 py-4 transition ${
                      isActive
                        ? "border-bpPink/45 bg-bpPinkLux/12 text-white"
                        : "border-white/8 bg-white/[0.03] text-white/96 hover:border-bpPink/30 hover:bg-white/[0.05]"
                    }`}
                  >
                    <span className="font-display text-[1.9rem] leading-[0.94] !text-white">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] uppercase tracking-[0.34em] text-white/72">Jornadas premium</p>
              <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-bpPinkSoft">
                <Sparkles size={12} />
                PopClub
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {mobileFeatureItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(248,230,234,0.12),rgba(255,255,255,0.04))] p-4 transition hover:border-bpPink/30 hover:bg-[linear-gradient(180deg,rgba(248,230,234,0.18),rgba(255,255,255,0.05))]"
                >
                  <p className="text-[10px] uppercase tracking-[0.32em] text-white/72">{item.eyebrow}</p>
                  <div className="mt-3 flex items-start gap-3">
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/16 bg-white/8 text-white">
                      <Sparkles size={16} />
                    </span>
                    <div className="min-w-0">
                      <p className="font-display text-[1.8rem] leading-[0.92] !text-white">{item.label}</p>
                      <p className="mt-2 text-sm leading-relaxed !text-white/90">{item.description}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] uppercase tracking-[0.34em] text-white/72">Jornadas Skin Scan</p>
              <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-bpPinkSoft">
                <Search size={12} />
                Fluxo IA
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {skinScanFeatureItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))] p-4 transition hover:border-bpPink/30 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.05))]"
                >
                  <p className="text-[10px] uppercase tracking-[0.32em] text-white/72">{item.eyebrow}</p>
                  <div className="mt-3 min-w-0">
                    <p className="font-display text-[1.8rem] leading-[0.92] !text-white">{item.label}</p>
                    <p className="mt-2 text-sm leading-relaxed !text-white/90">{item.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <p className="text-[10px] uppercase tracking-[0.34em] text-white/72">Acesso rapido</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Link
                href={accountHref}
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm font-medium !text-white transition hover:border-bpPink/30 hover:bg-white/[0.05]"
              >
                {accountLabel}
              </Link>
              <Link
                href="/conta/favoritos"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm font-medium !text-white transition hover:border-bpPink/30 hover:bg-white/[0.05]"
              >
                Favoritos
              </Link>
              <Link
                href="/catalogo"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm font-medium !text-white transition hover:border-bpPink/30 hover:bg-white/[0.05]"
              >
                Buscar
              </Link>
              <Link
                href="/carrinho"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm font-medium !text-white transition hover:border-bpPink/30 hover:bg-white/[0.05]"
              >
                Carrinho{cartReady && itemCount > 0 ? ` (${itemCount})` : ""}
              </Link>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3">
            <Link
              href={popClubPaths.membership}
              onClick={() => setMobileMenuOpen(false)}
              className="inline-flex w-full items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-bpBlack transition hover:bg-bpOffWhite"
            >
              Entrar no PopClub
            </Link>
            <Button href="/catalogo" className="w-full justify-center">
              Explorar curadoria
            </Button>
            <Link
              href={popClubPaths.skinScan}
              onClick={() => setMobileMenuOpen(false)}
              className="inline-flex w-full items-center justify-center rounded-full border border-white/14 bg-white/[0.03] px-5 py-3 text-sm font-medium uppercase tracking-[0.18em] !text-white transition hover:border-bpPink/35 hover:bg-white/[0.05]"
            >
              Fazer Skin Scan
            </Link>
          </div>
        </aside>
      </div>

      <GlobalProductSearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
