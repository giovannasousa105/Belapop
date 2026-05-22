import type { Metadata } from "next";
import { headers } from "next/headers";

import CustomerPortalShell from "@/components/customer/CustomerPortalShell";
import { buildLoginHref } from "@/lib/auth/redirects";
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
  const requestHeaders = await headers();
  const pathname = requestHeaders.get("x-pathname") ?? "/conta";
  const search = requestHeaders.get("x-search") ?? "";

  await requireRole(["client"], {
    redirectTo: buildLoginHref(`${pathname}${search}`)
  });

  return <CustomerPortalShell>{children}</CustomerPortalShell>;
}
