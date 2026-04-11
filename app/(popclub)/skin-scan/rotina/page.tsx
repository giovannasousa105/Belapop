import type { Metadata } from "next";

import SkinScanRoutineExperience from "@/components/popclub/skin-scan/SkinScanRoutineExperience";

export const metadata: Metadata = {
  title: "Rotina personalizada | PopClub BelaPop",
  description:
    "Rotina personalizada mobile first do PopClub BelaPop com passos editoriais de manha, noite e resumo final de investimento."
};

export default function SkinScanRoutinePage() {
  return <SkinScanRoutineExperience />;
}
