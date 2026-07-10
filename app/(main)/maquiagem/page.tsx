import type { Metadata } from "next";

import { EmBrevePage } from "@/components/layout/EmBrevePage";

// LANÇAMENTO: maquiagem bloqueada temporariamente
// Para reativar: substituir por <MakeupAtelierExperience /> e restaurar metadata abaixo
export const metadata: Metadata = {
  title: "Maquiagem | Em breve — BelaPop",
  description: "Seleção de maquiagem da BelaPop em breve.",
  robots: { index: false, follow: true },
};

export default function MaquiagemPage() {
  return (
    <EmBrevePage
      titulo="Maquiagem"
      subtitulo="Curadoria de maquiagem com foco em uso, acabamento e rotina — chegando em breve."
    />
  );
}
