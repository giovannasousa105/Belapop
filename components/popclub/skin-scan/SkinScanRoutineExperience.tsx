"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import {
  Menu,
  MoonStar,
  ShoppingBag,
  SunMedium
} from "lucide-react";
import { useState } from "react";

import { ImmersiveBottomNav } from "@/components/popclub/shared/ImmersiveBottomNav";
import { ImmersiveMenuDrawer } from "@/components/popclub/shared/ImmersiveMenuDrawer";
import { routineBottomNavItems, routineMenuLinks } from "@/lib/popclub/navigation";

const routineGoals = [
  "Foco em hidratacao profunda",
  "Manter equilibrio da barreira",
  "Evitar sobrecarga de ativos"
] as const;

const morningSteps = [
  {
    step: "Passo 01 - Limpeza Leve",
    title: "Gel Cleanser",
    description:
      "Reposicao intensa de agua enquanto remove impurezas urbanas sem agredir.",
    rationale:
      "Sua pele apresentou sensibilidade matinal; este gel equilibra o pH sem atrito.",
    price: "R$ 210,00",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBr6v6mRjP4uLbrV8V9uQSp6wCoXcJsHb8gAiExWUxW_sBncA_lQqeqTkIT35wXFDeNUwXjxgclgiQU8aYOPf-mFp64LNL9z7hj_krhxQFevRhlcvd8vGNCuJOQGgIhjLFjJtqOyl0SEtlmIL7GXdDYpmEdIASaTTJDW8DBmXetyFW4qlX6wn-k8IoWynfZ55--UzKBQM4Ge51sYLlmDf7egPFWZxqF-Ql8HPW5V6CIvzVtvTQJJyXVjCBlE5n-OyFcka2YxDyg6pye",
    reverse: false
  },
  {
    step: "Passo 02 - Hidratacao",
    title: "Serum Hidratante",
    description:
      "Acido hialuronico de baixo peso molecular para hidratacao em camadas profundas.",
    rationale:
      "Essencial para preencher as linhas finas detectadas ao redor dos olhos no seu scan.",
    price: "R$ 340,00",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCuoXDjWFjyI88DX59DvGHLR3Ig41wUr--LcmtsjYhSjuK0fGzdlTuPf7Hm8iMedGBdlRMe1cOW9DxIr7pWAMKnzYxCZJRBF_XPLkpWHmriv8CMH8soy4GxwhzaZ1dzII09NdvzgbuP5E7n18iNaHXXkO2g39cUHPsQhs8MPWuIIHOdBrC7VS1q-CqqNL8VT-Z_7YWAgzFVuGT_DkL0b7xpkdqF1EVRowt_q1wS4ohXdTHAgv1rKXf3sTe_wZMzpD4iakoqOQKt3NtJ",
    reverse: true
  }
] as const;

const nightTreatment = {
  step: "Passo 02 - Tratamento",
  title: "Serum Regenerador",
  description:
    "Complexo noturno que estimula a renovacao celular enquanto voce descansa.",
  price: "R$ 890,00",
  note: "Formula Magistral",
  image:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCt00cNYhi8zlKL1D64pcoGyIqrRGEeWXXSHGIO8Dmm_8xXSlPxUQdciqBgZ5atlhKMOtVPhCMI05miA8YerkgJm6jH13rFvB7U5uKetN9J3DEH0usYNHGeOPMwvN0l6CYnMGVXatEIa_xNbTOjchLZVXsRNqCi2dSE3YAwZk3gy70IrKlcJGwRYuRx8K3HKGdzc1XIw9BT5L6b9i3K9GTYz3BY64ZP07JjFmSCRcyewkZzzoBgK8MSov5Jo1oBM3DSq7GxCwBnYKKZ"
} as const;

const selectedRoutine = [
  { title: "Gel Cleanser", category: "Limpeza Leve", price: "R$ 210,00" },
  { title: "Serum Hidratante", category: "Hidratacao", price: "R$ 340,00" },
  { title: "Serum Regenerador", category: "Tratamento", price: "R$ 890,00" }
] as const;

export default function SkinScanRoutineExperience() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#fcf9f8] pb-24 text-[#1c1b1b]">
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-30">
        <div className="absolute left-[-10%] top-[18%] h-[36vh] w-[60vw] rounded-full bg-[#f7e382]/18 blur-[120px]" />
        <div className="absolute bottom-[8%] right-[-10%] h-[42vh] w-[56vw] rounded-full bg-[#e5e2e1]/50 blur-[110px]" />
      </div>

      <header className="fixed inset-x-0 top-0 z-50 bg-[#fcf9f8]/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center text-[#1a1a1a] transition-opacity hover:opacity-70"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="font-[var(--font-playfair)] text-2xl font-bold uppercase tracking-tight text-[#1a1a1a]">
            The Atelier
          </h1>
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
        title="The Atelier"
        links={routineMenuLinks}
        searchPlaceholder="Buscar rotina"
      />

      <main className="mx-auto max-w-6xl px-6 pb-40 pt-24 lg:px-10 lg:pt-32">
        <section className="mb-16 grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.62fr)] xl:gap-12">
          <div>
            <h2 className="font-[var(--font-playfair)] text-5xl leading-tight tracking-tighter lg:max-w-3xl lg:text-7xl lg:leading-[1.04]">
              Sua rotina personalizada
            </h2>
            <p className="mb-10 mt-4 text-lg font-light italic text-[#444748] lg:text-xl">
              Baseada no seu Skin Scan
            </p>
          </div>

          <div className="bg-[#f6f3f2] p-8 border-l-4 border-black xl:self-start">
            <ul className="space-y-4">
              {routineGoals.map((goal) => (
                <li key={goal} className="flex items-center gap-4">
                  <span className="h-1.5 w-1.5 bg-black" />
                  <span className="text-xs uppercase tracking-[0.2em]">{goal}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mb-20">
          <div className="mb-8 flex items-baseline justify-between gap-4 border-b border-black/10 pb-2">
            <h3 className="font-[var(--font-playfair)] text-3xl italic lg:text-5xl">Manha</h3>
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#444748]">
              07:00 - 08:30
            </span>
          </div>

          <div className="space-y-16 lg:space-y-20">
            {morningSteps.map((step) => (
              <article key={step.title} className="group">
                <div
                  className={`flex flex-col gap-8 md:gap-10 lg:items-center lg:gap-12 ${
                    step.reverse ? "md:flex-row-reverse" : "md:flex-row"
                  }`}
                >
                  <div className="w-full md:w-1/2">
                    <div className="aspect-[4/5] overflow-hidden bg-[#f0eded]">
                      <img
                        src={step.image}
                        alt={step.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                  </div>

                  <div className="flex w-full flex-col justify-center md:w-1/2">
                    <span className="mb-2 text-[10px] uppercase tracking-[0.3em] text-[#444748]">
                      {step.step}
                    </span>
                    <h4 className="font-[var(--font-playfair)] text-2xl lg:text-4xl">
                      {step.title}
                    </h4>
                    <p className="mb-6 mt-3 text-sm leading-relaxed text-[#444748] lg:text-base">
                      {step.description}
                    </p>

                    <div className="mb-6 border-l border-black/10 bg-[#f6f3f2] p-4 text-xs italic leading-relaxed">
                      <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.2em] not-italic">
                        Por que este produto?
                      </span>
                      {step.rationale}
                    </div>

                    <div className="mt-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <span className="font-[var(--font-playfair)] text-lg lg:text-2xl">
                        {step.price}
                      </span>
                      <button
                        type="button"
                        className="inline-flex min-h-12 w-full items-center justify-center bg-black px-6 text-[10px] uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-85 sm:w-auto lg:min-h-14 lg:px-8"
                      >
                        Incluir na rotina
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mb-20">
          <div className="mb-8 flex items-baseline justify-between gap-4 border-b border-black/10 pb-2">
            <h3 className="font-[var(--font-playfair)] text-3xl italic lg:text-5xl">Noite</h3>
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#444748]">
              21:00 - 23:00
            </span>
          </div>

          <article className="bg-black p-8 text-white md:p-10 lg:p-12">
            <div className="flex flex-col gap-10 md:flex-row md:items-center lg:gap-12">
              <div className="w-full md:w-[34%]">
                <div className="aspect-square overflow-hidden">
                  <img
                    src={nightTreatment.image}
                    alt={nightTreatment.title}
                    className="h-full w-full object-cover brightness-90"
                  />
                </div>
              </div>

              <div className="flex-1">
                <span className="mb-2 block text-[10px] uppercase tracking-[0.3em] text-white/60">
                  {nightTreatment.step}
                </span>
                <h4 className="font-[var(--font-playfair)] text-3xl lg:text-5xl">
                  {nightTreatment.title}
                </h4>
                <p className="mb-8 mt-4 text-base font-light leading-relaxed text-white/80 lg:max-w-2xl">
                  {nightTreatment.description}
                </p>

                <div className="flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <span className="block font-[var(--font-playfair)] text-xl lg:text-3xl">
                      {nightTreatment.price}
                    </span>
                    <span className="text-[9px] uppercase tracking-[0.2em] italic text-white/50">
                      {nightTreatment.note}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="inline-flex min-h-12 w-full items-center justify-center bg-[#f7e382] px-6 text-[10px] uppercase tracking-[0.18em] text-black transition-opacity hover:opacity-90 sm:w-auto lg:min-h-14 lg:px-8"
                  >
                    Incluir na rotina
                  </button>
                </div>
              </div>
            </div>
          </article>
        </section>

        <section className="mt-24 border-t-2 border-black pt-16">
          <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.56fr)] xl:gap-16">
            <div>
              <h3 className="mb-12 font-[var(--font-playfair)] text-4xl tracking-tighter lg:text-6xl">
                Sua rotina selecionada
              </h3>

              <div className="space-y-6">
                {selectedRoutine.map((item) => (
                  <div
                    key={item.title}
                    className="flex items-center justify-between gap-6 border-b border-black/10 py-4"
                  >
                    <div>
                      <p className="font-[var(--font-playfair)] text-lg lg:text-2xl">{item.title}</p>
                      <p className="text-[9px] uppercase tracking-[0.2em] text-[#444748]">
                        {item.category}
                      </p>
                    </div>
                    <span className="text-sm lg:text-base">{item.price}</span>
                  </div>
                ))}
              </div>
            </div>

            <aside className="xl:sticky xl:top-28 xl:self-start">
              <div className="space-y-8 bg-white/70 p-8 ring-1 ring-black/[0.05] backdrop-blur-sm">
                <div className="flex items-center justify-between gap-4 border-b border-black/10 pb-5">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.28em] text-[#444748]/65">
                      Curadoria final
                    </p>
                    <p className="mt-2 font-[var(--font-playfair)] text-2xl">3 itens selecionados</p>
                  </div>
                  <div className="text-right text-[10px] uppercase tracking-[0.2em] text-[#444748]/70">
                    Frete cortesia
                  </div>
                </div>

                <div className="flex items-baseline justify-between gap-6">
                  <span className="text-xs font-bold uppercase tracking-[0.4em]">
                    Total do Investimento
                  </span>
                  <span className="font-[var(--font-playfair)] text-4xl lg:text-5xl">
                    R$ 1.440,00
                  </span>
                </div>

                <Link
                  href="/carrinho"
                  className="inline-flex min-h-14 w-full items-center justify-center gap-4 bg-black px-6 text-xs uppercase tracking-[0.3em] text-white transition-colors hover:bg-[#444748]"
                >
                  <span>Finalizar rotina</span>
                  <span aria-hidden="true">-&gt;</span>
                </Link>

                <p className="text-center text-[10px] uppercase tracking-[0.2em] text-[#444748]/70">
                  Frete cortesia para rotinas personalizadas
                </p>
              </div>
            </aside>
          </div>
        </section>
      </main>

      <ImmersiveBottomNav items={routineBottomNavItems} />
    </div>
  );
}
