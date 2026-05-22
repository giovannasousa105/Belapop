"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/lib/CartContext";
import type { RotinaResult } from "@/lib/skinScan/rotinaBuilder";

// ─── Badge de compatibilidade ─────────────────────────────────────────────────

function CompatBadge({ score }: { score: number }) {
  return (
    <span
      style={{
        fontFamily: "var(--font-inter, sans-serif)",
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        padding: "3px 8px",
        border: "1px solid var(--scan-border)",
        color: score >= 80 ? "var(--scan-fg)" : "var(--scan-muted)",
        background: "transparent",
        whiteSpace: "nowrap",
      }}
    >
      {score}% compatível
    </span>
  );
}

// ─── Card de passo ────────────────────────────────────────────────────────────

interface PassoCardProps {
  passo: RotinaResult["passos"][number];
  scanId: string;
  onAddToCart: (produtoId: string) => void;
}

function PassoCard({ passo, scanId, onAddToCart }: PassoCardProps) {
  return (
    <div
      style={{
        padding: "20px 0",
        borderBottom: "1px solid var(--scan-border)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      {/* Número de ordem + passo */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span
          style={{
            fontFamily: "var(--font-inter, sans-serif)",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.2em",
            color: "var(--scan-muted)",
            minWidth: 24,
          }}
        >
          {String(passo.ordem).padStart(2, "0")}
        </span>
        <span
          style={{
            fontFamily: "var(--font-inter, sans-serif)",
            fontSize: 10,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--scan-muted)",
          }}
        >
          {passo.passo}
        </span>
      </div>

      {/* Nome do produto + badge */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <p
          style={{
            fontFamily: "var(--font-playfair, serif)",
            fontSize: 16,
            fontWeight: 500,
            color: "var(--scan-fg)",
            lineHeight: 1.2,
            flex: 1,
            minWidth: 160,
          }}
        >
          {passo.produto_nome}
        </p>
        <CompatBadge score={passo.score_compatibilidade} />
      </div>

      {/* Justificativa */}
      <p
        style={{
          fontFamily: "var(--font-inter, sans-serif)",
          fontSize: 12,
          color: "var(--scan-muted)",
          lineHeight: 1.6,
        }}
      >
        {passo.justificativa_curta}
      </p>

      {/* Ações */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link
          href={`/produto/${passo.produto_id}?scan_id=${scanId}`}
          style={{
            fontFamily: "var(--font-inter, sans-serif)",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--scan-fg)",
            textDecoration: "underline",
            textUnderlineOffset: 3,
          }}
        >
          Ver produto
        </Link>

        <button
          type="button"
          onClick={() => onAddToCart(passo.produto_id)}
          style={{
            fontFamily: "var(--font-inter, sans-serif)",
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--scan-muted)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 0,
            textDecoration: "underline",
            textUnderlineOffset: 3,
          }}
        >
          + Carrinho
        </button>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

interface RotinaDisplayProps {
  rotinasManha: RotinaResult | null;
  rotinasNoite: RotinaResult | null;
  scanId: string;
}

export function RotinaDisplay({
  rotinasManha,
  rotinasNoite,
  scanId,
}: RotinaDisplayProps) {
  const { addItem } = useCart();
  const [tab, setTab] = useState<"manha" | "noite">("manha");
  const [adicionandoRotina, setAdicionandoRotina] = useState(false);
  const [rotinaAdicionada, setRotinaAdicionada] = useState(false);

  const rotinaAtiva = tab === "manha" ? rotinasManha : rotinasNoite;

  const handleAddSingle = (produtoId: string) => {
    addItem(produtoId, 1);
  };

  // Adiciona produtos da rotina em sequência para evitar race conditions no lote
  const handleAdicionarRotina = async () => {
    if (!rotinaAtiva || adicionandoRotina) return;
    setAdicionandoRotina(true);

    for (const passo of rotinaAtiva.passos) {
      addItem(passo.produto_id, 1);
      // Pequeno delay entre cada addItem — garante atualização sequencial do estado
      await new Promise<void>((r) => setTimeout(r, 60));
    }

    setAdicionandoRotina(false);
    setRotinaAdicionada(true);
    setTimeout(() => setRotinaAdicionada(false), 3000);
  };

  const vars = {
    "--scan-fg": "var(--bp-black, #1e1e1e)",
    "--scan-bg": "var(--bp-offwhite, #fbf7f4)",
    "--scan-border": "rgba(30,30,30,0.1)",
    "--scan-muted": "rgba(30,30,30,0.45)",
  } as React.CSSProperties;

  return (
    <section style={vars}>
      {/* Título */}
      <p
        style={{
          fontFamily: "var(--font-inter, sans-serif)",
          fontSize: 11,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "var(--scan-muted)",
          marginBottom: 20,
        }}
      >
        Sua rotina personalizada
      </p>

      {/* Tabs manhã / noite */}
      <div
        role="tablist"
        aria-label="Período da rotina"
        style={{
          display: "flex",
          borderBottom: "1px solid var(--scan-border)",
          marginBottom: 4,
        }}
      >
        {(["manha", "noite"] as const).map((periodo) => (
          <button
            key={periodo}
            role="tab"
            aria-selected={tab === periodo}
            onClick={() => {
              setTab(periodo);
              setRotinaAdicionada(false);
            }}
            style={{
              fontFamily: "var(--font-inter, sans-serif)",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              padding: "12px 24px",
              background: "transparent",
              border: "none",
              borderBottom: tab === periodo ? "2px solid var(--scan-fg)" : "2px solid transparent",
              color: tab === periodo ? "var(--scan-fg)" : "var(--scan-muted)",
              cursor: "pointer",
              marginBottom: -1,
              transition: "color 200ms, border-color 200ms",
            }}
          >
            {periodo === "manha" ? "Manhã" : "Noite"}
          </button>
        ))}
      </div>

      {/* Lista de passos */}
      {!rotinaAtiva || rotinaAtiva.passos.length === 0 ? (
        <p
          style={{
            fontFamily: "var(--font-inter, sans-serif)",
            fontSize: 13,
            color: "var(--scan-muted)",
            padding: "24px 0",
          }}
        >
          Nenhum produto disponível para esta rotina no momento.
        </p>
      ) : (
        <div role="tabpanel">
          {rotinaAtiva.passos.map((passo) => (
            <PassoCard
              key={passo.produto_id}
              passo={passo}
              scanId={scanId}
              onAddToCart={handleAddSingle}
            />
          ))}

          {/* Adicionar rotina completa */}
          <div style={{ paddingTop: 24 }}>
            <button
              type="button"
              onClick={handleAdicionarRotina}
              disabled={adicionandoRotina || rotinaAdicionada}
              style={{
                fontFamily: "var(--font-inter, sans-serif)",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                padding: "14px 28px",
                background: rotinaAdicionada ? "transparent" : "var(--scan-fg)",
                color: rotinaAdicionada ? "var(--scan-muted)" : "var(--scan-bg)",
                border: rotinaAdicionada ? "1px solid var(--scan-border)" : "none",
                cursor: adicionandoRotina ? "wait" : "pointer",
                transition: "background 200ms, color 200ms",
              }}
            >
              {adicionandoRotina
                ? "Adicionando..."
                : rotinaAdicionada
                  ? "Rotina adicionada ao carrinho"
                  : "Adicionar rotina completa ao carrinho"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
