import type { RawSkinScores } from "./types";

/**
 * Abstração do backend de inferência.
 * Permite substituir ONNX Runtime Web por WebGPU ou HTTP fallback
 * sem alterar o Worker ou o InferenceClient.
 */
export interface SkinAnalysisModel {
  /** Carrega pesos e aquece o modelo. Idempotente. */
  load(): Promise<void>;

  /**
   * Processa pixels e retorna scores brutos.
   * O chamador é responsável por descartar imageData após a chamada.
   */
  infer(imageData: ImageData): Promise<RawSkinScores>;

  /** Libera sessão ONNX, buffers GPU e demais recursos. */
  dispose(): void;

  readonly version: string;
  readonly isReady: boolean;
}
