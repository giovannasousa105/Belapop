"use client";

import { useCallback, useEffect, useRef } from "react";
import useSWR from "swr";

import type { RespostaTipo } from "@/lib/copilot/copilotTypes";

// ─── Tipos do feed ────────────────────────────────────────────────────────────

export interface CopilotProdutoFeed {
  id: string;
  name: string;
  hero_image_url: string | null;
  price_cents: number;
  slug: string;
  duracao_media_dias: number | null;
  dias_restantes: number | null;
}

export interface CopilotInteracaoFeed {
  id: string;
  tipo: string;
  status: string;
  payload: {
    titulo: string;
    corpo: string;
    cta?: string;
    metadata?: Record<string, unknown>;
  } | null;
  seed_snapshot: Record<string, unknown> | null;
  criado_em: string;
  produto?: CopilotProdutoFeed;
}

interface FeedResponse {
  ok: boolean;
  interacoes: CopilotInteracaoFeed[];
  streak: number;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

const feedFetcher = (url: string): Promise<FeedResponse> =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error("copilot feed unavailable");
    return r.json() as Promise<FeedResponse>;
  });

export interface CopilotFeedState {
  interacoes: CopilotInteracaoFeed[];
  streak: number;
  isLoading: boolean;
  responder: (
    interacao_id: string,
    tipo_resposta: RespostaTipo,
    valor: Record<string, unknown>
  ) => Promise<void>;
  descartar: (interacao_id: string) => Promise<void>;
}

export function useCopilotFeed(): CopilotFeedState {
  const { data, isLoading, mutate } = useSWR<FeedResponse>(
    "/api/copilot/feed",
    feedFetcher,
    {
      revalidateOnFocus: true,
      refreshInterval: 300_000, // 5 minutos
    }
  );

  // Marcar como LIDA na primeira carga de cada conjunto de interações
  const markedKey = useRef("");
  useEffect(() => {
    const ids = (data?.interacoes ?? [])
      .filter((i) => i.status === "ENTREGUE")
      .map((i) => i.id);

    if (!ids.length) return;
    const key = ids.join(",");
    if (markedKey.current === key) return;
    markedKey.current = key;

    fetch("/api/copilot/feed", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    }).catch(() => {});
  }, [data?.interacoes]);

  const responder = useCallback(
    async (
      interacao_id: string,
      tipo_resposta: RespostaTipo,
      valor: Record<string, unknown>
    ) => {
      await fetch("/api/copilot/resposta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interacao_id, tipo_resposta, valor }),
      });
      await mutate();
    },
    [mutate]
  );

  const descartar = useCallback(
    async (interacao_id: string) => {
      await responder(interacao_id, "DESCARTADA", {});
    },
    [responder]
  );

  return {
    interacoes: data?.interacoes ?? [],
    streak: data?.streak ?? 0,
    isLoading,
    responder,
    descartar,
  };
}
