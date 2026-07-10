import type { Metadata } from "next";

import { EmBrevePage } from "@/components/layout/EmBrevePage";

// LANÇAMENTO: rituais bloqueado temporariamente
// Para reativar: restaurar componente original com ConsultoraInlineEntry e rituais
export const metadata: Metadata = {
  title: "Autocuidado | Em breve — BelaPop",
  description: "Rituais de autocuidado com skincare da BelaPop em breve.",
  robots: { index: false, follow: true },
};

export default function RituaisPage() {
  return (
    <EmBrevePage
      titulo="Autocuidado"
      subtitulo="Rituais de skincare pensados para o seu momento — em breve."
    />
  );
}
