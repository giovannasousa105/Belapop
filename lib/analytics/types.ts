export const analyticsEventTypes = [
  "view_home",
  "view_catalog",
  "view_product",
  "search",
  "favorite",
  "add_to_cart",
  "remove_from_cart",
  "start_checkout",
  "select_shipping",
  "purchase",
  "seller_signup",
  "seller_product_created",
  "seller_product_published",
  "admin_seller_approved",
  "admin_product_approved"
] as const;

export type AnalyticsEventType = (typeof analyticsEventTypes)[number];
