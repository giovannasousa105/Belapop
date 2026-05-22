"use client";

import { useEffect, useMemo, useState } from "react";

import AnalyzingOverlay from "@/components/popclub/skin-scan/AnalyzingOverlay";
import CapturedImagePreview from "@/components/popclub/skin-scan/CapturedImagePreview";

type SkinAnalysisLoadingProps = {
  imageUrl: string;
};

const loadingSteps = [
  "Verificando qualidade da imagem",
  "Lendo textura aparente",
  "Avaliando uniformidade visual",
  "Mapeando áreas de hidratação aparente",
  "Preparando sua rotina personalizada"
] as const;

export default function SkinAnalysisLoading({ imageUrl }: SkinAnalysisLoadingProps) {
  const [progress, setProgress] = useState(0.08);

  useEffect(() => {
    const startedAt = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const elapsed = now - startedAt;
      const next = Math.min(0.92, 0.08 + elapsed / 5_500);
      setProgress(next);
      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const activeStepIndex = useMemo(
    () => Math.min(loadingSteps.length - 1, Math.floor(progress * loadingSteps.length)),
    [progress]
  );

  return (
    <CapturedImagePreview src={imageUrl}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),transparent_42%)]" />
      <div className="absolute inset-0">
        {[
          { left: "37%", top: "28%" },
          { left: "50%", top: "36%" },
          { left: "61%", top: "47%" },
          { left: "42%", top: "56%" },
          { left: "55%", top: "64%" }
        ].map((point, index) => (
          <span
            key={`${point.left}-${point.top}`}
            className="absolute h-2 w-2 rounded-full bg-white/68 shadow-[0_0_18px_rgba(255,255,255,0.42)]"
            style={{
              left: point.left,
              top: point.top,
              opacity: activeStepIndex >= index ? 0.92 : 0.28
            }}
          />
        ))}
      </div>

      <AnalyzingOverlay progress={progress} activeLabel={loadingSteps[activeStepIndex]} />
    </CapturedImagePreview>
  );
}
