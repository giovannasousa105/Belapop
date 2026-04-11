import type { Metadata } from "next";

import { LuxuryCheckoutExperience } from "@/components/commerce/LuxuryCheckoutExperience";

export const metadata: Metadata = {
  title: "Checkout | BelaPop",
  description: "Finalize sua curadoria com entrega e pagamento validados.",
  openGraph: {
    title: "Checkout | BelaPop",
    description: "Finalize sua curadoria com entrega e pagamento validados.",
    type: "website"
  }
};

export default function CheckoutPage() {
  return <LuxuryCheckoutExperience />;
}
