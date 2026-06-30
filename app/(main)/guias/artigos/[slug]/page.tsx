import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { BelaPopValidatedHeader } from "@/components/luxury/BelaPopValidatedHeader";
import { BelaPopValidatedFooter } from "@/components/luxury/BelaPopValidatedFooter";
import { artigos } from "@/lib/diario/data";
import { ingredientGuides } from "@/lib/content/popGuide";

type ArtigoPageProps = {
  params: Promise<{ slug: string }>;
};

const ARTIGO_ATIVO_BRIDGE: Record<string, string> = {
  "protetor-solar-rotina-coreana": "protetor-solar",
  "barreira-cutanea": "ceramidas"
};

export function generateStaticParams() {
  return artigos.map((artigo) => ({ slug: artigo.slug }));
}

export async function generateMetadata({ params }: ArtigoPageProps): Promise<Metadata> {
  const { slug } = await params;
  const artigo = artigos.find((item) => item.slug === slug);
  if (!artigo) return { title: "Artigo não encontrado | BelaPop" };

  return {
    title: `${artigo.title} | Guias BelaPop`,
    description: artigo.excerpt,
    alternates: { canonical: `/guias/artigos/${artigo.slug}` }
  };
}

export default async function ArtigoDetailPage({ params }: ArtigoPageProps) {
  const { slug } = await params;
  const artigo = artigos.find((item) => item.slug === slug);
  if (!artigo) notFound();

  const ativoSlug = ARTIGO_ATIVO_BRIDGE[artigo.slug];
  const ativo = ativoSlug ? ingredientGuides.find((guide) => guide.slug === ativoSlug) : null;

  return (
    <>
      <BelaPopValidatedHeader activeSection="diario" />
      <main className="bg-[#fcf9f8] pb-24 pt-28 text-[#1c1b1b] lg:pt-36">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <nav className="mb-8 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#8a8179]">
            <Link href="/guias/artigos" className="flex items-center gap-1 hover:text-[#1c1b1b]">
              <ArrowLeft className="h-3.5 w-3.5" /> Artigos
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#6c5e06]">{artigo.tag}</span>
            <span className="text-[10px] text-[#8a8179]">· {artigo.readTime} min de leitura</span>
          </div>

          <h1 className="mt-4 font-headline text-4xl leading-tight tracking-[-0.03em] sm:text-5xl">
            {artigo.title}
          </h1>

          {artigo.coverUrl && (
            <div className="mt-8 aspect-video overflow-hidden bg-[#f6f3f2]">
              <img src={artigo.coverUrl} alt={artigo.title} className="h-full w-full object-cover" />
            </div>
          )}

          <p className="mt-8 text-lg leading-8 text-[#3a3633]">{artigo.excerpt}</p>

          {ativo && (
            <div className="mt-12 border border-[#ded8d2] bg-white p-6 sm:p-8">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#6c5e06]">Aprofunde no ativo</p>
              <h2 className="mt-3 font-headline text-2xl leading-tight">{ativo.name}</h2>
              <p className="mt-2 text-sm leading-7 text-[#5f5a55]">{ativo.summary}</p>
              <Link
                href={`/guias/ativos/${ativo.slug}`}
                className="mt-5 inline-flex w-fit border-b border-black pb-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-black hover:opacity-60"
              >
                Ver guia completo e produtos indicados →
              </Link>
            </div>
          )}

          <div className="mt-12">
            <Link
              href="/skincare"
              className="inline-flex w-fit items-center border border-black px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-black transition hover:bg-black hover:text-white"
            >
              Ver produtos de skincare
            </Link>
          </div>
        </div>
      </main>
      <BelaPopValidatedFooter />
    </>
  );
}
