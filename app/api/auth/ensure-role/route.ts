import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabaseServer";
import type { UserRole } from "@/lib/types";

type EnsureRoleResponse = {
  role: UserRole;
};

export async function POST() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { data: existing } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing?.role) {
    return NextResponse.json({ role: existing.role } satisfies EnsureRoleResponse);
  }

  const { data: sellerRow } = await supabase
    .from("sellers")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: sellerProfileRow } = await supabase
    .from("seller_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const role: UserRole = sellerRow || sellerProfileRow ? "seller" : "customer";

  const { error } = await supabase.from("user_roles").insert({
    user_id: user.id,
    role
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ role } satisfies EnsureRoleResponse);
}
