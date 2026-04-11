import { NextResponse } from "next/server";

import { resolveUserRoleState, setActiveLegacyRole, type LegacyRole } from "@/lib/auth/roleState";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

const isRole = (value: unknown): value is LegacyRole => {
  return value === "customer" || value === "seller" || value === "admin";
};

async function readRoleStateForUser(userId: string) {
  const admin = getSupabaseAdminClient();
  const authLookup = await admin.auth.admin.getUserById(userId);
  const roleState = await resolveUserRoleState({
    userId,
    admin,
    authUser: authLookup.data.user ?? null
  });
  return {
    role: roleState.activeRole,
    roles: roleState.assignedRoles,
    userId
  };
}

export async function GET(req: Request) {
  const secret = process.env.ADMIN_BOOTSTRAP_SECRET;
  const header = req.headers.get("x-admin-bootstrap-secret");
  const url = new URL(req.url);
  const userIdParam = url.searchParams.get("userId");

  if (secret && header === secret && userIdParam) {
    return NextResponse.json(await readRoleStateForUser(userIdParam));
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ role: null, roles: [] }, { status: 200 });
  }

  return NextResponse.json(await readRoleStateForUser(user.id));
}

export async function POST(req: Request) {
  const supabase = await getSupabaseServerClient();
  const admin = getSupabaseAdminClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  let body: { role?: LegacyRole };
  try {
    body = (await req.json()) as { role?: LegacyRole };
  } catch {
    return NextResponse.json({ error: "Body invalido." }, { status: 400 });
  }

  if (!isRole(body.role)) {
    return NextResponse.json({ error: "role invalido. Use customer|seller|admin." }, { status: 400 });
  }

  const roleState = await resolveUserRoleState({
    userId: user.id,
    authUser: user,
    admin
  });

  if (!roleState.assignedRoles.includes(body.role)) {
    return NextResponse.json({ error: "Role nao atribuido para este usuario." }, { status: 403 });
  }

  await setActiveLegacyRole({
    userId: user.id,
    role: body.role,
    admin
  });

  return NextResponse.json({
    role: body.role,
    roles: roleState.assignedRoles
  });
}
