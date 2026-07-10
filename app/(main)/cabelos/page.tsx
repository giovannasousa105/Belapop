import type { Metadata } from "next";

import { EmBrevePage } from "@/components/layout/EmBrevePage";

// LANÇAMENTO: cabelos bloqueada temporariamente
// Para reativar: substituir por <HairAtelierExperience /> e restaurar metadata abaixo
export const metadata: Metadata = {
  title: "Cabelos | Em breve — BelaPop",
  description: "Tratamentos capilares da BelaPop em breve.",
  robots: { index: false, follow: true },
};

export default function CabelosPage() {
  return (
    <EmBrevePage
      titulo="Cabelos"
      subtitulo="Tratamentos capilares com curadoria científica — chegando em breve."
    />
  );
}
