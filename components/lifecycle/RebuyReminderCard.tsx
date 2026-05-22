import Link from "next/link";
import { RotateCcw } from "lucide-react";

import type { RebuyReminder } from "@/lib/lifecycle/postPurchase";

type RebuyReminderCardProps = {
  reminder: RebuyReminder;
  className?: string;
};

export function RebuyReminderCard({ reminder, className = "" }: RebuyReminderCardProps) {
  return (
    <article className={`rounded-[8px] border border-[#ded4cc] bg-[#fbf7f2] p-5 ${className}`}>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#8e5b68]">
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/45">Recompra assistida</p>
          <h3 className="mt-1 font-editorial text-2xl leading-tight text-[#211c18]">Talvez esteja na hora de repor seu favorito.</h3>
          <p className="mt-2 text-sm leading-relaxed text-black/65">
            {reminder.productName} costuma durar cerca de {reminder.recommendedAfterDays} dias nessa categoria.
          </p>
        </div>
      </div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Link
          href={reminder.ctaHref}
          className="inline-flex h-11 items-center justify-center rounded-full bg-[#211c18] px-5 text-xs font-semibold uppercase tracking-[0.18em] text-white"
        >
          Recomprar agora
        </Link>
        <Link
          href="/universos/clinical-luxury"
          className="inline-flex h-11 items-center justify-center rounded-full border border-black/15 px-5 text-xs font-semibold uppercase tracking-[0.18em] text-[#211c18]"
        >
          Ver alternativa premium
        </Link>
      </div>
    </article>
  );
}
