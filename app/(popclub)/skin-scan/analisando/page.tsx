import type { Metadata } from "next";

import SkinScanAnalyzingExperience from "@/components/popclub/skin-scan/SkinScanAnalyzingExperience";

export const metadata: Metadata = {
  title: "Analisando | Skin Scan BelaPop",
  description:
    "Tela mobile first de processamento do Skin Scan BelaPop com visual tecnico e progresso editorial."
};

export default function SkinScanAnalyzingPage() {
  return <SkinScanAnalyzingExperience />;
}
