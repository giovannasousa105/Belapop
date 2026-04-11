"use client";

import { useMemo, useState } from "react";

type MetricKey = "gmv" | "orders" | "canceled" | "value";

type Series = {
  key: MetricKey;
  label: string;
  format: "currency" | "integer" | "percent";
};

type ChartPoint = {
  label: string;
  gmv?: number;
  orders?: number;
  canceled?: number;
  value?: number;
};

const formatMetric = (value: number, format: Series["format"]) => {
  if (format === "currency") {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 0
    }).format(value);
  }
  if (format === "percent") {
    return `${value.toFixed(1)}%`;
  }
  return value.toLocaleString("pt-BR");
};

export default function PlaceholderChart({
  points,
  series,
  height = 260
}: {
  points: ChartPoint[];
  series: Series[];
  height?: number;
}) {
  const [activeSeriesKey, setActiveSeriesKey] = useState<MetricKey>(series[0]?.key ?? "value");

  const activeSeries = series.find((entry) => entry.key === activeSeriesKey) ?? series[0];
  const normalized = useMemo(() => {
    const values = points.map((point) => Number(point[activeSeries.key] ?? 0));
    const max = Math.max(...values, 1);
    return points.map((point) => ({
      label: point.label,
      value: Number(point[activeSeries.key] ?? 0),
      ratio: Number(point[activeSeries.key] ?? 0) / max
    }));
  }, [activeSeries, points]);

  return (
    <div>
      {series.length > 1 ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {series.map((entry) => (
            <button
              key={entry.key}
              type="button"
              onClick={() => setActiveSeriesKey(entry.key)}
              className={`rounded-xl border px-3 py-2 text-xs transition ${
                activeSeries.key === entry.key
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              {entry.label}
            </button>
          ))}
        </div>
      ) : null}

      <div
        className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
        style={{ minHeight: `${height}px` }}
      >
        <div className="flex h-full items-end gap-2 overflow-hidden">
          {normalized.map((point) => (
            <div key={point.label} className="flex min-w-0 flex-1 flex-col items-center gap-2">
              <div className="text-[10px] text-slate-500">{formatMetric(point.value, activeSeries.format)}</div>
              <div className="flex h-[180px] w-full items-end">
                <div
                  className="w-full rounded-t-md bg-slate-900/75 transition-all"
                  style={{ height: `${Math.max(8, point.ratio * 100)}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-500">{point.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export type { ChartPoint, Series };
