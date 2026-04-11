import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { toAdmLegacyPath } from "@/lib/adm/navigation";

export const metadata = {
  robots: {
    index: false,
    follow: false
  }
};

export default async function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "/admin";

  // Keep login route available for auth flow and role handoff.
  if (pathname.startsWith("/admin/login")) {
    return <>{children}</>;
  }

  redirect(toAdmLegacyPath(pathname));
}
