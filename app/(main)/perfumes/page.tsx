import type { Metadata } from "next";

import { PerfumesAtelierExperience } from "@/components/perfumes/PerfumesAtelierExperience";

export const metadata: Metadata = {
  title: "Perfumes | BelaPop",
  description:
    "Perfumes BelaPop com selecao viva da categoria, notas olfativas e curadoria ativa.",
  openGraph: {
    title: "Perfumes | BelaPop",
    description:
      "Perfumes BelaPop com selecao viva da categoria, notas olfativas e curadoria ativa.",
    images: [{ url: "/editorial/presenca-diurna.svg", alt: "Perfumes BelaPop" }],
    type: "website"
  }
};

export default function PerfumesPage() {
  return <PerfumesAtelierExperience />;
}
