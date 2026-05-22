"use client";

type RetryCaptureStateProps = {
  eyebrow?: string;
  title: string;
  description: string;
  primaryLabel: string;
  secondaryLabel?: string;
  onPrimary: () => void;
  onSecondary?: () => void;
};

export default function RetryCaptureState({
  eyebrow = "Skin Scan BelaPop",
  title,
  description,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary
}: RetryCaptureStateProps) {
  return (
    <div className="fixed inset-0 z-[10001] flex h-[100dvh] w-screen items-center justify-center bg-black px-6 text-white">
      <div className="w-full max-w-lg rounded-[32px] border border-white/12 bg-white/6 p-8 text-center backdrop-blur-xl">
        <p className="text-[11px] uppercase tracking-[0.3em] text-white/54">{eyebrow}</p>
        <h1 className="mt-4 font-[var(--font-playfair)] text-4xl font-semibold tracking-[-0.05em]">{title}</h1>
        <p className="mt-5 text-sm leading-7 text-white/76">{description}</p>

        <div className="mt-8 flex flex-col gap-3">
          <button
            type="button"
            onClick={onPrimary}
            className="inline-flex min-h-14 items-center justify-center rounded-full bg-white px-6 text-[11px] font-semibold uppercase tracking-[0.28em] text-black"
          >
            {primaryLabel}
          </button>
          {secondaryLabel && onSecondary ? (
            <button
              type="button"
              onClick={onSecondary}
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/16 px-6 text-[11px] uppercase tracking-[0.28em] text-white/72"
            >
              {secondaryLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
