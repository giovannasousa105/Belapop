"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { Apple, CreditCard, Lock, Sparkles, X } from "lucide-react";
import { useState, type ReactNode } from "react";

import { popClubTierMap, popClubTiers } from "@/lib/popclub/tiers";

const trustPoints = [
  "Cobranca mensal automatica",
  "Cancelamento simples a qualquer momento",
  "Ambiente seguro"
] as const;

export default function PopClubActivationExperience() {
  const [paymentMethod, setPaymentMethod] = useState<"card" | "pix" | "apple">("card");

  const paymentButton = (
    method: "card" | "pix" | "apple",
    label: string,
    icon: ReactNode
  ) => {
    const active = paymentMethod === method;

    return (
      <button
        type="button"
        onClick={() => setPaymentMethod(method)}
        className={`flex flex-col items-center justify-center gap-3 rounded-[14px] border p-4 text-[10px] font-bold uppercase tracking-[0.22em] transition-colors ${
          active
            ? "border-black bg-[#f8f8f8] text-black shadow-sm"
            : "border-black/5 bg-white text-black/40 hover:bg-[#f8f8f8]"
        }`}
      >
        {icon}
        <span>{label}</span>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#1c1b1b]">
      <header className="fixed inset-x-0 top-0 z-50 bg-[#fcf9f8]/82 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:h-[72px] lg:px-10">
          <Link
            href="/popclub/membership"
            className="inline-flex h-10 w-10 items-center justify-center text-black"
            aria-label="Voltar"
          >
            <X className="h-5 w-5" />
          </Link>
          <h1 className="font-[var(--font-playfair)] text-[22px] font-medium text-[#1a1a1a]">
            Ative seu PopClub
          </h1>
          <div className="w-6" />
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 pb-36 pt-24 lg:px-10 lg:pb-20 lg:pt-32">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(440px,1.08fr)] lg:gap-16">
          <section className="lg:sticky lg:top-28 lg:self-start">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.28em] text-black/45">
              Ativacao do clube
            </p>
            <h2 className="max-w-lg font-[var(--font-playfair)] text-4xl leading-tight tracking-tight lg:text-6xl lg:leading-[1.02]">
              Falta um passo para liberar sua entrada no Essencial.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-[#444748] lg:text-lg">
              Sua assinatura ativa o primeiro nivel do PopClub imediatamente. Depois disso, seus pontos acumulados liberam Premium e Luxo com mais creditos, amostras e prioridade no concierge.
            </p>

            <div className="mt-10 overflow-hidden rounded-[28px] bg-black text-white">
              <div className="relative aspect-[4/5] lg:aspect-[4/4.2]">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAgPpGjKzblZBiipWwO9yic68cWG5uIeyBXwhiZNbD-2rU_SPHiukJ8TM1dJyx4djqEV02Qc1t7xB50LysqzFALLjtl4--aVdt5GZdNQIpsnh7xjJGif1ZKLWjjd2yRG4N4cTbDgfCukOq6TDGNa3y1tia5NATHELjhg6hCVugGe_GxMkgHw4c444uclfxqaHvNUvTU_aHrRskjiO3-2b9J4jMpvP4YolwVRBG9VH2FcmzHqBf5kUwiLE6vCI6wsJEBwZ_DG8Sx7Od7"
                  alt="Editorial PopClub"
                  className="h-full w-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/15 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8">
                  <p className="mb-3 text-[10px] uppercase tracking-[0.28em] text-white/65">
                    Entrada imediata no Essencial
                  </p>
                  <p className="max-w-sm font-[var(--font-playfair)] text-2xl leading-tight lg:text-4xl">
                    Confirmacao elegante, acesso imediato e progressao clara.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {trustPoints.map((item) => (
                <div
                  key={item}
                  className="rounded-[20px] border border-black/5 bg-white/70 p-5 text-sm leading-relaxed text-[#444748]"
                >
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-8">
            <div className="rounded-[28px] border border-black/5 bg-white p-6 shadow-[0_20px_60px_rgba(0,0,0,0.04)] lg:p-8">
              <div className="flex flex-col gap-6 border-b border-black/5 pb-6 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-black/50">
                    Nivel liberado agora
                  </p>
                  <h3 className="mt-3 font-[var(--font-playfair)] text-3xl leading-tight">
                    PopClub {popClubTierMap.essencial.label}
                  </h3>
                  <p className="mt-2 text-sm text-black/55">Cancele quando quiser.</p>
                </div>
                <div className="text-left md:text-right">
                  <span className="font-[var(--font-playfair)] text-[40px] font-semibold text-black">
                    R$ 19,90
                  </span>
                  <span className="block text-[12px] text-black/60">/mes</span>
                </div>
              </div>

              <div className="mt-6 space-y-3 text-sm leading-relaxed text-[#444748]">
                <p>Seu acesso inclui ativacao imediata e renovacao mensal automatica.</p>
                {popClubTierMap.essencial.benefits.map((benefit) => (
                  <p key={benefit}>{benefit}</p>
                ))}
              </div>
            </div>

            <section className="rounded-[28px] border border-black/5 bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.03)] lg:p-8">
              <h3 className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-black/50">
                Escolha como pagar
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {paymentButton("card", "Cartao", <CreditCard className="h-5 w-5" />)}
                {paymentButton("pix", "Pix", <Sparkles className="h-5 w-5" />)}
                {paymentButton("apple", "Pay", <Apple className="h-5 w-5" />)}
              </div>

              {paymentMethod !== "card" ? (
                <div className="mt-6 rounded-[18px] bg-[#f6f3f2] p-5 text-sm leading-relaxed text-[#444748]">
                  {paymentMethod === "pix"
                    ? "Pix recorrente sera liberado na proxima etapa. Você recebera a confirmacao imediata apos a autenticação."
                    : "Apple Pay fica disponivel no dispositivo compativel. Ao continuar, o sistema abre a carteira para autenticação segura."}
                </div>
              ) : null}
            </section>

            <section className="rounded-[28px] border border-black/5 bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.03)] lg:p-8">
              <h3 className="mb-6 text-[10px] font-bold uppercase tracking-[0.2em] text-black/50">
                Dados de pagamento
              </h3>
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Numero do Cartao"
                    className="h-[54px] w-full rounded-[14px] border border-black/5 bg-white px-4 text-[14px] font-medium text-black outline-none transition focus:border-black/25 focus:ring-0"
                  />
                  <Lock className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-black/20" />
                </div>
                <input
                  type="text"
                  placeholder="Nome no Cartao"
                  className="h-[54px] w-full rounded-[14px] border border-black/5 bg-white px-4 text-[14px] font-medium text-black outline-none transition focus:border-black/25 focus:ring-0"
                />
                <div className="grid grid-cols-2 gap-3.5">
                  <input
                    type="text"
                    placeholder="Validade (MM/AA)"
                    className="h-[54px] rounded-[14px] border border-black/5 bg-white px-4 text-[14px] font-medium text-black outline-none transition focus:border-black/25 focus:ring-0"
                  />
                  <input
                    type="text"
                    placeholder="CVV"
                    className="h-[54px] rounded-[14px] border border-black/5 bg-white px-4 text-[14px] font-medium text-black outline-none transition focus:border-black/25 focus:ring-0"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-[28px] border border-black/5 bg-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.03)] lg:p-8">
              <h3 className="mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-black/50">
                Proximos niveis
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                {popClubTiers
                  .filter((tier) => tier.id !== "essencial")
                  .map((tier) => (
                    <div key={tier.id} className="rounded-[18px] bg-[#f6f3f2] p-5">
                      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-black/50">
                        {tier.unlockRule}
                      </p>
                      <h4 className="mt-2 font-[var(--font-playfair)] text-2xl">{tier.label}</h4>
                      <p className="mt-2 text-sm leading-relaxed text-[#444748]">{tier.summary}</p>
                    </div>
                  ))}
              </div>
            </section>

            <section className="hidden rounded-[28px] bg-[#1a1a1a] p-8 text-white lg:block">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-white/55">
                Confirmacao final
              </p>
              <p className="max-w-md text-sm leading-relaxed text-white/80">
                O acesso ao Essencial e liberado assim que a confirmacao do pagamento for concluida.
              </p>
              <Link
                href="/popclub/boas-vindas"
                className="mt-6 inline-flex h-14 w-full items-center justify-center gap-2 rounded-[16px] bg-white text-[13px] font-semibold uppercase tracking-[0.2em] text-black transition-opacity hover:opacity-90"
              >
                <span>Ativar assinatura</span>
                <Lock className="h-4 w-4" />
              </Link>
            </section>
          </section>
        </div>
      </main>

      <footer className="fixed inset-x-0 bottom-0 z-50 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.06)] lg:hidden">
        <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-4">
          <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-black/60">
            Voce tera acesso imediato apos a confirmacao
          </p>
          <Link
            href="/popclub/boas-vindas"
            className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-[14px] bg-[#1a1a1a] text-[13px] font-semibold uppercase tracking-[0.2em] text-white transition-opacity hover:opacity-90"
          >
            <span>Ativar assinatura</span>
            <Lock className="h-4 w-4" />
          </Link>
        </div>
      </footer>
    </div>
  );
}
