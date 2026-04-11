"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { formatPrice } from "@/lib/utils";

type Point = {
  date: string;
  label: string;
  orders: number;
  gmvCents: number;
  canceled: number;
};

type Props = {
  title: string;
  data: Point[];
};

const kFormatter = (value: number) => {
  if (!Number.isFinite(value)) return "0";
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(Math.round(value));
};

export function OrdersPerformanceChart({ title, data }: Props) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
      <div className="text-xs uppercase tracking-[0.25em] text-bpGraphite/70">{title}</div>
      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 11 }}
              tickFormatter={kFormatter}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => formatPrice(Number(v) / 100)}
              tickLine={false}
              axisLine={false}
              width={90}
            />
            <Tooltip
              formatter={(value: unknown, name: unknown) => {
                const rawValue = Array.isArray(value) ? value[0] : value;
                const numeric = Number(rawValue ?? 0);
                if (name === "GMV") return formatPrice(numeric / 100);
                return numeric.toLocaleString("pt-BR");
              }}
            />
            <Legend />
            <Bar yAxisId="left" dataKey="orders" name="Pedidos" fill="#111827" radius={[6, 6, 0, 0]} />
            <Line yAxisId="right" type="monotone" dataKey="gmvCents" name="GMV" stroke="#d61b72" strokeWidth={2.5} dot={false} />
            <Line yAxisId="left" type="monotone" dataKey="canceled" name="Cancelados" stroke="#ef4444" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
