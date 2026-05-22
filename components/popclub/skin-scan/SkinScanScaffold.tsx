"use client";

import { type ReactNode } from "react";

import { BelaPopValidatedFooter } from "@/components/luxury/BelaPopValidatedFooter";
import { SkinScanTopBar } from "@/components/popclub/skin-scan/SkinScanTopBar";

type SkinScanScaffoldProps = {
  children: ReactNode;
  tone?: "light" | "dark";
};

export function SkinScanScaffold({
  children,
  tone = "dark"
}: SkinScanScaffoldProps) {
  const isLight = tone === "light";
  const shellClassName = isLight ? "bg-[#fcf9f8] text-[#1c1b1b]" : "bg-[#0c0a0b] text-[#fcf9f8]";

  return (
    <div className={shellClassName}>
      <SkinScanTopBar />
      <div className="pt-16 lg:pt-[88px]">{children}</div>
      <BelaPopValidatedFooter />
    </div>
  );
}
