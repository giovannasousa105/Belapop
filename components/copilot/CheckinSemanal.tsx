"use client";

import { useCallback, useState } from "react";
import type { CopilotInteracaoFeed } from "@/hooks/useCopilotFeed";
import type { RespostaTipo } from "@/lib/copilot/copilotTypes";

interface CheckinSemanalProps {
  interacao: CopilotInteracaoFeed;
  onResponder: (tipo: RespostaTipo, valor: Record<string, unknown>) => Promise<void>;
  onCollapse: (afterMs?: number) => void;
}

const OPCOES: { label: string; nota: number }[] = [
  { label: "Ótima", nota: 5 },
  { label: "Boa", nota: 4 },
  { label: "Normal", nota: 3 },
  { label: "Sensível", nota: 2 },
  { label: "Com irritação", nota: 1 },
];

export function CheckinSemanal({ interacao, onResponder, onCollapse }: CheckinSemanalProps) {
  const [selecionada, setSelecionada] = useState<number | null>(null);
  const [confirmada, setConfirmada] = useState(false);

  const corpo =
    interacao.payload?.corpo ??
    "Como sua pele está esta semana?";

  const handleNota = useCallback(
    (nota: number) => {
      if (selecionada !== null) return;
      setSelecionada(nota);
      setConfirmada(true);

      // Colapsar após 2s (usuária lê a confirmação)
      onCollapse(2000);
      void onResponder("NOTA_PELE", { nota });
    },
    [selecionada, onCollapse, onResponder]
  );

  return (
    <div>
      {/* Mensagem gerada pelo Claude em tipografia maior */}
      <p
        style={{
          fontFamily: "var(--font-playfair, Georgia, serif)",
          fontSize: 15,
          lineHeight: 1.65,
          color: "rgba(0,0,0,0.78)",
          marginBottom: "0.875rem",
          fontStyle: "italic",
        }}
      >
        {corpo}
      </p>

      {confirmada ? (
        <p
          style={{
            fontSize: 13,
            color: "rgba(0,0,0,0.45)",
            fontWeight: 500,
          }}
        >
          Anotado. Continue com sua rotina.
        </p>
      ) : (
        <>
          <p
            style={{
              fontSize: 12,
              color: "rgba(0,0,0,0.45)",
              marginBottom: "0.625rem",
              letterSpacing: "0.04em",
            }}
          >
            Como sua pele está esta semana?
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
            {OPCOES.map(({ label, nota }) => (
              <button
                key={nota}
                type="button"
                onClick={() => handleNota(nota)}
                aria-pressed={selecionada === nota}
                style={{
                  padding: "7px 14px",
                  borderRadius: 8,
                  border:
                    selecionada === nota
                      ? "0.5px solid rgba(0,0,0,0.3)"
                      : "0.5px solid rgba(0,0,0,0.1)",
                  background:
                    selecionada === nota
                      ? "rgba(0,0,0,0.06)"
                      : "transparent",
                  fontSize: 12,
                  fontWeight: selecionada === nota ? 600 : 400,
                  color:
                    selecionada === nota
                      ? "rgba(0,0,0,0.78)"
                      : "rgba(0,0,0,0.55)",
                  cursor: selecionada !== null ? "default" : "pointer",
                  transition: "background 150ms, color 150ms, border-color 150ms",
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
