"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import {
  BookOpenText,
  Download,
  MessageCircle,
  ScanFace,
  Settings,
  ShoppingBag,
  Sparkles,
  Star
} from "lucide-react";

import { SkinScanLuxuryShell } from "@/components/popclub/skin-scan/SkinScanLuxuryShell";
import { popClubPaths } from "@/lib/popclub/navigation";

const sideLinks = [
  { label: "Scanner Facial", href: popClubPaths.skinScanDiagnosis, icon: ScanFace, active: true },
  { label: "A Vitrine", href: popClubPaths.rewards, icon: ShoppingBag, active: false },
  { label: "Diario BelaPop", href: popClubPaths.diary, icon: BookOpenText, active: false },
  { label: "Minha Rotina", href: popClubPaths.skinScanRoutine, icon: Sparkles, active: false },
  { label: "PopClub Exclusivo", href: popClubPaths.landing, icon: Star, active: false },
  { label: "Configuracoes", href: "/conta", icon: Settings, active: false }
] as const;

const profileMetrics = [
  { label: "Hidratacao", value: "84%", width: "84%", accent: true },
  { label: "Poros", value: "Minimos", width: "15%", accent: false },
  { label: "Sensibilidade", value: "Baixa", width: "20%", accent: false },
  { label: "Textura", value: "Suave", width: "92%", accent: true }
] as const;

const curatedProducts = [
  {
    brand: "LA MER",
    title: "Creme de la Mer - Hidratante Iconico",
    price: "R$ 2.450,00",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBOoeQJFNSOkAW3Cq0WnoBOyIG5vLEUD2W9z-owLVl8_L_7n7IswDtaOQOo39vEeaD0sqKF7TclXUcNmNy2HdQBt_7FdEirq7JTfFPqUme7ORGjZgbtk_iAiykH6li1VYERJbJiAaUEqcVKnzelKe1WM9h2zOgNoxND9sABkHteux5A6TLijXEhMeQVu8nZ3AwCuX1OXjuLyDfFNoyxb1UBlxb8DNvcZJzX8G2mPSUbfX9xSljXiPZgheo2jp5Po23ueMNTpum5Wl3J"
  },
  {
    brand: "CHANEL",
    title: "Hydra Beauty Micro Serum",
    price: "R$ 890,00",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAkPSPvhW1sBuGfYdUMIElLuh8bkt3zONeqZBUVuS9owpMjzB48suyVWXBa6PsdYOlJqYcv2LRpiRSaiPSXg3s-vbZzksJXir6GndDxfb_Rsd7_waQ7mExCdLUmTrnL-tv20chreospOXbmHnIc-qluRCvqwnnhkXfQbR-Dq52volsm8t41GolokgwI1nYLdwQNkAw4CgjVR6YVL2Cs71FlSJN87BV_d9Mp_wTvR33G9QqzgKf-lHdHAu1cVa-FkXbRM1iGVpucGhW9"
  },
  {
    brand: "DIOR",
    title: "Capture Totale Super Potent Serum",
    price: "R$ 1.120,00",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBoTOIuhua06aYc68OaPCjZHv13j9zKU_afOzcMkzqoZ0o8QZCotrXZd-QfvkCY-pyj23Bpw8MVg325KArtZ-_IZ0XsEFc8oxOhPc53SGnKcyrKPxLv-IaoljYmVK3eHQ1PW5tiAicb79WrKRns3kxu-qdIck_y0y0JxnoenhZU3wUWN6RRUgT0pdAGeougWJXgzDx_TzFBnRTUHZT2vc0Pg5yX5aZSc7wPD5xPbj_1gFzGvos-G1Ut-9hSLVkKf1ypOk9lKoowZDee"
  }
] as const;

export default function SkinScanDiagnosisExperience() {
  return (
    <SkinScanLuxuryShell>
      <div className="mx-auto max-w-[1440px] px-6 pb-20 pt-10 lg:px-8 lg:pb-24 lg:pt-14">
        <div className="mb-12">
          <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#ef75ce]">
            Relatorio de diagnostico IA
          </p>
          <h1 className="font-headline text-5xl font-black leading-none tracking-[-0.05em] lg:text-7xl">
            DIAGNOSTICO
            <br />
            <span className="italic text-[#ef75ce]">exclusivo BelaPop</span>
          </h1>
        </div>

        <div className="flex flex-col gap-12 xl:flex-row xl:items-start">
          <aside className="w-full xl:w-80 xl:shrink-0">
            <div className="flex flex-col gap-2 border-l border-black/10 py-2 xl:sticky xl:top-28">
              {sideLinks.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`flex items-center gap-4 py-3 pl-4 transition ${
                      item.active
                        ? "border-l-4 border-[#ef75ce] font-bold text-black"
                        : "text-[#444748] hover:bg-[#f6f3f2]"
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${item.active ? "text-[#ef75ce]" : ""}`} />
                    <span className="font-headline text-sm font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            <section className="mb-12 overflow-hidden bg-white shadow-[0_24px_70px_rgba(28,27,27,0.08)]">
              <div className="flex flex-col xl:flex-row">
                <div className="relative xl:w-1/2">
                  <div className="aspect-[4/5] bg-[#f0eded]">
                    <img
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDYVol3XJrKccjU4GSLRXVyVMtWrZK6hYlsGx05e1VyFT9CelEcbTk2JbDqxYuJ4NrKVpJHetf0U0PtEXGOmv01JIXdq6CWoO9OsFFJeGa7DdWqs_j7kcftNqy8xJLrWDrTctl1iQoSXrRMmFjl5Eu3zRA_N8xzVDZrlkgPePQN6u7AL95UjaIAUiQuIQf36kP4sGl0yLBKkNes_0qD8FCeSbPyQKcW5YpyhZvy2zHTqtcrZsZ4tK9XrZ6ADUPkegs87Tz2YYYhjav4"
                      alt="Retrato biometrico para diagnostico"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="absolute left-6 top-6 bg-black/80 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-white backdrop-blur-md">
                    ID Biometrico: BP-99281
                  </div>
                </div>

                <div className="flex flex-1 flex-col justify-center p-8 lg:p-12 xl:p-16">
                  <h2 className="mb-12 font-headline text-3xl font-light uppercase tracking-[0.14em] lg:text-4xl">
                    Seu perfil
                    <br />
                    biometrico
                  </h2>

                  <div className="space-y-8">
                    {profileMetrics.map((metric) => (
                      <div key={metric.label}>
                        <div className="mb-3 flex items-end justify-between gap-4">
                          <span className="text-xs uppercase tracking-[0.22em] text-[#444748]">
                            {metric.label}
                          </span>
                          <span
                            className={`font-headline text-2xl font-bold ${
                              metric.accent ? "text-[#ef75ce]" : "text-black"
                            }`}
                          >
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

                  <Link
                    href={popClubPaths.skinScanResult}
                    className="mt-12 inline-flex min-h-14 w-full items-center justify-center gap-3 bg-black px-8 text-xs font-semibold uppercase tracking-[0.24em] text-white transition hover:bg-[#1c1b1b] sm:w-auto"
                  >
                    Baixar relatorio completo
                    <Download className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </section>

            <section className="relative mb-16 overflow-hidden border-l-4 border-[#ef75ce] bg-black p-8 text-white shadow-[0_24px_70px_rgba(28,27,27,0.18)] lg:p-12">
              <div className="absolute right-[-5rem] top-[-5rem] h-64 w-64 rounded-full bg-[#ef75ce]/10 blur-3xl" />
              <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-4xl">
                  <div className="mb-4 flex items-center gap-3">
                    <MessageCircle className="h-6 w-6 text-[#ef75ce]" />
                    <h3 className="font-headline text-2xl font-black uppercase tracking-[0.18em]">
                      SkinBela assistant
                    </h3>
                  </div>
                  <p className="text-sm leading-relaxed text-white/82 lg:text-base">
                    <strong className="text-white">Conversa guiada pela sua pele.</strong> O
                    SkinBela responde com base no seu perfil, Skin Twin e em uma base priorizada
                    por evidencia dermatologica, com preferencia por fontes clinicas e diretrizes.
                  </p>
                </div>

                <Link
                  href={popClubPaths.belaCode}
                  className="inline-flex min-h-14 w-full items-center justify-center border border-[#ef75ce] px-8 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#ef75ce] transition hover:bg-[#ef75ce] hover:text-white lg:w-auto"
                >
                  Iniciar concierge IA
                </Link>
              </div>
            </section>

            <section>
              <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="font-headline text-4xl font-light uppercase tracking-[0.14em] lg:text-5xl">
                    Curadoria
                    <br />
                    <span className="italic text-[#ef75ce]">exclusiva para voce</span>
                  </h2>
                </div>
                <Link
                  href={popClubPaths.skinScanRoutine}
                  className="w-fit border-b border-black pb-1 text-[11px] uppercase tracking-[0.22em] transition hover:border-[#ef75ce] hover:text-[#ef75ce]"
                >
                  Ver toda a recomendacao
                </Link>
              </div>

              <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-3">
                {curatedProducts.map((product, index) => (
                  <article key={product.title} className="group flex flex-col">
                    <div className="relative mb-6 aspect-[3/4] overflow-hidden bg-[#f6f3f2] shadow-[0_20px_50px_rgba(28,27,27,0.08)]">
                      <img
                        src={product.image}
                        alt={product.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      {index === 0 ? (
                        <div className="absolute right-4 top-4 bg-[#ef75ce] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white">
                          Escolha IA
                        </div>
                      ) : null}
                    </div>
                    <span className="text-xs font-bold uppercase tracking-[0.22em]">{product.brand}</span>
                    <h3 className="mt-2 text-lg leading-relaxed">{product.title}</h3>
                    <p className="mt-3 font-headline text-2xl font-bold">{product.price}</p>
                    <Link
                      href="/checkout"
                      className="mt-6 inline-flex min-h-14 items-center justify-center bg-black px-6 text-xs uppercase tracking-[0.22em] text-white transition hover:bg-[#ef75ce]"
                    >
                      Comprar
                    </Link>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </SkinScanLuxuryShell>
  );
}
