/// <reference lib="webworker" />

import type { SkinAnalysisModel } from "./model";
import type {
  WorkerInboundMessage,
  WorkerOutboundMessage,
  ScanResult,
  TipoPele,
  PreocupacaoFlag,
  RawSkinScores,
} from "./types";

let model: SkinAnalysisModel | null = null;

function deriveTipoPele(
  acne: number,
  oleosidade: number,
  ressecamento: number,
): TipoPele {
  if (oleosidade > 0.6 && acne > 0.3) return "OLEOSA";
  if (ressecamento > 0.6)              return "SECA";
  if (oleosidade > 0.5)                return "MISTA";
  if (acne > 0.2 || oleosidade > 0.4)  return "SENSIVEL";
  return "NORMAL";
}

function derivePreocupacoes(s: RawSkinScores): PreocupacaoFlag[] {
  const flags: PreocupacaoFlag[] = [];
  if (s.acne > 0.35)                       flags.push("acne");
  if (s.poros > 0.4)                       flags.push("poros_dilatados");
  if (s.textura > 0.4)                     flags.push("textura_irregular");
  if (s.oleosidade > 0.55)                 flags.push("oleosidade_excessiva");
  if (s.pigmentacao > 0.35)               flags.push("manchas");
  if (s.vermelhidao > 0.35)               flags.push("vermelhidao");
  if (s.ressecamento > 0.5)               flags.push("ressecamento");
  if (s.vermelhidao > 0.5 && s.acne > 0.2) flags.push("sensibilidade");
  return flags;
}

async function ensureModel(modelVersion: string): Promise<SkinAnalysisModel> {
  if (model) return model;

  const { OnnxSkinModel } = await import("./onnx-model");
  model = new OnnxSkinModel();
  await model.load();

  const ready: WorkerOutboundMessage = { type: "READY" };
  self.postMessage(ready);
  void modelVersion; // version tag vem do cliente

  return model;
}

self.onmessage = async (event: MessageEvent<WorkerInboundMessage>) => {
  const msg = event.data;

  if (msg.type === "DISPOSE") {
    model?.dispose();
    model = null;
    return;
  }

  if (msg.type === "ANALYZE") {
    try {
      const m = await ensureModel(msg.modelVersion);

      const t0 = performance.now();
      const scores = await m.infer(msg.imageData);
      const durationMs = Math.round(performance.now() - t0);

      // imageData já foi transferido (buffer neutered) — não há referência à imagem aqui

      const result: ScanResult = {
        scores,
        tipoPele:     deriveTipoPele(scores.acne, scores.oleosidade, scores.ressecamento),
        preocupacoes: derivePreocupacoes(scores),
        durationMs,
        modelVersion: msg.modelVersion,
      };

      const out: WorkerOutboundMessage = { type: "RESULT", result };
      self.postMessage(out);
    } catch (err) {
      const out: WorkerOutboundMessage = {
        type: "ERROR",
        message: err instanceof Error ? err.message : "Erro desconhecido na inferência.",
      };
      self.postMessage(out);
    }
  }
};
