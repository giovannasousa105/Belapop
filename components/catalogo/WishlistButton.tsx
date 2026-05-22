"use client";

import { useWishlist } from "@/hooks/useWishlist";

interface Props {
  product_id: string;
  compat_score?: number;
  tipo_pele?: string;
  className?: string;
}

export function WishlistButton({ product_id, compat_score, tipo_pele, className = "" }: Props) {
  const { estaNaLista, toggle } = useWishlist();
  const ativa = estaNaLista(product_id);

  return (
    <button
      type="button"
      aria-label={ativa ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      aria-pressed={ativa}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void toggle(product_id, compat_score, tipo_pele);
      }}
      className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
        ativa
          ? "bg-rose-50 text-rose-500 hover:bg-rose-100"
          : "bg-white/80 text-slate-400 hover:bg-white hover:text-rose-400"
      } ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill={ativa ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={1.5}
        className="w-4 h-4"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
        />
      </svg>
    </button>
  );
}
