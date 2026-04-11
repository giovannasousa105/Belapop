import type { Metadata } from "next";

import PopClubMembershipExperience from "@/components/popclub/PopClubMembershipExperience";

export const metadata: Metadata = {
  title: "Membership | PopClub BelaPop",
  description:
    "Tela mobile first de adesao ao PopClub com beneficios, formulario elegante e CTA premium."
};

export default function PopClubMembershipPage() {
  return <PopClubMembershipExperience />;
}
