import { randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import {
  buildPermissionDiff,
  getAccessPresetByKey,
  SELLER_ACCESS_PRESETS
} from "@/lib/rbac/accessPresets";
import { logSellerAuditEvent } from "@/lib/rbac/auditLog";
import {
  isMissingTableError as isMissingPermissionTableError,
  loadPermissionOverridesForUsers,
  normalizePermissionValue,
  syncPermissionOverrides
} from "@/lib/rbac/sellerAccessPermissions";
import {
  isMissingTableError,
  resolveSellerScopeContext
} from "@/lib/rbac/sellerAccessScope";
import {
  getRoleDefaultPermissions,
  maskName,
  maskEmail,
  type PermissionValue,
  type SellerPermissionKey,
  type SellerRbacRole
} from "@/lib/rbac/sellerPolicy";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

type TeamMemberStatus = "active" | "inactive" | "pending";

type InviteRequestBody = {
  email?: string;
  full_name?: string;
  role?: SellerRbacRole;
  preset_key?: string;
  permissions?: Partial<Record<SellerPermissionKey, PermissionValue>>;
};

const ROLE_SORT: Record<SellerRbacRole, number> = {
  ADMIN: 0,
  FINANCEIRO: 1,
  OPERACAO: 2
};

const ACCESS_AUDIT_ACTIONS = [
  "role_changed",
  "permission_changed",
  "limit_changed",
  "invite_created",
  "invite_resent"
];

const isRole = (value: unknown): value is SellerRbacRole => {
  return value === "ADMIN" || value === "OPERACAO" || value === "FINANCEIRO";
};

const mapRole = (rawRole: string | null | undefined, fallback: SellerRbacRole): SellerRbacRole => {
  if (rawRole === "ADMIN" || rawRole === "OPERACAO" || rawRole === "FINANCEIRO") return rawRole;
  return fallback;
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const resolveRoleOverrides = (
  role: SellerRbacRole,
  body: InviteRequestBody
): Partial<Record<SellerPermissionKey, PermissionValue>> => {
  const roleDefaults = getRoleDefaultPermissions(role);
  const preset = getAccessPresetByKey(body.preset_key ?? null);
  const base = preset && preset.role === role ? preset.permissions : roleDefaults;
  const merged: Partial<Record<SellerPermissionKey, PermissionValue>> = { ...base };

  for (const [key, rawValue] of Object.entries(body.permissions ?? {})) {
    const normalized = normalizePermissionValue(key as SellerPermissionKey, rawValue);
    if (normalized === null) continue;
    merged[key as SellerPermissionKey] = normalized;
  }

  return buildPermissionDiff(role, merged);
};

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Autenticacao necessaria." }, { status: 401 });
  }

  const scope = await resolveSellerScopeContext(user.id);
  if (!scope) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const admin = getSupabaseAdminClient();

  const membershipLookup = await admin
    .from("seller_team_members")
    .select("user_id,status,created_at,last_access_at")
    .eq("seller_id", scope.sellerId);

  let membersTable: Array<{
    user_id: string;
    status: TeamMemberStatus;
    created_at: string | null;
    last_access_at: string | null;
  }> = [];

  if (membershipLookup.error) {
    if (!isMissingTableError(membershipLookup.error)) {
      return NextResponse.json({ error: membershipLookup.error.message }, { status: 500 });
    }
  } else {
    membersTable = (membershipLookup.data ?? []).map((row) => ({
      user_id: row.user_id,
      status: (row.status as TeamMemberStatus) ?? "active",
      created_at: row.created_at ?? null,
      last_access_at: row.last_access_at ?? null
    }));
  }

  const userIds = Array.from(
    new Set([scope.ownerUserId, ...membersTable.map((member) => member.user_id)])
  );

  const profilesLookup = await admin
    .from("profiles")
    .select("id,email,full_name,created_at")
    .in("id", userIds);

  if (profilesLookup.error) {
    return NextResponse.json({ error: profilesLookup.error.message }, { status: 500 });
  }

  const profilesById = new Map(
    (profilesLookup.data ?? []).map((profile) => [profile.id, profile])
  );

  const roleLookup = await admin
    .from("seller_user_roles")
    .select("user_id,role")
    .eq("seller_id", scope.sellerId)
    .in("user_id", userIds);
  const roleByUserId = new Map<string, SellerRbacRole>();

  if (!roleLookup.error) {
    for (const row of roleLookup.data ?? []) {
      const fallback = row.user_id === scope.ownerUserId ? "ADMIN" : "OPERACAO";
      roleByUserId.set(row.user_id, mapRole(row.role as string | undefined, fallback));
    }
  }

  const overridesByUserId = await loadPermissionOverridesForUsers(admin, scope.sellerId, userIds);
  const membersByUserId = new Map(membersTable.map((member) => [member.user_id, member]));

  const members = userIds
    .map((userId) => {
      const profile = profilesById.get(userId);
      const membership = membersByUserId.get(userId);
      const isOwner = userId === scope.ownerUserId;
      const role = roleByUserId.get(userId) ?? (isOwner ? "ADMIN" : "OPERACAO");
      const effectivePermissions = {
        ...getRoleDefaultPermissions(role),
        ...(overridesByUserId.get(userId) ?? {})
      };

      return {
        user_id: userId,
        name: maskName(profile?.full_name ?? profile?.email ?? "Usuario", scope.canViewFullPii),
        email: maskEmail(profile?.email ?? "", scope.canViewFullPii),
        email_full: scope.canViewFullPii ? profile?.email ?? null : null,
        role,
        status: isOwner ? "active" : membership?.status ?? "active",
        is_owner: isOwner,
        created_at: membership?.created_at ?? profile?.created_at ?? null,
        last_access_at: membership?.last_access_at ?? null,
        permissions: effectivePermissions,
        permission_overrides: overridesByUserId.get(userId) ?? {}
      };
    })
    .sort((a, b) => {
      if (a.is_owner && !b.is_owner) return -1;
      if (!a.is_owner && b.is_owner) return 1;
      if (ROLE_SORT[a.role] !== ROLE_SORT[b.role]) {
        return ROLE_SORT[a.role] - ROLE_SORT[b.role];
      }
      return a.name.localeCompare(b.name, "pt-BR");
    });

  const invitesLookup = await admin
    .from("seller_team_invites")
    .select("id,email,full_name,role,status,preset_key,created_at,expires_at")
    .eq("seller_id", scope.sellerId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(50);

  let pendingInvites: typeof invitesLookup.data = [];
  if (invitesLookup.error) {
    if (!isMissingTableError(invitesLookup.error)) {
      return NextResponse.json({ error: invitesLookup.error.message }, { status: 500 });
    }
  } else {
    pendingInvites = invitesLookup.data ?? [];
  }

  let recentChanges: unknown[] = [];
  if (scope.canViewAudit) {
    const auditLookup = await admin
      .from("seller_audit_logs")
      .select("id,action,created_at,actor_id,role,permission_used,before_state,after_state,notes")
      .eq("seller_id", scope.sellerId)
      .in("action", ACCESS_AUDIT_ACTIONS)
      .order("created_at", { ascending: false })
      .limit(20);

    if (!auditLookup.error) {
      recentChanges = auditLookup.data ?? [];
    }
  }

  return NextResponse.json({
    seller: {
      id: scope.sellerId,
      name: scope.sellerName
    },
    access: {
      can_manage_roles: scope.canManageRoles,
      can_view_audit: scope.canViewAudit,
      can_view_full_pii: scope.canViewFullPii
    },
    presets: SELLER_ACCESS_PRESETS,
    members,
    pending_invites: pendingInvites,
    recent_changes: recentChanges
  });
}

export async function POST(request: NextRequest) {
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

  const body = (await request.json()) as InviteRequestBody;
  const normalizedEmail = normalizeEmail(body.email ?? "");
  if (!normalizedEmail) {
    return NextResponse.json({ error: "Informe o e-mail do membro." }, { status: 400 });
  }

  const preset = getAccessPresetByKey(body.preset_key ?? null);
  const role = isRole(body.role) ? body.role : preset?.role ?? "OPERACAO";
  const permissionDiff = resolveRoleOverrides(role, body);

  const admin = getSupabaseAdminClient();
  const profileLookup = await admin
    .from("profiles")
    .select("id,email,full_name")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (profileLookup.error) {
    return NextResponse.json({ error: profileLookup.error.message }, { status: 500 });
  }

  const matchedProfile = profileLookup.data;

  if (matchedProfile?.id) {
    if (matchedProfile.id !== scope.ownerUserId) {
      const linkMember = await admin.from("seller_team_members").upsert(
        {
          seller_id: scope.sellerId,
          user_id: matchedProfile.id,
          status: "active",
          invited_by: user.id,
          invited_at: new Date().toISOString()
        },
        { onConflict: "seller_id,user_id" }
      );

      if (linkMember.error) {
        if (isMissingTableError(linkMember.error)) {
          return NextResponse.json(
            {
              error:
                "Tabela seller_team_members nao encontrada. Rode a migration de equipe e acessos."
            },
            { status: 400 }
          );
        }
        return NextResponse.json({ error: linkMember.error.message }, { status: 500 });
      }
    }

    const roleUpsert = await admin.from("seller_user_roles").upsert(
      {
        seller_id: scope.sellerId,
        user_id: matchedProfile.id,
        role
      },
      { onConflict: "seller_id,user_id" }
    );

    if (roleUpsert.error) {
      return NextResponse.json({ error: roleUpsert.error.message }, { status: 500 });
    }

    const permissionSync = await syncPermissionOverrides(
      admin,
      scope.sellerId,
      matchedProfile.id,
      permissionDiff
    );
    if (!permissionSync.ok) {
      return NextResponse.json({ error: permissionSync.error }, { status: 500 });
    }

    const ensureUserRole = await admin
      .from("user_roles")
      .upsert({ user_id: matchedProfile.id, role: "seller" }, { onConflict: "user_id" });
    if (ensureUserRole.error && !isMissingPermissionTableError(ensureUserRole.error)) {
      return NextResponse.json({ error: ensureUserRole.error.message }, { status: 500 });
    }

    await logSellerAuditEvent({
      actorUserId: user.id,
      sellerId: scope.sellerId,
      role: scope.rbac.role,
      permissionUsed: "users.manage_roles",
      action: "invite_created",
      beforeState: null,
      afterState: {
        change_type: "member_added",
        target_user_id: matchedProfile.id,
        role,
        permission_overrides: permissionDiff
      },
      requestIp: request.headers.get("x-forwarded-for"),
      userAgent: request.headers.get("user-agent")
    });

    return NextResponse.json({
      ok: true,
      mode: "member_attached",
      user_id: matchedProfile.id
    });
  }

  const inviteInsert = await admin.from("seller_team_invites").insert({
    id: randomUUID(),
    seller_id: scope.sellerId,
    email: normalizedEmail,
    full_name: body.full_name?.trim() || null,
    role,
    preset_key: preset?.key ?? null,
    permission_overrides: permissionDiff,
    status: "pending",
    invited_by: user.id,
    token: randomUUID(),
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  });

  if (inviteInsert.error) {
    if (isMissingTableError(inviteInsert.error)) {
      return NextResponse.json(
        {
          error:
            "Tabela seller_team_invites nao encontrada. Rode a migration de equipe e acessos."
        },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: inviteInsert.error.message }, { status: 500 });
  }

  await logSellerAuditEvent({
    actorUserId: user.id,
    sellerId: scope.sellerId,
    role: scope.rbac.role,
    permissionUsed: "users.manage_roles",
    action: "invite_created",
    beforeState: null,
    afterState: {
      change_type: "invite_created",
      email: normalizedEmail,
      role,
      preset_key: preset?.key ?? null
    },
    requestIp: request.headers.get("x-forwarded-for"),
    userAgent: request.headers.get("user-agent")
  });

  return NextResponse.json({
    ok: true,
    mode: "invite_pending",
    email: normalizedEmail
  });
}
