import type { Metadata } from "next";

import { HairAtelierExperience } from "@/components/cabelos/HairAtelierExperience";

export const metadata: Metadata = {
  title: "Cabelos | BelaPop",
  description:
    "Cabelos BelaPop com experiência viva da categoria e jornada de cuidado capilar.",
  alternates: { canonical: "/cabelos" },
  openGraph: {
    title: "Cabelos | BelaPop",
    description:
      "Cabelos BelaPop com experiência viva da categoria e jornada de cuidado capilar.",
    url: "/cabelos",
    siteName: "BelaPop",
    images: [{ url: "/og-default.jpg", alt: "Cabelos BelaPop" }],
    type: "website"
  }
};

export default function CabelosPage() {
  return <HairAtelierExperience />;
}
