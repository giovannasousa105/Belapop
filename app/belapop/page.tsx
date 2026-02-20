import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/requireRole";

export default async function BelapopMarketplaceDemoRedirectPage() {
  await requireRole("admin", {
    redirectTo: "/admin/login",
    unauthorizedTo: "/login?forbidden=1"
  });

  redirect("/admin/dashboard");
}

