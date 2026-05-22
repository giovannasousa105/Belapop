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

import { SkinScanBundlePurchaseButton } from "@/components/popclub/skin-scan/SkinScanBundlePurchaseButton";
import { SkinScanLuxuryShell } from "@/components/popclub/skin-scan/SkinScanLuxuryShell";
import { popClubPaths } from "@/lib/popclub/navigation";
import { skinScanPurchaseBundles } from "@/lib/popclub/skinScanPurchaseBundles";

const sideLinks = [
  { label: "Scanner Facial", href: popClubPaths.skinScanDiagnosis, icon: ScanFace, active: true },
  { label: "Loja", href: "/catalogo", icon: ShoppingBag, active: false },
  { label: "Diario BelaPop", href: popClubPaths.diary, icon: BookOpenText, active: false },
  { label: "Minha Rotina", href: popClubPaths.skinScanRoutine, icon: Sparkles, active: false },
  { label: "PopClub Exclusivo", href: popClubPaths.landing, icon: Star, active: false },
  { label: "Configuracoes", href: "/conta", icon: Settings, active: false }
] as const;

const profileMetrics = [
  { label: "Hidratação", value: "84%", width: "84%", accent: true },
  { label: "Poros", value: "Minimos", width: "15%", accent: false },
  { label: "Sensibilidade", value: "Baixa", width: "20%", accent: false },
  { label: "Textura", value: "Suave", width: "92%", accent: true }
] as const;

export default function SkinScanDiagnosisExperience() {
  return (
    <SkinScanLuxuryShell>
      <div className="mx-auto max-w-[1440px] px-6 pb-20 pt-10 lg:px-8 lg:pb-24 lg:pt-14">
        <div className="mb-12">
          <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#ef75ce]">
            Relatorio de leitura assistida
          </p>
          <h1 className="font-headline text-5xl font-black leading-none tracking-[-0.05em] lg:text-7xl">
            LEITURA
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
                      alt="Retrato biometrico da leitura"
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
                    Ver leitura detalhada
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
                      Concierge SkinBela
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

            <section id="saidas-de-compra">
              <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="font-headline text-4xl font-light uppercase tracking-[0.14em] lg:text-5xl">
                    Produtos
                    <br />
                    <span className="italic text-[#ef75ce]">recomendados</span>
                  </h2>
                  <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#444748] lg:text-base">
                    Sua leitura mostra barreira preservada, textura uniforme e leve necessidade de
                    reforco hidratante. A partir disso, a leitura abre tres profundidades de
                    compra, com ordem de uso, SKUs mapeados e ticket sugerido para decidir entre
                    entrada curada, elevacao de rotina ou atendimento de luxo.
                  </p>
                </div>
                <Link
                  href={popClubPaths.skinScanRoutine}
                  className="w-fit border-b border-black pb-1 text-[11px] uppercase tracking-[0.22em] transition hover:border-[#ef75ce] hover:text-[#ef75ce]"
                >
                  Abrir rotina detalhada
                </Link>
              </div>

              <div className="grid gap-10 xl:grid-cols-3">
                {skinScanPurchaseBundles.map((output, index) => {
                  const featured = index === 1;
                  const luxury = index === 2;

                  return (
                    <article
                      key={output.title}
                      className={`group flex h-full flex-col ${
                        luxury
                          ? "bg-black text-white shadow-[0_24px_70px_rgba(28,27,27,0.18)]"
                          : "bg-white shadow-[0_20px_50px_rgba(28,27,27,0.08)]"
                      }`}
                    >
                      <div className="relative aspect-[3/4] overflow-hidden bg-[#f6f3f2]">
                        <div
                          className={`absolute left-4 top-4 z-10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] ${
                            luxury
                              ? "bg-[#ef75ce] text-white"
                              : featured
                                ? "bg-black text-white"
                                : "bg-white/90 text-black"
                          }`}
                        >
                          {output.label}
                        </div>
                        {featured ? (
                          <div className="absolute right-4 top-4 z-10 bg-[#ef75ce] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white">
                            Mais escolhida
                          </div>
                        ) : null}
                        {luxury ? <div className="absolute inset-0 bg-black/20" /> : null}
                        <img
                          src={output.image}
                          alt={output.title}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>

                      <div className="flex flex-1 flex-col p-8">
                        <h3 className="font-headline text-2xl font-light uppercase tracking-[0.14em]">
                          {output.title}
                        </h3>
                        <p
                          className={`mt-3 text-sm leading-relaxed ${
                            luxury ? "text-white/75" : "text-[#444748]"
                          }`}
                        >
                          {output.subtitle}
                        </p>

                        <div
                          className={`mt-8 border-l-2 pl-4 ${
                            luxury ? "border-white/20" : "border-[#ef75ce]"
                          }`}
                        >
                          <p
                            className={`text-[10px] uppercase tracking-[0.22em] ${
                              luxury ? "text-white/60" : "text-[#444748]"
                            }`}
                          >
                            Leitura do perfil
                          </p>
                          <p className="mt-3 text-sm leading-relaxed">{output.profileRead}</p>
                        </div>

                        <div className="mt-8">
                          <p
                            className={`text-[10px] uppercase tracking-[0.22em] ${
                              luxury ? "text-white/60" : "text-[#444748]"
                            }`}
                          >
                            Ordem de uso
                          </p>
                          <ol className="mt-4 space-y-3">
                            {output.usageOrder.map((step, stepIndex) => (
                              <li key={step} className="flex items-start gap-3">
                                <span
                                  className={`mt-0.5 inline-flex min-w-10 justify-center border px-2 py-1 text-[10px] uppercase tracking-[0.2em] ${
                                    luxury
                                      ? "border-white/20 text-white/70"
                                      : "border-black/10 text-[#444748]"
                                  }`}
                                >
                                  {String(stepIndex + 1).padStart(2, "0")}
                                </span>
                                <span className="text-sm leading-relaxed">{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>

                        <div className="mt-8">
                          <p
                            className={`text-[10px] uppercase tracking-[0.22em] ${
                              luxury ? "text-white/60" : "text-[#444748]"
                            }`}
                          >
                            SKUs da rotina
                          </p>
                          <ul className="mt-4 flex flex-wrap gap-2">
                            {output.products.map((product) => (
                              <li
                                key={product.slug}
                                className={`inline-flex min-h-9 items-center border px-3 py-2 text-[10px] uppercase tracking-[0.18em] ${
                                  luxury
                                    ? "border-white/15 text-white/74"
                                    : "border-black/10 text-[#444748]"
                                }`}
                              >
                                {product.label}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div
                          className={`mt-8 flex items-end justify-between gap-6 border-t pt-6 ${
                            luxury ? "border-white/10" : "border-black/10"
                          }`}
                        >
                          <div>
                            <p
                              className={`text-[10px] uppercase tracking-[0.22em] ${
                                luxury ? "text-white/60" : "text-[#444748]"
                              }`}
                            >
                              Ticket sugerido
                            </p>
                            <p className="mt-2 font-headline text-2xl font-bold">
                              {output.ticketLabel}
                            </p>
                          </div>
                        </div>

                        <SkinScanBundlePurchaseButton
                          bundleKey={output.key}
                          className={`inline-flex min-h-14 w-full items-center justify-center px-6 text-xs uppercase tracking-[0.22em] transition ${
                            luxury
                              ? "bg-[#ef75ce] text-white hover:bg-[#f08bd6]"
                              : featured
                                ? "bg-[#ef75ce] text-white hover:bg-[#f08bd6]"
                                : "bg-black text-white hover:bg-[#ef75ce]"
                          }`}
                        />
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="mt-10 flex flex-col gap-4 border-t border-black/10 pt-8 lg:flex-row lg:items-center lg:justify-between">
                <p className="max-w-3xl text-sm leading-relaxed text-[#444748]">
                  A diferenca entre as tres saidas esta na profundidade dos ativos, na extensao da
                  ordem de uso e no acompanhamento necessario para sustentar o resultado.
                </p>
                <Link
                  href={popClubPaths.belaCode}
                  className="inline-flex min-h-14 items-center justify-center border border-black px-6 text-[11px] uppercase tracking-[0.22em] transition hover:border-[#ef75ce] hover:text-[#ef75ce]"
                >
                  Refinar com concierge
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </SkinScanLuxuryShell>
  );
}
