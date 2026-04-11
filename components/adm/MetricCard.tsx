import Link from "next/link";
import type { ReactNode } from "react";

type MetricCardProps = {
  label: string;
  value: string;
  hint?: string;
  delta?: string;
  href?: string;
  icon?: ReactNode;
  footer?: ReactNode;
  tone?: "default" | "soft" | "alert" | "accent";
  className?: string;
};

const toneMap: Record<NonNullable<MetricCardProps["tone"]>, string> = {
  default: "bg-[var(--adm-surface)]",
  soft: "bg-[var(--adm-surface-muted)]",
  alert: "bg-[rgba(162,61,62,0.06)]",
  accent: "bg-[rgba(110,91,77,0.1)]"
};

export function MetricCard({
  label,
  value,
  hint,
  delta,
  href,
  icon,
  footer,
  tone = "default",
  className
}: MetricCardProps) {
  const content = (
    <article
      className={`flex min-h-[148px] flex-col justify-between rounded-[var(--adm-radius)] border border-[var(--adm-border)] p-6 shadow-[var(--adm-shadow-micro)] transition duration-200 ${
        toneMap[tone]
      } ${href ? "hover:-translate-y-0.5 hover:shadow-[var(--adm-shadow-soft)]" : ""} ${
        className ?? ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--adm-text-soft)]">
          {label}
        </p>
        {icon ? (
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-[var(--adm-text-muted)]">
            {icon}
          </span>
        ) : null}
      </div>
      <div className="mt-6">
        <p className="font-editorial text-[2rem] leading-none tracking-[-0.04em] text-[var(--adm-text)]">
          {value}
        </p>
        {delta ? (
          <p className="mt-4 text-xs font-semibold text-[var(--adm-text-muted)]">{delta}</p>
        ) : null}
        {hint ? <p className="mt-1 text-xs text-[var(--adm-text-soft)]">{hint}</p> : null}
        {footer ? <div className="mt-4">{footer}</div> : null}
      </div>
    </article>
  );

  if (!href) return content;
  return (
    <Link href={href} className="block">
      {content}
    </Link>
  );
}
