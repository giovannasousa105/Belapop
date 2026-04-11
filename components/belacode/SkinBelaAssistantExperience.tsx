"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import {
  ArrowUpRight,
  BookOpenText,
  Mic,
  Paperclip,
  ScanFace,
  SendHorizontal,
  ShieldCheck,
  Sparkles,
  WandSparkles
} from "lucide-react";

import { SkinScanLuxuryShell } from "@/components/popclub/skin-scan/SkinScanLuxuryShell";
import { popClubPaths } from "@/lib/popclub/navigation";

const profileMetrics = [
  { label: "Hidratacao", value: "84%", width: "84%", accent: true },
  { label: "Sensibilidade", value: "Baixa", width: "20%", accent: false },
  { label: "Textura", value: "Suave", width: "92%", accent: true }
] as const;

const evidenceSources = [
  "COCHRANE",
  "AAD LIBRARY",
  "PUBMED CENTRAL",
  "UPTODATE",
  "JAMA DERMATOLOGY"
] as const;

const promptSuggestions = [
  "Como tratar minha sensibilidade?",
  "Quais ativos funcionam melhor para poros?",
  "Ver rotina completa"
] as const;

const recommendedProduct = {
  brand: "CHANEL",
  title: "Hydra Beauty Micro Serum",
  price: "R$ 890,00",
  image:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAkPSPvhW1sBuGfYdUMIElLuh8bkt3zONeqZBUVuS9owpMjzB48suyVWXBa6PsdYOlJqYcv2LRpiRSaiPSXg3s-vbZzksJXir6GndDxfb_Rsd7_waQ7mExCdLUmTrnL-tv20chreospOXbmHnIc-qluRCvqwnnhkXfQbR-Dq52volsm8t41GolokgwI1nYLdwQNkAw4CgjVR6YVL2Cs71FlSJN87BV_d9Mp_wTvR33G9QqzgKf-lHdHAu1cVa-FkXbRM1iGVpucGhW9"
} as const;

export function SkinBelaAssistantExperience() {
  return (
    <SkinScanLuxuryShell>
      <div className="mx-auto max-w-[1600px] px-4 pb-20 pt-10 sm:px-6 lg:px-8 lg:pb-24 lg:pt-14">
        <header className="mb-10 space-y-5 lg:mb-12">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#ef75ce]">
            Relatorio de diagnostico IA
          </p>
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <h1 className="font-headline text-5xl font-black leading-[0.95] tracking-[-0.05em] lg:text-7xl">
                Concierge
                <span className="block italic text-[#ef75ce]">SkinBela</span>
              </h1>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-[#444748] lg:text-base">
              Conversa guiada pela sua pele, pelo seu diagnostico mais recente e por fontes
              clinicas priorizadas com criterio editorial.
            </p>
          </div>
        </header>

        <div className="grid gap-8 xl:grid-cols-[minmax(320px,0.35fr)_minmax(0,0.65fr)] xl:items-start">
          <aside className="space-y-6 xl:sticky xl:top-28">
            <section className="overflow-hidden border-t-2 border-[#ef75ce] bg-white shadow-[0_22px_60px_rgba(28,27,27,0.08)]">
              <div className="p-6 sm:p-7">
                <div className="mb-6 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.28em] text-[#444748]/70">
                      Resumo biometrico
                    </p>
                    <h2 className="mt-2 font-headline text-xl">BP-99281</h2>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#ef75ce]/20 bg-[#ef75ce]/8 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-[#ef75ce]">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Seguro
                  </span>
                </div>

                <div className="flex gap-4">
                  <div className="h-32 w-24 shrink-0 overflow-hidden bg-[#f0eded]">
                    <img
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDYVol3XJrKccjU4GSLRXVyVMtWrZK6hYlsGx05e1VyFT9CelEcbTk2JbDqxYuJ4NrKVpJHetf0U0PtEXGOmv01JIXdq6CWoO9OsFFJeGa7DdWqs_j7kcftNqy8xJLrWDrTctl1iQoSXrRMmFjl5Eu3zRA_N8xzVDZrlkgPePQN6u7AL95UjaIAUiQuIQf36kP4sGl0yLBKkNes_0qD8FCeSbPyQKcW5YpyhZvy2zHTqtcrZsZ4tK9XrZ6ADUPkegs87Tz2YYYhjav4"
                      alt="Retrato biometrico"
                      className="h-full w-full object-cover grayscale"
                    />
                  </div>

                  <div className="min-w-0 flex-1 space-y-4">
                    {profileMetrics.map((metric) => (
                      <div key={metric.label}>
                        <div className="mb-1 flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.22em] text-[#444748]">
                          <span>{metric.label}</span>
                          <span className={metric.accent ? "font-bold text-[#ef75ce]" : "font-bold text-black"}>
                            {metric.value}
                          </span>
                        </div>
                        <div className="h-[2px] w-full bg-[#e5e2e1]">
                          <div
                            className={`h-full ${metric.accent ? "bg-[#ef75ce]" : "bg-black"}`}
                            style={{ width: metric.width }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 border-t border-black/8 pt-5">
                  <p className="text-sm leading-relaxed text-[#444748]">
                    Sua pele esta com barreira preservada, boa textura geral e espaco para refino
                    antioxidante no periodo noturno.
                  </p>
                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <Link
                      href={popClubPaths.skinScanDiagnosis}
                      className="inline-flex min-h-12 items-center justify-center gap-2 border border-black/10 bg-[#fcf9f8] px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-black transition hover:border-black/20 hover:bg-[#f6f3f2]"
                    >
                      <ScanFace className="h-4 w-4" />
                      Ver diagnostico
                    </Link>
                    <Link
                      href={popClubPaths.skinScanRoutine}
                      className="inline-flex min-h-12 items-center justify-center gap-2 bg-black px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#1c1b1b]"
                    >
                      Ver rotina
                    </Link>
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-black p-6 text-white shadow-[0_22px_60px_rgba(28,27,27,0.14)] sm:p-7">
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/48">
                Fontes prioritarias
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {evidenceSources.map((source) => (
                  <span
                    key={source}
                    className="border border-white/10 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/82"
                  >
                    {source}
                  </span>
                ))}
              </div>
              <p className="mt-5 text-sm leading-relaxed text-white/72">
                Quando houver fonte disponivel, o concierge prioriza revisoes sistematicas,
                meta-analises, ensaios randomizados e diretrizes dermatologicas.
              </p>
            </section>
          </aside>

          <section className="min-w-0 overflow-hidden bg-white shadow-[0_26px_70px_rgba(28,27,27,0.08)]">
            <div className="flex items-center justify-between gap-4 border-b border-black/8 px-5 py-5 sm:px-7 lg:px-8">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <span className="relative inline-flex h-3 w-3">
                    <span className="absolute inset-0 rounded-full bg-[#ef75ce] opacity-40 animate-ping" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-[#ef75ce]" />
                  </span>
                  <h2 className="font-headline text-xl uppercase tracking-[0.08em] sm:text-2xl">
                    SkinBela Assistant
                  </h2>
                </div>
                <p className="mt-2 text-[10px] uppercase tracking-[0.24em] text-[#444748]/72">
                  Concierge de inteligencia dermatologica
                </p>
              </div>

              <span className="hidden rounded-full border border-[#ef75ce]/20 bg-[#ef75ce]/8 px-3 py-2 text-[10px] uppercase tracking-[0.22em] text-[#ef75ce] sm:inline-flex">
                Sessao ativa
              </span>
            </div>

            <div className="bg-[#fbf8f7] p-5 sm:p-7 lg:p-8 xl:h-[760px] xl:overflow-y-auto">
              <div className="space-y-7">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-white">
                    <WandSparkles className="h-5 w-5" />
                  </div>
                  <div className="max-w-3xl rounded-[28px] rounded-tl-none border-l-2 border-[#ef75ce] bg-white p-5 shadow-[0_18px_44px_rgba(28,27,27,0.06)] sm:p-6">
                    <p className="font-headline text-xl leading-snug text-black">
                      Bem-vinda de volta. Analisei sua atualizacao biometrica de hoje.
                    </p>
                    <p className="mt-4 text-sm leading-relaxed text-[#444748]">
                      Sua hidratacao subiu <strong className="text-[#ef75ce]">12%</strong> desde a
                      ultima leitura. Com base no seu perfil atual e em literatura clinica sobre
                      barreira lipidica, vale reforcar antioxidantes e modular a limpeza noturna.
                    </p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <span className="inline-flex min-h-10 items-center gap-2 bg-[#f6f3f2] px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-black">
                        <BookOpenText className="h-3.5 w-3.5 text-[#ef75ce]" />
                        Cochrane priority
                      </span>
                      <span className="inline-flex min-h-10 items-center gap-2 bg-[#f6f3f2] px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-black">
                        <ShieldCheck className="h-3.5 w-3.5 text-[#ef75ce]" />
                        Evidencia revisada
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start justify-end gap-3 sm:gap-4">
                  <div className="max-w-2xl rounded-[28px] rounded-tr-none bg-black p-5 text-white shadow-[0_18px_44px_rgba(28,27,27,0.12)] sm:p-6">
                    <p className="text-sm leading-relaxed sm:text-base">
                      Gostaria de algo para otimizar meus poros e manter esse brilho radiante.
                      Existe um serum com melhor encaixe para meu perfil?
                    </p>
                  </div>
                  <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#ef75ce] text-white">
                    <Sparkles className="h-5 w-5" />
                  </div>
                </div>

                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-white">
                    <WandSparkles className="h-5 w-5" />
                  </div>
                  <div className="max-w-3xl rounded-[28px] rounded-tl-none border-l-2 border-[#ef75ce] bg-white p-5 shadow-[0_18px_44px_rgba(28,27,27,0.06)] sm:p-6">
                    <div className="mb-4 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#ef75ce]">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Analise baseada em evidencia
                    </div>
                    <p className="font-headline text-xl leading-snug text-black">
                      Para o seu perfil, micro-nutrientes encapsulados e hidratacao em camadas sao
                      o encaixe mais solido agora.
                    </p>
                    <p className="mt-4 text-sm leading-relaxed text-[#444748]">
                      Estudos publicados em revistas dermatologicas sugerem melhora relevante de
                      textura quando acido hialuronico fragmentado e antioxidantes suaves entram em
                      uma rotina consistente por quatro semanas.
                    </p>

                    <div className="mt-6 border border-black/8 bg-[#fcf9f8] p-4 sm:p-5">
                      <div className="flex flex-col gap-4 sm:flex-row">
                        <div className="h-28 w-full shrink-0 overflow-hidden bg-[#f0eded] sm:h-28 sm:w-28">
                          <img
                            src={recommendedProduct.image}
                            alt={recommendedProduct.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col justify-between gap-4">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#444748]/70">
                              {recommendedProduct.brand}
                            </p>
                            <h3 className="mt-2 font-headline text-2xl leading-none text-black">
                              {recommendedProduct.title}
                            </h3>
                            <p className="mt-3 font-headline text-xl font-bold text-black">
                              {recommendedProduct.price}
                            </p>
                          </div>
                          <div className="flex flex-col gap-3 sm:flex-row">
                            <Link
                              href="/checkout"
                              className="inline-flex min-h-12 items-center justify-center bg-black px-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#ef75ce]"
                            >
                              Comprar
                            </Link>
                            <Link
                              href={popClubPaths.skinScanRoutine}
                              className="inline-flex min-h-12 items-center justify-center gap-2 border border-black/10 bg-white px-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-black transition hover:border-black/20 hover:bg-[#f6f3f2]"
                            >
                              Ver rotina
                              <ArrowUpRight className="h-4 w-4" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-1">
                  {promptSuggestions.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      className={`min-h-12 border px-4 text-left text-[11px] font-semibold uppercase tracking-[0.18em] transition ${
                        prompt === "Ver rotina completa"
                          ? "border-[#ef75ce] bg-white text-[#ef75ce] hover:bg-[#ef75ce] hover:text-white"
                          : "border-black/8 bg-white text-black hover:border-black/16 hover:bg-[#f6f3f2]"
                      }`}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <footer className="border-t border-black/8 bg-white p-5 sm:p-7 lg:p-8">
              <div className="relative">
                <textarea
                  rows={3}
                  placeholder="Pergunte ao SkinBela sobre sua rotina, ativos ou combinacoes para hoje..."
                  className="min-h-32 w-full resize-none border border-black/8 bg-[#fcf9f8] px-5 py-4 pr-28 text-sm leading-relaxed text-black placeholder:text-[#444748]/50 focus:border-[#ef75ce] focus:outline-none"
                />
                <div className="absolute bottom-4 right-4 flex items-center gap-3 text-[#444748]">
                  <button type="button" aria-label="Anexar" className="transition hover:text-black">
                    <Paperclip className="h-4 w-4" />
                  </button>
                  <button type="button" aria-label="Microfone" className="transition hover:text-black">
                    <Mic className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Enviar"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black text-white transition hover:bg-[#ef75ce]"
                  >
                    <SendHorizontal className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="mt-4 text-center text-[10px] uppercase tracking-[0.22em] text-[#444748]/62">
                O concierge SkinBela orienta com base em ciencia, mas nao substitui avaliacao de
                um dermatologista.
              </p>
            </footer>
          </section>
        </div>
      </div>
    </SkinScanLuxuryShell>
  );
}
