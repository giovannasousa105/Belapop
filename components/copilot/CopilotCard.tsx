"use client";

import { useCallback, useRef, useState } from "react";
import type { CopilotInteracaoFeed } from "@/hooks/useCopilotFeed";

type CardState = "visible" | "collapsing";

interface CopilotCardProps {
  interacao: CopilotInteracaoFeed;
  onDescartar: () => Promise<void>;
  /** Render prop: recebe onCollapse para o conteúdo acionar o colapso */
  children: (args: { onCollapse: (afterMs?: number) => void }) => React.ReactNode;
}

export function CopilotCard({ interacao, onDescartar, children }: CopilotCardProps) {
  const [state, setState] = useState<CardState>("visible");
  const touchStartX = useRef(0);
  const collapsingRef = useRef(false);

  const onCollapse = useCallback(
    (afterMs = 0) => {
      if (collapsingRef.current) return;
      collapsingRef.current = true;

      // Delay permite que o componente filho atualize estado visual antes de animar
      setTimeout(() => {
        setState("collapsing");
        // Após a animação (300ms) + afterMs, chamar onDescartar (revalida feed)
        setTimeout(() => void onDescartar(), 310 + afterMs);
      }, afterMs);
    },
    [onDescartar]
  );

  const handleDescartar = useCallback(() => {
    onCollapse();
  }, [onCollapse]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? 0;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const delta = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
      if (Math.abs(delta) > 80) handleDescartar();
    },
    [handleDescartar]
  );

  const collapsing = state === "collapsing";

  return (
    <div
      role="article"
      aria-label={`Interação do Copilot: ${interacao.tipo}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        maxHeight: collapsing ? 0 : 220,
        opacity: collapsing ? 0 : 1,
        overflow: "hidden",
        marginBottom: collapsing ? 0 : "0.75rem",
        transition:
          "max-height 300ms ease-out, opacity 300ms ease-out, margin-bottom 300ms ease-out",
        willChange: "max-height, opacity",
      }}
    >
      <div
        style={{
          background: "var(--color-background-primary, #ffffff)",
          border: "0.5px solid var(--color-border-tertiary, rgba(0,0,0,0.08))",
          borderRadius: "var(--border-radius-lg, 16px)",
          padding: "1rem 1.25rem",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "0.75rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              aria-hidden
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "var(--color-text-success, #34c759)",
                flexShrink: 0,
                display: "inline-block",
              }}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "rgba(0,0,0,0.38)",
              }}
            >
              Skin Copilot
            </span>
          </div>

          <button
            type="button"
            onClick={handleDescartar}
            aria-label="Descartar interação"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "2px 4px",
              color: "rgba(0,0,0,0.25)",
              fontSize: 18,
              lineHeight: 1,
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              transition: "color 150ms",
            }}
          >
            ×
          </button>
        </div>

        {/* Conteúdo específico por tipo */}
        {children({ onCollapse })}
      </div>
    </div>
  );
}
