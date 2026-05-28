import type { ReactNode } from "react";

export type MiniMetricCardProps = {
  icon: ReactNode;
  label: string;
  value: string;
  subtext?: string;
  progress?: number;
};

export function MiniMetricCard({
  icon,
  label,
  value,
  subtext,
  progress,
}: MiniMetricCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-[rgba(139,94,60,0.14)] bg-white p-5 shadow-[0_4px_16px_rgba(28,26,24,0.04)]">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[rgba(139,94,60,0.08)] text-[#8B5E3C]">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9E9589]">
          {label}
        </p>
        <p
          className="mt-1 text-2xl font-medium leading-none tracking-[-0.02em] text-[#1A1714]"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {value}
        </p>
        {subtext ? (
          <p className="mt-0.5 text-[13px] text-[#6B5E54]">{subtext}</p>
        ) : null}
        {progress !== undefined ? (
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#F4F1ED]">
            <div
              className="h-full rounded-full bg-[#10B981] transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
