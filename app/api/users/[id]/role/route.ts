import { NextRequest, NextResponse } from "next/server";

import { logSellerAuditEvent } from "@/lib/rbac/auditLog";
import {
  ensureMemberBelongsToSeller,
  resolveSellerScopeContext
} from "@/lib/rbac/sellerAccessScope";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

type RoleBody = {
  role?: "ADMIN" | "OPERACAO" | "FINANCEIRO";
};

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
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

  const body = (await request.json()) as RoleBody;
  const role = body.role;
  if (!role || !["ADMIN", "OPERACAO", "FINANCEIRO"].includes(role)) {
    return NextResponse.json({ error: "role invalido." }, { status: 400 });
  }

  const { id: targetUserId } = await context.params;
  const targetBelongs = await ensureMemberBelongsToSeller(
    scope.sellerId,
    targetUserId,
    scope.ownerUserId
  );
  if (!targetBelongs) {
    return NextResponse.json({ error: "Membro nao pertence a esta loja." }, { status: 404 });
  }

  const admin = getSupabaseAdminClient();

  const previousRole = await admin
    .from("seller_user_roles")
    .select("role")
    .eq("seller_id", scope.sellerId)
    .eq("user_id", targetUserId)
    .maybeSingle();

  const upsertResult = await admin.from("seller_user_roles").upsert(
    {
      seller_id: scope.sellerId,
      user_id: targetUserId,
      role
    },
    { onConflict: "seller_id,user_id" }
  ).select("user_id,role").single();

  if (upsertResult.error) {
    return NextResponse.json({ error: upsertResult.error.message }, { status: 500 });
  }

  await logSellerAuditEvent({
    actorUserId: user.id,
    sellerId: scope.sellerId,
    role: scope.rbac.role,
    permissionUsed: "users.manage_roles",
    action: "role_changed",
    beforeState: previousRole.data ?? null,
    afterState: upsertResult.data,
    requestIp: request.headers.get("x-forwarded-for"),
    userAgent: request.headers.get("user-agent")
  });

  return NextResponse.json(upsertResult.data);
}
