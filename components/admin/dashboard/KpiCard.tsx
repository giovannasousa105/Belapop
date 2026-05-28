"use client";

import Link from "next/link";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Cormorant_Garamond } from "next/font/google";
import type { ReactNode } from "react";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export type KpiCardVariant = "default" | "warning" | "critical" | "success";

export type KpiCardTrend = {
  direction: "up" | "down" | "neutral";
  label: string;
};

export type KpiCardProps = {
  /** New API */
  label?: string;
  /** Legacy API compat */
  title?: string;
  value: string;
  subtext?: string;
  href?: string;
  variant?: KpiCardVariant;
  trend?: KpiCardTrend;
  /** Legacy API compat */
  icon?: ReactNode;
  /** Legacy delta (not shown but accepted) */
  delta?: number;
};

const variantStyles: Record<
  KpiCardVariant,
  { topColor: string; bg: string; trendBg: string; hover: string }
> = {
  default: {
    topColor: "#8B5E3C",
    bg: "bg-white",
    trendBg: "bg-[rgba(139,94,60,0.08)] text-[#8B5E3C]",
    hover: "hover:border-[rgba(139,94,60,0.30)]",
  },
  warning: {
    topColor: "#F59E0B",
    bg: "bg-white",
    trendBg: "bg-amber-50 text-amber-700",
    hover: "hover:border-amber-300",
  },
  critical: {
    topColor: "#EF4444",
    bg: "bg-[#FEF2F2]",
    trendBg: "bg-red-100 text-red-700",
    hover: "hover:border-red-300",
  },
  success: {
    topColor: "#10B981",
    bg: "bg-white",
    trendBg: "bg-emerald-50 text-emerald-700",
    hover: "hover:border-emerald-300",
  },
};

const trendIconMap = { up: TrendingUp, down: TrendingDown, neutral: Minus };
const trendColorMap = {
  up: "text-emerald-600",
  down: "text-red-500",
  neutral: "text-[#9E9589]",
};

export function KpiCard({
  label,
  title,
  value,
  subtext,
  href,
  variant = "default",
  trend,
  icon,
}: KpiCardProps) {
  const resolvedLabel = label ?? title ?? "";
  const v = variantStyles[variant];
  const TrendIcon = trend ? trendIconMap[trend.direction] : null;

  const article = (
    <article
      style={{ borderTopColor: v.topColor, borderTopWidth: "3px" }}
      className={`flex min-h-[156px] flex-col justify-between rounded-2xl border border-[rgba(139,94,60,0.14)] p-6 shadow-[0_4px_16px_rgba(28,26,24,0.04)] transition-all duration-200 ${v.bg} ${v.hover} ${
        href
          ? "cursor-pointer hover:-translate-y-[2px] hover:shadow-[0_8px_24px_rgba(28,26,24,0.10)]"
          : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9E9589]">
          {resolvedLabel}
        </p>
        {icon ? (
          <span className="text-[#9E9589]">{icon}</span>
        ) : null}
      </div>

      <div>
        <p
          className={`${cormorant.className} text-[36px] font-medium leading-none tracking-[-0.02em] text-[#1A1714]`}
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {value}
        </p>
        {subtext ? (
          <p className="mt-1.5 text-[13px] leading-snug text-[#6B5E54]">{subtext}</p>
        ) : null}
      </div>

      {trend ? (
        <div
          className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${v.trendBg}`}
        >
          {TrendIcon ? (
            <TrendIcon
              className={`h-3 w-3 ${trendColorMap[trend.direction]}`}
              strokeWidth={2.5}
            />
          ) : null}
          {trend.label}
        </div>
      ) : null}
    </article>
  );

  if (!href) return article;
  return (
    <Link href={href} className="block">
      {article}
    </Link>
  );
}
