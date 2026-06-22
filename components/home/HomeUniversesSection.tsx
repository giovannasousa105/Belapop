"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Sparkles } from "lucide-react";

const sensoryUniverses = [
  {
    id: "glass-skin",
    name: "Glass Skin",
    headline: "Luminosidade refinada e hidratação profunda.",
    description: "Para pele opaca, cansada ou sem viço, com camadas leves e acabamento polido.",
    objective: "Hidratação + glow elegante",
    sensation: "Pele viçosa, macia e fotográfica",
    badge: "Rotina mais procurada",
    href: "/universos/ícones-da-curadoria",
    image: "/hero-bela-pop-editorial.jpg",
    gradient: "from-[#1d1712]/12 via-[#1d1712]/42 to-[#050403]/94",
    accent: "#DAC769"
  },
  {
    id: "acne-care",
    name: "Acne Care",
    headline: "Controle inteligente sem agredir sua barreira.",
    description: "Uma entrada técnica e calma para oleosidade, poros e textura irregular.",
    objective: "Equilíbrio + baixa fricção",
    sensation: "Pele mais controlada, sem sensação de castigo",
    badge: "Escolha frequente entre peles acneicas",
    href: "/guias/rotinas/acne-e-oleosidade",
    image: "/editorial/home-ai-card.jpg",
    gradient: "from-[#0e1715]/10 via-[#0e1715]/44 to-[#040706]/94",
    accent: "#A8C1B6"
  },
  {
    id: "barrier-repair",
    name: "Barrier Repair",
    headline: "Reconstrução da pele sensibilizada.",
    description: "Para pele repuxando, reativa ou fragilizada, com conforto como prioridade.",
    objective: "Barreira + previsibilidade",
    sensation: "Toque calmo, macio e protegido",
    badge: "Selecionado pela BelaPop",
    href: "/universos/pele-sensível",
    image: "/hero-bela.jpg",
    gradient: "from-[#141812]/10 via-[#141812]/42 to-[#050604]/94",
    accent: "#C5D0B8"
  }
] as const;

export function HomeUniversesSection() {
  return (
    <section id="universos" className="overflow-hidden bg-[#111111] px-0 py-16 text-white sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-[1440px]">
        <div className="px-5 sm:px-0">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,0.48fr)] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#DAC769]">
                Universos BelaPop
              </p>
              <h2 className="mt-4 max-w-4xl font-headline text-3xl leading-[1.12] tracking-normal sm:text-4xl">
                Entre pelo desejo da pele, não por uma prateleira infinita.
              </h2>
            </div>
            <div className="space-y-5">
              <p className="max-w-md text-sm leading-7 text-white/72 sm:text-base">
                Cada universo traduz uma sensação, uma necessidade e uma direção de rotina. A compra fica mais clara, mais editorial e mais precisa.
              </p>
              <Link
                href="/universos"
                className="inline-flex min-h-12 items-center gap-3 border border-white/24 bg-white/[0.04] px-5 text-xs font-semibold uppercase tracking-[0.08em] text-white backdrop-blur-md transition duration-300 hover:-translate-y-0.5 hover:bg-white hover:text-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                Ver todos os universos
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-9 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-5 [scrollbar-width:none] sm:px-0 lg:grid lg:grid-cols-3 lg:gap-5 lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden">
          {sensoryUniverses.map((universe) => (
            <Link
              key={universe.id}
              href={universe.href}
              className="group relative flex min-h-[430px] w-[82vw] shrink-0 snap-center overflow-hidden border border-white/10 bg-[#111111] text-white shadow-[0_28px_90px_rgba(0,0,0,0.24)] transition-[transform,box-shadow,border-color] duration-500 hover:-translate-y-1 hover:border-white/24 hover:shadow-[0_34px_110px_rgba(0,0,0,0.38)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:w-[410px] lg:min-h-[560px] lg:w-auto"
              aria-label={`Explorar universo ${universe.name}`}
            >
              <Image
                src={universe.image}
                alt={`Imagem editorial do universo ${universe.name}`}
                fill
                sizes="(max-width: 768px) 82vw, (max-width: 1280px) 410px, 33vw"
                className="object-cover object-center opacity-82 transition duration-1000 group-hover:scale-105"
              />
              <div className={`absolute inset-0 bg-gradient-to-b ${universe.gradient}`} />
              <div
                className="pointer-events-none absolute inset-x-8 top-8 h-24 rounded-full blur-3xl opacity-0 transition duration-700 group-hover:opacity-35"
                style={{ backgroundColor: universe.accent }}
              />
              <div className="relative z-10 flex h-full w-full flex-col justify-between p-6 sm:p-7 lg:p-8">
                <div className="flex items-center justify-between gap-4">
                  <span className="border border-white/18 bg-white/12 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/86 backdrop-blur-xl">
                    {universe.badge}
                  </span>
                  <span
                    className="inline-flex h-10 w-10 items-center justify-center border border-white/18 bg-white/10 text-white backdrop-blur-xl transition duration-300 group-hover:bg-white group-hover:text-black"
                    aria-hidden="true"
                  >
                    <Sparkles className="h-4 w-4" />
                  </span>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: universe.accent }}>
                    {universe.name}
                  </p>
                  <h3 className="mt-4 max-w-[13ch] font-headline text-3xl leading-[1.04] tracking-normal sm:text-4xl">
                    {universe.headline}
                  </h3>
                  <p className="mt-5 max-w-[31ch] text-sm leading-6 text-white/78">{universe.description}</p>

                  <div className="mt-7 grid gap-3 border-t border-white/14 pt-5 text-xs leading-5 text-white/78">
                    <p>
                      <span className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-white/48">
                        Objetivo da pele
                      </span>
                      {universe.objective}
                    </p>
                    <p>
                      <span className="block text-[10px] font-semibold uppercase tracking-[0.08em] text-white/48">
                        Sensação aspiracional
                      </span>
                      {universe.sensation}
                    </p>
                  </div>

                  <div className="mt-7 flex items-center justify-between gap-4">
                    <span className="text-xs font-semibold uppercase tracking-[0.08em] text-white">
                      Explorar universo
                    </span>
                    <ArrowUpRight className="h-4 w-4 transition duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" aria-hidden="true" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
