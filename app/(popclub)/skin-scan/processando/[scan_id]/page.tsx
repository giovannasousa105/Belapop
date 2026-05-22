import type { Metadata } from "next";

import { ProcessingStatus } from "@/components/skinScan/ProcessingStatus";

export const metadata: Metadata = {
  title: "Analisando sua pele | Skin Scan BelaPop",
  description: "Aguarde enquanto analisamos sua pele e preparamos sua rotina personalizada.",
};

type PageProps = {
  params: Promise<{ scan_id: string }>;
};

export default async function SkinScanProcessandoPage({ params }: PageProps) {
  const { scan_id } = await params;

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--bp-offwhite, #fbf7f4)",
        color: "var(--bp-black, #1e1e1e)",
        fontFamily: "var(--font-inter, sans-serif)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Nav simplificada — sem X nem voltar durante o processamento */}
      <header
        style={{
          borderBottom: "1px solid rgba(30,30,30,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 60,
          flexShrink: 0,
        }}
      >
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
      </header>

      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 24px",
          maxWidth: 480,
          margin: "0 auto",
          width: "100%",
        }}
      >
        <div style={{ width: "100%", marginBottom: 40 }}>
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
            Etapa 3 — Análise
          </p>
          <h1
            style={{
              fontFamily: "var(--font-playfair, serif)",
              fontSize: "clamp(1.4rem, 4vw, 2rem)",
              fontWeight: 500,
              lineHeight: 1.15,
              letterSpacing: "-0.018em",
              marginBottom: 8,
            }}
          >
            Analisando sua pele
          </h1>
          <p
            style={{
              fontSize: 13,
              lineHeight: 1.7,
              color: "rgba(30,30,30,0.5)",
            }}
          >
            Isso leva em torno de 8 segundos.
          </p>
        </div>

        <div style={{ width: "100%" }}>
          <ProcessingStatus scanId={scan_id} />
        </div>
      </main>
    </div>
  );
}
