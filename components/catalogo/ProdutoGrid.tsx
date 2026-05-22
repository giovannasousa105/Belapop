"use client";

import { ProdutoCard } from "./ProdutoCard";
import type { ProdutoCardDTO } from "@/lib/catalogo/catalogoTypes";

interface Props {
  itens: ProdutoCardDTO[];
  isLoading?: boolean;
}

function Skeleton() {
  return (
    <div className="rounded-2xl bg-white border border-slate-100 overflow-hidden animate-pulse">
      <div className="aspect-square bg-slate-100" />
      <div className="p-3 space-y-2">
        <div className="h-2.5 bg-slate-100 rounded w-1/3" />
        <div className="h-3.5 bg-slate-100 rounded w-3/4" />
        <div className="h-5 bg-slate-100 rounded w-1/2 mt-2" />
      </div>
    </div>
  );
}

export function ProdutoGrid({ itens, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
        {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} />)}
      </div>
    );
  }

  if (!itens.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <p className="text-lg font-medium">Nenhum produto encontrado</p>
        <p className="text-sm mt-1">Tente ajustar os filtros ou a busca.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
      {itens.map((produto) => (
        <ProdutoCard key={produto.id} produto={produto} />
      ))}
    </div>
  );
}
