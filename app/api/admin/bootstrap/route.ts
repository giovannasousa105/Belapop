import { NextResponse } from "next/server";

import { ensureRoleMemberships, setActiveLegacyRole, type LegacyRole } from "@/lib/auth/roleState";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type Body = {
  email?: string;
  userId?: string;
  roles?: LegacyRole[];
  activeRole?: LegacyRole;
};

const isRole = (value: unknown): value is LegacyRole => {
  return value === "customer" || value === "seller" || value === "admin";
};

export async function POST(req: Request) {
  const secret = process.env.ADMIN_BOOTSTRAP_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Secret not configured." }, { status: 500 });
  }

  const header = req.headers.get("x-admin-bootstrap-secret");
  if (header !== secret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = getSupabaseAdminClient();

  let body: Body = {};
  let userId: string | null = null;
  let email: string | null = null;

  try {
    body = (await req.json()) as Body;
    userId = body.userId ?? null;
    email = body.email ?? null;
  } catch {
    return NextResponse.json({ error: "Invalid body." }, { status: 400 });
  }

  if (!userId && !email) {
    return NextResponse.json({ error: "Provide email or userId." }, { status: 400 });
  }

  if (!userId && email) {
    // Best-effort lookup
    const { data, error } = await admin.auth.admin.listUsers();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const found = data.users.find((u) => u.email?.toLowerCase() === email?.toLowerCase());
    if (!found) {
      return NextResponse.json({ error: "User not found by email." }, { status: 404 });
    }
    userId = found.id;
  }

  if (!userId) {
    return NextResponse.json({ error: "User id not resolved." }, { status: 400 });
  }

  const requestedRoles: LegacyRole[] = Array.isArray(body.roles)
    ? body.roles.filter(isRole)
    : ["admin"];
  const roles: LegacyRole[] = Array.from(
    new Set(requestedRoles.length ? requestedRoles : (["admin"] as LegacyRole[]))
  );
  const activeRole: LegacyRole = isRole(body.activeRole)
    ? body.activeRole
    : roles.includes("admin")
      ? "admin"
      : roles[0];

  if (!roles.includes(activeRole)) {
    roles.push(activeRole);
  }

  try {
    await ensureRoleMemberships({
      userId,
      roles,
      source: "admin-bootstrap",
      admin
    });
    await setActiveLegacyRole({
      userId,
      role: activeRole,
      admin
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? "Falha ao aplicar roles." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, userId, roles, activeRole });
}
