import type { Metadata } from "next";

import { EmBrevePage } from "@/components/layout/EmBrevePage";

// LANÇAMENTO: kits bloqueado temporariamente
// Para reativar: substituir por <SkincareBundleSection /> e restaurar metadata abaixo
export const metadata: Metadata = {
  title: "Kits | Em breve — BelaPop",
  description: "Kits e rotinas completas de skincare da BelaPop em breve.",
  robots: { index: false, follow: true },
};

export default function KitsPage() {
  return (
    <EmBrevePage
      titulo="Kits"
      subtitulo="Rotinas completas com curadoria científica — chegando em breve."
    />
  );
}
