import type { ReactNode } from "react";

export type SummaryCell = {
  icon: ReactNode;
  label: string;
  value: string;
  href?: string;
};

export function SummaryStrip({ cells }: { cells: SummaryCell[] }) {
  return (
    <div className="grid divide-x divide-[rgba(139,94,60,0.12)] overflow-hidden rounded-2xl border border-[rgba(139,94,60,0.14)] bg-white shadow-[0_4px_16px_rgba(28,26,24,0.04)]" style={{ gridTemplateColumns: `repeat(${cells.length}, 1fr)` }}>
      {cells.map((cell, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-5 py-4"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[rgba(139,94,60,0.08)] text-[#8B5E3C]">
            {cell.icon}
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#9E9589]">
              {cell.label}
            </p>
            <p className="mt-0.5 text-sm font-semibold text-[#1A1714]">{cell.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
