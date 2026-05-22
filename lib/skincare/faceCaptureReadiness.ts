export type FaceCaptureGuideState = "idle" | "searching" | "error" | "ready";

export type CaptureCheckStatus = "pending" | "error" | "ok";

export type FaceDistanceState = "unknown" | "too_close" | "too_far" | "ok";

export type FaceCaptureLandmark = {
  x: number;
  y: number;
  z?: number;
};

export type FaceBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type FaceMeasurement = {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  noseX: number;
  noseY: number;
};

export type FaceAlignmentResult = {
  faceCentered: boolean;
  frontalAngleOk: boolean;
  insideGuide: boolean;
  measurement: FaceMeasurement;
};

export type FaceLightingQuality = {
  lightingOk: boolean;
  tooDark: boolean;
  tooBright: boolean;
  unevenLight: boolean;
  average: number;
};

export type CaptureReadinessInput = {
  faceDetected: boolean;
  multipleFaces: boolean;
  faceCentered: boolean;
  distanceOk: boolean;
  frontalAngleOk: boolean;
  insideGuide: boolean;
  lightingOk: boolean;
  stableFace: boolean;
};

export type CaptureReadinessResult = {
  canCapture: boolean;
  guideState: FaceCaptureGuideState;
  faceStatus: CaptureCheckStatus;
  distanceStatus: CaptureCheckStatus;
  lightingStatus: CaptureCheckStatus;
  stabilityStatus: CaptureCheckStatus;
};

export function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

export function detectFace(faceLandmarks: FaceCaptureLandmark[][] | null | undefined) {
  const faces = faceLandmarks ?? [];
  return {
    faceDetected: faces.length > 0,
    multipleFaces: faces.length > 1,
    landmarks: faces[0] ?? null
  };
}

export function getFaceBounds(landmarks: FaceCaptureLandmark[]): FaceBounds {
  let minX = 1;
  let minY = 1;
  let maxX = 0;
  let maxY = 0;

  for (const landmark of landmarks) {
    minX = Math.min(minX, landmark.x);
    minY = Math.min(minY, landmark.y);
    maxX = Math.max(maxX, landmark.x);
    maxY = Math.max(maxY, landmark.y);
  }

  return {
    x: clamp(minX),
    y: clamp(minY),
    width: clamp(maxX - minX),
    height: clamp(maxY - minY)
  };
}

function isInsideEllipse(
  x: number,
  y: number,
  centerX: number,
  centerY: number,
  radiusX: number,
  radiusY: number
) {
  const normalized =
    ((x - centerX) * (x - centerX)) / (radiusX * radiusX) +
    ((y - centerY) * (y - centerY)) / (radiusY * radiusY);

  return normalized <= 1;
}

export function getFaceAlignment(landmarks: FaceCaptureLandmark[]): FaceAlignmentResult {
  const bounds = getFaceBounds(landmarks);
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;
  const nose = landmarks[1] ?? { x: centerX, y: centerY };
  const leftEye = landmarks[33];
  const rightEye = landmarks[263];
  const mouthLeft = landmarks[61];
  const mouthRight = landmarks[291];

  const insideGuide =
    isInsideEllipse(centerX, centerY, 0.5, 0.48, 0.34, 0.36) &&
    isInsideEllipse(centerX, bounds.y, 0.5, 0.48, 0.34, 0.36) &&
    isInsideEllipse(centerX, bounds.y + bounds.height, 0.5, 0.48, 0.34, 0.36);

  const faceCentered = Math.abs(centerX - 0.5) <= 0.09 && Math.abs(centerY - 0.48) <= 0.12;
  let frontalAngleOk = false;

  if (leftEye && rightEye && nose && mouthLeft && mouthRight) {
    const eyeDistance = Math.max(0.001, Math.abs(rightEye.x - leftEye.x));
    const eyeLevelDelta = Math.abs(leftEye.y - rightEye.y);
    const mouthLevelDelta = Math.abs(mouthLeft.y - mouthRight.y);
    const eyeMidX = (leftEye.x + rightEye.x) / 2;
    const noseOffset = Math.abs(nose.x - eyeMidX) / eyeDistance;
    frontalAngleOk = eyeLevelDelta < 0.035 && mouthLevelDelta < 0.04 && noseOffset < 0.18;
  }

  return {
    faceCentered,
    frontalAngleOk,
    insideGuide,
    measurement: {
      centerX,
      centerY,
      width: bounds.width,
      height: bounds.height,
      noseX: nose.x,
      noseY: nose.y
    }
  };
}

export function getFaceDistance(measurement: Pick<FaceMeasurement, "height">): {
  distanceOk: boolean;
  distanceState: FaceDistanceState;
} {
  if (measurement.height < 0.34) {
    return { distanceOk: false, distanceState: "too_far" };
  }

  if (measurement.height > 0.74) {
    return { distanceOk: false, distanceState: "too_close" };
  }

  return { distanceOk: true, distanceState: "ok" };
}

export function getLightingQuality(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  bounds: FaceBounds
): FaceLightingQuality {
  const width = Math.max(1, video.videoWidth);
  const height = Math.max(1, video.videoHeight);
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    return {
      lightingOk: false,
      tooDark: false,
      tooBright: false,
      unevenLight: true,
      average: 0
    };
  }

  context.drawImage(video, 0, 0, width, height);

  const cropX = Math.max(0, Math.floor(bounds.x * width));
  const cropY = Math.max(0, Math.floor(bounds.y * height));
  const cropWidth = Math.max(1, Math.floor(bounds.width * width));
  const cropHeight = Math.max(1, Math.floor(bounds.height * height));
  const imageData = context.getImageData(cropX, cropY, cropWidth, cropHeight);

  let total = 0;
  let leftTotal = 0;
  let rightTotal = 0;
  let topTotal = 0;
  let bottomTotal = 0;
  let sampleCount = 0;

  for (let y = 0; y < cropHeight; y += 4) {
    for (let x = 0; x < cropWidth; x += 4) {
      const index = (y * cropWidth + x) * 4;
      const r = imageData.data[index];
      const g = imageData.data[index + 1];
      const b = imageData.data[index + 2];
      const brightness = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;

      total += brightness;
      if (x < cropWidth / 2) leftTotal += brightness;
      else rightTotal += brightness;
      if (y < cropHeight / 2) topTotal += brightness;
      else bottomTotal += brightness;
      sampleCount += 1;
    }
  }

  const average = total / Math.max(1, sampleCount);
  const leftAverage = leftTotal / Math.max(1, sampleCount / 2);
  const rightAverage = rightTotal / Math.max(1, sampleCount / 2);
  const topAverage = topTotal / Math.max(1, sampleCount / 2);
  const bottomAverage = bottomTotal / Math.max(1, sampleCount / 2);
  const tooDark = average < 0.28;
  const tooBright = average > 0.86;
  const unevenLight =
    Math.abs(leftAverage - rightAverage) > 0.2 || Math.abs(topAverage - bottomAverage) > 0.2;

  return {
    lightingOk: !tooDark && !tooBright && !unevenLight,
    tooDark,
    tooBright,
    unevenLight,
    average
  };
}

export function getStabilityScore(current: FaceMeasurement, previous: FaceMeasurement | null) {
  if (!previous) {
    return {
      stable: false,
      score: 0
    };
  }

  const delta = Math.max(
    Math.abs(current.centerX - previous.centerX),
    Math.abs(current.centerY - previous.centerY),
    Math.abs(current.width - previous.width),
    Math.abs(current.height - previous.height),
    Math.abs(current.noseX - previous.noseX),
    Math.abs(current.noseY - previous.noseY)
  );
  const score = clamp(1 - delta / 0.04);

  return {
    stable: delta < 0.018,
    score
  };
}

export function getCaptureReadiness(input: CaptureReadinessInput): CaptureReadinessResult {
  const faceOk = input.faceDetected && !input.multipleFaces && input.faceCentered && input.insideGuide && input.frontalAngleOk;
  const canCapture =
    faceOk &&
    input.distanceOk &&
    input.lightingOk &&
    input.stableFace;

  let guideState: FaceCaptureGuideState = "searching";
  if (!input.faceDetected) guideState = "idle";
  else if (canCapture) guideState = "ready";
  else if (input.multipleFaces || !input.distanceOk || !input.lightingOk) guideState = "error";

  return {
    canCapture,
    guideState,
    faceStatus: input.faceDetected ? (faceOk ? "ok" : "error") : "pending",
    distanceStatus: input.faceDetected ? (input.distanceOk ? "ok" : "error") : "pending",
    lightingStatus: input.faceDetected ? (input.lightingOk ? "ok" : "error") : "pending",
    stabilityStatus: input.faceDetected ? (input.stableFace ? "ok" : "pending") : "pending"
  };
}
