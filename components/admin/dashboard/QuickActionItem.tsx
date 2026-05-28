import Link from "next/link";
import type { ReactNode } from "react";

export type QuickActionItemProps = {
  icon: ReactNode;
  label: string;
  description?: string;
  badge?: string;
  href: string;
};

export function QuickActionItem({
  icon,
  label,
  description,
  badge,
  href,
}: QuickActionItemProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-2xl border border-[rgba(139,94,60,0.14)] bg-white p-4 shadow-[0_2px_8px_rgba(28,26,24,0.04)] transition-all hover:bg-[#F4F1ED] hover:shadow-[0_4px_16px_rgba(28,26,24,0.06)]"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[rgba(139,94,60,0.08)] text-[#8B5E3C]">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-[#1A1714]">{label}</p>
        {description ? (
          <p className="mt-0.5 truncate text-[13px] text-[#9E9589]">{description}</p>
        ) : null}
      </div>
      {badge ? (
        <span className="shrink-0 rounded-full bg-[rgba(139,94,60,0.10)] px-2.5 py-1 text-[11px] font-semibold text-[#8B5E3C]">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}
