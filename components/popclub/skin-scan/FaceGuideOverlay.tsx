"use client";

import { ArrowLeft } from "lucide-react";

import AutoCaptureTimer from "@/components/popclub/skin-scan/AutoCaptureTimer";
import CaptureButton from "@/components/popclub/skin-scan/CaptureButton";
import CaptureStatusPanel from "@/components/popclub/skin-scan/CaptureStatusPanel";
import type { FaceMeshValidationState } from "@/components/popclub/skin-scan/FaceMeshValidator";

type FaceGuideOverlayProps = {
  instruction: string;
  onBack: () => void;
  onManualCapture: () => void;
  manualCaptureDisabled?: boolean;
  holdProgress: number;
  validation: FaceMeshValidationState;
  countdownLabel: string | null;
  flashActive?: boolean;
};

const guideGlow = {
  idle: "shadow-[0_0_0_1px_rgba(255,255,255,0.08)]",
  searching: "shadow-[0_0_24px_rgba(255,255,255,0.14)] animate-pulse",
  error: "shadow-[0_0_26px_rgba(240,182,109,0.24)]",
  ready: "shadow-[0_0_42px_rgba(142,230,189,0.36)]"
} as const;

export default function FaceGuideOverlay({
  instruction,
  onBack,
  onManualCapture,
  manualCaptureDisabled = false,
  holdProgress,
  validation,
  countdownLabel,
  flashActive = false
}: FaceGuideOverlayProps) {
  const ready = validation.canAutoCapture;

  return (
    <div className="pointer-events-none fixed inset-0 z-[10000] h-[100dvh] w-screen overflow-hidden">
      <AutoCaptureTimer progress={holdProgress} guideState={validation.guideState} />

      <div
        className={`pointer-events-none absolute left-1/2 top-[calc(50%+1.75rem)] h-[min(58vh,620px)] w-[min(72vw,520px)] -translate-x-1/2 -translate-y-1/2 rounded-[999px] border border-white/18 sm:top-1/2 sm:h-[min(64vh,620px)] ${guideGlow[validation.guideState]}`}
      />

      {validation.faceDetected ? (
        <>
          <div className="pointer-events-none absolute left-1/2 top-[calc(50%+1.75rem)] h-[min(58vh,620px)] w-[min(72vw,520px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[999px] sm:top-1/2 sm:h-[min(64vh,620px)]">
            <div className="absolute inset-x-8 top-0 h-20 animate-[skinScanLine_2.4s_ease-in-out_infinite] bg-gradient-to-b from-transparent via-white/18 to-transparent" />
            <div className="absolute inset-x-10 top-1/2 h-px bg-white/28" />
          </div>
          {validation.meshPoints.map((point, index) => (
            <span
              key={`${point.x}-${point.y}-${index}`}
              className="absolute h-1.5 w-1.5 rounded-full bg-white/46 shadow-[0_0_12px_rgba(255,255,255,0.3)]"
              style={{
                left: `${100 - point.x * 100}%`,
                top: `${point.y * 100}%`
              }}
            />
          ))}
        </>
      ) : null}

      {flashActive ? <div className="absolute inset-0 bg-white/18 transition-opacity duration-300" /> : null}

      <div className="pointer-events-auto absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/36 to-transparent px-5 pb-5 pt-[max(1rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={onBack}
          aria-label="Voltar"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/16 bg-black/18 text-white backdrop-blur-md transition hover:bg-white/10"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <p className="text-[11px] font-bold uppercase tracking-[0.42em] text-white/82">BelaPop</p>
        <div className="w-11" />
      </div>

      <div className="absolute inset-x-4 top-[max(5.75rem,calc(env(safe-area-inset-top)+4.75rem))]">
        <CaptureStatusPanel
          instruction={instruction}
          validation={validation}
          countdownLabel={countdownLabel}
        />
      </div>

      <div className="absolute inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] sm:bottom-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-[520px] flex-col items-center gap-3 text-center">
          <CaptureButton
            onCapture={onManualCapture}
            disabled={manualCaptureDisabled || !ready}
            ready={ready}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes skinScanLine {
          0% {
            transform: translateY(-26%);
            opacity: 0;
          }
          18% {
            opacity: 0.9;
          }
          70% {
            opacity: 0.7;
          }
          100% {
            transform: translateY(620%);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
