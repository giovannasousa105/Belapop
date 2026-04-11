import { NextResponse } from "next/server";

import {
  ensureRoleMemberships,
  resolveUserRoleState,
  setActiveLegacyRole
} from "@/lib/auth/roleState";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import type { UserRole } from "@/lib/types";

type EnsureRoleResponse = {
  role: UserRole;
  roles: UserRole[];
};

export async function POST() {
  const supabase = await getSupabaseServerClient();
  const admin = getSupabaseAdminClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const roleState = await resolveUserRoleState({
    userId: user.id,
    authUser: user,
    admin
  });

  await ensureRoleMemberships({
    userId: user.id,
    roles: roleState.assignedRoles,
    source: "ensure-role",
    admin
  });

  await setActiveLegacyRole({
    userId: user.id,
    role: roleState.activeRole,
    admin
  });

  return NextResponse.json({
    role: roleState.activeRole as UserRole,
    roles: roleState.assignedRoles as UserRole[]
  } satisfies EnsureRoleResponse);
}

