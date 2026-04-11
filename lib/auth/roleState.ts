import "server-only";

import type { User as SupabaseUser } from "@supabase/supabase-js";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/lib/types";

export type LegacyRole = UserRole;
export type PortalRole = "client" | "partner" | "admin";

type RoleState = {
  activeRole: LegacyRole;
  activePortalRole: PortalRole;
  assignedRoles: LegacyRole[];
  assignedPortalRoles: PortalRole[];
};

const ROLE_PRIORITY: LegacyRole[] = ["customer", "seller", "admin"];

const isMissingRelationError = (error: { code?: string | null; message?: string | null } | null) => {
  if (!error) return false;
  if (error.code === "42P01" || error.code === "PGRST205") return true;
  const message = String(error.message ?? "").toLowerCase();
  return message.includes("relation") && message.includes("does not exist");
};

export const normalizeLegacyRole = (value: unknown): LegacyRole => {
  if (value === "admin") return "admin";
  if (value === "seller" || value === "partner") return "seller";
  return "customer";
};

export const normalizePortalRole = (value: string | null | undefined): PortalRole => {
  if (value === "admin") return "admin";
  if (value === "seller" || value === "partner") return "partner";
  return "client";
};

export const legacyToPortalRole = (role: LegacyRole): PortalRole => {
  if (role === "admin") return "admin";
  if (role === "seller") return "partner";
  return "client";
};

export const portalToLegacyRole = (role: PortalRole): LegacyRole => {
  if (role === "admin") return "admin";
  if (role === "partner") return "seller";
  return "customer";
};

const sortLegacyRoles = (roles: Iterable<LegacyRole>): LegacyRole[] => {
  return Array.from(new Set(roles)).sort((left, right) => {
    return ROLE_PRIORITY.indexOf(left) - ROLE_PRIORITY.indexOf(right);
  });
};

const extractMetadataRole = (user: SupabaseUser | null | undefined): LegacyRole => {
  // Never trust mutable user_metadata for privilege decisions.
  // app_metadata is server-controlled in Supabase.
  return normalizeLegacyRole(
    (user?.app_metadata?.role as string | undefined) ?? "customer"
  );
};

export async function resolveUserRoleState(params: {
  userId: string;
  authUser?: SupabaseUser | null;
  admin?: ReturnType<typeof getSupabaseAdminClient>;
}): Promise<RoleState> {
  const { userId, authUser } = params;
  const admin = params.admin ?? getSupabaseAdminClient();

  const [membershipsResult, activeRoleResult, sellerResult, sellerProfileResult] =
    await Promise.all([
      admin.from("user_role_memberships").select("role").eq("user_id", userId),
      admin.from("user_roles").select("role").eq("user_id", userId).maybeSingle(),
      admin.from("sellers").select("id").eq("user_id", userId).maybeSingle(),
      admin.from("seller_profiles").select("id").eq("user_id", userId).maybeSingle()
    ]);

  const membershipRoles = new Set<LegacyRole>();
  if (membershipsResult.error && !isMissingRelationError(membershipsResult.error)) {
    throw membershipsResult.error;
  }
  for (const row of membershipsResult.data ?? []) {
    membershipRoles.add(normalizeLegacyRole(row.role));
  }

  const hasSellerProfile = Boolean(sellerResult.data || sellerProfileResult.data);
  const metadataRole = extractMetadataRole(authUser);
  const activeRole = normalizeLegacyRole(
    activeRoleResult.data?.role ?? (hasSellerProfile ? "seller" : metadataRole)
  );

  membershipRoles.add(activeRole);
  if (hasSellerProfile) membershipRoles.add("seller");
  if (metadataRole) membershipRoles.add(metadataRole);
  membershipRoles.add("customer");
  const assignedRoles = sortLegacyRoles(membershipRoles);
  const assignedPortalRoles = assignedRoles.map(legacyToPortalRole);

  return {
    activeRole,
    activePortalRole: legacyToPortalRole(activeRole),
    assignedRoles,
    assignedPortalRoles
  };
}

export async function ensureRoleMemberships(params: {
  userId: string;
  roles: LegacyRole[];
  grantedBy?: string | null;
  source?: string | null;
  admin?: ReturnType<typeof getSupabaseAdminClient>;
}) {
  const admin = params.admin ?? getSupabaseAdminClient();
  const roles = sortLegacyRoles(params.roles).filter(Boolean);
  if (!roles.length) return;

  const payload = roles.map((role) => ({
    user_id: params.userId,
    role,
    granted_by: params.grantedBy ?? null,
    source: params.source ?? "system"
  }));

  const upsert = await admin
    .from("user_role_memberships")
    .upsert(payload, { onConflict: "user_id,role" });

  if (upsert.error && !isMissingRelationError(upsert.error)) {
    throw upsert.error;
  }
}

export async function setActiveLegacyRole(params: {
  userId: string;
  role: LegacyRole;
  admin?: ReturnType<typeof getSupabaseAdminClient>;
}) {
  const admin = params.admin ?? getSupabaseAdminClient();
  const role = normalizeLegacyRole(params.role);

  await ensureRoleMemberships({
    userId: params.userId,
    roles: [role],
    source: "active-role-sync",
    admin
  });

  const update = await admin
    .from("user_roles")
    .upsert({ user_id: params.userId, role }, { onConflict: "user_id" });

  if (update.error) {
    throw update.error;
  }
}

export const hasPortalRole = (state: RoleState, role: PortalRole) => {
  return state.assignedPortalRoles.includes(role);
};

export const pickAllowedPortalRole = (state: RoleState, allowed: PortalRole[]): PortalRole | null => {
  for (const role of allowed) {
    if (hasPortalRole(state, role)) return role;
  }
  return null;
};
