import type { Metadata } from "next";

import { LuxuryStaticFooter } from "@/components/layout/LuxuryStaticFooter";
import { LuxuryStaticHeader } from "@/components/layout/LuxuryStaticHeader";

export const metadata: Metadata = {
  title: "Sobre a BelaPop",
  description: "Uma nova experiencia de beleza, guiada por inteligencia e desejo."
};

export default function SobrePage() {
  return (
    <div className="min-h-screen bg-[#F6F1EB] text-[#1B1A18]">
      <LuxuryStaticHeader />
      <main className="overflow-hidden">
        <section className="border-b border-[#DDD3CA] px-6 py-12 md:px-10 lg:px-14">
          <div className="mx-auto max-w-[1440px]">
            <p className="text-xs uppercase tracking-[0.45em] text-[#C88FA3]">Sobre</p>
            <h1 className="mt-4 font-serif text-5xl leading-[0.95] md:text-6xl">
              Uma nova experiencia de beleza, guiada por inteligencia e desejo.
            </h1>
          </div>
        </section>

        <section className="border-b border-[#DDD3CA] px-6 py-12 md:px-10 lg:px-14">
          <div className="mx-auto grid max-w-[1440px] gap-6 lg:grid-cols-2">
            <div className="rounded-[30px] border border-[#DDD3CA] bg-white/80 p-6">
              <h2 className="font-serif text-2xl">Quem somos</h2>
              <p className="mt-3 text-sm text-[#5F5A55]">
                Uma marca que une leitura de pele, curadoria premium e experiencia editorial.
              </p>
            </div>
            <div className="rounded-[30px] border border-[#DDD3CA] bg-white/80 p-6">
              <h2 className="font-serif text-2xl">O que nos diferencia</h2>
              <p className="mt-3 text-sm text-[#5F5A55]">
                Leitura inteligente, selecao criteriosa e compra refinada em qualquer tela.
              </p>
            </div>
          </div>
        </section>

        <section className="border-b border-[#DDD3CA] px-6 py-12 md:px-10 lg:px-14">
          <div className="mx-auto max-w-[1440px] rounded-[32px] border border-[#DDD3CA] bg-[#F2E3E8] p-8">
            <p className="text-xs uppercase tracking-[0.35em] text-[#C88FA3]">Manifesto</p>
            <p className="mt-4 text-sm text-[#5F5A55]">
              Menos ruido, mais criterio. Beleza guiada por sensorialidade e precisao.
            </p>
          </div>
        </section>

        <section className="px-6 py-12 md:px-10 lg:px-14">
          <div className="mx-auto max-w-[1440px] rounded-[32px] border border-[#DDD3CA] bg-white/80 p-6">
            <h3 className="font-serif text-2xl">Marca + tecnologia</h3>
            <p className="mt-3 text-sm text-[#5F5A55]">
              A tecnologia aparece como luxo silencioso, nunca como ruido visual.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="/skin-scan" className="rounded-full bg-[#1B1A18] px-5 py-2 text-xs uppercase tracking-[0.25em] text-white">
                Fazer leitura
              </a>
              <a href="/vitrine" className="rounded-full border border-[#DDD3CA] px-5 py-2 text-xs uppercase tracking-[0.25em] text-[#1B1A18]">
                Explorar vitrine
              </a>
            </div>
          </div>
        </section>
      </main>
      <LuxuryStaticFooter />
    </div>
  );
}
