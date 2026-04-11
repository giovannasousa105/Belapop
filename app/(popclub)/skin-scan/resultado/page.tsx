import type { Metadata } from "next";

import SkinScanResultExperience from "@/components/popclub/skin-scan/SkinScanResultExperience";

export const metadata: Metadata = {
  title: "Resultado | Skin Scan BelaPop",
  description:
    "Leitura mobile first do Skin Scan BelaPop com resumo imediato do diagnostico e rotina sugerida."
};

export default function SkinScanResultPage() {
  return <SkinScanResultExperience />;
}
