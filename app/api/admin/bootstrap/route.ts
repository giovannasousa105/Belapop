import { NextResponse } from "next/server";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type Body = { email?: string; userId?: string };

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

  let userId: string | null = null;
  let email: string | null = null;

  try {
    const body = (await req.json()) as Body;
    userId = body.userId ?? null;
    email = body.email ?? null;
  } catch (error) {
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

  const { error: upsertError } = await admin
    .from("user_roles")
    .upsert({ user_id: userId, role: "admin" });

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, userId });
}
