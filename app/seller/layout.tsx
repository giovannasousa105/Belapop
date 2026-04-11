import { headers } from "next/headers";
import { redirect } from "next/navigation";

import SellerPublicShell from "@/app/seller/SellerPublicShell";
import { resolvePartnerPortalFromSellerPath } from "@/lib/partner/legacySellerRouting";

const authRoutes = new Set(["/seller/login", "/seller/register"]);
const publicRoutes = new Set([
  ...authRoutes,
  "/seller/partner",
  "/seller/apply",
  "/seller/activation"
]);

export default async function SellerLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";
  const isPublic = publicRoutes.has(pathname);

  if (authRoutes.has(pathname)) {
    return <SellerPublicShell>{children}</SellerPublicShell>;
  }

  if (isPublic) {
    return <>{children}</>;
  }

  redirect(resolvePartnerPortalFromSellerPath(pathname));
}

