"use client";

/* eslint-disable react-hooks/static-components */
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { Camera, CircleDot, Droplets, ScanFace, ShieldCheck, Sparkles, X } from "lucide-react";
import type { ReactNode } from "react";

import { LuxuryPreviewFrame } from "./luxury-preview-frame";
import {
  previewHeadlineFont,
  previewPrimaryButtonClass,
  previewSecondaryButtonClass
} from "./luxury-preview-theme";
import { getBelapopHref, type BelapopRenderMode } from "./routes";

type RealtimeMetric = {
  label: string;
  value: string;
  supporting?: string;
};

const realtimeMetrics: RealtimeMetric[] = [
  { label: "Poros", value: "Minimos" },
  { label: "Hidratacao", value: "84%", supporting: "Alta" },
  { label: "Sensibilidade", value: "Baixa" }
] as const;

const scanStats = [
  { label: "Iluminacao", value: "Otima" },
  { label: "Alinhamento", value: "98%" }
] as const;

const captureSignals = [
  {
    title: "Analise molecular",
    description: "Mapeamento de textura, micro relevo e sinais de sensibilidade em tempo real.",
    icon: ScanFace
  },
  {
    title: "Privacidade elevada",
    description: "Processamento efemero, sem persistencia de imagem sem seu consentimento.",
    icon: ShieldCheck
  }
] as const;

type ScanScreenTwoProps = {
  mode?: BelapopRenderMode;
  embedInPage?: boolean;
};

export function ScanScreenTwo({ mode = "preview", embedInPage = false }: ScanScreenTwoProps) {
  const Wrapper = ({
    children
  }: {
    children: ReactNode;
  }) =>
    embedInPage ? (
      <>{children}</>
    ) : (
      <LuxuryPreviewFrame activeItem="Skin Scan Bela" mode={mode}>
        {children}
      </LuxuryPreviewFrame>
    );

  return (
    <Wrapper>
      <div className={`bg-[#fcf9f8] ${embedInPage ? "" : "pt-[72px]"}`}>
        <section className="mx-auto max-w-[1600px] px-4 pb-16 pt-8 sm:px-6 lg:px-8 lg:pb-24 lg:pt-14">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-16">
            <div className="order-2 lg:order-1 lg:col-span-4">
              <div className="space-y-8">
                <div className="space-y-4">
                  <span className="block text-xs uppercase tracking-[0.3em] text-[#ef75ce]">
                    Biometria BelaPop
                  </span>
                  <h1
                    className={`${previewHeadlineFont.className} text-4xl font-bold leading-[1.05] tracking-[-0.05em] sm:text-5xl lg:text-6xl`}
                  >
                    SCAN EM
                    <br />
                    CURSO
                  </h1>
                </div>

                <p className="max-w-md text-base leading-8 text-[#444748] sm:text-lg">
                  Posicione seu rosto dentro da moldura para uma leitura profunda de hidratacao,
                  textura e equilibrio da barreira cutanea. A experiencia foi ajustada para
                  funcionar primeiro no celular, sem perder a presenca editorial no desktop.
                </p>

                <div className="flex flex-col gap-3 pt-2 sm:flex-row lg:flex-col xl:flex-row">
                  <Link
                    href={getBelapopHref(mode, "diagnostico")}
                    className={`${previewPrimaryButtonClass} w-full active:scale-[0.99] sm:w-auto lg:w-full xl:w-auto`}
                  >
                    CAPTURAR
                    <Camera className="h-4 w-4" />
                  </Link>
                  <Link
                    href={getBelapopHref(mode, "scan")}
                    className={`${previewSecondaryButtonClass} w-full active:scale-[0.99] sm:w-auto lg:w-full xl:w-auto`}
                  >
                    CANCELAR
                    <X className="h-4 w-4" />
                  </Link>
                </div>

                <div className="grid grid-cols-2 gap-px overflow-hidden bg-black/10 shadow-[0_24px_60px_rgba(0,0,0,0.08)]">
                  {scanStats.map((stat) => (
                    <div key={stat.label} className="bg-[#fcf9f8] p-5 sm:p-6">
                      <p className="mb-1 text-[10px] uppercase tracking-[0.24em] text-[#747878]">
                        {stat.label}
                      </p>
                      <p className={`${previewHeadlineFont.className} text-xl font-bold sm:text-2xl`}>
                        {stat.value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="space-y-4 border-t border-black/8 pt-6">
                  {captureSignals.map((item) => {
                    const Icon = item.icon;

                    return (
                      <div key={item.title} className="flex gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-[#f0eded]">
                          <Icon className="h-5 w-5 text-black" />
                        </div>
                        <div>
                          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.24em]">
                            {item.title}
                          </p>
                          <p className="text-sm leading-7 text-[#444748]">{item.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2 lg:col-span-8">
              <div className="relative mx-auto w-full max-w-[760px]">
                <div className="group relative overflow-hidden bg-[#e5e2e1] shadow-[0_30px_80px_rgba(0,0,0,0.12)]">
                  <div className="aspect-[4/5]">
                    <img
                      alt="Close-up editorial beauty photography of a young woman's face for skincare analysis"
                      className="h-full w-full object-cover object-center grayscale-[10%] transition-transform duration-[2000ms] group-hover:scale-[1.04]"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDYVol3XJrKccjU4GSLRXVyVMtWrZK6hYlsGx05e1VyFT9CelEcbTk2JbDqxYuJ4NrKVpJHetf0U0PtEXGOmv01JIXdq6CWoO9OsFFJeGa7DdWqs_j7kcftNqy8xJLrWDrTctl1iQoSXrRMmFjl5Eu3zRA_N8xzVDZrlkgPePQN6u7AL95UjaIAUiQuIQf36kP4sGl0yLBKkNes_0qD8FCeSbPyQKcW5YpyhZvy2zHTqtcrZsZ4tK9XrZ6ADUPkegs87Tz2YYYhjav4"
                    />
                  </div>

                  <div className="absolute inset-0 bg-black/10" />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 opacity-30"
                    style={{
                      backgroundImage:
                        "linear-gradient(rgba(239,117,206,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(239,117,206,0.08) 1px, transparent 1px)",
                      backgroundSize: "40px 40px"
                    }}
                  />

                  <div className="absolute left-4 top-4 z-30 flex items-center gap-3 bg-black/45 px-4 py-3 text-white backdrop-blur-md sm:left-6 sm:top-6">
                    <CircleDot className="h-4 w-4 text-[#ef75ce]" />
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.34em] text-white/60">
                        Sessao ativa
                      </p>
                      <p className="text-xs font-medium tracking-[0.24em] text-[#ef75ce]">
                        00:00:24:12
                      </p>
                    </div>
                  </div>

                  <div className="absolute inset-0 z-10">
                    <div className="absolute left-4 top-4 h-12 w-12 border-l-2 border-t-2 border-white/80 sm:left-8 sm:top-8 sm:h-16 sm:w-16" />
                    <div className="absolute right-4 top-4 h-12 w-12 border-r-2 border-t-2 border-white/80 sm:right-8 sm:top-8 sm:h-16 sm:w-16" />
                    <div className="absolute bottom-4 left-4 h-12 w-12 border-b-2 border-l-2 border-white/80 sm:bottom-8 sm:left-8 sm:h-16 sm:w-16" />
                    <div className="absolute bottom-4 right-4 h-12 w-12 border-b-2 border-r-2 border-white/80 sm:bottom-8 sm:right-8 sm:h-16 sm:w-16" />
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center px-6 sm:px-10">
                    <div className="relative h-[70%] w-[84%] rounded-[999px] border border-white/20">
                      <div className="absolute inset-3 rounded-[999px] border border-[#ef75ce]/45" />
                      <div className="absolute inset-0 rounded-[999px] border-2 border-[#ef75ce]/10 animate-pulse" />
                      <div className="scan-point absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ef75ce]" />
                      <div className="scan-point-delayed absolute bottom-0 left-1/2 h-2 w-2 -translate-x-1/2 translate-y-1/2 rounded-full bg-white/80" />
                    </div>
                  </div>

                  <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="scan-beam absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-transparent via-[#ef75ce]/25 to-transparent" />
                    <div className="scan-line absolute inset-x-0 top-0 h-[2px] bg-[#ef75ce]" />
                  </div>

                  <div className="scan-point absolute left-[29%] top-[28%] z-20 h-2 w-2 rounded-full bg-[#ef75ce]" />
                  <div className="scan-point-delayed absolute left-[46%] top-[38%] z-20 h-3 w-3 rounded-full bg-[#ef75ce]" />
                  <div className="scan-point-soft absolute right-[29%] top-[55%] z-20 h-2 w-2 rounded-full bg-white" />
                  <div className="scan-point-delayed absolute bottom-[26%] left-[36%] z-20 h-2 w-2 rounded-full bg-[#ef75ce]" />
                  <div className="scan-point-soft absolute bottom-[24%] right-[38%] z-20 h-2 w-2 rounded-full bg-white/80" />

                  <div className="absolute bottom-4 left-4 z-30 sm:bottom-6 sm:left-6 lg:hidden">
                    <p className="text-[8px] uppercase tracking-[0.42em] text-white/50">
                      Neural Network Active // 5.0.2
                    </p>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 z-30 flex gap-3 overflow-x-auto px-4 pb-4 lg:hidden">
                    {realtimeMetrics.map((metric) => (
                      <div
                        key={metric.label}
                        className="min-w-[140px] shrink-0 bg-black/45 px-4 py-3 text-white backdrop-blur-md"
                      >
                        <p className="mb-1 text-[8px] uppercase tracking-[0.22em] text-[#ef75ce]">
                          {metric.label}
                        </p>
                        <p className={`${previewHeadlineFont.className} text-lg font-bold`}>
                          {metric.value}{" "}
                          {metric.supporting ? (
                            <span className="text-[10px] font-body text-white/60">
                              {metric.supporting}
                            </span>
                          ) : null}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="absolute right-6 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-4 lg:flex">
                    {realtimeMetrics.map((metric) => (
                      <div
                        key={metric.label}
                        className="bg-black/40 px-5 py-4 text-white backdrop-blur-md"
                      >
                        <p className="mb-1 text-[8px] uppercase tracking-[0.22em] text-[#ef75ce]">
                          {metric.label}
                        </p>
                        <p className={`${previewHeadlineFont.className} text-xl font-bold`}>
                          {metric.value}{" "}
                          {metric.supporting ? (
                            <span className="text-[10px] font-body text-white/60">
                              {metric.supporting}
                            </span>
                          ) : null}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="absolute bottom-10 right-[-24px] z-40 hidden xl:block">
                    <p
                      className="text-[10px] uppercase tracking-[0.6em] text-white/30"
                      style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
                    >
                      BelaPop // Digital Atelier 2026
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="border border-black/8 bg-white px-4 py-4">
                    <p className="mb-1 text-[9px] uppercase tracking-[0.28em] text-[#747878]">
                      Alinhamento
                    </p>
                    <p className="text-sm font-semibold">Rosto centralizado</p>
                  </div>
                  <div className="border border-black/8 bg-white px-4 py-4">
                    <p className="mb-1 text-[9px] uppercase tracking-[0.28em] text-[#747878]">
                      Profundidade
                    </p>
                    <p className="text-sm font-semibold">Leitura estavel</p>
                  </div>
                  <div className="border border-black/8 bg-white px-4 py-4">
                    <p className="mb-1 text-[9px] uppercase tracking-[0.28em] text-[#747878]">
                      Barreira
                    </p>
                    <p className="text-sm font-semibold">Protegida</p>
                  </div>
                  <div className="border border-black/8 bg-white px-4 py-4">
                    <p className="mb-1 text-[9px] uppercase tracking-[0.28em] text-[#747878]">
                      Modo do scan
                    </p>
                    <p className="inline-flex items-center gap-2 text-sm font-semibold">
                      <Sparkles className="h-4 w-4 text-[#ef75ce]" />
                      Couture AI
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 rounded-[28px] border border-black/8 bg-[#f6f3f2] p-6 sm:p-8 lg:hidden">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-black text-white">
                <Droplets className="h-5 w-5" />
              </div>
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em]">
                  Leitura em progresso
                </p>
                <p className="text-sm leading-7 text-[#444748]">
                  Mantenha o rosto centralizado por mais alguns segundos. A captura esta quase
                  pronta para seguir ao diagnostico.
                </p>
              </div>
            </div>
          </div>
        </section>

        <style jsx>{`
          @keyframes scanY {
            0%,
            100% {
              transform: translateY(0%);
              opacity: 0.2;
            }
            50% {
              transform: translateY(340%);
              opacity: 0.85;
            }
          }

          @keyframes pulseGlow {
            0%,
            100% {
              transform: scale(1);
              opacity: 0.45;
              box-shadow: 0 0 8px rgba(239, 117, 206, 0.4);
            }
            50% {
              transform: scale(1.45);
              opacity: 1;
              box-shadow: 0 0 24px rgba(239, 117, 206, 0.8);
            }
          }

          @keyframes pulseSoft {
            0%,
            100% {
              transform: scale(1);
              opacity: 0.4;
              box-shadow: 0 0 6px rgba(255, 255, 255, 0.25);
            }
            50% {
              transform: scale(1.25);
              opacity: 0.95;
              box-shadow: 0 0 14px rgba(255, 255, 255, 0.4);
            }
          }

          .scan-beam,
          .scan-line {
            animation: scanY 6s ease-in-out infinite;
          }

          .scan-point {
            animation: pulseGlow 3s ease-in-out infinite;
          }

          .scan-point-delayed {
            animation: pulseGlow 3s ease-in-out infinite;
            animation-delay: 1s;
          }

          .scan-point-soft {
            animation: pulseSoft 3.2s ease-in-out infinite;
            animation-delay: 0.5s;
          }
        `}</style>
      </div>
    </Wrapper>
  );
}
