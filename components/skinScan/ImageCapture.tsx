"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Upload, RotateCcw } from "lucide-react";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Modo = "escolha" | "camera" | "preview";

// ─── Guias visuais ────────────────────────────────────────────────────────────

const GUIAS = [
  "Luz natural, de frente",
  "Sem maquiagem",
  "Rosto centralizado",
] as const;

// ─── Componente ───────────────────────────────────────────────────────────────

interface ImageCaptureProps {
  /** Chamado após o envio bem-sucedido — recebe o scan_id retornado pela API */
  onScanIniciado?: (scanId: string) => void;
}

export function ImageCapture({ onScanIniciado }: ImageCaptureProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [modo, setModo] = useState<Modo>("escolha");
  const [imageBase64, setImageBase64] = useState<string | null>(null); // data URL
  const [consentido, setConsentido] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // ── Limpar stream ao desmontar ─────────────────────────────────────────────
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // ── Câmera ─────────────────────────────────────────────────────────────────

  const iniciarCamera = useCallback(async () => {
    setErro(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user", // câmera frontal por padrão em mobile
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setModo("camera");
    } catch {
      setErro(
        "Não foi possível acessar a câmera. Verifique as permissões do navegador ou use a opção de envio de arquivo."
      );
    }
  }, []);

  const pararCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const capturarFoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    pararCamera();
    setImageBase64(dataUrl);
    setModo("preview");
  }, [pararCamera]);

  // ── Arquivo ────────────────────────────────────────────────────────────────

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!["image/jpeg", "image/png"].includes(file.type)) {
        setErro("Use um arquivo JPEG ou PNG.");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setErro("Arquivo muito grande — máximo 10 MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImageBase64(ev.target?.result as string);
        setModo("preview");
        setErro(null);
      };
      reader.readAsDataURL(file);
    },
    []
  );

  const reiniciar = useCallback(() => {
    pararCamera();
    setImageBase64(null);
    setConsentido(false);
    setErro(null);
    setModo("escolha");
  }, [pararCamera]);

  // ── Envio ──────────────────────────────────────────────────────────────────

  const handleEnviar = useCallback(async () => {
    if (!imageBase64 || !consentido || enviando) return;
    setEnviando(true);
    setErro(null);

    // Ler focos da sessão (definidos na etapa anterior)
    let focos: string[] = ["oleosidade"];
    try {
      const stored = sessionStorage.getItem("skinScanFocos");
      if (stored) focos = JSON.parse(stored) as string[];
    } catch {
      // fallback
    }

    // Remover prefixo data URL antes de enviar
    const base64 = imageBase64.includes(",")
      ? imageBase64.split(",")[1]
      : imageBase64;

    try {
      const res = await fetch("/api/skin-scan/iniciar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_base64: base64, focos }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? `Erro ${res.status}`);
      }

      const { scan_id } = (await res.json()) as { scan_id: string };

      if (onScanIniciado) {
        onScanIniciado(scan_id);
      } else {
        router.push(`/skin-scan/processando/${scan_id}`);
      }
    } catch (err) {
      setErro(
        err instanceof Error
          ? err.message
          : "Não foi possível iniciar a análise. Tente novamente."
      );
      setEnviando(false);
    }
  }, [imageBase64, consentido, enviando, router, onScanIniciado]);

  // ── Estilos base ───────────────────────────────────────────────────────────

  const vars = {
    "--scan-fg": "var(--bp-black, #1e1e1e)",
    "--scan-bg": "var(--bp-offwhite, #fbf7f4)",
    "--scan-border": "rgba(30,30,30,0.1)",
    "--scan-muted": "rgba(30,30,30,0.45)",
  } as React.CSSProperties;

  const labelBase: React.CSSProperties = {
    fontFamily: "var(--font-inter, sans-serif)",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "var(--scan-fg)",
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={vars}>
      {/* Guias visuais */}
      <ul className="mb-8 flex flex-wrap justify-center gap-3">
        {GUIAS.map((g) => (
          <li
            key={g}
            style={{
              fontFamily: "var(--font-inter, sans-serif)",
              fontSize: 11,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--scan-muted)",
              padding: "6px 14px",
              border: "1px solid var(--scan-border)",
            }}
          >
            {g}
          </li>
        ))}
      </ul>

      {/* ── Modo escolha ───────────────────────────────────────────────────── */}
      {modo === "escolha" && (
        <div className="flex flex-wrap justify-center gap-4">
          <button
            type="button"
            onClick={iniciarCamera}
            style={{
              ...labelBase,
              padding: "20px 32px",
              border: "1px solid var(--scan-border)",
              background: "transparent",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
              minWidth: 180,
            }}
          >
            <Camera size={20} aria-hidden style={{ opacity: 0.6 }} />
            Tirar foto
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              ...labelBase,
              padding: "20px 32px",
              border: "1px solid var(--scan-border)",
              background: "transparent",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
              minWidth: 180,
            }}
          >
            <Upload size={20} aria-hidden style={{ opacity: 0.6 }} />
            Enviar arquivo
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            className="sr-only"
            aria-label="Selecionar imagem"
            onChange={handleFileChange}
          />
        </div>
      )}

      {/* ── Modo câmera ─────────────────────────────────────────────────────── */}
      {modo === "camera" && (
        <div className="flex flex-col items-center gap-6">
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: 480,
              height: "min(56vh, 420px)",
              background: "#000",
              overflow: "hidden",
            }}
          >
            <video
              ref={videoRef}
              playsInline
              muted
              style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }}
            />
            {/* Guia de enquadramento oval */}
            <div
              aria-hidden
              style={{
                position: "absolute",
                left: "15%",
                right: "15%",
                top: "8%",
                bottom: "8%",
                border: "1px solid rgba(255,255,255,0.5)",
                borderRadius: "50%",
                pointerEvents: "none",
              }}
            />
          </div>

          <canvas ref={canvasRef} className="hidden" />

          <div className="flex gap-4">
            <button
              type="button"
              onClick={capturarFoto}
              style={{
                ...labelBase,
                padding: "14px 32px",
                background: "var(--scan-fg)",
                color: "var(--scan-bg)",
                border: "none",
                cursor: "pointer",
              }}
            >
              Capturar
            </button>
            <button
              type="button"
              onClick={reiniciar}
              style={{
                ...labelBase,
                padding: "14px 20px",
                background: "transparent",
                border: "1px solid var(--scan-border)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <RotateCcw size={14} aria-hidden />
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ── Modo preview ────────────────────────────────────────────────────── */}
      {modo === "preview" && imageBase64 && (
        <div className="flex flex-col items-center gap-6">
          {/* Preview da imagem capturada */}
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: 480,
              height: "min(56vh, 420px)",
              overflow: "hidden",
              background: "#f0ede9",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageBase64}
              alt="Preview da foto capturada"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </div>

          {/* Consentimento LGPD — obrigatório */}
          <label
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 12,
              maxWidth: 480,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={consentido}
              onChange={(e) => setConsentido(e.target.checked)}
              style={{ marginTop: 2, flexShrink: 0, accentColor: "var(--scan-fg)" }}
              aria-required="true"
            />
            <span
              style={{
                fontFamily: "var(--font-inter, sans-serif)",
                fontSize: 12,
                lineHeight: 1.6,
                color: "var(--scan-muted)",
              }}
            >
              Concordo com o uso temporário desta imagem para análise cosmética.
              A imagem é deletada imediatamente após o processamento.
            </span>
          </label>

          {/* Botões de ação */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleEnviar}
              disabled={!consentido || enviando}
              style={{
                ...labelBase,
                padding: "14px 28px",
                background: consentido && !enviando ? "var(--scan-fg)" : "var(--scan-border)",
                color: consentido && !enviando ? "var(--scan-bg)" : "var(--scan-muted)",
                border: "none",
                cursor: consentido && !enviando ? "pointer" : "not-allowed",
                transition: "background 200ms, color 200ms",
              }}
            >
              {enviando ? "Enviando..." : "Usar esta foto"}
            </button>

            <button
              type="button"
              onClick={reiniciar}
              disabled={enviando}
              style={{
                ...labelBase,
                padding: "14px 20px",
                background: "transparent",
                border: "1px solid var(--scan-border)",
                cursor: enviando ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <RotateCcw size={14} aria-hidden />
              Tirar outra
            </button>
          </div>
        </div>
      )}

      {/* Erro */}
      {erro && (
        <p
          role="alert"
          style={{
            fontFamily: "var(--font-inter, sans-serif)",
            fontSize: 12,
            color: "#b91c1c",
            textAlign: "center",
            marginTop: 16,
            maxWidth: 480,
            marginInline: "auto",
          }}
        >
          {erro}
        </p>
      )}
    </div>
  );
}
