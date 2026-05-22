"use client";

import { Suspense } from "react";

import { BuscaInput }    from "@/components/catalogo/BuscaInput";
import { FiltrosSidebar } from "@/components/catalogo/FiltrosSidebar";
import { ProdutoGrid }   from "@/components/catalogo/ProdutoGrid";
import { useBusca }      from "@/hooks/useBusca";

const ORDENACOES = [
  { valor: "relevancia",       label: "Relevância" },
  { valor: "mais_vendidos",    label: "Mais vendidos" },
  { valor: "melhor_avaliados", label: "Melhor avaliados" },
  { valor: "preco_asc",        label: "Menor preço" },
  { valor: "preco_desc",       label: "Maior preço" },
] as const;

function BuscaConteudo() {
  const { resultado, filtros, atualizar, irParaPagina, isLoading } = useBusca({
    pagina: 1,
    por_pagina: 24,
    ordenacao: "relevancia",
  });

  const total       = resultado?.total ?? 0;
  const totalPaginas = resultado?.total_paginas ?? 1;
  const paginaAtual  = filtros.pagina ?? 1;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-screen-xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6 space-y-1">
          <h1 className="text-2xl font-bold text-slate-900">Busca</h1>
          {filtros.query && (
            <p className="text-slate-500 text-sm">
              {total} resultado{total !== 1 ? "s" : ""} para &ldquo;{filtros.query}&rdquo;
            </p>
          )}
        </div>

        {/* Busca + ordenação */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <BuscaInput
            valor={filtros.query}
            onBuscar={(q) => atualizar({ query: q })}
            className="flex-1"
          />
          <select
            value={filtros.ordenacao ?? "relevancia"}
            onChange={(e) => atualizar({ ordenacao: e.target.value as typeof filtros.ordenacao })}
            className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-200 sm:w-44"
            aria-label="Ordenar por"
          >
            {ORDENACOES.map(({ valor, label }) => (
              <option key={valor} value={valor}>{label}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-6">
          {/* Sidebar filtros */}
          <div className="hidden lg:block w-52 shrink-0">
            <FiltrosSidebar filtros={filtros} onAtualizar={atualizar} />
          </div>

          {/* Grid */}
          <div className="flex-1 min-w-0">
            <ProdutoGrid itens={resultado?.itens ?? []} isLoading={isLoading} />

            {/* Paginação */}
            {totalPaginas > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  type="button"
                  onClick={() => irParaPagina(paginaAtual - 1)}
                  disabled={paginaAtual <= 1}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-sm disabled:opacity-40 hover:bg-slate-50 transition-colors"
                >
                  Anterior
                </button>
                <span className="px-4 py-2 text-sm text-slate-500">
                  {paginaAtual} / {totalPaginas}
                </span>
                <button
                  type="button"
                  onClick={() => irParaPagina(paginaAtual + 1)}
                  disabled={paginaAtual >= totalPaginas}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-sm disabled:opacity-40 hover:bg-slate-50 transition-colors"
                >
                  Próxima
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BuscaPage() {
  return (
    <Suspense>
      <BuscaConteudo />
    </Suspense>
  );
}
