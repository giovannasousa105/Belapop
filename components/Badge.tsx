"use client";

type BadgeVariant = "curadoria" | "novidade" | "premium";

type BadgeProps = {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
};

const variants: Record<BadgeVariant, string> = {
  curadoria:
    "bg-white/90 border border-[#F6D6E2] text-noir-900 shadow-[0_6px_20px_rgba(246,214,226,0.5)]",
  novidade:
    "bg-[#F6D6E2] text-[#B80F5A] border border-[#B80F5A]/30 shadow-[0_8px_20px_rgba(184,15,90,0.25)]",
  premium:
    "bg-[#B80F5A] text-white shadow-[0_12px_35px_rgba(184,15,90,0.25)]"
};

export const Badge = ({ variant = "curadoria", children, className = "" }: BadgeProps) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.4em] ${variants[variant]} ${className}`}
  >
    {children}
  </span>
);
