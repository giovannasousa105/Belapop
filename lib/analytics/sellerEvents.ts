type SellerEventName =
  | "view_dashboard"
  | "filter_change"
  | "funnel_view"
  | "click_kpi_card"
  | "product_row_click"
  | "bulk_action_execute"
  | "alert_resolve"
  | "alert_snooze"
  | "alert_rule_create"
  | "resolve_alert"
  | "create_campaign"
  | "campaign_create"
  | "budget_change"
  | "pause"
  | "change_price"
  | "update_stock_lot"
  | "export_report"
  | "payout_view"
  | "payout_dispute_open"
  | "respond_review"
  | "dispatch_order";

type SellerEventPayload = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

export const trackSellerEvent = (event: SellerEventName, payload: SellerEventPayload = {}) => {
  if (typeof window === "undefined") return;

  const data = {
    event,
    source: "seller_dashboard",
    timestamp: new Date().toISOString(),
    ...payload
  };

  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push(data);

  if (process.env.NODE_ENV !== "production") {
    console.info("[seller-event]", data);
  }
};
