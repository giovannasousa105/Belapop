"use client";

import type { TierEnum } from "@/hooks/usePopClubStatus";

interface ProgressoTierProps {
  tier_atual: TierEnum;
  pontos_acumulados_12m: number;
  proximo_tier: { tier: TierEnum; pts_necessarios: number } | null;
  em_risco_rebaixamento: boolean;
  pts_para_manter_tier: number;
  data_avaliacao: string | null;
}

const TIER_LIMIARES: Record<TierEnum, number> = { ESSENCIAL: 0, PREMIUM: 500, LUXO: 1500 };

function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "numeric", month: "long" });
}

export function ProgressoTier({
  tier_atual,
  pontos_acumulados_12m,
  proximo_tier,
  em_risco_rebaixamento,
  pts_para_manter_tier,
  data_avaliacao,
}: ProgressoTierProps) {
  const isTierMax = tier_atual === "LUXO";

  // Calcular proporção da barra
  let progresso = 0;
  let limiarMin = TIER_LIMIARES[tier_atual];
  let limiarMax = proximo_tier ? TIER_LIMIARES[proximo_tier.tier] : limiarMin;

  if (isTierMax) {
    progresso = 1;
    limiarMin = TIER_LIMIARES.PREMIUM;
    limiarMax = TIER_LIMIARES.LUXO;
  } else if (limiarMax > limiarMin) {
    progresso = Math.min(
      1,
      Math.max(0, (pontos_acumulados_12m - limiarMin) / (limiarMax - limiarMin))
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
          marginBottom: 14,
        }}
      >
        {isTierMax ? "Tier máximo" : `Em direção ao ${proximo_tier?.tier.toLowerCase() ?? ""}`}
      </p>

      {/* Barra de progresso */}
      <div
        style={{
          height: 4,
          borderRadius: 99,
          background: "var(--color-background-secondary, rgba(0,0,0,0.06))",
          overflow: "hidden",
          marginBottom: 10,
        }}
        role="progressbar"
        aria-valuenow={pontos_acumulados_12m}
        aria-valuemin={limiarMin}
        aria-valuemax={limiarMax}
      >
        <div
          style={{
            height: "100%",
            width: `${progresso * 100}%`,
            borderRadius: 99,
            background: "var(--color-text-primary, #1e1e1e)",
            transition: "width 600ms ease-out",
          }}
        />
      </div>

      {/* Label de pontos — SEMPRE explicita que são os 12m, não os disponíveis */}
      <p style={{ fontSize: 13, color: "rgba(0,0,0,0.65)", marginBottom: 4 }}>
        <strong style={{ fontWeight: 600, color: "rgba(0,0,0,0.82)" }}>
          {pontos_acumulados_12m.toLocaleString("pt-BR")} pts
        </strong>{" "}
        acumulados nos últimos 12 meses
      </p>

      {!isTierMax && proximo_tier && (
        <p style={{ fontSize: 12, color: "rgba(0,0,0,0.42)" }}>
          Faltam{" "}
          <strong style={{ color: "rgba(0,0,0,0.65)" }}>
            {proximo_tier.pts_necessarios.toLocaleString("pt-BR")} pts
          </strong>{" "}
          para {proximo_tier.tier.charAt(0) + proximo_tier.tier.slice(1).toLowerCase()}
        </p>
      )}

      {isTierMax && (
        <p style={{ fontSize: 12, color: "rgba(0,0,0,0.42)" }}>
          Mantendo com {pontos_acumulados_12m.toLocaleString("pt-BR")} pts acumulados este ano
        </p>
      )}

      {/* Aviso de risco de rebaixamento */}
      {em_risco_rebaixamento && (
        <div
          role="alert"
          style={{
            marginTop: 14,
            padding: "10px 14px",
            background: "rgba(180, 130, 0, 0.06)",
            border: "0.5px solid rgba(180, 130, 0, 0.22)",
            borderRadius: 10,
          }}
        >
          <p
            style={{
              fontSize: 12,
              lineHeight: 1.6,
              color: "var(--color-text-warning, #8a6400)",
            }}
          >
            Você precisa de{" "}
            <strong>{pts_para_manter_tier.toLocaleString("pt-BR")} pts</strong> até{" "}
            {data_avaliacao ? formatarData(data_avaliacao) : "a data de avaliação"} para
            manter o tier {tier_atual.charAt(0) + tier_atual.slice(1).toLowerCase()}.
          </p>
          <a
            href="#ganhar-pontos"
            style={{
              display: "inline-block",
              marginTop: 6,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--color-text-warning, #8a6400)",
              textDecoration: "none",
            }}
          >
            Como ganhar pontos
          </a>
        </div>
      )}
    </section>
  );
}
