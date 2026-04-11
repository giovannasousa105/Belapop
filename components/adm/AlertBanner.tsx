import type { ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle, BellRing, Info } from "lucide-react";

type AlertTone = "normal" | "warning" | "critical";

const toneMap: Record<
  AlertTone,
  { className: string; icon: ReactNode }
> = {
  normal: {
    className: "border-[var(--adm-border)] bg-[var(--adm-surface)] text-[var(--adm-text)]",
    icon: <Info className="h-4 w-4" />
  },
  warning: {
    className: "border-amber-200 bg-amber-50 text-[#6f531b]",
    icon: <BellRing className="h-4 w-4" />
  },
  critical: {
    className: "border-rose-200 bg-rose-50 text-[#772f34]",
    icon: <AlertTriangle className="h-4 w-4" />
  }
};

type AlertBannerProps = {
  title: string;
  description: string;
  tone?: AlertTone;
  actionLabel?: string;
  actionHref?: string;
};

export function AlertBanner({
  title,
  description,
  tone = "normal",
  actionLabel,
  actionHref
}: AlertBannerProps) {
  const toneConfig = toneMap[tone];

  return (
    <section className={`rounded-[var(--adm-radius)] border p-5 shadow-[var(--adm-shadow-micro)] ${toneConfig.className}`}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-white/70">
          {toneConfig.icon}
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em]">{title}</p>
          <p className="mt-2 text-sm leading-relaxed">{description}</p>
          {actionLabel && actionHref ? (
            <Link
              href={actionHref}
              className="mt-3 inline-flex text-[10px] font-semibold uppercase tracking-[0.18em] underline underline-offset-4"
            >
              {actionLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
