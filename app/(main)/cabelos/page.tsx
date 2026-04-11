import type { Metadata } from "next";

import { HairAtelierExperience } from "@/components/cabelos/HairAtelierExperience";

export const metadata: Metadata = {
  title: "Cabelos | BelaPop",
  description:
    "Cabelos BelaPop com experiencia viva da categoria e jornada de cuidado capilar.",
  openGraph: {
    title: "Cabelos | BelaPop",
    description:
      "Cabelos BelaPop com experiencia viva da categoria e jornada de cuidado capilar.",
    images: [{ url: "/editorial/presenca-diurna.svg", alt: "Cabelos BelaPop" }],
    type: "website"
  }
};

export default function CabelosPage() {
  return <HairAtelierExperience />;
}
