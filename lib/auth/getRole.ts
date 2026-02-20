import "server-only";

import { redirect } from "next/navigation";

import { createSupabaseServer } from "@/lib/supabase/server";

export type PortalRole = "client" | "partner" | "admin";
export type UserRole = PortalRole;

type ResolvePortalRoleOptions = {
  loginRedirectTo?: string;
};

type PortalSession = {
  supabase: Awaited<ReturnType<typeof createSupabaseServer>>;
  userId: string;
  role: PortalRole;
};

export function normalizePortalRole(value: string | null | undefined): PortalRole {
  if (value === "admin") return "admin";
  if (value === "seller" || value === "partner") return "partner";
  return "client";
}

export async function getUserRole(): Promise<UserRole | null> {
  const supabase = await createSupabaseServer();

  const {
    data: { user },
    error: userErr
  } = await supabase.auth.getUser();

  if (userErr || !user) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data?.role) {
    return "client";
  }

  return normalizePortalRole(data.role);
}

export async function getPortalSession(
  options: ResolvePortalRoleOptions = {}
): Promise<PortalSession> {
  const supabase = await createSupabaseServer();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(options.loginRedirectTo ?? "/login");
  }

  const [{ data: profileRow }, { data: userRoleRow }, { data: sellerRow }, { data: sellerProfileRow }] =
    await Promise.all([
      supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle(),
      supabase.from("sellers").select("id").eq("user_id", user.id).maybeSingle(),
      supabase.from("seller_profiles").select("id").eq("user_id", user.id).maybeSingle()
    ]);

  const role = normalizePortalRole(
    profileRow?.role ?? userRoleRow?.role ?? (sellerRow || sellerProfileRow ? "seller" : "customer")
  );

  return {
    supabase,
    userId: user.id,
    role
  };
}
