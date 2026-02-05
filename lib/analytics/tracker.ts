import { analyticsEventTypes, AnalyticsEventType } from "@/lib/analytics/types";
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";

type TrackerPayload = {
  type: AnalyticsEventType;
  sellerId?: string;
  productId?: string;
  orderId?: string;
  metadata?: Record<string, unknown>;
  userId?: string;
};

const isValidEventType = (type: string): type is AnalyticsEventType =>
  analyticsEventTypes.includes(type as AnalyticsEventType);

export const trackEvent = async (payload: TrackerPayload) => {
  if (typeof window === "undefined") return;
  if (!isValidEventType(payload.type)) return;
  const supabase = getSupabaseBrowserClient();
  const { data } = await supabase.auth.getSession();
  const sessionUser = data.session?.user;
  try {
    await fetch("/api/analytics/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        userId: payload.userId ?? sessionUser?.id ?? null
      })
    });
  } catch (error) {
    console.error("[analytics] Failed to track event:", error);
  }
};

