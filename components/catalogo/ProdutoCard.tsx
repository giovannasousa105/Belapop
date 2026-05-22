"use client";

import Image from "next/image";
import Link  from "next/link";

import { CompatibilidadeBadge } from "./CompatibilidadeBadge";
import { WishlistButton }       from "./WishlistButton";
import type { ProdutoCardDTO }  from "@/lib/catalogo/catalogoTypes";

interface Props {
  produto: ProdutoCardDTO;
}

function formatarPreco(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style:    "currency",
    currency: "BRL",
  });
}

export function ProdutoCard({ produto }: Props) {
  const imagem = produto.images[0] ?? null;
  const slug   = produto.id;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl bg-white border border-slate-100 hover:shadow-md transition-shadow">
      {/* Imagem */}
      <Link href={`/produto/${slug}`} className="block aspect-square overflow-hidden bg-slate-50">
        {imagem ? (
          <Image
            src={imagem}
            alt={produto.name}
            width={400}
            height={400}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-200">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-12 h-12" aria-hidden>
              <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </Link>

      {/* Wishlist button sobreposto */}
      <div className="absolute top-2 right-2">
        <WishlistButton
          product_id={produto.id}
          compat_score={produto.compat_score ?? undefined}
        />
      </div>

      {/* Badge curadoria */}
      {produto.curated && (
        <span className="absolute top-2 left-2 bg-black/80 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full tracking-wide uppercase">
          Curadoria
        </span>
      )}

      {/* Conteúdo */}
      <div className="flex flex-col gap-1.5 p-3 flex-1">
        {produto.brand && (
          <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider truncate">
            {produto.brand}
          </p>
        )}
        <Link href={`/produto/${slug}`} className="text-sm font-semibold text-slate-800 line-clamp-2 hover:text-rose-600 transition-colors">
          {produto.name}
        </Link>

        <CompatibilidadeBadge score={produto.compat_score} className="mt-0.5" />

        {/* Rating */}
        {produto.total_avaliacoes > 0 && (
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <span className="text-amber-400">★</span>
            <span>{produto.rating_medio.toFixed(1)}</span>
            <span className="text-slate-300">·</span>
            <span>{produto.total_avaliacoes}</span>
          </div>
        )}

        <p className="mt-auto text-base font-bold text-slate-900 pt-1">
          {formatarPreco(produto.price_cents)}
        </p>
      </div>
    </article>
  );
}
