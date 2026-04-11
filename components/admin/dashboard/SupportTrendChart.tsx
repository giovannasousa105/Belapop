"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type SupportPoint = {
  date: string;
  label: string;
  opened: number;
  replied: number;
};

type Props = {
  title: string;
  data: SupportPoint[];
};

export function SupportTrendChart({ title, data }: Props) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
      <div className="text-xs uppercase tracking-[0.25em] text-bpGraphite/70">{title}</div>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip
              formatter={(value: unknown) => {
                const rawValue = Array.isArray(value) ? value[0] : value;
                return Number(rawValue ?? 0).toLocaleString("pt-BR");
              }}
            />
            <Legend />
            <Line type="monotone" dataKey="opened" name="Tickets abertos" stroke="#d61b72" strokeWidth={2.4} dot={false} />
            <Line type="monotone" dataKey="replied" name="Respostas suporte" stroke="#2563eb" strokeWidth={2.2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
