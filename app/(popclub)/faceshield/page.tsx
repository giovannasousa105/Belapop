import type { Metadata } from "next";

import SkinScanFaceShieldExperience from "@/components/popclub/skin-scan/SkinScanFaceShieldExperience";

export const metadata: Metadata = {
  title: "FaceShield | Skin Scan BelaPop",
  description:
    "Captura mobile first do FaceShield BelaPop com frame imersivo e CTA para iniciar a leitura."
};

export default function FaceShieldPage() {
  return <SkinScanFaceShieldExperience />;
}
