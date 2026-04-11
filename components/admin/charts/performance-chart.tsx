"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

export type PerfPoint = {
  ts: number;
  label: string;
  gmv: number;
  orders: number;
  cancelRate: number;
};

function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function formatInt(value: number) {
  return value.toLocaleString("pt-BR");
}

export default function PerformanceChart({
  data,
  mode
}: {
  data: PerfPoint[];
  mode: "gmv" | "orders";
}) {
  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="4 4" stroke="#e2e8f0" />

          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            fontSize={12}
            minTickGap={16}
          />

          <YAxis
            yAxisId="left"
            tickLine={false}
            axisLine={false}
            fontSize={12}
            tickFormatter={(value) =>
              mode === "gmv"
                ? formatBRL(Number(value))
                : formatInt(Number(value))
            }
          />

          <YAxis
            yAxisId="right"
            orientation="right"
            tickLine={false}
            axisLine={false}
            fontSize={12}
            tickFormatter={(value) => `${value}%`}
            domain={[0, (max: number) => Math.max(5, Math.ceil(max + 1))]}
          />

          <Tooltip
            formatter={(value: unknown, name: unknown) => {
              if (name === "gmv") return [formatBRL(Number(value)), "GMV"];
              if (name === "orders") return [formatInt(Number(value)), "Pedidos"];
              if (name === "cancelRate") {
                return [`${Number(value).toFixed(2)}%`, "Cancelamento"];
              }

              return [String(value), String(name)];
            }}
            labelFormatter={(label) => `Hora: ${String(label)}`}
          />

          <Area
            yAxisId="left"
            type="monotone"
            dataKey={mode === "gmv" ? "gmv" : "orders"}
            name={mode}
            stroke="#0f172a"
            fill="#94a3b8"
            strokeWidth={2}
            fillOpacity={0.25}
          />

          <Line
            yAxisId="right"
            type="monotone"
            dataKey="cancelRate"
            stroke="#e11d48"
            strokeWidth={2}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
