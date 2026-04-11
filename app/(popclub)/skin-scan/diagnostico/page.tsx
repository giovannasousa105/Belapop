import type { Metadata } from "next";

import SkinScanDiagnosticExperience from "@/components/popclub/skin-scan/SkinScanDiagnosticExperience";

export const metadata: Metadata = {
  title: "Diagnostico exclusivo | Skin Scan BelaPop",
  description:
    "Diagnostico editorial do Skin Scan BelaPop com metricas biometricas, curadoria personalizada e acesso ao SkinBela."
};

export default function SkinScanDiagnosticPage() {
  return <SkinScanDiagnosticExperience />;
}
