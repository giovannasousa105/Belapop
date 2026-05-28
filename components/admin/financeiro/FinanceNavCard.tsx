import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

type Props = {
  href: string;
  label: string;
  description: string;
  icon: ReactNode;
  badge?: string;
  badgeVariant?: "default" | "warning" | "critical";
};

const badgeStyles = {
  default: "bg-[rgba(139,94,60,0.08)] text-[#8B5E3C]",
  warning: "bg-amber-50 text-amber-700",
  critical: "bg-red-50 text-red-600",
};

export function FinanceNavCard({ href, label, description, icon, badge, badgeVariant = "default" }: Props) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-2xl border border-[rgba(139,94,60,0.14)] bg-white p-5 shadow-[0_4px_16px_rgba(28,26,24,0.04)] transition-all hover:-translate-y-[2px] hover:border-[rgba(139,94,60,0.28)] hover:shadow-[0_8px_24px_rgba(28,26,24,0.10)]"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[rgba(139,94,60,0.08)] text-[#8B5E3C] transition-colors group-hover:bg-[rgba(139,94,60,0.14)]">
        {icon}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-[#1A1714]">{label}</p>
          {badge ? (
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${badgeStyles[badgeVariant]}`}>
              {badge}
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-[12px] text-[#9E9589]">{description}</p>
      </div>

      <ChevronRight
        className="h-4 w-4 shrink-0 text-[#9E9589] transition-transform group-hover:translate-x-0.5 group-hover:text-[#8B5E3C]"
        strokeWidth={1.8}
      />
    </Link>
  );
}
