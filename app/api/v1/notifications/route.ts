import { NextRequest, NextResponse } from "next/server";

import { requireCustomerApiContext } from "@/lib/api/v1/customer-auth";

export async function GET(request: NextRequest) {
  const auth = await requireCustomerApiContext();
  if (!auth.ok) return auth.response;

  const { admin, userId } = auth.ctx;
  const unreadOnly = request.nextUrl.searchParams.get("unread") === "1";
  const limit = Math.min(100, Math.max(1, Number(request.nextUrl.searchParams.get("limit") ?? "30")));

  let query = admin
    .from("notifications")
    .select("id,type,title,body,cta_label,cta_href,metadata,is_read,created_at")
    .eq("recipient_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (unreadOnly) query = query.eq("is_read", false);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ items: data ?? [] });
}
