import { NextRequest, NextResponse } from "next/server";

import { buildPermissionDiff } from "@/lib/rbac/accessPresets";
import { logSellerAuditEvent } from "@/lib/rbac/auditLog";
import {
  isPermissionKey,
  normalizePermissionValue,
  syncPermissionOverrides
} from "@/lib/rbac/sellerAccessPermissions";
import {
  ensureMemberBelongsToSeller,
  isMissingTableError,
  resolveSellerScopeContext
} from "@/lib/rbac/sellerAccessScope";
import {
  getRoleDefaultPermissions,
  type PermissionValue,
  type SellerPermissionKey,
  type SellerRbacRole
} from "@/lib/rbac/sellerPolicy";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

type TeamMemberStatus = "active" | "inactive" | "pending";

type UpdateMemberBody = {
  role?: SellerRbacRole;
  status?: TeamMemberStatus;
  permissions?: Partial<Record<SellerPermissionKey, PermissionValue | null>>;
};

const isRole = (value: unknown): value is SellerRbacRole => {
  return value === "ADMIN" || value === "OPERACAO" || value === "FINANCEIRO";
};

const isStatus = (value: unknown): value is TeamMemberStatus => {
  return value === "active" || value === "inactive" || value === "pending";
};

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ user_id: string }> }
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

  const { user_id: targetUserId } = await context.params;
  const targetBelongs = await ensureMemberBelongsToSeller(
    scope.sellerId,
    targetUserId,
    scope.ownerUserId
  );
  if (!targetBelongs) {
    return NextResponse.json({ error: "Membro nao pertence a esta loja." }, { status: 404 });
  }

  const body = (await request.json()) as UpdateMemberBody;
  const admin = getSupabaseAdminClient();

  const roleLookup = await admin
    .from("seller_user_roles")
    .select("role")
    .eq("seller_id", scope.sellerId)
    .eq("user_id", targetUserId)
    .maybeSingle();
  const beforeRole = isRole(roleLookup.data?.role)
    ? roleLookup.data.role
    : targetUserId === scope.ownerUserId
      ? "ADMIN"
      : "OPERACAO";

  const role = isRole(body.role) ? body.role : beforeRole;
  if (targetUserId === scope.ownerUserId && role !== "ADMIN") {
    return NextResponse.json(
      { error: "O dono da loja deve permanecer com role ADMIN." },
      { status: 400 }
    );
  }

  const status = isStatus(body.status) ? body.status : undefined;
  if (targetUserId === scope.ownerUserId && status && status !== "active") {
    return NextResponse.json(
      { error: "Nao e possivel desativar o dono da loja." },
      { status: 400 }
    );
  }

  const normalizedOverrides: Partial<Record<SellerPermissionKey, PermissionValue | null>> = {};
  for (const [rawKey, rawValue] of Object.entries(body.permissions ?? {})) {
    if (!isPermissionKey(rawKey)) continue;
    if (rawValue === null) {
      normalizedOverrides[rawKey] = null;
      continue;
    }
    const normalized = normalizePermissionValue(rawKey, rawValue);
    if (normalized === null) {
      return NextResponse.json(
        { error: `Valor invalido para permissao ${rawKey}.` },
        { status: 400 }
      );
    }
    normalizedOverrides[rawKey] = normalized;
  }

  if (role !== beforeRole) {
    const upsertRole = await admin.from("seller_user_roles").upsert(
      {
        seller_id: scope.sellerId,
        user_id: targetUserId,
        role
      },
      { onConflict: "seller_id,user_id" }
    );
    if (upsertRole.error) {
      return NextResponse.json({ error: upsertRole.error.message }, { status: 500 });
    }
  }

  if (status && targetUserId !== scope.ownerUserId) {
    const updateStatus = await admin.from("seller_team_members").upsert(
      {
        seller_id: scope.sellerId,
        user_id: targetUserId,
        status,
        invited_by: user.id,
        invited_at: new Date().toISOString()
      },
      { onConflict: "seller_id,user_id" }
    );

    if (updateStatus.error) {
      if (isMissingTableError(updateStatus.error)) {
        return NextResponse.json(
          {
            error:
              "Tabela seller_team_members nao encontrada. Rode a migration de equipe e acessos."
          },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: updateStatus.error.message }, { status: 500 });
    }
  }

  const permissionDiff: Partial<Record<SellerPermissionKey, PermissionValue | null>> =
    buildPermissionDiff(role, {
    ...getRoleDefaultPermissions(role),
    ...Object.fromEntries(
      Object.entries(normalizedOverrides)
        .filter((entry) => entry[1] !== null)
        .map(([key, value]) => [key, value as PermissionValue])
    )
  });
  for (const [key, value] of Object.entries(normalizedOverrides)) {
    if (value === null) {
      permissionDiff[key as SellerPermissionKey] = null;
    }
  }

  const syncResult = await syncPermissionOverrides(
    admin,
    scope.sellerId,
    targetUserId,
    permissionDiff
  );
  if (!syncResult.ok) {
    return NextResponse.json({ error: syncResult.error }, { status: 500 });
  }

  const changes: string[] = [];
  if (role !== beforeRole) changes.push("role_changed");
  if (status) changes.push("permission_changed");
  if ("promo.max_discount_percent" in normalizedOverrides) changes.push("limit_changed");
  if (Object.keys(normalizedOverrides).length > 0 && !changes.includes("permission_changed")) {
    changes.push("permission_changed");
  }

  for (const changeType of changes) {
    await logSellerAuditEvent({
      actorUserId: user.id,
      sellerId: scope.sellerId,
      role: scope.rbac.role,
      permissionUsed: "users.manage_roles",
      action: changeType,
      beforeState: {
        role: beforeRole
      },
      afterState: {
        target_user_id: targetUserId,
        role,
        status: status ?? null,
        permissions: normalizedOverrides
      },
      requestIp: request.headers.get("x-forwarded-for"),
      userAgent: request.headers.get("user-agent")
    });
  }

  return NextResponse.json({
    ok: true,
    user_id: targetUserId,
    role,
    status: status ?? "active"
  });
}
