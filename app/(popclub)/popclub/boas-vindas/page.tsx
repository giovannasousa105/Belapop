import type { Metadata } from "next";

import PopClubWelcomeExperience from "@/components/popclub/PopClubWelcomeExperience";

export const metadata: Metadata = {
  title: "Bem-vinda ao PopClub | BelaPop",
  description:
    "Tela de boas-vindas do PopClub com confirmacao de ativacao e proximo passo para o Skin Scan."
};

export default function PopClubWelcomePage() {
  return <PopClubWelcomeExperience />;
}
