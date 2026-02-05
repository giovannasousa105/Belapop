import { NextRequest, NextResponse } from "next/server";

import { ensureSellerAuthenticated } from "@/lib/seller/serverAuth";

export async function POST(request: NextRequest) {
  const context = await ensureSellerAuthenticated(request);
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const payload = await request.json().catch(() => ({} as { id?: string }));
  if (!payload.id) {
    return NextResponse.json({ error: "Id da notificação é obrigatório." }, { status: 400 });
  }

  const { error } = await context.supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", payload.id)
    .eq("recipient_user_id", context.userId);

  if (error) {
    console.error("[seller/notifications/mark-read] failed", error);
    return NextResponse.json({ error: "Não foi possível marcar a notificação." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
