import { redirect } from "next/navigation";

import { legalRoutes } from "@/lib/legal/content";

export default function LegacyPrivacyPage() {
  redirect(legalRoutes.privacy);
}
