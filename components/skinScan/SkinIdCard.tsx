"use client";

import { useEffect, useRef, useState } from "react";
import type { SkinProfile } from "@/lib/skinScan/types";

// ─── Barra de score animada ───────────────────────────────────────────────────

function ScoreBar({ label, valor }: { label: string; valor: number }) {
  const barRef = useRef<HTMLDivElement | null>(null);
  const [animado, setAnimado] = useState(false);

  useEffect(() => {
    const el = barRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAnimado(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={barRef} className="flex items-center gap-4">
      <span
        style={{
          fontFamily: "var(--font-inter, sans-serif)",
          fontSize: 11,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--scan-muted)",
          minWidth: 100,
        }}
      >
        {label}
      </span>

      {/* Track */}
      <div
        style={{
          flex: 1,
          height: 3,
          borderRadius: 99,
          background: "var(--scan-border)",
          overflow: "hidden",
        }}
      >
        {/* Fill — anima via CSS transition ao entrar na viewport */}
        <div
          style={{
            height: "100%",
            borderRadius: 99,
            background: "var(--scan-fg)",
            width: animado ? `${valor}%` : "0%",
            transition: "width 800ms ease-out",
          }}
        />
      </div>

      <span
        style={{
          fontFamily: "var(--font-inter, sans-serif)",
          fontSize: 11,
          color: "var(--scan-muted)",
          minWidth: 28,
          textAlign: "right",
        }}
      >
        {valor}
      </span>
    </div>
  );
}

// ─── Rótulos amigáveis para os scores ─────────────────────────────────────────

const SCORE_LABELS: Record<string, string> = {
  oleosidade: "Oleosidade",
  acne: "Acne",
  pigmentacao: "Pigmentação",
  vermelhidao: "Vermelhidão",
  ressecamento: "Ressecamento",
  poros: "Poros",
  textura: "Textura",
};

// ─── Componente principal ─────────────────────────────────────────────────────

interface SkinIdCardProps {
  skinId: string;
  skinProfile: SkinProfile;
  narrativa: string | null;
  scanId: string;
}

export function SkinIdCard({
  skinId,
  skinProfile,
  narrativa,
  scanId,
}: SkinIdCardProps) {
  const [emailSalvo, setEmailSalvo] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [mostraEmail, setMostraEmail] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const vars = {
    "--scan-fg": "var(--bp-black, #1e1e1e)",
    "--scan-bg": "var(--bp-offwhite, #fbf7f4)",
    "--scan-border": "rgba(30,30,30,0.1)",
    "--scan-muted": "rgba(30,30,30,0.45)",
  } as React.CSSProperties;

  // Top 4 scores para as barras
  const scoresOrdenados = Object.entries(skinProfile.scores_normalizados)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 4);

  const handleCompartilhar = async () => {
    const link = `${window.location.origin}/pele/${skinId}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // fallback: alert
      window.alert(`Link copiado: ${link}`);
    }
  };

  const handleSalvar = async () => {
    const trimmed = emailInput.trim();
    if (!trimmed) return;
    try {
      const res = await fetch("/api/skin-scan/salvar-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scan_id: scanId, email: trimmed }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        console.error("[SkinIdCard] salvar-email:", body.error ?? res.status);
      }
    } catch (err) {
      console.error("[SkinIdCard] salvar-email fetch falhou:", err);
    }
    setEmailSalvo(true); // confirmar UI independentemente
  };

  return (
    <article style={vars}>
      {/* ── Skin ID ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          padding: "32px 0 24px",
          borderBottom: "1px solid var(--scan-border)",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-inter, sans-serif)",
            fontSize: 11,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "var(--scan-muted)",
            marginBottom: 12,
          }}
        >
          Seu Skin ID
        </p>

        <p
          style={{
            fontFamily: "monospace",
            fontSize: 22,
            letterSpacing: "0.15em",
            color: "var(--scan-fg)",
            fontWeight: 500,
          }}
        >
          {skinId}
        </p>

        <p
          style={{
            fontFamily: "var(--font-inter, sans-serif)",
            fontSize: 13,
            marginTop: 8,
            color: "var(--scan-muted)",
          }}
        >
          Pele{" "}
          {skinProfile.tipo_pele.charAt(0).toUpperCase() +
            skinProfile.tipo_pele.slice(1).toLowerCase()}{" "}
          · Sensibilidade {skinProfile.nivel_sensibilidade}/5
        </p>
      </div>

      {/* ── Métricas ────────────────────────────────────────────────────────── */}
      <div
        style={{
          padding: "24px 0",
          borderBottom: "1px solid var(--scan-border)",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-inter, sans-serif)",
            fontSize: 11,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--scan-muted)",
            marginBottom: 4,
          }}
        >
          Principais indicadores
        </p>

        {scoresOrdenados.map(([key, valor]) => (
          <ScoreBar
            key={key}
            label={SCORE_LABELS[key] ?? key}
            valor={valor}
          />
        ))}
      </div>

      {/* ── Narrativa clínica ────────────────────────────────────────────────── */}
      {narrativa && (
        <div
          style={{
            padding: "24px 0",
            borderBottom: "1px solid var(--scan-border)",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-playfair, serif)",
              fontSize: 15,
              lineHeight: 1.8,
              color: "var(--scan-fg)",
              maxWidth: 580,
            }}
          >
            {narrativa}
          </p>
        </div>
      )}

      {/* ── Ações ───────────────────────────────────────────────────────────── */}
      <div style={{ padding: "24px 0", display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Salvar Skin ID */}
        {!emailSalvo && !mostraEmail && (
          <button
            type="button"
            onClick={() => setMostraEmail(true)}
            style={{
              fontFamily: "var(--font-inter, sans-serif)",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              padding: "14px 28px",
              background: "var(--scan-fg)",
              color: "var(--scan-bg)",
              border: "none",
              cursor: "pointer",
              alignSelf: "flex-start",
            }}
          >
            Salvar meu Skin ID
          </button>
        )}

        {mostraEmail && !emailSalvo && (
          <div style={{ display: "flex", gap: 8, maxWidth: 400 }}>
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="seu@email.com"
              style={{
                flex: 1,
                padding: "12px 14px",
                border: "1px solid var(--scan-border)",
                background: "transparent",
                fontFamily: "var(--font-inter, sans-serif)",
                fontSize: 13,
                outline: "none",
              }}
              aria-label="E-mail para receber o Skin ID"
            />
            <button
              type="button"
              onClick={() => { void handleSalvar(); }}
              style={{
                fontFamily: "var(--font-inter, sans-serif)",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                padding: "12px 20px",
                background: "var(--scan-fg)",
                color: "var(--scan-bg)",
                border: "none",
                cursor: "pointer",
              }}
            >
              Salvar
            </button>
          </div>
        )}

        {emailSalvo && (
          <p
            style={{
              fontFamily: "var(--font-inter, sans-serif)",
              fontSize: 12,
              color: "var(--scan-muted)",
            }}
          >
            Skin ID enviado para {emailInput}.
          </p>
        )}

        {/* Compartilhar */}
        <button
          type="button"
          onClick={handleCompartilhar}
          style={{
            fontFamily: "var(--font-inter, sans-serif)",
            fontSize: 11,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "var(--scan-muted)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 0,
            alignSelf: "flex-start",
            textDecoration: "underline",
            textUnderlineOffset: 3,
          }}
        >
          {copiado ? "Link copiado!" : "Compartilhar meu Skin ID"}
        </button>
      </div>
    </article>
  );
}
