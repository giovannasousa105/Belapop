import type { Metadata } from "next";

import SkinScanIntroExperience from "@/components/popclub/skin-scan/SkinScanIntroExperience";

export const metadata: Metadata = {
  title: "Skin Scan BelaPop | Diagnóstico de pele em 45 segundos",
  description:
    "Faça sua leitura visual de pele com o Skin Scan BelaPop. Em 45 segundos você descobre sua rotina ideal de skincare com produtos coreanos originais.",
  openGraph: {
    title: "Skin Scan BelaPop",
    description: "Diagnóstico de pele personalizado em 45 segundos.",
    url: "https://belapopoficial.com.br/skin-scan"
  }
};

export default function SkinScanPage() {
  return <SkinScanIntroExperience />;
}
