"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useScanStatus, type ScanStatus } from "@/lib/hooks/useScanStatus";

// ─── Mapeamento status → etapa concluída ──────────────────────────────────────

const ETAPAS = [
  { label: "Analisando imagem",             status: "PROCESSANDO_CV" as ScanStatus },
  { label: "Identificando padrões de pele", status: "SCORING"        as ScanStatus },
  { label: "Consultando base clínica",      status: "SCORING"        as ScanStatus },
  { label: "Montando sua rotina",           status: "RECOMENDANDO"   as ScanStatus },
  { label: "Gerando seu Skin ID",           status: "CONCLUIDO"      as ScanStatus },
] as const;

const STATUS_STEP: Record<ScanStatus, number> = {
  AGUARDANDO:      -1,
  PROCESSANDO_CV:   0,
  SCORING:          2,
  RECOMENDANDO:     3,
  CONCLUIDO:        5,
  ERRO:            -1,
};

// ─── Componente ───────────────────────────────────────────────────────────────

interface ProcessingStatusProps {
  scanId: string;
}

export function ProcessingStatus({ scanId }: ProcessingStatusProps) {
  const router = useRouter();
  const { data, erroFetch, timedOut } = useScanStatus(scanId);

  const currentStep = data ? (STATUS_STEP[data.status] ?? -1) : -1;
  const concluido = data?.concluido === true;
  const erro = data?.erro === true || erroFetch;

  // Redirecionar quando concluído
  useEffect(() => {
    if (concluido) {
      router.push(`/skin-scan/resultado/${scanId}`);
    }
  }, [concluido, scanId, router]);

  const vars = {
    "--scan-fg": "var(--bp-black, #1e1e1e)",
    "--scan-bg": "var(--bp-offwhite, #fbf7f4)",
    "--scan-border": "rgba(30,30,30,0.1)",
    "--scan-muted": "rgba(30,30,30,0.45)",
  } as React.CSSProperties;

  if (erro) {
    return (
      <div style={vars} className="flex flex-col items-center gap-6 text-center">
        <p
          style={{
            fontFamily: "var(--font-inter, sans-serif)",
            fontSize: 14,
            lineHeight: 1.7,
            color: "var(--scan-muted)",
            maxWidth: 400,
          }}
        >
          {data?.erro_mensagem === "face_nao_detectada"
            ? "Não conseguimos detectar seu rosto na imagem. Tente novamente em boa iluminação, de frente para a câmera."
            : "Ocorreu um problema durante a análise. Verifique sua conexão e tente novamente."}
        </p>
        <button
          type="button"
          onClick={() => router.push("/skin-scan/foco")}
          style={{
            fontFamily: "var(--font-inter, sans-serif)",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            padding: "14px 32px",
            background: "var(--scan-fg)",
            color: "var(--scan-bg)",
            border: "none",
            cursor: "pointer",
          }}
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div style={vars}>
      {/* Lista de etapas */}
      <ol className="flex flex-col gap-5" aria-label="Progresso da análise">
        {ETAPAS.map((etapa, idx) => {
          const done = idx <= currentStep;
          const active = idx === currentStep + 1;

          return (
            <li key={etapa.label} className="flex items-center gap-4">
              {/* Indicador */}
              <span
                aria-hidden
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  border: `1px solid ${done ? "var(--scan-fg)" : "var(--scan-border)"}`,
                  background: done ? "var(--scan-fg)" : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "background 400ms, border-color 400ms",
                }}
              >
                {done ? (
                  <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                    <path
                      d="M1 3l2 2 4-4"
                      stroke="var(--scan-bg)"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : active ? (
                  /* Pulsing dot para etapa ativa */
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "var(--scan-fg)",
                      animation: "pulse 1.2s ease-in-out infinite",
                    }}
                  />
                ) : null}
              </span>

              {/* Label */}
              <span
                style={{
                  fontFamily: "var(--font-inter, sans-serif)",
                  fontSize: 13,
                  fontWeight: done ? 500 : 400,
                  color: done ? "var(--scan-fg)" : "var(--scan-muted)",
                  letterSpacing: "0.01em",
                  transition: "color 400ms",
                }}
                aria-current={active ? "step" : undefined}
              >
                {etapa.label}
              </span>
            </li>
          );
        })}
      </ol>

      {/* Aviso de timeout */}
      {timedOut && !erro && (
        <p
          role="status"
          style={{
            fontFamily: "var(--font-inter, sans-serif)",
            fontSize: 12,
            color: "var(--scan-muted)",
            marginTop: 32,
            textAlign: "center",
            lineHeight: 1.6,
          }}
        >
          Está demorando mais que o esperado — aguarde mais alguns segundos.
        </p>
      )}

      {/* Animação CSS inline */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.75); }
        }
      `}</style>
    </div>
  );
}
