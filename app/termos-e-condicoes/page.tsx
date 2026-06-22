import { redirect } from "next/navigation";

import { legalRoutes } from "@/lib/legal/content";

export default function LegacyTermsAndConditionsPage() {
  redirect(legalRoutes.terms);
}
