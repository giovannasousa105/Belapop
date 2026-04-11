import type { Metadata } from "next";

import SkinScanGoalsExperience from "@/components/popclub/skin-scan/SkinScanGoalsExperience";

export const metadata: Metadata = {
  title: "Selecione seu foco de cuidado | Skin Scan BelaPop",
  description:
    "Selecione os focos do seu cuidado para iniciar um diagnostico cosmetico mais preciso no Skin Scan BelaPop."
};

export default function SkinScanFocusPage() {
  return <SkinScanGoalsExperience />;
}
