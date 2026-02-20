import "server-only";

import { redirect } from "next/navigation";

import { getPortalSession, type PortalRole } from "@/lib/auth/getRole";

type PortalAccessOptions = {
  requirePartner?: boolean;
};

type PortalAccess = {
  supabase: Awaited<ReturnType<typeof getPortalSession>>["supabase"];
  userId: string;
  role: PortalRole;
  sellerId: string | null;
};

export async function getPartnerPortalAccess(
  options: PortalAccessOptions = {}
): Promise<PortalAccess> {
  const { requirePartner = true } = options;
  const { supabase, userId, role } = await getPortalSession({
    loginRedirectTo: "/login?tab=partner"
  });

  const { data: sellerRow } = await supabase
    .from("sellers")
    .select("id,status")
    .eq("user_id", userId)
    .maybeSingle();

  if (requirePartner && role !== "partner" && role !== "admin") {
    redirect("/parceiro/onboarding?status=pending");
  }

  return {
    supabase,
    userId,
    role,
    sellerId: sellerRow?.id ?? null
  };
}
