"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";

import { SkinScanLuxuryShell } from "@/components/popclub/skin-scan/SkinScanLuxuryShell";
import { popClubPaths } from "@/lib/popclub/navigation";

const scanStats = [
  { label: "Iluminacao", value: "Otima" },
  { label: "Alinhamento", value: "98%" }
] as const;

export default function SkinScanCaptureExperience() {
  return (
    <SkinScanLuxuryShell>
      <div className="mx-auto max-w-[1600px] px-6 pb-20 pt-10 lg:px-8 lg:pb-24 lg:pt-14">
        <div className="grid gap-12 xl:grid-cols-[minmax(320px,0.86fr)_minmax(0,1.14fr)] xl:items-center xl:gap-16">
          <section className="order-2 xl:order-1">
            <div className="space-y-8">
              <div className="space-y-4">
                <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#ef75ce]">
                  BelaPop Biometrics
                </span>
                <h1 className="font-headline text-5xl leading-[1.02] tracking-tight lg:text-6xl">
                  Scan em curso
                </h1>
              </div>

              <p className="max-w-md text-lg font-light leading-relaxed text-[#444748]">
                Posicione seu rosto dentro da moldura para uma analise profunda. A IA identifica
                textura, niveis de hidratacao e sinais sutis que orientam a proxima etapa do
                diagnostico.
              </p>

              <div className="flex flex-col gap-4 pt-4 sm:flex-row sm:flex-wrap">
                <Link
                  href={popClubPaths.skinScanResult}
                  className="inline-flex min-h-16 items-center justify-center gap-3 bg-black px-10 text-xs font-bold uppercase tracking-[0.24em] text-white transition hover:bg-[#1c1b1b]"
                >
                  Capturar
                  <span className="text-lg">+</span>
                </Link>
                <Link
                  href={popClubPaths.skinScanFocus}
                  className="inline-flex min-h-16 items-center justify-center border border-black/10 bg-white px-10 text-xs font-bold uppercase tracking-[0.24em] text-[#1c1b1b] transition hover:bg-[#f6f3f2]"
                >
                  Cancelar
                </Link>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-px bg-[#e5e2e1] shadow-[0_24px_60px_rgba(28,27,27,0.05)]">
                {scanStats.map((item) => (
                  <div key={item.label} className="bg-white p-6">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-[#444748]/65">
                      {item.label}
                    </p>
                    <p className="mt-2 font-headline text-2xl">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="order-1 xl:order-2 xl:flex xl:justify-center">
            <div className="group relative w-full overflow-hidden bg-[#e5e2e1] shadow-[0_30px_80px_rgba(28,27,27,0.12)] xl:max-w-[760px]">
              <div className="aspect-[4/5]">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDYVol3XJrKccjU4GSLRXVyVMtWrZK6hYlsGx05e1VyFT9CelEcbTk2JbDqxYuJ4NrKVpJHetf0U0PtEXGOmv01JIXdq6CWoO9OsFFJeGa7DdWqs_j7kcftNqy8xJLrWDrTctl1iQoSXrRMmFjl5Eu3zRA_N8xzVDZrlkgPePQN6u7AL95UjaIAUiQuIQf36kP4sGl0yLBKkNes_0qD8FCeSbPyQKcW5YpyhZvy2zHTqtcrZsZ4tK9XrZ6ADUPkegs87Tz2YYYhjav4"
                  alt="Retrato editorial para captura facial"
                  className="h-full w-full object-cover grayscale-[10%] transition-transform duration-[2000ms] group-hover:scale-105"
                />
              </div>

              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(239,117,206,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(239,117,206,0.05)_1px,transparent_1px)] bg-[size:40px_40px] opacity-40" />

              <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-8 top-8 h-14 w-14 border-l-2 border-t-2 border-white/85 lg:left-10 lg:top-10 lg:h-16 lg:w-16" />
                <div className="absolute right-8 top-8 h-14 w-14 border-r-2 border-t-2 border-white/85 lg:right-10 lg:top-10 lg:h-16 lg:w-16" />
                <div className="absolute bottom-8 left-8 h-14 w-14 border-b-2 border-l-2 border-white/85 lg:bottom-10 lg:left-10 lg:h-16 lg:w-16" />
                <div className="absolute bottom-8 right-8 h-14 w-14 border-b-2 border-r-2 border-white/85 lg:bottom-10 lg:right-10 lg:h-16 lg:w-16" />

                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-[72%] w-[84%] items-center justify-center rounded-full border border-white/25">
                    <div className="relative h-[98%] w-[98%] rounded-full border border-[#ef75ce]/40">
                      <div className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ef75ce] shadow-[0_0_20px_#ef75ce]" />
                      <div className="absolute bottom-0 left-1/2 h-2 w-2 -translate-x-1/2 translate-y-1/2 rounded-full bg-[#ef75ce]/70 shadow-[0_0_12px_#ef75ce]" />
                    </div>
                  </div>
                </div>

                <div className="absolute inset-x-0 top-[32%] h-40 animate-pulse bg-gradient-to-b from-transparent via-[#ef75ce]/30 to-transparent opacity-70" />
                <div className="absolute inset-x-0 top-[42%] h-[2px] animate-pulse bg-[#ef75ce] shadow-[0_0_25px_#ef75ce]" />

                <div className="absolute left-[45%] top-[35%] h-3 w-3 animate-pulse rounded-full bg-[#ef75ce] shadow-[0_0_18px_#ef75ce]" />
                <div className="absolute right-[30%] top-[55%] h-2 w-2 animate-pulse rounded-full bg-white [animation-delay:1s]" />
                <div className="absolute bottom-[40%] left-[35%] h-2 w-2 animate-pulse rounded-full bg-[#ef75ce] [animation-delay:2s]" />

                <div className="absolute left-6 top-6 rounded-full border border-white/12 bg-black/45 px-4 py-2 text-[9px] uppercase tracking-[0.28em] text-white/75 backdrop-blur-md lg:left-10 lg:top-10">
                  Rec session - 00:00:24
                </div>

                <div className="absolute bottom-6 left-6 text-[8px] uppercase tracking-[0.46em] text-white/35 lg:bottom-10 lg:left-10">
                  Neural_Network_Active // 5.0.2
                </div>

                <div className="absolute right-6 top-24 hidden flex-col gap-4 lg:right-10 lg:flex">
                  <div className="border border-white/10 bg-black/40 px-5 py-3 text-white backdrop-blur-md">
                    <p className="text-[8px] uppercase tracking-[0.22em] text-[#ef75ce]">Pore Size</p>
                    <p className="mt-1 font-headline text-lg">Minimal</p>
                  </div>
                  <div className="border border-white/10 bg-black/40 px-5 py-3 text-white backdrop-blur-md">
                    <p className="text-[8px] uppercase tracking-[0.22em] text-[#ef75ce]">Hydration</p>
                    <p className="mt-1 font-headline text-lg">84%</p>
                  </div>
                  <div className="border border-white/10 bg-black/40 px-5 py-3 text-white backdrop-blur-md">
                    <p className="text-[8px] uppercase tracking-[0.22em] text-[#ef75ce]">Sensitivity</p>
                    <p className="mt-1 font-headline text-lg">Low</p>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent p-6 text-white lg:hidden">
                <p className="text-[10px] uppercase tracking-[0.22em] text-white/60">
                  Captura orientada
                </p>
                <p className="mt-3 max-w-[20ch] font-headline text-2xl leading-tight">
                  Ajustes visuais em tempo real para uma leitura mais precisa.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </SkinScanLuxuryShell>
  );
}
