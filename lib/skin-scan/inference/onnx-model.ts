import type { SkinAnalysisModel } from "./model";
import type { RawSkinScores } from "./types";

// Instala via: npm install onnxruntime-web
// O WASM e o modelo ficam em /public/models/ — nunca enviados ao servidor

const MODEL_PATH    = "/models/skin_analysis.onnx";
const INPUT_NAME    = "input";
const IMAGE_SIZE    = 224;
const MEAN          = [0.485, 0.456, 0.406] as const; // ImageNet
const STD           = [0.229, 0.224, 0.225] as const;

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function preprocessToNCHW(imageData: ImageData): Float32Array {
  const { data, width, height } = imageData;
  const buf = new Float32Array(3 * IMAGE_SIZE * IMAGE_SIZE);
  const W = Math.min(width, IMAGE_SIZE);
  const H = Math.min(height, IMAGE_SIZE);

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const src = (y * width + x) * 4;
      buf[0 * IMAGE_SIZE * IMAGE_SIZE + y * IMAGE_SIZE + x] =
        (data[src]     / 255 - MEAN[0]) / STD[0];
      buf[1 * IMAGE_SIZE * IMAGE_SIZE + y * IMAGE_SIZE + x] =
        (data[src + 1] / 255 - MEAN[1]) / STD[1];
      buf[2 * IMAGE_SIZE * IMAGE_SIZE + y * IMAGE_SIZE + x] =
        (data[src + 2] / 255 - MEAN[2]) / STD[2];
    }
  }
  return buf;
}

export class OnnxSkinModel implements SkinAnalysisModel {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private session: any = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private ort: any = null;

  readonly version = "belapop-skin-v1";

  get isReady(): boolean {
    return this.session !== null;
  }

  async load(): Promise<void> {
    if (this.session) return;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error — onnxruntime-web é peer dep; instalar com: npm install onnxruntime-web
    this.ort = await import("onnxruntime-web");

    const providers: string[] =
      typeof navigator !== "undefined" && "gpu" in navigator
        ? ["webgpu", "wasm"]
        : ["wasm"];

    this.session = await this.ort.InferenceSession.create(MODEL_PATH, {
      executionProviders: providers,
      graphOptimizationLevel: "all",
    });
  }

  async infer(imageData: ImageData): Promise<RawSkinScores> {
    if (!this.session || !this.ort) {
      throw new Error("Modelo não carregado. Chame load() primeiro.");
    }

    const pixels = preprocessToNCHW(imageData);
    const tensor = new this.ort.Tensor(
      "float32",
      pixels,
      [1, 3, IMAGE_SIZE, IMAGE_SIZE],
    );

    const results = await this.session.run({ [INPUT_NAME]: tensor });

    // Espera saída [1, 7]: acne, poros, textura, oleosidade, pigmentacao, vermelhidao, ressecamento
    const outputKey   = Object.keys(results)[0];
    const rawValues   = Array.from(results[outputKey].data as Float32Array);
    const [acne, poros, textura, oleosidade, pigmentacao, vermelhidao, ressecamento] =
      rawValues.map(sigmoid);

    // Wipe buffer antes de liberar
    pixels.fill(0);

    return { acne, poros, textura, oleosidade, pigmentacao, vermelhidao, ressecamento };
  }

  dispose(): void {
    this.session?.release?.();
    this.session = null;
    this.ort     = null;
  }
}
