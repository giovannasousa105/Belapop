"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";

import { useFaceDetection } from "@/hooks/useFaceDetection";
import { BELAPOP_SCAN_KEY, LEGACY_SKIN_SCAN_KEYS, SKIN_SCAN_FOCOS_KEY } from "@/types/skin-scan";
import type { SkinScanResult } from "@/types/skin-scan";

type Mode = "idle" | "camera" | "preview" | "analyzing";

const QUALITY_LABELS = [
  { key: "centered" as const, label: "Posição" },
  { key: "lightingOk" as const, label: "Iluminação" },
  { key: "stable" as const, label: "Estabilidade" },
] satisfies { key: keyof import("@/hooks/useFaceDetection").FaceQuality; label: string }[];

export function ImageCapture() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [mode, setMode] = useState<Mode>("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewBase64, setPreviewBase64] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoCapturing, setAutoCapturing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);  // 3 → 2 → 1 → null
  const [focos, setFocos] = useState<string[]>(["hidratacao"]);

  const { quality, readyToCapture, stableSeconds, isModelLoading } =
    useFaceDetection(videoRef, overlayCanvasRef, mode === "camera");

  // Load focos from previous step
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SKIN_SCAN_FOCOS_KEY);
      if (raw) setFocos(JSON.parse(raw) as string[]);
    } catch {
      /* use default */
    }
  }, []);

  // Stop camera tracks
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => () => stopCamera(), [stopCamera]);

  // Open camera
  const openCamera = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      // NÃO chamar srcObject nem play() aqui:
      // o <video> ainda está display:none (pai com display:none).
      // Chamar play() enquanto o elemento está oculto falha silenciosamente
      // no Safari e em alguns contextos do Chrome mobile.
      // O useEffect abaixo é quem conecta e inicia o vídeo, APÓS setMode("camera")
      // ter re-renderizado o DOM com display:block.
      setMode("camera");
    } catch (err) {
      const e = err as { name?: string };
      if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
        setError("Permissão de câmera negada. Permita o acesso nas configurações do navegador ou use 'Enviar arquivo'.");
      } else {
        setError("Câmera não disponível. Use 'Enviar arquivo' para continuar.");
      }
    }
  }, []);

  // Conecta o stream e inicia a reprodução DEPOIS que o modo vira "camera"
  // → neste ponto React já commitou o DOM: o div pai é display:block,
  //   então play() funciona em todos os browsers (incluindo Safari/iOS).
  useEffect(() => {
    if (mode === "camera" && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch((e) => {
        console.warn("[ImageCapture] video.play() falhou:", e);
      });
    }
  }, [mode]);

  // Capture current frame from video
  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = captureCanvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Mirror horizontal (selfie view)
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setPreviewUrl(dataUrl);
    setPreviewBase64(dataUrl.split(",")[1]);

    stopCamera();
    setAutoCapturing(false);
    setMode("preview");
  }, [stopCamera]);

  // Melhoria 1.1 — Auto-capture com countdown 3-2-1
  useEffect(() => {
    if (mode !== "camera" || !readyToCapture || autoCapturing) return;

    setAutoCapturing(true);
    setCountdown(3);

    const t1 = setTimeout(() => setCountdown(2), 1000);
    const t2 = setTimeout(() => setCountdown(1), 2000);
    const t3 = setTimeout(() => {
      setCountdown(null);
      captureFrame();
    }, 3000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [mode, readyToCapture, autoCapturing, captureFrame]);

  // Cancel camera and go back to idle
  const cancelCamera = useCallback(() => {
    stopCamera();
    setAutoCapturing(false);
    setCountdown(null);
    setMode("idle");
  }, [stopCamera]);

  // File upload handler
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Use um arquivo JPEG, PNG ou WebP.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Arquivo muito grande — máximo 10 MB.");
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setPreviewUrl(result);
      setPreviewBase64(result.split(",")[1]);
      setMode("preview");
    };
    reader.readAsDataURL(file);
  }, []);

  // Retake — go back to idle
  const retake = useCallback(() => {
    setPreviewUrl(null);
    setPreviewBase64(null);
    setError(null);
    setMode("idle");
  }, []);

  // Send to API and navigate to resultado
  const analyzeImage = useCallback(async () => {
    if (!previewBase64) return;
    setMode("analyzing");
    setError(null);

    try {
      const res = await fetch("/api/skin-scan/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_base64: previewBase64, focos }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Erro ${res.status}`);
      }

      const data = (await res.json()) as {
        success: boolean;
        analysis?: SkinScanResult;
        result?: SkinScanResult;
      };
      const analysis = data.analysis ?? data.result;

      if (!analysis) {
        throw new Error("Resposta inválida do servidor. Tente novamente.");
      }

      // Garantir campos obrigatórios para versões antigas da API
      if (analysis.rotina) {
        analysis.rotina.manha  = analysis.rotina.manha  ?? [];
        analysis.rotina.noite  = analysis.rotina.noite  ?? [];
        analysis.rotina.semanal = analysis.rotina.semanal ?? [];
      }

      // Limpar chaves legadas
      for (const key of LEGACY_SKIN_SCAN_KEYS) {
        sessionStorage.removeItem(key);
      }

      // Gravar nas duas formas para compatibilidade com código em produção
      // que pode usar o nome literal da constante ou o valor "belapop_scan_v2"
      const payload = JSON.stringify(analysis);
      sessionStorage.setItem(BELAPOP_SCAN_KEY, payload);      // "belapop_scan_v2"
      sessionStorage.setItem("BELAPOP_SCAN_KEY", payload);    // literal — fallback

      router.push("/skin-scan/resultado");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível concluir a análise. Tente novamente."
      );
      setMode("preview");
    }
  }, [previewBase64, focos, router]);

  // ── CSS helpers ──────────────────────────────────────────────────────────────

  const scoreColor =
    quality.score > 80 ? "#4ade80" : quality.score > 50 ? "#fbbf24" : "#f87171";

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div>
      <style>{`
        @keyframes bp-spin { to { transform: rotate(360deg); } }
        @keyframes bp-countdown-pop {
          0%   { transform: scale(1.8); opacity: 0; }
          60%  { transform: scale(0.92); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* ── IDLE — mode selection ──────────────────────────────────────────────── */}
      {mode === "idle" && (
        <div>
          <ul
            className="mb-8 flex flex-wrap justify-center gap-2"
            aria-label="Instruções de captura"
          >
            {["☀️ Luz natural, de frente", "💄 Sem maquiagem", "📸 Rosto centralizado"].map(
              (g) => (
                <li
                  key={g}
                  className="rounded-full border border-black/10 px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-[rgba(30,30,30,0.5)]"
                >
                  {g}
                </li>
              )
            )}
          </ul>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={openCamera}
              className="flex flex-col items-center gap-3 rounded-2xl border border-black/10 p-6 text-[11px] font-semibold uppercase tracking-[0.16em] transition hover:border-black/30"
            >
              <span className="text-2xl">📷</span>
              Tirar foto
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-3 rounded-2xl border border-black/10 p-6 text-[11px] font-semibold uppercase tracking-[0.16em] transition hover:border-black/30"
            >
              <Upload className="h-6 w-6 opacity-50" />
              Enviar arquivo
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={handleFileChange}
            />
          </div>

          {error && (
            <p role="alert" className="mt-4 text-center text-xs text-red-600">
              {error}
            </p>
          )}
        </div>
      )}

      {/* ── CAMERA — live viewfinder with face detection overlay ─────────────── */}
      {/*
        FIX P0: <video> fica SEMPRE no DOM (display:none quando não está em modo câmera).
        Isso garante que videoRef.current != null quando getUserMedia() resolver,
        evitando a race condition que causava tela preta.
      */}
      <div className="space-y-3" style={{ display: mode === "camera" ? "block" : "none" }}>
        {/* Quality bar */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-[rgba(30,30,30,0.55)]">{quality.guidance}</p>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[rgba(30,30,30,0.08)]">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${quality.score}%`, backgroundColor: scoreColor }}
              />
            </div>
            <span className="text-[10px] text-[rgba(30,30,30,0.45)]">{quality.score}%</span>
          </div>
        </div>

        {/* Camera viewport */}
        <div
          className="relative overflow-hidden rounded-2xl bg-black"
          style={{ aspectRatio: "4/3" }}
        >
          {/* Live video — mirrored for selfie */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 h-full w-full object-cover"
            style={{ transform: "scaleX(-1)" }}
          />

          {/* Face detection overlay — mirrored to match video */}
          <canvas
            ref={overlayCanvasRef}
            className="pointer-events-none absolute inset-0 h-full w-full"
            style={{ transform: "scaleX(-1)" }}
          />

          {/* Model loading badge */}
          {isModelLoading && (
            <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1">
              <div
                className="h-2.5 w-2.5 rounded-full border border-white/40"
                style={{
                  borderTopColor: "#fff",
                  animation: "bp-spin 0.9s linear infinite",
                }}
              />
              <span className="text-[9px] font-medium uppercase tracking-widest text-white/70">
                Carregando AI...
              </span>
            </div>
          )}

          {/* Zone legend */}
          {mode === "camera" && quality.faceDetected && (
            <div className="absolute left-3 top-3 space-y-1">
              {[
                { color: "rgba(240,70,100,0.9)", label: "Zona T" },
                { color: "rgba(130,90,240,0.9)", label: "Bochechas" },
                { color: "rgba(60,150,255,0.9)", label: "Olhos" },
              ].map((z) => (
                <div
                  key={z.label}
                  className="flex items-center gap-1.5 rounded-full bg-black/40 px-2 py-0.5"
                >
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: z.color }}
                  />
                  <span className="text-[9px] text-white">{z.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Stability dots */}
          {mode === "camera" && quality.faceDetected && !readyToCapture && quality.centered && (
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-2 w-2 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor:
                      i < stableSeconds ? "#4ade80" : "rgba(255,255,255,0.35)",
                  }}
                />
              ))}
            </div>
          )}

          {/* Melhoria 1.1 — Countdown visual 3-2-1 */}
          {countdown !== null && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/90 shadow-xl">
                <span
                  key={countdown}
                  className="text-5xl font-bold text-[#1e1e1e]"
                  style={{ animation: "bp-countdown-pop 0.35s cubic-bezier(.22,1.5,.5,1) both" }}
                >
                  {countdown}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Melhoria 1.2 — Indicador de qualidade colorido */}
        <div className="grid grid-cols-3 gap-2">
          {QUALITY_LABELS.map(({ key, label }) => {
            const ok = Boolean(quality[key]);
            return (
              <div
                key={label}
                className={`rounded-xl py-2 text-center text-[11px] font-semibold transition-colors ${
                  ok
                    ? "bg-green-50 text-green-700"
                    : quality.faceDetected
                      ? "bg-amber-50 text-amber-700"
                      : "bg-[rgba(30,30,30,0.04)] text-[rgba(30,30,30,0.45)]"
                }`}
              >
                {ok ? "✓" : quality.faceDetected ? "!" : "○"} {label}
              </div>
            );
          })}
        </div>

        {/* Melhoria 1.3 — Dica contextual de iluminação */}
        {mode === "camera" && quality.faceDetected && !quality.lightingOk && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center">
            <p className="text-xs text-amber-800">
              💡 Aproxime-se de uma janela ou ligue a luz do quarto para melhorar a leitura.
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={captureFrame}
            className="flex items-center justify-center gap-2 rounded-2xl bg-[#1e1e1e] py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-black/80"
          >
            📸 Capturar
          </button>
          <button
            type="button"
            onClick={cancelCamera}
            className="rounded-2xl border border-black/10 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgba(30,30,30,0.6)] transition hover:border-black/30"
          >
            ↩ Cancelar
          </button>
        </div>

        {/* Hidden capture canvas — sempre no DOM para captureFrame() */}
        <canvas ref={captureCanvasRef} className="hidden" />
      </div>

      {/* ── PREVIEW — confirm captured image ──────────────────────────────────── */}
      {mode === "preview" && previewUrl && (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Foto capturada para análise"
              className="w-full object-cover"
            />
          </div>

          <p className="text-center text-xs leading-relaxed text-[rgba(30,30,30,0.5)]">
            A imagem é processada em memória e deletada imediatamente após a análise.
          </p>

          {error && (
            <p role="alert" className="rounded-xl bg-red-50 p-3 text-center text-xs text-red-600">
              {error}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={analyzeImage}
              className="rounded-2xl bg-[#1e1e1e] py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-black/80"
            >
              Analisar pele →
            </button>
            <button
              type="button"
              onClick={retake}
              className="rounded-2xl border border-black/10 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgba(30,30,30,0.6)] transition hover:border-black/30"
            >
              ↩ Outra foto
            </button>
          </div>
        </div>
      )}

      {/* ── ANALYZING — loading while API processes ────────────────────────────── */}
      {mode === "analyzing" && (
        <div className="flex flex-col items-center gap-6 py-12" aria-live="polite">
          <div
            style={{
              width: 52,
              height: 52,
              border: "2px solid rgba(30,30,30,0.10)",
              borderTopColor: "#1e1e1e",
              borderRadius: "50%",
              animation: "bp-spin 1s linear infinite",
            }}
          />
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[rgba(30,30,30,0.5)]">
              Analisando sua pele...
            </p>
            <p className="mt-1 text-[10px] text-[rgba(30,30,30,0.30)]">
              Protocolo dermatológico AAD 2024 · BJD 2025
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
