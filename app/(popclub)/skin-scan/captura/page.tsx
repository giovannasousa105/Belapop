import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { ImageCapture } from "@/components/skinScan/ImageCapture";
import { SkinScanProgress } from "@/components/skin-scan/SkinScanProgress";

export const metadata: Metadata = {
  title: "Foto para análise | Skin Scan BelaPop",
  description:
    "Tire uma foto ou envie uma imagem para iniciar sua análise de pele personalizada.",
};

export default function SkinScanCapturaPage() {
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
          href="/skin-scan/foco"
          aria-label="Voltar para seleção de focos"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "rgba(30,30,30,0.5)",
            textDecoration: "none",
          }}
        >
          <ChevronLeft size={14} />
          Voltar
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

      <main style={{ maxWidth: 640, margin: "0 auto", padding: "40px 24px 80px" }}>
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
            Etapa 2 — Imagem
          </p>
          <h1
            style={{
              fontFamily: "var(--font-playfair, serif)",
              fontSize: "clamp(1.5rem, 4vw, 2.2rem)",
              fontWeight: 500,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              marginBottom: 8,
            }}
          >
            Tire uma foto ou envie uma imagem
          </h1>
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.7,
              color: "rgba(30,30,30,0.55)",
            }}
          >
            A imagem é processada em memória e deletada imediatamente após a análise.
          </p>
        </div>

        <ImageCapture />
      </main>
    </div>
  );
}
