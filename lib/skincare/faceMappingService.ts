export const FACE_MAPPING_REGION_KEYS = [
  "forehead",
  "nose",
  "left_cheek",
  "right_cheek",
  "chin",
  "eye_area",
  "mouth_area",
  "jawline",
  "t_zone",
  "u_zone"
] as const;

export type FaceRegionKey = (typeof FACE_MAPPING_REGION_KEYS)[number];

export type RegionAnalysis = {
  averageBrightness: number;
  rednessScore: number;
  darkSpotScore: number;
  textureScore: number;
  shineScore: number;
  poreVisibilityScore: number;
  confidence: number;
};

export type FaceImageQuality = {
  brightness: "low" | "good" | "high";
  blur: "low" | "medium" | "high";
  faceCentered: boolean;
  multipleFaces: boolean;
  imageQualityScore: number;
  messages: string[];
};

export type FaceMappingResult = {
  faceDetected: boolean;
  quality: FaceImageQuality;
  regions: Record<FaceRegionKey, RegionAnalysis>;
};

export type FaceMappingInput = {
  image: File | Blob | HTMLImageElement | ImageData | HTMLCanvasElement;
  allowMock?: boolean;
};

export type FaceLandmarkDetectionResult = {
  faceDetected: boolean;
  multipleFaces: boolean;
  faceCentered: boolean;
  boundingBox: NormalizedBox | null;
  confidence: number;
  imageData: ImageData | null;
  provider: "browser" | "external" | "mock";
};

export type FaceLandmarkProvider = {
  detect(input: FaceMappingInput): Promise<FaceLandmarkDetectionResult>;
};

type NormalizedBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type RegionBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type RasterizedImage = {
  imageData: ImageData;
  width: number;
  height: number;
};

const DEFAULT_REGION_ANALYSIS: RegionAnalysis = {
  averageBrightness: 0.5,
  rednessScore: 0,
  darkSpotScore: 0,
  textureScore: 0,
  shineScore: 0,
  poreVisibilityScore: 0,
  confidence: 0.08
};

const EMPTY_QUALITY: FaceImageQuality = {
  brightness: "low",
  blur: "high",
  faceCentered: false,
  multipleFaces: false,
  imageQualityScore: 0,
  messages: ["A foto parece desfocada. Tente novamente com a câmera limpa e estável."]
};

function clampUnit(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, Number(value.toFixed(4))));
}

function createEmptyRegions(): Record<FaceRegionKey, RegionAnalysis> {
  return FACE_MAPPING_REGION_KEYS.reduce(
    (acc, key) => {
      acc[key] = { ...DEFAULT_REGION_ANALYSIS };
      return acc;
    },
    {} as Record<FaceRegionKey, RegionAnalysis>
  );
}

function isCanvasElement(value: unknown): value is HTMLCanvasElement {
  return typeof HTMLCanvasElement !== "undefined" && value instanceof HTMLCanvasElement;
}

function isImageElement(value: unknown): value is HTMLImageElement {
  return typeof HTMLImageElement !== "undefined" && value instanceof HTMLImageElement;
}

function isImageDataValue(value: unknown): value is ImageData {
  return typeof ImageData !== "undefined" && value instanceof ImageData;
}

function ensureCanvas(width: number, height: number) {
  if (typeof document === "undefined") return null;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;

  return { canvas, context };
}

async function imageFromBlob(blob: Blob) {
  if (typeof document === "undefined") return null;

  const url = URL.createObjectURL(blob);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const nextImage = new Image();
      nextImage.onload = () => resolve(nextImage);
      nextImage.onerror = () => reject(new Error("Não foi possivel carregar a imagem para análise."));
      nextImage.src = url;
    });

    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function rasterizeFaceMappingInput(input: FaceMappingInput): Promise<RasterizedImage | null> {
  if (isImageDataValue(input.image)) {
    return {
      imageData: input.image,
      width: input.image.width,
      height: input.image.height
    };
  }

  if (isCanvasElement(input.image)) {
    const context = input.image.getContext("2d", { willReadFrequently: true });
    if (!context) return null;

    return {
      imageData: context.getImageData(0, 0, input.image.width, input.image.height),
      width: input.image.width,
      height: input.image.height
    };
  }

  if (isImageElement(input.image)) {
    const prepared = ensureCanvas(input.image.naturalWidth || input.image.width, input.image.naturalHeight || input.image.height);
    if (!prepared) return null;

    prepared.context.drawImage(input.image, 0, 0, prepared.canvas.width, prepared.canvas.height);

    return {
      imageData: prepared.context.getImageData(0, 0, prepared.canvas.width, prepared.canvas.height),
      width: prepared.canvas.width,
      height: prepared.canvas.height
    };
  }

  if (input.image instanceof Blob) {
    const image = await imageFromBlob(input.image);
    if (!image) return null;
    return rasterizeFaceMappingInput({ image, allowMock: input.allowMock });
  }

  return null;
}

function toLuma(r: number, g: number, b: number) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function isPotentialSkinPixel(r: number, g: number, b: number) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (r < 35 || g < 20 || b < 15) return false;
  if (max - min < 12) return false;
  if (r < g || r < b) return false;

  const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
  const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

  return cb >= 72 && cb <= 135 && cr >= 128 && cr <= 185;
}

function buildSkinMask(imageData: ImageData) {
  const { data, width, height } = imageData;
  const mask = new Uint8Array(width * height);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      mask[y * width + x] = isPotentialSkinPixel(data[index], data[index + 1], data[index + 2]) ? 1 : 0;
    }
  }

  return mask;
}

function buildCoarseMask(mask: Uint8Array, width: number, height: number, coarseSize = 28) {
  const coarse = new Uint8Array(coarseSize * coarseSize);
  const cellWidth = Math.max(1, Math.floor(width / coarseSize));
  const cellHeight = Math.max(1, Math.floor(height / coarseSize));

  for (let cy = 0; cy < coarseSize; cy += 1) {
    for (let cx = 0; cx < coarseSize; cx += 1) {
      let total = 0;
      let count = 0;

      const startX = cx * cellWidth;
      const startY = cy * cellHeight;
      const endX = cx === coarseSize - 1 ? width : Math.min(width, startX + cellWidth);
      const endY = cy === coarseSize - 1 ? height : Math.min(height, startY + cellHeight);

      for (let y = startY; y < endY; y += 1) {
        for (let x = startX; x < endX; x += 1) {
          total += mask[y * width + x];
          count += 1;
        }
      }

      coarse[cy * coarseSize + cx] = count > 0 && total / count >= 0.22 ? 1 : 0;
    }
  }

  return { coarse, coarseSize };
}

function connectedComponents(coarseMask: Uint8Array, size: number) {
  const visited = new Uint8Array(size * size);
  const components: Array<{ area: number; minX: number; minY: number; maxX: number; maxY: number }> = [];
  const directions = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1]
  ] as const;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const startIndex = y * size + x;
      if (!coarseMask[startIndex] || visited[startIndex]) continue;

      let area = 0;
      let minX = x;
      let minY = y;
      let maxX = x;
      let maxY = y;
      const queue: Array<[number, number]> = [[x, y]];
      visited[startIndex] = 1;

      while (queue.length) {
        const [currentX, currentY] = queue.shift() as [number, number];
        area += 1;
        minX = Math.min(minX, currentX);
        minY = Math.min(minY, currentY);
        maxX = Math.max(maxX, currentX);
        maxY = Math.max(maxY, currentY);

        for (const [dx, dy] of directions) {
          const nextX = currentX + dx;
          const nextY = currentY + dy;
          if (nextX < 0 || nextY < 0 || nextX >= size || nextY >= size) continue;

          const nextIndex = nextY * size + nextX;
          if (!coarseMask[nextIndex] || visited[nextIndex]) continue;

          visited[nextIndex] = 1;
          queue.push([nextX, nextY]);
        }
      }

      components.push({ area, minX, minY, maxX, maxY });
    }
  }

  return components.sort((left, right) => right.area - left.area);
}

function normalizedBoxFromComponent(
  component: { minX: number; minY: number; maxX: number; maxY: number },
  coarseSize: number
): NormalizedBox {
  const padding = 1 / coarseSize;

  const x = Math.max(0, component.minX / coarseSize - padding);
  const y = Math.max(0, component.minY / coarseSize - padding);
  const maxX = Math.min(1, (component.maxX + 1) / coarseSize + padding);
  const maxY = Math.min(1, (component.maxY + 1) / coarseSize + padding);

  return {
    x: clampUnit(x),
    y: clampUnit(y),
    width: clampUnit(maxX - x),
    height: clampUnit(maxY - y)
  };
}

function buildDetectionFromRaster(imageData: ImageData): FaceLandmarkDetectionResult {
  const mask = buildSkinMask(imageData);
  const skinPixels = mask.reduce((sum, value) => sum + value, 0);
  const coverageRatio = skinPixels / mask.length;
  const { coarse, coarseSize } = buildCoarseMask(mask, imageData.width, imageData.height);
  const components = connectedComponents(coarse, coarseSize);
  const primaryComponent = components[0] ?? null;
  const multipleFaces = components.filter((component) => component.area >= coarseSize * 0.8).length > 1;
  const faceDetected = Boolean(primaryComponent) && coverageRatio >= 0.05;
  const boundingBox = primaryComponent ? normalizedBoxFromComponent(primaryComponent, coarseSize) : null;
  const faceCenterX = boundingBox ? boundingBox.x + boundingBox.width / 2 : 0.5;
  const faceCenterY = boundingBox ? boundingBox.y + boundingBox.height / 2 : 0.5;
  const faceCentered = boundingBox
    ? Math.abs(faceCenterX - 0.5) <= 0.16 &&
      Math.abs(faceCenterY - 0.48) <= 0.18 &&
      boundingBox.width >= 0.18 &&
      boundingBox.height >= 0.24
    : false;

  const confidence = faceDetected
    ? clampUnit(Math.min(1, coverageRatio * 2.3) * (faceCentered ? 1 : 0.72) * (multipleFaces ? 0.4 : 1))
    : 0;

  return {
    faceDetected,
    multipleFaces,
    faceCentered,
    boundingBox,
    confidence,
    imageData,
    provider: "browser"
  };
}

function regionBoxFromNormalized(bounds: NormalizedBox | null, region: FaceRegionKey): RegionBox | null {
  if (!bounds) return null;

  const definitions: Record<FaceRegionKey, RegionBox> = {
    forehead: { x: 0.18, y: 0.05, width: 0.64, height: 0.18 },
    nose: { x: 0.38, y: 0.28, width: 0.24, height: 0.24 },
    left_cheek: { x: 0.09, y: 0.33, width: 0.25, height: 0.24 },
    right_cheek: { x: 0.66, y: 0.33, width: 0.25, height: 0.24 },
    chin: { x: 0.34, y: 0.68, width: 0.32, height: 0.2 },
    eye_area: { x: 0.19, y: 0.18, width: 0.62, height: 0.16 },
    mouth_area: { x: 0.29, y: 0.53, width: 0.42, height: 0.14 },
    jawline: { x: 0.18, y: 0.68, width: 0.64, height: 0.18 },
    t_zone: { x: 0.26, y: 0.05, width: 0.48, height: 0.48 },
    u_zone: { x: 0.09, y: 0.31, width: 0.82, height: 0.57 }
  };

  const regionBox = definitions[region];

  return {
    x: clampUnit(bounds.x + bounds.width * regionBox.x),
    y: clampUnit(bounds.y + bounds.height * regionBox.y),
    width: clampUnit(bounds.width * regionBox.width),
    height: clampUnit(bounds.height * regionBox.height)
  };
}

function imageCropStats(imageData: ImageData, region: RegionBox | null): RegionAnalysis {
  if (!region) return { ...DEFAULT_REGION_ANALYSIS };

  const startX = Math.max(0, Math.floor(region.x * imageData.width));
  const startY = Math.max(0, Math.floor(region.y * imageData.height));
  const endX = Math.min(imageData.width, Math.ceil((region.x + region.width) * imageData.width));
  const endY = Math.min(imageData.height, Math.ceil((region.y + region.height) * imageData.height));

  if (startX >= endX || startY >= endY) {
    return { ...DEFAULT_REGION_ANALYSIS };
  }

  const { data, width } = imageData;
  let totalBrightness = 0;
  let totalRedness = 0;
  let totalDarkPixels = 0;
  let totalHighlights = 0;
  let totalTexture = 0;
  let totalPores = 0;
  let sampleCount = 0;
  const lumaGrid: number[] = [];

  for (let y = startY; y < endY; y += 1) {
    for (let x = startX; x < endX; x += 1) {
      const index = (y * width + x) * 4;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const luminance = toLuma(r, g, b) / 255;

      totalBrightness += luminance;
      totalRedness += clampUnit((r - (g + b) / 2) / 110);
      totalHighlights += luminance > 0.88 && Math.abs(r - g) < 18 && Math.abs(r - b) < 18 ? 1 : 0;
      sampleCount += 1;
      lumaGrid.push(luminance);
    }
  }

  const averageBrightness = sampleCount ? totalBrightness / sampleCount : 0.5;

  for (let index = 0; index < lumaGrid.length; index += 1) {
    const luminance = lumaGrid[index];
    totalDarkPixels += luminance < Math.max(0.06, averageBrightness - 0.12) ? 1 : 0;
  }

  for (let y = startY; y < endY - 1; y += 2) {
    for (let x = startX; x < endX - 1; x += 2) {
      const index = (y * width + x) * 4;
      const rightIndex = (y * width + (x + 1)) * 4;
      const downIndex = ((y + 1) * width + x) * 4;

      const baseLuma = toLuma(data[index], data[index + 1], data[index + 2]) / 255;
      const rightLuma = toLuma(data[rightIndex], data[rightIndex + 1], data[rightIndex + 2]) / 255;
      const downLuma = toLuma(data[downIndex], data[downIndex + 1], data[downIndex + 2]) / 255;

      const edgeMagnitude = Math.abs(baseLuma - rightLuma) + Math.abs(baseLuma - downLuma);
      totalTexture += edgeMagnitude;
      totalPores += edgeMagnitude > 0.16 && edgeMagnitude < 0.42 ? 1 : 0;
    }
  }

  const textureBase = sampleCount ? totalTexture / Math.max(1, sampleCount / 4) : 0;

  return {
    averageBrightness: clampUnit(averageBrightness),
    rednessScore: clampUnit(totalRedness / sampleCount),
    darkSpotScore: clampUnit(totalDarkPixels / sampleCount),
    textureScore: clampUnit(textureBase * 1.9),
    shineScore: clampUnit(totalHighlights / sampleCount),
    poreVisibilityScore: clampUnit(totalPores / Math.max(1, sampleCount / 4)),
    confidence: 0.1
  };
}

function classifyBrightness(value: number): FaceImageQuality["brightness"] {
  if (value < 0.32) return "low";
  if (value > 0.82) return "high";
  return "good";
}

function computeBlurScore(imageData: ImageData) {
  const { data, width, height } = imageData;
  let total = 0;
  let count = 0;

  for (let y = 1; y < height - 1; y += 3) {
    for (let x = 1; x < width - 1; x += 3) {
      const index = (y * width + x) * 4;
      const rightIndex = (y * width + (x + 1)) * 4;
      const downIndex = ((y + 1) * width + x) * 4;

      const luma = toLuma(data[index], data[index + 1], data[index + 2]);
      const rightLuma = toLuma(data[rightIndex], data[rightIndex + 1], data[rightIndex + 2]);
      const downLuma = toLuma(data[downIndex], data[downIndex + 1], data[downIndex + 2]);

      total += Math.abs(luma - rightLuma) + Math.abs(luma - downLuma);
      count += 1;
    }
  }

  return clampUnit((total / Math.max(1, count)) / 48);
}

function classifyBlur(edgeScore: number): FaceImageQuality["blur"] {
  if (edgeScore < 0.18) return "high";
  if (edgeScore < 0.3) return "medium";
  return "low";
}

function buildQuality(args: {
  detection: FaceLandmarkDetectionResult;
  globalBrightness: number;
  blurEdgeScore: number;
}): FaceImageQuality {
  const brightness = classifyBrightness(args.globalBrightness);
  const blur = classifyBlur(args.blurEdgeScore);
  const messages: string[] = [];
  let score = 1;

  if (brightness === "low") {
    score -= 0.25;
    messages.push("A imagem está um pouco escura. Tente novamente em luz natural.");
  } else if (brightness === "high") {
    score -= 0.15;
  }

  if (blur === "high") {
    score -= 0.3;
    messages.push("A foto parece desfocada. Tente novamente com a câmera limpa e estável.");
  } else if (blur === "medium") {
    score -= 0.15;
  }

  if (!args.detection.faceCentered) {
    score -= 0.25;
    messages.push("Seu rosto precisa estar mais centralizado.");
  }

  if (args.detection.multipleFaces) {
    score -= 0.4;
    messages.push("Detectamos mais de um rosto. Envie uma foto apenas sua.");
  }

  if (!args.detection.faceDetected) {
    score -= 0.5;
  }

  return {
    brightness,
    blur,
    faceCentered: args.detection.faceCentered,
    multipleFaces: args.detection.multipleFaces,
    imageQualityScore: clampUnit(score),
    messages
  };
}

function buildFaceMappingRegions(
  imageData: ImageData | null,
  bounds: NormalizedBox | null,
  quality: FaceImageQuality,
  detectionConfidence: number
): Record<FaceRegionKey, RegionAnalysis> {
  const regions = createEmptyRegions();
  if (!imageData || !bounds) return regions;

  for (const region of FACE_MAPPING_REGION_KEYS) {
    const stats = imageCropStats(imageData, regionBoxFromNormalized(bounds, region));
    regions[region] = {
      ...stats,
      confidence: clampUnit(
        (quality.imageQualityScore * 0.55 + detectionConfidence * 0.45) * (stats.averageBrightness > 0 ? 1 : 0.45)
      )
    };
  }

  const tZone = regions.t_zone;
  const uZone = regions.u_zone;

  regions.t_zone = {
    averageBrightness: clampUnit((regions.forehead.averageBrightness + regions.nose.averageBrightness) / 2),
    rednessScore: clampUnit((regions.forehead.rednessScore + regions.nose.rednessScore) / 2),
    darkSpotScore: clampUnit((regions.forehead.darkSpotScore + regions.nose.darkSpotScore) / 2),
    textureScore: clampUnit((regions.forehead.textureScore + regions.nose.textureScore) / 2),
    shineScore: clampUnit((regions.forehead.shineScore + regions.nose.shineScore) / 2),
    poreVisibilityScore: clampUnit((regions.forehead.poreVisibilityScore + regions.nose.poreVisibilityScore) / 2),
    confidence: clampUnit((tZone.confidence + regions.forehead.confidence + regions.nose.confidence) / 3)
  };

  regions.u_zone = {
    averageBrightness: clampUnit(
      (regions.left_cheek.averageBrightness +
        regions.right_cheek.averageBrightness +
        regions.jawline.averageBrightness +
        regions.chin.averageBrightness) /
        4
    ),
    rednessScore: clampUnit(
      (regions.left_cheek.rednessScore +
        regions.right_cheek.rednessScore +
        regions.jawline.rednessScore +
        regions.chin.rednessScore) /
        4
    ),
    darkSpotScore: clampUnit(
      (regions.left_cheek.darkSpotScore +
        regions.right_cheek.darkSpotScore +
        regions.jawline.darkSpotScore +
        regions.chin.darkSpotScore) /
        4
    ),
    textureScore: clampUnit(
      (regions.left_cheek.textureScore +
        regions.right_cheek.textureScore +
        regions.jawline.textureScore +
        regions.chin.textureScore) /
        4
    ),
    shineScore: clampUnit(
      (regions.left_cheek.shineScore +
        regions.right_cheek.shineScore +
        regions.jawline.shineScore +
        regions.chin.shineScore) /
        4
    ),
    poreVisibilityScore: clampUnit(
      (regions.left_cheek.poreVisibilityScore +
        regions.right_cheek.poreVisibilityScore +
        regions.jawline.poreVisibilityScore +
        regions.chin.poreVisibilityScore) /
        4
    ),
    confidence: clampUnit(
      (uZone.confidence +
        regions.left_cheek.confidence +
        regions.right_cheek.confidence +
        regions.jawline.confidence +
        regions.chin.confidence) /
        5
    )
  };

  return regions;
}

export class MockFaceLandmarkProvider implements FaceLandmarkProvider {
  async detect(): Promise<FaceLandmarkDetectionResult> {
    return {
      faceDetected: false,
      multipleFaces: false,
      faceCentered: false,
      boundingBox: null,
      confidence: 0,
      imageData: null,
      provider: "mock"
    };
  }
}

export class BrowserFaceLandmarkProvider implements FaceLandmarkProvider {
  async detect(input: FaceMappingInput): Promise<FaceLandmarkDetectionResult> {
    const externalProvider = (
      globalThis as typeof globalThis & {
        __BELAPOP_FACE_LANDMARK_PROVIDER__?: FaceLandmarkProvider;
      }
    ).__BELAPOP_FACE_LANDMARK_PROVIDER__;

    if (externalProvider?.detect) {
      const externalResult = await externalProvider.detect(input);
      return {
        ...externalResult,
        provider: "external"
      };
    }

    const rasterized = await rasterizeFaceMappingInput(input);
    if (!rasterized) {
      throw new Error("Não foi possivel preparar a imagem para leitura facial.");
    }

    return buildDetectionFromRaster(rasterized.imageData);
  }
}

export class FaceMappingService {
  constructor(
    private readonly provider: FaceLandmarkProvider = new BrowserFaceLandmarkProvider(),
    private readonly fallbackProvider: FaceLandmarkProvider = new MockFaceLandmarkProvider()
  ) {}

  async analyzeImage(input: FaceMappingInput): Promise<FaceMappingResult> {
    let detection: FaceLandmarkDetectionResult;

    try {
      detection = await this.provider.detect(input);
    } catch (error) {
      if (!input.allowMock) {
        throw error;
      }

      detection = await this.fallbackProvider.detect(input);
    }

    const rasterized = detection.imageData ?? (await rasterizeFaceMappingInput(input))?.imageData ?? null;
    const globalBrightness = rasterized
      ? clampUnit(
          rasterized.data.reduce((sum, _, index, data) => {
            if (index % 4 !== 0) return sum;
            return sum + toLuma(data[index], data[index + 1], data[index + 2]) / 255;
          }, 0) / Math.max(1, rasterized.width * rasterized.height)
        )
      : 0;
    const blurEdgeScore = rasterized ? computeBlurScore(rasterized) : 0;
    const quality = buildQuality({
      detection,
      globalBrightness,
      blurEdgeScore
    });

    return {
      faceDetected: detection.faceDetected,
      quality: detection.provider === "mock" && !rasterized ? EMPTY_QUALITY : quality,
      regions: buildFaceMappingRegions(rasterized, detection.boundingBox, quality, detection.confidence)
    };
  }
}
