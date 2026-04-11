"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import {
  BellRing,
  Flame,
  Menu,
  ShoppingBag,
  Sparkles
} from "lucide-react";
import { useState } from "react";

import { ImmersiveBottomNav } from "@/components/popclub/shared/ImmersiveBottomNav";
import { ImmersiveMenuDrawer } from "@/components/popclub/shared/ImmersiveMenuDrawer";
import { radarBottomNavItems, radarMenuLinks } from "@/lib/popclub/navigation";

const radarItems = [
  {
    status: "Disponivel agora",
    meta: "Limited Batch",
    title: "Serum Eclat Infini",
    description: "A alquimia perfeita entre luminosidade e protecao molecular.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDmrJKg1XDJtfQqKtGWgd5tp55mW3oo0SBnQFT6ubnAsZQ9jSxqNTnQIUN9mxcCFe5es71iqoadMYn94cdO8wQoxuPeY6VSvx4BaVUsASPAikw6Dbp4bo8KO9a3RMl0HWOTQt9ZC6N3zxi36XJDO-SDUdDToqcuE6v2g-8P13IS-wWK1pf4qZis-1zqGBIH2iEulmDryCApIhxycYIZiquvKd1b9eh_CVLCpkiV63dJZBAiKW6dCQFGHKCI6SFqLBSg92XFn8P04Hxb",
    cta: "Garantir acesso",
    tone: "active"
  },
  {
    status: "Chegando em breve",
    meta: "Drops em 4 dias",
    title: "Vetiver Absolu Noir",
    description: "Notas de fumaca e couro italiano. Uma experiencia olfativa radical.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB9TIm9--5NfsI8m_XEcZVlw45wqeaH0gHaHRp8ji5KbbDnkpWvu5UQk5SC8CwUwm87eUXWM4t6mKWR1OwWxoxozwcCfejK6Ikwax4487_yNTHlR-MtZFNswJGG2pZ0K1_dhPm4K7kZ1enT79lG8gI7i9xVkEWKO8lSCivNIX0FXBIIDUp0aK8mnfToWl-V5BCY6idrd9hExIXb3u8KvIp8eZIfSxsRpE1F4f6b3ic0f32k1eBh9-sgaMnXiNFZeDK20BnPFCxteK29",
    cta: "Notificar drop",
    tone: "scheduled"
  },
  {
    status: "Observando",
    meta: "842 watching",
    title: "Creme Regard Solaire",
    description: "Monitorando disponibilidade nos Ateliers de Paris.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDmwMEymSL9OMVhsjnH4b0dVH7ZDyeIAQl4DZ-trxYHH5_00vnYZk_byFZaYKKJ9pUl5G9EO3GYHRFYQoWmuv3uNy4xu-TJRElbofyutinj3BULHsEEIBeJQoA6TMgaIvp0P8WlR2P7Bv3XqMQITNCNnyC5BCHQBSfCTY4JtiqQKMkHnAJs8iVo58Y2421LRF6pD6oWnl_Z8jJ198phOkDX9LcbIcg2A4iJUVCGMnQgUkGMWxu3emSFYOWpgdnh84p0kkewt2tQ7O-c",
    cta: "Entrar no radar",
    tone: "watching"
  }
] as const;

export default function PopClubRadarExperience() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#fcf9f8] pb-24 text-[#1a1a1a]">
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-30">
        <div className="absolute left-[-12%] top-[14%] h-[34vh] w-[56vw] rounded-full bg-[#ed93d5]/20 blur-[120px]" />
        <div className="absolute bottom-[8%] right-[-8%] h-[32vh] w-[50vw] rounded-full bg-[#f0ebe6] blur-[110px]" />
      </div>

      <header className="fixed inset-x-0 top-0 z-50 bg-[#fcf9f8]/80 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6 lg:px-10">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center text-[#1a1a1a] transition-opacity hover:opacity-70"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="font-[var(--font-playfair)] text-xl font-black uppercase tracking-tight">
            Radar PopClub
          </div>

          <Link
            href="/carrinho"
            className="inline-flex h-10 w-10 items-center justify-center text-[#1a1a1a] transition-opacity hover:opacity-70"
            aria-label="Abrir sacola"
          >
            <ShoppingBag className="h-5 w-5" />
          </Link>
        </div>
      </header>

      <ImmersiveMenuDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title="Radar PopClub"
        links={radarMenuLinks}
        searchPlaceholder="Buscar drops"
      />

      <main className="mx-auto max-w-6xl px-6 pb-40 pt-28 lg:px-10 lg:pt-32">
        <section className="mb-16 grid gap-12 lg:grid-cols-[minmax(0,0.72fr)_minmax(360px,0.88fr)] lg:items-start">
          <div className="lg:pt-4">
            <header className="mb-14">
              <p className="mb-3 text-[10px] uppercase tracking-[0.2em] text-[#444748]">
                Curated by Alexandria
              </p>
              <h1 className="font-[var(--font-playfair)] text-4xl font-black leading-tight tracking-tighter lg:text-6xl">
                Radar PopClub
              </h1>
              <p className="mt-4 text-lg font-light leading-relaxed text-black/70">
                Acesso antecipado e selecao exclusiva
              </p>
            </header>

            <div className="space-y-8">
              <div>
                <h2 className="font-[var(--font-playfair)] text-2xl font-bold leading-snug lg:text-4xl">
                  O que pode chegar antes de todos
                </h2>
                <div className="mt-5 h-px w-12 bg-black" />
              </div>

              <div className="rounded-[28px] border border-black/[0.05] bg-white/65 p-6 backdrop-blur-sm lg:p-8">
                <p className="text-sm leading-relaxed text-[#444748]">
                  O Radar combina sinais do seu Skin Scan, comportamento recente e estoque
                  antecipado para destacar os drops com maior aderencia ao seu momento.
                </p>
              </div>
            </div>
          </div>

          <aside className="lg:sticky lg:top-28">
            <article className="relative overflow-hidden rounded-[26px] bg-[#f9f5f2] shadow-sm">
              <div className="absolute left-6 top-6 z-10">
                <span className="inline-flex items-center rounded-full bg-white/90 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-[#1a1a1a] shadow-sm backdrop-blur-md">
                  Possivel drop
                </span>
              </div>

              <div className="aspect-square overflow-hidden">
                <img
                  src="https://lh3.googleusercontent.com/aida/ADBb0ujIXB-CXZ5LwC-GYKRN5M0LIcuDLRjGjyvflgBf2AnbCzpo23eMIb5INobpk5ROGl41chLvxev5ImFhWKImi8Tm2vYC_srPNq63ZDQB4-1Ft8jZTy4iKwG4j-RScsayKXumdr6Aga481fxDB75hsAdTTtNuP0zUT9aPZI2UyA8iXd_sniG2ETsCAoxb3j4OkByUoaLZXKoRYCZskpv0XlGLs9fw4Wys-3HQ4loghtQSubcO59jmw_7sOJ9d-tt6GwlGTj-8vL1fESk"
                  alt="Drop recomendado"
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="p-8">
                <p className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#ed93d5]">
                  <Sparkles className="h-4 w-4" />
                  Recomendado para voce
                </p>
                <h3 className="font-[var(--font-playfair)] text-3xl font-bold leading-tight lg:text-4xl">
                  Este drop combina com sua pele
                </h3>
                <p className="mb-8 mt-4 text-sm leading-relaxed text-[#444748]">
                  Selecionamos ativos que respondem melhor ao seu perfil biometrico atual.
                </p>

                <div className="flex flex-col items-center gap-4">
                  <button
                    type="button"
                    className="inline-flex min-h-14 w-full items-center justify-center rounded-full bg-[#1a1a1a] px-6 text-sm font-bold uppercase tracking-widest text-white transition-colors hover:bg-black"
                  >
                    Garantir acesso
                  </button>
                  <p className="text-[10px] font-medium tracking-wide text-black/50">
                    Disponivel antes do lancamento oficial
                  </p>
                </div>
              </div>
            </article>
          </aside>
        </section>

        <section className="space-y-16 lg:grid lg:grid-cols-2 lg:gap-10 lg:space-y-0">
          {radarItems.slice(0, 2).map((item) => (
            <article key={item.title} className="flex flex-col gap-6">
              <div
                className={`relative overflow-hidden rounded-[26px] ${
                  item.tone === "scheduled" ? "bg-[#1a1a1a]" : "bg-[#f0ebe6]"
                }`}
              >
                <div className="aspect-[16/11]">
                  <img
                    src={item.image}
                    alt={item.title}
                    className={`h-full w-full object-cover ${
                      item.tone === "scheduled" ? "opacity-60" : "mix-blend-multiply"
                    }`}
                  />
                </div>
                <div className="absolute bottom-4 left-4">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-widest ${
                      item.tone === "active"
                        ? "bg-white/80 text-[#1a1a1a]"
                        : "bg-[#ed93d5] text-white"
                    }`}
                  >
                    {item.tone === "active" ? "Disponivel agora" : "Possivel drop"}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between gap-4">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-widest ${
                      item.tone === "active" ? "text-[#444748]" : "text-[#444748]"
                    }`}
                  >
                    {item.status}
                  </span>
                  <span className="text-[10px] text-[#444748]">{item.meta}</span>
                </div>
                <h4 className="font-[var(--font-playfair)] text-2xl tracking-tight lg:text-3xl">
                  {item.title}
                </h4>
                <p className="mb-4 text-sm leading-relaxed text-[#444748]">{item.description}</p>
                <button
                  type="button"
                  className={`inline-flex min-h-14 w-full items-center justify-center rounded-full px-6 text-[11px] uppercase tracking-widest transition-colors ${
                    item.tone === "scheduled"
                      ? "bg-[#e5e2e1] text-[#1a1a1a] hover:bg-[#dcd9d9]"
                      : "bg-[#1a1a1a] text-white hover:bg-black"
                  }`}
                >
                  {item.cta}
                </button>
              </div>
            </article>
          ))}
        </section>

        <section className="mt-16">
          <article className="grid gap-5 rounded-[26px] border border-black/[0.05] bg-white/55 p-4 backdrop-blur-sm sm:grid-cols-[180px_minmax(0,1fr)] sm:p-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-center lg:gap-8">
            <div className="overflow-hidden rounded-[24px] bg-[#f0ebe6]/60">
              <div className="aspect-square">
                <img
                  src={radarItems[2].image}
                  alt={radarItems[2].title}
                  className="h-full w-full object-cover grayscale opacity-70"
                />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <span className="text-[10px] uppercase tracking-widest text-[#444748]/70">
                {radarItems[2].status}
              </span>
              <h4 className="font-[var(--font-playfair)] text-xl leading-none lg:text-3xl">
                {radarItems[2].title}
              </h4>
              <p className="text-[11px] leading-relaxed text-[#444748] lg:text-sm">
                {radarItems[2].description}
              </p>
              <div className="mt-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-tight text-[#1a1a1a]">
                <BellRing className="h-3.5 w-3.5" />
                <span>{radarItems[2].meta}</span>
              </div>
              <button
                type="button"
                className="mt-3 inline-flex min-h-12 w-full items-center justify-center rounded-full border border-[#1a1a1a]/12 bg-[#f6f3f2] px-5 text-[11px] uppercase tracking-widest text-[#1a1a1a] transition-colors hover:bg-[#e5e2e1] sm:w-auto"
              >
                {radarItems[2].cta}
              </button>
            </div>
          </article>
        </section>

        <section className="mt-24 border-t border-black/10 py-20 text-center">
          <Sparkles className="mx-auto mb-6 h-10 w-10 text-[#ed93d5]/50" />
          <blockquote className="mx-auto max-w-xl font-[var(--font-playfair)] text-2xl italic leading-snug text-black/80 lg:text-4xl">
            &quot;Beleza nao e apenas o que se ve, mas o que se cultiva com o tempo.&quot;
          </blockquote>
          <p className="mt-10 text-[10px] uppercase tracking-widest text-[#444748]">
            Avenue Eclat Members Club
          </p>
        </section>
      </main>

      <ImmersiveBottomNav activeTone="pink" items={radarBottomNavItems} />
    </div>
  );
}
