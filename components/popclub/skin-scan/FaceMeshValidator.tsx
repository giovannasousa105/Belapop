"use client";

import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import type { FaceLandmarker } from "@mediapipe/tasks-vision";

import {
  detectFace,
  getCaptureReadiness,
  getFaceAlignment,
  getFaceBounds,
  getFaceDistance,
  getLightingQuality,
  getStabilityScore,
  type CaptureCheckStatus,
  type FaceCaptureGuideState,
  type FaceDistanceState,
  type FaceMeasurement
} from "@/lib/skincare/faceCaptureReadiness";

type FaceMeshValidatorProps = {
  enabled: boolean;
  videoRef: RefObject<HTMLVideoElement | null>;
  onValidationChange: (state: FaceMeshValidationState) => void;
  analysisThrottleMs?: number;
};

export type FaceMeshValidationState = {
  faceDetected: boolean;
  multipleFaces: boolean;
  faceCentered: boolean;
  distanceOk: boolean;
  frontalAngleOk: boolean;
  insideGuide: boolean;
  lightingOk: boolean;
  stableFace: boolean;
  tooDark: boolean;
  tooBright: boolean;
  unevenLight: boolean;
  distanceState: FaceDistanceState;
  message: string;
  canAutoCapture: boolean;
  guideState: FaceCaptureGuideState;
  faceStatus: CaptureCheckStatus;
  distanceStatus: CaptureCheckStatus;
  lightingStatus: CaptureCheckStatus;
  stabilityStatus: CaptureCheckStatus;
  meshPoints: Array<{ x: number; y: number }>;
};

const FACE_LANDMARK_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const FACE_LANDMARK_WASM_BASE =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";

export const initialFaceMeshValidationState: FaceMeshValidationState = {
  faceDetected: false,
  multipleFaces: false,
  faceCentered: false,
  distanceOk: false,
  frontalAngleOk: false,
  insideGuide: false,
  lightingOk: false,
  stableFace: false,
  tooDark: false,
  tooBright: false,
  unevenLight: false,
  distanceState: "unknown",
  message: "Posicione seu rosto na area",
  canAutoCapture: false,
  guideState: "idle",
  faceStatus: "pending",
  distanceStatus: "pending",
  lightingStatus: "pending",
  stabilityStatus: "pending",
  meshPoints: []
};

let faceLandmarkerPromise: Promise<FaceLandmarker | null> | null = null;

async function loadFaceLandmarker() {
  if (!faceLandmarkerPromise) {
    faceLandmarkerPromise = (async () => {
      const vision = await import("@mediapipe/tasks-vision");
      const fileset = await vision.FilesetResolver.forVisionTasks(FACE_LANDMARK_WASM_BASE);

      return vision.FaceLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath: FACE_LANDMARK_MODEL_URL
        },
        runningMode: "VIDEO",
        numFaces: 2,
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: true
      });
    })().catch(() => {
      faceLandmarkerPromise = null;
      return null;
    });
  }

  return faceLandmarkerPromise;
}

function createMessage(args: {
  faceDetected: boolean;
  multipleFaces: boolean;
  faceCentered: boolean;
  distanceState: FaceDistanceState;
  frontalAngleOk: boolean;
  lightingOk: boolean;
  stableFace: boolean;
  tooDark: boolean;
}) {
  if (!args.faceDetected) return "Posicione seu rosto na area";
  if (args.multipleFaces) return "Mostre apenas o seu rosto";
  if (args.distanceState === "too_close") return "Afaste um pouco o rosto";
  if (args.distanceState === "too_far") return "Aproxime um pouco o rosto";
  if (!args.faceCentered || !args.frontalAngleOk) return "Centralize seu rosto";
  if (!args.lightingOk || args.tooDark) return "Melhore a iluminacao";
  if (!args.stableFace) return "Mantenha-se estavel";
  return "Perfeito - capturando em 2s";
}

function selectMeshPoints(landmarks: Array<{ x: number; y: number }>) {
  const indexes = [10, 33, 133, 263, 362, 1, 61, 291, 199, 234, 454, 152];
  return indexes
    .map((index) => landmarks[index])
    .filter((point): point is { x: number; y: number } => Boolean(point))
    .map((point) => ({ x: point.x, y: point.y }));
}

export default function FaceMeshValidator({
  enabled,
  videoRef,
  onValidationChange,
  analysisThrottleMs = 150
}: FaceMeshValidatorProps) {
  const callbackRef = useRef(onValidationChange);
  const previousMeasurementRef = useRef<FaceMeasurement | null>(null);
  const stableFramesRef = useRef(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    callbackRef.current = onValidationChange;
  }, [onValidationChange]);

  useEffect(() => {
    if (!enabled) {
      callbackRef.current(initialFaceMeshValidationState);
      return;
    }

    let isDisposed = false;
    let frameId = 0;
    let lastAnalyzedAt = 0;

    const run = async () => {
      const faceLandmarker = await loadFaceLandmarker();

      if (!faceLandmarker || isDisposed) {
        callbackRef.current({
          ...initialFaceMeshValidationState,
          guideState: "error",
          message: "Não foi possível preparar a leitura facial"
        });
        return;
      }

      if (!canvasRef.current && typeof document !== "undefined") {
        canvasRef.current = document.createElement("canvas");
      }

      const tick = () => {
        if (isDisposed) return;

        const video = videoRef.current;
        if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
          frameId = window.requestAnimationFrame(tick);
          return;
        }

        const now = performance.now();
        if (now - lastAnalyzedAt < analysisThrottleMs) {
          frameId = window.requestAnimationFrame(tick);
          return;
        }
        lastAnalyzedAt = now;

        const detection = faceLandmarker.detectForVideo(video, now);
        const face = detectFace(detection.faceLandmarks);

        if (!face.landmarks) {
          stableFramesRef.current = 0;
          previousMeasurementRef.current = null;
          callbackRef.current(initialFaceMeshValidationState);
          frameId = window.requestAnimationFrame(tick);
          return;
        }

        const alignment = getFaceAlignment(face.landmarks);
        const bounds = getFaceBounds(face.landmarks);
        const distance = getFaceDistance(alignment.measurement);
        const stability = getStabilityScore(
          alignment.measurement,
          previousMeasurementRef.current
        );
        stableFramesRef.current = stability.stable ? stableFramesRef.current + 1 : 0;
        previousMeasurementRef.current = alignment.measurement;

        const lighting = getLightingQuality(
          video,
          canvasRef.current as HTMLCanvasElement,
          bounds
        );
        const stableFace = stableFramesRef.current >= 4;
        const readiness = getCaptureReadiness({
          faceDetected: face.faceDetected,
          multipleFaces: face.multipleFaces,
          faceCentered: alignment.faceCentered,
          distanceOk: distance.distanceOk,
          frontalAngleOk: alignment.frontalAngleOk,
          insideGuide: alignment.insideGuide,
          lightingOk: lighting.lightingOk,
          stableFace
        });

        callbackRef.current({
          faceDetected: face.faceDetected,
          multipleFaces: face.multipleFaces,
          faceCentered: alignment.faceCentered,
          distanceOk: distance.distanceOk,
          frontalAngleOk: alignment.frontalAngleOk,
          insideGuide: alignment.insideGuide,
          lightingOk: lighting.lightingOk,
          stableFace,
          tooDark: lighting.tooDark,
          tooBright: lighting.tooBright,
          unevenLight: lighting.unevenLight,
          distanceState: distance.distanceState,
          message: createMessage({
            faceDetected: face.faceDetected,
            multipleFaces: face.multipleFaces,
            faceCentered: alignment.faceCentered && alignment.insideGuide,
            distanceState: distance.distanceState,
            frontalAngleOk: alignment.frontalAngleOk,
            lightingOk: lighting.lightingOk,
            stableFace,
            tooDark: lighting.tooDark
          }),
          canAutoCapture: readiness.canCapture,
          guideState: readiness.guideState,
          faceStatus: readiness.faceStatus,
          distanceStatus: readiness.distanceStatus,
          lightingStatus: readiness.lightingStatus,
          stabilityStatus: readiness.stabilityStatus,
          meshPoints: selectMeshPoints(face.landmarks)
        });

        frameId = window.requestAnimationFrame(tick);
      };

      frameId = window.requestAnimationFrame(tick);
    };

    void run();

    return () => {
      isDisposed = true;
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [analysisThrottleMs, enabled, videoRef]);

  return null;
}
