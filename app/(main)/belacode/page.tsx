import type { Metadata } from "next";

import { SkinBelaAssistantExperience } from "@/components/belacode/SkinBelaAssistantExperience";

export const metadata: Metadata = {
  title: "SkinBela Code | BelaPop",
  description:
    "Concierge SkinBela com chat premium, snapshot biometrico, evidencias dermatologicas e recomendacoes conectadas ao diagnostico."
};

export default function BelaCodeLandingPage() {
  return <SkinBelaAssistantExperience />;
}
