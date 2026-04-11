import type { Metadata } from "next";

import { SkincareAtelierExperience } from "@/components/skincare/SkincareAtelierExperience";

export const metadata: Metadata = {
  title: "Skincare | BelaPop",
  description:
    "Skincare BelaPop com curadoria ativa, rotina guiada e experiencia viva da categoria.",
  openGraph: {
    title: "Skincare | BelaPop",
    description:
      "Skincare BelaPop com curadoria ativa, rotina guiada e experiencia viva da categoria.",
    images: [{ url: "/editorial/presenca-diurna.svg", alt: "Skincare BelaPop" }],
    type: "website"
  }
};

export default function SkincarePage() {
  return <SkincareAtelierExperience />;
}
