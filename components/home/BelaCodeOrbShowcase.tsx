"use client";

import { motion, useReducedMotion } from "framer-motion";

import { GlassSkinOrb } from "@/components/home/GlassSkinOrb";
import { Button } from "@/components/ui/Button";

type BelaCodeOrbShowcaseProps = {
  primaryHref?: string;
  primaryLabel?: string;
};

const routineItems = [
  "Cleanser calmante",
  "Serum reparador",
  "Moisturizer restaurador",
  "Fotoprotecao diaria"
];

const textureItems = [
  { label: "Textura", value: "irregular" },
  { label: "Luminosidade", value: "reduzida" },
  { label: "Barreira", value: "sensibilizada" },
  { label: "Uniformidade", value: "moderada" }
];

export function BelaCodeOrbShowcase({
  primaryHref = "/conta/skincare",
  primaryLabel = "Ver minha curadoria"
}: BelaCodeOrbShowcaseProps) {
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <section className="bg-[#FBF7F4] pb-18 pt-8 text-[#1E1E1E] md:pb-24 md:pt-10">
      <div className="mx-auto max-w-[1240px] overflow-x-clip px-4 md:px-8">
        <div className="overflow-hidden rounded-[28px] border border-[rgba(216,160,172,0.18)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(248,238,240,0.88)_100%)] shadow-[0_30px_90px_rgba(91,49,56,0.09)] backdrop-blur-xl md:rounded-[34px]">
          <div className="border-b border-[rgba(216,160,172,0.16)] px-5 py-8 sm:px-6 md:px-10 md:py-10">
            <p className="text-[11px] uppercase tracking-[0.32em] text-[#5B3138]/72">
              BelaCode / Precision Beauty System
            </p>
            <div className="mt-4 grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
              <div>
                <h2 className="max-w-3xl text-balance font-display text-[1.46rem] leading-[1.1] tracking-[-0.02em] text-[#1E1E1E] sm:text-[2.15rem] sm:leading-[1.04] md:text-6xl">
                  Sua pele, lida com precisao silenciosa.
                </h2>
                <p className="mt-4 max-w-2xl text-[0.93rem] leading-6 text-[#6E5F61] md:mt-5 md:text-lg md:leading-7">
                  Uma leitura visual sofisticada que traduz sinais da pele em curadoria de rotina,
                  orientacao de autocuidado e inteligencia cosmetica.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 lg:justify-end">
                <Button
                  href={primaryHref}
                  variant="accent"
                  className="shadow-[0_16px_36px_rgba(213,30,113,0.24)]"
                >
                  {primaryLabel}
                </Button>
                <Button
                  href={primaryHref}
                  variant="secondary"
                  className="border-[rgba(216,160,172,0.32)] bg-white/70 text-[#1E1E1E] shadow-none hover:bg-white"
                >
                  Entender a tecnologia
                </Button>
              </div>
            </div>
          </div>

          <div className="px-3 py-4 sm:px-6 md:px-10 md:py-8">
            <div className="grid gap-4 lg:grid-cols-[1.02fr_0.98fr]">
              <div className="order-2 min-w-0 rounded-[24px] border border-[rgba(216,160,172,0.18)] bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(248,238,240,0.82))] p-3 shadow-[0_18px_50px_rgba(91,49,56,0.08)] backdrop-blur-xl lg:order-1 lg:rounded-[30px] lg:p-5">
                <div className="mb-4 flex min-w-0 flex-col gap-4 rounded-[20px] border border-[rgba(216,160,172,0.18)] bg-white/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:rounded-[24px]">
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.28em] text-[#5B3138]/70">
                      BelaCode Editorial Scan
                    </p>
                    <p className="mt-2 text-sm font-medium text-[#1E1E1E] md:text-lg">
                      Atualizado agora
                    </p>
                  </div>
                  <span className="self-start rounded-[22px] border border-[rgba(216,160,172,0.24)] bg-white/76 px-4 py-3 text-[11px] uppercase tracking-[0.24em] text-[#5B3138] sm:rounded-full">
                    Leitura concluida
                  </span>
                </div>

                <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                  <div className="rounded-[22px] border border-[rgba(216,160,172,0.18)] bg-[linear-gradient(180deg,rgba(255,255,255,0.55),rgba(246,232,234,0.34)_100%)] p-3 sm:p-4 md:rounded-[28px] md:p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-[10px] uppercase tracking-[0.3em] text-[#5B3138]/72">
                        Visualizacao 3D
                      </p>
                      <span className="text-[10px] uppercase tracking-[0.22em] text-[#6E5F61]/64">
                        capsula glass
                      </span>
                    </div>
                    <div className="flex items-center justify-center overflow-hidden">
                      <GlassSkinOrb className="max-w-[170px] sm:max-w-[300px] lg:max-w-[360px]" />
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <div className="rounded-[22px] border border-[rgba(216,160,172,0.18)] bg-white/62 p-4 md:rounded-[28px] md:p-5">
                      <p className="text-[10px] uppercase tracking-[0.3em] text-[#5B3138]/72">
                        Skin Reading
                      </p>
                      <motion.p
                        className="mt-4 font-display text-5xl leading-none text-[#1E1E1E] sm:text-6xl"
                        initial={{ opacity: 0, y: 10 }}
                        animate={
                          reduceMotion
                            ? { opacity: 1, y: 0 }
                            : { opacity: [0, 1], y: [10, 0] }
                        }
                        transition={{ duration: 0.7, ease: "easeOut" }}
                      >
                        76
                      </motion.p>
                      <div className="mt-5 space-y-2 text-sm text-[#1E1E1E] md:text-base">
                        <p>Barreira sensibilizada</p>
                        <p>Textura irregular</p>
                        <p>Perda sutil de luminosidade</p>
                      </div>
                    </div>

                    <div className="rounded-[22px] border border-[rgba(216,160,172,0.18)] bg-white/62 p-4 md:rounded-[28px] md:p-5">
                      <p className="text-[10px] uppercase tracking-[0.3em] text-[#5B3138]/72">
                        Texture Map
                      </p>
                      <div className="mt-4 space-y-3">
                        {textureItems.map((item) => (
                          <div
                            key={item.label}
                            className="flex items-center justify-between gap-4 rounded-full border border-[rgba(216,160,172,0.15)] bg-[#FCF7F8] px-4 py-3"
                          >
                            <span className="text-sm text-[#6E5F61]">{item.label}</span>
                            <span className="text-sm font-medium text-[#1E1E1E]">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 hidden gap-4 lg:grid lg:grid-cols-2">
                  <div className="rounded-[28px] border border-[rgba(216,160,172,0.18)] bg-white/62 p-5">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-[#5B3138]/72">
                      Curadoria orientada
                    </p>
                    <div className="mt-4 space-y-3">
                      {routineItems.map((item) => (
                        <div
                          key={item}
                          className="rounded-full border border-[rgba(216,160,172,0.16)] bg-[#FCF7F8] px-4 py-3 text-sm text-[#1E1E1E]"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-[rgba(216,160,172,0.18)] bg-white/62 p-5">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-[#5B3138]/72">
                      Leitura silenciosa
                    </p>
                    <p className="mt-4 text-sm leading-relaxed text-[#6E5F61]">
                      Leitura baseada em sinais visuais e literatura clinica.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <Button
                        href={primaryHref}
                        variant="accent"
                        className="shadow-[0_16px_36px_rgba(213,30,113,0.24)]"
                      >
                        Montar rotina
                      </Button>
                      <Button
                        href="/catalogo"
                        variant="secondary"
                        className="border-[rgba(216,160,172,0.32)] bg-white/72 text-[#1E1E1E] shadow-none hover:bg-white"
                      >
                        Explorar produtos
                      </Button>
                    </div>
                  </div>
                </div>

                <p className="mt-5 text-xs leading-6 text-[#6E5F61]/88">
                  BelaCode e SkinBela apoiam triagem cosmetica, leitura de rotina e orientacao de
                  autocuidado com base em literatura clinica. Nao substituem avaliacao dermatologica
                  presencial.
                </p>
              </div>

              <div className="order-1 rounded-[24px] border border-[rgba(216,160,172,0.18)] bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(248,238,240,0.82))] p-3 shadow-[0_18px_50px_rgba(91,49,56,0.08)] backdrop-blur-xl lg:order-2 lg:hidden">
                <div className="rounded-[20px] border border-[rgba(216,160,172,0.18)] bg-white/66 px-4 py-4 sm:rounded-[26px]">
                  <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase tracking-[0.28em] text-[#5B3138]/72">
                        BelaCode Editorial Scan
                      </p>
                      <p className="mt-2 text-sm text-[#6E5F61]">Leitura concluida</p>
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.22em] text-[#6E5F61]/68">
                      Atualizado agora
                    </span>
                  </div>
                </div>

                <div className="mt-4 rounded-[22px] border border-[rgba(216,160,172,0.18)] bg-white/66 px-4 py-5 text-center sm:rounded-[26px]">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-[#5B3138]/72">Skin Reading</p>
                  <motion.p
                    className="mt-4 font-display text-4xl leading-none text-[#1E1E1E] sm:text-6xl"
                    initial={{ opacity: 0, y: 10 }}
                    animate={reduceMotion ? { opacity: 1, y: 0 } : { opacity: [0, 1], y: [10, 0] }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                  >
                    76
                  </motion.p>
                  <div className="mt-4 space-y-2 text-[0.92rem] text-[#1E1E1E] sm:text-sm">
                    <p>Barreira sensibilizada</p>
                    <p>Textura irregular</p>
                    <p>Perda de luminosidade</p>
                  </div>
                </div>

                <div className="mt-4 rounded-[22px] border border-[rgba(216,160,172,0.18)] bg-[linear-gradient(180deg,rgba(255,255,255,0.55),rgba(246,232,234,0.34)_100%)] p-4 sm:rounded-[26px] sm:p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-[#5B3138]/72">
                      Visualizacao 3D
                    </p>
                    <span className="text-[10px] uppercase tracking-[0.22em] text-[#6E5F61]/64">
                      orb glass
                    </span>
                  </div>
                  <div className="flex items-center justify-center overflow-hidden">
                      <GlassSkinOrb className="max-w-[128px] sm:max-w-[280px]" />
                  </div>
                </div>

                <details className="mt-4 rounded-[22px] border border-[rgba(216,160,172,0.18)] bg-white/66 px-4 py-4 sm:rounded-[26px]" open>
                  <summary className="cursor-pointer list-none text-[10px] uppercase tracking-[0.3em] text-[#5B3138]/72">
                    Curadoria orientada
                  </summary>
                  <div className="mt-4 space-y-3">
                    {routineItems.map((item) => (
                      <div
                        key={item}
                        className="flex min-w-0 items-center gap-3 rounded-full border border-[rgba(216,160,172,0.16)] bg-[#FCF7F8] px-4 py-3 text-sm text-[#1E1E1E]"
                      >
                        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[rgba(216,160,172,0.16)] bg-white text-[10px] font-semibold text-[#5B3138]">
                          {routineItems.indexOf(item) + 1}
                        </span>
                        <span className="min-w-0 break-words leading-5">{item}</span>
                      </div>
                    ))}
                  </div>
                </details>

                <div className="mt-4 space-y-3">
                  <Button
                    href={primaryHref}
                    variant="accent"
                    className="w-full shadow-[0_16px_36px_rgba(213,30,113,0.24)]"
                  >
                    {primaryLabel}
                  </Button>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Button
                      href={primaryHref}
                      variant="secondary"
                      className="border-[rgba(216,160,172,0.32)] bg-white/72 text-[#1E1E1E] shadow-none hover:bg-white"
                    >
                      Montar rotina
                    </Button>
                    <Button
                      href="/catalogo"
                      variant="secondary"
                      className="border-[rgba(216,160,172,0.32)] bg-white/72 text-[#1E1E1E] shadow-none hover:bg-white"
                    >
                      Explorar produtos
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
