import Image from "next/image";

type EditorialCoverHeaderProps = {
  imageUrl?: string | null;
  imageAlt: string;
  sizes: string;
  heightClassName?: string;
  leftLabel: string;
  rightLabel: string;
  title: string;
  subtitle?: string;
  onImageError?: () => void;
};

export function EditorialCoverHeader({
  imageUrl,
  imageAlt,
  sizes,
  heightClassName = "h-36 sm:h-44",
  leftLabel,
  rightLabel,
  title,
  subtitle,
  onImageError
}: EditorialCoverHeaderProps) {
  const imageIsSvg = imageUrl?.toLowerCase().includes(".svg") ?? false;

  return (
    <div
      className={[
        "relative overflow-hidden",
        "bg-[linear-gradient(135deg,#110a10_0%,#2a1220_44%,#61253d_100%)]",
        heightClassName
      ].join(" ")}
    >
      {imageUrl ? (
        <div className="absolute inset-y-0 right-0 w-[54%] overflow-hidden">
          <Image
            src={imageUrl}
            alt={imageAlt}
            fill
            sizes={sizes}
            className="object-cover object-center opacity-[0.18] saturate-[0.9] blur-[0.8px] transition duration-500 group-hover:scale-[1.03]"
            unoptimized={imageIsSvg}
            onError={onImageError}
          />
          <div className="absolute inset-0 bg-[linear-gradient(270deg,rgba(18,12,17,0.06)_0%,rgba(18,12,17,0.38)_36%,rgba(18,12,17,0.92)_100%)]" />
        </div>
      ) : null}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(247,191,209,0.22),transparent_22%),radial-gradient(circle_at_22%_72%,rgba(216,160,172,0.14),transparent_28%),linear-gradient(180deg,rgba(255,244,247,0.02)_0%,rgba(8,6,9,0.24)_100%)]" />
      <div className="pointer-events-none absolute inset-4 rounded-[24px] border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]" />
      <div className="pointer-events-none absolute inset-x-5 top-9 h-px bg-[linear-gradient(90deg,rgba(255,255,255,0.0),rgba(236,199,208,0.36),rgba(255,255,255,0.0))]" />
      <Image
        src="/logo.svg"
        alt=""
        aria-hidden="true"
        width={82}
        height={82}
        className="pointer-events-none absolute right-4 bottom-4 h-14 w-14 object-contain opacity-[0.28] sm:right-5 sm:bottom-5 sm:h-[4rem] sm:w-[4rem]"
        unoptimized
      />
      <div className="absolute inset-x-5 top-4 z-10 flex items-center justify-between gap-4 text-[10px] uppercase tracking-[0.24em] text-white/84">
        <span>{leftLabel}</span>
        <span className="text-[#E6C7CF]">{rightLabel}</span>
      </div>
      <div className="absolute inset-x-5 bottom-4 z-10 max-w-[72%] sm:bottom-5">
        <p className="font-display text-[1.45rem] leading-[0.98] tracking-[-0.03em] text-white sm:text-[1.8rem]">
          {title}
        </p>
        {subtitle ? (
          <p className="mt-2 max-w-[28ch] text-[0.8rem] leading-5 text-white/90 sm:text-[0.84rem]">
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
}
