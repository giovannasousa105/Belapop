"use client";

import { Camera } from "lucide-react";

type CaptureButtonProps = {
  onCapture: () => void;
  disabled: boolean;
  ready: boolean;
};

export default function CaptureButton({ onCapture, disabled, ready }: CaptureButtonProps) {
  return (
    <button
      type="button"
      onClick={onCapture}
      disabled={disabled}
      aria-label={ready ? "Capturar agora" : "Aguardando ajuste da captura"}
      className="pointer-events-auto inline-flex min-h-[56px] w-full max-w-[360px] items-center justify-center gap-3 border border-white/24 bg-white/[0.08] px-6 text-[11px] font-bold uppercase tracking-[0.24em] text-white shadow-[0_18px_60px_rgba(0,0,0,0.2)] backdrop-blur-xl transition hover:border-white/60 hover:bg-white/16 disabled:cursor-not-allowed disabled:border-white/12 disabled:bg-white/[0.04] disabled:text-white/44"
    >
      <Camera className="h-4 w-4" aria-hidden="true" />
      {ready ? "Capturar agora" : "Ajustando..."}
    </button>
  );
}
