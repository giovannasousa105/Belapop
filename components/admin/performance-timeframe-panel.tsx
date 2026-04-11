"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";

import PerformanceChart from "@/components/admin/charts/performance-chart";
import Panel from "@/components/admin/panel";
import { fetcher } from "@/lib/admin/api";
import { mapRange, mapRealtime } from "@/lib/admin/metrics-map";
import type {
  MetricMode,
  Range,
  RangeResp,
  RealtimeResp,
  RealtimeWindow
} from "@/lib/admin/metrics-types";

const TZ = "America/Sao_Paulo";

function formatTime(timestamp?: string) {
  if (!timestamp) return "--:--:--";
  return new Date(timestamp).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

type PerformanceTimeframePanelProps = {
  controlledRange?: Range;
};

export default function PerformanceTimeframePanel({
  controlledRange
}: PerformanceTimeframePanelProps) {
  const [mode, setMode] = useState<MetricMode>("gmv");
  const [range, setRange] = useState<Range>(controlledRange ?? "today");
  const [liveWindow, setLiveWindow] = useState<RealtimeWindow>("3h");

  const isRangeControlled = typeof controlledRange !== "undefined";

  useEffect(() => {
    if (controlledRange) {
      setRange(controlledRange);
    }
  }, [controlledRange]);

  const url = useMemo(() => {
    if (range === "today") {
      const bucket = liveWindow === "3h" ? "1m" : "2m";
      return `/api/admin/metrics/realtime?window=${liveWindow}&bucket=${bucket}&timezone=${TZ}`;
    }
    return `/api/admin/metrics?range=${range}&timezone=${TZ}`;
  }, [range, liveWindow]);

  const refreshInterval = range === "today" ? 15_000 : 60_000;

  const { data, error, isLoading, mutate } = useSWR<RealtimeResp | RangeResp>(url, fetcher, {
    refreshInterval,
    revalidateOnFocus: false,
    dedupingInterval: range === "today" ? 8_000 : 30_000
  });

  const { points, subtitle } = useMemo(() => {
    if (!data) {
      return {
        points: [],
        subtitle: "Carregando..."
      };
    }

    if ("window" in data) {
      return {
        points: mapRealtime(data),
        subtitle: `LIVE - Ultimas ${data.window} - atualizado as ${formatTime(data.updated_at)} - refresh 15s`
      };
    }

    const mapped = mapRange(data);
    return {
      points: mapped.points,
      subtitle: `${data.range} - granularidade: ${mapped.granularity} - atualizado as ${formatTime(data.updated_at)} - refresh 60s`
    };
  }, [data]);

  const hasChartData = points.length > 0;
  const shouldShowError = Boolean(error) && !hasChartData;

  return (
    <Panel title="Performance" subtitle={subtitle}>
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
          {isRangeControlled ? (
            <span className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
              Periodo: {range === "today" ? "Hoje" : range}
            </span>
          ) : (
            <>
              <span className="text-xs text-slate-500">Periodo:</span>

              <button
                type="button"
                onClick={() => setRange("today")}
                className={`rounded-xl border px-3 py-2 text-xs ${
                  range === "today"
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                Hoje
              </button>

              <button
                type="button"
                onClick={() => setRange("7d")}
                className={`rounded-xl border px-3 py-2 text-xs ${
                  range === "7d"
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                7d
              </button>

              <button
                type="button"
                onClick={() => setRange("30d")}
                className={`rounded-xl border px-3 py-2 text-xs ${
                  range === "30d"
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                30d
              </button>

              <button
                type="button"
                onClick={() => setRange("90d")}
                className={`rounded-xl border px-3 py-2 text-xs ${
                  range === "90d"
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                90d
              </button>
            </>
          )}

          {range === "today" ? (
            <>
              <span className="ml-2 text-xs text-slate-500">Janela:</span>
              <button
                type="button"
                onClick={() => setLiveWindow("3h")}
                className={`rounded-xl border px-3 py-2 text-xs ${
                  liveWindow === "3h"
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                3h
              </button>
              <button
                type="button"
                onClick={() => setLiveWindow("6h")}
                className={`rounded-xl border px-3 py-2 text-xs ${
                  liveWindow === "6h"
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                6h
              </button>
            </>
          ) : null}

          <button
            type="button"
            onClick={() => mutate()}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs hover:bg-slate-50"
            title="Atualizar agora"
          >
            Atualizar
          </button>
        </div>
      </div>

      {shouldShowError ? (
        <div className="mb-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          Falha ao carregar metricas. Tente novamente.
        </div>
      ) : null}

      {isLoading && points.length === 0 ? (
        <div className="flex h-[300px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">
          <p className="text-sm text-slate-600">Carregando...</p>
        </div>
      ) : points.length === 0 ? (
        <div className="flex h-[300px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50">
          <div className="text-center">
            <p className="text-sm font-medium text-slate-700">Sem movimento no intervalo</p>
            <p className="mt-1 text-xs text-slate-500">
              {range === "today" ? "Tente ampliar para 6h ou ver 7 dias." : "Tente mudar para 7d ou Hoje."}
            </p>
          </div>
        </div>
      ) : (
        <PerformanceChart data={points} mode={mode} />
      )}
    </Panel>
  );
}
