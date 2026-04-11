import Link from "next/link";

type AccessDeniedProps = {
  eyebrow?: string;
  title: string;
  description: string;
  detail?: string;
  actionHref?: string;
  actionLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

export function AccessDenied({
  eyebrow = "Acesso interno",
  title,
  description,
  detail,
  actionHref,
  actionLabel,
  secondaryHref,
  secondaryLabel
}: AccessDeniedProps) {
  return (
    <section className="rounded-[30px] border border-[#d8d1c6] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(246,242,235,0.94))] p-8 shadow-[0_22px_70px_rgba(45,39,33,0.08)]">
      <p className="text-[11px] uppercase tracking-[0.28em] text-[#756d63]">{eyebrow}</p>
      <h2 className="mt-3 font-editorial text-4xl text-[#1f1b18]">{title}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#5d554d]">{description}</p>
      {detail ? <p className="mt-3 text-xs uppercase tracking-[0.18em] text-[#7b746a]">{detail}</p> : null}
      {actionHref || secondaryHref ? (
        <div className="mt-6 flex flex-wrap gap-3">
          {actionHref && actionLabel ? (
            <Link
              href={actionHref}
              className="rounded-full border border-[#1f1b18] bg-[#1f1b18] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#faf7f1]"
            >
              {actionLabel}
            </Link>
          ) : null}
          {secondaryHref && secondaryLabel ? (
            <Link
              href={secondaryHref}
              className="rounded-full border border-[#cbc3b8] bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#4e483f]"
            >
              {secondaryLabel}
            </Link>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
