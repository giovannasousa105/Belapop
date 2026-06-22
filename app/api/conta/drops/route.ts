import "server-only";

import { NextResponse } from "next/server";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const admin = getSupabaseAdminClient();

  // Busca drop ativo (live) e agendado
  const { data: activeDrops } = await admin
    .from("drops")
    .select("id, slug, title, subtitle, cover_image_url, status, opens_at, closes_at")
    .in("status", ["live", "scheduled"])
    .order("opens_at", { ascending: true })
    .limit(1);

  // Busca pedidos do usuário
  const { data: orders } = await admin
    .from("drop_orders")
    .select("id, drop_id, status, total_cents, created_at, drops(title, slug, number)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  // Verifica membership no Círculo
  const { data: member } = await admin
    .from("circulo_members")
    .select("id, name, skin_concern")
    .eq("email", user.email!)
    .is("unsubscribed_at", null)
    .maybeSingle();

  return NextResponse.json({
    activeDrop:  activeDrops?.[0] ?? null,
    orders:      orders ?? [],
    isMember:    !!member,
    member:      member ?? null,
  });
}
