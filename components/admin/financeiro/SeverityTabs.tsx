import Link from "next/link";

export type SeverityTab = {
  label: string;
  value: string;
  href: string;
  count?: number;
  variant?: "default" | "warning" | "critical" | "success";
};

const variantStyles = {
  default: "bg-[rgba(139,94,60,0.08)] text-[#8B5E3C] border-[rgba(139,94,60,0.20)]",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  critical: "bg-red-50 text-red-600 border-red-200",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export function SeverityTabs({
  tabs,
  activeValue,
}: {
  tabs: SeverityTab[];
  activeValue: string;
}) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto">
      {tabs.map((tab) => {
        const isActive = tab.value === activeValue;
        const v = tab.variant ?? "default";

        return (
          <Link
            key={tab.value}
            href={tab.href}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] transition-all ${
              isActive
                ? variantStyles[v]
                : "border-[rgba(139,94,60,0.14)] bg-white text-[#9E9589] hover:border-[rgba(139,94,60,0.24)] hover:text-[#6B5E54]"
            }`}
          >
            {tab.label}
            {tab.count !== undefined ? (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold leading-none ${
                  isActive ? "bg-white/50" : "bg-[rgba(139,94,60,0.08)] text-[#8B5E3C]"
                }`}
              >
                {tab.count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
