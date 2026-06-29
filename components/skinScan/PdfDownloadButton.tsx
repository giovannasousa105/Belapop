"use client";

import { FileDown } from "lucide-react";
import { useState } from "react";

import type { SkinAnalysisSession } from "@/lib/skincare/skinAnalysis";

export function PdfDownloadButton({
  session,
  variant = "labeled"
}: {
  session: SkinAnalysisSession;
  variant?: "icon" | "labeled";
}) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/skin-scan/relatorio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(session)
      });
      if (!res.ok) throw new Error("Falha ao gerar PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `belapop-skin-scan-${Date.now()}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      // silently fail — usuário pode tentar novamente
    } finally {
      setLoading(false);
    }
  };

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={() => void handleDownload()}
        disabled={loading}
        aria-label="Baixar relatório PDF"
        title="Baixar relatório PDF"
        style={{
          display: "inline-flex",
          minHeight: 44,
          minWidth: 44,
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
          border: "none",
          color: "rgba(30,30,30,0.7)",
          cursor: loading ? "default" : "pointer",
          opacity: loading ? 0.5 : 1
        }}
      >
        {loading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <FileDown size={18} aria-hidden="true" />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void handleDownload()}
      disabled={loading}
      style={{
        display: "flex",
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        border: "1px solid #1c1b1b",
        padding: "16px 24px",
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        color: "#1c1b1b",
        background: "transparent",
        cursor: loading ? "default" : "pointer",
        opacity: loading ? 0.6 : 1
      }}
    >
      {loading ? (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        <FileDown size={14} aria-hidden="true" />
      )}
      {loading ? "Gerando PDF..." : "Baixar relatório em PDF"}
    </button>
  );
}
