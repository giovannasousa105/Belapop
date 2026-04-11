"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Camera, ChevronLeft, ChevronRight, X } from "lucide-react";

import {
  postCustomerBelaCodeAnalyze,
  type CustomerBelaCodeScanCreateResponse
} from "@/lib/customer/api";

type CaptureStep = "neutral" | "blink" | "smile" | "frown" | "turn";

type StepState = {
  blob: Blob | null;
  previewUrl: string | null;
};

type Props = {
  disabled?: boolean;
  onComplete: (response: CustomerBelaCodeScanCreateResponse) => Promise<void> | void;
  onMessage: (message: string) => void;
};

const stepLabels: Record<CaptureStep, { title: string; hint: string; short: string; cardHint: string }> = {
  neutral: {
    title: "Base",
    short: "Neutra",
    hint: "Olhar reto, rosto centralizado, expressao neutra e sem maquiagem pesada.",
    cardHint: "Rosto centralizado e expressao neutra."
  },
  blink: {
    title: "Piscada",
    short: "Piscada",
    hint: "Feche os olhos por um instante para validar o liveness com piscada real.",
    cardHint: "Feche os olhos por um instante."
  },
  smile: {
    title: "Sorriso",
    short: "Sorriso",
    hint: "Sorria de leve para a IA observar sulcos e linhas de expressao.",
    cardHint: "Sorria de leve."
  },
  frown: {
    title: "Testa franzida",
    short: "Franzir",
    hint: "Franza levemente a testa para evidenciar rugas e linhas dinamicas.",
    cardHint: "Franza levemente a testa."
  },
  turn: {
    title: "Rotacao",
    short: "Rotacao",
    hint: "Gire levemente a cabeca para um dos lados sem sair do enquadramento.",
    cardHint: "Gire a cabeca sem sair do enquadramento."
  }
};

const orderedSteps: CaptureStep[] = ["neutral", "blink", "smile", "frown", "turn"];

export default function BelaCodeCameraCapture({ disabled, onComplete, onMessage }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const carouselRef = useRef<HTMLDivElement | null>(null);

  const [captureSessionOpen, setCaptureSessionOpen] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [captures, setCaptures] = useState<Record<CaptureStep, StepState>>({
    neutral: { blob: null, previewUrl: null },
    blink: { blob: null, previewUrl: null },
    smile: { blob: null, previewUrl: null },
    frown: { blob: null, previewUrl: null },
    turn: { blob: null, previewUrl: null }
  });
  const [activeStep, setActiveStep] = useState<CaptureStep>("neutral");

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
    setCaptureSessionOpen(false);
    setCameraReady(false);
    setVideoReady(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
      for (const step of orderedSteps) {
        const previewUrl = captures[step].previewUrl;
        if (previewUrl) URL.revokeObjectURL(previewUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!captureSessionOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [captureSessionOpen]);

  const startCamera = useCallback(async () => {
    setCaptureSessionOpen(true);
    setStarting(true);
    setCameraError(null);
    setVideoReady(false);

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Seu navegador nao liberou a camera. Abra a BelaPop em HTTPS e permita acesso a camera.");
      }

      const attemptConstraints: MediaStreamConstraints[] = [
        {
          video: {
            facingMode: "user",
            width: { ideal: 1440 },
            height: { ideal: 1920 },
            aspectRatio: { ideal: 0.75 },
            frameRate: { ideal: 30, max: 30 }
          },
          audio: false
        },
        {
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 1280 }
          },
          audio: false
        },
        {
          video: { facingMode: "user" },
          audio: false
        }
      ];

      let stream: MediaStream | null = null;
      let lastError: unknown = null;

      for (const constraints of attemptConstraints) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          break;
        } catch (error) {
          lastError = error;
        }
      }

      if (!stream) {
        throw lastError instanceof Error ? lastError : new Error("Nao foi possivel abrir a camera.");
      }

      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) {
        throw new Error("Falha ao preparar o player da camera.");
      }

      video.srcObject = stream;
      await new Promise<void>((resolve, reject) => {
        if (video.readyState >= 1) {
          resolve();
          return;
        }

        const timeout = window.setTimeout(() => {
          cleanup();
          reject(new Error("A camera abriu, mas o video nao carregou a tempo."));
        }, 4500);

        const cleanup = () => {
          window.clearTimeout(timeout);
          video.removeEventListener("loadedmetadata", handleLoadedMetadata);
          video.removeEventListener("error", handleVideoError);
        };

        const handleLoadedMetadata = () => {
          cleanup();
          resolve();
        };

        const handleVideoError = () => {
          cleanup();
          reject(new Error("Falha ao inicializar o video da camera."));
        };

        video.addEventListener("loadedmetadata", handleLoadedMetadata, { once: true });
        video.addEventListener("error", handleVideoError, { once: true });
      });

      await video.play();
      setCameraReady(true);
      setVideoReady(true);
    } catch (error) {
      setCameraError(error instanceof Error ? error.message : "Nao foi possivel abrir a camera.");
      stopCamera();
    } finally {
      setStarting(false);
    }
  }, [stopCamera]);

  const allStepsCaptured = useMemo(
    () => orderedSteps.every((step) => captures[step].blob instanceof Blob),
    [captures]
  );

  const progressIndex = orderedSteps.indexOf(activeStep);
  const captureProgress = Math.round(((progressIndex + 1) / orderedSteps.length) * 100);
  const capturedStepsCount = useMemo(
    () => orderedSteps.filter((step) => captures[step].blob instanceof Blob).length,
    [captures]
  );
  const activeStepCapture = captures[activeStep];
  const activeStepMeta = stepLabels[activeStep];
  const captureButtonLabel = activeStepCapture.blob ? `Refazer ${activeStepMeta.short}` : `Capturar ${activeStepMeta.short}`;

  const captureFrame = useCallback(
    async (step: CaptureStep) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) {
        setCameraError("Camera ainda nao inicializada.");
        return;
      }

      if (!cameraReady || !videoReady || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        setCameraError("A imagem da camera ainda nao estabilizou. Aguarde um instante e tente novamente.");
        return;
      }

      const width = video.videoWidth || 1080;
      const height = video.videoHeight || 1440;
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) {
        setCameraError("Falha ao preparar a captura.");
        return;
      }

      context.drawImage(video, 0, 0, width, height);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.96));
      if (!blob) {
        setCameraError("Falha ao capturar a imagem.");
        return;
      }

      setCaptures((current) => {
        const previous = current[step].previewUrl;
        if (previous) URL.revokeObjectURL(previous);
        const next = {
          ...current,
          [step]: {
            blob,
            previewUrl: URL.createObjectURL(blob)
          }
        };
        const currentIndex = orderedSteps.indexOf(step);
        const nextStep = orderedSteps[currentIndex + 1];
        if (nextStep) setActiveStep(nextStep);
        return next;
      });
    },
    [cameraReady, videoReady]
  );

  const captureActiveStep = useCallback(() => {
    void captureFrame(activeStep);
  }, [activeStep, captureFrame]);

  const scrollCarousel = useCallback((direction: "left" | "right") => {
    const container = carouselRef.current;
    if (!container) return;
    const distance = Math.max(240, Math.round(container.clientWidth * 0.72));
    container.scrollBy({
      left: direction === "left" ? -distance : distance,
      behavior: "smooth"
    });
  }, []);

  const submitAnalysis = useCallback(async () => {
    if (!allStepsCaptured) {
      onMessage("Capture as cinco etapas antes de enviar ao BelaCode.");
      return;
    }

    setProcessing(true);
    setCameraError(null);

    try {
      const formData = new FormData();
      formData.set("capture_mode", "guided_camera_fullscreen");
      formData.set("neutral_frame", new File([captures.neutral.blob!], "neutral.jpg", { type: "image/jpeg" }));
      formData.set("blink_frame", new File([captures.blink.blob!], "blink.jpg", { type: "image/jpeg" }));
      formData.set("smile_frame", new File([captures.smile.blob!], "smile.jpg", { type: "image/jpeg" }));
      formData.set("frown_frame", new File([captures.frown.blob!], "frown.jpg", { type: "image/jpeg" }));
      formData.set("turn_frame", new File([captures.turn.blob!], "turn.jpg", { type: "image/jpeg" }));

      const response = await postCustomerBelaCodeAnalyze(formData);
      await onComplete(response);
      onMessage(
        response.ok
          ? "Captura guiada processada com sucesso. O Skin Twin foi atualizado."
          : response.message ?? "O BelaCode rejeitou a captura."
      );
      if (response.ok) stopCamera();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao processar o BelaCode.";
      setCameraError(message);
      onMessage(message);
    } finally {
      setProcessing(false);
    }
  }, [allStepsCaptured, captures, onComplete, onMessage, stopCamera]);

  if (!captureSessionOpen) {
    return (
      <div className="rounded-3xl border border-[rgba(216,160,172,0.2)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,238,240,0.62))] p-5 shadow-[0_18px_44px_rgba(91,49,56,0.06)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.24em] text-bpGraphite/72">Captura guiada</p>
            <p className="mt-2 text-xl font-semibold text-bpBlack">Abra a camera em tela cheia para um scan melhor</p>
            <p className="mt-2 text-sm leading-6 text-bpGraphite/82">
              O BelaCode conduz cinco poses simples para capturar imagem de alta qualidade: base neutra, piscada,
              sorriso leve, testa franzida e rotacao suave. A leitura so entra no seu historico se o quality gate passar.
            </p>
          </div>

          <button
            type="button"
            onClick={startCamera}
            disabled={disabled || starting || processing}
            className="inline-flex items-center gap-2 rounded-full border border-bpPinkCta/35 bg-bpPinkCta px-5 py-3 text-xs uppercase tracking-[0.18em] text-white shadow-[0_18px_38px_rgba(213,30,113,0.22)] disabled:opacity-60"
          >
            <Camera className="h-4 w-4" />
            {starting ? "Abrindo camera..." : "Abrir camera em tela cheia"}
          </button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {orderedSteps.slice(0, 3).map((step, index) => (
            <div key={step} className="rounded-2xl border border-black/10 bg-white/80 px-4 py-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-bpGraphite/72">
                etapa {index + 1} - {stepLabels[step].title}
              </p>
              <p className="mt-2 text-sm text-bpBlack">{stepLabels[step].cardHint}</p>
            </div>
          ))}
        </div>

        {cameraError ? (
          <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {cameraError}
          </div>
        ) : null}
      </div>
    );
  }

  const wrapperClassName = "fixed inset-0 z-50 overflow-y-auto bg-[#0d0b10] p-4 text-white md:p-6";
  const usingDarkCaptureTheme = true;
  const sectionCardClass = usingDarkCaptureTheme
    ? "border-white/10 bg-white/5"
    : "border-black/15 bg-white";
  const mutedTextClass = usingDarkCaptureTheme ? "text-white/78" : "text-bpGraphite/82";
  const quietTextClass = usingDarkCaptureTheme ? "text-white/62" : "text-bpGraphite/72";
  const headingTextClass = usingDarkCaptureTheme ? "text-white" : "text-bpBlack";
  const softSurfaceClass = usingDarkCaptureTheme
    ? "border-white/10 bg-white/5"
    : "border-black/15 bg-bpOffWhite/55";
  const buttonGhostClass = usingDarkCaptureTheme
    ? "border-white/15 px-4 py-2 text-xs uppercase tracking-[0.18em] text-white/78"
    : "border-black/15 px-4 py-2 text-xs uppercase tracking-[0.18em] text-bpBlackSoft";

  return (
    <div className={wrapperClassName}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className={`text-xs uppercase tracking-[0.24em] ${quietTextClass}`}>Captura guiada</p>
          <p className={`mt-2 text-lg font-semibold ${headingTextClass}`}>BelaCode com camera real em tela cheia</p>
          <p className={`mt-2 max-w-2xl text-sm ${mutedTextClass}`}>
            Siga os comandos na ordem. O BelaCode valida iluminacao frontal, rosto centralizado, pouca maquiagem,
            expressao neutra, piscada, sorriso, testa franzida e leve giro de cabeca antes de aceitar a leitura.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={startCamera}
            disabled={disabled || starting || processing}
            className={`rounded-full border disabled:opacity-60 ${usingDarkCaptureTheme ? "border-white/15 bg-white/10 text-white" : "border-black/15 bg-white text-bpBlack"} px-4 py-2 text-xs uppercase tracking-[0.18em]`}
          >
            {cameraReady ? "Camera ativa" : starting ? "Abrindo..." : "Reiniciar camera"}
          </button>
          <button
            type="button"
            onClick={stopCamera}
            className={`inline-flex items-center gap-2 rounded-full border ${buttonGhostClass}`}
          >
            <X className="h-4 w-4" />
            Fechar
          </button>
        </div>
      </div>

      {cameraReady ? (
        <div className="mt-5 rounded-[28px] border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.18em] text-white/75">
            <span>Etapa {progressIndex + 1} de {orderedSteps.length}</span>
            <span>{capturedStepsCount}/{orderedSteps.length} capturadas</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-[#C2185B]" style={{ width: `${captureProgress}%` }} />
          </div>
          <p className="mt-3 text-sm font-medium text-white">{activeStepMeta.title}</p>
          <p className="mt-1 text-sm text-white/78">{activeStepMeta.hint}</p>
        </div>
      ) : null}

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.18fr)_minmax(320px,0.82fr)]">
        <div className="space-y-4">
          <div className={`relative overflow-hidden rounded-[30px] border ${usingDarkCaptureTheme ? "border-white/10 bg-[#06050a]" : "border-black/15 bg-[#06050a]"}`}>
            <div className="relative aspect-[0.64] md:aspect-[0.78]">
              {cameraReady ? (
                <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center px-6 text-center text-sm text-white/70">
                  Abra a camera frontal para iniciar a captura guiada.
                </div>
              )}
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.62)_76%)]" />
              <div className="pointer-events-none absolute left-1/2 top-1/2 h-[68%] w-[56%] -translate-x-1/2 -translate-y-1/2 rounded-[48%] border border-white/65 shadow-[0_0_0_2000px_rgba(0,0,0,0.06)]" />
              {cameraReady ? (
                <div className="pointer-events-none absolute inset-x-4 bottom-4 rounded-2xl border border-white/10 bg-black/35 px-4 py-3 backdrop-blur">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-white/60">Quality gate ativo</p>
                  <p className="mt-2 text-lg font-medium text-white">{activeStepMeta.hint}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-white/65">
                    comando agora: {activeStepMeta.short}
                  </p>
                </div>
              ) : null}
              {cameraReady && !videoReady ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/35 text-sm text-white/78">
                  Estabilizando imagem da camera...
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-white/10 bg-white/5 px-4 py-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/60">Etapa ativa</p>
              <p className="mt-1 text-base font-medium text-white">{activeStepMeta.title}</p>
              <p className="mt-1 text-sm text-white/72">{activeStepMeta.cardHint}</p>
            </div>
            <button
              type="button"
              onClick={captureActiveStep}
              disabled={!cameraReady || !videoReady || disabled || processing}
              className="rounded-full border border-bpPinkCta/35 bg-bpPinkCta px-5 py-3 text-xs uppercase tracking-[0.2em] text-white shadow-[0_18px_38px_rgba(213,30,113,0.22)] disabled:opacity-60"
            >
              {captureButtonLabel}
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
            {orderedSteps.map((step) => {
              const state = captures[step];
              const isActive = activeStep === step;
              return (
                <button
                  key={step}
                  type="button"
                  onClick={() => setActiveStep(step)}
                  disabled={!cameraReady || disabled || processing}
                  className={`min-w-0 rounded-3xl border px-4 py-4 text-left transition ${
                    isActive
                      ? "border-bpPink/45 bg-bpPink/10"
                      : sectionCardClass
                  } disabled:opacity-60`}
                >
                  <div className="flex min-w-0 items-center justify-between gap-2">
                    <p className={`min-w-0 text-[11px] uppercase tracking-[0.18em] ${quietTextClass}`}>
                      {stepLabels[step].title}
                    </p>
                    <span className={`shrink-0 text-[10px] uppercase tracking-[0.16em] ${usingDarkCaptureTheme ? "text-white/50" : "text-bpGraphite/60"}`}>
                      {stepLabels[step].short}
                    </span>
                  </div>
                  <p className={`mt-2 text-base leading-7 font-medium ${headingTextClass}`}>
                    {stepLabels[step].cardHint}
                  </p>
                  <div
                    className={`mt-4 h-20 rounded-2xl border bg-cover bg-center ${usingDarkCaptureTheme ? "border-white/10 bg-white/5" : "border-black/15 bg-bpOffWhite/60"}`}
                    style={state.previewUrl ? { backgroundImage: `url(${state.previewUrl})` } : undefined}
                  />
                  <p className={`mt-3 text-[11px] uppercase tracking-[0.16em] ${usingDarkCaptureTheme ? "text-white/58" : "text-bpGraphite/72"}`}>
                    {state.blob ? "capturado" : "aguardando"}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="hidden items-center justify-between gap-3 lg:flex 2xl:hidden">
            <div>
              <p className={`text-[11px] uppercase tracking-[0.18em] ${quietTextClass}`}>Etapas guiadas</p>
              <p className={`mt-1 text-sm ${mutedTextClass}`}>Deslize ou use as setas para navegar pelas capturas.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => scrollCarousel("left")}
                className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition ${
                  usingDarkCaptureTheme
                    ? "border-white/12 bg-white/6 text-white hover:bg-white/12"
                    : "border-black/10 bg-white text-bpBlack hover:border-bpPink/35 hover:bg-bpPinkLux/45"
                }`}
                aria-label="Ver etapas anteriores"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => scrollCarousel("right")}
                className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition ${
                  usingDarkCaptureTheme
                    ? "border-white/12 bg-white/6 text-white hover:bg-white/12"
                    : "border-black/10 bg-white text-bpBlack hover:border-bpPink/35 hover:bg-bpPinkLux/45"
                }`}
                aria-label="Ver proximas etapas"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div
            ref={carouselRef}
            className="hidden snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-2 pl-0 pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:flex 2xl:hidden"
          >
            {orderedSteps.map((step) => {
              const state = captures[step];
              const isActive = activeStep === step;
              return (
                <button
                  key={`${step}-carousel`}
                  type="button"
                  onClick={() => setActiveStep(step)}
                  disabled={!cameraReady || disabled || processing}
                  className={`min-w-[220px] max-w-[220px] snap-center rounded-3xl border px-4 py-4 text-left transition ${
                    isActive ? "border-bpPink/45 bg-bpPink/10" : sectionCardClass
                  } disabled:opacity-60`}
                >
                  <div className="flex min-w-0 items-center justify-between gap-2">
                    <p className={`min-w-0 text-[11px] uppercase tracking-[0.18em] ${quietTextClass}`}>
                      {stepLabels[step].title}
                    </p>
                    <span
                      className={`shrink-0 text-[10px] uppercase tracking-[0.16em] ${usingDarkCaptureTheme ? "text-white/50" : "text-bpGraphite/60"}`}
                    >
                      {stepLabels[step].short}
                    </span>
                  </div>
                  <p className={`mt-2 text-base leading-7 font-medium ${headingTextClass}`}>
                    {stepLabels[step].cardHint}
                  </p>
                  <div
                    className={`mt-4 h-20 rounded-2xl border bg-cover bg-center ${usingDarkCaptureTheme ? "border-white/10 bg-white/5" : "border-black/15 bg-bpOffWhite/60"}`}
                    style={state.previewUrl ? { backgroundImage: `url(${state.previewUrl})` } : undefined}
                  />
                  <p className={`mt-3 text-[11px] uppercase tracking-[0.16em] ${usingDarkCaptureTheme ? "text-white/58" : "text-bpGraphite/72"}`}>
                    {state.blob ? "capturado" : "aguardando"}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="hidden gap-3 2xl:grid 2xl:grid-cols-5">
            {orderedSteps.map((step) => {
              const state = captures[step];
              const isActive = activeStep === step;
              return (
                <button
                  key={`${step}-grid-wide`}
                  type="button"
                  onClick={() => setActiveStep(step)}
                  disabled={!cameraReady || disabled || processing}
                  className={`min-w-0 rounded-3xl border px-4 py-4 text-left transition ${
                    isActive ? "border-bpPink/45 bg-bpPink/10" : sectionCardClass
                  } disabled:opacity-60`}
                >
                  <div className="flex min-w-0 items-center justify-between gap-2">
                    <p className={`min-w-0 text-[11px] uppercase tracking-[0.18em] ${quietTextClass}`}>
                      {stepLabels[step].title}
                    </p>
                    <span
                      className={`shrink-0 text-[10px] uppercase tracking-[0.16em] ${usingDarkCaptureTheme ? "text-white/50" : "text-bpGraphite/60"}`}
                    >
                      {stepLabels[step].short}
                    </span>
                  </div>
                  <p className={`mt-2 text-base leading-7 font-medium ${headingTextClass}`}>
                    {stepLabels[step].cardHint}
                  </p>
                  <div
                    className={`mt-4 h-20 rounded-2xl border bg-cover bg-center ${usingDarkCaptureTheme ? "border-white/10 bg-white/5" : "border-black/15 bg-bpOffWhite/60"}`}
                    style={state.previewUrl ? { backgroundImage: `url(${state.previewUrl})` } : undefined}
                  />
                  <p className={`mt-3 text-[11px] uppercase tracking-[0.16em] ${usingDarkCaptureTheme ? "text-white/58" : "text-bpGraphite/72"}`}>
                    {state.blob ? "capturado" : "aguardando"}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className={`rounded-3xl border p-5 xl:sticky xl:top-4 xl:self-start ${sectionCardClass}`}>
          <p className={`text-xs uppercase tracking-[0.24em] ${quietTextClass}`}>Quality gate</p>
          <div className={`mt-4 rounded-2xl border px-4 py-4 ${softSurfaceClass}`}>
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/58">Comando guiado</p>
            <p className="mt-2 text-xl font-medium text-white">{activeStepMeta.title}</p>
            <p className={`mt-2 text-sm ${mutedTextClass}`}>{activeStepMeta.hint}</p>
          </div>
          <div className={`mt-4 space-y-3 text-sm ${mutedTextClass}`}>
            <div className={`rounded-2xl border px-4 py-3 ${softSurfaceClass}`}>
              Boa iluminacao frontal, rosto centralizado e maquiagem minima melhoram o score.
            </div>
            <div className={`rounded-2xl border px-4 py-3 ${softSurfaceClass}`}>
              A IA precisa ver expressao neutra, piscada, sorriso, testa franzida e rotacao leve da cabeca.
            </div>
            <div className={`rounded-2xl border px-4 py-3 ${softSurfaceClass}`}>
              Se qualquer requisito falhar, o scan e rejeitado e a simulacao nao atualiza o Skin Twin.
            </div>
            <div className={`rounded-2xl border px-4 py-3 ${softSurfaceClass}`}>
              Achados novos ou suspeitos entram como triagem visual e podem disparar alerta por email para revisao dermatologica.
            </div>
          </div>

          <button
            type="button"
            onClick={captureActiveStep}
            disabled={!cameraReady || !videoReady || disabled || processing}
            className="mt-5 w-full rounded-full border border-white/15 bg-white/10 px-5 py-3 text-xs uppercase tracking-[0.2em] text-white disabled:opacity-60"
          >
            {captureButtonLabel}
          </button>

          <button
            type="button"
            onClick={submitAnalysis}
            disabled={!allStepsCaptured || disabled || processing}
            className="mt-5 w-full rounded-full border border-bpPink/50 bg-bpPink px-5 py-3 text-xs uppercase tracking-[0.2em] text-white disabled:opacity-60"
          >
            {processing ? "Analisando..." : allStepsCaptured ? "Executar BelaCode real" : "Capture as 5 etapas para continuar"}
          </button>

          {cameraError ? (
            <div className="mt-4 rounded-2xl border border-amber-300/50 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {cameraError}
            </div>
          ) : null}
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}


