import type { Metadata } from "next";

import CustomerPortalShell from "@/components/customer/CustomerPortalShell";
import { requireRole } from "@/lib/auth/requireRole";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false
  }
};

export default async function ContaLayout({
  children
}: {
  children: React.ReactNode;
}) {
  await requireRole(["client"], {
    redirectTo: "/login?tab=customer"
  });

  return <CustomerPortalShell>{children}</CustomerPortalShell>;
}
