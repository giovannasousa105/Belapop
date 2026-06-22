import type { Metadata } from "next";

import { MakeupAtelierExperience } from "@/components/maquiagem/MakeupAtelierExperience";

export const metadata: Metadata = {
  title: "Maquiagem | BelaPop",
  description:
    "Maquiagem BelaPop com seleção viva da categoria, foco em uso, acabamento e rotina.",
  openGraph: {
    title: "Maquiagem | BelaPop",
    description:
      "Maquiagem BelaPop com seleção viva da categoria, foco em uso, acabamento e rotina.",
    url: "/maquiagem",
    siteName: "BelaPop",
    images: [{ url: "/og-default.jpg", alt: "Maquiagem BelaPop" }],
    type: "website"
  }
};

export default function MaquiagemPage() {
  return <MakeupAtelierExperience />;
}
