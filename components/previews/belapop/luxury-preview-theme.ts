import { Manrope, Noto_Serif } from "next/font/google";

export const previewHeadlineFont = Noto_Serif({
  subsets: ["latin"],
  weight: ["400", "700"]
});

export const previewBodyFont = Manrope({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "800"]
});

export const previewEyebrowClass =
  "text-[10px] font-semibold uppercase tracking-[0.28em] text-[#444748]";

export const previewPrimaryButtonClass =
  "inline-flex min-h-14 items-center justify-center gap-3 bg-black px-6 text-[11px] font-semibold uppercase tracking-[0.24em] text-white transition-colors hover:bg-[#ef75ce] disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-16 sm:px-8";

export const previewSecondaryButtonClass =
  "inline-flex min-h-14 items-center justify-center gap-3 border border-black/12 bg-white px-6 text-[11px] font-semibold uppercase tracking-[0.24em] text-black transition-colors hover:bg-[#f6f3f2] disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-16 sm:px-8";

export const previewAccentButtonClass =
  "inline-flex min-h-14 items-center justify-center gap-3 bg-[#ef75ce] px-6 text-[11px] font-semibold uppercase tracking-[0.24em] text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-16 sm:px-8";

export const previewLinkButtonClass =
  "inline-flex min-h-12 items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-black underline underline-offset-4 transition-colors hover:text-[#ef75ce] disabled:cursor-not-allowed disabled:opacity-60";

export const previewInputClass =
  "min-h-14 w-full border-0 border-b border-black/12 bg-transparent px-0 py-4 text-sm placeholder:text-[#747878]/60 focus:border-[#ef75ce] focus:outline-none focus:ring-0 sm:text-base";

export const previewPanelClass =
  "border border-black/8 bg-white shadow-[0_24px_60px_rgba(0,0,0,0.06)]";

export const previewMutedPanelClass = "border border-black/8 bg-[#f6f3f2]";
