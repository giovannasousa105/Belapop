"use client";

import Link from "next/link";
import { useCallback } from "react";
import type { CopilotInteracaoFeed } from "@/hooks/useCopilotFeed";
import type { RespostaTipo } from "@/lib/copilot/copilotTypes";

interface LembreteScanProps {
  interacao: CopilotInteracaoFeed;
  onResponder: (tipo: RespostaTipo, valor: Record<string, unknown>) => Promise<void>;
  onCollapse: (afterMs?: number) => void;
}

// Barras decorativas representando os marcadores do último scan
// Valores são neutros (sem acesso aos scores reais no feed)
const MARCADORES_PREVIEW = [
  { label: "Hidratação", width: "68%" },
  { label: "Textura", width: "54%" },
  { label: "Uniformidade", width: "72%" },
] as const;

export function LembreteScan({ interacao, onResponder, onCollapse }: LembreteScanProps) {
  const seed = interacao.seed_snapshot ?? {};
  const diasDesdeUltimoScan = (seed.diasDesdeUltimoScan as number | undefined) ?? null;

  const titulo = interacao.payload?.titulo ?? "Seu próximo scan está próximo";
  const corpo = interacao.payload?.corpo ?? "Continue acompanhando sua evolução.";

  const handleEmOutraHora = useCallback(async () => {
    await onResponder("SCAN_AGENDADO", { data_pretendida: null });
    onCollapse();
  }, [onResponder, onCollapse]);

  return (
    <div>
      <p
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "rgba(0,0,0,0.78)",
          marginBottom: 4,
        }}
      >
        {titulo}
      </p>

      <p
        style={{
          fontSize: 12,
          color: "rgba(0,0,0,0.45)",
          lineHeight: 1.5,
          marginBottom: "0.75rem",
        }}
      >
        {diasDesdeUltimoScan != null
          ? `Último scan há ${diasDesdeUltimoScan} dias. ${corpo}`
          : corpo}
      </p>

      {/* Mini preview de métricas — barras decorativas */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 5,
          marginBottom: "0.75rem",
        }}
      >
        {MARCADORES_PREVIEW.map(({ label, width }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span
              style={{
                fontSize: 10,
                color: "rgba(0,0,0,0.35)",
                width: 68,
                flexShrink: 0,
                letterSpacing: "0.04em",
              }}
            >
              {label}
            </span>
            <div
              style={{
                flex: 1,
                height: 3,
                background: "rgba(0,0,0,0.06)",
                borderRadius: 99,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width,
                  background: "rgba(0,0,0,0.18)",
                  borderRadius: 99,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* CTAs */}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <Link
          href="/skin-scan/foco"
          style={{
            flex: 1,
            minHeight: 40,
            borderRadius: 10,
            border: "none",
            background: "rgba(0,0,0,0.86)",
            color: "#fff",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            letterSpacing: "0.04em",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textDecoration: "none",
          }}
        >
          Fazer análise agora
        </Link>
        <button
          type="button"
          onClick={() => void handleEmOutraHora()}
          style={{
            flex: 1,
            minHeight: 40,
            borderRadius: 10,
            border: "0.5px solid rgba(0,0,0,0.1)",
            background: "transparent",
            color: "rgba(0,0,0,0.45)",
            fontSize: 12,
            cursor: "pointer",
          }}
        >
          Em outra hora
        </button>
      </div>
    </div>
  );
}
