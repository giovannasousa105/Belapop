"use client";

import { useCallback, useState } from "react";
import useSWR from "swr";

import type { FiltrosBusca, ResultadoBusca } from "@/lib/catalogo/catalogoTypes";

function filtrosToParams(filtros: FiltrosBusca): string {
  const p = new URLSearchParams();
  if (filtros.query)          p.set("q",              filtros.query);
  if (filtros.universo)       p.set("universo",        filtros.universo);
  if (filtros.necessidades?.length)
    p.set("necessidades",     filtros.necessidades.join(","));
  if (filtros.tipo_pele?.length)
    p.set("tipo_pele",        filtros.tipo_pele.join(","));
  if (filtros.sensibilidade_max != null)
    p.set("sensibilidade_max", String(filtros.sensibilidade_max));
  if (filtros.passo_rotina)   p.set("passo",           filtros.passo_rotina);
  if (filtros.periodo)        p.set("periodo",         filtros.periodo);
  if (filtros.preco_min != null) p.set("preco_min",   String(filtros.preco_min));
  if (filtros.preco_max != null) p.set("preco_max",   String(filtros.preco_max));
  if (filtros.curated)        p.set("curated",         "1");
  if (filtros.ordenacao)      p.set("sort",            filtros.ordenacao);
  p.set("pagina",     String(filtros.pagina     ?? 1));
  p.set("por_pagina", String(filtros.por_pagina ?? 24));
  return p.toString();
}

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("Erro na busca.");
    return r.json() as Promise<ResultadoBusca>;
  });

export function useBusca(filtrosIniciais?: FiltrosBusca) {
  const [filtros, setFiltros] = useState<FiltrosBusca>(filtrosIniciais ?? {});

  const key = `/api/catalogo/buscar?${filtrosToParams(filtros)}`;

  const { data, error, isLoading, mutate } = useSWR<ResultadoBusca>(key, fetcher, {
    keepPreviousData: true,
    revalidateOnFocus: false,
  });

  const atualizar = useCallback((novosFiltros: Partial<FiltrosBusca>) => {
    setFiltros((prev) => ({
      ...prev,
      ...novosFiltros,
      pagina: novosFiltros.pagina ?? 1,
    }));
  }, []);

  const irParaPagina = useCallback((pagina: number) => {
    setFiltros((prev) => ({ ...prev, pagina }));
  }, []);

  return {
    resultado: data,
    filtros,
    atualizar,
    irParaPagina,
    isLoading,
    erro: error as Error | undefined,
    revalidar: mutate,
  };
}
