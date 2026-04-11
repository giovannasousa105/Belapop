import Link from "next/link";

import { LuxuryStaticFooter } from "@/components/layout/LuxuryStaticFooter";
import { LuxuryStaticHeader } from "@/components/layout/LuxuryStaticHeader";

export default function RituaisPage() {
  const rituals = [
    "Pele sensível e barreira fragilizada",
    "Glow executivo para o dia",
    "Recuperação noturna",
    "Controle de oleosidade com sofisticação"
  ];

  return (
    <div className="min-h-screen bg-[#F6F1EB] text-[#1B1A18]">
      <LuxuryStaticHeader />
      <main className="overflow-hidden">
        <section className="border-b border-[#DDD3CA] px-6 py-12 md:px-10 lg:px-14">
          <div className="mx-auto max-w-[1440px]">
            <p className="text-xs uppercase tracking-[0.45em] text-[#C88FA3]">Rituais</p>
            <h1 className="mt-4 font-serif text-5xl leading-[0.95] md:text-6xl">
              Rituais desenhados com olhar clínico e desejo.
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-[#5F5A55] md:text-base">
              Menos excesso, mais precisão. Cada jornada parte da leitura da pele e de recomendações
              inspiradas em medicina baseada em evidências, traduzidas em linguagem sensorial.
            </p>
          </div>
        </section>

        <section className="border-b border-[#DDD3CA] px-6 py-12 md:px-10 lg:px-14">
          <div className="mx-auto grid max-w-[1440px] gap-6 md:grid-cols-2">
            {rituals.map((ritual) => (
              <div
                key={ritual}
                className="rounded-[30px] border border-[#DDD3CA] bg-white/80 p-6"
              >
                <h3 className="font-serif text-2xl">{ritual}</h3>
                <p className="mt-3 text-sm text-[#5F5A55]">
                  Para quem é, quais sinais priorizamos e como organizamos limpeza, tratamento e
                  finalização para respeitar a barreira e o contexto de uso.
                </p>
                <div className="mt-5 flex flex-wrap gap-3 text-xs uppercase tracking-[0.22em] text-[#7A736D]">
                  <span className="rounded-full border border-[#DDD3CA] bg-[#F6F1EB] px-3 py-1">
                    Perfil de pele
                  </span>
                  <span className="rounded-full border border-[#DDD3CA] bg-[#F6F1EB] px-3 py-1">
                    Evidência clínica
                  </span>
                  <span className="rounded-full border border-[#DDD3CA] bg-[#F6F1EB] px-3 py-1">
                    Rotina dia / noite
                  </span>
                </div>
                <Link
                  href="/vitrine"
                  className="mt-5 inline-block rounded-full border border-[#DDD3CA] px-4 py-2 text-xs uppercase tracking-[0.22em] transition hover:border-[#C88FA3] hover:bg-[#C88FA3] hover:text-white"
                >
                  Ver produtos do ritual
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="border-b border-[#DDD3CA] px-6 py-12 md:px-10 lg:px-14">
          <div className="mx-auto max-w-[1440px] rounded-[32px] border border-[#DDD3CA] bg-[#F2E3E8] p-8">
            <p className="text-xs uppercase tracking-[0.35em] text-[#C88FA3]">Comparativo</p>
            <p className="mt-4 text-sm text-[#5F5A55]">Qual ritual escolher por manha/noite e tipo de pele.</p>
          </div>
        </section>

        <section className="px-6 py-12 md:px-10 lg:px-14">
          <div className="mx-auto max-w-[1440px] rounded-[32px] border border-[#DDD3CA] bg-white/80 p-6">
            <p className="text-xs uppercase tracking-[0.35em] text-[#C88FA3]">Conteudo relacionado</p>
            <p className="mt-3 text-sm text-[#5F5A55]">Artigos do Diario conectados ao ritual.</p>
          </div>
        </section>
      </main>
      <LuxuryStaticFooter />
    </div>
  );
}
