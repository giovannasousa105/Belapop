import type { Metadata } from "next";

import { EmBrevePage } from "@/components/layout/EmBrevePage";

// LANÇAMENTO: diário bloqueado temporariamente
// Para reativar: substituir por <DiaryArticleExperience /> e restaurar metadata abaixo
export const metadata: Metadata = {
  title: "Diário BelaPop | Em breve",
  description: "Conteúdo editorial sobre skincare e beleza — em breve.",
  robots: { index: false, follow: true },
};

export default function DiarioPage() {
  return (
    <EmBrevePage
      titulo="Diário BelaPop"
      subtitulo="Guias, rotinas e ciência da pele em linguagem humana — em breve."
    />
  );
}
