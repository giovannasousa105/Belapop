import type { Metadata } from "next";

import { PopclubDashboard } from "@/components/popclub/PopclubDashboard";

export const metadata: Metadata = {
  title: "PopClub | BelaPop",
  description:
    "Seu painel de membership PopClub: tier, pontos, créditos e acesso antecipado a lotes curados.",
};

export default function PopClubPage() {
  return <PopclubDashboard />;
}
