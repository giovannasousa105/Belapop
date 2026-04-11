import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import {
  ACTIVE_SELLER_COOKIE,
  clearActiveSellerCookie,
  normalizeActiveSellerId,
  setActiveSellerCookie
} from "@/lib/auth/activeSeller";
import {
  ensureRoleMemberships,
  resolveUserRoleState,
  setActiveLegacyRole
} from "@/lib/auth/roleState";
import {
  listAccessibleSellerProfiles,
  selectAccessibleSellerProfile,
  type AccessibleSellerProfile
} from "@/lib/rbac/sellerAccessScope";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

type ProfileRole = "customer" | "seller" | "admin";

function normalizeRole(value: unknown): ProfileRole {
  if (value === "admin") return "admin";
  if (value === "seller" || value === "partner") return "seller";
  return "customer";
}

const serializeSellerProfile = (seller: AccessibleSellerProfile) => ({
  id: seller.id,
  store_name: seller.store_name,
  category: seller.category,
  postal_code: seller.postal_code,
  whatsapp: seller.whatsapp,
  instagram: seller.instagram,
  status: seller.status,
  stripe_account_id: seller.stripe_account_id,
  commission_rate: seller.commission_rate,
  user_id: seller.user_id,
  is_owner: seller.is_owner,
  member_role: seller.member_role
});

export async function POST() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const admin = getSupabaseAdminClient();
  const fullName =
    (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name) ||
    (typeof user.user_metadata?.name === "string" && user.user_metadata.name) ||
    user.email ||
    "";

  const { data: existingProfile, error: existingProfileError } = await admin
    .from("profiles")
    .select("id,role")
    .eq("id", user.id)
    .maybeSingle();

  if (existingProfileError) {
    return NextResponse.json({ error: existingProfileError.message }, { status: 400 });
  }

  const roleState = await resolveUserRoleState({
    userId: user.id,
    authUser: user,
    admin
  });
  const normalizedRole = normalizeRole(roleState.activeRole);

  const mutation = existingProfile
    ? admin
        .from("profiles")
        .update({
          email: user.email ?? null,
          full_name: fullName
        })
        .eq("id", user.id)
    : admin
        .from("profiles")
        .insert({
          id: user.id,
          email: user.email ?? null,
          full_name: fullName,
          role: normalizedRole
        });

  const { error } = await mutation;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const cookieStore = await cookies();
  const requestedSellerId = normalizeActiveSellerId(
    cookieStore.get(ACTIVE_SELLER_COOKIE)?.value ?? null
  );

  const [{ data: profileRow, error: profileError }, accessibleSellers] = await Promise.all([
    admin
      .from("profiles")
      .select("id,email,full_name,created_at,role")
      .eq("id", user.id)
      .maybeSingle(),
    listAccessibleSellerProfiles(user.id)
  ]);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  await ensureRoleMemberships({
    userId: user.id,
    roles: roleState.assignedRoles,
    source: "ensure-profile",
    admin
  });

  await setActiveLegacyRole({
    userId: user.id,
    role: roleState.activeRole,
    admin
  });

  const resolvedRole = normalizeRole(roleState.activeRole);
  const activeSeller = selectAccessibleSellerProfile(accessibleSellers, requestedSellerId);
  const response = NextResponse.json({
    ok: true,
    profile: {
      ...profileRow,
      role: resolvedRole,
      roles: roleState.assignedRoles,
      active_seller_id: activeSeller?.id ?? null,
      sellers: activeSeller ? serializeSellerProfile(activeSeller) : null,
      seller_profiles: accessibleSellers.map(serializeSellerProfile)
    }
  });

  if (activeSeller) {
    return setActiveSellerCookie(response, activeSeller.id);
  }

  return clearActiveSellerCookie(response);
}
