"use client";

import SkinScanCapture from "@/components/popclub/skin-scan/SkinScanCapture";

type SkinScanFaceShieldExperienceProps = {
  closeHref?: string;
};

export default function SkinScanFaceShieldExperience({
  closeHref = "/skin-scan/foco"
}: SkinScanFaceShieldExperienceProps) {
  return <SkinScanCapture closeHref={closeHref} />;
}
