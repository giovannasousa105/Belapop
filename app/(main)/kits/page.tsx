import type { Metadata } from "next";

import { SkincareBundleSection } from "@/components/skincare/SkincareBundleSection";
import { BelaPopValidatedHeader } from "@/components/luxury/BelaPopValidatedHeader";
import { BelaPopValidatedFooter } from "@/components/luxury/BelaPopValidatedFooter";

export const metadata: Metadata = {
  title: "Kits de skincare | BelaPop",
  description:
    "Kits BelaPop organizados por ritual, necessidade e tipo de pele para comprar uma rotina completa com mais clareza.",
  alternates: {
    canonical: "/kits",
  },
  openGraph: {
    title: "Kits de skincare | BelaPop",
    description:
      "Kits BelaPop organizados por ritual, necessidade e tipo de pele para comprar uma rotina completa com mais clareza.",
    url: "/kits",
    siteName: "BelaPop",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "/og-default.jpg",
        width: 1200,
        height: 630,
        alt: "Kits de skincare BelaPop",
      },
    ],
  }
};

export default function KitsPage() {
  return (
    <div className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b]">
      <BelaPopValidatedHeader activeSection="skincare" />
      <main className="pt-20 lg:pt-28">
        <SkincareBundleSection />
      </main>
      <BelaPopValidatedFooter />
    </div>
  );
}
