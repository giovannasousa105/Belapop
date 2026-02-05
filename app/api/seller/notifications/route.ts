import { NextRequest, NextResponse } from "next/server";

import { ensureSellerAuthenticated } from "@/lib/seller/serverAuth";
import { mapNotificationRow } from "@/lib/notifications/notificationService";

export async function GET(request: NextRequest) {
  const context = await ensureSellerAuthenticated(request);
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const limitParam = request.nextUrl.searchParams.get("limit");
  const filter = request.nextUrl.searchParams.get("filter");
  const limit = limitParam ? Number(limitParam) : 20;

  let query = context.supabase
    .from("notifications")
    .select("*")
    .eq("recipient_user_id", context.userId)
    .order("created_at", { ascending: false });

  if (filter === "unread") {
    query = query.eq("is_read", false);
  }

  if (limit && Number.isFinite(limit)) {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[seller/notifications] list failed", error);
    return NextResponse.json({ error: "Não foi possível carregar suas notificações." }, { status: 500 });
  }

  return NextResponse.json({ notifications: (data ?? []).map(mapNotificationRow) });
}
