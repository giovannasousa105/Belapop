"use client";

type Props = {
  title: string;
  amount: string;
  subtitle?: string;
  badge?: string;
};

export function MoneySummaryCard({ title, amount, subtitle, badge }: Props) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.25em] text-noir-500">
        <span>{title}</span>
        {badge ? (
          <span className="rounded-full bg-noir-900 px-2 py-0.5 text-[10px] text-white uppercase tracking-[0.2em]">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="text-2xl font-display text-noir-950">{amount}</div>
      {subtitle && <p className="text-sm text-noir-600">{subtitle}</p>}
    </div>
  );
}
