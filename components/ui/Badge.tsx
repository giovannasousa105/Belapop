import type { ReactNode } from "react";

type BadgeProps = {
  children: ReactNode;
  className?: string;
};

export function Badge({ children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-bpPink/25 bg-bpPink/5 px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-bpPink ${className}`}
    >
      {children}
    </span>
  );
}
