"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import {
  Apple,
  ArrowRight,
  Camera,
  Menu,
  Shield,
  ShoppingBag,
  Sparkles,
  Star
} from "lucide-react";
import { useState } from "react";

import { ImmersiveMenuDrawer } from "@/components/popclub/shared/ImmersiveMenuDrawer";
import { membershipMenuLinks } from "@/lib/popclub/navigation";

const membershipBenefits = [
  { icon: Sparkles, label: "Acesso antecipado a lancamentos" },
  { icon: Star, label: "Beneficios do programa" },
  { icon: ArrowRight, label: "Acesso a acoes e ativacoes selecionadas, quando disponiveis" },
  { icon: Camera, label: "Skin Scan com beneficios do programa" }
] as const;

const membershipPillars = [
  "Beneficios do programa com uso claro no dia a dia da rotina.",
  "Sugestoes organizadas com mais clareza com base no seu perfil e historico.",
  "Entrada imediata no Skin Scan e nos proximos passos do cuidado."
] as const;

export default function PopClubMembershipExperience() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b]">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-black/[0.04] bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 md:h-[72px] lg:px-10">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center text-[#1c1b1b]"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="text-sm font-semibold tracking-tight text-[#1c1b1b]/80">
            PopClub Membership
          </div>
          <Link
            href="/carrinho"
            className="inline-flex h-10 w-10 items-center justify-center text-[#1c1b1b]"
            aria-label="Abrir sacola"
          >
            <ShoppingBag className="h-5 w-5" />
          </Link>
        </div>
      </header>

      <ImmersiveMenuDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title="PopClub"
        links={membershipMenuLinks}
        searchPlaceholder="Buscar experiencias"
      />

      <main className="mx-auto max-w-7xl px-6 pb-16 pt-24 lg:px-10 lg:pb-24 lg:pt-32">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)] lg:gap-16">
          <section className="lg:sticky lg:top-28 lg:self-start">
            <div className="mb-8 text-center lg:mb-10 lg:text-left">
              <div className="mb-8 inline-block">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuB-Ts3eC38OmnFwN_YlFSp256YNQLe5KgaBLtBdvF4t0kNahxgYq6xFL6A2KalbXTE2hgewTUFe15g6dQpSv1ewkdmZ8uaT4hHw1NswpZZJPB4u7xWx-XRyUZYMJrQIktOjJPQLpNSezCN9wAoijGU51B2PcvOdg0_-sIgfP9yxejLsLMtPVNQVmUD4VmCoPXZxtYLJwEoiIhgdE5yCgq9R68fx4e82FpN3F5HIY4enrNxy3IVbJeC01ftBbwcBc13_igy0m4jwXS_r"
                  alt="BelaPop"
                  className="mx-auto h-10 w-auto object-contain lg:mx-0"
                />
              </div>
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.28em] text-[#444748]/70">
                Membership Edition
              </p>
              <h1 className="font-[var(--font-playfair)] text-[28px] leading-[1.25] lg:max-w-xl lg:text-6xl lg:leading-[1.08]">
                Voce esta a um passo de fazer parte.
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-[#444748]/80 lg:text-lg">
                Entrada imediata no ecossistema BelaPop, com beneficios do programa e uma
                jornada mais organizada para acompanhar sua rotina.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.72fr)]">
              <article className="relative min-h-[360px] overflow-hidden rounded-[28px] bg-black lg:min-h-[520px]">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAgPpGjKzblZBiipWwO9yic68cWG5uIeyBXwhiZNbD-2rU_SPHiukJ8TM1dJyx4djqEV02Qc1t7xB50LysqzFALLjtl4--aVdt5GZdNQIpsnh7xjJGif1ZKLWjjd2yRG4N4cTbDgfCukOq6TDGNa3y1tia5NATHELjhg6hCVugGe_GxMkgHw4c444uclfxqaHvNUvTU_aHrRskjiO3-2b9J4jMpvP4YolwVRBG9VH2FcmzHqBf5kUwiLE6vCI6wsJEBwZ_DG8Sx7Od7"
                  alt="Editorial PopClub"
                  className="h-full w-full object-cover opacity-80 grayscale-[0.15]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6 text-white lg:p-8">
                  <p className="mb-3 text-[10px] uppercase tracking-[0.28em] text-white/65">
                    Programa PopClub
                  </p>
                  <p className="font-[var(--font-playfair)] text-2xl leading-tight lg:text-4xl">
                    Jornada mais organizada, com escolhas e acompanhamento em continuidade.
                  </p>
                </div>
              </article>

              <div className="space-y-6">
                <section className="rounded-[24px] border border-black/[0.04] bg-white/75 p-6 shadow-[0_10px_40px_rgba(28,27,27,0.03)] lg:p-7">
                  <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#444748]/70">
                    O que voce tera
                  </h2>
                  <ul className="mt-5 space-y-5">
                    {membershipBenefits.map((item) => {
                      const Icon = item.icon;

                      return (
                        <li key={item.label} className="flex items-center gap-4">
                          <Icon className="h-5 w-5 text-black/45" />
                          <span className="text-sm text-[#1c1b1b]/80">{item.label}</span>
                        </li>
                      );
                    })}
                  </ul>
                </section>

                <section className="rounded-[24px] bg-[#f6f3f2] p-6 lg:p-7">
                  <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.24em] text-[#444748]/70">
                    Por que entrar agora
                  </p>
                  <div className="space-y-5">
                    {membershipPillars.map((pillar, index) => (
                      <div key={pillar} className="flex gap-4">
                        <span className="font-[var(--font-playfair)] text-2xl text-black/25">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <p className="text-sm leading-relaxed text-[#444748]">{pillar}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </section>

          <div className="space-y-8">
            <section className="rounded-[28px] border border-black/[0.05] bg-white/80 p-6 shadow-[0_20px_60px_rgba(28,27,27,0.04)] lg:p-8">
              <div className="mb-8">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#444748]/65">
                  Criar conta
                </p>
                <h2 className="mt-3 font-[var(--font-playfair)] text-3xl leading-tight lg:text-4xl">
                  Monte seu acesso premium.
                </h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {[
                  { label: "Nome Completo", placeholder: "Como deseja ser chamado?", span: "" },
                  { label: "E-mail", placeholder: "exemplo@email.com", span: "" },
                  {
                    label: "Senha",
                    placeholder: "Minimo 8 caracteres",
                    type: "password",
                    span: "md:col-span-2"
                  }
                ].map((field) => (
                  <div key={field.label} className={`space-y-1.5 ${field.span}`}>
                    <label className="ml-1 text-[10px] uppercase tracking-[0.18em] text-[#444748]/70">
                      {field.label}
                    </label>
                    <input
                      type={field.type ?? "text"}
                      placeholder={field.placeholder}
                      className="h-[54px] w-full rounded-[16px] border border-black/[0.06] bg-white px-4 text-sm text-[#1c1b1b] outline-none transition focus:border-black/20 focus:ring-0"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <button
                  type="button"
                  className="flex h-12 items-center justify-center gap-3 rounded-[14px] border border-black/[0.06] bg-white text-[10px] uppercase tracking-[0.22em] text-[#444748] transition-colors hover:bg-[#f6f3f2]"
                >
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuD0to-PoLwlNVExmTtuNgG2XkDPXkJKlyy3z4gc3qDXZ0soyvLrVfBvpV0jA-MsiLx78vm9GMKVBLOjT2GBrzGYemdii20BoS5BZPRq_hcDtETo4EHvIYZTum6onB_rQEHyY7PdvkeXJagx8zfm8x0Ad01dVWOY3fDbaWDCuTQi_JRiVW5ih1pnbunmPzLZR4_irm96zlEb1lQ8hQGIeDl9mi2g7CD5ePAwROe4J-L3RU6Saa09s9RaHuCeFJud0M0obmQJru1VCpV0"
                    alt="Google"
                    className="h-4 w-4 opacity-45 grayscale"
                  />
                  Google
                </button>
                <button
                  type="button"
                  className="flex h-12 items-center justify-center gap-3 rounded-[14px] border border-black/[0.06] bg-white text-[10px] uppercase tracking-[0.22em] text-[#444748] transition-colors hover:bg-[#f6f3f2]"
                >
                  <Apple className="h-4 w-4 opacity-45" />
                  Apple
                </button>
              </div>
            </section>

            <section className="rounded-[28px] bg-[#f6f3f2]/80 p-6 lg:p-8">
              <div className="flex flex-col gap-6 border-b border-black/[0.06] pb-6 md:flex-row md:items-end md:justify-between">
                <div>
                  <span className="text-[11px] uppercase tracking-[0.22em] text-[#444748]">
                    PopClub
                  </span>
                  <h3 className="mt-2 max-w-sm font-[var(--font-playfair)] text-2xl lg:text-3xl">
                    Assinatura mensal para acompanhar sua rotina.
                  </h3>
                  <p className="mt-2 text-sm text-[#444748]/75">Cancele quando quiser.</p>
                </div>
                <div className="text-left md:text-right">
                  <span className="font-[var(--font-playfair)] text-4xl font-bold">R$ 19,90</span>
                  <span className="mt-1 block text-[10px] uppercase tracking-[0.2em] text-[#444748]">
                    por mes
                  </span>
                </div>
              </div>

              <div className="mt-6 space-y-6">
                <p className="max-w-xl text-sm leading-relaxed text-[#444748]">
                  Seu acesso inclui entrada imediata no fluxo do Skin Scan e beneficios e
                  sugestoes organizados com base no seu perfil, quando disponiveis.
                </p>

                <Link
                  href="/popclub/ativar"
                  className="inline-flex h-[54px] w-full items-center justify-center rounded-[16px] bg-black text-sm font-bold uppercase tracking-[0.2em] text-white transition-colors hover:bg-[#1c1b1b]"
                >
                  Entrar no PopClub
                </Link>

                <div className="grid gap-4 text-center text-[11px] text-[#444748]/70 md:grid-cols-3">
                  <div className="flex items-center justify-center gap-1.5 rounded-full bg-white/80 px-4 py-3">
                    <Star className="h-4 w-4" />
                    <span>Sem fidelidade</span>
                  </div>
                  <div className="flex items-center justify-center gap-1.5 rounded-full bg-white/80 px-4 py-3">
                    <ArrowRight className="h-4 w-4" />
                    <span>Cancelamento simples</span>
                  </div>
                  <div className="flex items-center justify-center gap-1.5 rounded-full bg-white/80 px-4 py-3">
                    <Shield className="h-4 w-4" />
                    <span>Dados protegidos</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      <footer className="border-t border-black/[0.03] bg-[#f6f3f2]/60 px-6 py-12 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-8 text-center lg:flex-row lg:justify-between lg:text-left">
          <div>
            <Link
              href="/login"
              className="text-xs font-bold tracking-[0.15em] text-[#1c1b1b] hover:text-[#ed93d5]"
            >
              JA TEM CONTA? ENTRAR
            </Link>
            <div className="mt-5 flex flex-wrap justify-center gap-6 lg:justify-start">
              {["Privacy", "Terms", "Concierge"].map((item) => (
                <Link
                  key={item}
                  href="/contato"
                  className="text-[10px] uppercase tracking-[0.2em] text-[#444748]/60 hover:text-[#ed93d5]"
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#444748]/40">
            (c) 2026 Elite Collective. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
