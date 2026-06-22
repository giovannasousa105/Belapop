import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { BelaPopValidatedHeader } from "@/components/luxury/BelaPopValidatedHeader";
import { BelaPopValidatedFooter } from "@/components/luxury/BelaPopValidatedFooter";
import { reflexoes } from "@/lib/diario/data";

export const metadata: Metadata = {
  title: "Reflexões BelaPop | Pensamentos sobre pele, consumo e escolha",
  description: "Textos autorais da BelaPop sobre minimalismo em skincare, consumo consciente e K-beauty."
};

export default function ReflexoesPage() {
  return (
    <>
      <BelaPopValidatedHeader activeSection="diario" />
      <main className="bg-[#fcf9f8] pb-24 pt-28 text-[#1c1b1b] lg:pt-36">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <nav className="mb-8 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-[#8a8179]">
            <Link href="/guias" className="flex items-center gap-1 hover:text-[#1c1b1b]">
              <ArrowLeft className="h-3.5 w-3.5" /> Guias
            </Link>
            <span>/</span>
            <span className="text-[#1c1b1b]">Reflexões</span>
          </nav>

          <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#6c5e06]">Reflexões</p>
          <h1 className="mt-3 font-headline text-5xl leading-[0.92] tracking-[-0.04em] sm:text-6xl">
            Pensamentos sobre<br />pele e escolha.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-[#5f5a55]">
            Menos tutorial, mais ponto de vista. Escritas pela curadoria BelaPop.
          </p>

          <div className="mt-12">
            {reflexoes.length > 0 ? (
              <div className="grid gap-0 divide-y divide-[#ded8d2] md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-3">
                {reflexoes.map((reflexao) => (
                  <Link
                    key={reflexao.slug}
                    href={`/guias/reflexoes/${reflexao.slug}`}
                    className="group flex flex-col bg-white p-8 transition hover:bg-[#f6f3f2]"
                  >
                    <span className="font-headline text-5xl leading-none text-black/10 transition group-hover:text-[#6c5e06]/20">"</span>
                    {reflexao.tema && (
                      <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8a8179]">{reflexao.tema}</p>
                    )}
                    <h3 className="mt-3 font-headline text-2xl leading-tight text-black">{reflexao.title}</h3>
                    <p className="mt-4 flex-1 text-sm italic leading-7 text-[#5f5a55]">{reflexao.excerpt}</p>
                    <div className="mt-6 flex items-center gap-3">
                      <span className="w-fit border-b border-black pb-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-black">Continuar lendo →</span>
                      <span className="text-[10px] text-[#8a8179]">{reflexao.readTime} min</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center border border-dashed border-black/15 py-32 text-center">
                <span className="font-headline text-6xl text-black/10">"</span>
                <p className="mt-4 font-headline text-2xl text-black/20">Reflexões em breve</p>
                <p className="mt-2 text-sm text-[#8a8179]">Os primeiros textos estão sendo escritos.</p>
              </div>
            )}
          </div>
        </div>
      </main>
      <BelaPopValidatedFooter />
    </>
  );
}
