"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import CameraFullScreen from "@/components/popclub/skin-scan/CameraFullScreen";
import ConsentScreen from "@/components/popclub/skin-scan/ConsentScreen";
import FaceGuideOverlay from "@/components/popclub/skin-scan/FaceGuideOverlay";
import FaceMeshValidator, {
  initialFaceMeshValidationState,
  type FaceMeshValidationState
} from "@/components/popclub/skin-scan/FaceMeshValidator";
import RetryCaptureState from "@/components/popclub/skin-scan/RetryCaptureState";
import SkinAnalysisLoading from "@/components/popclub/skin-scan/SkinAnalysisLoading";
import { popClubPaths } from "@/lib/popclub/navigation";
import {
  SKIN_ANALYSIS_SESSION_STORAGE_KEY,
  skinAnalysisApiResponseSchema,
  type SkinAnalysisSession
} from "@/lib/skincare/skinAnalysis";
import {
  captureVideoFrameToFile,
  createImagePreviewDataUrl,
  stopMediaStream
} from "@/lib/skincare/capture";

type SkinScanCaptureProps = {
  closeHref: string;
};

type ScanState =
  | "idle"
  | "permission"
  | "cameraReady"
  | "validating"
  | "holding"
  | "capturing"
  | "analyzing"
  | "result"
  | "retry";

type RetryState = {
  title: string;
  description: string;
  primaryLabel: string;
  secondaryLabel?: string;
};

const AUTO_CAPTURE_HOLD_MS = 2000;

function humanizeCameraError(error: unknown) {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "SecurityError") {
      return "Não conseguimos acessar sua câmera. Verifique a permissão do navegador.";
    }

    if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
      return "Não encontramos uma câmera compatível neste dispositivo.";
    }
  }

  return error instanceof Error
    ? error.message
    : "Não foi possível abrir a câmera agora.";
}

export default function SkinScanCapture({ closeHref }: SkinScanCaptureProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const holdStartedAtRef = useRef<number | null>(null);
  const captureInFlightRef = useRef(false);
  const validationRef = useRef<FaceMeshValidationState>(initialFaceMeshValidationState);
  const capturedImageUrlRef = useRef<string | null>(null);

  const [scanState, setScanState] = useState<ScanState>("idle");
  const [validation, setValidation] = useState<FaceMeshValidationState>(
    initialFaceMeshValidationState
  );
  const [holdProgress, setHoldProgress] = useState(0);
  const [flashActive, setFlashActive] = useState(false);
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null);
  const [retryState, setRetryState] = useState<RetryState | null>(null);
  const [cameraLive, setCameraLive] = useState(false);

  useEffect(() => {
    validationRef.current = validation;
  }, [validation]);

  const releaseStream = useCallback(() => {
    stopMediaStream(streamRef.current);
    streamRef.current = null;
    setCameraLive(false);

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
  }, []);

  const revokeCapturedImage = useCallback(() => {
    if (capturedImageUrlRef.current) {
      URL.revokeObjectURL(capturedImageUrlRef.current);
      capturedImageUrlRef.current = null;
    }
    setCapturedImageUrl(null);
  }, []);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
      releaseStream();
      revokeCapturedImage();
    };
  }, [releaseStream, revokeCapturedImage]);

  const leaveCapture = useCallback(() => {
    releaseStream();
    revokeCapturedImage();
    router.push(closeHref);
  }, [closeHref, releaseStream, revokeCapturedImage, router]);

  const startCamera = useCallback(async () => {
    setRetryState(null);
    setValidation(initialFaceMeshValidationState);
    setHoldProgress(0);
    holdStartedAtRef.current = null;
    captureInFlightRef.current = false;
    sessionStorage.removeItem(SKIN_ANALYSIS_SESSION_STORAGE_KEY);
    setScanState("permission");

    try {
      releaseStream();

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "Seu navegador não suporta captura de câmera. Tente abrir em outro navegador."
        );
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: "user",
          width: { ideal: 1080 },
          height: { ideal: 1440 }
        }
      });

      streamRef.current = stream;
      setCameraLive(true);

      const video = videoRef.current;
      if (!video) {
        throw new Error("Não foi possível preparar o vídeo da câmera.");
      }

      video.srcObject = stream;

      await new Promise<void>((resolve, reject) => {
        if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
          resolve();
          return;
        }

        const onLoaded = () => {
          cleanup();
          resolve();
        };

        const onError = () => {
          cleanup();
          reject(new Error("Não foi possível carregar o vídeo da câmera."));
        };

        const timeoutId = window.setTimeout(() => {
          cleanup();
          reject(new Error("A camera demorou demais para responder."));
        }, 5000);

        const cleanup = () => {
          window.clearTimeout(timeoutId);
          video.removeEventListener("loadedmetadata", onLoaded);
          video.removeEventListener("error", onError);
        };

        video.addEventListener("loadedmetadata", onLoaded, { once: true });
        video.addEventListener("error", onError, { once: true });
      });

      await video.play();
      setScanState("cameraReady");
    } catch (error) {
      releaseStream();
      setRetryState({
        title: "Câmera indisponível agora.",
        description: humanizeCameraError(error),
        primaryLabel: "Tentar novamente",
        secondaryLabel: "Voltar"
      });
      setScanState("retry");
    }
  }, [releaseStream]);

  const handleRetake = useCallback(() => {
    revokeCapturedImage();
    void startCamera();
  }, [revokeCapturedImage, startCamera]);

  const submitAnalysis = useCallback(
    async (file: File) => {
      const formData = new FormData();
      formData.set("image", file);
      formData.set(
        "capture_context",
        JSON.stringify({
          faceDetected: validationRef.current.faceDetected,
          faceCentered: validationRef.current.faceCentered,
          distanceOk: validationRef.current.distanceOk,
          frontalAngleOk: validationRef.current.frontalAngleOk,
          stableFace: validationRef.current.stableFace,
          lightingOk: validationRef.current.lightingOk,
          tooDark: validationRef.current.tooDark,
          tooBright: validationRef.current.tooBright,
          unevenLight: validationRef.current.unevenLight
        })
      );

      const response = await fetch("/api/skin-analysis", {
        method: "POST",
        body: formData,
        credentials: "include"
      });

      const raw = await response.text();
      const payload = raw ? JSON.parse(raw) : null;

      if (!response.ok) {
        throw new Error("Não conseguimos concluir a análise com precisão. Você pode tentar novamente.");
      }

      const parsed = skinAnalysisApiResponseSchema.parse(payload);
      if (!parsed.analysis.imageQuality.canAnalyze) {
        setRetryState({
          title: "A imagem não ficou boa para análise.",
          description:
            "Tente novamente em um ambiente mais iluminado, com o rosto centralizado e sem sombras fortes.",
          primaryLabel: "Refazer captura",
          secondaryLabel: "Voltar"
        });
        setScanState("retry");
        return;
      }

      const previewDataUrl = await createImagePreviewDataUrl(file, {
        maxSide: 720,
        mimeType: "image/jpeg",
        quality: 0.72
      });

      const sessionPayload: SkinAnalysisSession = {
        analysis: parsed.analysis,
        recommendedProducts: parsed.recommendedProducts,
        generatedAt: parsed.generatedAt,
        imagePreviewDataUrl: previewDataUrl
      };

      sessionStorage.setItem(SKIN_ANALYSIS_SESSION_STORAGE_KEY, JSON.stringify(sessionPayload));
      router.push(popClubPaths.skinScanResult);
    },
    [router]
  );

  const captureAndAnalyze = useCallback(async () => {
    if (captureInFlightRef.current || !videoRef.current) return;

    captureInFlightRef.current = true;
    holdStartedAtRef.current = null;
    setHoldProgress(1);
    setScanState("capturing");

    try {
      const file = await captureVideoFrameToFile(videoRef.current, {
        fileName: "skin-scan-capture.jpg",
        mimeType: "image/jpeg",
        quality: 0.92
      });

      revokeCapturedImage();
      const nextUrl = URL.createObjectURL(file);
      capturedImageUrlRef.current = nextUrl;
      setCapturedImageUrl(nextUrl);
      setFlashActive(true);
      window.setTimeout(() => setFlashActive(false), 220);

      releaseStream();
      setScanState("analyzing");
      await submitAnalysis(file);
    } catch (error) {
      setRetryState({
        title: "Não conseguimos concluir a captura.",
        description:
          error instanceof Error
            ? error.message
            : "Você pode tentar novamente com outra captura.",
        primaryLabel: "Refazer captura",
        secondaryLabel: "Voltar"
      });
      setScanState("retry");
    } finally {
      captureInFlightRef.current = false;
    }
  }, [releaseStream, revokeCapturedImage, submitAnalysis]);

  useEffect(() => {
    if (!streamRef.current) return;
    if (
      scanState === "capturing" ||
      scanState === "analyzing" ||
      scanState === "result" ||
      scanState === "retry"
    ) {
      return;
    }

    if (!validation.canAutoCapture) {
      holdStartedAtRef.current = null;
      setHoldProgress((current) => (current === 0 ? current : 0));
      if (scanState !== "permission" && scanState !== "validating") {
        setScanState("validating");
      }
      return;
    }

    if (scanState !== "holding") {
      setScanState("holding");
    }

    const startedAt = holdStartedAtRef.current ?? performance.now();
    holdStartedAtRef.current = startedAt;
    let frameId = 0;

    const tick = (now: number) => {
      if (!validationRef.current.canAutoCapture) return;

      const nextProgress = Math.min(1, (now - startedAt) / AUTO_CAPTURE_HOLD_MS);
      setHoldProgress(nextProgress);

      if (nextProgress >= 1) {
        void captureAndAnalyze();
        return;
      }

      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [captureAndAnalyze, scanState, validation.canAutoCapture]);

  const handleValidationChange = useCallback(
    (nextState: FaceMeshValidationState) => {
      setValidation(nextState);
      if (scanState === "cameraReady" || scanState === "validating" || scanState === "holding") {
        if (!nextState.canAutoCapture) {
          setScanState("validating");
        }
      }
    },
    [scanState]
  );

  const countdownLabel = useMemo(() => {
    if (!validation.canAutoCapture || scanState !== "holding") return null;
    const remaining = Math.max(1, Math.ceil((1 - holdProgress) * 2));
    return `Capturando em ${remaining}...`;
  }, [holdProgress, scanState, validation.canAutoCapture]);

  if (scanState === "idle") {
    return <ConsentScreen onContinue={() => void startCamera()} onBack={leaveCapture} />;
  }

  if (scanState === "retry" && retryState) {
    return (
      <RetryCaptureState
        eyebrow="Skin Scan BelaPop"
        title={retryState.title}
        description={retryState.description}
        primaryLabel={retryState.primaryLabel}
        secondaryLabel={retryState.secondaryLabel}
        onPrimary={handleRetake}
        onSecondary={leaveCapture}
      />
    );
  }

  if (scanState === "analyzing" && capturedImageUrl) {
    return <SkinAnalysisLoading imageUrl={capturedImageUrl} />;
  }

  return (
    <>
      <CameraFullScreen videoRef={videoRef} />
      <FaceMeshValidator
        enabled={cameraLive}
        videoRef={videoRef}
        onValidationChange={handleValidationChange}
      />
      <FaceGuideOverlay
        instruction={
          scanState === "permission"
            ? "Aguardando acesso a camera"
            : scanState === "capturing"
              ? "Capturando..."
              : validation.message
        }
        onBack={leaveCapture}
        onManualCapture={() => void captureAndAnalyze()}
        manualCaptureDisabled={
          scanState === "permission" || scanState === "capturing" || scanState === "analyzing"
        }
        holdProgress={holdProgress}
        validation={validation}
        countdownLabel={countdownLabel}
        flashActive={flashActive}
      />
    </>
  );
}
