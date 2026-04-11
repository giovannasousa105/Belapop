import "server-only";

import { cookies } from "next/headers";

import {
  ACTIVE_SELLER_COOKIE,
  normalizeActiveSellerId
} from "@/lib/auth/activeSeller";
import {
  getRoleDefaultPermissions,
  hasPermission,
  resolveSellerRbacContext,
  type SellerRbacContext
} from "@/lib/rbac/sellerPolicy";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type SellerScopeContext = {
  userId: string;
  sellerId: string;
  sellerName: string | null;
  ownerUserId: string;
  isOwner: boolean;
  rbac: SellerRbacContext;
  canManageRoles: boolean;
  canViewAudit: boolean;
  canViewFullPii: boolean;
};

export type AccessibleSellerProfile = {
  id: string;
  store_name: string | null;
  user_id: string;
  category: string | null;
  postal_code: string | null;
  whatsapp: string | null;
  instagram: string | null;
  status: string | null;
  stripe_account_id: string | null;
  commission_rate: number | null;
  created_at: string | null;
  is_owner: boolean;
  member_role: string | null;
};

export const isMissingTableError = (
  error: { code?: string | null; message?: string | null } | null
) => {
  if (!error) return false;
  if (error.code === "42P01" || error.code === "PGRST205") return true;
  const message = String(error.message ?? "").toLowerCase();
  return message.includes("relation") && message.includes("does not exist");
};

type SellerLookup = {
  id: string;
  store_name: string | null;
  user_id: string;
  category: string | null;
  postal_code: string | null;
  whatsapp: string | null;
  instagram: string | null;
  status: string | null;
  stripe_account_id: string | null;
  commission_rate: number | null;
  created_at: string | null;
};

const SELLER_PROFILE_SELECT =
  "id,store_name,user_id,category,postal_code,whatsapp,instagram,status,stripe_account_id,commission_rate,created_at";

const loadOwnedSellers = async (userId: string): Promise<SellerLookup[]> => {
  const admin = getSupabaseAdminClient();
  const lookup = await admin
    .from("sellers")
    .select(SELLER_PROFILE_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });

  if (lookup.error) {
    console.error("[sellerAccess] seller owner lookup failed", lookup.error);
    return [];
  }

  return (lookup.data ?? []) as SellerLookup[];
};

type SellerMembershipLookup = {
  seller_id: string;
  accepted_at: string | null;
  invited_at: string | null;
  created_at: string | null;
};

const loadActiveMemberships = async (
  userId: string
): Promise<SellerMembershipLookup[]> => {
  const admin = getSupabaseAdminClient();
  const membership = await admin
    .from("seller_team_members")
    .select("seller_id,status,accepted_at,invited_at,created_at")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("accepted_at", { ascending: false })
    .order("invited_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (membership.error) {
    if (!isMissingTableError(membership.error)) {
      console.error("[sellerAccess] member lookup failed", membership.error);
    }
    return [];
  }

  return (membership.data ?? []) as SellerMembershipLookup[];
};

const loadSellersByIds = async (sellerIds: string[]): Promise<SellerLookup[]> => {
  if (!sellerIds.length) return [];

  const admin = getSupabaseAdminClient();
  const seller = await admin
    .from("sellers")
    .select(SELLER_PROFILE_SELECT)
    .in("id", sellerIds);

  if (seller.error) {
    console.error("[sellerAccess] seller lookup by ids failed", seller.error);
    return [];
  }

  return (seller.data ?? []) as SellerLookup[];
};

const loadSellerRoleMap = async (userId: string, sellerIds: string[]) => {
  const map = new Map<string, string>();
  if (!sellerIds.length) return map;

  const admin = getSupabaseAdminClient();
  const roles = await admin
    .from("seller_user_roles")
    .select("seller_id,role")
    .eq("user_id", userId)
    .in("seller_id", sellerIds);

  if (roles.error) {
    if (!isMissingTableError(roles.error)) {
      console.error("[sellerAccess] seller role lookup failed", roles.error);
    }
    return map;
  }

  for (const row of roles.data ?? []) {
    const sellerId = String(row.seller_id ?? "").trim();
    const role = String(row.role ?? "").trim();
    if (!sellerId || !role) continue;
    map.set(sellerId, role);
  }

  return map;
};

const readRequestedSellerIdFromCookies = async () => {
  try {
    const cookieStore = await cookies();
    return normalizeActiveSellerId(cookieStore.get(ACTIVE_SELLER_COOKIE)?.value ?? null);
  } catch {
    return null;
  }
};

export const selectAccessibleSellerProfile = (
  sellers: AccessibleSellerProfile[],
  preferredSellerId?: string | null
) => {
  const requestedSellerId = normalizeActiveSellerId(preferredSellerId);
  if (requestedSellerId) {
    const exactMatch = sellers.find((seller) => seller.id === requestedSellerId);
    if (exactMatch) return exactMatch;
  }

  return sellers[0] ?? null;
};

export const listAccessibleSellerProfiles = async (
  userId: string
): Promise<AccessibleSellerProfile[]> => {
  const [ownedSellers, memberships] = await Promise.all([
    loadOwnedSellers(userId),
    loadActiveMemberships(userId)
  ]);

  const ownedSellerIds = new Set(ownedSellers.map((seller) => seller.id));
  const membershipSellerIds = memberships
    .map((membership) => String(membership.seller_id ?? "").trim())
    .filter((sellerId) => sellerId && !ownedSellerIds.has(sellerId));

  const memberSellers = await loadSellersByIds(Array.from(new Set(membershipSellerIds)));
  const roleMap = await loadSellerRoleMap(userId, [
    ...ownedSellers.map((seller) => seller.id),
    ...memberSellers.map((seller) => seller.id)
  ]);

  const memberSellerById = new Map(memberSellers.map((seller) => [seller.id, seller]));
  const profiles: AccessibleSellerProfile[] = [];

  for (const seller of ownedSellers) {
    profiles.push({
      ...seller,
      is_owner: true,
      member_role: roleMap.get(seller.id) ?? "ADMIN"
    });
  }

  const seenMemberSellerIds = new Set<string>();
  for (const membership of memberships) {
    const sellerId = String(membership.seller_id ?? "").trim();
    if (!sellerId || ownedSellerIds.has(sellerId) || seenMemberSellerIds.has(sellerId)) continue;

    const seller = memberSellerById.get(sellerId);
    if (!seller) continue;

    profiles.push({
      ...seller,
      is_owner: false,
      member_role: roleMap.get(sellerId) ?? null
    });
    seenMemberSellerIds.add(sellerId);
  }

  return profiles;
};

const bootstrapOwnerRbacIfNeeded = async (
  userId: string,
  sellerId: string,
  rbac: SellerRbacContext
) => {
  if (rbac.role === "ADMIN") return rbac;

  const admin = getSupabaseAdminClient();
  const upsert = await admin.from("seller_user_roles").upsert(
    {
      seller_id: sellerId,
      user_id: userId,
      role: "ADMIN"
    },
    { onConflict: "seller_id,user_id" }
  );

  if (upsert.error) {
    console.error("[sellerAccess] owner bootstrap failed", upsert.error);
    return {
      ...rbac,
      sellerId,
      role: "ADMIN" as const,
      permissions: getRoleDefaultPermissions("ADMIN")
    };
  }

  const reloaded = await resolveSellerRbacContext(userId, sellerId);
  if (reloaded) return reloaded;
  return {
    ...rbac,
    sellerId,
    role: "ADMIN" as const,
    permissions: getRoleDefaultPermissions("ADMIN")
  };
};

export const resolveSellerScopeContext = async (
  userId: string,
  preferredSellerId?: string | null
): Promise<SellerScopeContext | null> => {
  const requestedSellerId =
    normalizeActiveSellerId(preferredSellerId) ?? (await readRequestedSellerIdFromCookies());
  const accessibleSellers = await listAccessibleSellerProfiles(userId);
  const seller = selectAccessibleSellerProfile(accessibleSellers, requestedSellerId);
  if (!seller) return null;

  const isOwner = seller.is_owner;
  let rbac = await resolveSellerRbacContext(userId, seller.id);
  if (!rbac) {
    if (!isOwner) return null;
    rbac = {
      sellerId: seller.id,
      userId,
      role: "ADMIN",
      permissions: getRoleDefaultPermissions("ADMIN")
    };
  }

  if (isOwner) {
    rbac = await bootstrapOwnerRbacIfNeeded(userId, seller.id, rbac);
  }

  return {
    userId,
    sellerId: seller.id,
    sellerName: seller.store_name,
    ownerUserId: seller.user_id,
    isOwner,
    rbac,
    canManageRoles: isOwner || hasPermission(rbac, "users.manage_roles"),
    canViewAudit: isOwner || hasPermission(rbac, "audit.view"),
    canViewFullPii: isOwner || hasPermission(rbac, "pii.view_full")
  };
};

export const ensureMemberBelongsToSeller = async (
  sellerId: string,
  targetUserId: string,
  ownerUserId: string
) => {
  if (targetUserId === ownerUserId) return true;

  const admin = getSupabaseAdminClient();
  const lookup = await admin
    .from("seller_team_members")
    .select("user_id")
    .eq("seller_id", sellerId)
    .eq("user_id", targetUserId)
    .maybeSingle();

  if (lookup.error) {
    if (isMissingTableError(lookup.error)) return false;
    console.error("[sellerAccess] membership check failed", lookup.error);
    return false;
  }

  return Boolean(lookup.data?.user_id);
};
