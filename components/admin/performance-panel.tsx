"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";

import Panel from "@/components/admin/panel";
import PerformanceChart, { type PerfPoint } from "@/components/admin/charts/performance-chart";
import { fetcher } from "@/lib/admin/api";
import { buildRealtimeSeries } from "@/lib/admin/realtime-mock";

type WindowPreset = "3h" | "6h";
type Mode = "gmv" | "orders";

type ApiPoint = {
  ts: string;
  gmv_cents: number;
  orders_paid: number;
  orders?: number;
  cancels?: number;
  refunds_cents?: number;
  refunds_count?: number;
  chargeback_cents?: number;
  chargeback_count?: number;
  cancel_rate_bps: number;
};

type ApiResponse = {
  window: WindowPreset;
  bucket: "1m" | "2m" | "5m";
  series: ApiPoint[];
  updated_at: string;
};

const toPerfSeries = (points: ApiPoint[]): PerfPoint[] =>
  points.map((point) => {
    const date = new Date(point.ts);
    return {
      ts: date.getTime(),
      label: date.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit"
      }),
      gmv: point.gmv_cents / 100,
      orders: point.orders_paid ?? point.orders ?? 0,
      cancelRate: point.cancel_rate_bps / 100
    };
  });

const ageLabel = (seconds: number) => {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}m ${rest}s`;
};

export default function PerformancePanel() {
  const [mode, setMode] = useState<Mode>("gmv");
  const [windowPreset, setWindowPreset] = useState<WindowPreset>("3h");
  const [nowTs, setNowTs] = useState(0);

  const apiUrl = useMemo(() => {
    const defaultBucket = windowPreset === "3h" ? "1m" : "2m";
    return `/api/admin/metrics/realtime?window=${windowPreset}&bucket=${defaultBucket}&timezone=America/Sao_Paulo`;
  }, [windowPreset]);

  const { data, error, isLoading, mutate } = useSWR<ApiResponse>(apiUrl, fetcher, {
    refreshInterval: 15000,
    revalidateOnFocus: false,
    dedupingInterval: 8000,
    fallbackData: {
      window: "3h",
      bucket: "1m",
      series: buildRealtimeSeries({ preset: "3h", highVolume: false }).map((point) => ({
        ts: new Date(point.ts).toISOString(),
        gmv_cents: Math.round(point.gmv * 100),
        orders_paid: point.orders,
        cancel_rate_bps: Math.round(point.cancelRate * 100)
      })),
      updated_at: new Date().toISOString()
    }
  });

  useEffect(() => {
    setNowTs(Date.now());
    const interval = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const series = useMemo(() => (data ? toPerfSeries(data.series) : []), [data]);
  const hasChartData = series.length > 0;
  const shouldShowError = Boolean(error) && !hasChartData;

  const updatedAtMs = data?.updated_at ? new Date(data.updated_at).getTime() : 0;
  const updatedAgeSeconds =
    updatedAtMs > 0 ? Math.max(0, Math.floor((nowTs - updatedAtMs) / 1000)) : null;

  const status = shouldShowError
    ? "error"
    : updatedAgeSeconds !== null && updatedAgeSeconds > 60
      ? "delayed"
      : "online";

  const statusChipClass =
    status === "online"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "delayed"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-rose-200 bg-rose-50 text-rose-700";

  const statusDotClass =
    status === "online"
      ? "bg-emerald-500"
      : status === "delayed"
        ? "bg-amber-500"
        : "bg-rose-500";

  const statusLabel =
    status === "online" ? "Online" : status === "delayed" ? "Atrasado" : "Erro";

  const subtitle = `Ultimas ${windowPreset === "3h" ? "3h" : "6h"} - atualizado ha ${
    updatedAgeSeconds === null ? "--" : ageLabel(updatedAgeSeconds)
  } - refresh 15s`;

  return (
    <Panel
      title={
        <span className="inline-flex items-center gap-2">
          <span>Performance (tempo real)</span>
          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusChipClass}`}>
            <span className={`h-2 w-2 rounded-full ${statusDotClass}`} />
            Live
          </span>
        </span>
      }
      subtitle={subtitle}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMode("gmv")}
            className={`rounded-xl border px-3 py-2 text-xs ${
              mode === "gmv"
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            GMV
          </button>
          <button
            type="button"
            onClick={() => setMode("orders")}
            className={`rounded-xl border px-3 py-2 text-xs ${
              mode === "orders"
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            Pedidos
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500">Janela:</span>
          <button
            type="button"
            onClick={() => setWindowPreset("3h")}
            className={`rounded-xl border px-3 py-2 text-xs ${
              windowPreset === "3h"
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            3h
          </button>
          <button
            type="button"
            onClick={() => setWindowPreset("6h")}
            className={`rounded-xl border px-3 py-2 text-xs ${
              windowPreset === "6h"
                ? "border-slate-900 bg-slate-900 text-white"
                : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            6h
          </button>
          <button
            type="button"
            onClick={() => mutate()}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs hover:bg-slate-50"
          >
            Atualizar agora
          </button>
        </div>
      </div>

      <div className="mb-3 text-xs text-slate-500">
        Estado:{" "}
        <span
          className={
            status === "online"
              ? "text-emerald-700"
              : status === "delayed"
                ? "text-amber-700"
                : "text-rose-700"
          }
        >
          {statusLabel}
        </span>
      </div>

      {shouldShowError ? (
        <div className="mb-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          Falha ao carregar tempo real. Tente novamente.
        </div>
      ) : null}

      {isLoading && series.length === 0 ? (
        <div className="flex h-[300px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">
          <p className="text-sm text-slate-600">Carregando tempo real...</p>
        </div>
      ) : series.length === 0 ? (
        <div className="flex h-[300px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">
          <div className="text-center">
            <p className="text-sm font-medium text-slate-700">Sem movimento nas ultimas 3h</p>
            <p className="mt-1 text-xs text-slate-500">
              Tente ampliar para 6h ou ver 7 dias.
            </p>
          </div>
        </div>
      ) : (
        <PerformanceChart data={series} mode={mode} />
      )}
    </Panel>
  );
}
