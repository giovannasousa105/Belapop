"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  Blend,
  Check,
  Droplets,
  Eye,
  Flame,
  Menu,
  ScanLine,
  Shield,
  Sparkles,
  User,
  Waves,
  Wind,
  X
} from "lucide-react";

type FocusKey =
  | "acne"
  | "oleosidade"
  | "manchas"
  | "linhas"
  | "sensibilidade"
  | "poros"
  | "brilho"
  | "hidratacao"
  | "textura"
  | "olheiras";

type FocusItem = {
  key: FocusKey;
  number: string;
  labelMobile: string;
  labelDesktop: string;
  icon: LucideIcon;
  accentClass: string;
};

const focusItems: FocusItem[] = [
  {
    key: "acne",
    number: "01",
    labelMobile: "Acne",
    labelDesktop: "Acne e cravos",
    icon: Sparkles,
    accentClass: "text-[#5F9EA0]"
  },
  {
    key: "oleosidade",
    number: "02",
    labelMobile: "Oleosidade",
    labelDesktop: "Oleosidade excessiva",
    icon: Droplets,
    accentClass: "text-[#4A5D75]"
  },
  {
    key: "manchas",
    number: "03",
    labelMobile: "Manchas",
    labelDesktop: "Poros aparentes",
    icon: Blend,
    accentClass: "text-[#B2847A]"
  },
  {
    key: "linhas",
    number: "04",
    labelMobile: "Linhas Finas",
    labelDesktop: "Manchas e marcas",
    icon: Waves,
    accentClass: "text-[#C5B358]"
  },
  {
    key: "sensibilidade",
    number: "05",
    labelMobile: "Sensibilidade",
    labelDesktop: "Desidratacao",
    icon: Shield,
    accentClass: "text-[#7FB3D5]"
  },
  {
    key: "poros",
    number: "06",
    labelMobile: "Poros",
    labelDesktop: "Barreira sensibilizada",
    icon: ScanLine,
    accentClass: "text-[#E9967A]"
  },
  {
    key: "brilho",
    number: "07",
    labelMobile: "Brilho",
    labelDesktop: "Vermelhidao e rosacea",
    icon: Flame,
    accentClass: "text-[#7FB394]"
  },
  {
    key: "hidratacao",
    number: "08",
    labelMobile: "Hidratacao",
    labelDesktop: "Linhas finas e firmeza",
    icon: Droplets,
    accentClass: "text-[#CD7F32]"
  },
  {
    key: "textura",
    number: "09",
    labelMobile: "Textura",
    labelDesktop: "Textura irregular",
    icon: ScanLine,
    accentClass: "text-[#928E85]"
  },
  {
    key: "olheiras",
    number: "10",
    labelMobile: "Olheiras",
    labelDesktop: "Olheiras e area dos olhos",
    icon: Eye,
    accentClass: "text-[#5D5387]"
  }
];

const topDesktopLinks = [
  { label: "Skincare", href: "/skincare" },
  { label: "Makeup", href: "/maquiagem" },
  { label: "Hair", href: "/cabelos" },
  { label: "Perfume", href: "/perfumes" },
  { label: "Favorites", href: "/conta/favoritos" },
  { label: "POPCLUB", href: "/popclub" }
] as const;

const mobileMenuLinks = [
  { label: "Skincare", href: "/skincare" },
  { label: "Maquiagem", href: "/maquiagem" },
  { label: "Cabelos", href: "/cabelos" },
  { label: "Perfumes", href: "/perfumes" },
  { label: "PopClub", href: "/popclub" }
] as const;

const mobileBottomNav = [
  { label: "SCAN", href: "/skin-scan/foco", icon: Sparkles, active: true },
  { label: "ROUTINE", href: "/skin-scan/rotina", icon: Wind, active: false },
  { label: "SHOP", href: "/catalogo", icon: Flame, active: false },
  { label: "PROFILE", href: "/conta", icon: User, active: false }
] as const;

const desktopImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuATm4JvER6CkwiD6OsuZ7wiwziFarXrndMLduXGkdxHqJZsYJ9T-zCeTttDhTA3kwc9I5fuiPI7SezdZxdfjXsJUdeGqJDxFOirNCHctUte-w4uYSFJ_K0CgpQBGHKKZUCcjo_lyc2BQsIaigpxizH9dtM0m7F4VhDbOPm6x4SB1spP2FbAlMsZ4uolKpQIKQpxZpmC-v-m_sPGxzrj9Ut9XDLAfd8I0E_AVa6ILCpnSeZlaZuviWUhG69UH7Pp8QD0r9ggGsfHLb-f";

const mobileHeroImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuColC5xC9adYD5I5smGvPsHCVyb9xz9zogGxjX17v4T9qvP9EFi2GtGV3Rn65SEHAheCX1HOUrceTNfP5VSMhQwnQigqfw_LKcGO8H-dBk8WuK_3VyFgvcult3Ol6yNgFKd5bMa9z4G_HfbdO1posZILCThtb-OHsJf2OhyEPxpg8_7d1sUZn7fyWW8OeO0sdFAgXxPVkLWHDHj1OZCmzfxkmqDx-Xydn_V-K4Udq3TsHS9UmaAu9cOS15tUwupz2go1XJMUC2MmJm4";

export default function SkinScanGoalsExperience() {
  const [selected, setSelected] = useState<FocusKey[]>(["oleosidade"]);
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleFocus = (focus: FocusKey) => {
    setSelected((prev) =>
      prev.includes(focus) ? prev.filter((item) => item !== focus) : [...prev, focus]
    );
  };

  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b]">
      <header className="fixed inset-x-0 top-0 z-50 bg-black text-white md:bg-white/85 md:text-[#1c1b1b] md:backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-6 md:h-[88px] md:px-8">
          <div className="flex items-center gap-3 md:hidden">
            <Link
              href="/skin-scan"
              className="inline-flex h-10 w-10 items-center justify-center"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="hidden h-10 w-10 items-center justify-center md:inline-flex md:text-[#1c1b1b] lg:hidden"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <h1 className="[font-family:var(--font-playfair)] text-center text-xl font-bold tracking-[0.2em] md:text-2xl md:tracking-[-0.03em]">
            <span className="md:hidden">SKIN SCAN</span>
            <span className="hidden md:inline">BelaPop</span>
          </h1>

          <nav className="hidden items-center gap-8 lg:flex">
            {topDesktopLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="text-sm uppercase tracking-tight text-stone-500 transition-colors hover:text-stone-950"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-4 md:flex">
            <Link
              href="/conta"
              className="inline-flex h-10 w-10 items-center justify-center"
              aria-label="Conta"
            >
              <User className="h-5 w-5" />
            </Link>
            <Link
              href="/carrinho"
              className="inline-flex h-10 w-10 items-center justify-center"
              aria-label="Sacola"
            >
              <Flame className="h-5 w-5" />
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center md:hidden"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {menuOpen ? (
        <div className="fixed inset-0 z-[70] bg-black/45 backdrop-blur-sm">
          <aside className="h-full w-[86%] max-w-[340px] bg-[#fcf9f8] p-6">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="[font-family:var(--font-playfair)] text-xl tracking-tight">Menu</h2>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center border border-black/10"
                aria-label="Fechar menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="space-y-2">
              {mobileMenuLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex min-h-14 items-center border border-black/10 bg-white px-4 text-xs uppercase tracking-[0.2em]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 -z-10"
            onClick={() => setMenuOpen(false)}
          />
        </div>
      ) : null}

      <main className="mx-auto max-w-7xl px-6 pb-32 pt-24 md:px-12 md:pb-24 md:pt-32">
        <section className="mb-12 text-center md:mb-24 md:flex md:items-end md:justify-between md:text-left">
          <div className="md:max-w-2xl">
            <span className="mb-4 block text-[10px] uppercase tracking-[0.22em] text-[#444748] md:mb-6">
              AI Skin Analysis - Step 01
            </span>
            <h2 className="[font-family:var(--font-playfair)] text-3xl leading-tight tracking-tight md:text-7xl md:font-black md:tracking-tighter">
              Selecione seu foco de cuidado
            </h2>
          </div>
          <p className="mx-auto mt-4 max-w-[80%] text-sm leading-relaxed text-[#444748] md:mx-0 md:mt-0 md:max-w-xs md:italic">
            Para uma analise precisa, identifique as areas que mais demandam atencao em sua
            rotina atual.
          </p>
        </section>

        <section className="mb-16 grid grid-cols-2 gap-4 bg-transparent md:grid-cols-4 md:gap-0 lg:grid-cols-5">
          {focusItems.map((item) => {
            const Icon = item.icon;
            const isSelected = selected.includes(item.key);
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => toggleFocus(item.key)}
                className={`group relative min-h-[136px] border p-6 text-left transition-all active:scale-[0.98] md:aspect-square md:min-h-[210px] md:border-[#e5e2e1] md:p-8 ${
                  isSelected
                    ? "border-black bg-black text-white"
                    : "border-black/8 bg-[#f6f3f2] hover:border-black/20 hover:bg-white"
                }`}
              >
                <span className="text-[10px] uppercase tracking-[0.2em] opacity-60 md:block">
                  {item.number}
                </span>
                <div className="mt-4 flex items-start justify-between md:mt-12 md:flex-col md:items-start md:justify-start">
                  <Icon
                    className={`h-8 w-8 md:mb-4 md:h-10 md:w-10 ${
                      isSelected ? "text-white" : item.accentClass
                    } transition-transform duration-300 group-hover:scale-110`}
                  />
                  <div className="ml-4 flex-1 md:ml-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] md:hidden">
                      {item.labelMobile}
                    </p>
                    <p className="hidden [font-family:var(--font-playfair)] text-lg font-bold leading-none md:block">
                      {item.labelDesktop}
                    </p>
                  </div>
                  {isSelected ? <Check className="h-4 w-4 md:absolute md:right-5 md:top-5" /> : null}
                </div>
              </button>
            );
          })}
        </section>

        <section className="mb-8 flex items-start gap-4 bg-[#f6f3f2] p-6 md:mt-24 md:items-center md:justify-between md:border-t md:border-[#e5e2e1] md:bg-transparent md:px-0 md:pt-12">
          <div className="flex items-start gap-4">
            <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center bg-[#e5e2e1]">
              <AlertCircle className="h-5 w-5" />
            </div>
            <p className="max-w-xs text-[11px] leading-relaxed text-[#444748] md:text-xs">
              Voce pode selecionar multiplos focos. Quanto mais detalhado, melhor sera a precisao
              do seu scan.
            </p>
          </div>

          <Link
            href="/skin-scan/captura"
            className="hidden min-h-14 items-center justify-center bg-black px-16 text-xs font-bold uppercase tracking-[0.2em] text-white transition hover:bg-[#1c1b1b] md:inline-flex"
          >
            Iniciar Diagnostico IA
          </Link>
        </section>

        <div className="md:hidden">
          <Link
            href="/skin-scan/captura"
            className="inline-flex min-h-14 w-full items-center justify-center gap-3 bg-black px-8 text-xs font-extrabold uppercase tracking-[0.2em] text-white transition hover:opacity-90"
          >
            INICIAR DIAGNOSTICO IA
            <span aria-hidden>→</span>
          </Link>
        </div>
      </main>

      <section className="hidden bg-[#f6f3f2] py-24 md:block">
        <div className="mx-auto grid max-w-7xl grid-cols-2 items-center gap-24 px-6">
          <div className="relative">
            <div className="relative h-[600px] w-full overflow-hidden">
              <Image
                src={desktopImage}
                alt="Textura de skincare editorial"
                fill
                unoptimized
                sizes="50vw"
                className="object-cover grayscale"
              />
            </div>
            <div className="absolute -bottom-12 -right-12 max-w-sm bg-white p-12">
              <h4 className="[font-family:var(--font-playfair)] mb-4 text-2xl font-black italic">
                The Science of Glow.
              </h4>
              <p className="text-sm text-[#444748]">
                Nossa tecnologia analisa marcadores visiveis para entregar uma rotina realmente
                coerente com seu momento.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-8">
            <h3 className="[font-family:var(--font-playfair)] text-4xl font-bold tracking-tight">
              Privacidade e Ciencia
            </h3>
            <div className="space-y-6">
              <div className="flex gap-6">
                <Shield className="h-8 w-8 shrink-0" />
                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-widest">Dados protegidos</p>
                  <p className="text-sm text-[#444748]">
                    Suas imagens sao processadas com criptografia e nao sao compartilhadas sem
                    consentimento.
                  </p>
                </div>
              </div>
              <div className="flex gap-6">
                <Sparkles className="h-8 w-8 shrink-0" />
                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-widest">Analise cosmetica</p>
                  <p className="text-sm text-[#444748]">
                    Algoritmos e regras tecnicas para identificar padroes visiveis e apoiar a
                    decisao da rotina.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="hidden bg-stone-950 text-stone-50 md:block">
        <div className="mx-auto grid max-w-7xl grid-cols-4 gap-12 px-12 py-24">
          <div className="space-y-6">
            <div className="[font-family:var(--font-playfair)] text-lg font-bold">BelaPop</div>
            <p className="text-[10px] uppercase tracking-widest text-stone-400">
              Curated Canvas for the Modern Soul.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <span className="text-sm font-bold text-stone-50">Institutional</span>
            <Link className="text-[10px] uppercase tracking-widest text-stone-400 transition-colors hover:text-white" href="/sobre">
              About Us
            </Link>
            <Link className="text-[10px] uppercase tracking-widest text-stone-400 transition-colors hover:text-white" href="/aviso-de-privacidade">
              Privacy Policy
            </Link>
            <Link className="text-[10px] uppercase tracking-widest text-stone-400 transition-colors hover:text-white" href="/termos-e-condicoes">
              Terms of Service
            </Link>
          </div>
          <div className="flex flex-col gap-4">
            <span className="text-sm font-bold text-stone-50">Customer Support</span>
            <Link className="text-[10px] uppercase tracking-widest text-stone-400 transition-colors hover:text-white" href="/contato">
              FAQ
            </Link>
            <Link className="text-[10px] uppercase tracking-widest text-stone-400 transition-colors hover:text-white" href="/rastreio">
              Shipping
            </Link>
            <Link className="text-[10px] uppercase tracking-widest text-stone-400 transition-colors hover:text-white" href="/termos-e-condicoes">
              Returns
            </Link>
          </div>
          <div className="flex flex-col gap-4">
            <span className="text-sm font-bold text-stone-50">Social</span>
            <a className="text-[10px] uppercase tracking-widest text-stone-400 transition-colors hover:text-white" href="#">
              Instagram
            </a>
            <a className="text-[10px] uppercase tracking-widest text-stone-400 transition-colors hover:text-white" href="#">
              Pinterest
            </a>
            <a className="text-[10px] uppercase tracking-widest text-stone-400 transition-colors hover:text-white" href="#">
              TikTok
            </a>
          </div>
        </div>
        <div className="border-t border-stone-900 px-12 py-8">
          <p className="text-center text-[10px] uppercase tracking-widest text-stone-500">
            © 2024 THE CURATED CANVAS. ALL RIGHTS RESERVED.
          </p>
        </div>
      </footer>

      <nav className="fixed inset-x-0 bottom-0 z-50 flex h-20 items-center justify-around border-t border-black/10 bg-white/85 px-4 pb-4 pt-2 backdrop-blur-xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)] md:hidden">
        {mobileBottomNav.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center pt-2 ${
                item.active ? "border-t-2 border-black text-black" : "text-neutral-400"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="mt-1 text-[10px] font-bold uppercase tracking-widest">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
