"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

export type AdmAreaSeries = { key: string; label: string; color?: string };

type Props = {
  data: Record<string, string | number>[];
  series: AdmAreaSeries[];
  xKey: string;
  height?: number;
  formatY?: (value: number) => string;
};

const DEFAULT_COLORS = ["#5f5e5e", "#a23d3e", "#6e5b4d"];

export function AdmAreaChart({ data, series, xKey, height = 280, formatY }: Props) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <defs>
          {series.map((s, i) => {
            const color = s.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length];
            return (
              <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.15} />
                <stop offset="95%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            );
          })}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(177,179,169,0.25)" />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: "#7b7d75" }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#7b7d75" }} tickLine={false} axisLine={false} tickFormatter={formatY} width={60} />
        <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid rgba(177,179,169,0.3)", fontSize: 12 }} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
        {series.map((s, i) => {
          const color = s.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length];
          return (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={color}
              strokeWidth={2}
              fill={`url(#grad-${s.key})`}
              dot={false}
            />
          );
        })}
      </AreaChart>
    </ResponsiveContainer>
  );
}
