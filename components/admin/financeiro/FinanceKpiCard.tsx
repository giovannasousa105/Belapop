import { Cormorant_Garamond } from "next/font/google";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { ReactNode } from "react";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export type FinanceKpiVariant = "default" | "warning" | "critical" | "success";

type Props = {
  label: string;
  value: string;
  subtext?: string;
  icon?: ReactNode;
  variant?: FinanceKpiVariant;
  trend?: { direction: "up" | "down" | "neutral"; label: string };
};

const variantMap: Record<FinanceKpiVariant, { top: string; trendBg: string }> = {
  default: { top: "#8B5E3C", trendBg: "bg-[rgba(139,94,60,0.08)] text-[#8B5E3C]" },
  warning: { top: "#F59E0B", trendBg: "bg-amber-50 text-amber-700" },
  critical: { top: "#EF4444", trendBg: "bg-red-50 text-red-700" },
  success: { top: "#10B981", trendBg: "bg-emerald-50 text-emerald-700" },
};

const trendIcons = { up: TrendingUp, down: TrendingDown, neutral: Minus };
const trendColors = {
  up: "text-emerald-600",
  down: "text-red-500",
  neutral: "text-[#9E9589]",
};

export function FinanceKpiCard({
  label,
  value,
  subtext,
  icon,
  variant = "default",
  trend,
}: Props) {
  const v = variantMap[variant];
  const TrendIcon = trend ? trendIcons[trend.direction] : null;

  return (
    <article
      style={{ borderTopColor: v.top, borderTopWidth: "3px" }}
      className="flex min-h-[148px] flex-col justify-between rounded-2xl border border-[rgba(139,94,60,0.14)] bg-white p-5 shadow-[0_4px_16px_rgba(28,26,24,0.04)] transition-all hover:-translate-y-[1px] hover:shadow-[0_8px_24px_rgba(28,26,24,0.08)]"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.10em] text-[#9E9589]">{label}</p>
        {icon ? <span className="text-[#9E9589]">{icon}</span> : null}
      </div>

      <div>
        <p
          className={`${cormorant.className} text-[34px] font-medium leading-none text-[#1A1714]`}
          style={{ fontVariantNumeric: "tabular-nums", letterSpacing: "0.01em" }}
        >
          {value}
        </p>
        {subtext ? (
          <p className="mt-1 text-[12px] leading-snug text-[#6B5E54]">{subtext}</p>
        ) : null}
      </div>

      {trend ? (
        <div
          className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${v.trendBg}`}
        >
          {TrendIcon ? (
            <TrendIcon className={`h-3 w-3 ${trendColors[trend.direction]}`} strokeWidth={2.5} />
          ) : null}
          {trend.label}
        </div>
      ) : null}
    </article>
  );
}
