import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getPortalSession } from "@/lib/auth/getRole";

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
  const { role } = await getPortalSession({
    loginRedirectTo: "/login?tab=customer"
  });

  if (role === "partner") {
    redirect("/parceiro");
  }

  if (role === "admin") {
    redirect("/admin");
  }

  return <>{children}</>;
}
