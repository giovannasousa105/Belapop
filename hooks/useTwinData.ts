"use client";

import { useEffect } from "react";
import useSWR from "swr";
import { getSupabaseClient } from "@/lib/supabase/client";
import type {
  TwinStatusResponse,
  TwinSnapshotsResponse,
} from "@/lib/digitalTwin/twinTypes";

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
  });

// ─── Status do twin (overview + último insight + seed) ────────────────────────

export function useTwinStatus() {
  const { data, error, isLoading, mutate } = useSWR<TwinStatusResponse>(
    "/api/twin/status",
    fetcher,
    { refreshInterval: 60_000, revalidateOnFocus: true }
  );

  return {
    status: data ?? null,
    twin: data?.twin ?? null,
    ultimoSnapshot: data?.ultimoSnapshot ?? null,
    ultimoInsight: data?.ultimoInsight ?? null,
    copilotSeed: data?.copilotSeed ?? null,
    diasDesdeUltimoScan: data?.diasDesdeUltimoScan ?? null,
    melhoraGlobal: data?.melhoraGlobal ?? null,
    isLoading,
    error,
    mutate,
  };
}

// ─── Snapshots + deltas + trends ─────────────────────────────────────────────

export function useTwinSnapshots(opts?: { limit?: number; offset?: number }) {
  const params = new URLSearchParams();
  if (opts?.limit) params.set("limit", String(opts.limit));
  if (opts?.offset) params.set("offset", String(opts.offset));

  const url = `/api/twin/snapshots?${params.toString()}`;

  const { data, error, isLoading, mutate } = useSWR<TwinSnapshotsResponse>(
    url,
    fetcher,
    { refreshInterval: 60_000, revalidateOnFocus: true }
  );

  return {
    snapshots: data?.snapshots ?? [],
    deltas: data?.deltas ?? [],
    trends: data?.trends ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
    mutate,
  };
}

// ─── Hook composto — tudo necessário para a página minha-pele ─────────────────

export function useTwinDashboard() {
  const statusData = useTwinStatus();
  const snapshotsData = useTwinSnapshots({ limit: 10 });

  // Revalidar automaticamente após novo scan via Supabase Realtime.
  // SWR mutate functions são referências estáveis — omitir das deps é seguro.
  useEffect(() => {
    const supabase = getSupabaseClient();
    const channel = supabase
      .channel("twin-live")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "skin_twins" },
        () => {
          void statusData.mutate();
          void snapshotsData.mutate();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    ...statusData,
    ...snapshotsData,
    isReady: !statusData.isLoading && !snapshotsData.isLoading,
  };
}
