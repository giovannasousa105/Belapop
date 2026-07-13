// Re-exporta a implementação canônica
export {
  toUploadable,
  assertUploadable,
  UPLOADABLE_KEYS,
} from "@/src/features/skinScan/uploadableFeatures";

export type { UploadableFeatures, RawScanResult } from "@/src/features/skinScan/uploadableFeatures";

import type { ScanResult } from "./types";
import type { RawScanResult } from "@/src/features/skinScan/uploadableFeatures";

/**
 * Converte ScanResult (output interno do Worker) para RawScanResult
 * (shape esperado pelo toUploadable canônico).
 *
 * Mapeamento dos 7 scores ONNX para os 10 índices da whitelist:
 *   hydration      ← (1 - ressecamento)  escalado p/ 0–10
 *   oiliness       ← oleosidade           escalado p/ 0–10
 *   texture        ← (1 - textura)        escalado p/ 0–10 (menor textura raw = mais suave)
 *   poreVisibility ← poros                escalado p/ 0–10
 *   redness        ← vermelhidao          escalado p/ 0–10
 *   evenness       ← (1 - pigmentacao)    escalado p/ 0–10
 *   darkSpots      ← pigmentacao          escalado p/ 0–10
 *   barrierHealth  ← composto (1 - (ressecamento + vermelhidao) / 2)
 *   fineLines      ← 0 (modelo v1 não estima — atualizar quando disponível)
 *   darkCircles    ← 0 (modelo v1 não estima — atualizar quando disponível)
 */
export function scanResultToRaw(result: ScanResult): RawScanResult {
  const { scores, tipoPele, preocupacoes, modelVersion, qualityFlag } = result;
  const s = (v: number) => Math.round(v * 10); // 0–1 → 0–10

  const skinTypeMap: Record<string, string> = {
    SECA: "seca", MISTA: "mista", OLEOSA: "oleosa", NORMAL: "normal", SENSIVEL: "normal",
  };

  const concernMap: Record<string, string> = {
    acne: "acne",
    manchas: "manchas",
    pigmentacao: "manchas",
    ressecamento: "barreira",
    vermelhidao: "antiaging",
  };

  const concerns = [
    ...new Set(
      preocupacoes
        .map((p) => concernMap[p])
        .filter((c): c is string => Boolean(c)),
    ),
  ];

  return {
    indices: {
      hydration:      s(1 - scores.ressecamento),
      oiliness:       s(scores.oleosidade),
      texture:        s(1 - scores.textura),
      poreVisibility: s(scores.poros),
      redness:        s(scores.vermelhidao),
      evenness:       s(1 - scores.pigmentacao),
      darkSpots:      s(scores.pigmentacao),
      barrierHealth:  s(1 - (scores.ressecamento + scores.vermelhidao) / 2),
      fineLines:      0,
      darkCircles:    0,
    },
    skinType:        skinTypeMap[tipoPele] ?? "normal",
    primaryConcerns: concerns,
    modelVersion,
    qualityFlag:     qualityFlag ?? "ok",
    createdAt:       new Date().toISOString(),
  };
}

/**
 * Campos explicitamente proibidos em payloads de upload.
 * Mantido para retrocompatibilidade com assertNoForbiddenFields.
 */
export const FORBIDDEN_UPLOAD_FIELDS = new Set([
  "imageData", "image", "image_base64", "imageBase64",
  "image_url", "imageUrl", "pixels", "rawPixels",
  "bitmap", "canvas", "frame", "videoFrame",
  "landmarks", "keypoints", "faceLandmarks", "faceKeypoints",
  "faceGeometry", "faceBox", "faceBoundingBox",
  "biometricTemplate", "faceDescriptor", "faceEmbedding", "embedding",
  "rawScores", "scores",
  "feature_vector",
]);

export function assertNoForbiddenFields(payload: unknown, path = ""): void {
  if (typeof payload !== "object" || payload === null) return;
  for (const key of Object.keys(payload as Record<string, unknown>)) {
    if (FORBIDDEN_UPLOAD_FIELDS.has(key)) {
      throw new Error(
        `Campo proibido no payload de upload: "${path}${key}". ` +
        `Dados de imagem, landmarks e scores brutos nunca podem ser enviados ao servidor.`,
      );
    }
    const val = (payload as Record<string, unknown>)[key];
    if (typeof val === "object" && val !== null) {
      assertNoForbiddenFields(val, `${path}${key}.`);
    }
  }
}
