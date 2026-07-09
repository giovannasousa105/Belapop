import { NextRequest, NextResponse } from "next/server";

import { resolveUserRoleState, setActiveLegacyRole } from "@/lib/auth/roleState";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

/** Loga o erro real no servidor e retorna mensagem genérica para o cliente. */
export function adminDbError(
  error: { message?: string | null } | null,
  context: string
): NextResponse {
  console.error(`[admin-api] ${context}:`, error?.message ?? "unknown");
  return NextResponse.json({ error: "Erro interno. Tente novamente." }, { status: 500 });
}

type AdminContext = {
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>;
};

type AdminResult = AdminContext | { error: string; status: number };

export async function ensureAdminRequest(_request: NextRequest): Promise<AdminResult> {
  const supabase = await getSupabaseServerClient();
  const admin = getSupabaseAdminClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Autenticacao necessaria.", status: 401 };
  }

  const roleState = await resolveUserRoleState({
    userId: user.id,
    authUser: user,
    admin
  });

  if (!roleState.assignedRoles.includes("admin")) {
    return { error: "Acesso restrito a administradores.", status: 403 };
  }

  if (roleState.activeRole !== "admin") {
    await setActiveLegacyRole({ userId: user.id, role: "admin", admin });
  }

  return { supabase };
}
