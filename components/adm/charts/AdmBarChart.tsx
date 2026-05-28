"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from "recharts";

type Props = {
  data: { label: string; value: number; color?: string }[];
  height?: number;
  horizontal?: boolean;
  formatValue?: (value: number) => string;
  color?: string;
};

const DEFAULT_COLOR = "#5f5e5e";

export function AdmBarChart({ data, height = 260, horizontal = false, formatValue, color }: Props) {
  if (horizontal) {
    return (
      <ResponsiveContainer width="100%" height={Math.max(height, data.length * 36)}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(177,179,169,0.25)" />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: "#7b7d75" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatValue}
          />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fontSize: 11, fill: "#7b7d75" }}
            tickLine={false}
            axisLine={false}
            width={120}
          />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: "1px solid rgba(177,179,169,0.3)", fontSize: 12 }}
            formatter={(v) => [formatValue ? formatValue(v as number) : (v as number), ""]}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color ?? color ?? DEFAULT_COLOR} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(177,179,169,0.25)" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#7b7d75" }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#7b7d75" }} tickLine={false} axisLine={false} tickFormatter={formatValue} width={60} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: "1px solid rgba(177,179,169,0.3)", fontSize: 12 }}
          formatter={(v) => [formatValue ? formatValue(v as number) : (v as number), ""]}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color ?? color ?? DEFAULT_COLOR} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
