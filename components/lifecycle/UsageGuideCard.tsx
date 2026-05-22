import { CheckCircle2, Sparkles } from "lucide-react";

import type { ProductUsageGuide } from "@/lib/lifecycle/postPurchase";

type UsageGuideCardProps = {
  guide: ProductUsageGuide;
  className?: string;
};

export function UsageGuideCard({ guide, className = "" }: UsageGuideCardProps) {
  return (
    <article className={`rounded-[8px] border border-black/10 bg-white p-5 shadow-sm ${className}`}>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f7eee9] text-[#8e5b68]">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-black/45">Guia de uso</p>
          <h3 className="mt-1 font-editorial text-2xl leading-tight text-[#201b18]">{guide.productName}</h3>
          <p className="mt-2 text-sm text-black/62">
            Etapa: {guide.routineStep} · Frequencia: {guide.frequency}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {guide.howToUse.map((item) => (
          <p key={item} className="flex gap-2 text-sm leading-relaxed text-black/70">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#8e5b68]" aria-hidden="true" />
            {item}
          </p>
        ))}
      </div>

      <div className="mt-5 grid gap-3 border-t border-black/10 pt-4 text-xs leading-relaxed text-black/62 md:grid-cols-2">
        <p>
          <span className="font-semibold text-black/80">Combina com: </span>
          {guide.combinesWith.join(", ")}
        </p>
        <p>
          <span className="font-semibold text-black/80">Evitar junto com: </span>
          {guide.avoidWith.length ? guide.avoidWith.join(", ") : "sem restricao destacada"}
        </p>
      </div>
    </article>
  );
}
