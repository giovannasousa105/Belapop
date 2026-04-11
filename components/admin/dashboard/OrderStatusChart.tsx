"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type StatusPoint = {
  status: string;
  label: string;
  count: number;
};

type Props = {
  title: string;
  data: StatusPoint[];
};

export function OrderStatusChart({ title, data }: Props) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
      <div className="text-xs uppercase tracking-[0.25em] text-bpGraphite/70">{title}</div>
      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis
              type="category"
              dataKey="label"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={110}
            />
            <Tooltip
              formatter={(value: unknown) => {
                const rawValue = Array.isArray(value) ? value[0] : value;
                return Number(rawValue ?? 0).toLocaleString("pt-BR");
              }}
            />
            <Bar dataKey="count" name="Pedidos" fill="#0f172a" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
