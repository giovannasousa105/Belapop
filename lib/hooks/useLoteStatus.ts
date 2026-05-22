"use client";

import useSWR from "swr";

import type { LoteDisplayConfig } from "@/lib/lote/loteTypes";

const fetcher = async (url: string): Promise<LoteDisplayConfig> => {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<LoteDisplayConfig>;
};

export function useLoteStatus(produtoId: string | null | undefined) {
  const { data, error, isLoading } = useSWR<LoteDisplayConfig>(
    produtoId ? `/api/lotes/produto/${produtoId}` : null,
    fetcher,
    {
      revalidateOnFocus: true,
      refreshInterval: 60_000,
      shouldRetryOnError: false,
    }
  );

  return {
    config: data?.lote_id ? data : null,
    isLoading,
    error: error instanceof Error ? error : null,
  };
}
