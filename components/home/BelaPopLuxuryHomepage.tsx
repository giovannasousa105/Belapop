"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import {
  ArrowUpRight,
  Flame,
  Heart,
  Menu,
  Search,
  ShoppingBag,
  Sparkles,
  Star,
  User,
  X
} from "lucide-react";
import { useEffect, useState } from "react";

import { TrustSignals } from "@/components/legal/TrustSignals";
import { popClubPaths, skinScanJourneyLinks } from "@/lib/popclub/navigation";

const desktopNavItems = [
  { label: "Skincare", href: "/skincare", active: true },
  { label: "Maquiagem", href: "/maquiagem" },
  { label: "Cabelos", href: "/cabelos" },
  { label: "Perfumes", href: "/perfumes" },
  { label: "Entender minha pele", href: "/skin-scan", accent: true }
] as const;

const mobileMenuItems = [
  { label: "Skincare", href: "/skincare" },
  { label: "Maquiagem", href: "/maquiagem" },
  { label: "Cabelos", href: "/cabelos" },
  { label: "Perfumes", href: "/perfumes" },
  { label: "Entender minha pele", href: "/skin-scan" },
  { label: "Conteudo de apoio", href: "/diario" },
  { label: "Rotinas e produtos", href: "/vitrine" },
  { label: "Minha Conta", href: "/conta" },
  { label: "Favoritos", href: "/conta/favoritos" }
] as const;

const popClubMenuItems = [
  {
    eyebrow: "Como funciona",
    label: "Entender o clube",
    href: popClubPaths.landing,
    description: "Veja o que muda no cuidado recorrente e como o clube organiza a jornada."
  },
  {
    eyebrow: "Cuidado recorrente",
    label: "Ativar assinatura",
    href: popClubPaths.membership,
    description: "Ative o clube para acompanhar rotina, beneficios e consistencia no uso."
  },
  {
    eyebrow: "Acesso antecipado",
    label: "Radar de selecoes",
    href: popClubPaths.radar,
    description: "Acompanhe selecoes com antecedencia e contexto de curadoria."
  },
  {
    eyebrow: "Rotina guiada",
    label: "Rotina personalizada",
    href: popClubPaths.routine,
    description: "Conecte a analise a uma rotina personalizada com acompanhamento."
  }
] as const;

const skinScanMenuItems = skinScanJourneyLinks.map((item) => {
  if (item.id === "focus") {
    return {
      eyebrow: "PASSO 01",
      label: "Definir foco",
      href: item.href,
      description: "Escolha o que voce quer entender primeiro."
    };
  }

  if (item.id === "capture") {
    return {
      eyebrow: "PASSO 02",
      label: "Enviar imagem",
      href: item.href,
      description: "Envie uma imagem com clareza para iniciar a leitura visual."
    };
  }

  if (item.id === "diagnosis") {
    return {
      eyebrow: "PASSO 03",
      label: "Analise da pele",
      href: item.href,
      description: "Veja oleosidade, textura e sensibilidade com mais contexto."
    };
  }

  return {
    eyebrow: "ROTINA",
    label: "Acompanhar cuidado",
    href: item.href,
    description: "Conecte a analise a uma rotina personalizada com acompanhamento."
  };
});

const curationProducts = [
  {
    brand: "LA MER",
    title: "Crème de la Mer - Hidratação Profunda",
    price: "R$ 2.450,00",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD96gotqBFx_yo0h4yJZ5OK6V4VeYWFrzWhPSQBfV2BmWW88MGLxeRzWJ4-4hBGcPLPwH3KncNxDrLNNSGVNbdeXHFAW1sVkEuRpErhYuKF-e3_uwR8j91L2KgbzEVu6WjoOP5g_4_zTRvUusAnAkv2YdhXzG-n9eroC94OF9U9o8YK8eIog4YjigOK4N1h8m48LVM6HGXl0CfHpOfyQ1-UXkSwKZS472oCRp5-WUm4mlIpCGcRwvi43fSZ-ljn2l-f0qTe_t1yGH01"
  },
  {
    brand: "CHANEL",
    title: "N°5 L'Eau - Eau de Toilette Spray",
    price: "R$ 980,00",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBxHbyk1nlVWNidBesO86qyn0Cu3Zkzj5foUBBTCSuWx2i_0aPwJV6DKItJSQUDPdC5r9UsEDzcmKgwKWPlW8FHqH5rFmDcHHmDBFrQhnP_SY51VNjCUJ-Q-tUAIScbcefzpRCVfF0GsiRQm1582lh261F0iXJmOEpyodMkabAuDGrIEK4yrAiOQ4S9rNkfLvQ8k9C4KL7bF4Q-adUtrx90F3YMz_mQQilSxudld-vdI50dsar9eXpRpJVX21-cr3zr4TRL1ykkl8Qq"
  },
  {
    brand: "DIOR",
    title: "Capture Totale - Sérum Firmador",
    price: "R$ 840,00",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBib2IdKz-Lk2zywsIty000iUBgxRJVPxjhEN0jW84llYhI8SicphsP71hbbnTPq4DuaXyy0n323hO4xEwDUgNtfWJ3VkFaXgN9c5Y1LcDSTwhYPtgQZI2EzqVUBwbvayinZW2cMOUTlbEeeMbTDeOXIdh2u9hQu6uii1tPozTTXKl5kLHewtST0AG-6J2RaZH9PIevbqFnyoeISbhf0HMVku5QlfFWNhv7d-LKlMp5ui7ttJj2BLKtcqIHCrcZtXVsEaXQwKTskbXS"
  }
] as const;

const footerColumns = [
  {
    title: "Atendimento ao Cliente",
    links: [
      { label: "Fale Conosco", href: "/contato" },
      { label: "Perguntas Frequentes", href: "/contato" },
      { label: "Meus Pedidos", href: "/pedido" },
      { label: "Minha Conta", href: "/conta" },
      { label: "Devoluções e Reembolsos", href: "/conta/trocas-e-devolucoes" }
    ]
  },
  {
    title: "Institucional",
    links: [
      { label: "Sobre a BelaPop", href: "/sobre" },
      { label: "Segurança", href: "/seguranca" },
      { label: "Trabalhe Conosco", href: "/carreiras" }
    ]
  },
  {
    title: "Legal",
    links: [
      { label: "Aviso de Privacidade", href: "/aviso-de-privacidade" },
      { label: "Termos e Condições Gerais", href: "/termos-e-condicoes" },
      { label: "Cookies", href: "/politica-de-cookies" },
      { label: "Personalizar cookies", href: "/politica-de-cookies" }
    ]
  }
] as const;

function NavItem({
  href,
  label,
  active = false,
  accent = false
}: {
  href: string;
  label: string;
  active?: boolean;
  accent?: boolean;
}) {
  const className = active
    ? "border-b border-white pb-1 text-white"
    : accent
      ? "text-[#dac769] hover:text-white"
      : "text-gray-400 hover:text-white";

  return (
    <Link
      href={href}
      className={`text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors duration-300 ${className}`}
    >
      {label}
    </Link>
  );
}

function LuxuryProductCard({
  brand,
  title,
  price,
  image
}: {
  brand: string;
  title: string;
  price: string;
  image: string;
}) {
  return (
    <article className="group">
      <div className="mb-6 aspect-[3/4] overflow-hidden bg-[#f6f3f2]">
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
      </div>
      <h4 className="mb-2 font-body text-xs font-bold uppercase tracking-[0.2em] text-black">
        {brand}
      </h4>
      <p className="mb-4 text-sm leading-relaxed text-[#444748]">{title}</p>
      <span className="font-body font-bold text-black">{price}</span>
    </article>
  );
}

function FooterColumn({
  title,
  links
}: {
  title: string;
  links: ReadonlyArray<{ label: string; href: string }>;
}) {
  return (
    <div className="space-y-6">
      <h5 className="font-body text-[10px] font-bold uppercase tracking-[0.2em] text-white">
        {title}
      </h5>
      <ul className="space-y-4">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="font-body text-[10px] uppercase tracking-[0.16em] text-gray-400 transition-colors hover:text-white hover:underline underline-offset-4"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function BelaPopLuxuryHomepage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileMenuOpen]);

  return (
    <div className="bg-[#fcf9f8] text-[#1c1b1b]" data-belapop-page="home-public">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1680px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 lg:gap-8">
            <button
              type="button"
              aria-label="Abrir menu"
              onClick={() => setMobileMenuOpen(true)}
              className="inline-flex h-11 w-11 items-center justify-center text-white transition-colors hover:text-[#dac769] lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            <Link href="/" className="shrink-0">
              <img src="/logo-dark.svg" alt="BelaPop" className="h-9 w-auto invert" />
            </Link>

            <nav className="hidden items-center gap-8 lg:flex xl:gap-10">
              {desktopNavItems.map((item) => (
                <NavItem key={item.label} {...item} />
              ))}
            </nav>
          </div>

          <div className="hidden xl:flex xl:w-full xl:max-w-md xl:flex-1 xl:px-8">
            <label className="relative block w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="BUSCAR PRODUTOS..."
                className="w-full border-none bg-white/5 py-2 pl-10 pr-4 text-[11px] uppercase tracking-[0.2em] text-white placeholder:text-gray-500 focus:ring-1 focus:ring-white/20"
              />
            </label>
          </div>

          <div className="flex items-center gap-1 sm:gap-3 lg:gap-6">
            <Link
              href={popClubPaths.landing}
              className="hidden items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white transition-colors hover:text-[#6c5e06] sm:flex"
            >
              <Star className="h-4 w-4" />
              <span>POPCLUB</span>
            </Link>
            <button
              type="button"
              className="hidden items-center gap-2 text-[10px] font-medium uppercase tracking-[0.2em] text-white transition-colors hover:text-gray-300 sm:flex"
            >
              <Heart className="h-4 w-4" />
              <span className="hidden md:inline">FAVORITOS</span>
            </button>
            <button
              type="button"
              aria-label="Buscar"
              className="inline-flex h-11 w-11 items-center justify-center text-white transition-colors hover:text-gray-300 xl:hidden"
            >
              <Search className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Conta"
              className="hidden h-11 w-11 items-center justify-center text-white transition-colors hover:text-gray-300 sm:inline-flex"
            >
              <User className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="Sacola"
              className="inline-flex h-11 w-11 items-center justify-center text-white transition-colors hover:text-gray-300"
            >
              <ShoppingBag className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm lg:hidden">
          <div className="absolute inset-y-0 left-0 flex w-[90vw] max-w-[390px] flex-col overflow-y-auto bg-[linear-gradient(180deg,#050505,#111111_42%,#171313)] px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-5 text-white shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <img src="/logo-dark.svg" alt="BelaPop" className="h-8 w-auto invert" />
              <button
                type="button"
                aria-label="Fechar menu"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center text-white transition-colors hover:text-[#dac769]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <Link
              href={popClubPaths.landing}
              onClick={() => setMobileMenuOpen(false)}
              className="group mb-5 block rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.04))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.22)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/72">
                    Cuidado recorrente
                  </p>
                  <h3 className="mt-3 font-headline text-[2rem] leading-[0.92] text-white">
                    PopClub
                  </h3>
                  <p className="mt-3 max-w-[22ch] text-sm leading-relaxed text-white/85">
                    Acesso a rotina, acompanhamento e beneficios para quem quer manter consistencia.
                  </p>
                </div>
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/14 bg-white/8 text-white transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/12 bg-white/6 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-white/82">
                  Assinatura
                </span>
                <span className="rounded-full border border-[#ed93d5]/30 bg-[#ed93d5]/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[#f2bedf]">
                  Radar
                </span>
                <span className="rounded-full border border-white/12 bg-white/6 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-white/82">
                  Rotina
                </span>
              </div>
            </Link>

            <label className="relative mb-8 block">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="BUSCAR PRODUTOS..."
                className="w-full border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-[11px] uppercase tracking-[0.2em] text-white placeholder:text-gray-500 focus:ring-1 focus:ring-white/20"
              />
            </label>

            <div className="mb-8">
              <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/60">
                Navegacao principal
              </p>
              <nav className="flex flex-col gap-3">
                {mobileMenuItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4 font-headline text-[1.6rem] leading-[0.92] text-white transition hover:border-white/20 hover:bg-white/[0.05]"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div>
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/60">
                  Fluxos do clube
                </p>
                <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-[#ed93d5]">
                  <Flame className="h-3.5 w-3.5" />
                  Cuidado
                </span>
              </div>
              <div className="space-y-3">
                {popClubMenuItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-4 transition hover:border-[#ed93d5]/35 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.04))]"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/60">
                      {item.eyebrow}
                    </p>
                    <div className="mt-2 flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-headline text-[1.45rem] leading-[0.96] text-white">
                          {item.label}
                        </h4>
                        <p className="mt-2 text-sm leading-relaxed text-white/82">
                          {item.description}
                        </p>
                      </div>
                      <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-white/70" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/60">
                  Como funciona o scan
                </p>
                <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-[#ef75ce]">
                  <Search className="h-3.5 w-3.5" />
                  Analise
                </span>
              </div>
              <div className="space-y-3">
                {skinScanMenuItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-4 transition hover:border-[#ef75ce]/35 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.04))]"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/60">
                      {item.eyebrow}
                    </p>
                    <div className="mt-2 flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-headline text-[1.45rem] leading-[0.96] text-white">
                          {item.label}
                        </h4>
                        <p className="mt-2 text-sm leading-relaxed text-white/82">
                          {item.description}
                        </p>
                      </div>
                      <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-white/70" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-auto space-y-4 pt-8">
              <Link
                href={popClubPaths.membership}
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-14 items-center justify-center rounded-full bg-white px-6 text-[11px] font-semibold uppercase tracking-[0.24em] text-black"
              >
                Entender o clube
              </Link>
              <Link
                href={popClubPaths.skinScan}
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-14 items-center justify-center rounded-full border border-white/20 bg-white/[0.02] px-6 text-[11px] font-semibold uppercase tracking-[0.24em] text-white"
              >
                Entender minha pele
              </Link>
            </div>
          </div>
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 -z-10"
            onClick={() => setMobileMenuOpen(false)}
          />
        </div>
      ) : null}

      <div className="pt-16">
        <section className="relative flex min-h-[calc(100svh-4rem)] items-end overflow-hidden bg-[#f6f3f2] md:items-center">
          <div className="absolute inset-0">
            <video
              autoPlay
              className="h-full w-full object-cover"
              loop
              muted
              playsInline
              poster="/editorial/home-hero-loop.gif"
              preload="auto"
            >
              <source src="/editorial/home-hero-loop-4k.webm" type="video/webm" />
              <source src="/editorial/home-hero-loop-4k.mp4" type="video/mp4" />
              <img
                src="/editorial/home-hero-loop.gif"
                alt="Close de pele em luz suave"
                className="h-full w-full object-cover"
              />
            </video>
            <div className="absolute inset-0 bg-black/35" />
          </div>

          <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-24">
            <div className="max-w-4xl">
              <span className="mb-4 block text-[10px] font-semibold uppercase tracking-[0.3em] text-white/90 sm:text-xs">
                BelaPop
              </span>
              <h1 className="font-headline text-5xl font-bold leading-[0.92] tracking-[-0.05em] text-white sm:text-6xl md:text-7xl lg:text-[7.5rem]">
                Skincare guiado
                <br />
                pela sua pele
              </h1>
              <p className="mt-6 max-w-lg text-base leading-7 text-white/95 sm:text-lg">
                <span className="block">Entenda o que sua pele precisa.</span>
                <span className="block">Siga uma rotina personalizada.</span>
                <span className="block">Acompanhe a evolucao com clareza.</span>
              </p>
              <p className="mt-4 max-w-xl text-sm leading-7 text-white/82 sm:text-base">
                Uma nova forma de cuidar da pele, baseada em analise, curadoria e consistencia.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/skin-scan"
                  className="inline-flex min-h-14 items-center justify-center bg-white px-8 text-[11px] font-semibold uppercase tracking-[0.24em] text-black transition-colors hover:bg-black hover:text-white"
                >
                  Entender minha pele
                </Link>
                <Link
                  href="/skincare"
                  className="inline-flex min-h-14 items-center justify-center border border-white/20 bg-black/20 px-8 text-[11px] font-semibold uppercase tracking-[0.24em] text-white transition-colors hover:bg-white/10"
                >
                  Continuar cuidado
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#fcf9f8] px-4 py-20 sm:px-6 lg:px-8 lg:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <div className="space-y-6">
              <h2 className="font-headline text-4xl leading-[1.08] tracking-tight text-[#1c1b1b] sm:text-5xl lg:text-7xl">
                Como funciona
              </h2>
              <div className="mx-auto max-w-2xl space-y-4">
                <p className="text-lg leading-relaxed text-[#444748] opacity-80">
                  <span className="block">Voce envia uma imagem da sua pele.</span>
                  <span className="block">
                    Identificamos padroes visiveis como oleosidade, textura e sensibilidade.
                  </span>
                  <span className="block">
                    A partir disso, estruturamos uma rotina personalizada.
                  </span>
                </p>
                <p className="text-sm font-medium uppercase tracking-[0.24em] text-[#6c5e06]">
                  Sem excesso. Sem tentativa e erro.
                </p>
              </div>
            </div>

            <div className="relative mx-auto mt-14 max-w-2xl">
              <div className="aspect-[3/4] overflow-hidden bg-[#f6f3f2]">
                <img
                  src="https://lh3.googleusercontent.com/aida/ADBb0ujiUJOxH_St5myLUZkVT49UP9zk421DMnkTit6oqKkx3hZ_lr3ilxIPQdktZMiH2oO3xeu482jXC_muvec8wQNjMT5vFaOFiGoVbDK7fMPzfKiJ2A1HlrSsjkp9LmGaMDdRd04mBnC09KlC4ehSa3b-_Yh7xCyG7d0f6_RyGPPI15CDbHd97_fJJPxjHxM8Dliqxx8Z6OGKPpb2LbRbGMWzWMwyUiIhCOqL8lJUMAC8ghrw7k-LpvCxm243R10ZmsT2E_x8qIfks4k"
                  alt="Imagem de apoio para leitura visual da pele"
                  className="h-full w-full object-contain transition-transform duration-1000 hover:scale-105"
                />
              </div>
            </div>

            <div className="mt-12 flex justify-center">
              <Link
                href="/skin-scan"
                className="group inline-flex min-h-16 items-center justify-center gap-4 bg-black px-8 text-[11px] font-semibold uppercase tracking-[0.28em] text-white transition-colors hover:bg-[#6c5e06] sm:px-14"
              >
                Ver rotina sugerida
                <Sparkles className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </section>

        <section className="overflow-hidden bg-[#f6f3f2] px-4 py-20 sm:px-6 lg:px-8 lg:py-32">
          <div className="mx-auto grid max-w-screen-2xl grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center lg:gap-12">
            <div className="order-2 flex flex-col justify-center space-y-8 lg:order-1 lg:col-span-5 lg:space-y-12">
              <div className="space-y-5">
                <span className="block text-[10px] font-bold uppercase tracking-[0.5em] text-[#6c5e06]">
                  Produto em destaque
                </span>
                <h2 className="font-headline text-4xl leading-none tracking-[-0.05em] text-[#1c1b1b] sm:text-5xl xl:text-7xl">
                  Curadoria com criterio
                </h2>
                <div className="h-px w-24 bg-[#6c5e06]" />
              </div>

              <div className="max-w-md space-y-7">
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#444748]">
                  Soro Regenerador Orquidea Imperial
                </p>
                <p className="font-headline text-2xl italic leading-relaxed text-[#444748]">
                  &ldquo;Cada produto disponivel na BelaPop passa por avaliacao de procedencia e
                  formulacao.&rdquo;
                </p>
                <p className="text-base leading-relaxed text-[#444748]/90">
                  Trabalhamos com sellers verificados e marcas com distribuicao oficial,
                  garantindo autenticidade e consistencia.
                </p>
                <div className="flex flex-col gap-5 pt-2 sm:flex-row sm:items-center sm:gap-8">
                  <Link
                    href="/skincare"
                    className="inline-flex min-h-16 items-center justify-center bg-black px-8 text-[11px] font-semibold uppercase tracking-[0.24em] text-white transition-colors hover:bg-[#6c5e06]"
                  >
                    Continuar cuidado
                  </Link>
                  <span className="font-headline text-2xl text-black">R$ 1.280,00</span>
                </div>
              </div>
            </div>

            <div className="order-1 relative flex justify-end lg:order-2 lg:col-span-7">
              <div className="relative w-full max-w-2xl overflow-hidden bg-white shadow-2xl">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAELPiY0PPK7707M_jedsr37glSJgndoUJEjAqypBaCkcCar-rSm0Mx8CfUxyi2fYbExegdp39FFzNvXH0m61k70z_CCTElcKxSheZAe9oYjidxFzNWN_TnIqmovi0SWbk9kAjQOgm6HAdETOxBWMgPeHPp_2hUjtpitE0P16oMZR9uicTcERU1dsBUp4S6IR5X7vc6YDj4tr7mFpt2k1hO0l57KILXQPF9XvO-EFqad0nUWyHACIV-I_XrhyX5QTfyvJdo2D8ajHA8"
                  alt="Frasco de serum em composicao minimalista"
                  className="aspect-[3/4] h-full w-full object-cover transition-transform duration-1000 hover:scale-105"
                />
                <div className="pointer-events-none absolute right-[-30px] top-10 hidden rotate-90 xl:block">
                  <span className="whitespace-nowrap text-[80px] font-black uppercase tracking-[-0.05em] text-black/5">
                    CURADORIA
                  </span>
                </div>
              </div>

              <div className="absolute -bottom-10 -left-6 hidden h-72 w-56 overflow-hidden border-[18px] border-white bg-[#fcf9f8] shadow-xl xl:block">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCHOa6DQuTJ48Vw1brdsuAtc3U5aBvojd4nYOIM1ahClkCfScXI6UlmTjEwMKAww_vcn3yxhBnt7wCe7FphWhmISVUabHI9bkomZx_MU35HnwWV0RYy3Q0IGuBwomJP1dC69iD3O9PT8279mzkjfIKkh0qFiwymOg1A5QbzuxmNtlLiQLkJPbQRXzyvPSTEblzC4Zq1G-P7xyXl-AF2BFONR3ORsvDQ7X7m8sik6k_dTmen4NR2-Mf-1XmYoig8koP5aUQjM9O8ogyW"
                  alt="Close da formulacao do serum"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#fcf9f8] px-4 py-20 sm:px-6 lg:px-8 lg:py-32">
          <div className="mx-auto max-w-7xl">
            <div className="mb-14 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-4">
                <div className="mb-2 flex items-center gap-3">
                  <img src="/logo-dark.svg" alt="BelaPop selo" className="h-8 w-auto rounded-full shadow-sm" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6c5e06]">
                    Transparencia na compra
                  </span>
                </div>
                <span className="text-xs uppercase tracking-widest text-[#444748]">
                  Decisao guiada
                </span>
                <h3 className="font-headline text-4xl text-black">Como funciona a BelaPop</h3>
                <p className="max-w-2xl text-sm leading-relaxed text-[#444748] sm:text-base">
                  Selecionamos produtos com base em criterios tecnicos. A venda e realizada por
                  parceiros aprovados dentro da plataforma. Voce compra com transparencia e
                  acompanhamento.
                </p>
              </div>
              <Link
                href="/skincare"
                className="w-fit border-b border-black pb-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-black"
              >
                Continuar cuidado
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
              {curationProducts.map((product) => (
                <LuxuryProductCard key={product.title} {...product} />
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#f6f3f2] px-4 py-20 sm:px-6 lg:px-8 lg:py-32">
          <div className="mx-auto max-w-7xl">
            <h3 className="mb-14 text-center font-headline text-4xl text-black sm:text-5xl">
              Menos excesso. Mais precisao.
            </h3>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
              <article className="bg-white p-6 sm:p-8 lg:col-span-7 lg:p-12">
                <div className="flex h-full flex-col justify-between gap-8">
                  <div>
                    <span className="mb-6 block text-[10px] font-bold uppercase tracking-[0.24em] text-[#6c5e06]">
                      Posicionamento
                    </span>
                    <h4 className="font-headline text-3xl leading-tight text-black sm:text-4xl">
                      Skincare nao deve depender de tentativa.
                    </h4>
                    <p className="mt-8 text-base leading-relaxed text-[#444748]">
                      <span className="block">
                        Acreditamos que skincare nao deve ser confuso, nem baseado em tentativa.
                      </span>
                      <span className="mt-4 block">
                        Cuidar da pele e entender, ajustar e manter.
                      </span>
                    </p>
                  </div>

                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDfKssavQgXWVJGMuXtF2tsXOA1QNybmSpcx2YgImEOWaI5EPCyUZopTblVaoKFEtwOTivIGkJFX5OE1FWqhgU94MwErattaSx7PvwQn2js7qAtTgPpsNNIYoi_dU45_fVE65KowqtFqLRColX_l1Q35s_f0CTrynv-L2-Z1NwzXgnqRjXmebr1qp3fyGpO0aMnbC0sAkYVu3-v_Dyd9q6PqvGVrmgrwiJOhMKB6UZ-J-pEE9Yi07adsLPSmxGUT5wQ8b24FSvAl0rg"
                    alt="Close de formulacao em detalhe"
                    className="h-72 w-full object-cover grayscale sm:h-80"
                  />
                </div>
              </article>

              <div className="flex flex-col gap-8 lg:col-span-5">
                <article className="flex-1 bg-black p-8 text-white sm:p-10">
                  <h4 className="font-headline text-2xl leading-tight sm:text-3xl">
                    Cuidar da pele e entender, ajustar e manter.
                  </h4>
                  <Link
                    href="/skin-scan"
                    className="mt-8 inline-flex border-b border-white pb-1 text-[10px] font-semibold uppercase tracking-[0.22em]"
                  >
                    Entender minha pele
                  </Link>
                </article>

                <Link href="/skin-scan" className="group relative block min-h-[320px] overflow-hidden">
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBnCaCxumv66cNiXxJeCDTmLxTjP9TSghRJD0i8pBRrHlUA_08tn990xVShgXuEdGFz_Vh0PrcBLus6QGTOLVr6WSmzNtAINZ994aVcPQjHbv52XNHsmlyRPXbkXeBNv5vEQRVQB45JeW43D_Litgx7M6AXTv8_GXLe7NRpjwuhXz6WdpPTvaUSKeeU6PmRi7E_xWqjthIf7UYKTCINyOGzJEfLmkGOBpBT5IdCjXu-Xdy45Vp4zK7KfosvLGfuNJIDVEk2E93HoPQ8"
                    alt="Pele em close com luz suave"
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/40" />
                  <div className="absolute inset-0 flex items-center justify-center p-8">
                    <h4 className="text-center font-headline text-2xl text-white">
                      Uma interface de decisao em skincare.
                    </h4>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#fcf9f8] px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <TrustSignals />
          </div>
        </section>
      </div>

      <footer className="bg-black px-4 py-16 text-white sm:px-6 lg:px-8 lg:py-20">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-6">
            <div className="font-headline text-lg font-bold">BelaPop</div>
            <p className="max-w-xs font-body text-[10px] uppercase tracking-[0.18em] leading-relaxed text-gray-400">
              Analise, procedencia e acompanhamento para uma rotina de skincare com mais clareza.
            </p>
            <div className="max-w-sm space-y-2 text-xs leading-6 text-gray-400">
              <p>63.945.608 GIOVANNA DE SOUSA FERREIRA SANTOS</p>
              <p>CNPJ 63.945.608/0001-09</p>
              <p>Rua Coromandel, 189, Bairro Amorim, Araguari/MG, CEP 38446-093</p>
            </div>
            <p className="max-w-sm text-[10px] uppercase tracking-[0.18em] text-gray-500">
              E-mail institucional, canal de privacidade e responsavel por dados: pendente de
              validacao operacional.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Link
                href="/contato"
                className="font-body text-[10px] uppercase tracking-[0.16em] text-gray-400 transition-colors hover:text-white"
              >
                Instagram
              </Link>
              <Link
                href="/contato"
                className="font-body text-[10px] uppercase tracking-[0.16em] text-gray-400 transition-colors hover:text-white"
              >
                TikTok
              </Link>
              <Link
                href="/contato"
                className="font-body text-[10px] uppercase tracking-[0.16em] text-gray-400 transition-colors hover:text-white"
              >
                Facebook
              </Link>
              <Link
                href="/contato"
                className="font-body text-[10px] uppercase tracking-[0.16em] text-gray-400 transition-colors hover:text-white"
              >
                WhatsApp
              </Link>
            </div>
          </div>

          {footerColumns.map((column) => (
            <FooterColumn key={column.title} title={column.title} links={column.links} />
          ))}
        </div>

        <div className="mx-auto mt-16 max-w-7xl border-t border-white/5 pt-10">
          <p className="text-center font-body text-[10px] uppercase tracking-[0.18em] text-gray-400">
            &copy; 2026 BelaPop. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
