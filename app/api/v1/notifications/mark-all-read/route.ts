import { NextResponse } from "next/server";

import { requireCustomerApiContext } from "@/lib/api/v1/customer-auth";

export async function POST() {
  const auth = await requireCustomerApiContext();
  if (!auth.ok) return auth.response;

  const { admin, userId } = auth.ctx;
  const { error } = await admin
    .from("notifications")
    .update({ is_read: true })
    .eq("recipient_user_id", userId)
    .eq("is_read", false);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
