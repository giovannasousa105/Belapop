import type { FaceMappingResult } from "@/lib/skincare/faceMappingService";

export type SkinScanFusionResult = {
  confidenceScore: number;
  imageQualityScore: number;
  quizWeight: number;
  visualWeight: number;
  explanation: string;
};

type SkinScanFusionInput = {
  hasImage: boolean;
  hasQuizSignals: boolean;
  hasHistorySignals?: boolean;
  faceMapping?: FaceMappingResult | null;
};

function clampUnit(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, Number(value.toFixed(4))));
}

export function createSkinScanFusionResult(input: SkinScanFusionInput): SkinScanFusionResult {
  const imageQualityScore = clampUnit(input.faceMapping?.quality.imageQualityScore ?? 0);
  const hasHistorySignals = Boolean(input.hasHistorySignals);
  const quizBaseConfidence = input.hasQuizSignals ? 0.82 : 0.58;
  const historyBoost = hasHistorySignals ? 0.06 : 0;

  if (!input.hasImage || !input.faceMapping || !input.faceMapping.faceDetected) {
    return {
      confidenceScore: clampUnit(quizBaseConfidence + historyBoost),
      imageQualityScore,
      quizWeight: 1,
      visualWeight: 0,
      explanation:
        "Não conseguimos validar bem a imagem, então a recomendação foi criada principalmente com base no quiz."
    };
  }

  if (imageQualityScore < 0.6) {
    return {
      confidenceScore: clampUnit(quizBaseConfidence * 0.8 + imageQualityScore * 0.2 + historyBoost),
      imageQualityScore,
      quizWeight: 0.8,
      visualWeight: 0.2,
      explanation:
        "Como a qualidade da imagem está limitada, priorizamos suas respostas para manter a recomendação mais confiável."
    };
  }

  return {
    confidenceScore: clampUnit(quizBaseConfidence * 0.55 + imageQualityScore * 0.45 + historyBoost),
    imageQualityScore,
    quizWeight: 0.55,
    visualWeight: 0.45,
    explanation:
      "A recomendação combina sua foto com suas respostas para criar uma leitura cosmética mais personalizada."
  };
}
