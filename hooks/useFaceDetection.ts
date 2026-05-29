"use client";

import { useEffect, useRef, useCallback, useState } from "react";

// MediaPipe FaceMesh 468-landmark indices by facial zone
const ZONE_INDICES = {
  TESTA: [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109],
  NARIZ: [1, 2, 98, 327, 168, 6, 197, 195, 5, 4, 45, 275, 220, 440, 94],
  BOCHECHA_E: [117, 118, 119, 120, 121, 47, 126, 142, 36, 205, 187, 123, 116, 143, 156, 70, 63, 105, 66, 107],
  BOCHECHA_D: [346, 347, 348, 349, 350, 277, 355, 371, 266, 425, 411, 352, 345, 372, 383, 300, 293, 334, 296, 336],
  OLHO_E: [33, 7, 163, 144, 145, 153, 154, 155, 133, 246, 161, 160, 159, 158, 157, 173],
  OLHO_D: [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398],
} as const;

export interface FaceQuality {
  faceDetected: boolean;
  centered: boolean;
  tooClose: boolean;
  tooFar: boolean;
  lightingOk: boolean;
  stable: boolean;
  score: number;
  guidance: string;
}

export function useFaceDetection(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  active: boolean
) {
  const [quality, setQuality] = useState<FaceQuality>({
    faceDetected: false,
    centered: false,
    tooClose: false,
    tooFar: false,
    lightingOk: false,
    stable: false,
    score: 0,
    guidance: "Posicione o rosto no oval",
  });
  const [readyToCapture, setReadyToCapture] = useState(false);
  const [stableSeconds, setStableSeconds] = useState(0);
  const [isModelLoading, setIsModelLoading] = useState(false);

  const landmarkerRef = useRef<import("@mediapipe/tasks-vision").FaceLandmarker | null>(null);
  const animFrameRef = useRef<number>(0);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const stableStartRef = useRef<number | null>(null);
  const loadingRef = useRef(false);
  // Tiny canvas for luminance sampling (reused across frames)
  const lumCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const initLandmarker = useCallback(async () => {
    if (landmarkerRef.current || loadingRef.current) return;
    loadingRef.current = true;
    setIsModelLoading(true);

    try {
      const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
      const filesetResolver = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );

      // Tenta GPU primeiro; se falhar (WebGL indisponível), usa CPU como fallback.
      // Evita que o modelo não carregue em ambientes sem aceleração de hardware.
      for (const delegate of ["GPU", "CPU"] as const) {
        try {
          landmarkerRef.current = await FaceLandmarker.createFromOptions(filesetResolver, {
            baseOptions: {
              modelAssetPath:
                "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
              delegate,
            },
            outputFaceBlendshapes: false,
            outputFacialTransformationMatrixes: false,
            runningMode: "VIDEO",
            numFaces: 1,
          });
          break; // Sucesso — sair do loop
        } catch (delegateErr) {
          if (delegate === "GPU") {
            console.warn("[useFaceDetection] GPU delegate falhou, usando CPU como fallback.", delegateErr);
          } else {
            throw delegateErr; // CPU também falhou — propagar para o catch externo
          }
        }
      }
    } catch (err) {
      console.warn("[useFaceDetection] MediaPipe failed to load:", err);
      // Câmera continua funcional; detecção facial fica inativa.
    } finally {
      loadingRef.current = false;
      setIsModelLoading(false);
    }
  }, []);

  const runDetection = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const landmarker = landmarkerRef.current;

    if (!video || !canvas || !landmarker || !active) return;
    if (video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(runDetection);
      return;
    }

    // Sync canvas dimensions with video
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Detect landmarks
    let result: import("@mediapipe/tasks-vision").FaceLandmarkerResult | null = null;
    try {
      result = landmarker.detectForVideo(video, performance.now());
    } catch {
      animFrameRef.current = requestAnimationFrame(runDetection);
      return;
    }

    const landmarks = result?.faceLandmarks?.[0];

    if (!landmarks || landmarks.length === 0) {
      drawOval(ctx, W, H, 0);
      setQuality((q) => ({ ...q, faceDetected: false, score: 0, guidance: "Posicione o rosto no oval" }));
      setReadyToCapture(false);
      lastPosRef.current = null;
      stableStartRef.current = null;
      setStableSeconds(0);
      animFrameRef.current = requestAnimationFrame(runDetection);
      return;
    }

    const xs = landmarks.map((l) => l.x * W);
    const ys = landmarks.map((l) => l.y * H);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const faceW = maxX - minX;
    const faceH = maxY - minY;
    const faceCX = (minX + maxX) / 2;
    const faceCY = (minY + maxY) / 2;

    const centered =
      Math.abs(faceCX - W / 2) < W * 0.13 &&
      Math.abs(faceCY - H / 2) < H * 0.13;
    const faceArea = (faceW * faceH) / (W * H);
    const tooClose = faceArea > 0.6;
    const tooFar = faceArea < 0.1;

    // Luminance via tiny reusable offscreen canvas
    if (!lumCanvasRef.current) {
      lumCanvasRef.current = document.createElement("canvas");
      lumCanvasRef.current.width = 64;
      lumCanvasRef.current.height = 64;
    }
    const lumCtx = lumCanvasRef.current.getContext("2d");
    let avgLuminance = 120;
    if (lumCtx) {
      lumCtx.drawImage(video, 0, 0, 64, 64);
      const imgData = lumCtx.getImageData(0, 0, 64, 64);
      let total = 0;
      for (let i = 0; i < imgData.data.length; i += 4) {
        total += 0.299 * imgData.data[i] + 0.587 * imgData.data[i + 1] + 0.114 * imgData.data[i + 2];
      }
      avgLuminance = total / (imgData.data.length / 4);
    }
    const lightingOk = avgLuminance > 55 && avgLuminance < 220;

    // Stability tracking
    const currentPos = { x: faceCX, y: faceCY };
    let stable = false;
    let stableSec = 0;
    if (lastPosRef.current) {
      const movement = Math.sqrt(
        (currentPos.x - lastPosRef.current.x) ** 2 +
          (currentPos.y - lastPosRef.current.y) ** 2
      );
      if (movement < W * 0.025) {
        if (!stableStartRef.current) stableStartRef.current = Date.now();
        const stableMs = Date.now() - stableStartRef.current;
        stable = stableMs > 1500;
        stableSec = Math.min(3, Math.floor(stableMs / 1000));
      } else {
        stableStartRef.current = null;
      }
    }
    lastPosRef.current = currentPos;
    setStableSeconds(stableSec);

    // Quality score
    let score = 0;
    if (centered) score += 35;
    if (!tooClose && !tooFar) score += 25;
    if (lightingOk) score += 25;
    if (stable) score += 15;

    // Guidance text
    let guidance = "";
    if (!centered) {
      guidance =
        faceCX < W / 2 ? "← Mova para a direita" : "Mova para a esquerda →";
    } else if (tooClose) {
      guidance = "Afaste um pouco o rosto";
    } else if (tooFar) {
      guidance = "Aproxime o rosto da câmera";
    } else if (!lightingOk) {
      guidance = avgLuminance < 55 ? "☀️ Ambiente muito escuro" : "Reduza a luz atrás de você";
    } else if (!stable) {
      guidance = "Fique parada...";
    } else {
      guidance = "✓ Perfeito! Capturando...";
    }

    const isReady = centered && !tooClose && !tooFar && lightingOk && stable;
    setQuality({ faceDetected: true, centered, tooClose, tooFar, lightingOk, stable, score, guidance });
    setReadyToCapture(isReady);

    // Draw analysis zones
    const safePoints = (indices: readonly number[]) =>
      indices
        .filter((i) => i < landmarks.length && landmarks[i])
        .map((i) => ({ x: landmarks[i].x * W, y: landmarks[i].y * H }));

    // Zona T — testa (pink)
    drawZone(ctx, safePoints(ZONE_INDICES.TESTA), "rgba(255,160,180,0.30)", "rgba(255,90,120,0.75)", 1.5);
    // Zona T — nariz (pink more intense)
    drawZone(ctx, safePoints(ZONE_INDICES.NARIZ), "rgba(255,140,165,0.35)", "rgba(240,70,100,0.85)", 1.5);
    // Bochechas (lavender)
    drawZone(ctx, safePoints(ZONE_INDICES.BOCHECHA_E), "rgba(190,165,255,0.30)", "rgba(130,90,240,0.75)", 1.5);
    drawZone(ctx, safePoints(ZONE_INDICES.BOCHECHA_D), "rgba(190,165,255,0.30)", "rgba(130,90,240,0.75)", 1.5);
    // Olhos (sky blue)
    drawZone(ctx, safePoints(ZONE_INDICES.OLHO_E), "rgba(160,210,255,0.35)", "rgba(60,150,255,0.85)", 1.0);
    drawZone(ctx, safePoints(ZONE_INDICES.OLHO_D), "rgba(160,210,255,0.35)", "rgba(60,150,255,0.85)", 1.0);

    // Oval guide
    drawOval(ctx, W, H, score);

    animFrameRef.current = requestAnimationFrame(runDetection);
  }, [videoRef, canvasRef, active]);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    initLandmarker().then(() => {
      if (!cancelled) {
        animFrameRef.current = requestAnimationFrame(runDetection);
      }
    });

    return () => {
      cancelled = true;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [active, initLandmarker, runDetection]);

  return { quality, readyToCapture, stableSeconds, isModelLoading };
}

// ── Drawing helpers ────────────────────────────────────────────────────────────

function drawZone(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
  fill: string,
  stroke: string,
  lineWidth: number
) {
  if (points.length < 3) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

function drawOval(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  score: number
) {
  const color =
    score > 80 ? "#4ade80" : score > 50 ? "#fbbf24" : "rgba(248,113,113,0.8)";
  ctx.beginPath();
  ctx.ellipse(W / 2, H / 2, W * 0.28, H * 0.42, 0, 0, Math.PI * 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.setLineDash(score > 80 ? [] : [12, 6]);
  ctx.stroke();
  ctx.setLineDash([]);
}
