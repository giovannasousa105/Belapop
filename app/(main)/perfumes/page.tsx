import type { Metadata } from "next";

import { PerfumesAtelierExperience } from "@/components/perfumes/PerfumesAtelierExperience";

export const metadata: Metadata = {
  title: "Perfumes | BelaPop",
  description:
    "Perfumes BelaPop com seleção viva da categoria, notas olfativas e curadoria ativa.",
  openGraph: {
    title: "Perfumes | BelaPop",
    description:
      "Perfumes BelaPop com seleção viva da categoria, notas olfativas e curadoria ativa.",
    url: "/perfumes",
    siteName: "BelaPop",
    images: [{ url: "/og-default.jpg", alt: "Perfumes BelaPop" }],
    type: "website"
  }
};

export default function PerfumesPage() {
  return <PerfumesAtelierExperience />;
}
