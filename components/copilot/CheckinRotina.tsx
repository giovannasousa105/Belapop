"use client";

import { useCallback, useState } from "react";
import type { CopilotInteracaoFeed } from "@/hooks/useCopilotFeed";
import type { RespostaTipo } from "@/lib/copilot/copilotTypes";

interface CheckinRotinaProps {
  interacao: CopilotInteracaoFeed;
  onResponder: (tipo: RespostaTipo, valor: Record<string, unknown>) => Promise<void>;
  onCollapse: (afterMs?: number) => void;
  onStreakIncrementado?: () => void;
}

export function CheckinRotina({
  interacao,
  onResponder,
  onCollapse,
  onStreakIncrementado,
}: CheckinRotinaProps) {
  const [respondido, setRespondido] = useState<boolean | null>(null);
  const periodo: "manha" | "noite" =
    interacao.tipo === "LEMBRETE_MANHA" ? "manha" : "noite";

  const corpo = interacao.payload?.corpo ?? (periodo === "manha"
    ? "Como está sua rotina da manhã?"
    : "Hora de cuidar da sua pele antes de dormir.");

  const handleResposta = useCallback(
    (fez: boolean) => {
      if (respondido !== null) return; // evitar duplo clique
      // Estado local imediato — resposta visual < 100ms
      setRespondido(fez);

      if (fez) {
        onStreakIncrementado?.();
        // Colapsar após pequena pausa (200ms) para o streak badge aparecer
        onCollapse(200);
      } else {
        onCollapse();
      }

      // POST async — não bloqueia animação
      void onResponder("CHECKIN_ROTINA", { fez_rotina: fez, periodo });
    },
    [respondido, onCollapse, onResponder, onStreakIncrementado, periodo]
  );

  return (
    <div>
      <p
        style={{
          fontSize: 14,
          lineHeight: 1.6,
          color: "rgba(0,0,0,0.72)",
          marginBottom: "0.875rem",
        }}
      >
        {corpo}
      </p>

      <div style={{ display: "flex", gap: "0.5rem" }}>
        {/* Fiz minha rotina */}
        <button
          type="button"
          onClick={() => handleResposta(true)}
          disabled={respondido !== null}
          aria-pressed={respondido === true}
          style={{
            flex: 1,
            minHeight: 44,
            border: "0.5px solid rgba(0,0,0,0.1)",
            borderRadius: 10,
            background:
              respondido === true
                ? "rgba(52, 199, 89, 0.1)"
                : "var(--color-background-secondary, #f7f7f7)",
            color:
              respondido === true ? "#1a7a35" : "rgba(0,0,0,0.78)",
            fontSize: 13,
            fontWeight: 600,
            cursor: respondido !== null ? "default" : "pointer",
            transition: "background 150ms, color 150ms",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <span aria-hidden>✓</span>
          Fiz minha rotina
        </button>

        {/* Não fiz hoje */}
        <button
          type="button"
          onClick={() => handleResposta(false)}
          disabled={respondido !== null}
          aria-pressed={respondido === false}
          style={{
            flex: 1,
            minHeight: 44,
            border: "0.5px solid rgba(0,0,0,0.08)",
            borderRadius: 10,
            background: "transparent",
            color: "rgba(0,0,0,0.38)",
            fontSize: 13,
            cursor: respondido !== null ? "default" : "pointer",
            transition: "color 150ms",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <span aria-hidden>—</span>
          Não fiz hoje
        </button>
      </div>
    </div>
  );
}
