"use client";

import { BuscaInput }  from "./BuscaInput";
import { ProdutoGrid } from "./ProdutoGrid";
import { useBusca }    from "@/hooks/useBusca";
import type { UniversoCatalogo } from "@/lib/catalogo/catalogoTypes";

interface Props {
  universo: string;
  label:    string;
}

export function UniversoGrid({ universo, label }: Props) {
  const { resultado, filtros, atualizar, irParaPagina, isLoading } = useBusca({
    universo:   universo as UniversoCatalogo,
    pagina:     1,
    por_pagina: 24,
    ordenacao:  "relevancia",
  });

  const total        = resultado?.total ?? 0;
  const totalPaginas = resultado?.total_paginas ?? 1;
  const paginaAtual  = filtros.pagina ?? 1;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-screen-xl mx-auto px-4 py-8 space-y-6">
        <header className="space-y-1">
          <p className="text-xs font-semibold text-rose-500 uppercase tracking-widest">Universo</p>
          <h1 className="text-3xl font-bold text-slate-900">{label}</h1>
          <p className="text-slate-500 text-sm">
            {total} produto{total !== 1 ? "s" : ""}
          </p>
        </header>

        <BuscaInput
          valor={filtros.query}
          placeholder={`Buscar em ${label}…`}
          onBuscar={(q) => atualizar({ query: q })}
          className="max-w-md"
        />

        <ProdutoGrid itens={resultado?.itens ?? []} isLoading={isLoading} />

        {totalPaginas > 1 && (
          <div className="flex justify-center gap-2">
            <button
              type="button"
              onClick={() => irParaPagina(paginaAtual - 1)}
              disabled={paginaAtual <= 1}
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm disabled:opacity-40 hover:bg-slate-50"
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
              className="px-4 py-2 rounded-xl border border-slate-200 text-sm disabled:opacity-40 hover:bg-slate-50"
            >
              Próxima
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
