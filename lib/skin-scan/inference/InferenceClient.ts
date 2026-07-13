"use client";

import type { ScanResult, WorkerOutboundMessage } from "./types";
import type { UploadableFeatures } from "@/src/features/skinScan/uploadableFeatures";
import { toUploadable, assertUploadable } from "@/src/features/skinScan/uploadableFeatures";
import { scanResultToRaw } from "./toUploadable";

const MODEL_VERSION = "belapop-skin-v1";

type PendingEntry = { resolve: (r: ScanResult) => void; reject: (e: Error) => void };

/**
 * Coordena a comunicação com o Web Worker de inferência on-device.
 * A imagem é transferida ao Worker via postMessage (buffer neutered),
 * tornando impossível qualquer leitura na main thread após o envio.
 */
export class InferenceClient {
  private worker:  Worker | null = null;
  private pending: Map<number, PendingEntry> = new Map();
  private seq = 0;

  private getWorker(): Worker {
    if (this.worker) return this.worker;

    this.worker = new Worker(
      new URL("./skin-scan.worker.ts", import.meta.url),
      { type: "module" },
    );

    this.worker.onmessage = (ev: MessageEvent<WorkerOutboundMessage>) => {
      const { data } = ev;
      if (data.type === "RESULT") {
        const entry = this.pending.get(this.seq - 1);
        entry?.resolve(data.result);
        this.pending.delete(this.seq - 1);
      } else if (data.type === "ERROR") {
        const entry = this.pending.get(this.seq - 1);
        entry?.reject(new Error(data.message));
        this.pending.delete(this.seq - 1);
      }
      // READY: ignorado após carregamento
    };

    this.worker.onerror = (e) => {
      for (const entry of this.pending.values()) {
        entry.reject(new Error(`Worker error: ${e.message}`));
      }
      this.pending.clear();
    };

    return this.worker;
  }

  /**
   * Envia imageData ao Worker para análise on-device.
   * imageData.data.buffer é transferido — após a chamada,
   * o buffer está neutered na main thread (byteLength === 0).
   */
  analyze(imageData: ImageData): Promise<ScanResult> {
    const worker = this.getWorker();
    const id     = this.seq++;

    return new Promise<ScanResult>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      worker.postMessage(
        { type: "ANALYZE", imageData, modelVersion: MODEL_VERSION },
        [imageData.data.buffer],  // transferência de posse — imagem não fica na main thread
      );
    });
  }

  /**
   * Converte ScanResult → RawScanResult → UploadableFeatures.
   * ScanResult nunca sai do dispositivo; apenas UploadableFeatures pode ser enviado.
   * assertUploadable() garante que nenhum campo extra escapou.
   */
  toUploadable(result: ScanResult): UploadableFeatures {
    const raw      = scanResultToRaw(result);
    const features = toUploadable(raw);
    assertUploadable(features);
    return features;
  }

  dispose(): void {
    this.worker?.postMessage({ type: "DISPOSE" });
    this.worker?.terminate();
    this.worker  = null;
    this.pending.clear();
  }
}
