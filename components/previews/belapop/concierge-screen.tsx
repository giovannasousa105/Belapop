/* eslint-disable @next/next/no-img-element */

import {
  BookOpenText,
  CalendarDays,
  Dot,
  MessageCircle,
  Mic,
  MoreHorizontal,
  Paperclip,
  Send,
  ShoppingBag,
  Sparkles,
  X
} from "lucide-react";
import Link from "next/link";

import { LuxuryPreviewFrame } from "./luxury-preview-frame";
import { previewHeadlineFont } from "./luxury-preview-theme";
import {
  getBelapopHref,
  getBelapopProductHref,
  type BelapopRenderMode
} from "./routes";

const evidenceSources = ["COCHRANE", "AAD LIBRARY", "PUBMED CENTRAL", "UPTODATE", "JAMA DERMATOLOGY"];

const biometricBars = [
  { label: "Hidratacao", valueLabel: "84%", width: "84%", accent: true },
  { label: "Sensibilidade", valueLabel: "Baixa", width: "20%", accent: false }
] as const;

type DiagnosticMetric = {
  label: string;
  value: number;
  accent: boolean;
  note?: string;
};

const diagnostics: DiagnosticMetric[] = [
  { label: "Hidratacao", value: 68, accent: true, note: "Critico: baixa umidade." },
  { label: "Elasticidade", value: 84, accent: false },
  { label: "Luminosidade", value: 92, accent: false }
];

const suggestedPrompts = [
  "Como tratar minha sensibilidade?",
  "Quais ativos a Cochrane recomenda para poros?",
  "Ver rotina completa"
] as const;

const evidenceNotes = [
  {
    title: "Acido Hialuronico Topico vs Ambientes de Alta Altitude",
    source: "J Dermatol Sci (2023)"
  },
  {
    title: "Sintese de Ceramida-3 em Poluentes Urbanos",
    source: "Clin Cosmet Investig (2024)"
  }
] as const;

type ConciergePreviewScreenProps = {
  mode?: BelapopRenderMode;
};

export function ConciergePreviewScreen({ mode = "preview" }: ConciergePreviewScreenProps) {
  return (
    <LuxuryPreviewFrame activeItem="Skin Scan Bela" mode={mode}>
      <main className="bg-[#fcf9f8] pt-[72px]">
        <section className="mx-auto max-w-[1600px] px-4 pb-16 pt-10 sm:px-6 lg:px-8 lg:pb-24">
          <header className="mb-10 sm:mb-12">
            <p className="mb-4 text-[11px] uppercase tracking-[0.3em] text-[#ef75ce]">
              Relatorio de Diagnostico IA
            </p>
            <h1
              className={`${previewHeadlineFont.className} text-4xl font-black leading-[0.96] tracking-[-0.05em] sm:text-5xl lg:text-6xl`}
            >
              CONCIERGE <span className="italic text-[#ef75ce]">SkinBela</span>
            </h1>
          </header>

          <div className="flex flex-col gap-8 xl:flex-row xl:items-start">
            <aside className="order-2 w-full xl:order-1 xl:w-[30%] xl:max-w-[420px]">
              <div className="space-y-6 xl:sticky xl:top-28">
                <section className="border-t-2 border-t-[#ef75ce] bg-white p-5 shadow-[0_24px_60px_rgba(0,0,0,0.08)] sm:p-6">
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <h3
                      className={`${previewHeadlineFont.className} text-sm font-bold uppercase tracking-[0.24em]`}
                    >
                      Resumo Biometrico
                    </h3>
                    <span className="bg-[#f0eded] px-2 py-1 text-[9px] uppercase tracking-[0.2em] text-[#747878]">
                      BP-99281
                    </span>
                  </div>

                  <div className="mb-6 flex gap-4">
                    <div className="h-32 w-24 shrink-0 overflow-hidden bg-[#f0eded]">
                      <img
                        alt="biometric scan portrait"
                        className="h-full w-full object-cover grayscale brightness-110"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDYVol3XJrKccjU4GSLRXVyVMtWrZK6hYlsGx05e1VyFT9CelEcbTk2JbDqxYuJ4NrKVpJHetf0U0PtEXGOmv01JIXdq6CWoO9OsFFJeGa7DdWqs_j7kcftNqy8xJLrWDrTctl1iQoSXrRMmFjl5Eu3zRA_N8xzVDZrlkgPePQN6u7AL95UjaIAUiQuIQf36kP4sGl0yLBKkNes_0qD8FCeSbPyQKcW5YpyhZvy2zHTqtcrZsZ4tK9XrZ6ADUPkegs87Tz2YYYhjav4"
                      />
                    </div>

                    <div className="flex flex-1 flex-col justify-center gap-4">
                      {biometricBars.map((metric) => (
                        <div key={metric.label}>
                          <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-[#747878]">
                            <span>{metric.label}</span>
                            <span className={metric.accent ? "font-bold text-[#ef75ce]" : "font-bold text-black"}>
                              {metric.valueLabel}
                            </span>
                          </div>
                          <div className="h-[1px] bg-[#eae7e7]">
                            <div
                              className={`h-[1px] ${metric.accent ? "bg-[#ef75ce]" : "bg-black"}`}
                              style={{ width: metric.width }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-black/8 pt-4">
                    <p className="mb-4 text-[11px] leading-6 text-[#444748]">
                      Seu diagnostico indica uma barreira cutanea preservada, com necessidade de
                      manutencao antioxidante para otimizar textura e brilho.
                    </p>
                    <a
                      href="#"
                      className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-black transition-colors hover:text-[#ef75ce]"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Ver scanner completo
                    </a>
                  </div>
                </section>

                <section className="bg-black p-5 text-white shadow-[0_24px_60px_rgba(0,0,0,0.08)] sm:p-6">
                  <p className="mb-4 text-[9px] uppercase tracking-[0.3em] text-gray-500">
                    Fontes Prioritarias de Evidencia
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {evidenceSources.map((source) => (
                      <span
                        key={source}
                        className="border border-white/10 px-2 py-1 text-[9px] font-bold tracking-tight text-gray-300"
                      >
                        {source}
                      </span>
                    ))}
                  </div>
                </section>
              </div>
            </aside>

            <section className="order-1 w-full xl:order-2 xl:w-[70%]">
              <div className="flex min-h-[720px] flex-col overflow-hidden bg-white shadow-[0_24px_60px_rgba(0,0,0,0.08)] xl:h-[750px]">
                <header className="flex flex-col gap-4 border-b border-black/8 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8 sm:py-6">
                  <div className="flex items-center gap-4">
                    <div className="relative flex h-6 w-6 items-center justify-center">
                      <span className="absolute inline-flex h-6 w-6 rounded-full bg-[#ef75ce]/20 animate-ping" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-[#ef75ce]" />
                    </div>
                    <div>
                      <h2 className={`${previewHeadlineFont.className} text-lg font-black uppercase tracking-tight`}>
                        SkinBela Assistant
                      </h2>
                      <p className="text-[10px] uppercase tracking-[0.24em] text-[#747878]">
                        Concierge de inteligencia dermatologica
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-[#747878]">
                    <button className="inline-flex h-11 w-11 items-center justify-center border border-black/8 transition-colors hover:text-black">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                    <button className="inline-flex h-11 w-11 items-center justify-center border border-black/8 transition-colors hover:text-black">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </header>

                <div className="flex-1 overflow-y-auto bg-[#fcf9f8]/70 px-4 py-5 sm:px-6 lg:px-8">
                  <div className="space-y-8">
                    <div className="flex flex-col items-start">
                      <div className="max-w-[92%] border-l-2 border-l-[#ef75ce] bg-white p-5 shadow-[0_20px_50px_rgba(0,0,0,0.06)] sm:max-w-[85%] sm:p-6">
                        <p className={`${previewHeadlineFont.className} mb-2 text-lg leading-8 text-black`}>
                          Bem-vinda de volta, Leticia. Analisei sua atualizacao biometrica de hoje.
                        </p>
                        <p className="text-sm leading-7 text-[#444748]">
                          Sua hidratacao subiu <span className="font-bold text-[#ef75ce]">12%</span>{" "}
                          desde a ultima semana. Com base nos niveis atuais e na literatura da{" "}
                          <span className="italic">Cochrane Library</span>, recomendo um ajuste
                          fino na rotina noturna.
                        </p>
                      </div>
                      <span className="mt-2 ml-1 text-[9px] uppercase tracking-[0.2em] text-[#747878]">
                        SkinBela / Agora
                      </span>
                    </div>

                    <div className="flex flex-col items-end">
                      <div className="max-w-[88%] bg-black p-4 text-white sm:max-w-[70%] sm:p-5">
                        <p className="text-sm leading-7">
                          Gostaria de algo para otimizar meus poros e manter esse brilho radiante.
                          Alguma recomendacao especifica?
                        </p>
                      </div>
                      <span className="mt-2 mr-1 text-[9px] uppercase tracking-[0.2em] text-[#747878]">
                        Voce / 2 min atras
                      </span>
                    </div>

                    <div className="flex flex-col items-start">
                      <div className="max-w-[92%] space-y-4 border-l-2 border-l-[#ef75ce] bg-white p-5 shadow-[0_20px_50px_rgba(0,0,0,0.06)] sm:max-w-[85%] sm:p-6">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 fill-[#ef75ce] text-[#ef75ce]" />
                          <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#ef75ce]">
                            Analise Baseada em Evidencia
                          </span>
                        </div>

                        <p className={`${previewHeadlineFont.className} text-lg leading-8`}>
                          Para o seu perfil, o uso de micro nutrientes encapsulados e o
                          padrao-ouro.
                        </p>

                        <p className="text-sm leading-7 text-[#444748]">
                          Ensaios clinicos publicados no <span className="italic">JAMA Dermatology</span>{" "}
                          sugerem que acido hialuronico fragmentado combinado com extratos
                          botanicos de alta pureza melhora a textura em ate 22% em 4 semanas.
                        </p>

                        <article className="group mt-2 flex flex-col gap-4 border border-black/8 bg-[#fcf9f8] p-4 sm:flex-row sm:items-center sm:gap-5">
                          <div className="h-24 w-24 shrink-0 overflow-hidden">
                            <img
                              alt="Chanel Hydra Beauty Serum"
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAkPSPvhW1sBuGfYdUMIElLuh8bkt3zONeqZBUVuS9owpMjzB48suyVWXBa6PsdYOlJqYcv2LRpiRSaiPSXg3s-vbZzksJXir6GndDxfb_Rsd7_waQ7mExCdLUmTrnL-tv20chreospOXbmHnIc-qluRCvqwnnhkXfQbR-Dq52volsm8t41GolokgwI1nYLdwQNkAw4CgjVR6YVL2Cs71FlSJN87BV_d9Mp_wTvR33G9QqzgKf-lHdHAu1cVa-FkXbRM1iGVpucGhW9"
                            />
                          </div>

                          <div className="flex flex-1 flex-col gap-2">
                            <div>
                              <h4
                                className={`${previewHeadlineFont.className} text-xs font-bold uppercase tracking-[0.22em] text-black`}
                              >
                                CHANEL
                              </h4>
                              <p className="mt-1 text-sm text-[#444748]">Hydra Beauty Micro Serum</p>
                              <p className={`${previewHeadlineFont.className} mt-1 text-lg font-bold`}>
                                R$ 890,00
                              </p>
                            </div>
                            <Link
                              href={getBelapopProductHref(mode)}
                              className="inline-flex min-h-11 self-start bg-black px-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-white transition-colors hover:bg-[#ef75ce]"
                            >
                              Comprar
                            </Link>
                          </div>
                        </article>
                      </div>

                      <span className="mt-2 ml-1 text-[9px] uppercase tracking-[0.2em] text-[#747878]">
                        SkinBela / Agora
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-3 pt-1">
                      {suggestedPrompts.map((prompt, index) => (
                        <button
                          key={prompt}
                          className={`min-h-11 px-4 text-[10px] font-bold uppercase tracking-[0.2em] ${
                            index === 2
                              ? "border border-[#ef75ce] bg-white text-[#ef75ce]"
                              : "border border-black/8 bg-white text-black transition-colors hover:border-[#ef75ce] hover:text-[#ef75ce]"
                          }`}
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <footer className="border-t border-black/8 bg-white p-4 sm:p-6">
                  <div className="relative flex items-end gap-3">
                    <div className="relative flex-1">
                      <input
                        className="min-h-14 w-full border border-black/8 bg-[#f6f3f2] px-5 py-4 pr-28 text-sm placeholder:italic placeholder:text-[#747878] focus:outline-none focus:ring-0"
                        placeholder="Pergunte ao SkinBela sobre sua rotina..."
                        type="text"
                      />
                      <div className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center gap-3 text-[#747878]">
                        <Paperclip className="h-4 w-4 transition-colors hover:text-[#ef75ce]" />
                        <Mic className="h-4 w-4 transition-colors hover:text-[#ef75ce]" />
                      </div>
                    </div>
                    <button className="flex h-14 w-14 shrink-0 items-center justify-center bg-black text-white transition-colors hover:bg-[#ef75ce]">
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-4 text-center text-[9px] uppercase tracking-[0.2em] text-[#747878]">
                    O Concierge SkinBela e um assistente guiado por ciencia. Consulte um dermatologista.
                  </p>
                </footer>
              </div>
            </section>

            <aside className="order-3 w-full xl:w-[320px] xl:flex-shrink-0">
              <div className="space-y-6">
                <section className="bg-white p-5 shadow-[0_20px_50px_rgba(0,0,0,0.06)] sm:p-6">
                  <div className="flex items-end justify-between gap-4">
                    <h3 className={`${previewHeadlineFont.className} text-2xl font-bold`}>
                      Diagnostico recente
                    </h3>
                    <span className="text-[9px] uppercase tracking-[0.2em] text-[#747878]">2h atras</span>
                  </div>

                  <div className="mt-6 space-y-6">
                    {diagnostics.map((metric) => (
                      <div key={metric.label}>
                        <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em]">
                          <span>{metric.label}</span>
                          <span className={metric.accent ? "text-[#ef75ce]" : ""}>
                            {metric.value}/100
                          </span>
                        </div>
                        <div className="h-1 bg-[#e5e2e1]">
                          <div
                            className={`h-1 ${metric.accent ? "bg-[#ef75ce]" : "bg-black"}`}
                            style={{ width: `${metric.value}%` }}
                          />
                        </div>
                        {metric.note ? (
                          <p className="mt-2 text-[10px] italic text-[#747878]">{metric.note}</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </section>

                <section className="bg-white p-5 shadow-[0_20px_50px_rgba(0,0,0,0.06)] sm:p-6">
                  <h3 className="border-b border-black/8 pb-3 text-[10px] font-bold uppercase tracking-[0.24em]">
                    Diario de evidencias
                  </h3>
                  <div className="mt-5 space-y-4">
                    {evidenceNotes.map((item) => (
                      <div key={item.title} className="space-y-1">
                        <div className="flex items-start gap-3">
                          <BookOpenText className="mt-0.5 h-4 w-4 text-[#ef75ce]" />
                          <p className="text-[11px] font-bold uppercase leading-5">{item.title}</p>
                        </div>
                        <p className="pl-7 text-[9px] uppercase tracking-[0.18em] text-[#747878]">
                          {item.source}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="bg-[#f6f3f2] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.06)] sm:p-6">
                  <div className="flex items-center gap-3">
                    <CalendarDays className="h-5 w-5 text-[#ef75ce]" />
                    <h3 className={`${previewHeadlineFont.className} text-xl font-bold`}>
                      Nota do concierge
                    </h3>
                  </div>
                  <p className="mt-4 text-sm italic leading-7 text-[#444748]">
                    Sua limpeza de pele exclusiva no atelier Mayfair acontece amanha as 11:00.
                    O especialista ja recebeu os dados desta sessao.
                  </p>
                  <button className="mt-5 min-h-12 w-full bg-black px-5 text-[10px] font-bold uppercase tracking-[0.22em] text-white transition-colors hover:bg-[#ef75ce]">
                    Gerenciar reserva
                  </button>
                </section>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </LuxuryPreviewFrame>
  );
}
