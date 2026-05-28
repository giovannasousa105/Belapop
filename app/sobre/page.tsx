import type { Metadata } from "next";
import Link from "next/link";

import { LuxuryStaticFooter } from "@/components/layout/LuxuryStaticFooter";

export const metadata: Metadata = {
  title: "Sobre a BelaPop",
  description:
    "Conheça a história e a missão da BelaPop — skincare guiado por critério clínico e curadoria precisa.",
  openGraph: {
    title: "Sobre a BelaPop",
    description:
      "Conheça a história e a missão da BelaPop — skincare guiado por critério clínico e curadoria precisa.",
    images: [{ url: "/hero-bela-pop-editorial.jpg", alt: "BelaPop — Skincare editorial" }]
  }
};

export default function SobrePage() {
  return (
    <div className="min-h-screen bg-[#F6F1EB] text-[#1B1A18]">
      <main id="main-content" className="overflow-hidden">

        {/* 1 — Hero */}
        <section className="border-b border-[#DDD3CA] px-6 py-20 md:px-10 lg:px-16 lg:py-32">
          <div className="mx-auto max-w-[1080px]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.45em] text-[#C88FA3]">Sobre a BelaPop</p>
            <h1 className="mt-6 max-w-4xl font-serif text-5xl leading-[0.93] tracking-[-0.04em] md:text-7xl">
              Skincare guiado por conhecimento, não por prateleira.
            </h1>
            <p className="mt-8 max-w-2xl text-base leading-8 text-[#5F5A55] md:text-xl">
              A BelaPop nasceu da insatisfação com o excesso. Marcas demais, ativos de todos os tipos, promessas vagas — e pele sem resposta.
            </p>
          </div>
        </section>

        {/* 2 — Origem */}
        <section className="border-b border-[#DDD3CA] px-6 py-16 md:px-10 lg:px-16 lg:py-24">
          <div className="mx-auto grid max-w-[1080px] gap-12 lg:grid-cols-[1fr_400px] lg:items-start">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#C88FA3]">A origem</p>
              <p className="mt-6 text-lg leading-9 text-[#1B1A18] md:text-xl">
                A BelaPop foi criada por Giovanna Santos, estudante de medicina em fase final de formação, com a crença de que o cuidado com a pele merece o mesmo critério de evidência que qualquer decisão clínica.
              </p>
              <p className="mt-6 text-base leading-8 text-[#5F5A55]">
                Cada produto na BelaPop passou por um filtro: formulação com propósito, procedência verificada e contexto de uso real — não apenas tendência.
              </p>
              <Link
                href="/skincare"
                className="mt-8 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#1B1A18] underline underline-offset-4 hover:text-[#C88FA3]"
              >
                Conhecer a curadoria →
              </Link>
            </div>
            <div className="rounded-2xl border border-[#DDD3CA] bg-white/60 p-8">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#C88FA3]">Princípio fundador</p>
              <p className="mt-4 font-serif text-2xl leading-tight text-[#1B1A18]">
                &ldquo;Beleza com critério. Compra com consciência.&rdquo;
              </p>
              <p className="mt-4 text-sm leading-7 text-[#5F5A55]">
                Cada produto selecionado passou por análise de formulação, compatibilidade de rotina e contexto de uso antes de entrar na plataforma.
              </p>
            </div>
          </div>
        </section>

        {/* 3 — Diferenciadores */}
        <section className="border-b border-[#DDD3CA] px-6 py-16 md:px-10 lg:px-16 lg:py-24">
          <div className="mx-auto max-w-[1080px]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#C88FA3]">O que nos diferencia</p>
            <div className="mt-10 grid gap-8 md:grid-cols-3">
              {[
                {
                  titulo: "Curadoria com critério clínico",
                  texto: "Selecionamos com base em formulação, ativo ativo e compatibilidade de rotina — não em popularidade ou margem."
                },
                {
                  titulo: "Skin Scan proprietário",
                  texto: "Nossa análise visual de pele não é um quiz genérico. É uma leitura baseada em sinais reais para uma rotina coerente."
                },
                {
                  titulo: "Transparência sobre quem vende",
                  texto: "Seller identificado, procedência declarada, pós-venda acompanhado. Você sabe exatamente com quem está comprando."
                }
              ].map((item) => (
                <div key={item.titulo} className="border-t-2 border-[#C88FA3] pt-6">
                  <h2 className="font-serif text-xl text-[#1B1A18]">{item.titulo}</h2>
                  <p className="mt-3 text-sm leading-7 text-[#5F5A55]">{item.texto}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4 — Manifesto */}
        <section className="border-b border-[#DDD3CA] bg-[#F2E3E8] px-6 py-16 md:px-10 lg:px-16 lg:py-28">
          <div className="mx-auto max-w-[780px] text-center">
            <p className="font-serif text-3xl leading-tight text-[#1B1A18] md:text-4xl">
              &ldquo;Beleza não precisa de ruído para ser sofisticada.&rdquo;
            </p>
            <p className="mt-8 text-base leading-8 text-[#5F5A55]">
              Acreditamos que cuidar da pele é um ato contínuo — não uma compra por impulso. É por isso que a BelaPop organiza a experiência em torno da sua rotina, não da nossa vitrine.
            </p>
            <p className="mt-5 text-sm font-semibold uppercase tracking-[0.24em] text-[#C88FA3]">
              Menos produtos. Mais precisão.
            </p>
          </div>
        </section>

        {/* 5 — BelaCode */}
        <section className="border-b border-[#DDD3CA] px-6 py-16 md:px-10 lg:px-16 lg:py-24">
          <div className="mx-auto max-w-[1080px]">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#C88FA3]">Tecnologia</p>
                <h2 className="mt-5 font-serif text-4xl leading-tight text-[#1B1A18] md:text-5xl">O BelaCode</h2>
                <p className="mt-6 text-base leading-8 text-[#5F5A55]">
                  O BelaCode é a camada de inteligencia por trás da BelaPop. Ele processa a imagem enviada no Skin Scan, identifica sinais visuais e conecta esses sinais a produtos e rotinas com critério cosmético.
                </p>
                <p className="mt-4 text-base leading-8 text-[#5F5A55]">
                  Nada de quiz com 3 perguntas. Uma leitura real, com contexto real.
                </p>
                <Link
                  href="/skin-scan"
                  className="mt-8 inline-flex items-center justify-center rounded-full bg-[#1B1A18] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-[#3d3530]"
                >
                  Fazer meu diagnóstico →
                </Link>
              </div>
              <div className="rounded-2xl border border-[#DDD3CA] bg-white/60 p-8">
                <ol className="space-y-5 text-sm leading-7 text-[#5F5A55]">
                  {[
                    "Leitura visual de sinais da pele — textura, oleosidade, uniformidade, sensibilidade",
                    "Correspondência com produtos por critério de formulação",
                    "Rotina gerada na ordem correta de aplicação",
                    "Resultado salvo e acompanhado ao longo do tempo"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F2E3E8] text-[10px] font-bold text-[#C88FA3]">
                        {i + 1}
                      </span>
                      <p>{item}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* 6 — Fundadora */}
        <section className="px-6 py-16 md:px-10 lg:px-16 lg:py-24">
          <div className="mx-auto max-w-[1080px]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#C88FA3]">Fundadora</p>
            <div className="mt-10 flex flex-col gap-10 md:flex-row md:items-start">
              <div className="flex h-[160px] w-[160px] shrink-0 items-center justify-center rounded-full bg-[#F2E3E8]">
                <span className="font-serif text-5xl text-[#C88FA3]">G</span>
              </div>
              <div>
                <h2 className="font-serif text-3xl text-[#1B1A18]">Giovanna Santos</h2>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#C88FA3]">
                  Fundadora · Araguari, MG
                </p>
                <p className="mt-6 text-base leading-8 text-[#5F5A55]">
                  Estudante de medicina (11º período), apaixonada por dermatologia aplicada e pelo design de experiências que fazem sentido. Criou a BelaPop porque queria um lugar que tratasse a compradora de skincare como inteligente.
                </p>
                <p className="mt-4 text-sm font-medium text-[#5F5A55]">Em formação. Construindo.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <LuxuryStaticFooter />
    </div>
  );
}
