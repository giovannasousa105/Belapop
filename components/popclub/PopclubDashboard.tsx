"use client";

import Link from "next/link";

import { usePopClubStatus } from "@/hooks/usePopClubStatus";
import { TierCard } from "@/components/popclub/TierCard";
import { ProgressoTier } from "@/components/popclub/ProgressoTier";
import { ResgateCredito } from "@/components/popclub/ResgateCredito";
import { TransacoesList } from "@/components/popclub/TransacoesList";

// ─── CTA para não-membros ─────────────────────────────────────────────────────

function EntradaClubeCTA() {
  return (
    <div
      style={{
        minHeight: "60dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        textAlign: "center",
        maxWidth: 480,
        margin: "0 auto",
      }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "rgba(0,0,0,0.38)",
          marginBottom: 16,
        }}
      >
        PopClub
      </p>
      <h1
        style={{
          fontFamily: "var(--font-playfair, Georgia, serif)",
          fontSize: "clamp(1.8rem, 5vw, 2.8rem)",
          fontWeight: 500,
          lineHeight: 1.1,
          letterSpacing: "-0.02em",
          marginBottom: 16,
        }}
      >
        Sua entrada no clube é automática
      </h1>
      <p
        style={{
          fontSize: 15,
          lineHeight: 1.7,
          color: "rgba(0,0,0,0.55)",
          marginBottom: 32,
        }}
      >
        Sua primeira compra acima de R$ 150 ativa o acesso ao PopClub —
        pontos, créditos e acesso antecipado a lotes curados.
      </p>
      <Link
        href="/catalogo"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: 48,
          padding: "0 28px",
          background: "rgba(0,0,0,0.86)",
          color: "#fff",
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          textDecoration: "none",
          borderRadius: 10,
        }}
      >
        Ir para o catálogo
      </Link>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {[200, 120, 160, 240].map((h, i) => (
        <div
          key={i}
          style={{
            height: h,
            borderRadius: 16,
            background: "rgba(0,0,0,0.04)",
            animation: "popclubPulse 1.6s ease-in-out infinite",
          }}
        />
      ))}
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export function PopclubDashboard() {
  const status = usePopClubStatus();

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--bp-offwhite, #fbf7f4)",
        color: "var(--bp-black, #1e1e1e)",
        fontFamily: "var(--font-inter, sans-serif)",
      }}
    >
      <style>{`
        @keyframes popclubPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      <main style={{ maxWidth: 640, margin: "0 auto", padding: "96px 20px 80px" }}>
        {status.isLoading ? (
          <Skeleton />
        ) : !status.membro ? (
          <EntradaClubeCTA />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {/* BLOCO 1 · TierCard */}
            <TierCard
              tier={status.tier!}
              pontos_disponiveis={status.pontos_disponiveis}
              creditos_disponiveis={status.creditos_disponiveis}
              data_entrada={status.membro.data_entrada}
            />

            {/* BLOCO 2 · ProgressoTier */}
            <ProgressoTier
              tier_atual={status.tier!}
              pontos_acumulados_12m={status.pontos_acumulados_12m}
              proximo_tier={status.proximo_tier}
              em_risco_rebaixamento={status.em_risco_rebaixamento}
              pts_para_manter_tier={status.pts_para_manter_tier}
              data_avaliacao={status.data_avaliacao}
            />

            {/* BLOCO 3 · ResgateCredito */}
            <ResgateCredito
              pontos_disponiveis={status.pontos_disponiveis}
              onSucesso={status.mutate}
            />

            {/* BLOCO 4 · TransacoesList */}
            <TransacoesList transacoes={status.transacoes} />

            {/* Como ganhar pontos */}
            <section
              id="ganhar-pontos"
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
                Como ganhar pontos
              </p>
              {[
                { label: "Compra", detalhe: "1 pt por R$ 1 gasto (sem frete)" },
                { label: "Scan de pele", detalhe: "50 pts · 1x por mês" },
                { label: "Check-in de rotina", detalhe: "5 pts por dia · até 35 pts/mês" },
                { label: "Indicar uma amiga", detalhe: "200 pts após primeira compra da indicada" },
                { label: "21 dias de consistência", detalhe: "50 pts de bônus" },
              ].map(({ label, detalhe }) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 0",
                    borderBottom: "0.5px solid rgba(0,0,0,0.05)",
                  }}
                >
                  <p style={{ fontSize: 13, fontWeight: 500, color: "rgba(0,0,0,0.75)" }}>{label}</p>
                  <p
                    style={{
                      fontSize: 12,
                      color: "rgba(0,0,0,0.42)",
                      textAlign: "right",
                      maxWidth: "55%",
                    }}
                  >
                    {detalhe}
                  </p>
                </div>
              ))}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
