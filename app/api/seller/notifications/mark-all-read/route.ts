import { NextRequest, NextResponse } from "next/server";

import { ensureSellerAuthenticated } from "@/lib/seller/serverAuth";

export async function POST(request: NextRequest) {
  const context = await ensureSellerAuthenticated(request);
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const { error } = await context.supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("recipient_user_id", context.userId);

  if (error) {
    console.error("[seller/notifications/mark-all-read] failed", error);
    return NextResponse.json({ error: "Não foi possível marcar todas as notificações." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
