import type { Metadata } from "next";

import SkinScanDiagnosticExperience from "@/components/popclub/skin-scan/SkinScanDiagnosticExperience";

export const metadata: Metadata = {
  title: "Diagnóstico exclusivo | Skin Scan BelaPop",
  description:
    "Diagnóstico editorial do Skin Scan BelaPop com metricas biometricas, curadoria personalizada e acesso ao SkinBela."
};

export default function SkinScanDiagnosticPage() {
  return <SkinScanDiagnosticExperience />;
}
