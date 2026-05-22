import type { Metadata } from "next";

import SkinScanIntroExperience from "@/components/popclub/skin-scan/SkinScanIntroExperience";

export const metadata: Metadata = {
  title: "Skin Scan BelaPop | Apresentação",
  description:
    "Tela de apresentação do Skin Scan BelaPop com explicacao do fluxo, leitura visual e inicio guiado para a análise."
};

export default function SkinScanPage() {
  return <SkinScanIntroExperience />;
}
