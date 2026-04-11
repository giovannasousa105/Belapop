"use client";

import { useState } from "react";

import { primaryNavigation, utilityNavigation } from "@/components/home/luxury-home/data";
import { popClubPaths } from "@/lib/popclub/navigation";
import {
  cx,
  headlineClassName,
  IconGlyph,
  SectionContainer,
  TextLink
} from "@/components/home/luxury-home/shared";

const popClubDrawerItems = [
  {
    eyebrow: "Manifesto",
    label: "Entrar no PopClub",
    href: popClubPaths.landing,
    description: "Acesse o ecossistema premium com jornadas, drops e beneficios exclusivos."
  },
  {
    eyebrow: "Acesso antecipado",
    label: "Radar de drops",
    href: popClubPaths.radar,
    description: "Veja o que pode chegar antes e acompanhe os produtos mais desejados."
  },
  {
    eyebrow: "Skin Scan + clube",
    label: "Rotina personalizada",
    href: popClubPaths.routine,
    description: "Conecte o diagnostico da pele com uma rotina editorial de alto toque."
  }
] as const;

export function LuxuryTopNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const desktopNavigation = primaryNavigation.filter((item) => item.label !== "Skincare");

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black">
        <SectionContainer className="flex h-20 items-center justify-between gap-5 xl:gap-8">
          <div className="flex min-w-0 items-center gap-4 lg:gap-6">
            <TextLink
              href="/"
              className={cx(headlineClassName, "text-2xl font-bold tracking-tighter text-white")}
            >
              BelaPop
            </TextLink>
            <span className="hidden text-[11px] font-semibold uppercase tracking-[0.28em] text-neutral-200 lg:inline-block">
              Skincare
            </span>
          </div>

          <nav className="hidden flex-1 items-center justify-center gap-8 lg:flex xl:gap-10">
            {desktopNavigation.map((item) => (
              <TextLink
                key={item.label}
                href={item.href}
                className={cx(
                  "text-[11px] font-medium uppercase tracking-[0.22em] transition-colors duration-300",
                  item.label === "Skin Scan Bela"
                    ? "font-semibold text-neutral-200 hover:text-white"
                    : "text-neutral-300 hover:text-white"
                )}
              >
                {item.label}
              </TextLink>
            ))}
          </nav>

          <div className="hidden flex-1 items-center justify-end gap-8 lg:flex xl:gap-10">
            <div className="relative w-full max-w-[372px] xl:max-w-[420px]">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <IconGlyph name="search" className="h-4 w-4 text-neutral-300" />
              </div>
              <input
                type="text"
                placeholder="BUSCAR PRODUTOS..."
                className="h-12 w-full border border-white/10 bg-white/5 pl-11 pr-4 text-[11px] uppercase tracking-[0.22em] text-white placeholder:text-neutral-500 focus:ring-1 focus:ring-white/20"
              />
            </div>

            <TextLink
              href={popClubPaths.landing}
              className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-200 transition-colors hover:text-white"
            >
              <IconGlyph name="star" className="h-4 w-4" />
              <span>POPCLUB</span>
            </TextLink>

            <TextLink
              href="/conta/favoritos"
              className="inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-200 transition-colors hover:text-white"
            >
              <IconGlyph name="favorite" className="h-4 w-4" />
              <span className="hidden xl:inline">Favoritos</span>
            </TextLink>

            <button
              type="button"
              aria-label="Conta"
              className="inline-flex text-neutral-200 transition-colors hover:text-white"
            >
              <IconGlyph name="person" />
            </button>
            <button
              type="button"
              aria-label="Carrinho"
              className="inline-flex text-neutral-200 transition-colors hover:text-white"
            >
              <IconGlyph name="shopping_bag" />
            </button>
          </div>

          <div className="flex items-center gap-3 text-white sm:gap-5 lg:hidden">
            <TextLink
              href={popClubPaths.landing}
              className="hidden items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:text-white sm:flex"
            >
              <IconGlyph name="star" className="h-4 w-4" />
              <span>POPCLUB</span>
            </TextLink>
            <button
              type="button"
              aria-label="Favoritos"
              className="hidden text-white transition-colors hover:text-gray-300 sm:inline-flex"
            >
              <IconGlyph name="favorite" />
            </button>
            <button type="button" aria-label="Conta" className="text-white transition-colors hover:text-gray-300">
              <IconGlyph name="person" />
            </button>
            <button
              type="button"
              aria-label="Carrinho"
              className="text-white transition-colors hover:text-gray-300"
            >
              <IconGlyph name="shopping_bag" />
            </button>
            <button
              type="button"
              aria-expanded={menuOpen}
              aria-label="Abrir menu"
              className="inline-flex text-white transition-colors hover:text-gray-300 lg:hidden"
              onClick={() => setMenuOpen(true)}
            >
              <IconGlyph name="menu" />
            </button>
          </div>
        </SectionContainer>
      </header>

      <div
        className={cx(
          "fixed inset-0 z-[60] bg-black/50 transition-opacity duration-300 lg:hidden",
          menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setMenuOpen(false)}
      />

      <aside
        className={cx(
          "fixed right-0 top-0 z-[70] flex h-full w-[min(90vw,24rem)] flex-col overflow-y-auto bg-[linear-gradient(180deg,#070707,#111111_42%,#171313)] px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-5 text-white shadow-[0_30px_90px_rgba(0,0,0,0.42)] transition-transform duration-300 lg:hidden",
          menuOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/64">
              BelaPop
            </p>
            <span className={cx(headlineClassName, "mt-2 block text-[2rem] font-bold leading-[0.92] tracking-tighter")}>
              Explore a curadoria.
            </span>
          </div>
          <button
            type="button"
            aria-label="Fechar menu"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-white/6 transition-colors hover:border-white/20 hover:bg-white/10"
            onClick={() => setMenuOpen(false)}
          >
            <IconGlyph name="close" />
          </button>
        </div>

        <TextLink
          href={popClubPaths.landing}
          className="group mt-6 block rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.04))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.22)]"
          onClick={() => setMenuOpen(false)}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/72">
                Universo premium
              </p>
              <h3 className={cx(headlineClassName, "mt-3 text-[2rem] leading-[0.92] text-white")}>
                PopClub
              </h3>
              <p className="mt-3 max-w-[22ch] text-sm leading-relaxed text-white/85">
                Membership, acesso antecipado, radar de drops e rotina personalizada em um so fluxo.
              </p>
            </div>
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/14 bg-white/8 text-white transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1">
              <IconGlyph name="arrow_forward" className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/12 bg-white/6 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-white/82">
              Membership
            </span>
            <span className="rounded-full border border-[#ed93d5]/30 bg-[#ed93d5]/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[#f2bedf]">
              Radar
            </span>
            <span className="rounded-full border border-white/12 bg-white/6 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-white/82">
              Rotina
            </span>
          </div>
        </TextLink>

        <div className="relative mt-6">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <IconGlyph name="search" className="h-4 w-4 text-gray-500" />
          </div>
          <input
            type="text"
            placeholder="Buscar produtos"
            className="w-full border border-white/10 bg-white/5 py-4 pl-10 pr-4 text-sm text-white placeholder:text-gray-500 focus:border-white/30 focus:ring-0"
          />
        </div>

        <div className="mt-8">
          <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/60">
            Navegacao principal
          </p>
          <nav className="flex flex-col gap-3">
          {[...primaryNavigation, ...utilityNavigation].map((item) => (
            <TextLink
              key={item.label}
              href={item.href}
              className={cx(
                headlineClassName,
                "rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4 text-[1.55rem] leading-[0.92] text-white transition hover:border-white/20 hover:bg-white/[0.05]"
              )}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </TextLink>
          ))}
          </nav>
        </div>

        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/60">
              Jornadas PopClub
            </p>
            <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-[#ed93d5]">
              <IconGlyph name="auto_awesome" className="h-3.5 w-3.5" />
              Premium
            </span>
          </div>
          <div className="space-y-3">
            {popClubDrawerItems.map((item) => (
              <TextLink
                key={item.label}
                href={item.href}
                className="block rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-4 transition hover:border-[#ed93d5]/35 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.04))]"
                onClick={() => setMenuOpen(false)}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/60">
                  {item.eyebrow}
                </p>
                <div className="mt-2 flex items-start justify-between gap-4">
                  <div>
                    <h4 className={cx(headlineClassName, "text-[1.45rem] leading-[0.96] text-white")}>
                      {item.label}
                    </h4>
                    <p className="mt-2 text-sm leading-relaxed text-white/82">{item.description}</p>
                  </div>
                  <IconGlyph name="arrow_forward" className="mt-1 h-4 w-4 shrink-0 text-white/70" />
                </div>
              </TextLink>
            ))}
          </div>
        </div>

        <div className="mt-auto space-y-4 pt-8">
          <TextLink
            href={popClubPaths.membership}
            className="flex min-h-14 items-center justify-center rounded-full bg-white px-6 text-[11px] font-semibold uppercase tracking-[0.24em] text-black"
            onClick={() => setMenuOpen(false)}
          >
            Entrar no PopClub
          </TextLink>
          <TextLink
            href={popClubPaths.skinScan}
            className="flex min-h-14 items-center justify-center rounded-full border border-white/20 bg-white/[0.02] px-6 text-[11px] font-semibold uppercase tracking-[0.24em] text-white"
            onClick={() => setMenuOpen(false)}
          >
            Fazer Skin Scan
          </TextLink>
        </div>
      </aside>
    </>
  );
}
