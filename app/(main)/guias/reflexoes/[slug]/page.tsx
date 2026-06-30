import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { BelaPopValidatedHeader } from "@/components/luxury/BelaPopValidatedHeader";
import { BelaPopValidatedFooter } from "@/components/luxury/BelaPopValidatedFooter";
import { reflexoes } from "@/lib/diario/data";

type ReflexaoPageProps = {
  params: Promise<{ slug: string }>;
};

const REFLEXAO_BRIDGE: Record<string, { label: string; href: string }> = {
  "curadoria-nao-e-luxo": { label: "Conheça o Círculo BelaPop", href: "/circulo" },
  "menos-produtos-mais-consistencia": { label: "Ver rotina guiada", href: "/guias/rotinas" },
  "o-que-coreanas-sabem": { label: "Explorar skincare", href: "/skincare" }
};

export function generateStaticParams() {
  return reflexoes.map((reflexao) => ({ slug: reflexao.slug }));
}

export async function generateMetadata({ params }: ReflexaoPageProps): Promise<Metadata> {
  const { slug } = await params;
  const reflexao = reflexoes.find((item) => item.slug === slug);
  if (!reflexao) return { title: "Reflexão não encontrada | BelaPop" };

  return {
    title: `${reflexao.title} | Guias BelaPop`,
    description: reflexao.excerpt,
    alternates: { canonical: `/guias/reflexoes/${reflexao.slug}` }
  };
}

export default async function ReflexaoDetailPage({ params }: ReflexaoPageProps) {
  const { slug } = await params;
  const reflexao = reflexoes.find((item) => item.slug === slug);
  if (!reflexao) notFound();

  const bridge = REFLEXAO_BRIDGE[reflexao.slug];

  return (
    <>
      <BelaPopValidatedHeader activeSection="diario" />
      <main className="bg-[#fcf9f8] pb-24 pt-28 text-[#1c1b1b] lg:pt-36">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <nav className="mb-8 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#8a8179]">
            <Link href="/guias/reflexoes" className="flex items-center gap-1 hover:text-[#1c1b1b]">
              <ArrowLeft className="h-3.5 w-3.5" /> Reflexões
            </Link>
          </nav>

          {reflexao.tema && (
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8a8179]">{reflexao.tema}</p>
          )}

          <span className="mt-4 block font-headline text-5xl leading-none text-black/10">"</span>

          <h1 className="mt-4 font-headline text-4xl leading-tight tracking-[-0.03em] sm:text-5xl">
            {reflexao.title}
          </h1>

          <p className="mt-8 text-lg italic leading-8 text-[#3a3633]">{reflexao.excerpt}</p>

          <p className="mt-6 text-[10px] uppercase tracking-[0.1em] text-[#8a8179]">{reflexao.readTime} min de leitura</p>

          {bridge && (
            <div className="mt-12">
              <Link
                href={bridge.href}
                className="inline-flex w-fit items-center border border-black px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-black transition hover:bg-black hover:text-white"
              >
                {bridge.label} →
              </Link>
            </div>
          )}
        </div>
      </main>
      <BelaPopValidatedFooter />
    </>
  );
}
