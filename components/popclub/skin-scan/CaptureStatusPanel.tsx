"use client";

import ScanStatusIndicators from "@/components/popclub/skin-scan/ScanStatusIndicators";
import type { FaceMeshValidationState } from "@/components/popclub/skin-scan/FaceMeshValidator";

type CaptureStatusPanelProps = {
  instruction: string;
  validation: FaceMeshValidationState;
  countdownLabel: string | null;
};

export default function CaptureStatusPanel({
  instruction,
  validation,
  countdownLabel
}: CaptureStatusPanelProps) {
  return (
    <section className="pointer-events-auto mx-auto w-full max-w-[min(92vw,460px)] rounded-[18px] border border-white/14 bg-black/32 px-4 py-4 text-center text-white shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl sm:px-5">
      <p className="text-[9px] font-semibold uppercase tracking-[0.28em] text-white/48">
        leitura ao vivo
      </p>
      <p className="mt-2 text-base font-medium leading-6 text-white sm:text-lg">
        {countdownLabel ?? instruction}
      </p>
      <div className="mt-4">
        <ScanStatusIndicators
          face={validation.faceStatus}
          distance={validation.distanceStatus}
          lighting={validation.lightingStatus}
          stability={validation.stabilityStatus}
        />
      </div>
    </section>
  );
}
