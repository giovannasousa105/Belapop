/**
 * Camada de abstração de analytics — centraliza GA4, Meta Pixel e TikTok Pixel.
 * Nunca chamar gtag/fbq/ttq diretamente no código de produto — usar estas funções.
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    ttq?: { track: (event: string, data?: Record<string, unknown>) => void };
  }
}

type Currency = "BRL";

type AnalyticsItem = {
  item_id: string;
  item_name: string;
  item_category?: string;
  price: number;
  quantity?: number;
};

function gtag(...args: unknown[]) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag(...args);
  }
}

function fbq(event: string, data?: Record<string, unknown>) {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq("track", event, data);
  }
}

function ttq(event: string, data?: Record<string, unknown>) {
  if (typeof window !== "undefined" && window.ttq?.track) {
    window.ttq.track(event, data);
  }
}

// ── Pageview ──────────────────────────────────────────────────────────────────

export function trackPageView(url: string) {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (measurementId) {
    gtag("config", measurementId, { page_path: url });
  }
  fbq("PageView");
  ttq("ViewContent", { page_url: url });
}

// ── Ecommerce GA4 ─────────────────────────────────────────────────────────────

export function trackViewItem(item: AnalyticsItem) {
  gtag("event", "view_item", {
    currency: "BRL" as Currency,
    value: item.price,
    items: [{ ...item, quantity: 1 }]
  });
  fbq("ViewContent", {
    content_ids: [item.item_id],
    content_name: item.item_name,
    content_type: "product",
    value: item.price,
    currency: "BRL"
  });
  ttq("ViewContent", {
    content_id: item.item_id,
    content_name: item.item_name,
    value: item.price,
    currency: "BRL"
  });
}

export function trackAddToCart(items: AnalyticsItem[], value: number) {
  gtag("event", "add_to_cart", { currency: "BRL" as Currency, value, items });
  fbq("AddToCart", {
    content_ids: items.map((i) => i.item_id),
    value,
    currency: "BRL",
    num_items: items.length
  });
  ttq("AddToCart", { value, currency: "BRL" });
}

export function trackViewCart(items: AnalyticsItem[], value: number) {
  gtag("event", "view_cart", { currency: "BRL" as Currency, value, items });
}

export function trackBeginCheckout(items: AnalyticsItem[], value: number, coupon?: string) {
  gtag("event", "begin_checkout", {
    currency: "BRL" as Currency,
    value,
    items,
    ...(coupon ? { coupon } : {})
  });
  fbq("InitiateCheckout", {
    content_ids: items.map((i) => i.item_id),
    value,
    currency: "BRL",
    num_items: items.length
  });
  ttq("InitiateCheckout", { value, currency: "BRL" });
}

export function trackPurchase(
  transactionId: string,
  items: AnalyticsItem[],
  value: number,
  coupon?: string
) {
  gtag("event", "purchase", {
    transaction_id: transactionId,
    currency: "BRL" as Currency,
    value,
    items,
    ...(coupon ? { coupon } : {})
  });
  fbq("Purchase", {
    content_ids: items.map((i) => i.item_id),
    value,
    currency: "BRL",
    num_items: items.length
  });
  ttq("CompletePayment", { value, currency: "BRL" });
}

// ── Eventos proprietários BelaPop ─────────────────────────────────────────────

export function trackScanStarted(focosCount: number) {
  gtag("event", "scan_started", { focos_count: focosCount });
}

export function trackScanCompleted(focos: string[], resultId: string) {
  gtag("event", "scan_completed", { focos, result_id: resultId });
}

export function trackScanConverted(resultId: string, productsCount: number, totalValue: number) {
  gtag("event", "scan_converted", {
    result_id: resultId,
    products_count: productsCount,
    total_value: totalValue
  });
}

export function trackPopClubJoined() {
  gtag("event", "popclub_joined");
}

export function trackUniverseClicked(universeName: string) {
  gtag("event", "universe_clicked", { universe_name: universeName });
}

export function trackGuideRead(guideSlug: string, guideType: "ativo" | "rotina" | "vale_o_investimento") {
  gtag("event", "guide_read", { guide_slug: guideSlug, guide_type: guideType });
}
