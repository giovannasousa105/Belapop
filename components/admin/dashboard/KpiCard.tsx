"use client";

import { ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

type Props = {
  title: string;
  value: string;
  delta?: number;
  icon?: ReactNode;
};

export function KpiCard({ title, value, delta, icon }: Props) {
  const isPositive = delta !== undefined ? delta >= 0 : true;
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.25em] text-noir-500">
        <span>{title}</span>
        {icon ? <span className="text-noir-400">{icon}</span> : null}
      </div>
      <div className="text-2xl font-display text-noir-950">{value}</div>
      {delta !== undefined && (
        <div
          className={`inline-flex items-center gap-1 text-xs font-medium ${
            isPositive ? "text-emerald-600" : "text-rose-600"
          }`}
        >
          {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
          {Math.abs(delta).toFixed(1)}% vs. período anterior
        </div>
      )}
    </div>
  );
}
