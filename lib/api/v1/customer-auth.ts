import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";

import { resolveUserRoleState, setActiveLegacyRole } from "@/lib/auth/roleState";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

type PortalRole = "customer" | "partner" | "admin";

export type CustomerApiContext = {
  user: User;
  userId: string;
  role: PortalRole;
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>;
  admin: ReturnType<typeof getSupabaseAdminClient>;
};

export async function requireCustomerApiContext() {
  const supabase = await getSupabaseServerClient();
  const admin = getSupabaseAdminClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Autenticacao necessaria." }, { status: 401 })
    };
  }

  const roleState = await resolveUserRoleState({
    userId: user.id,
    authUser: user,
    admin
  });

  if (!roleState.assignedRoles.includes("customer")) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Acesso permitido apenas para clientes." }, { status: 403 })
    };
  }

  if (roleState.activeRole !== "customer") {
    await setActiveLegacyRole({ userId: user.id, role: "customer", admin });
  }

  return {
    ok: true as const,
    ctx: {
      user,
      userId: user.id,
      role: "customer",
      supabase,
      admin
    } satisfies CustomerApiContext
  };
}
