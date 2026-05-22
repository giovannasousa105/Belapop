import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import {
  IngredientGuideCard,
  WeeklyCurationCard
} from "@/components/pop-guide/PopGuideCards";
import { ConciergeCTA, SkinScanCTA } from "@/components/pop-guide/PopGuideActions";
import { BelaPopValidatedFooter } from "@/components/luxury/BelaPopValidatedFooter";
import { BelaPopValidatedHeader } from "@/components/luxury/BelaPopValidatedHeader";
import {
  ingredientGuides,
  routineGuides,
  weeklyCurationItems,
  worthInvestmentGuides
} from "@/lib/content/popGuide";

export const metadata: Metadata = {
  title: "Guias BelaPop | Consultoria de beleza compravel",
  description:
    "Guias de ativos, rotinas por necessidade, curadoria da semana e analises vale o investimento conectadas a produtos e kits BelaPop."
};

export default function PopGuideIndexPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Guias BelaPop",
    description:
      "Consultoria editorial compravel para escolher ativos, rotinas, produtos e kits com mais confianca."
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <BelaPopValidatedHeader activeSection="diario" />
      <main className="bg-[#fcf9f8] pb-20 pt-20 text-[#1c1b1b] lg:pt-28">
        <section className="px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto grid max-w-[1440px] gap-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(360px,0.48fr)] lg:items-end">
            <div>
              <nav className="text-[10px] font-bold uppercase tracking-[0.26em] text-[#8a8179]">
                <Link href="/">BelaPop</Link> / Guias
              </nav>
              <p className="mt-8 text-[10px] font-bold uppercase tracking-[0.36em] text-[#6c5e06]">
                Pop Guide
              </p>
              <h1 className="mt-4 max-w-4xl font-headline text-5xl leading-[0.92] tracking-[-0.045em] sm:text-6xl lg:text-7xl">
                Consultoria de beleza que termina em decisao de compra.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-[#5f5a55]">
                Ativos, rotinas, curadoria da semana e analises comerciais para
                reduzir indecisao, organizar a ordem de uso e conectar cada
                escolha a produtos, colecoes e kits compraveis.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <SkinScanCTA label="Montar minha rotina" />
                <ConciergeCTA origin="pop_guide_index_hero" />
              </div>
            </div>
            <aside className="border-l border-[#d8d0c8] pl-5 text-sm leading-7 text-[#5f5a55]">
              <p>
                A experiencia foi desenhada para funcionar como uma curadora:
                explicar o suficiente, mostrar o que comprar e sugerir quando
                vale ir para um kit em vez de produto solto.
              </p>
            </aside>
          </div>
        </section>

        <section className="px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-[1440px] gap-4 md:grid-cols-4">
            {[
              ["Guias de ativos", "/guias#ativos"],
              ["Rotinas por necessidade", "/guias#rotinas"],
              ["Curadoria da semana", "/guias/curadoria-da-semana"],
              ["Vale o investimento?", "/guias#vale-o-investimento"]
            ].map(([label, href]) => (
              <Link
                key={label}
                href={href}
                className="flex min-h-[88px] items-center justify-between border border-[#ded8d2] bg-white px-5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#1c1b1b] transition hover:border-[#1c1b1b]"
              >
                {label}
                <ArrowRight className="h-4 w-4" />
              </Link>
            ))}
          </div>
        </section>

        <section id="ativos" className="px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1440px]">
            <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#6c5e06]">
                  Guias de ativos
                </p>
                <h2 className="mt-3 font-headline text-4xl leading-[0.95] tracking-[-0.04em]">
                  Entenda o ativo antes de comprar o produto.
                </h2>
              </div>
              <Link
                href="/guias/ativos/niacinamida"
                className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#1c1b1b]"
              >
                Comecar por niacinamida
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {ingredientGuides.map((guide) => (
                <IngredientGuideCard key={guide.slug} guide={guide} />
              ))}
            </div>
          </div>
        </section>

        <section id="rotinas" className="bg-white/60 px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1440px]">
            <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#6c5e06]">
              Rotinas por necessidade
            </p>
            <h2 className="mt-3 max-w-3xl font-headline text-4xl leading-[0.95] tracking-[-0.04em]">
              Escolha pelo que sua pele precisa resolver agora.
            </h2>
            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {routineGuides.map((routine) => (
                <Link
                  key={routine.slug}
                  href={`/guias/rotinas/${routine.slug}`}
                  className="border border-[#ded8d2] bg-[#fcf9f8] p-5 transition hover:-translate-y-1 hover:border-[#1c1b1b]"
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8a8179]">
                    Ticket estimado
                  </p>
                  <p className="mt-2 font-headline text-2xl">
                    R$ {routine.estimatedTicket.toFixed(2).replace(".", ",")}
                  </p>
                  <h3 className="mt-5 font-headline text-3xl leading-[0.95] tracking-[-0.04em]">
                    {routine.title}
                  </h3>
                  <p className="mt-4 text-sm leading-6 text-[#5f5a55]">{routine.promise}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1440px]">
            <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#6c5e06]">
                  Curadoria da semana
                </p>
                <h2 className="mt-3 font-headline text-4xl leading-[0.95] tracking-[-0.04em]">
                  O que a BelaPop escolheria hoje.
                </h2>
              </div>
              <Link
                href="/guias/curadoria-da-semana"
                className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#1c1b1b]"
              >
                Ver curadoria completa
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-3 md:grid md:grid-cols-3 xl:grid-cols-4">
              {weeklyCurationItems.slice(0, 4).map((item) => (
                <WeeklyCurationCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        </section>

        <section id="vale-o-investimento" className="px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1440px] border-y border-[#ded8d2] py-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#6c5e06]">
              Vale o investimento?
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {worthInvestmentGuides.map((guide) => (
                <Link
                  key={guide.slug}
                  href={`/guias/vale-o-investimento/${guide.slug}`}
                  className="border border-[#ded8d2] bg-white p-6 transition hover:border-[#1c1b1b]"
                >
                  <h2 className="font-headline text-4xl leading-[0.95] tracking-[-0.04em]">
                    {guide.productName}
                  </h2>
                  <p className="mt-4 text-sm leading-6 text-[#5f5a55]">
                    {guide.promise}
                  </p>
                  <span className="mt-6 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em]">
                    Ler analise comercial
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <BelaPopValidatedFooter />
    </>
  );
}
