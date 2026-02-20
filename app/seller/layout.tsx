import { headers } from "next/headers";

import SellerPublicShell from "@/app/seller/SellerPublicShell";
import SellerShell from "@/app/seller/SellerShell";
import { requireRole } from "@/lib/auth/requireRole";

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

  await requireRole("seller", {
    redirectTo: "/seller/login",
    unauthorizedTo: "/"
  });

  return <SellerShell>{children}</SellerShell>;
}

