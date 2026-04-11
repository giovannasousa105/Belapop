"use client";

import type { ReactNode } from "react";

import { BelaPopValidatedFooter } from "@/components/luxury/BelaPopValidatedFooter";
import { BelaPopValidatedHeader } from "@/components/luxury/BelaPopValidatedHeader";

type SkinScanLuxuryShellProps = {
  children: ReactNode;
};

export function SkinScanLuxuryShell({ children }: SkinScanLuxuryShellProps) {
  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b] selection:bg-[#ef75ce]/20 selection:text-[#1c1b1b]">
      <BelaPopValidatedHeader activeSection="skin-scan" featureSet="skin-scan" />

      <main className="pt-16 lg:pt-20">{children}</main>

      <BelaPopValidatedFooter />
    </div>
  );
}
