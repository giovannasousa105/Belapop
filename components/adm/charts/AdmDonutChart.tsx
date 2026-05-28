"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

export type AdmDonutSlice = { label: string; value: number; color?: string };

type Props = {
  data: AdmDonutSlice[];
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
};

const DEFAULT_COLORS = ["#5f5e5e", "#a23d3e", "#6e5b4d", "#446a92", "#2D6A4F", "#B45309"];

export function AdmDonutChart({ data, height = 240, innerRadius = 55, outerRadius = 85 }: Props) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          dataKey="value"
          nameKey="label"
          paddingAngle={2}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ borderRadius: 8, border: "1px solid rgba(177,179,169,0.3)", fontSize: 12 }}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
