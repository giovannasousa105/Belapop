import { CalendarClock } from "lucide-react";

import type { LifecycleRule } from "@/lib/lifecycle/postPurchase";

type LifecycleRuleCardProps = {
  rule: LifecycleRule;
  className?: string;
};

export function LifecycleRuleCard({ rule, className = "" }: LifecycleRuleCardProps) {
  return (
    <article className={`rounded-[8px] border border-black/10 bg-white p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f7eee9] text-[#8e5b68]">
          <CalendarClock className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-black/45">
            D+{rule.delayDays} · {rule.communicationType}
          </p>
          <h3 className="mt-1 text-sm font-semibold text-[#211c18]">{rule.title}</h3>
          <p className="mt-2 text-xs leading-relaxed text-black/62">{rule.description}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {rule.channels.map((channel) => (
              <span key={channel} className="rounded-full border border-black/10 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-black/52">
                {channel}
              </span>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
