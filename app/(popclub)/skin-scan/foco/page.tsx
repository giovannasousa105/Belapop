import type { Metadata } from "next";
import Link from "next/link";
import { X } from "lucide-react";

import { FocoSelector } from "@/components/skinScan/FocoSelector";
import { SkinScanProgress } from "@/components/skin-scan/SkinScanProgress";

export const metadata: Metadata = {
  title: "Selecione seu foco de cuidado | Skin Scan BelaPop",
  description:
    "Selecione os focos do seu cuidado para iniciar uma análise cosmética mais precisa no Skin Scan BelaPop.",
};

export default function SkinScanFocoPage() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--bp-offwhite, #fbf7f4)",
        color: "var(--bp-black, #1e1e1e)",
        fontFamily: "var(--font-inter, sans-serif)",
      }}
    >
      {/* Nav simplificada */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "var(--bp-offwhite, #fbf7f4)",
          borderBottom: "1px solid rgba(30,30,30,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          height: 60,
        }}
      >
        <Link
          href="/skin-scan"
          aria-label="Fechar Skin Scan"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 36,
            height: 36,
            color: "inherit",
          }}
        >
          <X size={18} />
        </Link>

        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
          }}
        >
          Skin Scan
        </p>

        <span style={{ width: 36 }} />
      </header>

      {/* Barra de progresso */}
      <div style={{ padding: "12px 0 4px", borderBottom: "1px solid rgba(30,30,30,0.06)" }}>
        <SkinScanProgress />
      </div>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px 80px" }}>
        <div style={{ marginBottom: 40 }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "rgba(30,30,30,0.45)",
              marginBottom: 12,
            }}
          >
            Etapa 1 — Foco
          </p>
          <h1
            style={{
              fontFamily: "var(--font-playfair, serif)",
              fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
              fontWeight: 500,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              marginBottom: 8,
            }}
          >
            Qual é a sua principal preocupação?
          </h1>
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.7,
              color: "rgba(30,30,30,0.55)",
            }}
          >
            Selecione um ou mais focos. Isso orienta a análise para o que importa para você.
          </p>
        </div>

        <FocoSelector href="/skin-scan/captura" />
      </main>
    </div>
  );
}
