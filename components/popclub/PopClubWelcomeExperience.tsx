"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";

import { popClubTierMap } from "@/lib/popclub/tiers";

const welcomeBenefits = [
  "24h de acesso antecipado em lancamentos selecionados",
  "1 ponto por R$ 1 em compras elegiveis",
  "Recompra assistida com lembrete de reposicao",
  "Base ativa para subir ao Premium e ao Luxo"
] as const;

export default function PopClubWelcomeExperience() {
  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b]">
      <main className="mx-auto max-w-7xl pb-16 pt-24 lg:px-10 lg:pt-28">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1.04fr)_minmax(420px,0.96fr)] lg:gap-12">
          <section className="relative mb-[-4rem] aspect-[4/5] w-full overflow-hidden lg:mb-0 lg:min-h-[720px] lg:rounded-[32px]">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCGqIQQDhyqWZwrqkE0GmBQCWnNjxwWeQ8wZAg_o2N7qEPWflS2b3isdOg6G-5YO61X0eKULMnRNvsTr_ipowlO1vWTnGUms8zwA9IFE7CfzKUpmPcwBwsbHSrD0CjtiYAvIJfLTnLlN8WIcaXDOGMaekVYae-AiYU8PTW-VtKt_KBSzLTgnkKGl_IwhfPLxOzjoNg3za1iw_V3kK3v2AoJQOvI5hCTrHQ9VlsdlFBqUpRvzceebUXWBlOw9bccykhgzoLq-vJri3R5"
              alt="Boas-vindas PopClub"
              className="h-full w-full object-cover grayscale-[0.2] contrast-[1.05]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#fcf9f8] via-transparent to-transparent lg:from-black/50 lg:via-black/10 lg:to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 hidden p-8 text-white lg:block">
              <div className="max-w-sm rounded-[24px] border border-white/10 bg-white/10 p-6 backdrop-blur-md">
                <p className="text-[10px] uppercase tracking-[0.24em] text-white/60">
                  Nivel ativado
                </p>
                <p className="mt-3 font-[var(--font-playfair)] text-3xl leading-tight">
                  Seu PopClub {popClubTierMap.essencial.label} comeca agora.
                </p>
              </div>
            </div>
          </section>

          <div className="relative z-10 bg-[#fcf9f8] px-8 pb-8 pt-12 lg:self-center lg:bg-transparent lg:px-0 lg:pt-0">
            <div className="space-y-8 lg:rounded-[32px] lg:border lg:border-black/[0.05] lg:bg-white/72 lg:p-10 lg:shadow-[0_20px_60px_rgba(28,27,27,0.04)]">
              <div className="space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#444748]/65">
                  Clube ativado
                </p>
                <h1 className="font-[var(--font-playfair)] text-4xl leading-tight tracking-tight lg:text-6xl lg:leading-[1.04]">
                  Bem-vinda ao PopClub.
                </h1>
                <h2 className="text-lg font-medium tracking-wide text-[#ed93d5] lg:text-xl">
                  Seu nivel {popClubTierMap.essencial.label} ja esta ativo.
                </h2>
                <p className="max-w-xl leading-relaxed text-[#444748] lg:text-lg">
                  Voce acaba de desbloquear a entrada no clube com acesso antecipado, pontuacao por compra e recompra assistida para manter sua rotina em continuidade.
                </p>
              </div>

              <section className="grid gap-4 sm:grid-cols-2">
                {welcomeBenefits.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-4 rounded-[20px] bg-[#f6f3f2] px-5 py-4"
                  >
                    <Star className="h-5 w-5 text-[#ed93d5]" />
                    <span className="text-sm font-medium tracking-tight text-[#1c1b1b]">
                      {item}
                    </span>
                  </div>
                ))}
              </section>

              <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                <div className="space-y-3">
                  <Link
                    href="/skin-scan"
                    className="inline-flex min-h-14 w-full items-center justify-center gap-3 bg-black px-8 text-[11px] uppercase tracking-[0.18em] text-white shadow-[0_10px_40px_rgba(28,27,27,0.05)] transition-opacity hover:opacity-90"
                  >
                    <span>Fazer meu Skin Scan</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <p className="text-xs text-[#444748]">
                    Descubra sua rotina ideal e comece a acumular pontos com mais criterio.
                  </p>
                </div>

                <Link
                  href="/popclub/membership#niveis"
                  className="inline-flex items-center justify-center border-b border-[#1c1b1b] pb-1 text-[11px] uppercase tracking-[0.1em] text-[#1c1b1b] transition-opacity hover:opacity-60"
                >
                  Ver niveis do clube
                </Link>
              </section>
            </div>

            <footer className="px-0 pb-4 pt-10 lg:px-2 lg:pb-0">
              <div className="flex flex-col items-center gap-4 opacity-30 lg:items-start">
                <div className="h-12 w-px bg-[#1c1b1b]" />
                <p className="text-[10px] uppercase tracking-[0.22em] text-[#1c1b1b]">
                  Seu PopClub ja esta ativo.
                </p>
              </div>
            </footer>
          </div>
        </div>
      </main>
    </div>
  );
}
