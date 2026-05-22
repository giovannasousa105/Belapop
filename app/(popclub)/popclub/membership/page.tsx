import type { Metadata } from "next";

import PopClubMembershipExperience from "@/components/popclub/PopClubMembershipExperience";

export const metadata: Metadata = {
  title: "Niveis do clube | PopClub BelaPop",
  description:
    "Tela de adesao ao PopClub com niveis claros, beneficios concretos e entrada para ativacao."
};

export default function PopClubMembershipPage() {
  return <PopClubMembershipExperience />;
}
