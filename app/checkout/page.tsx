import type { Metadata } from "next";

import { LuxuryCheckoutExperience } from "@/components/commerce/LuxuryCheckoutExperience";
import { buildLoginHref } from "@/lib/auth/redirects";
import { requireRole } from "@/lib/auth/requireRole";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Checkout | BelaPop",
  description: "Finalize sua curadoria com entrega e pagamento validados.",
  openGraph: {
    title: "Checkout | BelaPop",
    description: "Finalize sua curadoria com entrega e pagamento validados.",
    type: "website"
  }
};

export default async function CheckoutPage() {
  await requireRole(["client"], {
    redirectTo: buildLoginHref("/checkout")
  });

  return <LuxuryCheckoutExperience />;
}
