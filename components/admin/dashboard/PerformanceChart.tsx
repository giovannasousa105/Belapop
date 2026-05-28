"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export type ChartDataPoint = {
  date: string;
  gmv: number;
  orders: number;
};

export type PerformanceChartProps = {
  data: ChartDataPoint[];
  insight?: string;
};

type TooltipPayloadEntry = {
  name: string;
  value: number;
  color: string;
};

type CustomTooltipProps = {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
};

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-[rgba(139,94,60,0.14)] bg-white p-3 shadow-[0_8px_24px_rgba(28,26,24,0.10)]">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9E9589]">
        {label}
      </p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ background: entry.color }}
          />
          <span className="text-[13px] text-[#1A1714]">
            {entry.name === "gmv"
              ? `R$ ${entry.value.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`
              : `${entry.value} pedidos`}
          </span>
        </div>
      ))}
    </div>
  );
}

export function PerformanceChart({ data, insight }: PerformanceChartProps) {
  const [showGmv, setShowGmv] = useState(true);
  const [showOrders, setShowOrders] = useState(true);

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-[rgba(139,94,60,0.14)] bg-white p-6 shadow-[0_4px_16px_rgba(28,26,24,0.04)]">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9E9589]">
            Evolução de Performance
          </p>
          <h3 className="mt-1 text-lg font-medium leading-tight text-[#1A1714]">
            Crescimento Sustentado
          </h3>
        </div>
        {/* Series toggle pills */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowGmv((v) => !v)}
            className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all ${
              showGmv
                ? "bg-[#8B5E3C] text-white shadow-sm"
                : "bg-[#F4F1ED] text-[#9E9589]"
            }`}
          >
            GMV
          </button>
          <button
            type="button"
            onClick={() => setShowOrders((v) => !v)}
            className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all ${
              showOrders
                ? "bg-[#10B981] text-white shadow-sm"
                : "bg-[#F4F1ED] text-[#9E9589]"
            }`}
          >
            Pedidos
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid
              horizontal
              vertical={false}
              strokeDasharray="3 3"
              stroke="rgba(139,94,60,0.07)"
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "#9E9589" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val: string) => val.slice(5)}
            />
            <YAxis
              yAxisId="gmv"
              orientation="left"
              tick={{ fontSize: 11, fill: "#9E9589" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val: number) =>
                val >= 1000 ? `R$${(val / 1000).toFixed(0)}k` : `R$${val}`
              }
            />
            <YAxis
              yAxisId="orders"
              orientation="right"
              tick={{ fontSize: 11, fill: "#9E9589" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            {showGmv ? (
              <Line
                yAxisId="gmv"
                type="monotone"
                dataKey="gmv"
                stroke="#8B5E3C"
                strokeWidth={2.5}
                dot={{ fill: "#8B5E3C", r: 4, strokeWidth: 0 }}
                activeDot={{ fill: "#8B5E3C", r: 6, strokeWidth: 0 }}
              />
            ) : null}
            {showOrders ? (
              <Line
                yAxisId="orders"
                type="monotone"
                dataKey="orders"
                stroke="#10B981"
                strokeWidth={2.5}
                strokeDasharray="5 5"
                dot={{ fill: "#10B981", r: 4, strokeWidth: 0 }}
                activeDot={{ fill: "#10B981", r: 6, strokeWidth: 0 }}
              />
            ) : null}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Footer insight */}
      {insight ? (
        <div className="border-t border-[rgba(139,94,60,0.07)] pt-3 text-[13px] text-[#6B5E54]">
          <span className="mr-1.5 text-[#C9956A]">✦</span>
          <span className="font-semibold text-[#8B5E3C]">Crescimento Sustentado</span>
          {" — "}
          {insight}
        </div>
      ) : null}
    </div>
  );
}
