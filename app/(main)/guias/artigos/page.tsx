import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { BelaPopValidatedHeader } from "@/components/luxury/BelaPopValidatedHeader";
import { BelaPopValidatedFooter } from "@/components/luxury/BelaPopValidatedFooter";
import { artigos } from "@/lib/diario/data";

export const metadata: Metadata = {
  title: "Artigos BelaPop | Leitura que ajuda a decidir melhor",
  description: "Guias de ativos, conceitos e análises de skincare coreano. Leitura editorial da BelaPop."
};

export default function ArtigosPage() {
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
            <span className="text-[#1c1b1b]">Artigos</span>
          </nav>

          <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#6c5e06]">Artigos</p>
          <h1 className="mt-3 font-headline text-5xl leading-[0.92] tracking-[-0.04em] sm:text-6xl">
            Leitura que ajuda<br />a decidir melhor.
          </h1>

          <div className="mt-12">
            {artigos.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {artigos.map((artigo, i) => (
                  <Link
                    key={artigo.slug}
                    href={`/guias/artigos/${artigo.slug}`}
                    className={`group flex flex-col border border-[#ded8d2] bg-white transition hover:border-[#1c1b1b] ${i === 0 ? "md:col-span-2 md:flex-row xl:col-span-2" : ""}`}
                  >
                    {artigo.coverUrl && (
                      <div className={`overflow-hidden bg-[#f6f3f2] ${i === 0 ? "aspect-video md:aspect-auto md:w-2/5 md:shrink-0" : "aspect-[16/9]"}`}>
                        <img src={artigo.coverUrl} alt={artigo.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                      </div>
                    )}
                    <div className={`flex flex-1 flex-col p-5 ${i === 0 ? "md:p-8" : ""}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#6c5e06]">{artigo.tag}</span>
                        <span className="text-[10px] text-[#8a8179]">· {artigo.readTime} min</span>
                      </div>
                      <h3 className={`mt-3 font-headline leading-tight tracking-[-0.03em] text-black ${i === 0 ? "text-3xl lg:text-4xl" : "text-2xl"}`}>
                        {artigo.title}
                      </h3>
                      <p className="mt-3 flex-1 text-sm leading-6 text-[#5f5a55]">{artigo.excerpt}</p>
                      <span className="mt-5 w-fit border-b border-black pb-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-black">Ler artigo →</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center border border-dashed border-black/15 py-32 text-center">
                <span className="font-headline text-6xl text-black/10">✦</span>
                <p className="mt-4 font-headline text-2xl text-black/20">Artigos em breve</p>
                <p className="mt-2 text-sm text-[#8a8179]">A curadoria editorial está sendo preparada.</p>
              </div>
            )}
          </div>
        </div>
      </main>
      <BelaPopValidatedFooter />
    </>
  );
}
