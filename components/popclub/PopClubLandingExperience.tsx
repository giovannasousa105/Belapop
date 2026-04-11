"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { Camera, Gift, Menu, ShoppingBag, Sparkles, Star, Trophy, User, X } from "lucide-react";
import { useState } from "react";

import { ImmersiveMenuDrawer } from "@/components/popclub/shared/ImmersiveMenuDrawer";
import { landingMenuLinks } from "@/lib/popclub/navigation";

const valueCards = [
  {
    icon: Camera,
    title: "Skin Scan com beneficios do programa",
    description:
      "Leitura visual para mapear necessidades e orientar sua rotina com mais clareza."
  },
  {
    icon: Sparkles,
    title: "Beneficios e sugestoes organizados com base no seu perfil, quando disponiveis",
    description:
      "Sugestoes organizadas com mais clareza com base nos seus resultados e preferencias."
  },
  {
    icon: Trophy,
    title: "Acesso antecipado a novidades",
    description:
      "Acesso a acoes e ativacoes selecionadas, quando disponiveis."
  }
] as const;

const manifestoItems = [
  "Curadoria real",
  "Beneficios do programa",
  "Acesso antecipado",
  "Jornada mais organizada"
] as const;

const faqItems = [
  {
    question: "Como funciona o cancelamento?",
    answer:
      "O cancelamento pode ser feito a qualquer momento pelo seu painel, sem multa nem fidelidade."
  },
  {
    question: "O Skin Scan e obrigatorio?",
    answer:
      "Nao, mas ele libera beneficios e sugestoes organizados com base no seu perfil, quando disponiveis."
  },
  {
    question: "Quais as formas de pagamento?",
    answer: "Aceitamos cartoes de credito, Pix recorrente e carteiras digitais compativeis."
  }
] as const;

export default function PopClubLandingExperience() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="bg-[#fcf9f8] text-[#1c1b1b]">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/82 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:h-20 md:px-8">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="inline-flex h-11 w-11 items-center justify-center text-white md:hidden"
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="font-[var(--font-playfair)] text-xl font-bold uppercase tracking-[0.18em] text-white md:text-2xl">
              The Canvas
            </span>
          </div>

          <nav className="hidden items-center gap-8 md:flex">
            {["Membership", "Collections", "Editorial", "Atelier"].map((item) => (
              <Link
                key={item}
                href={item === "Membership" ? "/popclub/membership" : "/popclub"}
                className="text-[11px] uppercase tracking-[0.22em] text-white/70 transition-colors hover:text-white"
              >
                {item}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3 text-white">
            <Link href="/carrinho" className="inline-flex h-11 w-11 items-center justify-center">
              <ShoppingBag className="h-5 w-5" />
            </Link>
            <Link href="/login" className="inline-flex h-11 w-11 items-center justify-center">
              <User className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </header>

      <ImmersiveMenuDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title="PopClub"
        theme="dark"
        links={landingMenuLinks}
        searchPlaceholder="Buscar no clube"
      />

      <main className="overflow-x-hidden pt-16 md:pt-20">
        <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
          <div className="absolute inset-0">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBkyXb8_3dBCqwJEh4zXv9LDf3OsVmWAo4A0eo2XUiz0qMdtvEQQ9rkL39ZEysPeZjr-oYleH3OijQeyoyt9c4zQJHfPg4IUvGGD2tqPmEuKeRjzMTUKnySpMzgbaX7UzXRziwkRUJoaiWpkPLyoYnvKw794VyAWB1lku8B-FaYQwvvlzNNfTI9VqgAx-Gjqi45m9qVjyxWaVyHyzerwB7sSO5I9_kjTQcGhJG2kUWyv9LLhJHQqRI89fAVxJqejNSdhX6kLNjmE2Xq"
              alt="Editorial PopClub"
              className="h-full w-full object-cover grayscale-[20%]"
            />
            <div className="absolute inset-0 bg-black/30" />
          </div>

          <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 py-16 text-center">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD3Qu8ODpquQ7w5BdiRLoNePaQqf5StZzEhZIyfuBcBATfd6KA7N1vG6GzTWdYkXTxRjXoYe_LVgmVtzh9XymmL2KJ-r-LW97yhWVOBV8FvU3bQUYkKQEuqluqL1HaqXghVC1H--E6DFPCsctTAmUmzQRbqWincUFFXp8YbLRHJoHXpxAlmxO29Zr1Xq0UIqhj3-5H5bEkEeibNYz2rLUwWjPgwAbH-0UNz_88VjxAi7t_AQ0VcQ95uI9XIskREClW-01nbIGGe8DfV"
              alt="BelaPop"
              className="mb-6 h-10 w-auto brightness-0 invert md:h-12"
            />
            <h1 className="font-[var(--font-playfair)] text-5xl font-black tracking-[-0.06em] text-white sm:text-6xl md:text-8xl">
              PopClub
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/90 sm:text-lg md:text-2xl">
              Seu acesso a um programa para acompanhar sua rotina com mais continuidade.
            </p>
            <div className="mt-10 flex w-full max-w-md flex-col gap-4 sm:max-w-none sm:flex-row sm:justify-center">
              <Link
                href="/popclub/membership"
                className="inline-flex min-h-14 items-center justify-center bg-white px-8 text-[11px] font-bold uppercase tracking-[0.26em] text-black transition-colors hover:bg-[#ed93d5] hover:text-white"
              >
                Quero fazer parte
              </Link>
              <a
                href="#beneficios"
                className="inline-flex min-h-14 items-center justify-center border border-white/30 bg-white/5 px-8 text-[11px] font-bold uppercase tracking-[0.26em] text-white transition-colors hover:bg-white/10"
              >
                Explorar beneficios
              </a>
            </div>
          </div>
        </section>

        <section className="bg-[#fcf9f8] px-5 py-16 md:px-8 md:py-24">
          <div className="mx-auto grid max-w-7xl gap-px bg-black/10 md:grid-cols-3">
            {valueCards.map((card) => {
              const Icon = card.icon;

              return (
                <article key={card.title} className="bg-[#f6f3f2] p-8 transition-colors hover:bg-white md:p-10">
                  <Icon className="mb-8 h-10 w-10 text-black" />
                  <h2 className="font-[var(--font-playfair)] text-2xl font-bold tracking-tight">
                    {card.title}
                  </h2>
                  <p className="mt-4 text-sm leading-7 text-[#444748]">{card.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="bg-white px-5 py-18 md:px-8 md:py-28">
          <div className="mx-auto grid max-w-7xl items-center gap-14 md:grid-cols-2 md:gap-20">
            <div className="space-y-8">
              <div>
                <span className="text-[10px] uppercase tracking-[0.34em] text-[#ed93d5]">Manifesto</span>
                <h2 className="mt-4 font-[var(--font-playfair)] text-4xl font-bold leading-[1.06] tracking-[-0.05em] md:text-6xl">
                  Por que fazer parte do PopClub?
                </h2>
              </div>
              <div className="space-y-8">
                {manifestoItems.map((item, index) => (
                  <article key={item} className="flex gap-6">
                    <span className="font-[var(--font-playfair)] text-4xl text-black/20">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="font-[var(--font-playfair)] text-xl font-bold">{item}</h3>
                      <p className="mt-2 text-sm leading-7 text-[#444748]">
                        Cada beneficio foi desenhado para organizar escolhas e explicar com clareza como usar melhor cada etapa da rotina.
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="relative">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB5T2Cs-FsNBbkZPdgirr1BK4lAx4jZZTtg5hv9b7p5EmU19owDxJNACarfMf6S0_cUm3o_VVwA9WL_4cSXuol6Ej_9kCVbSEX-A5ZezCxCn_wn9NEHP33gm0mTboCQUZ4WPUP8vS2qsMRw9aT3RUTij0o0kpu1qWXhcn_WE2ud080Gk_eo74VQLHnXponBGECLT68GqVxPCE4sn8Q-nplDrYCBm4JbuEXaofNOnVtKpwzWcy4cruMUyWbH4ZBtn2mLXJhm0W5jeBML"
                alt="Vanity editorial"
                className="aspect-[4/5] w-full object-cover grayscale"
              />
              <div className="mt-5 bg-black p-8 text-white md:absolute md:-bottom-10 md:-left-10 md:mt-0 md:max-w-xs">
                <p className="font-[var(--font-playfair)] text-xl italic leading-relaxed">
                  &quot;A beleza nao e sobre quantidade, mas sobre a precisao da escolha.&quot;
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="beneficios" className="bg-black px-5 py-18 text-white md:px-8 md:py-28">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-center font-[var(--font-playfair)] text-4xl font-black tracking-[-0.05em] md:text-6xl">
              O que voce desbloqueia
            </h2>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                "Lancamentos antecipados",
                "Kits exclusivos",
                "Campanhas especiais",
                "Acesso a acoes e ativacoes selecionadas, quando disponiveis"
              ].map((item) => (
                <article key={item} className="flex aspect-square flex-col justify-end border border-white/5 bg-[#1c1b1b] p-8">
                  <Sparkles className="mb-4 h-8 w-8 text-[#ed93d5]" />
                  <h3 className="text-sm font-bold uppercase tracking-[0.22em]">{item}</h3>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#f6f3f2] px-5 py-18 md:px-8 md:py-28">
          <div className="mx-auto max-w-4xl">
            <h2 className="font-[var(--font-playfair)] text-3xl font-bold tracking-[-0.04em] md:text-4xl">
              Duvidas frequentes
            </h2>
            <div className="mt-10 divide-y divide-black/10">
              {faqItems.map((item) => (
                <details key={item.question} className="group py-6">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-[var(--font-playfair)] text-xl font-medium">
                    {item.question}
                    <X className="h-5 w-5 rotate-45 transition-transform group-open:rotate-90" />
                  </summary>
                  <p className="mt-4 max-w-3xl text-sm leading-7 text-[#444748]">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#f6f3f2] px-5 py-16 md:px-8 md:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-2 md:items-end">
          <div>
            <div className="font-[var(--font-playfair)] text-3xl font-bold tracking-[-0.04em]">
              The Curated Canvas
            </div>
            <div className="mt-8 flex flex-wrap gap-6">
              {["Privacy Policy", "Terms of Service", "Shipping & Returns", "Contact Us"].map((item) => (
                <Link
                  key={item}
                  href="/contato"
                  className="text-[10px] uppercase tracking-[0.22em] text-[#444748] transition-colors hover:text-black"
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-[#444748] md:text-right">
            © 2026 The Curated Canvas. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
