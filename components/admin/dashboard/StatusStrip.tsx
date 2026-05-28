import Link from "next/link";
import type { ReactNode } from "react";

export type StatusCell = {
  icon: ReactNode;
  iconBg?: string;
  label: string;
  value: string;
  href?: string;
};

export type StatusStripProps = {
  cells: StatusCell[];
};

function Cell({ cell }: { cell: StatusCell }) {
  const inner = (
    <div
      className={`group flex min-h-[60px] flex-1 items-center gap-3 px-5 py-4 transition-all ${
        cell.href ? "cursor-pointer hover:bg-[rgba(139,94,60,0.04)]" : ""
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
          cell.iconBg ?? "bg-[rgba(139,94,60,0.08)] text-[#8B5E3C]"
        }`}
      >
        {cell.icon}
      </span>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9E9589]">
          {cell.label}
        </p>
        <p
          className="mt-0.5 text-[15px] font-semibold leading-none text-[#1A1714]"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {cell.value}
        </p>
      </div>
    </div>
  );

  if (!cell.href) return inner;
  return (
    <Link href={cell.href} className="flex flex-1">
      {inner}
    </Link>
  );
}

export function StatusStrip({ cells }: StatusStripProps) {
  return (
    <div className="flex w-full flex-col overflow-hidden rounded-2xl border border-[rgba(139,94,60,0.14)] bg-white shadow-[0_4px_16px_rgba(28,26,24,0.04)] sm:flex-row">
      {cells.map((cell, i) => (
        <div key={cell.label} className="flex flex-1">
          {i > 0 ? (
            <div className="hidden w-px bg-[rgba(139,94,60,0.07)] sm:block" />
          ) : null}
          {i > 0 ? (
            <div className="h-px w-full bg-[rgba(139,94,60,0.07)] sm:hidden" />
          ) : null}
          <Cell cell={cell} />
        </div>
      ))}
    </div>
  );
}
