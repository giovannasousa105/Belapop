"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { Camera, Sparkles, Trophy, X } from "lucide-react";

import { BelaPopValidatedHeader } from "@/components/luxury/BelaPopValidatedHeader";
import { PopClubSimulator } from "@/components/popclub/PopClubSimulator";
import { popClubBenefitThemes, popClubTiers } from "@/lib/popclub/tiers";

const valueCards = [
  {
    icon: Trophy,
    title: "Tres niveis faceis de entender",
    description:
      "O clube parte do Essencial e evolui para Premium e Luxo conforme seus pontos acumulados."
  },
  {
    icon: Sparkles,
    title: "Beneficios concretos no dia a dia",
    description:
      "Acesso antecipado, pontos, creditos, amostras premium e prioridade real no concierge."
  },
  {
    icon: Camera,
    title: "Skin Scan e recompra conectados",
    description:
      "O clube conversa com sua rotina para indicar reposicao, upgrade e próximos passos com clareza."
  }
] as const;

const manifestoItems = [
  {
    titulo: "Níveis simples",
    descricao:
      "Você vê exatamente o que desbloqueia agora, o que vem no próximo nível e quantos pontos faltam. Sem confusão, sem letra miúda."
  },
  {
    titulo: "Acesso antecipado",
    descricao:
      "Membros entram antes da abertura geral em lançamentos, edições limitadas e collabs exclusivas. 24h no Essencial, 72h no Luxo."
  },
  {
    titulo: "Pontos e créditos",
    descricao:
      "Cada compra acumula pontos. A partir do nível Premium, os pontos viram crédito real para usar na próxima rotina."
  },
  {
    titulo: "Recompra assistida",
    descricao:
      "Quando seu produto estiver acabando, o clube avisa e monta a cesta pronta para você confirmar em um clique."
  }
] as const;

const faqItems = [
  {
    question: "Como funcionam os niveis do clube?",
    answer:
      "Você entra no nível Essencial e evolui para Premium e Luxo conforme os pontos acumulados nas compras elegíveis."
  },
  {
    question: "O que muda quando subo de nivel?",
    answer:
      "A janela de acesso antecipado aumenta, o acumulo de pontos melhora, entram creditos e amostras premium, e o concierge ganha prioridade."
  },
  {
    question: "Preciso fazer Skin Scan para aproveitar o clube?",
    answer:
      "Não. O Skin Scan ajuda a personalizar sua rotina, mas os níveis, pontos e benefícios do clube funcionam mesmo sem a análise."
  }
] as const;

export default function PopClubLandingExperience() {
  return (
    <div className="bg-[#fcf9f8] text-[#1c1b1b]">
      <BelaPopValidatedHeader activeSection="popclub" />

      <main className="overflow-x-hidden pt-[78px] lg:pt-[86px]">
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
              Um clube premium com niveis claros, vantagens reais e apoio continuo para comprar melhor.
            </p>
            <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-white">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="8" cy="8" r="7.5" stroke="currentColor" />
                <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Participar é gratuito
            </p>
            <div className="mt-10 flex w-full max-w-md flex-col gap-4 sm:max-w-none sm:flex-row sm:justify-center">
              <Link
                href="/popclub/membership"
                className="inline-flex min-h-14 items-center justify-center bg-white px-8 text-[11px] font-bold uppercase tracking-[0.26em] text-black transition-colors hover:bg-[#ed93d5] hover:text-white"
              >
                Quero fazer parte
              </Link>
              <a
                href="#niveis"
                className="inline-flex min-h-14 items-center justify-center border border-white/30 bg-white/5 px-8 text-[11px] font-bold uppercase tracking-[0.26em] text-white transition-colors hover:bg-white/10"
              >
                Ver niveis do clube
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
                  <article key={item.titulo} className="flex gap-6">
                    <span className="font-[var(--font-playfair)] text-4xl text-black/20">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="font-[var(--font-playfair)] text-xl font-bold">{item.titulo}</h3>
                      <p className="mt-2 text-sm leading-7 text-[#444748]">{item.descricao}</p>
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

        <section id="niveis" className="bg-white px-5 py-18 md:px-8 md:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <span className="text-[10px] uppercase tracking-[0.34em] text-[#ed93d5]">
                Níveis do clube
              </span>
              <h2 className="mt-4 font-[var(--font-playfair)] text-4xl font-bold tracking-[-0.05em] md:text-6xl">
                Entrada no clube — Essencial
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#444748] md:text-base">
                Você entra no Essencial e progride com pontos acumulados em compras elegíveis. Cada nível adiciona vantagens concretas para compra, atendimento e recompra.
              </p>
              <p className="mt-3 flex items-center gap-2 text-sm font-medium text-[#1D9E75]">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <circle cx="8" cy="8" r="7.5" stroke="#1D9E75" />
                  <path d="M5 8l2 2 4-4" stroke="#1D9E75" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Gratuito para todos os clientes BelaPop
              </p>
            </div>

            <div className="mt-12 grid gap-4 lg:grid-cols-3">
              {popClubTiers.map((tier) => (
                <article key={tier.id} className="border border-black/10 bg-[#f6f3f2] p-8">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#444748]/65">
                        {tier.unlockRule}
                      </p>
                      <h3 className="mt-3 font-[var(--font-playfair)] text-3xl font-bold tracking-tight">
                        {tier.label}
                      </h3>
                    </div>
                    <span className="border border-black/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#444748]">
                      Nivel
                    </span>
                  </div>

                  <p className="mt-5 text-sm leading-7 text-[#444748]">{tier.summary}</p>

                  <ul className="mt-6 space-y-3">
                    {tier.benefits.map((benefit) => (
                      <li key={benefit} className="border-t border-black/8 pt-3 text-sm leading-7 text-[#1c1b1b]">
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="beneficios" className="bg-black px-5 py-18 text-white md:px-8 md:py-28">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-center font-[var(--font-playfair)] text-4xl font-black tracking-[-0.05em] md:text-6xl">
              O que muda na pratica
            </h2>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {popClubBenefitThemes.map((item) => (
                <article
                  key={item.title}
                  className="flex aspect-square flex-col justify-end border border-white/5 bg-[#1c1b1b] p-8"
                >
                  <Sparkles className="mb-4 h-8 w-8 text-[#ed93d5]" />
                  <h3 className="text-sm font-bold uppercase tracking-[0.22em]">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-white/70">{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <PopClubSimulator />

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
              BelaPop
            </div>
            <div className="mt-8 flex flex-wrap gap-6">
              {[
                { label: "Privacidade", href: "/aviso-de-privacidade" },
                { label: "Termos", href: "/termos-de-uso" },
                { label: "Entrega e devoluções", href: "/política-de-trocas-e-devoluções" },
                { label: "Fale conosco", href: "/contato" }
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-[10px] uppercase tracking-[0.22em] text-[#444748] transition-colors hover:text-black"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-[#444748] md:text-right">
            (c) 2026 BelaPop. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
