import type { Metadata } from "next";

import { LuxuryCartExperience } from "@/components/commerce/LuxuryCartExperience";

export const metadata: Metadata = {
  title: "Carrinho | BelaPop",
  description: "Revise sua curadoria antes de finalizar a compra.",
  alternates: {
    canonical: "/carrinho",
  },
  openGraph: {
    title: "Carrinho | BelaPop",
    description: "Revise sua curadoria antes de finalizar a compra.",
    url: "/carrinho",
    siteName: "BelaPop",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "/og-default.jpg",
        width: 1200,
        height: 630,
        alt: "Carrinho BelaPop",
      },
    ],
  }
};

export default function CarrinhoPage() {
  return <LuxuryCartExperience />;
}
