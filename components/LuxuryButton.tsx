"use client";

import Link from "next/link";
import React from "react";

type LuxuryButtonProps = {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
  disabled?: boolean;
  href?: string;
  tone?: "default" | "retail";
  ariaLabel?: string;
};

const base =
  "inline-flex items-center justify-center rounded-2xl border border-transparent font-medium transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bpPink/70 disabled:opacity-60 disabled:pointer-events-none";

const variants: Record<NonNullable<LuxuryButtonProps["variant"]>, string> = {
  primary:
    "bg-[#B80F5A] text-white border border-[#B80F5A] shadow-[0_10px_25px_rgba(184,15,90,0.25)] hover:bg-[#F06292] hover:shadow-[0_15px_30px_rgba(184,15,90,0.35)]",
  secondary:
    "bg-white border border-[#F6D6E2] text-bpBlack shadow-sm hover:bg-[#F6D6E2]/60",
  outline:
    "border-bpPinkSoft/30 text-bpOffWhite hover:border-bpPink/70 hover:text-bpOffWhite",
  ghost:
    "border-white/10 text-bpPinkSoft hover:border-bpPink/60 hover:text-bpOffWhite"
};

const retailVariants: Record<NonNullable<LuxuryButtonProps["variant"]>, string> =
  {
    primary:
      "bg-[#B80F5A] text-white shadow-[0_10px_25px_rgba(184,15,90,0.25)] hover:bg-[#F06292]",
    secondary:
      "bg-white border border-[#F6D6E2] text-bpBlack hover:bg-[#F6D6E2]/60",
    outline:
      "bg-white border-slate-200 text-bpBlackSoft hover:bg-slate-50 hover:shadow-sm",
    ghost:
      "bg-white/70 border-slate-200 text-bpGraphite hover:bg-white hover:shadow-sm"
  };

const sizes: Record<NonNullable<LuxuryButtonProps["size"]>, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-sm",
  lg: "px-7 py-3.5 text-base"
};

export const LuxuryButton = ({
  children,
  variant = "primary",
  size = "md",
  onClick,
  type = "button",
  className,
  disabled,
  href,
  tone = "default",
  ariaLabel
}: LuxuryButtonProps) => {
  const isRetail = tone === "retail";
  const classes = `${base} ${isRetail ? "rounded-full" : ""} ${
    isRetail ? retailVariants[variant] : variants[variant]
  } ${sizes[size]} ${className ?? ""}`;

  if (href) {
    return (
      <Link href={href} className={classes} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
};
