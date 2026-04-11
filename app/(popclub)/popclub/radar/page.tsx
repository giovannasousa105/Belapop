import type { Metadata } from "next";

import PopClubRadarExperience from "@/components/popclub/PopClubRadarExperience";

export const metadata: Metadata = {
  title: "Radar PopClub | BelaPop",
  description:
    "Radar editorial mobile first do PopClub BelaPop com acesso antecipado, drops monitorados e experiencia premium para desktop."
};

export default function PopClubRadarPage() {
  return <PopClubRadarExperience />;
}
