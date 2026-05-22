"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Blend,
  BookOpen,
  CircleDot,
  Droplets,
  Eye,
  Minus,
  Plus,
  ScanLine,
  Sparkles,
  Waves
} from "lucide-react";
import { useState } from "react";

import { BelaPopValidatedHeader } from "@/components/luxury/BelaPopValidatedHeader";
import { BelaPopValidatedFooter } from "@/components/luxury/BelaPopValidatedFooter";

const processSteps = [
  {
    number: "01.",
    title: "Defina prioridades",
    description: "Você escolhe os focos de cuidado que fazem sentido para o seu momento."
  },
  {
    number: "02.",
    title: "Envie sua imagem",
    description: "Uma foto nítida em luz natural ajuda a leitura visual da pele."
  },
  {
    number: "03.",
    title: "Leitura visual",
    description: "A experiência organiza sinais aparentes para orientar próximos passos."
  },
  {
    number: "04.",
    title: "Rotina sugerida",
    description: "Você recebe sugestões cosméticas para continuar a rotina com mais clareza."
  }
] as const;

type SignalCard = {
  icon: LucideIcon;
  title: string;
  description: string;
};

const signalCards: SignalCard[] = [
  {
    icon: ScanLine,
    title: "Textura aparente",
    description: "Leitura da superficie da pele para identificar irregularidades visiveis."
  },
  {
    icon: Droplets,
    title: "Oleosidade visivel",
    description: "Mapeamento de brilho aparente em regioes como testa, nariz e queixo."
  },
  {
    icon: AlertTriangle,
    title: "Sensibilidade aparente",
    description: "Identificação de sinais visuais de reatividade em áreas específicas."
  },
  {
    icon: Blend,
    title: "Uniformidade",
    description: "Comparação visual de variações de tom na pele ao longo do rosto."
  },
  {
    icon: Waves,
    title: "Ressecamento aparente",
    description: "Observacao de opacidade e sinais visuais de perda de conforto."
  }
] as const;

const summaryItems = [
  {
    title: "Resumo visual",
    description: "Principais pontos observados na imagem com linguagem direta."
  },
  {
    title: "Sugestão de rotina",
    description: "Etapas e produtos organizados de acordo com as prioridades escolhidas."
  }
] as const;

const doesItems = [
  "Ajuda a organizar sua rotina de skincare diária.",
  "Contribui para reduzir tentativa e erro na escolha de produtos.",
  "Orienta decisões com base em sinais visíveis da pele."
] as const;

const doesNotItems = [
  "Não realiza avaliação clínica ou tratamento médico.",
  "Não substitui consulta com dermatologista.",
  "Não avalia condições médicas fora do escopo cosmético."
] as const;

const faqItems = [
  {
    question: "A análise substitui o dermatologista?",
    answer:
      "Não. O Skin Scan é uma experiência de orientação cosmética para apoiar a rotina."
  },
  {
    question: "Como minhas fotos são tratadas?",
    answer:
      "A imagem é usada apenas para leitura visual no fluxo e segue regras de privacidade da plataforma."
  },
  {
    question: "Preciso estar sem maquiagem?",
    answer:
      "Sim. Para leitura mais util, prefira pele limpa e ambiente com luz natural uniforme."
  }
] as const;

const bottomNavItems = [
  { label: "Loja", href: "/catalogo", icon: Sparkles, active: false },
  { label: "Maquiagem", href: "/maquiagem", icon: CircleDot, active: false },
  { label: "Cabelos", href: "/cabelos", icon: Waves, active: false },
  { label: "Perfumes", href: "/perfumes", icon: Droplets, active: false },
  { label: "PopClub", href: "/popclub", icon: BookOpen, active: false }
] as const;

export default function SkinScanIntroExperience() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex((current) => (current === index ? null : index));
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fcf9f8] pb-24 text-[#1c1b1b] md:pb-0">
      <BelaPopValidatedHeader activeSection="skin-scan" />

      <main className="pt-[78px] lg:pt-[86px]">
        <section className="min-h-screen md:flex md:min-h-[calc(100vh-88px)]">
          <div className="w-full px-6 py-12 md:w-1/2 md:px-10 md:py-20">
            <div className="max-w-xl">
              <h1 className="[font-family:var(--font-playfair)] text-4xl leading-[1.05] tracking-tight md:text-7xl">
                Entenda sua pele com mais clareza
              </h1>
              <p className="mt-6 text-base leading-relaxed text-[#444748] md:text-xl">
                Uma leitura visual baseada na sua imagem e nas suas prioridades, para orientar sua
                rotina de skincare de forma simples e confiavel.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                <Link
                  href="/skin-scan/foco"
                  className="inline-flex min-h-14 items-center justify-center bg-black px-8 text-xs font-bold uppercase tracking-[0.24em] text-white transition-opacity hover:opacity-90"
                >
                  Comecar leitura da pele
                </Link>
                <Link
                  href="#processo"
                  className="inline-flex min-h-12 items-center justify-center border-b border-black/20 text-xs uppercase tracking-[0.24em] transition-colors hover:border-black"
                >
                  Ver como funciona
                </Link>
              </div>
              <p className="mt-6 text-[10px] uppercase tracking-[0.2em] text-[#444748]/70">
                Nao substitui avaliacao dermatologica
              </p>
            </div>
          </div>

          <div className="relative w-full bg-[#f6f3f2] md:w-1/2 md:min-h-[calc(100vh-88px)]">
            <div className="mx-auto flex h-full max-w-[380px] items-center justify-center px-6 py-12 md:max-w-[420px]">
              <div className="relative w-full bg-white p-4 shadow-[0_40px_100px_rgba(0,0,0,0.08)]">
                <div className="aspect-[9/19]">
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBRPi78Qu3qK_eawP0mUZmouHfU-REytWicAL39R0zI6qnHkNHMPOZnrUyXGCfB5jREEzCUT-nQyNsPn6QiYX_U7gI0KokmJ5dgXMFUSFWxgU_k0yASNFCgDXxQQ1fOUra7YmSXnSv0N4f9cDtfQppSxcy9YLjZWRrGq34vUcmrcFHTy9WKtPQgsG4JMOx9frxGdT3xRI__7o2ljJ5mZWHtGvhAaxaDXlmHWPHWllhEoG9vUW_5KZHcab86_8lVrU7n9FZLD7SEDPGc"
                    alt="Preview da leitura visual do Skin Scan"
                    className="h-full w-full object-cover grayscale-[0.2]"
                  />
                </div>
                <div className="pointer-events-none absolute inset-4 bg-gradient-to-t from-black/25 to-transparent" />
                <div className="absolute bottom-9 left-10 right-10 text-white">
                  <div className="mb-4 h-[2px] w-full overflow-hidden bg-white/30">
                    <div className="h-full w-2/3 bg-white" />
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.2em]">Leitura em andamento</p>
                  <p className="[font-family:var(--font-playfair)] mt-2 text-lg italic">
                    Textura detectada
                  </p>
                </div>
              </div>
            </div>
            <div className="pointer-events-none absolute -right-20 top-16 h-80 w-80 rounded-full bg-[#6c5e06]/10 blur-[100px]" />
          </div>
        </section>

        <section id="processo" className="border-t border-black/10 px-6 py-16 md:px-10 md:py-24">
          <div className="mx-auto max-w-7xl">
            <h2 className="[font-family:var(--font-playfair)] mb-14 text-center text-3xl uppercase tracking-[0.2em] md:mb-20">
              O processo
            </h2>
            <div className="grid grid-cols-1 gap-10 md:grid-cols-4 md:gap-12">
              {processSteps.map((step) => (
                <article key={step.number} className="space-y-4">
                  <p className="[font-family:var(--font-playfair)] text-4xl italic text-black/30">
                    {step.number}
                  </p>
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em]">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-[#444748]">{step.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#f6f3f2] px-6 py-16 md:px-10 md:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-14">
              <h2 className="[font-family:var(--font-playfair)] text-4xl tracking-tight md:text-5xl">
                O que observamos
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#444748]">
                Mapeamos sinais visiveis da pele para orientar recomendacoes cosmeticas de forma
                mais consistente.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-5">
              {signalCards.map((card) => {
                const Icon = card.icon;
                return (
                  <article
                    key={card.title}
                    className="bg-white p-8 text-center transition-transform duration-300 hover:-translate-y-1"
                  >
                    <Icon className="mx-auto mb-4 h-8 w-8 text-black" />
                    <h3 className="text-[10px] uppercase tracking-[0.2em]">{card.title}</h3>
                    <p className="mt-3 text-xs leading-relaxed text-[#444748]">{card.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="px-6 py-16 md:px-10 md:py-24">
          <div className="mx-auto flex max-w-7xl flex-col gap-14 lg:flex-row lg:items-center lg:gap-20">
            <div className="w-full lg:w-1/2">
              <h2 className="[font-family:var(--font-playfair)] text-4xl tracking-tight md:text-6xl">
                Um resumo da sua jornada
              </h2>
              <div className="mt-10 space-y-8">
                {summaryItems.map((item) => (
                  <div key={item.title} className="flex items-start gap-4">
                    <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center border border-black/10 bg-[#f0eded]">
                      <Eye className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-[0.2em]">{item.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-[#444748]">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full bg-[#f0eded] p-4 md:p-10 lg:w-1/2">
              <div className="bg-white p-8 shadow-[0_40px_80px_rgba(0,0,0,0.04)]">
                <div className="mb-8 flex items-center justify-between text-[10px] uppercase tracking-[0.2em]">
                  <p>Resultado da leitura</p>
                  <p className="text-[#444748]/60">ID: BP-2941</p>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="border-l-2 border-[#6c5e06] pl-4">
                    <p className="text-[10px] uppercase tracking-[0.18em]">Nivel de oleosidade</p>
                    <p className="[font-family:var(--font-playfair)] mt-2 text-2xl italic">Moderado</p>
                  </div>
                  <div className="border-l-2 border-black pl-4">
                    <p className="text-[10px] uppercase tracking-[0.18em]">Sensibilidade</p>
                    <p className="[font-family:var(--font-playfair)] mt-2 text-2xl italic">Baixa</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#f6f3f2] px-6 py-16 md:px-10 md:py-24">
          <div className="mx-auto max-w-5xl">
            <h2 className="[font-family:var(--font-playfair)] mb-12 text-center text-3xl italic md:mb-16">
              Transparencia BelaPop
            </h2>
            <div className="grid grid-cols-1 gap-px bg-black/10 md:grid-cols-2">
              <article className="bg-[#f6f3f2] p-8 md:p-12">
                <h3 className="mb-8 text-xs font-bold uppercase tracking-[0.28em]">O que faz</h3>
                <ul className="space-y-5">
                  {doesItems.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm leading-relaxed">
                      <Plus className="mt-0.5 h-4 w-4 text-[#6c5e06]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
              <article className="border-t border-black/10 bg-[#f6f3f2] p-8 md:border-l md:border-t-0 md:p-12">
                <h3 className="mb-8 text-xs font-bold uppercase tracking-[0.28em]">O que nao faz</h3>
                <ul className="space-y-5">
                  {doesNotItems.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-[#444748]">
                      <Minus className="mt-0.5 h-4 w-4 text-[#ba1a1a]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          </div>
        </section>

        <section className="px-6 py-16 md:px-10 md:py-24">
          <div className="mx-auto max-w-4xl bg-[#f2ede8] p-10 text-center md:p-16 lg:p-24">
            <h2 className="[font-family:var(--font-playfair)] text-4xl tracking-tight">
              Sua privacidade e inegociavel
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[#444748] md:text-lg">
              A imagem enviada e utilizada exclusivamente para leitura visual dentro da experiencia
              do Skin Scan. O processamento segue regras de privacidade e controle de consentimento.
            </p>
            <Link
              href="/aviso-de-privacidade"
              className="mt-8 inline-flex min-h-14 items-center justify-center border border-black px-10 text-xs uppercase tracking-[0.24em] transition-colors hover:bg-black hover:text-white"
            >
              Ver politica de privacidade
            </Link>
          </div>
        </section>

        <section className="bg-white px-6 py-16 md:px-10 md:py-24">
          <div className="mx-auto max-w-3xl">
            <h2 className="[font-family:var(--font-playfair)] mb-12 text-center text-3xl uppercase tracking-[0.18em] md:mb-16">
              Duvidas frequentes
            </h2>
            <div className="space-y-4">
              {faqItems.map((faq, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <article key={faq.question} className="border-b border-black/15 pb-6">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-4 text-left"
                      onClick={() => toggleFaq(index)}
                    >
                      <span className="text-sm font-semibold tracking-wide">{faq.question}</span>
                      {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    </button>
                    {isOpen ? (
                      <p className="mt-3 text-sm leading-relaxed text-[#444748]">{faq.answer}</p>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <BelaPopValidatedFooter />

      <nav className="fixed inset-x-0 bottom-0 z-50 flex h-20 items-center justify-around border-t border-black/10 bg-[#fcf9f8]/95 px-4 pb-3 pt-2 backdrop-blur-xl md:hidden">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center gap-1 ${
                item.active ? "text-[#6c5e06]" : "text-[#444748]"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-[0.16em]">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
