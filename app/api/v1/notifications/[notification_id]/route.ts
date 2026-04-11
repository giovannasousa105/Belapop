import { NextRequest, NextResponse } from "next/server";

import { requireCustomerApiContext } from "@/lib/api/v1/customer-auth";

type PatchBody = {
  is_read?: boolean;
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ notification_id: string }> }
) {
  const auth = await requireCustomerApiContext();
  if (!auth.ok) return auth.response;

  const { notification_id: notificationId } = await params;
  const body = (await request.json().catch(() => ({}))) as PatchBody;
  const isRead = body.is_read ?? true;
  const { admin, userId } = auth.ctx;

  const { data, error } = await admin
    .from("notifications")
    .update({ is_read: isRead })
    .eq("id", notificationId)
    .eq("recipient_user_id", userId)
    .select("id,type,title,body,cta_label,cta_href,metadata,is_read,created_at")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Notificacao nao encontrada." }, { status: 404 });

  return NextResponse.json(data);
}
