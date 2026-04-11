"use client";

type BadgeVariant = "curadoria" | "novidade" | "premium";

type BadgeProps = {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
};

const variants: Record<BadgeVariant, string> = {
  curadoria:
    "bg-white/90 border border-bpPinkSoft/60 text-bpBlackSoft shadow-[0_6px_20px_rgba(244,182,194,0.5)]",
  novidade:
    "bg-bpPinkSoft text-bpPink border border-bpPink/30 shadow-[0_8px_20px_rgba(194,24,91,0.25)]",
  premium:
    "bg-bpPink text-white shadow-[0_12px_35px_rgba(194,24,91,0.25)]"
};

export const Badge = ({ variant = "curadoria", children, className = "" }: BadgeProps) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.4em] ${variants[variant]} ${className}`}
  >
    {children}
  </span>
);
