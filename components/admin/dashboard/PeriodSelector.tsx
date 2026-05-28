"use client";

export const PERIODS = ["7d", "30d", "90d", "Jan 2026"] as const;
export type Period = (typeof PERIODS)[number];

export type PeriodSelectorProps = {
  value: Period;
  onChange: (period: Period) => void;
};

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  return (
    <div className="flex items-center gap-1 rounded-xl bg-[#F4F1ED] p-1">
      {PERIODS.map((period) => (
        <button
          key={period}
          type="button"
          onClick={() => onChange(period)}
          className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all duration-150 ${
            value === period
              ? "bg-white text-[#8B5E3C] shadow-[0_2px_8px_rgba(28,26,24,0.06)]"
              : "text-[#9E9589] hover:text-[#6B5E54]"
          }`}
        >
          {period}
        </button>
      ))}
    </div>
  );
}
