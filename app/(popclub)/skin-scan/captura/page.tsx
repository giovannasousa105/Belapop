import type { Metadata } from "next";

import SkinScanCaptureExperience from "@/components/popclub/skin-scan/SkinScanCaptureExperience";

export const metadata: Metadata = {
  title: "Skin Scan ao vivo | BelaPop",
  description:
    "Captura editorial do Skin Scan BelaPop com leitura em tempo real, UX mobile first e expansao premium no desktop."
};

export default function SkinScanCapturePage() {
  return <SkinScanCaptureExperience />;
}
