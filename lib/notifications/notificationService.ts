import { getSupabaseServerClient } from "@/lib/supabaseServer";

import { NotificationRecord } from "@/lib/types";

type CreateNotificationPayload = {
  recipientUserId: string;
  sellerId?: string;
  type: string;
  title: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
  metadata?: Record<string, unknown>;
};

export async function createNotification(payload: CreateNotificationPayload) {
  const supabase = await getSupabaseServerClient();
  const { error } = await supabase.from("notifications").insert([
    {
      recipient_user_id: payload.recipientUserId,
      seller_id: payload.sellerId ?? null,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      cta_label: payload.ctaLabel ?? null,
      cta_href: payload.ctaHref ?? null,
      metadata: payload.metadata ?? {},
      is_read: false
    }
  ]);

  if (error) {
    console.error("[notifications] createNotification failed", error);
    throw error;
  }
}

export const mapNotificationRow = (row: any): NotificationRecord => ({
  id: row.id,
  type: row.type,
  title: row.title,
  body: row.body,
  ctaLabel: row.cta_label ?? null,
  ctaHref: row.cta_href ?? null,
  metadata: row.metadata ?? {},
  isRead: Boolean(row.is_read),
  createdAt: row.created_at
});
