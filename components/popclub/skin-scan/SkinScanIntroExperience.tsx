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
  Home,
  ScanLine,
  User,
  Waves
} from "lucide-react";
import { useEffect, useState } from "react";

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
    description: "Leitura da superfície da pele para identificar irregularidades visíveis."
  },
  {
    icon: Droplets,
    title: "Oleosidade visível",
    description: "Mapeamento de brilho aparente em regiões como testa, nariz e queixo."
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
    description: "Observação de opacidade e sinais visuais de perda de conforto."
  }
];

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
    answer: "Não. O Skin Scan é uma experiência de orientação cosmética para apoiar a rotina."
  },
  {
    question: "Como minhas fotos são tratadas?",
    answer: "A imagem é usada apenas para leitura visual no fluxo e segue regras de privacidade da plataforma."
  },
  {
    question: "Preciso estar sem maquiagem?",
    answer: "Sim. Para leitura mais útil, prefira pele limpa e ambiente com luz natural uniforme."
  },
  {
    question: "Quanto tempo leva a leitura?",
    answer: "A experiência completa leva cerca de 45 segundos. Três perguntas, uma foto e o resultado já aparece."
  },
  {
    question: "Posso refazer o diagnóstico?",
    answer: "Sim. Você pode iniciar uma nova leitura quando quiser, por exemplo após mudanças na rotina ou na pele."
  }
] as const;

type BottomNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  active: boolean;
};

const bottomNavItems: BottomNavItem[] = [
  { label: "Início", href: "/", icon: Home, active: false },
  { label: "Loja", href: "/catalogo", icon: CircleDot, active: false },
  { label: "Scan", href: "/skin-scan", icon: ScanLine, active: true },
  { label: "Kits", href: "/kits", icon: BookOpen, active: false },
  { label: "Conta", href: "/conta", icon: User, active: false }
];

// Melhoria 4.3 — Calcula mensagem baseada no último scan em localStorage
function useLastScanMessage(): string | null {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("belapop_last_scan_date");
      if (!raw) return;
      const last = new Date(raw);
      if (Number.isNaN(last.getTime())) return;
      const daysSince = Math.floor((Date.now() - last.getTime()) / 86_400_000);
      if (daysSince < 30) {
        setMsg(`Seu último scan foi há ${daysSince === 0 ? "menos de 1 dia" : `${daysSince} dia${daysSince !== 1 ? "s" : ""}`}. Refaça em ${30 - daysSince} dias para acompanhar a evolução.`);
      } else {
        setMsg("Está na hora de um novo scan! Sua pele pode ter mudado.");
      }
    } catch { /* localStorage indisponível */ }
  }, []);
  return msg;
}

export default function SkinScanIntroExperience() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const lastScanMsg = useLastScanMessage();

  const toggleFaq = (index: number) => {
    setOpenFaqIndex((current) => (current === index ? null : index));
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fcf9f8] pb-24 text-[#1c1b1b] md:pb-0">
      <BelaPopValidatedHeader activeSection="skin-scan" />

      <main className="pt-[78px] lg:pt-[86px]">

        {/* ── 1. Hero ──────────────────────────────────────────────────────── */}
        <section className="min-h-screen md:flex md:min-h-[calc(100vh-88px)]">

          {/* Left: text */}
          <div
            className="w-full px-6 py-12 md:w-1/2 md:px-10 md:py-20"
            style={{ background: "linear-gradient(135deg, #faf7f4 0%, #f5ede8 100%)" }}
          >
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#C17A90]/30 bg-[rgba(193,122,144,0.08)] px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#8E5B68]">
                ✦ Skin Scan BelaPop
              </span>
              <h1 className="[font-family:var(--font-playfair)] mt-6 text-5xl leading-[1.0] tracking-tight md:text-7xl xl:text-8xl">
                Entenda sua pele com mais clareza
              </h1>
              <p className="mt-6 text-base leading-relaxed text-[#444748] md:text-xl">
                Uma leitura visual baseada na sua imagem e nas suas prioridades, para orientar sua
                rotina de skincare de forma simples e confiável.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                <Link
                  href="/skin-scan/foco"
                  className="inline-flex min-h-14 items-center justify-center rounded-none bg-[#1c1b1b] px-10 text-xs font-bold uppercase tracking-[0.22em] text-white transition-all duration-200 hover:bg-[#2e2a2b]"
                >
                  Começar leitura da pele
                </Link>
                <Link
                  href="#processo"
                  className="inline-flex min-h-12 items-center justify-center border-b border-black/20 text-xs uppercase tracking-[0.24em] transition-colors hover:border-black"
                >
                  Ver como funciona
                </Link>
              </div>
              {/* Melhoria 4.3 — Banner do último scan */}
              {lastScanMsg && (
                <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#C17A90]/30 bg-[rgba(193,122,144,0.07)] px-4 py-1.5 text-[11px] tracking-wide text-[#8E5B68]">
                  🕐 {lastScanMsg}
                </p>
              )}
              <p className="mt-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.1em] text-[#888]">
                <span>●</span> Não substitui avaliação dermatológica
              </p>
            </div>
          </div>

          {/* Right: editorial image */}
          <div className="relative min-h-[520px] w-full overflow-hidden md:w-1/2 md:min-h-[calc(100vh-88px)]">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBRPi78Qu3qK_eawP0mUZmouHfU-REytWicAL39R0zI6qnHkNHMPOZnrUyXGCfB5jREEzCUT-nQyNsPn6QiYX_U7gI0KokmJ5dgXMFUSFWxgU_k0yASNFCgDXxQQ1fOUra7YmSXnSv0N4f9cDtfQppSxcy9YLjZWRrGq34vUcmrcFHTy9WKtPQgsG4JMOx9frxGdT3xRI__7o2ljJ5mZWHtGvhAaxaDXlmHWPHWllhEoG9vUW_5KZHcab86_8lVrU7n9FZLD7SEDPGc"
              alt="Preview da leitura visual do Skin Scan"
              className="h-full w-full object-cover grayscale-[0.2]"
            />
            {/* Gradient overlay at base */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/30 to-transparent" />
            {/* Floating badge */}
            <div className="absolute bottom-8 left-8 right-8">
              <div className="border border-[#C17A90]/20 bg-white/95 p-5 backdrop-blur-sm">
                <div className="mb-3 h-[2px] w-full overflow-hidden bg-black/10">
                  <div className="h-full w-2/3 bg-[#C17A90]" />
                </div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#888]">Leitura em andamento</p>
                <p className="[font-family:var(--font-playfair)] mt-1 text-base italic text-[#1c1b1b]">
                  Textura detectada
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. O Processo ────────────────────────────────────────────────── */}
        <section id="processo" className="bg-[#0d0a0b] px-6 py-16 md:px-10 md:py-24">
          <div className="mx-auto max-w-7xl">
            <p className="mb-3 text-center text-[10px] uppercase tracking-[0.2em] text-white/60">
              Experiência guiada
            </p>
            <h2 className="[font-family:var(--font-playfair)] mb-14 text-center text-3xl uppercase tracking-[0.2em] text-white md:mb-20">
              O processo
            </h2>
            <div className="grid grid-cols-1 gap-10 md:grid-cols-4 md:gap-12">
              {processSteps.map((step) => (
                <article
                  key={step.number}
                  className="space-y-4 border-b border-white/10 pb-8 last:border-0 md:border-0 md:pb-0"
                >
                  <p className="[font-family:var(--font-playfair)] text-4xl italic text-[#C17A90]/50">
                    {step.number}
                  </p>
                  <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-white">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-white/60">{step.description}</p>
                </article>
              ))}
            </div>
            <div className="mt-16 text-center">
              <Link
                href="/skin-scan/foco"
                className="inline-flex min-h-14 items-center justify-center border border-white/30 px-10 text-xs uppercase tracking-[0.24em] text-white transition-colors hover:bg-white hover:text-black"
              >
                Iniciar agora
              </Link>
            </div>
          </div>
        </section>

        {/* ── 3. O que observamos ──────────────────────────────────────────── */}
        <section className="bg-[#f7f3f0] px-6 py-16 md:px-10 md:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-14">
              <h2 className="[font-family:var(--font-playfair)] text-4xl tracking-tight md:text-5xl">
                O que observamos
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#444748]">
                Mapeamos sinais visíveis da pele para orientar recomendações cosméticas de forma
                mais consistente.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-5">
              {signalCards.map((card) => {
                const Icon = card.icon;
                return (
                  <article
                    key={card.title}
                    className="border border-black/5 bg-white p-8 text-center shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#C17A90]/20 hover:shadow-md"
                  >
                    <Icon className="mx-auto mb-4 h-8 w-8 text-[#8E5B68]" />
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#1c1b1b]">
                      {card.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-[#5a5252]">{card.description}</p>
                  </article>
                );
              })}
            </div>
            <p className="mt-10 text-center text-xs uppercase tracking-[0.15em] text-[#aaa]">
              5 dimensões analisadas por leitura
            </p>
          </div>
        </section>

        {/* ── 4. Um resumo da sua jornada ──────────────────────────────────── */}
        <section className="bg-white px-6 py-16 md:px-10 md:py-24">
          <div className="mx-auto flex max-w-7xl flex-col gap-14 lg:flex-row lg:items-center lg:gap-20">
            <div className="w-full lg:w-1/2">
              <h2 className="[font-family:var(--font-playfair)] text-4xl tracking-tight text-[#1c1b1b] md:text-6xl">
                Um resumo da sua jornada
              </h2>
              <div className="mt-10 space-y-8">
                {summaryItems.map((item) => (
                  <div key={item.title} className="flex items-start gap-4">
                    <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center border border-[#C17A90]/20 bg-[#f5ede9]">
                      <Eye className="h-4 w-4 text-[#8E5B68]" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-[0.2em]">{item.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-[#444748]">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-12">
                <Link
                  href="/skin-scan/foco"
                  className="inline-flex min-h-14 items-center justify-center bg-[#1c1b1b] px-10 text-xs font-bold uppercase tracking-[0.24em] text-white transition-colors hover:bg-[#2e2a2b]"
                >
                  Começar minha leitura
                </Link>
              </div>
            </div>

            <div className="w-full bg-[#f0eded] p-4 md:p-10 lg:w-1/2">
              <div className="border border-black/[0.08] bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
                <div className="mb-8 flex items-center justify-between text-[10px] uppercase tracking-[0.2em]">
                  <p>Resultado da leitura</p>
                  <p className="text-[#444748]/60">ID: BP-2941</p>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="border-l-2 border-[#C17A90] pl-4">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[#888]">Nível de oleosidade</p>
                    <p className="[font-family:var(--font-playfair)] mt-2 text-2xl italic text-[#1c1b1b]">
                      Moderado
                    </p>
                  </div>
                  <div className="border-l-2 border-black pl-4">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[#888]">Sensibilidade</p>
                    <p className="[font-family:var(--font-playfair)] mt-2 text-2xl italic text-[#1c1b1b]">
                      Baixa
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 5. Transparência BelaPop ─────────────────────────────────────── */}
        <section className="bg-[#f6f3f2] px-6 py-16 md:px-10 md:py-24">
          <div className="mx-auto max-w-5xl">
            <h2 className="[font-family:var(--font-playfair)] mb-12 text-center text-3xl italic md:mb-16">
              Transparência BelaPop
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <article className="border-l-2 border-[#C17A90] bg-white p-8">
                <h3 className="mb-8 text-sm font-bold uppercase tracking-[0.2em]">O que faz</h3>
                <ul className="space-y-5">
                  {doesItems.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm leading-relaxed">
                      <span className="mt-0.5 shrink-0 font-bold text-[#C17A90]">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
              <article className="border-l-2 border-black/20 bg-white p-8">
                <h3 className="mb-8 text-sm font-bold uppercase tracking-[0.2em]">O que não faz</h3>
                <ul className="space-y-5">
                  {doesNotItems.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-[#444748]">
                      <span className="mt-0.5 shrink-0 font-bold text-black/40">✕</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          </div>
        </section>

        {/* ── 6. Privacidade ───────────────────────────────────────────────── */}
        <section className="px-6 py-16 md:px-10 md:py-24">
          <div className="mx-auto max-w-4xl bg-[#1c1b1b] p-10 text-center md:p-16 lg:p-24">
            <h2 className="[font-family:var(--font-playfair)] text-4xl tracking-tight text-white">
              Sua privacidade é inegociável
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/70 md:text-lg">
              A imagem enviada é utilizada exclusivamente para leitura visual dentro da experiência
              do Skin Scan. O processamento segue regras de privacidade e controle de consentimento.
            </p>
            <Link
              href="/aviso-de-privacidade"
              className="mt-8 inline-flex min-h-14 items-center justify-center border border-white/30 px-10 text-xs uppercase tracking-[0.24em] text-white transition-colors hover:bg-white hover:text-black"
            >
              Ver política de privacidade
            </Link>
          </div>
        </section>

        {/* ── 7. FAQ ───────────────────────────────────────────────────────── */}
        <section className="bg-white px-6 py-16 md:px-10 md:py-24">
          <div className="mx-auto max-w-3xl">
            <h2 className="[font-family:var(--font-playfair)] mb-12 text-center text-3xl uppercase tracking-[0.18em] md:mb-16">
              Dúvidas frequentes
            </h2>
            <div className="space-y-4">
              {faqItems.map((faq, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <article key={faq.question} className="border-b border-black/10 pb-6">
                    <button
                      type="button"
                      className={`flex w-full items-center justify-between gap-4 text-left transition-colors ${
                        isOpen ? "text-[#8E5B68]" : ""
                      }`}
                      onClick={() => toggleFaq(index)}
                    >
                      <span className="text-sm font-semibold tracking-wide">{faq.question}</span>
                      <span className="shrink-0 text-lg font-light leading-none text-[#C17A90]">
                        {isOpen ? "−" : "+"}
                      </span>
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

      {/* ── 8. Mobile bottom nav ─────────────────────────────────────────── */}
      <nav className="fixed inset-x-0 bottom-0 z-50 flex h-20 items-center justify-around border-t border-black/10 bg-[#fcf9f8]/95 px-4 pb-3 pt-2 backdrop-blur-xl md:hidden">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center gap-1 ${
                item.active ? "text-[#C17A90]" : "text-[#444748]"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span
                className={`text-[10px] uppercase tracking-[0.16em] ${
                  item.active ? "font-semibold" : "font-bold"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
