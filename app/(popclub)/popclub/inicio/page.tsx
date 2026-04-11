import type { Metadata } from "next";

import PopClubHomeExperience from "@/components/popclub/PopClubHomeExperience";

export const metadata: Metadata = {
  title: "Inicio PopClub | BelaPop",
  description:
    "Home mobile first do PopClub com status do membro, atalhos ativos e entrada para o Skin Scan."
};

export default function PopClubHomePage() {
  return <PopClubHomeExperience />;
}
