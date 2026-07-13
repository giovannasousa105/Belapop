/**
 * Boundary de dados do Skin Scan — on-device inference.
 *
 * Invariante principal: imagem facial e landmarks NUNCA saem do dispositivo.
 * Apenas UploadableFeatures (índices derivados não identificáveis) podem subir
 * ao servidor, e somente com consentimento explícito (consent_data_sharing).
 */

// UploadableFeatures: re-exportado do módulo canônico
export type {
  UploadableFeatures,
  RawScanResult,
  SkinType,
  Concern,
  QualityFlag,
} from "@/src/features/skinScan/uploadableFeatures";
export {
  UPLOADABLE_KEYS,
  SKIN_TYPES,
  CONCERN_VALUES,
  QUALITY_FLAGS,
  toUploadable,
  assertUploadable,
} from "@/src/features/skinScan/uploadableFeatures";

// Scores brutos do modelo ONNX — ficam no dispositivo, nunca vão à rede
export interface RawSkinScores {
  readonly acne:         number; // 0.0–1.0
  readonly poros:        number;
  readonly textura:      number;
  readonly oleosidade:   number;
  readonly pigmentacao:  number;
  readonly vermelhidao:  number;
  readonly ressecamento: number;
}

export type TipoPele = "SECA" | "MISTA" | "OLEOSA" | "NORMAL" | "SENSIVEL";

export type PreocupacaoFlag =
  | "acne"
  | "poros_dilatados"
  | "textura_irregular"
  | "oleosidade_excessiva"
  | "manchas"
  | "vermelhidao"
  | "ressecamento"
  | "sensibilidade";

/**
 * Resultado completo do scan — NUNCA enviado ao servidor.
 * Contém scores brutos e metadata; permanece na memória do worker.
 * Mapear para RawScanResult antes de chamar toUploadable().
 */
export interface ScanResult {
  readonly scores:       RawSkinScores;
  readonly tipoPele:     TipoPele;
  readonly preocupacoes: readonly PreocupacaoFlag[];
  readonly durationMs:   number;
  readonly modelVersion: string;
  readonly qualityFlag?: "ok" | "baixa_luz" | "desfoque";
  // PROIBIDO de upload: imageData, landmarks, faceGeometry, biometricTemplate
}

// Consentimentos LGPD separados e versionados
export type ConsentType = "consent_scan" | "consent_data_sharing";

export interface ConsentRecord {
  readonly consentType:    ConsentType;
  readonly granted:        boolean;
  readonly policyVersion:  string;
  readonly grantedAt:      string;       // ISO 8601
  readonly revokedAt:      string | null;
}

// Mensagens do Web Worker
export type WorkerInboundMessage =
  | { type: "ANALYZE"; imageData: ImageData; modelVersion: string }
  | { type: "DISPOSE" };

export type WorkerOutboundMessage =
  | { type: "RESULT"; result: ScanResult }
  | { type: "ERROR";  message: string }
  | { type: "READY" };
