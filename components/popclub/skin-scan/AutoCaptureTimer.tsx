"use client";

import type { FaceCaptureGuideState } from "@/lib/skincare/faceCaptureReadiness";

type AutoCaptureTimerProps = {
  progress: number;
  guideState: FaceCaptureGuideState;
};

const clamp = (value: number) => Math.max(0, Math.min(1, value));

const guideStroke: Record<FaceCaptureGuideState, string> = {
  idle: "rgba(255,255,255,0.62)",
  searching: "rgba(255,255,255,0.86)",
  error: "rgba(240,182,109,0.9)",
  ready: "rgba(142,230,189,0.95)"
};

export default function AutoCaptureTimer({ progress, guideState }: AutoCaptureTimerProps) {
  const safeProgress = clamp(progress);
  const rx = 36;
  const ry = 41;
  const circumference = Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry)));
  const offset = circumference * (1 - safeProgress);

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 100"
      className="pointer-events-none absolute left-1/2 top-1/2 h-[min(64vh,620px)] w-[min(72vw,520px)] -translate-x-1/2 -translate-y-1/2"
      preserveAspectRatio="none"
    >
      <ellipse
        cx="50"
        cy="50"
        rx={rx}
        ry={ry}
        fill="none"
        stroke={guideStroke[guideState]}
        strokeWidth="0.72"
        strokeDasharray={guideState === "searching" ? "2 2.4" : undefined}
      />
      <ellipse
        cx="50"
        cy="50"
        rx={rx}
        ry={ry}
        fill="none"
        stroke="rgba(142,230,189,0.95)"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 50 50)"
        opacity={safeProgress > 0 ? 1 : 0}
      />
    </svg>
  );
}
