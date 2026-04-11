"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

type PortalBackButtonProps = {
  fallbackHref: string;
  label?: string;
  tone?: "light" | "dark";
  className?: string;
};

export default function PortalBackButton({
  fallbackHref,
  label = "Voltar",
  tone = "light",
  className = ""
}: PortalBackButtonProps) {
  const router = useRouter();

  const handleBack = useCallback(() => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  }, [fallbackHref, router]);

  const toneClass =
    tone === "dark"
      ? "border-white/20 bg-white/5 text-white/90 hover:border-white/35 hover:bg-white/10 hover:text-white"
      : "border-black/15 bg-white text-bpBlackSoft hover:border-black/30 hover:bg-bpOffWhite";

  return (
    <button
      type="button"
      onClick={handleBack}
      className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-2xl border px-3 text-xs font-semibold uppercase tracking-[0.18em] transition ${toneClass} ${className}`}
    >
      <ArrowLeft size={14} />
      <span>{label}</span>
    </button>
  );
}
