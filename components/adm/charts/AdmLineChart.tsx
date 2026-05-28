"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

export type AdmLineChartSeries = {
  key: string;
  label: string;
  color?: string;
};

type Props = {
  data: Record<string, string | number>[];
  series: AdmLineChartSeries[];
  xKey: string;
  height?: number;
  formatY?: (value: number) => string;
  formatTooltip?: (value: unknown, name: unknown) => [string, string];
};

const DEFAULT_COLORS = ["#5f5e5e", "#a23d3e", "#6e5b4d", "#446a92", "#2D6A4F"];

export function AdmLineChart({
  data,
  series,
  xKey,
  height = 280,
  formatY,
  formatTooltip
}: Props) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(177,179,169,0.25)" />
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 11, fill: "#7b7d75" }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#7b7d75" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={formatY}
          width={60}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 8,
            border: "1px solid rgba(177,179,169,0.3)",
            fontSize: 12,
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)"
          }}
          formatter={formatTooltip}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
        {series.map((s, i) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={s.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
