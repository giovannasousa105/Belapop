import Link from "next/link";

import { previewScreens } from "@/components/previews/belapop/data";

export default function PreviewIndexPage() {
  return (
    <div className="min-h-screen bg-[#f7f4f3] px-4 py-10 text-[#1c1b1b] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="border border-black/10 bg-white p-6 sm:p-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-black/45">
            Preview estrutural
          </p>
          <h1 className="mt-4 font-serif text-4xl font-medium tracking-tight sm:text-5xl">
            Telas limpas para novo design
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-black/65 sm:text-base">
            Esta area ficou propositalmente crua. As rotas e a estrutura continuam
            preservadas para receber o proximo codigo visual sem mexer na base.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center border border-black px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.24em]"
            >
              Ver home ativa
            </Link>
            <span className="inline-flex items-center justify-center border border-black/10 bg-[#f7f4f3] px-5 py-3 text-[11px] uppercase tracking-[0.24em] text-black/55">
              IA scan e BelaCode preservados
            </span>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {previewScreens.map((screen) => (
            <article key={screen.slug} className="border border-black/10 bg-white p-5">
              <p className="text-[10px] uppercase tracking-[0.24em] text-black/45">
                {screen.finalPath}
              </p>
              <h2 className="mt-3 font-serif text-2xl font-medium tracking-tight">{screen.title}</h2>
              <p className="mt-3 min-h-16 text-sm leading-7 text-black/65">
                {screen.description}
              </p>
              <div className="mt-5 flex flex-col gap-3">
                <Link
                  href={`/preview/${screen.slug}`}
                  className="inline-flex items-center justify-center border border-black bg-black px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-white"
                >
                  Abrir tela
                </Link>
                <div className="flex items-center justify-between border border-dashed border-black/10 px-4 py-3 text-[10px] uppercase tracking-[0.24em]">
                  <span className="text-black/50 italic font-serif">Aguardando novo design</span>
                  <span className="flex h-1.5 w-1.5 rounded-full bg-amber-400" title="Aguardando conexão de dados real"></span>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
