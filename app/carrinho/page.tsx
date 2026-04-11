import type { Metadata } from "next";

import { LuxuryCartExperience } from "@/components/commerce/LuxuryCartExperience";

export const metadata: Metadata = {
  title: "Carrinho | BelaPop",
  description: "Revise sua curadoria antes de finalizar a compra.",
  openGraph: {
    title: "Carrinho | BelaPop",
    description: "Revise sua curadoria antes de finalizar a compra.",
    type: "website"
  }
};

export default function CarrinhoPage() {
  return <LuxuryCartExperience />;
}
