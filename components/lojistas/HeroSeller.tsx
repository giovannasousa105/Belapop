"use client";

import { Sparkles } from "lucide-react";

import { LuxuryButton } from "@/components/LuxuryButton";

const highlights = [
  "Curadoria editorial",
  "Checkout único",
  "Pagamentos e repasses"
];

export const HeroSeller = () => {
  return (
    <section className="bg-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-16 lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-noir-500">
            <Sparkles size={14} className="text-luxe-600" />
            Plataforma institucional
          </div>
          <h1 className="mt-5 font-display text-4xl text-noir-950 md:text-5xl">
            Plataforma institucional da BelaPop para marcas selecionadas.
          </h1>
          <p className="mt-5 text-base text-noir-600">
            Atue em um marketplace premium com curadoria editorial, checkout
            único e pagamentos integrados. Uma operação com padrões definidos,
            transparência e governança comercial.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <LuxuryButton tone="retail" size="lg" href="/seller/register">
              Solicitar cadastro
            </LuxuryButton>
            <LuxuryButton
              tone="retail"
              variant="outline"
              size="lg"
              href="#como-funciona"
            >
              Como funciona
            </LuxuryButton>
          </div>
          <div className="mt-8 flex flex-wrap gap-3 text-xs text-noir-600">
            {highlights.map((item) => (
              <span
                key={item}
                className="rounded-full border border-black/10 bg-white px-4 py-2 shadow-sm"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-black/10 bg-white p-8 shadow-sm">
          <div className="absolute right-6 top-6 h-28 w-28 rounded-full bg-belapop-rose opacity-10 blur-2xl" />
          <div className="absolute bottom-6 left-6 h-32 w-32 rounded-full bg-belapop-rose opacity-10 blur-2xl" />
          <div className="relative space-y-6">
            <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-noir-500">
                Painel inteligente
              </p>
              <p className="mt-3 text-sm text-noir-600">
                Acompanhe vendas, conversão e campanhas com indicadores claros
                para decisões estratégicas e governança operacional.
              </p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-noir-500">
                Curadoria e destaque
              </p>
              <p className="mt-3 text-sm text-noir-600">
                Vitrines temáticas, coleções especiais e conteúdo editorial
                para fortalecer posicionamento conforme critérios de curadoria.
              </p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-noir-500">
                Checkout único
              </p>
              <p className="mt-3 text-sm text-noir-600">
                O cliente finaliza um único pedido, enquanto envios e repasses
                são organizados por lojista conforme política comercial.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
