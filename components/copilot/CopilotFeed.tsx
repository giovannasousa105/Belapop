"use client";

import { useCallback, useState } from "react";

import { useCopilotFeed, type CopilotInteracaoFeed } from "@/hooks/useCopilotFeed";
import type { RespostaTipo } from "@/lib/copilot/copilotTypes";
import { CopilotCard } from "./CopilotCard";
import { CheckinRotina } from "./CheckinRotina";
import { CheckinSemanal } from "./CheckinSemanal";
import { NudgeRecompra } from "./NudgeRecompra";
import { LembreteScan } from "./LembreteScan";
import { StreakBadge } from "./StreakBadge";

// ─── Skeleton (reserva espaço para evitar layout shift) ──────────────────────

function CopilotSkeleton() {
  return (
    <div
      aria-hidden
      style={{
        height: 100,
        borderRadius: 16,
        background: "rgba(0,0,0,0.04)",
        marginBottom: "0.75rem",
        animation: "copilotPulse 1.6s ease-in-out infinite",
      }}
    />
  );
}

// ─── Roteador de conteúdo por tipo de interação ───────────────────────────────

function CardContent({
  interacao,
  onResponder,
  onCollapse,
  onStreakIncrementado,
}: {
  interacao: CopilotInteracaoFeed;
  onResponder: (tipo: RespostaTipo, valor: Record<string, unknown>) => Promise<void>;
  onCollapse: (afterMs?: number) => void;
  onStreakIncrementado?: () => void;
}) {
  switch (interacao.tipo) {
    case "LEMBRETE_MANHA":
    case "LEMBRETE_NOITE":
      return (
        <CheckinRotina
          interacao={interacao}
          onResponder={onResponder}
          onCollapse={onCollapse}
          onStreakIncrementado={onStreakIncrementado}
        />
      );

    case "CHECKIN_SEMANAL":
      return (
        <CheckinSemanal
          interacao={interacao}
          onResponder={onResponder}
          onCollapse={onCollapse}
        />
      );

    case "NUDGE_RECOMPRA":
      return (
        <NudgeRecompra
          interacao={interacao}
          onResponder={onResponder}
          onCollapse={onCollapse}
        />
      );

    case "LEMBRETE_SCAN":
      return (
        <LembreteScan
          interacao={interacao}
          onResponder={onResponder}
          onCollapse={onCollapse}
        />
      );

    default:
      // ALERTA_REGRESSAO, MARCO_ALCANCADO, BOAS_VINDAS — card informativo simples
      return (
        <div>
          {interacao.payload?.titulo && (
            <p
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "rgba(0,0,0,0.78)",
                marginBottom: 4,
              }}
            >
              {interacao.payload.titulo}
            </p>
          )}
          {interacao.payload?.corpo && (
            <p
              style={{
                fontFamily: "var(--font-playfair, Georgia, serif)",
                fontSize: 14,
                lineHeight: 1.65,
                color: "rgba(0,0,0,0.65)",
                fontStyle: "italic",
              }}
            >
              {interacao.payload.corpo}
            </p>
          )}
        </div>
      );
  }
}

// ─── CopilotFeed principal ────────────────────────────────────────────────────

export function CopilotFeed() {
  const { interacoes, streak, isLoading, responder, descartar } = useCopilotFeed();
  const [streakPendente, setStreakPendente] = useState(false);

  const handleStreakIncrementado = useCallback(() => {
    if (streak >= 2) setStreakPendente(true); // streak >= 2 = pelo menos 2 dias seguidos
  }, [streak]);

  if (isLoading) {
    return (
      <section aria-label="Skin Copilot" style={{ padding: "0 0 0.25rem" }}>
        <CopilotSkeleton />
      </section>
    );
  }

  if (!interacoes.length) return null;

  return (
    <>
      {/* Keyframe do skeleton — injetado inline */}
      <style>{`
        @keyframes copilotPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      <section
        aria-label="Skin Copilot"
        style={{ padding: "0 0 0.25rem" }}
      >
        {/* StreakBadge aparece acima dos cards após check-in bem-sucedido */}
        {streakPendente && (
          <StreakBadge
            streak={streak + 1}
            onDone={() => setStreakPendente(false)}
          />
        )}

        {interacoes.map((interacao) => (
          <CopilotCard
            key={interacao.id}
            interacao={interacao}
            onDescartar={() => descartar(interacao.id)}
          >
            {({ onCollapse }) => (
              <CardContent
                interacao={interacao}
                onCollapse={onCollapse}
                onResponder={(tipo, valor) => responder(interacao.id, tipo, valor)}
                onStreakIncrementado={handleStreakIncrementado}
              />
            )}
          </CopilotCard>
        ))}
      </section>
    </>
  );
}
