"use client";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

type TrendPoint = { date: string; value: number };

type Props = {
  title: string;
  data: TrendPoint[];
  valueFormatter?: (v: number) => string;
};

export function TrendCard({ title, data, valueFormatter }: Props) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
      <div className="text-xs uppercase tracking-[0.25em] text-bpGraphite/70">
        {title}
      </div>
      <div className="h-56 mt-4">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
          <LineChart data={data}>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={valueFormatter}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              formatter={(value: any) =>
                valueFormatter ? valueFormatter(value as number) : value
              }
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#f25aa5"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
