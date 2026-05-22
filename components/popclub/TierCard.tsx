"use client";

import type { TierEnum } from "@/hooks/usePopClubStatus";

interface TierCardProps {
  tier: TierEnum;
  pontos_disponiveis: number;
  creditos_disponiveis: number;
  data_entrada: string;
}

const JANELA_HORAS: Record<TierEnum, number> = { ESSENCIAL: 24, PREMIUM: 48, LUXO: 72 };

function formatarDataEntrada(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

function formatarCreditos(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function TierCard({
  tier,
  pontos_disponiveis,
  creditos_disponiveis,
  data_entrada,
}: TierCardProps) {
  const horas = JANELA_HORAS[tier];

  return (
    <section
      style={{
        padding: "1.5rem 1.25rem",
        background: "var(--color-background-primary, #fff)",
        border: "0.5px solid var(--color-border-tertiary, rgba(0,0,0,0.08))",
        borderRadius: "var(--border-radius-lg, 16px)",
      }}
    >
      {/* Tier */}
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "rgba(0,0,0,0.38)",
          marginBottom: 6,
        }}
      >
        PopClub
      </p>
      <p
        style={{
          fontSize: 28,
          fontWeight: 500,
          letterSpacing: "-0.02em",
          fontFamily: "var(--font-playfair, Georgia, serif)",
          marginBottom: 20,
        }}
      >
        {tier.charAt(0) + tier.slice(1).toLowerCase()}
      </p>

      {/* Métricas principais */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1rem",
          marginBottom: 20,
        }}
      >
        <div>
          <p
            style={{ fontSize: 11, color: "rgba(0,0,0,0.4)", letterSpacing: "0.06em", marginBottom: 4 }}
          >
            Pontos disponíveis
          </p>
          <p style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.01em" }}>
            {pontos_disponiveis.toLocaleString("pt-BR")}
          </p>
        </div>
        <div>
          <p
            style={{ fontSize: 11, color: "rgba(0,0,0,0.4)", letterSpacing: "0.06em", marginBottom: 4 }}
          >
            Créditos disponíveis
          </p>
          <p style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.01em" }}>
            {creditos_disponiveis > 0 ? formatarCreditos(creditos_disponiveis) : "—"}
          </p>
        </div>
      </div>

      {/* Rodapé do card */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: 16,
          borderTop: "0.5px solid rgba(0,0,0,0.06)",
        }}
      >
        <p style={{ fontSize: 12, color: "rgba(0,0,0,0.4)" }}>
          Membro desde {formatarDataEntrada(data_entrada)}
        </p>
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.08em",
            color: "rgba(0,0,0,0.55)",
          }}
        >
          +{horas}h de acesso antecipado
        </p>
      </div>
    </section>
  );
}
