"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Camera, ImageUp, RefreshCcw, Sparkles } from "lucide-react";

import {
  captureVideoFrameToFile,
  FACE_SHIELD_GUIDED_STEPS,
  stopMediaStream,
  type FaceShieldFrameField,
  type FaceShieldFrameFiles
} from "@/lib/skincare/capture";

type CapturedStepState = {
  file: File | null;
  previewUrl: string | null;
};

type Props = {
  disabled?: boolean;
  submitError?: string | null;
  onBack: () => void;
  onSubmit: (payload: { files: FaceShieldFrameFiles; captureMode: "guided_camera" }) => Promise<void>;
  onChooseUpload: () => void;
  onChooseQuiz: () => void;
};

const initialCaptureState = (): Record<FaceShieldFrameField, CapturedStepState> => ({
  neutral_frame: { file: null, previewUrl: null },
  blink_frame: { file: null, previewUrl: null },
  smile_frame: { file: null, previewUrl: null },
  frown_frame: { file: null, previewUrl: null },
  turn_frame: { file: null, previewUrl: null }
});

function normalizeCameraError(error: unknown) {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "SecurityError") {
      return {
        permissionDenied: true,
        message:
          "Não conseguimos acessar sua câmera. Você pode permitir o acesso nas configuracoes do navegador ou enviar uma foto."
      };
    }

    if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
      return {
        permissionDenied: false,
        message: "Nenhuma câmera compatível foi encontrada neste dispositivo."
      };
    }
  }

  return {
    permissionDenied: false,
    message: error instanceof Error ? error.message : "Não foi possível abrir a câmera agora."
  };
}

export default function SkinScanCameraCapture({
  disabled = false,
  submitError,
  onBack,
  onSubmit,
  onChooseUpload,
  onChooseQuiz
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const capturesRef = useRef<Record<FaceShieldFrameField, CapturedStepState>>(initialCaptureState());

  const [cameraReady, setCameraReady] = useState(false);
  const [startingCamera, setStartingCamera] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [captures, setCaptures] = useState<Record<FaceShieldFrameField, CapturedStepState>>(initialCaptureState);

  const activeStep = FACE_SHIELD_GUIDED_STEPS[activeIndex] ?? FACE_SHIELD_GUIDED_STEPS[0];
  const completedCount = useMemo(
    () => FACE_SHIELD_GUIDED_STEPS.filter((step) => captures[step.field].file).length,
    [captures]
  );
  const allStepsCaptured = completedCount === FACE_SHIELD_GUIDED_STEPS.length;

  const releaseStream = useCallback(() => {
    stopMediaStream(streamRef.current);
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    setCameraReady(false);
  }, []);

  useEffect(() => {
    capturesRef.current = captures;
  }, [captures]);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
      for (const step of FACE_SHIELD_GUIDED_STEPS) {
        const previewUrl = capturesRef.current[step.field].previewUrl;
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
      }
      releaseStream();
    };
  }, [releaseStream]);

  const startCamera = useCallback(async () => {
    setStartingCamera(true);
    setPermissionDenied(false);
    setCameraError(null);

    try {
      releaseStream();

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Seu navegador não liberou acesso à câmera.");
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

      const video = videoRef.current;
      if (!video) {
        throw new Error("Não foi possível preparar o player da câmera.");
      }

      video.srcObject = stream;
      await new Promise<void>((resolve, reject) => {
        if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
          resolve();
          return;
        }

        const handleLoadedMetadata = () => {
          cleanup();
          resolve();
        };

        const handleError = () => {
          cleanup();
          reject(new Error("Não foi possível carregar o vídeo da câmera."));
        };

        const timeoutId = window.setTimeout(() => {
          cleanup();
          reject(new Error("A câmera abriu, mas o vídeo demorou demais para carregar."));
        }, 5000);

        const cleanup = () => {
          window.clearTimeout(timeoutId);
          video.removeEventListener("loadedmetadata", handleLoadedMetadata);
          video.removeEventListener("error", handleError);
        };

        video.addEventListener("loadedmetadata", handleLoadedMetadata, { once: true });
        video.addEventListener("error", handleError, { once: true });
      });
      await video.play();

      setCameraReady(true);
    } catch (error) {
      const normalized = normalizeCameraError(error);
      setPermissionDenied(normalized.permissionDenied);
      setCameraError(normalized.message);
      releaseStream();
    } finally {
      setStartingCamera(false);
    }
  }, [releaseStream]);

  useEffect(() => {
    void startCamera();
  }, [startCamera]);

  const handleCapture = useCallback(async () => {
    if (!videoRef.current) {
      setCameraError("A câmera ainda não foi inicializada.");
      return;
    }

    setCameraError(null);

    try {
      const file = await captureVideoFrameToFile(videoRef.current, {
        fileName: `${activeStep.field}.jpg`,
        mimeType: "image/jpeg",
        quality: 0.92
      });

      setCaptures((current) => {
        const previousUrl = current[activeStep.field].previewUrl;
        if (previousUrl) {
          URL.revokeObjectURL(previousUrl);
        }

        return {
          ...current,
          [activeStep.field]: {
            file,
            previewUrl: URL.createObjectURL(file)
          }
        };
      });

      setActiveIndex((current) => Math.min(current + 1, FACE_SHIELD_GUIDED_STEPS.length - 1));
    } catch (error) {
      setCameraError(error instanceof Error ? error.message : "Não foi possível capturar a foto.");
    }
  }, [activeStep.field]);

  const handleSubmit = useCallback(async () => {
    const files = FACE_SHIELD_GUIDED_STEPS.reduce<Partial<FaceShieldFrameFiles>>((acc, step) => {
      const file = captures[step.field].file;
      if (file) {
        acc[step.field] = file;
      }
      return acc;
    }, {});

    if (!allStepsCaptured) {
      setCameraError("Capture as cinco etapas antes de continuar.");
      return;
    }

    await onSubmit({
      files: files as FaceShieldFrameFiles,
      captureMode: "guided_camera"
    });
  }, [allStepsCaptured, captures, onSubmit]);

  if (permissionDenied) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-10 text-white">
        <div className="rounded-[32px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-8 shadow-[0_28px_90px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <p className="text-[11px] uppercase tracking-[0.28em] text-white/50">Acesso à câmera</p>
          <h1 className="mt-3 font-[var(--font-playfair)] text-4xl font-semibold tracking-[-0.04em]">
            Câmera indisponível agora.
          </h1>
          <p className="mt-5 text-sm leading-7 text-white/78">{cameraError}</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => void startCamera()}
              className="inline-flex min-h-14 items-center justify-center rounded-full bg-white px-6 text-xs font-semibold uppercase tracking-[0.22em] text-black"
            >
              Tentar novamente
            </button>
            <button
              type="button"
              onClick={onChooseUpload}
              className="inline-flex min-h-14 items-center justify-center rounded-full border border-white/14 px-6 text-xs uppercase tracking-[0.22em] text-white"
            >
              Enviar foto
            </button>
            <button
              type="button"
              onClick={onChooseQuiz}
              className="inline-flex min-h-14 items-center justify-center rounded-full border border-white/14 px-6 text-xs uppercase tracking-[0.22em] text-white/72"
            >
              Responder quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-8 pt-6 sm:px-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Voltar para escolher outro modo de captura"
            className="inline-flex h-11 min-w-11 items-center justify-center rounded-full border border-white/12 bg-white/6 px-4 text-xs uppercase tracking-[0.2em] text-white/78"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <p className="text-[11px] uppercase tracking-[0.26em] text-white/55">Escanear com câmera</p>
          <button
            type="button"
            onClick={() => void startCamera()}
            aria-label="Reabrir câmera"
            className="inline-flex h-11 min-w-11 items-center justify-center rounded-full border border-white/12 bg-white/6 px-4 text-xs uppercase tracking-[0.2em] text-white/78"
          >
            <RefreshCcw className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="grid flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
          <section className="relative overflow-hidden rounded-[34px] border border-white/10 bg-[#050505]">
            <div className="relative aspect-[3/5] min-h-[68vh] w-full sm:aspect-[4/5] lg:min-h-full">
              <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_24%,rgba(0,0,0,0.66)_78%)]" />
              <div className="pointer-events-none absolute left-1/2 top-1/2 h-[69%] w-[58%] -translate-x-1/2 -translate-y-1/2 rounded-[46%] border border-white/85" />

              <div className="absolute inset-x-4 top-4 rounded-[24px] border border-white/12 bg-black/35 px-4 py-4 backdrop-blur-md">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-white/55">
                      Etapa {activeIndex + 1} de {FACE_SHIELD_GUIDED_STEPS.length}
                    </p>
                    <p className="mt-2 text-xl font-medium text-white">{activeStep.title}</p>
                  </div>
                  <span className="rounded-full border border-white/12 bg-white/8 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-white/72">
                    {completedCount}/{FACE_SHIELD_GUIDED_STEPS.length} capturas
                  </span>
                </div>
                <p className="mt-3 text-sm leading-7 text-white/76">{activeStep.instruction}</p>
                <p className="mt-2 text-xs leading-6 text-white/52">{activeStep.helper}</p>
              </div>

              <div className="absolute inset-x-4 bottom-5 flex flex-col items-center gap-4">
                <button
                  type="button"
                  onClick={handleCapture}
                  disabled={!cameraReady || startingCamera || disabled}
                  aria-label={captures[activeStep.field].file ? "Refazer captura da etapa atual" : "Capturar etapa atual"}
                  className="inline-flex h-20 w-20 items-center justify-center rounded-full border border-white/35 bg-white/10 backdrop-blur disabled:opacity-55"
                >
                  <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white">
                    <Camera className="h-5 w-5 text-black" aria-hidden="true" />
                  </span>
                </button>
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/68">
                  {captures[activeStep.field].file ? "Refazer captura" : "Capturar agora"}
                </p>
              </div>

              {startingCamera ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-sm text-white/78">
                  Abrindo câmera...
                </div>
              ) : null}
            </div>
          </section>

          <aside className="flex flex-col gap-4 rounded-[34px] border border-white/10 bg-white/5 p-5">
            <div className="rounded-[26px] border border-white/10 bg-white/5 p-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-white/55">Antes de enviar</p>
              <p className="mt-3 text-sm leading-7 text-white/74">
                Capture com luz natural, sem filtros, sem maquiagem pesada e com o rosto centralizado.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {FACE_SHIELD_GUIDED_STEPS.map((step, index) => {
                const item = captures[step.field];
                const isActive = index === activeIndex;

                return (
                  <button
                    key={step.field}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className={`overflow-hidden rounded-[24px] border p-3 text-left transition ${
                      isActive ? "border-[#a44a64] bg-[#a44a64]/12" : "border-white/10 bg-black/16"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.22em] text-white/48">Etapa {index + 1}</p>
                        <p className="mt-1 font-medium text-white">{step.shortLabel}</p>
                      </div>
                      <span className="text-[10px] uppercase tracking-[0.22em] text-white/55">
                        {item.file ? "capturada" : "pendente"}
                      </span>
                    </div>

                    <div className="mt-3 h-20 overflow-hidden rounded-[18px] border border-white/10 bg-white/6">
                      {item.previewUrl ? (
                        <img src={item.previewUrl} alt={`${step.shortLabel} capturada`} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[10px] uppercase tracking-[0.22em] text-white/34">
                          Aguardando captura
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {cameraError ? (
              <div className="rounded-[24px] border border-[#a44a64]/35 bg-[#a44a64]/10 px-4 py-4 text-sm leading-7 text-white/84">
                {cameraError}
              </div>
            ) : null}

            {submitError ? (
              <div className="rounded-[24px] border border-[#a44a64]/35 bg-[#a44a64]/10 px-4 py-4 text-sm leading-7 text-white/84">
                {submitError}
              </div>
            ) : null}

            <div className="mt-auto flex flex-col gap-3">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!allStepsCaptured || disabled}
                className="inline-flex min-h-14 items-center justify-center rounded-full bg-white px-6 text-xs font-semibold uppercase tracking-[0.22em] text-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                {disabled ? "Enviando leitura..." : allStepsCaptured ? "Enviar para análise" : "Capture as 5 etapas"}
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={onChooseUpload}
                  aria-label="Trocar para envio de foto"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/12 px-4 text-[11px] uppercase tracking-[0.2em] text-white/72"
                >
                  <ImageUp className="h-4 w-4" aria-hidden="true" />
                  Enviar foto
                </button>
                <button
                  type="button"
                  onClick={onChooseQuiz}
                  aria-label="Seguir pelo quiz rápido"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/12 px-4 text-[11px] uppercase tracking-[0.2em] text-white/72"
                >
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  Quiz rápido
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
