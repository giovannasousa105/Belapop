"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useState } from "react";
import type { CopilotInteracaoFeed, CopilotProdutoFeed } from "@/hooks/useCopilotFeed";
import type { RespostaTipo } from "@/lib/copilot/copilotTypes";

interface NudgeRecompraProps {
  interacao: CopilotInteracaoFeed;
  onResponder: (tipo: RespostaTipo, valor: Record<string, unknown>) => Promise<void>;
  onCollapse: (afterMs?: number) => void;
}

type FluxoState = "idle" | "confirmando" | "processando";

function formatPreco(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function BarraProgresso({
  total,
  restante,
}: {
  total: number;
  restante: number;
}) {
  const preenchido = Math.max(0, Math.min(1, (total - restante) / total));
  const emAlerta = restante <= 5;

  return (
    <div
      style={{
        height: 3,
        background: "rgba(0,0,0,0.06)",
        borderRadius: 99,
        overflow: "hidden",
        marginTop: "0.5rem",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${preenchido * 100}%`,
          borderRadius: 99,
          background: emAlerta
            ? "var(--color-text-warning, #ff9f0a)"
            : "rgba(52, 199, 89, 0.72)",
          transition: "width 400ms ease-out",
        }}
      />
    </div>
  );
}

export function NudgeRecompra({ interacao, onResponder, onCollapse }: NudgeRecompraProps) {
  const [fluxo, setFluxo] = useState<FluxoState>("idle");

  const produto = interacao.produto as CopilotProdutoFeed | undefined;
  const corpo = interacao.payload?.corpo ?? "Seu produto está próximo do fim.";
  const diasRestantes = produto?.dias_restantes ?? null;
  const duracaoTotal = produto?.duracao_media_dias ?? null;

  const handleReporAgora = useCallback(() => {
    setFluxo("confirmando");
  }, []);

  const handleConfirmar = useCallback(async () => {
    if (!produto) return;
    setFluxo("processando");

    await onResponder("RECOMPRA_ACEITA", { produto_id: produto.id });
    onCollapse();

    // Navegar para PDP com contexto de scan — Stripe 1-click integrado em etapa futura
    window.location.href = `/produto/${produto.slug}?nudge=recompra`;
  }, [produto, onResponder, onCollapse]);

  const handleLembrarSemana = useCallback(async () => {
    if (!produto) return;
    await onResponder("RECOMPRA_RECUSADA", { produto_id: produto.id });
    onCollapse();
  }, [produto, onResponder, onCollapse]);

  if (!produto) {
    return (
      <p style={{ fontSize: 13, color: "rgba(0,0,0,0.55)" }}>{corpo}</p>
    );
  }

  return (
    <div>
      {/* Mini card do produto */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          marginBottom: "0.625rem",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 10,
            overflow: "hidden",
            flexShrink: 0,
            background: "rgba(0,0,0,0.04)",
          }}
        >
          {produto.hero_image_url ? (
            <img
              src={produto.hero_image_url}
              alt={produto.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : null}
        </div>

        <div style={{ minWidth: 0 }}>
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "rgba(0,0,0,0.82)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {produto.name}
          </p>
          {diasRestantes !== null && (
            <p style={{ fontSize: 11, color: "rgba(0,0,0,0.4)", marginTop: 2 }}>
              ~{diasRestantes} dias restantes
            </p>
          )}
        </div>
      </div>

      {/* Barra de progresso de uso */}
      {diasRestantes !== null && duracaoTotal !== null && (
        <BarraProgresso total={duracaoTotal} restante={diasRestantes} />
      )}

      {/* Mensagem gerada pelo Claude */}
      <p
        style={{
          fontSize: 13,
          lineHeight: 1.55,
          color: "rgba(0,0,0,0.65)",
          margin: "0.625rem 0",
        }}
      >
        {corpo}
      </p>

      {/* CTAs */}
      {fluxo === "idle" && (
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            type="button"
            onClick={handleReporAgora}
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
            }}
          >
            Repor agora
          </button>
          <button
            type="button"
            onClick={handleLembrarSemana}
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
            Lembrar em 1 semana
          </button>
        </div>
      )}

      {fluxo === "confirmando" && (
        <div
          style={{
            background: "rgba(0,0,0,0.03)",
            borderRadius: 10,
            padding: "0.625rem 0.75rem",
          }}
        >
          <p style={{ fontSize: 12, color: "rgba(0,0,0,0.65)", marginBottom: "0.5rem" }}>
            Repor <strong>{produto.name}</strong> — {formatPreco(produto.price_cents)}
          </p>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              onClick={() => void handleConfirmar()}
              style={{
                flex: 1,
                minHeight: 36,
                borderRadius: 8,
                border: "none",
                background: "rgba(0,0,0,0.86)",
                color: "#fff",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Confirmar
            </button>
            <button
              type="button"
              onClick={() => setFluxo("idle")}
              style={{
                flex: 1,
                minHeight: 36,
                borderRadius: 8,
                border: "0.5px solid rgba(0,0,0,0.1)",
                background: "transparent",
                color: "rgba(0,0,0,0.45)",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {fluxo === "processando" && (
        <p style={{ fontSize: 12, color: "rgba(0,0,0,0.38)", textAlign: "center" }}>
          Redirecionando…
        </p>
      )}
    </div>
  );
}
