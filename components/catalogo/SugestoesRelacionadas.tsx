"use client";

import useSWR from "swr";

import { ProdutoCard } from "./ProdutoCard";
import type { ResultadoBusca } from "@/lib/catalogo/catalogoTypes";

const fetcher = (url: string) => fetch(url).then((r) => r.json() as Promise<ResultadoBusca>);

interface Props {
  universo: string | null;
  excluir_id: string;
  necessidades?: string[];
  limite?: number;
}

export function SugestoesRelacionadas({ universo, excluir_id, necessidades, limite = 4 }: Props) {
  const params = new URLSearchParams();
  if (universo) params.set("universo", universo);
  if (necessidades?.length) params.set("necessidades", necessidades.join(","));
  params.set("por_pagina", String(limite + 1));
  params.set("sort", "relevancia");

  const { data } = useSWR<ResultadoBusca>(
    `/api/catalogo/buscar?${params.toString()}`,
    fetcher,
    { revalidateOnFocus: false },
  );

  const itens = (data?.itens ?? []).filter((p) => p.id !== excluir_id).slice(0, limite);

  if (!itens.length) return null;

  return (
    <section aria-label="Produtos relacionados" className="space-y-4">
      <h2 className="font-semibold text-slate-800">Você também pode gostar</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {itens.map((produto) => (
          <ProdutoCard key={produto.id} produto={produto} />
        ))}
      </div>
    </section>
  );
}
