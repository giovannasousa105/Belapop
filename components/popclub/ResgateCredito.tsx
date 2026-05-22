"use client";

import { useCallback, useState } from "react";

interface ResgateCreditoProps {
  pontos_disponiveis: number;
  onSucesso?: () => void;
}

const PONTOS_MINIMOS = 100;
const TAXA_BRL_POR_PONTO = 0.10; // 100 pts = R$ 10 → 1 pt = R$ 0.10

function formatarBRL(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function ResgateCredito({ pontos_disponiveis, onSucesso }: ResgateCreditoProps) {
  const max = Math.floor(pontos_disponiveis / PONTOS_MINIMOS) * PONTOS_MINIMOS;
  const [pontos, setPontos] = useState(Math.min(PONTOS_MINIMOS, max));
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  const valorBRL = pontos * TAXA_BRL_POR_PONTO;
  const saldoApos = pontos_disponiveis - pontos;

  const incrementar = useCallback(() => {
    setPontos((v) => Math.min(v + PONTOS_MINIMOS, max));
  }, [max]);

  const decrementar = useCallback(() => {
    setPontos((v) => Math.max(v - PONTOS_MINIMOS, PONTOS_MINIMOS));
  }, []);

  const handleResgatar = useCallback(async () => {
    if (enviando || pontos < PONTOS_MINIMOS) return;
    setEnviando(true);
    setErro(null);

    try {
      const res = await fetch("/api/popclub/resgatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pontos }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? `Erro ${res.status}`);
      }

      setSucesso(true);
      onSucesso?.();

      // Reset após 3s
      setTimeout(() => {
        setSucesso(false);
        setPontos(PONTOS_MINIMOS);
      }, 3000);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível resgatar os pontos.");
    } finally {
      setEnviando(false);
    }
  }, [enviando, pontos, onSucesso]);

  // Sem pontos suficientes para resgate
  if (pontos_disponiveis < PONTOS_MINIMOS) {
    const pontosNecessarios = PONTOS_MINIMOS - pontos_disponiveis;
    return (
      <section
        style={{
          padding: "1.5rem 1.25rem",
          background: "var(--color-background-primary, #fff)",
          border: "0.5px solid var(--color-border-tertiary, rgba(0,0,0,0.08))",
          borderRadius: "var(--border-radius-lg, 16px)",
        }}
      >
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "rgba(0,0,0,0.38)",
            marginBottom: 12,
          }}
        >
          Resgatar créditos
        </p>
        <p style={{ fontSize: 14, color: "rgba(0,0,0,0.65)", lineHeight: 1.6 }}>
          Acumule mais{" "}
          <strong style={{ color: "rgba(0,0,0,0.82)" }}>
            {pontosNecessarios} pts
          </strong>{" "}
          para seu primeiro resgate.
        </p>
        <p style={{ fontSize: 12, color: "rgba(0,0,0,0.4)", marginTop: 6 }}>
          100 pts = R$ 10,00 em créditos aplicáveis no checkout.
        </p>
      </section>
    );
  }

  if (sucesso) {
    return (
      <section
        style={{
          padding: "1.5rem 1.25rem",
          background: "var(--color-background-primary, #fff)",
          border: "0.5px solid var(--color-border-tertiary, rgba(0,0,0,0.08))",
          borderRadius: "var(--border-radius-lg, 16px)",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}>
          {formatarBRL(valorBRL)} em crédito gerado
        </p>
        <p style={{ fontSize: 12, color: "rgba(0,0,0,0.45)" }}>
          Disponível no próximo checkout.
        </p>
      </section>
    );
  }

  return (
    <section
      style={{
        padding: "1.5rem 1.25rem",
        background: "var(--color-background-primary, #fff)",
        border: "0.5px solid var(--color-border-tertiary, rgba(0,0,0,0.08))",
        borderRadius: "var(--border-radius-lg, 16px)",
      }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "rgba(0,0,0,0.38)",
          marginBottom: 16,
        }}
      >
        Resgatar créditos
      </p>

      {/* Stepper */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <p style={{ fontSize: 13, color: "rgba(0,0,0,0.55)" }}>Quantos pontos resgatar?</p>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            type="button"
            onClick={decrementar}
            disabled={pontos <= PONTOS_MINIMOS}
            aria-label="Diminuir pontos"
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "0.5px solid rgba(0,0,0,0.12)",
              background: "transparent",
              fontSize: 18,
              lineHeight: 1,
              cursor: pontos <= PONTOS_MINIMOS ? "not-allowed" : "pointer",
              color: pontos <= PONTOS_MINIMOS ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.7)",
            }}
          >
            −
          </button>
          <span
            style={{
              minWidth: 70,
              textAlign: "center",
              fontSize: 16,
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {pontos.toLocaleString("pt-BR")} pts
          </span>
          <button
            type="button"
            onClick={incrementar}
            disabled={pontos >= max}
            aria-label="Aumentar pontos"
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "0.5px solid rgba(0,0,0,0.12)",
              background: "transparent",
              fontSize: 18,
              lineHeight: 1,
              cursor: pontos >= max ? "not-allowed" : "pointer",
              color: pontos >= max ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.7)",
            }}
          >
            +
          </button>
        </div>
      </div>

      {/* Cálculo */}
      <div
        style={{
          padding: "12px 14px",
          background: "rgba(0,0,0,0.02)",
          borderRadius: 10,
          marginBottom: 14,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <p style={{ fontSize: 18, fontWeight: 600 }}>{formatarBRL(valorBRL)}</p>
          <p style={{ fontSize: 11, color: "rgba(0,0,0,0.4)", marginTop: 2 }}>em crédito</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ fontSize: 13, color: "rgba(0,0,0,0.55)" }}>
            Saldo após: {saldoApos.toLocaleString("pt-BR")} pts
          </p>
          <p style={{ fontSize: 11, color: "rgba(0,0,0,0.35)", marginTop: 2 }}>
            100 pts = R$ 10,00
          </p>
        </div>
      </div>

      {erro && (
        <p style={{ fontSize: 12, color: "var(--color-text-warning, #8a6400)", marginBottom: 10 }}>
          {erro}
        </p>
      )}

      <button
        type="button"
        onClick={() => void handleResgatar()}
        disabled={enviando}
        style={{
          width: "100%",
          minHeight: 44,
          borderRadius: 10,
          border: "none",
          background: enviando ? "rgba(0,0,0,0.12)" : "rgba(0,0,0,0.86)",
          color: enviando ? "rgba(0,0,0,0.4)" : "#fff",
          fontSize: 13,
          fontWeight: 600,
          cursor: enviando ? "not-allowed" : "pointer",
          letterSpacing: "0.04em",
          transition: "background 150ms",
        }}
      >
        {enviando ? "Gerando crédito..." : `Resgatar ${formatarBRL(valorBRL)}`}
      </button>
    </section>
  );
}
