import type { Metadata } from "next";

import SkinScanDiagnosticExperience from "@/components/popclub/skin-scan/SkinScanDiagnosticExperience";

export const metadata: Metadata = {
  title: "Leitura exclusiva | Skin Scan BelaPop",
  description:
    "Leitura editorial do Skin Scan BelaPop com metricas biometricas, curadoria personalizada e acesso ao SkinBela.",
  alternates: { canonical: "/skin-scan/leitura" }
};

export default function SkinScanDiagnosticPage() {
  return <SkinScanDiagnosticExperience />;
}
