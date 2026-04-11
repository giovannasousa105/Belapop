import type { Metadata } from "next";

import PopClubActivationExperience from "@/components/popclub/PopClubActivationExperience";

export const metadata: Metadata = {
  title: "Ativar PopClub | BelaPop",
  description:
    "Fluxo mobile first de ativacao do PopClub com selecao de pagamento e CTA fixo."
};

export default function PopClubActivationPage() {
  return <PopClubActivationExperience />;
}
