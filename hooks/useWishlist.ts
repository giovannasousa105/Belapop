"use client";

import { useCallback } from "react";
import useSWR from "swr";

import type { WishlistItem } from "@/lib/catalogo/catalogoTypes";

interface WishlistResponse { itens: WishlistItem[] }

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json() as Promise<WishlistResponse>);

export function useWishlist() {
  const { data, error, isLoading, mutate } = useSWR<WishlistResponse>(
    "/api/catalogo/wishlist",
    fetcher,
    { revalidateOnFocus: false },
  );

  const itens    = data?.itens ?? [];
  const idsSet   = new Set(itens.map((i) => i.product_id));

  const toggle = useCallback(async (
    product_id: string,
    compat_score?: number,
    tipo_pele?: string,
  ) => {
    const naLista = idsSet.has(product_id);

    // optimistic
    void mutate(
      (prev) => {
        if (!prev) return prev;
        if (naLista) {
          return { itens: prev.itens.filter((i) => i.product_id !== product_id) };
        }
        return {
          itens: [
            {
              id:           product_id,
              product_id,
              compat_score: compat_score ?? null,
              tipo_pele:    tipo_pele ?? null,
              criado_em:    new Date().toISOString(),
              produto:      null,
            },
            ...prev.itens,
          ],
        };
      },
      { revalidate: false },
    );

    if (naLista) {
      await fetch(`/api/catalogo/wishlist/${product_id}`, { method: "DELETE" });
    } else {
      await fetch(`/api/catalogo/wishlist/${product_id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ compat_score, tipo_pele }),
      });
    }

    void mutate();
  }, [idsSet, mutate]);

  const estaNaLista = useCallback(
    (product_id: string) => idsSet.has(product_id),
    [idsSet],
  );

  return { itens, estaNaLista, toggle, isLoading, erro: error as Error | undefined };
}
