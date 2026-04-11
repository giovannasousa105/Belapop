import { NextRequest, NextResponse } from "next/server";

import { logSellerAuditEvent } from "@/lib/rbac/auditLog";
import {
  isMissingTableError,
  resolveSellerScopeContext
} from "@/lib/rbac/sellerAccessScope";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ invite_id: string }> }
) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Autenticacao necessaria." }, { status: 401 });
  }

  const scope = await resolveSellerScopeContext(user.id);
  if (!scope || !scope.canManageRoles) {
    return NextResponse.json({ error: "Acao restrita. Solicite ao Admin." }, { status: 403 });
  }

  const { invite_id: inviteId } = await context.params;
  const admin = getSupabaseAdminClient();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const update = await admin
    .from("seller_team_invites")
    .update({
      status: "pending",
      expires_at: expiresAt,
      updated_at: now.toISOString()
    })
    .eq("id", inviteId)
    .eq("seller_id", scope.sellerId)
    .select("id,email,expires_at")
    .maybeSingle();

  if (update.error) {
    if (isMissingTableError(update.error)) {
      return NextResponse.json(
        {
          error:
            "Tabela seller_team_invites nao encontrada. Rode a migration de equipe e acessos."
        },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: update.error.message }, { status: 500 });
  }
  if (!update.data) {
    return NextResponse.json({ error: "Convite nao encontrado." }, { status: 404 });
  }

  await logSellerAuditEvent({
    actorUserId: user.id,
    sellerId: scope.sellerId,
    role: scope.rbac.role,
    permissionUsed: "users.manage_roles",
    action: "invite_resent",
    beforeState: null,
    afterState: {
      invite_id: update.data.id,
      email: update.data.email,
      expires_at: update.data.expires_at
    },
    requestIp: request.headers.get("x-forwarded-for"),
    userAgent: request.headers.get("user-agent")
  });

  return NextResponse.json({ ok: true, invite: update.data });
}
