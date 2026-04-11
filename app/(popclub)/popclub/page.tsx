import type { Metadata } from "next";

import PopClubLandingExperience from "@/components/popclub/PopClubLandingExperience";

export const metadata: Metadata = {
  title: "PopClub | BelaPop",
  description:
    "Landing editorial mobile first do PopClub BelaPop com beneficios, manifesto e entrada para membership."
};

export default function PopClubLandingPage() {
  return <PopClubLandingExperience />;
}
