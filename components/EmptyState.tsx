"use client";

type Props = {
  title: string;
  description?: string;
  body?: string;
  ctaLabel?: string;
  ctaHref?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  title,
  description,
  body,
  ctaLabel,
  ctaHref,
  actionLabel,
  onAction
}: Props) {
  const copy = description ?? body;
  return (
    <div className="rounded-2xl border border-black/10 bg-bpOffWhite p-6 text-center text-sm text-bpGraphite/80">
      <p className="font-semibold text-bpBlackSoft">{title}</p>
      {copy && <p className="mt-1">{copy}</p>}
      {ctaLabel && ctaHref && (
        <a
          href={ctaHref}
          className="mt-3 inline-block rounded-full border border-bpBlack/20 px-4 py-2 text-xs uppercase tracking-[0.25em] text-bpBlackSoft hover:border-bpGraphite/50"
        >
          {ctaLabel}
        </a>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-3 rounded-full border border-bpBlack/20 px-4 py-2 text-xs uppercase tracking-[0.25em] text-bpBlackSoft hover:border-bpGraphite/50"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
