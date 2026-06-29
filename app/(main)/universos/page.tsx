/* eslint-disable @next/next/no-img-element */

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, ScanFace, Sparkles } from "lucide-react";

import { EditorialDiscoveryGrid } from "@/components/universes/EditorialDiscoveryGrid";
import { BelaPopValidatedFooter } from "@/components/luxury/BelaPopValidatedFooter";
import { BelaPopValidatedHeader } from "@/components/luxury/BelaPopValidatedHeader";
import { belaPopUniverses } from "@/lib/discovery/universes";

export const metadata: Metadata = {
  title: "Universos BelaPop | Curadoria editorial de beleza",
  description:
    "Explore universos editoriais BelaPop para descobrir produtos, kits, coleções e rotinas por desejo, momento de pele e intencao de compra.",
  alternates: { canonical: "/universos" },
  openGraph: {
    title: "Universos BelaPop",
    description:
      "Curadoria editorial e comprável para descobrir beleza por universos.",
    url: "/universos",
    siteName: "BelaPop",
    images: [{ url: "/hero-bela-pop-editorial.jpg", alt: "Universos BelaPop" }],
    type: "website"
  }
};

export default function UniversesPage() {
  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b]">
      <BelaPopValidatedHeader activeSection="universos" />
      <main className="pt-20 lg:pt-28">
        <section className="relative min-h-[68vh] overflow-hidden bg-[#111111] text-white lg:min-h-[72vh]">
          <img
            src="/hero-bela-pop-editorial.jpg"
            alt="Cena editorial BelaPop com curadoria premium de beleza."
            className="absolute inset-0 h-full w-full object-cover object-center opacity-86"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.82)_0%,rgba(0,0,0,0.46)_52%,rgba(0,0,0,0.18)_100%)]" />
          <div className="relative z-10 flex min-h-[68vh] items-end px-5 py-12 sm:px-8 lg:min-h-[72vh] lg:px-12 lg:py-16">
            <div className="max-w-5xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-[#DAC769]">
                Universos BelaPop
              </p>
              <h1 className="mt-5 max-w-[11ch] font-headline text-6xl leading-none tracking-normal sm:text-7xl lg:text-9xl">
                Explore por universo.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-white/84 lg:text-lg">
                Uma arquitetura editorial e comprável para entrar na BelaPop por desejo, pele, presente, ciência ou descoberta.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#universos"
                  className="inline-flex min-h-14 items-center justify-center gap-3 bg-white px-7 text-[10px] font-bold uppercase tracking-[0.22em] text-black transition hover:bg-[#DAC769]"
                >
                  Escolher universo
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </a>
                <Link
                  href="/skin-scan"
                  className="inline-flex min-h-14 items-center justify-center gap-3 border border-white/30 bg-white/10 px-7 text-[10px] font-bold uppercase tracking-[0.22em] text-white backdrop-blur transition hover:border-white hover:bg-white/16"
                >
                  Fazer Skin Scan
                  <ScanFace className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#fcf9f8] px-5 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto grid max-w-[1440px] gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,0.42fr)] lg:items-end">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#6c5e06]">
                Escolha seu universo de beleza
              </p>
              <h2 className="mt-4 max-w-4xl font-headline text-4xl leading-tight tracking-normal sm:text-5xl lg:text-6xl">
                Menos busca fria, mais descoberta guiada por curadoria.
              </h2>
            </div>
            <div className="border-l border-[#d8d0c8] pl-5 text-sm leading-7 text-[#5f5a55]">
              Cada universo conecta SKUs individuais, coleções, kits, rotinas, guias de ativos e conteúdos de decisão como vale o investimento.
            </div>
          </div>
        </section>

        <section id="universos" className="overflow-hidden bg-[#111111] px-0 py-16 text-white sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-[1440px]">
            <div className="px-5 sm:px-0">
              <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,0.48fr)] lg:items-end">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-[#DAC769]">
                    Explore por Universo
                  </p>
                  <h2 className="mt-4 max-w-4xl font-headline text-4xl leading-tight tracking-normal sm:text-5xl lg:text-7xl">
                    Seis portas editoriais para comprar melhor.
                  </h2>
                </div>
                <p className="max-w-md text-sm leading-7 text-white/72 sm:text-base">
                  Cards grandes, imagens com respiro e CTAs claros para navegar sem sentir excesso de marketplace.
                </p>
              </div>
            </div>

            <div className="mt-9">
              <EditorialDiscoveryGrid universes={belaPopUniverses} source="universes_index" />
            </div>
          </div>
        </section>

        <section className="bg-[#fcf9f8] px-5 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto grid max-w-[1440px] gap-5 lg:grid-cols-[minmax(0,0.58fr)_minmax(0,0.42fr)] lg:items-stretch">
            <div className="bg-[#111111] p-7 text-white sm:p-10">
              <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#DAC769]">
                Skin Scan quando fizer sentido
              </p>
              <h2 className="mt-4 font-headline text-4xl leading-tight tracking-normal sm:text-5xl">
                Quando a pele entra na decisão, o universo vira rotina.
              </h2>
              <p className="mt-5 max-w-xl text-sm leading-7 text-white/72">
                Pele Sensível e Clinical Luxury ganham mais precisão com a leitura do Skin Scan. Presentes e Novos no Atelier podem seguir por concierge quando a resposta não depende só de tipo de pele.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/skin-scan"
                  className="inline-flex min-h-14 items-center justify-center gap-3 bg-white px-7 text-[10px] font-bold uppercase tracking-[0.22em] text-black transition hover:bg-[#DAC769]"
                >
                  Fazer Skin Scan
                  <ScanFace className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/rituais"
                  className="inline-flex min-h-14 items-center justify-center gap-3 border border-white/30 px-7 text-[10px] font-bold uppercase tracking-[0.22em] text-white transition hover:bg-white hover:text-black"
                >
                  Montar minha rotina
                </Link>
              </div>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
              {belaPopUniverses.slice(0, 3).map((universe) => (
                <Link
                  key={universe.id}
                  href={`/universos/${universe.slug}`}
                  className="group border border-[#ded8d2] bg-white p-6 transition hover:-translate-y-1 hover:shadow-[0_18px_60px_rgba(28,27,27,0.07)]"
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#6c5e06]">
                    {universe.badge}
                  </p>
                  <h3 className="mt-3 font-headline text-3xl leading-tight tracking-normal">
                    {universe.name}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[#5f5a55]">{universe.discoveryPrompt}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.20em] text-[#1c1b1b]">
                    Explorar universo
                    <Sparkles className="h-4 w-4 transition group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <BelaPopValidatedFooter />
    </div>
  );
}
