import "server-only";

import { redirect } from "next/navigation";

import { getPortalSession, type UserRole as PortalRole } from "@/lib/auth/getRole";
import { resolveSellerScopeContext } from "@/lib/rbac/sellerAccessScope";

type PortalAccessOptions = {
  requirePartner?: boolean;
};

type PortalAccess = {
  supabase: Awaited<ReturnType<typeof getPortalSession>>["supabase"];
  userId: string;
  role: PortalRole;
  roles: PortalRole[];
  sellerId: string | null;
};

export async function getPartnerPortalAccess(
  options: PortalAccessOptions = {}
): Promise<PortalAccess> {
  const { requirePartner = true } = options;
  const { supabase, userId, role, roles } = await getPortalSession({
    loginRedirectTo: "/login?tab=partner"
  });

  const hasPartnerAccess = roles.includes("partner") || roles.includes("admin");
  if (requirePartner && !hasPartnerAccess) {
    redirect("/parceiro/onboarding?status=pending");
  }

  const scope = await resolveSellerScopeContext(userId);

  return {
    supabase,
    userId,
    role,
    roles,
    sellerId: scope?.sellerId ?? null
  };
}
