import { NextResponse } from "next/server";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET(req: Request) {
  const secret = process.env.ADMIN_BOOTSTRAP_SECRET;
  const header = req.headers.get("x-admin-bootstrap-secret");
  const url = new URL(req.url);
  const userIdParam = url.searchParams.get("userId");

  if (secret && header === secret && userIdParam) {
    const admin = getSupabaseAdminClient();
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userIdParam)
      .maybeSingle();

    return NextResponse.json({ role: roleRow?.role ?? null, userId: userIdParam });
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ role: null }, { status: 200 });
  }

  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  return NextResponse.json({ role: roleRow?.role ?? null });
}
