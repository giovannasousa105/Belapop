import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  buildDeterministicKey,
  emitPlatformEvent,
  queueNotificationChannels,
  type NotificationChannel
} from "@/lib/events/platformEventBus";
import { getPublicUrl } from "@/lib/publicEnv";

type AnyAdmin = SupabaseClient;

type LifecycleAutomationKey =
  | "order_confirmed"
  | "order_shipped"
  | "post_delivery_checkin"
  | "usage_guidance"
  | "complementary_recommendation"
  | "review_request"
  | "reorder_reminder"
  | "abandoned_interest";

type CommunicationType = "transactional" | "marketing";

type LifecycleRunRow = {
  id: string;
  run_key: string;
  automation_key: LifecycleAutomationKey;
  communication_type: CommunicationType;
  customer_user_id: string;
  order_id: string | null;
  order_item_id: string | null;
  cart_id: string | null;
  product_id: string | null;
  status: "scheduled" | "queued" | "sent" | "skipped" | "canceled" | "failed";
  channels: string[] | null;
  scheduled_at: string;
  payload: Record<string, unknown> | null;
};

type OrderRow = {
  id: string;
  customer_id: string;
  status: string | null;
  shipping_status?: string | null;
  total_order_cents?: number | null;
  created_at: string;
};

type OrderItemRow = {
  id: string;
  order_id: string;
  product_id: string | null;
  seller_id: string | null;
  quantity: number | null;
  qty?: number | null;
  unit_price_cents?: number | null;
  subtotal_cents?: number | null;
  total_price_cents?: number | null;
};

type ProductRow = {
  id: string;
  slug: string | null;
  title: string | null;
  name: string | null;
  brand: string | null;
  category: string | null;
  hero_image_url: string | null;
  description: string | null;
  how_to_use?: unknown;
  ritual?: string | null;
  texture?: string | null;
  status?: string | null;
  is_featured?: boolean | null;
  curated?: boolean | null;
  seller_id?: string | null;
  stock_quantity?: number | null;
};

type ShipmentRow = {
  id: string;
  order_id: string;
  status: string | null;
  carrier: string | null;
  tracking_code: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type EventRow = {
  order_id: string | null;
  event_name: string | null;
  occurred_at: string;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type CartRow = {
  id: string;
  user_id: string | null;
  status: string | null;
  items: unknown;
  updated_at: string | null;
  created_at: string | null;
};

type AnalyticsEventRow = {
  id: string;
  user_id: string | null;
  product_id: string | null;
  type: string | null;
  created_at: string;
};

type ProductSnapshot = {
  orderItemId: string | null;
  productId: string;
  slug: string;
  title: string;
  brand: string | null;
  category: string | null;
  imageUrl: string | null;
  description: string | null;
  howToUse: string[];
  quantity: number;
};

type OrderContext = {
  orderId: string;
  customerUserId: string;
  customerName: string;
  customerEmail: string | null;
  status: string;
  shippingStatus: string | null;
  createdAt: string;
  paidAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  estimatedShippingDays: number | null;
  shippingService: string | null;
  shipment: ShipmentRow | null;
  items: ProductSnapshot[];
};

type SubOrderShippingRow = {
  order_id: string;
  shipping_days: number | null;
  shipping_service: string | null;
};

type ComplementaryProduct = {
  productId: string;
  slug: string;
  title: string;
  category: string | null;
};

type LifecycleTemplate = {
  title: string;
  subject: string;
  body: string;
  html: string;
  ctaLabel: string;
  ctaHref: string;
  channels: NotificationChannel[];
  metadata: Record<string, unknown>;
};

type ProcessLifecycleArgs = {
  admin: AnyAdmin;
  seedLimit?: number;
  cartLimit?: number;
  viewLimit?: number;
  dispatchLimit?: number;
};

type ProcessLifecycleResult = {
  orders_scanned: number;
  runs_seeded: number;
  runs_canceled: number;
  carts_scanned: number;
  views_scanned: number;
  queued: number;
  skipped: number;
  failed: number;
};

const BASE_URL = getPublicUrl(
  process.env.NEXT_PUBLIC_SITE_URL,
  "https://belapopoficial.com.br"
);

const DAY_MS = 86_400_000;
const TRANSACTIONAL_CHANNELS: NotificationChannel[] = ["in_app", "email", "whatsapp"];
const MARKETING_CHANNELS: NotificationChannel[] = ["email", "whatsapp"];
const COMMUNICATION_LABEL: Record<CommunicationType, string> = {
  transactional: "transactional",
  marketing: "marketing"
};

const AUTOMATION_CONFIG: Record<
  LifecycleAutomationKey,
  {
    communicationType: CommunicationType;
    maxPastAgeDays: number;
  }
> = {
  order_confirmed: { communicationType: "transactional", maxPastAgeDays: 2 },
  order_shipped: { communicationType: "transactional", maxPastAgeDays: 2 },
  post_delivery_checkin: { communicationType: "transactional", maxPastAgeDays: 7 },
  usage_guidance: { communicationType: "transactional", maxPastAgeDays: 7 },
  complementary_recommendation: { communicationType: "marketing", maxPastAgeDays: 14 },
  review_request: { communicationType: "marketing", maxPastAgeDays: 21 },
  reorder_reminder: { communicationType: "marketing", maxPastAgeDays: 30 },
  abandoned_interest: { communicationType: "marketing", maxPastAgeDays: 3 }
};

const normalizeStatus = (value: string | null | undefined) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace("cancelled", "canceled");

const normalizeCategory = (value: string | null | undefined) => {
  const normalized = String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
  if (normalized.includes("maqui")) return "maquiagem";
  if (normalized.includes("cabel")) return "cabelos";
  if (normalized.includes("perf")) return "perfumes";
  if (normalized.includes("skin")) return "skincare";
  return normalized || "outro";
};

const reorderDaysByCategory: Record<string, number> = {
  skincare: 35,
  cabelos: 45,
  perfumes: 75,
  maquiagem: 90,
  outro: 60
};

const skincareComplementSteps: Record<string, string[]> = {
  cleanser: ["serum", "moisturizer", "sunscreen"],
  serum: ["moisturizer", "sunscreen", "cleanser"],
  moisturizer: ["sunscreen", "cleanser", "serum"],
  sunscreen: ["cleanser", "moisturizer"],
  essence: ["serum", "moisturizer"],
  toner: ["serum", "moisturizer"]
};

const toIso = (value: string | Date | null | undefined) => {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

const addDays = (value: string, days: number) => {
  const base = new Date(value);
  return new Date(base.getTime() + days * DAY_MS).toISOString();
};

const formatShippingEstimate = (days: number | null) => {
  if (!Number.isFinite(days) || !days || days <= 0) return null;
  if (days === 1) return "1 dia estimado";
  return `${days} dias estimados`;
};

const canBackfill = (scheduledAtIso: string, automationKey: LifecycleAutomationKey) => {
  const scheduledAt = Date.parse(scheduledAtIso);
  if (!Number.isFinite(scheduledAt)) return false;
  const delta = Date.now() - scheduledAt;
  if (delta <= 0) return true;
  return delta <= AUTOMATION_CONFIG[automationKey].maxPastAgeDays * DAY_MS;
};

const shortOrderId = (orderId: string) => orderId.slice(0, 8).toUpperCase();

const extractTextList = (value: unknown) =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];

const firstSentence = (value: string | null | undefined) => {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  if (!text) return "";
  const match = text.match(/^[^.!?]+[.!?]?/);
  return (match?.[0] ?? text).trim();
};

const htmlEscape = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const absoluteUrl = (path: string) => {
  if (/^https?:\/\//i.test(path)) return path;
  return `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
};

const automationTemplateKey = (key: LifecycleAutomationKey) => `customer.lifecycle.${key}`;

const defaultChannelsForCommunicationType = (
  communicationType: CommunicationType
): NotificationChannel[] =>
  communicationType === "marketing" ? MARKETING_CHANNELS : TRANSACTIONAL_CHANNELS;

const buildEmailHtml = ({
  eyebrow,
  heading,
  intro,
  bullets,
  ctaLabel,
  ctaHref,
  footer,
  commercial
}: {
  eyebrow: string;
  heading: string;
  intro: string;
  bullets: string[];
  ctaLabel: string;
  ctaHref: string;
  footer?: string[];
  commercial?: boolean;
}) => {
  const footerLines = footer ?? [];
  return `
    <div style="background:#111111;padding:32px 16px;font-family:Inter,Arial,sans-serif;color:#F8F7F4;">
      <div style="max-width:640px;margin:0 auto;border:1px solid rgba(248,247,244,0.1);background:#151515;padding:32px 28px;">
        <p style="margin:0 0 10px;font-size:11px;letter-spacing:0.32em;text-transform:uppercase;color:#D8C7B6;">${htmlEscape(eyebrow)}</p>
        <h1 style="margin:0 0 18px;font-family:'Playfair Display',Georgia,serif;font-size:32px;line-height:1.1;font-weight:700;color:#F8F7F4;">${htmlEscape(heading)}</h1>
        <p style="margin:0 0 20px;font-size:15px;line-height:1.8;color:#D7D1CB;">${htmlEscape(intro)}</p>
        ${
          bullets.length > 0
            ? `<ul style="margin:0 0 26px;padding-left:20px;color:#F8F7F4;font-size:14px;line-height:1.8;">
                ${bullets.map((item) => `<li style="margin:0 0 8px;">${htmlEscape(item)}</li>`).join("")}
              </ul>`
            : ""
        }
        <a href="${htmlEscape(absoluteUrl(ctaHref))}" style="display:inline-block;background:#8E5B68;color:#FFFFFF;text-decoration:none;padding:14px 22px;font-size:11px;letter-spacing:0.26em;text-transform:uppercase;border-radius:999px;">${htmlEscape(ctaLabel)}</a>
        ${
          footerLines.length > 0
            ? `<div style="margin-top:28px;padding-top:20px;border-top:1px solid rgba(248,247,244,0.1);font-size:12px;line-height:1.8;color:#B8B8B8;">
                ${footerLines.map((item) => `<p style="margin:0 0 10px;">${htmlEscape(item)}</p>`).join("")}
              </div>`
            : ""
        }
        ${
          commercial
            ? `<p style="margin-top:18px;font-size:11px;line-height:1.7;color:#A9A19A;">
                Preferencias de comunicacao: <a href="${htmlEscape(absoluteUrl("/conta/dados"))}" style="color:#D8C7B6;">gerenciar descadastro</a>
              </p>`
            : ""
        }
      </div>
    </div>
  `;
};

const buildRunKey = (parts: Array<string | null | undefined>) => buildDeterministicKey(parts);

const coerceQuantity = (row: OrderItemRow) =>
  Number(row.quantity ?? row.qty ?? 1) > 0 ? Number(row.quantity ?? row.qty ?? 1) : 1;

const pickPrimaryItem = (items: ProductSnapshot[]) =>
  [...items].sort((left, right) => right.quantity - left.quantity)[0] ?? null;

const mapProductSnapshot = (item: OrderItemRow, product: ProductRow | undefined): ProductSnapshot | null => {
  if (!item.product_id || !product) return null;
  return {
    orderItemId: item.id ?? null,
    productId: item.product_id,
    slug: product.slug ?? item.product_id,
    title: product.title ?? product.name ?? "Produto BelaPop",
    brand: product.brand ?? null,
    category: product.category ?? null,
    imageUrl: product.hero_image_url ?? null,
    description: product.description ?? null,
    howToUse: extractTextList(product.how_to_use),
    quantity: coerceQuantity(item)
  };
};

const loadRecentOrderContexts = async (admin: AnyAdmin, limit: number): Promise<OrderContext[]> => {
  const cutoffIso = new Date(Date.now() - 180 * DAY_MS).toISOString();
  const { data: ordersData, error: ordersError } = await admin
    .from("orders")
    .select("id,customer_id,status,shipping_status,total_order_cents,created_at")
    .gte("created_at", cutoffIso)
    .not("customer_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (ordersError) throw new Error(ordersError.message);

  const orders = (ordersData ?? []) as OrderRow[];
  if (!orders.length) return [];

  const orderIds = orders.map((row) => row.id);
  const customerIds = Array.from(new Set(orders.map((row) => row.customer_id).filter(Boolean)));

  const [{ data: orderItemsData }, { data: shipmentData }, { data: eventData }, { data: profileData }, { data: subOrdersData }] =
    await Promise.all([
      admin
        .from("order_items")
        .select("id,order_id,product_id,seller_id,quantity,qty,unit_price_cents,subtotal_cents,total_price_cents")
        .in("order_id", orderIds),
      admin
        .from("shipments")
        .select("id,order_id,status,carrier,tracking_code,created_at,updated_at")
        .in("order_id", orderIds)
        .order("updated_at", { ascending: false }),
      admin
        .from("marketplace_events")
        .select("order_id,event_name,occurred_at")
        .in("order_id", orderIds)
        .in("event_name", ["order_paid", "order_canceled", "refund_settled", "chargeback_opened"]),
      admin.from("profiles").select("id,full_name,email").in("id", customerIds),
      admin
        .from("sub_orders")
        .select("order_id,shipping_days,shipping_service")
        .in("order_id", orderIds)
    ]);

  const orderItems = (orderItemsData ?? []) as OrderItemRow[];
  const productIds = Array.from(
    new Set(orderItems.map((row) => row.product_id).filter((value): value is string => Boolean(value)))
  );

  const { data: productData, error: productError } = productIds.length
    ? await admin
        .from("products")
        .select("id,slug,title,name,brand,category,hero_image_url,description,how_to_use,ritual,texture,status,is_featured,curated,seller_id,stock_quantity")
        .in("id", productIds)
    : { data: [], error: null };

  if (productError) throw new Error(productError.message);

  const productMap = new Map(((productData ?? []) as ProductRow[]).map((row) => [row.id, row]));
  const profileMap = new Map(((profileData ?? []) as ProfileRow[]).map((row) => [row.id, row]));
  const eventMap = new Map<string, EventRow[]>();
  const shippingMetaByOrder = new Map<string, { shippingDays: number | null; shippingService: string | null }>();
  for (const row of (eventData ?? []) as EventRow[]) {
    if (!row.order_id) continue;
    const list = eventMap.get(row.order_id) ?? [];
    list.push(row);
    eventMap.set(row.order_id, list);
  }

  for (const row of (subOrdersData ?? []) as SubOrderShippingRow[]) {
    const current = shippingMetaByOrder.get(row.order_id);
    const nextDays =
      typeof row.shipping_days === "number" && Number.isFinite(row.shipping_days) && row.shipping_days > 0
        ? row.shipping_days
        : null;
    const nextService = String(row.shipping_service ?? "").trim() || null;

    if (!current) {
      shippingMetaByOrder.set(row.order_id, {
        shippingDays: nextDays,
        shippingService: nextService
      });
      continue;
    }

    shippingMetaByOrder.set(row.order_id, {
      shippingDays:
        nextDays !== null && (current.shippingDays === null || nextDays > current.shippingDays)
          ? nextDays
          : current.shippingDays,
      shippingService: current.shippingService ?? nextService
    });
  }

  const shipmentMap = new Map<string, ShipmentRow>();
  for (const row of (shipmentData ?? []) as ShipmentRow[]) {
    if (!row.order_id) continue;
    if (!shipmentMap.has(row.order_id)) {
      shipmentMap.set(row.order_id, row);
      continue;
    }
    const current = shipmentMap.get(row.order_id)!;
    const currentDate = Date.parse(String(current.updated_at ?? current.created_at ?? ""));
    const nextDate = Date.parse(String(row.updated_at ?? row.created_at ?? ""));
    if (!Number.isFinite(currentDate) || nextDate > currentDate) {
      shipmentMap.set(row.order_id, row);
    }
  }

  const itemsByOrder = orderItems.reduce<Map<string, ProductSnapshot[]>>((acc, row) => {
    const snapshot = mapProductSnapshot(row, row.product_id ? productMap.get(row.product_id) : undefined);
    if (!snapshot) return acc;
    const list = acc.get(row.order_id) ?? [];
    list.push(snapshot);
    acc.set(row.order_id, list);
    return acc;
  }, new Map());

  return orders.map((order) => {
    const events = eventMap.get(order.id) ?? [];
    const paidAt =
      events.find((row) => normalizeStatus(row.event_name) === "order_paid")?.occurred_at ??
      null;
    const latestShipment = shipmentMap.get(order.id) ?? null;
    const shipmentStatus = normalizeStatus(latestShipment?.status ?? order.shipping_status ?? null);
    const deliveredAt =
      shipmentStatus === "delivered"
        ? toIso(latestShipment?.updated_at ?? latestShipment?.created_at ?? order.created_at)
        : normalizeStatus(order.status) === "delivered"
          ? toIso(order.created_at)
          : null;
    const shippedAt =
      latestShipment && latestShipment.tracking_code
        ? toIso(latestShipment.updated_at ?? latestShipment.created_at)
        : shipmentStatus === "in_transit"
          ? toIso(latestShipment?.updated_at ?? latestShipment?.created_at ?? order.created_at)
          : null;
    const profile = profileMap.get(order.customer_id);
    const shippingMeta = shippingMetaByOrder.get(order.id);

    return {
      orderId: order.id,
      customerUserId: order.customer_id,
      customerName:
        profile?.full_name?.trim() ||
        profile?.email?.split("@")[0] ||
        "Cliente BelaPop",
      customerEmail: profile?.email ?? null,
      status: normalizeStatus(order.status),
      shippingStatus: shipmentStatus || null,
      createdAt: order.created_at,
      paidAt,
      shippedAt,
      deliveredAt,
      estimatedShippingDays: shippingMeta?.shippingDays ?? null,
      shippingService: shippingMeta?.shippingService ?? null,
      shipment: latestShipment,
      items: itemsByOrder.get(order.id) ?? []
    } satisfies OrderContext;
  });
};

const cancelPendingRunsForOrder = async (admin: AnyAdmin, orderId: string, reason: string) => {
  const { data, error } = await admin
    .from("customer_lifecycle_automation_runs")
    .update({
      status: "canceled",
      canceled_reason: reason,
      finalized_at: new Date().toISOString()
    })
    .eq("order_id", orderId)
    .in("status", ["scheduled", "queued"])
    .select("id");

  if (error) throw new Error(error.message);
  return (data ?? []).length;
};

const insertLifecycleRun = async (admin: AnyAdmin, row: {
  runKey: string;
  automationKey: LifecycleAutomationKey;
  customerUserId: string;
  orderId?: string | null;
  orderItemId?: string | null;
  cartId?: string | null;
  productId?: string | null;
  scheduledAt: string;
  payload: Record<string, unknown>;
}) => {
  const config = AUTOMATION_CONFIG[row.automationKey];
  if (!canBackfill(row.scheduledAt, row.automationKey)) {
    return false;
  }

  const insert = await admin
    .from("customer_lifecycle_automation_runs")
    .insert({
      run_key: row.runKey,
      automation_key: row.automationKey,
      communication_type: config.communicationType,
      customer_user_id: row.customerUserId,
      order_id: row.orderId ?? null,
      order_item_id: row.orderItemId ?? null,
      cart_id: row.cartId ?? null,
      product_id: row.productId ?? null,
      channels: defaultChannelsForCommunicationType(config.communicationType),
      scheduled_at: row.scheduledAt,
      payload: row.payload
    });

  if (!insert.error) return true;
  if (insert.error.code === "23505") return false;
  throw new Error(insert.error.message);
};

const buildOrderUrls = (orderId: string) => ({
  order: `/conta/pedidos/${orderId}`,
  tracking: `/conta/pedidos/${orderId}`,
  support: `/contato`,
  preferences: `/conta/dados`
});

const renderOrderSummary = (items: ProductSnapshot[]) =>
  items.map((item) => `${item.quantity}x ${item.title}`).join(" | ");

const renderUsageBullets = (items: ProductSnapshot[]) =>
  items
    .flatMap((item) =>
      (item.howToUse.length ? item.howToUse : ["Siga a orientacao da embalagem e introduza novos produtos aos poucos."]).map(
        (line) => `${item.title}: ${line}`
      )
    )
    .slice(0, 4);

const resolveExplicitComplements = async (
  admin: AnyAdmin,
  sourceProductIds: string[],
  excludedProductIds: string[]
) => {
  if (!sourceProductIds.length) return [] as ComplementaryProduct[];

  const relationLookup = await admin
    .from("product_complements")
    .select("source_product_id,target_product_id,position")
    .in("source_product_id", sourceProductIds)
    .eq("active", true)
    .order("position", { ascending: true });

  if (relationLookup.error) {
    if (relationLookup.error.code === "42P01") return [];
    throw new Error(relationLookup.error.message);
  }

  const targetIds = Array.from(
    new Set(
      (relationLookup.data ?? [])
        .map((row) => String(row.target_product_id ?? ""))
        .filter((id) => id.length > 0 && !excludedProductIds.includes(id))
    )
  );
  if (!targetIds.length) return [];

  const productLookup = await admin
    .from("products")
    .select("id,slug,title,name,category,status,stock_quantity")
    .in("id", targetIds)
    .in("status", ["active", "published"])
    .gt("stock_quantity", 0);

  if (productLookup.error) throw new Error(productLookup.error.message);

  return ((productLookup.data ?? []) as ProductRow[]).map((row) => ({
    productId: row.id,
    slug: row.slug ?? row.id,
    title: row.title ?? row.name ?? "Produto BelaPop",
    category: row.category ?? null
  }));
};

const resolveRoutineComplements = async (
  admin: AnyAdmin,
  items: ProductSnapshot[],
  excludedProductIds: string[]
) => {
  const sourceIds = items.map((item) => item.productId);
  if (!sourceIds.length) return [] as ComplementaryProduct[];

  const routineLookup = await admin
    .from("product_routine_steps")
    .select("product_id,routine_step_id,routine_steps(slug)")
    .in("product_id", sourceIds);

  if (routineLookup.error) {
    const message = String(routineLookup.error.message ?? "").toLowerCase();
    if (message.includes("relation") && message.includes("product_routine_steps")) return [];
    throw new Error(routineLookup.error.message);
  }

  const targetSlugs = Array.from(
    new Set(
      ((routineLookup.data ?? []) as Array<{ routine_steps?: { slug?: string | null }[] | { slug?: string | null } | null }>)
        .flatMap((row) => {
          const relation = Array.isArray(row.routine_steps) ? row.routine_steps[0] : row.routine_steps;
          const stepSlug = String(relation?.slug ?? "").trim();
          return skincareComplementSteps[stepSlug] ?? [];
        })
        .filter(Boolean)
    )
  );

  if (!targetSlugs.length) return [];

  const candidateLookup = await admin
    .from("product_routine_steps")
    .select("product_id,routine_steps(slug)")
    .limit(200);

  if (candidateLookup.error) throw new Error(candidateLookup.error.message);

  const candidateProductIds = Array.from(
    new Set(
      ((candidateLookup.data ?? []) as Array<{ product_id?: string | null; routine_steps?: { slug?: string | null }[] | { slug?: string | null } | null }>)
        .filter((row) => {
          const relation = Array.isArray(row.routine_steps) ? row.routine_steps[0] : row.routine_steps;
          const stepSlug = String(relation?.slug ?? "").trim();
          return targetSlugs.includes(stepSlug);
        })
        .map((row) => String(row.product_id ?? ""))
        .filter((id) => id.length > 0 && !excludedProductIds.includes(id))
    )
  );

  if (!candidateProductIds.length) return [];

  const productLookup = await admin
    .from("products")
    .select("id,slug,title,name,category,status,stock_quantity,is_featured,curated")
    .in("id", candidateProductIds)
    .in("status", ["active", "published"])
    .gt("stock_quantity", 0)
    .order("curated", { ascending: false })
    .order("is_featured", { ascending: false })
    .limit(4);

  if (productLookup.error) throw new Error(productLookup.error.message);

  return ((productLookup.data ?? []) as ProductRow[]).map((row) => ({
    productId: row.id,
    slug: row.slug ?? row.id,
    title: row.title ?? row.name ?? "Produto BelaPop",
    category: row.category ?? null
  }));
};

const resolveCategoryFallbackComplements = async (
  admin: AnyAdmin,
  items: ProductSnapshot[],
  excludedProductIds: string[]
) => {
  const categories = Array.from(
    new Set(items.map((item) => normalizeCategory(item.category)).filter((value) => value !== "outro"))
  );
  if (!categories.length) return [];

  const fallbackResults: ComplementaryProduct[] = [];
  for (const category of categories) {
    const lookup = await admin
      .from("products")
      .select("id,slug,title,name,category,status,stock_quantity,curated,is_featured")
      .ilike("category", `%${category}%`)
      .in("status", ["active", "published"])
      .gt("stock_quantity", 0)
      .order("curated", { ascending: false })
      .order("is_featured", { ascending: false })
      .limit(8);

    if (lookup.error) throw new Error(lookup.error.message);

    for (const row of (lookup.data ?? []) as ProductRow[]) {
      if (excludedProductIds.includes(row.id)) continue;
      fallbackResults.push({
        productId: row.id,
        slug: row.slug ?? row.id,
        title: row.title ?? row.name ?? "Produto BelaPop",
        category: row.category ?? null
      });
    }
  }

  return fallbackResults;
};

const resolveComplementaryProducts = async (
  admin: AnyAdmin,
  items: ProductSnapshot[]
) => {
  const excludedIds = items.map((item) => item.productId);
  const explicit = await resolveExplicitComplements(
    admin,
    items.map((item) => item.productId),
    excludedIds
  );
  if (explicit.length > 0) return explicit.slice(0, 3);

  if (items.some((item) => normalizeCategory(item.category) === "skincare")) {
    const routine = await resolveRoutineComplements(admin, items, excludedIds);
    if (routine.length > 0) return routine.slice(0, 3);
  }

  const fallback = await resolveCategoryFallbackComplements(admin, items, excludedIds);
  return Array.from(new Map(fallback.map((item) => [item.productId, item])).values()).slice(0, 3);
};

const hasExistingVerifiedReview = async (
  admin: AnyAdmin,
  customerUserId: string,
  productId: string
) => {
  const lookup = await admin
    .from("product_reviews")
    .select("id")
    .eq("user_id", customerUserId)
    .eq("product_id", productId)
    .limit(1)
    .maybeSingle();

  if (lookup.error) {
    const message = String(lookup.error.message ?? "").toLowerCase();
    if (message.includes("relation") && message.includes("product_reviews")) {
      return false;
    }
    throw new Error(lookup.error.message);
  }

  return Boolean(lookup.data?.id);
};

const hasLaterPaidPurchaseForProduct = async (
  admin: AnyAdmin,
  customerUserId: string,
  productId: string,
  sinceOrderId: string,
  sinceCreatedAt: string
) => {
  const lookup = await admin
    .from("order_items")
    .select("id,order:orders!inner(id,customer_id,status,created_at)")
    .eq("product_id", productId)
    .limit(30);

  if (lookup.error) {
    throw new Error(lookup.error.message);
  }

  return ((lookup.data ?? []) as Array<{
    order?: { id?: string | null; customer_id?: string | null; status?: string | null; created_at?: string | null }[] | { id?: string | null; customer_id?: string | null; status?: string | null; created_at?: string | null } | null;
  }>).some((row) => {
    const order = Array.isArray(row.order) ? row.order[0] : row.order;
    if (!order) return false;
    if (order.customer_id !== customerUserId) return false;
    if (String(order.id ?? "") === sinceOrderId) return false;
    if (!["paid", "processing", "shipped", "delivered", "fulfilled"].includes(normalizeStatus(order.status))) {
      return false;
    }

    const createdAt = Date.parse(String(order.created_at ?? ""));
    const baseline = Date.parse(sinceCreatedAt);
    return Number.isFinite(createdAt) && Number.isFinite(baseline) && createdAt > baseline;
  });
};

const buildShippingEstimateLine = (context: OrderContext) => {
  const estimate = formatShippingEstimate(context.estimatedShippingDays);
  if (!estimate && !context.shippingService) {
    return "O prazo estimado fica disponivel no acompanhamento do pedido assim que a expedição for confirmada.";
  }

  if (estimate && context.shippingService) {
    return `Prazo estimado: ${estimate} via ${context.shippingService}.`;
  }

  if (estimate) {
    return `Prazo estimado: ${estimate}.`;
  }

  return `Envio previsto pela modalidade ${context.shippingService}.`;
};

const loadCustomerGreetingName = async (
  admin: AnyAdmin,
  userId: string,
  fallback = "Cliente BelaPop"
) => {
  const lookup = await admin.from("profiles").select("full_name,email").eq("id", userId).maybeSingle();
  if (lookup.error) return fallback;

  const fullName = String(lookup.data?.full_name ?? "").trim();
  if (fullName) return fullName;

  const email = String(lookup.data?.email ?? "").trim().toLowerCase();
  if (email.includes("@")) {
    return email.split("@")[0] || fallback;
  }

  return fallback;
};

const renderTemplate = async (
  admin: AnyAdmin,
  run: LifecycleRunRow,
  context: OrderContext | null
): Promise<LifecycleTemplate | null> => {
  const key = run.automation_key;
  const communicationType = AUTOMATION_CONFIG[key].communicationType;
  const commercial = communicationType === "marketing";
  const channels = defaultChannelsForCommunicationType(communicationType);

  if (key !== "abandoned_interest" && (!context || context.items.length === 0)) {
    return null;
  }

  if (context && ["canceled", "refunded"].includes(context.status) && commercial) {
    return null;
  }

  if (context?.shippingStatus && ["cancelled", "canceled", "returned"].includes(context.shippingStatus) && commercial) {
    return null;
  }

  if (key === "abandoned_interest") {
    const productSlug = String(run.payload?.product_slug ?? "").trim();
    const productTitle = String(run.payload?.product_title ?? "sua selecao BelaPop").trim();
    const source = String(run.payload?.interest_source ?? "view").trim();
    const customerName = await loadCustomerGreetingName(
      admin,
      run.customer_user_id,
      String(run.payload?.customer_name ?? "Cliente BelaPop")
    );
    const ctaHref = source === "cart" ? "/carrinho" : `/produto/${productSlug}`;
    const intro =
      source === "cart"
        ? `Sua seleção ficou aguardando no carrinho. Se quiser concluir agora, ela continua pronta para você.`
        : `O produto que você viu recentemente pode encaixar bem em uma rotina mais clara e consistente.`;
    const bullets = [
      `Produto em destaque: ${productTitle}.`,
      "Finalize com calma e confira prazo, autenticidade e seller antes da compra."
    ];
    const footer = [
      "Se preferir, gerencie suas preferencias de comunicação na sua conta BelaPop."
    ];
    return {
      title: source === "cart" ? "Seu carrinho BelaPop continua pronto" : "Continue sua descoberta BelaPop",
      subject:
        source === "cart"
          ? "Sua seleção BelaPop continua aguardando você"
          : `Ainda pensando em ${productTitle}?`,
      body: [
        `Ola, ${customerName}.`,
        "",
        intro,
        "",
        bullets.join("\n"),
        "",
        `CTA: ${absoluteUrl(ctaHref)}`
      ].join("\n"),
      html: buildEmailHtml({
        eyebrow: "BelaPop",
        heading: source === "cart" ? "Sua seleção segue pronta." : "Continue sua descoberta.",
        intro,
        bullets,
        ctaLabel: source === "cart" ? "Finalizar compra" : "Ver produto",
        ctaHref,
        footer,
        commercial: true
      }),
      ctaLabel: source === "cart" ? "Finalizar compra" : "Ver produto",
      ctaHref,
      channels,
      metadata: {
        communication_type: COMMUNICATION_LABEL[communicationType],
        product_id: run.product_id,
        automation_run_id: run.id
      }
    };
  }

  if (!context) {
    return null;
  }

  const orderContext = context;
  const urls = buildOrderUrls(orderContext.orderId);
  const primaryItem = pickPrimaryItem(orderContext.items);
  if (!primaryItem) return null;
  const orderSummary = renderOrderSummary(orderContext.items);
  const supportFooter = [
    "Se precisar de ajuda, nossa equipe acompanha você pelo suporte BelaPop.",
    commercial ? "Preferencias de comunicação podem ser ajustadas na sua conta." : "Introduza novos produtos aos poucos e siga sempre as instrucoes da marca."
  ];

  if (key === "order_confirmed") {
    const intro = `Seu pedido ${shortOrderId(orderContext.orderId)} foi confirmado com cuidado e ja entrou no fluxo de acompanhamento BelaPop.`;
    const bullets = [
      `Itens: ${orderSummary}.`,
      buildShippingEstimateLine(orderContext),
      orderContext.shipment?.tracking_code
        ? `Rastreio sera atualizado neste mesmo pedido: ${orderContext.shipment.tracking_code}.`
        : "Assim que o envio for postado, você recebe a atualizacao por e-mail e no painel.",
      "Nossa curadoria segue a loja responsável para manter autenticidade, embalagem e prazo alinhados."
    ];
    return {
      title: "Pedido confirmado",
      subject: "Seu pedido BelaPop foi confirmado",
      body: [`Ola, ${orderContext.customerName}.`, "", intro, "", ...bullets, "", `Acompanhar pedido: ${absoluteUrl(urls.order)}`].join("\n"),
      html: buildEmailHtml({
        eyebrow: "Pedido confirmado",
        heading: "Seu pedido foi aprovado.",
        intro,
        bullets,
        ctaLabel: "Acompanhar pedido",
        ctaHref: urls.order,
        footer: supportFooter
      }),
      ctaLabel: "Acompanhar pedido",
      ctaHref: urls.order,
      channels,
      metadata: {
        communication_type: COMMUNICATION_LABEL[communicationType],
        order_id: orderContext.orderId,
        automation_run_id: run.id
      }
    };
  }

  if (key === "order_shipped") {
    const intro = `Seu pedido ${shortOrderId(orderContext.orderId)} foi enviado e agora pode ser acompanhado em tempo real.`;
    const bullets = [
      orderContext.shipment?.carrier ? `Transportadora: ${orderContext.shipment.carrier}.` : "Envio em andamento pela loja responsável.",
      orderContext.shipment?.tracking_code
        ? `Codigo de rastreio: ${orderContext.shipment.tracking_code}.`
        : "O rastreio pode levar alguns minutos para refletir a postagem.",
      "No recebimento, confira embalagem, lacres e itens antes do primeiro uso."
    ];
    return {
      title: "Pedido enviado",
      subject: "Seu pedido BelaPop esta a caminho",
      body: [`Ola, ${orderContext.customerName}.`, "", intro, "", ...bullets, "", `Rastrear pedido: ${absoluteUrl(urls.tracking)}`].join("\n"),
      html: buildEmailHtml({
        eyebrow: "Pedido enviado",
        heading: "Sua compra ja esta a caminho.",
        intro,
        bullets,
        ctaLabel: "Acompanhar pedido",
        ctaHref: urls.tracking,
        footer: supportFooter
      }),
      ctaLabel: "Acompanhar pedido",
      ctaHref: urls.tracking,
      channels,
      metadata: {
        communication_type: COMMUNICATION_LABEL[communicationType],
        order_id: orderContext.orderId,
        automation_run_id: run.id
      }
    };
  }

  if (key === "post_delivery_checkin") {
    const intro = "Esperamos que sua experiencia tenha chegado com cuidado ate voce. Agradecemos sua compra e queremos confirmar se esta tudo certo.";
    const bullets = [
      "Confira embalagem, lacres e condicao dos itens recebidos.",
      "Se algo não estiver como esperado, o suporte BelaPop esta disponivel.",
      "Comece a introducao dos produtos com calma e observe a resposta da sua rotina."
    ];
    return {
      title: "Seu pedido chegou?",
      subject: "Seu pedido BelaPop chegou?",
      body: [`Ola, ${orderContext.customerName}.`, "", intro, "", ...bullets, "", `Preciso de suporte: ${absoluteUrl(urls.support)}`].join("\n"),
      html: buildEmailHtml({
        eyebrow: "Pos-entrega",
        heading: "Chegou tudo bem?",
        intro,
        bullets,
        ctaLabel: "Preciso de suporte",
        ctaHref: urls.support,
        footer: supportFooter
      }),
      ctaLabel: "Preciso de suporte",
      ctaHref: urls.support,
      channels,
      metadata: {
        communication_type: COMMUNICATION_LABEL[communicationType],
        order_id: orderContext.orderId,
        automation_run_id: run.id
      }
    };
  }

  if (key === "usage_guidance") {
    const intro = `Para comecar com ${primaryItem.title}, siga sempre a orientacao da marca e introduza novos produtos aos poucos.`;
    const bullets = [
      ...renderUsageBullets(orderContext.items),
      "Este conteúdo e educativo e não substitui orientacao dermatológica."
    ].slice(0, 5);
    return {
      title: "Como começar seu uso",
      subject: `Como começar com ${primaryItem.title}`,
      body: [`Ola, ${orderContext.customerName}.`, "", intro, "", ...bullets, "", `Ver meu pedido: ${absoluteUrl(urls.order)}`].join("\n"),
      html: buildEmailHtml({
        eyebrow: "Guia de uso",
        heading: "Comece sua rotina com clareza.",
        intro,
        bullets,
        ctaLabel: "Ver meu pedido",
        ctaHref: urls.order,
        footer: supportFooter
      }),
      ctaLabel: "Ver meu pedido",
      ctaHref: urls.order,
      channels,
      metadata: {
        communication_type: COMMUNICATION_LABEL[communicationType],
        order_id: orderContext.orderId,
        automation_run_id: run.id
      }
    };
  }

  if (key === "complementary_recommendation") {
    const complementary = await resolveComplementaryProducts(admin, orderContext.items);
    if (!complementary.length) return null;
    const bullets = complementary.map(
      (item) => `${item.title} pode complementar sua compra com uma etapa de rotina coerente.`
    );
    const ctaHref = `/produto/${complementary[0].slug}`;
    const intro = "Selecionamos alguns complementos proximos da sua compra para ajudar voce a completar a rotina com mais criterio e menos excesso.";
    return {
      title: "Completar rotina",
      subject: "Completar sua rotina com mais clareza",
      body: [`Ola, ${orderContext.customerName}.`, "", intro, "", ...bullets, "", `Completar minha rotina: ${absoluteUrl(ctaHref)}`].join("\n"),
      html: buildEmailHtml({
        eyebrow: "Curadoria complementar",
        heading: "Sugestoes para completar sua rotina.",
        intro,
        bullets,
        ctaLabel: "Completar minha rotina",
        ctaHref,
        footer: supportFooter,
        commercial: true
      }),
      ctaLabel: "Completar minha rotina",
      ctaHref,
      channels,
      metadata: {
        communication_type: COMMUNICATION_LABEL[communicationType],
        order_id: orderContext.orderId,
        complementary_product_ids: complementary.map((item) => item.productId),
        automation_run_id: run.id
      }
    };
  }

  if (key === "review_request") {
    const reviewTarget =
      orderContext.items.find((item) => item.productId === run.product_id) ?? primaryItem;
    if (await hasExistingVerifiedReview(admin, orderContext.customerUserId, reviewTarget.productId)) {
      return null;
    }
    const ctaHref = `/produto/${reviewTarget.slug}#avaliacoes`;
    const intro = `Sua opiniao sobre ${reviewTarget.title} ajuda outras clientes a comprar com mais seguranca e criterio.`;
    const bullets = [
      "Conte como foi sua experiência de uso com transparencia.",
      "Não oferecemos incentivo para alterar ou enviesar a avaliação.",
      "Avaliacoes reais fortalecem a curadoria da plataforma."
    ];
    return {
      title: "Convite para avaliação",
      subject: `Como foi sua experiência com ${reviewTarget.title}?`,
      body: [`Ola, ${orderContext.customerName}.`, "", intro, "", ...bullets, "", `Avaliar produto: ${absoluteUrl(ctaHref)}`].join("\n"),
      html: buildEmailHtml({
        eyebrow: "Avaliação real",
        heading: "Sua experiência importa.",
        intro,
        bullets,
        ctaLabel: "Avaliar produto",
        ctaHref,
        footer: supportFooter,
        commercial: true
      }),
      ctaLabel: "Avaliar produto",
      ctaHref,
      channels,
      metadata: {
        communication_type: COMMUNICATION_LABEL[communicationType],
        order_id: orderContext.orderId,
        product_id: reviewTarget.productId,
        automation_run_id: run.id
      }
    };
  }

  if (key === "reorder_reminder") {
    const reorderTarget =
      orderContext.items.find((item) => item.productId === run.product_id) ?? primaryItem;
    if (
      await hasLaterPaidPurchaseForProduct(
        admin,
        orderContext.customerUserId,
        reorderTarget.productId,
        orderContext.orderId,
        orderContext.createdAt
      )
    ) {
      return null;
    }
    const category = normalizeCategory(reorderTarget.category);
    const intro = `Talvez esteja chegando a hora de repor ${reorderTarget.title}, especialmente se ele faz parte da sua rotina de ${category}.`;
    const bullets = [
      `Categoria: ${category}.`,
      "Recompra assistida fica disponivel no seu histórico de pedidos.",
      "Antes de recomprar, confirme necessidade, frequencia de uso e estoque em casa."
    ];
    const ctaHref = `/produto/${reorderTarget.slug}`;
    return {
      title: "Lembrete de reposicao",
      subject: `Hora de repor ${reorderTarget.title}?`,
      body: [`Ola, ${orderContext.customerName}.`, "", intro, "", ...bullets, "", `Recomprar: ${absoluteUrl(ctaHref)}`].join("\n"),
      html: buildEmailHtml({
        eyebrow: "Reposicao",
        heading: "Talvez seja hora de repor.",
        intro,
        bullets,
        ctaLabel: "Recomprar",
        ctaHref,
        footer: supportFooter,
        commercial: true
      }),
      ctaLabel: "Recomprar",
      ctaHref,
      channels,
      metadata: {
        communication_type: COMMUNICATION_LABEL[communicationType],
        order_id: orderContext.orderId,
        product_id: reorderTarget.productId,
        automation_run_id: run.id
      }
    };
  }

  return null;
};

const seedOrderLifecycleRuns = async (admin: AnyAdmin, contexts: OrderContext[]) => {
  let seeded = 0;
  let canceled = 0;

  for (const context of contexts) {
    if (["canceled", "refunded"].includes(context.status) || ["cancelled", "canceled", "returned"].includes(context.shippingStatus ?? "")) {
      canceled += await cancelPendingRunsForOrder(
        admin,
        context.orderId,
        context.status === "refunded" ? "order_refunded" : "order_canceled"
      );
      continue;
    }

    const primaryItem = pickPrimaryItem(context.items);
    if (!primaryItem) continue;

    const commonPayload = {
      customer_name: context.customerName,
      order_summary: renderOrderSummary(context.items),
      primary_product_id: primaryItem.productId,
      primary_product_slug: primaryItem.slug,
      primary_product_title: primaryItem.title
    };

    if (context.paidAt) {
      const created = await insertLifecycleRun(admin, {
        runKey: buildRunKey(["lifecycle", context.orderId, "order_confirmed"]),
        automationKey: "order_confirmed",
        customerUserId: context.customerUserId,
        orderId: context.orderId,
        scheduledAt: context.paidAt,
        payload: commonPayload
      });
      if (created) seeded += 1;
    }

    if (context.shippedAt && !context.deliveredAt) {
      const created = await insertLifecycleRun(admin, {
        runKey: buildRunKey(["lifecycle", context.orderId, "order_shipped"]),
        automationKey: "order_shipped",
        customerUserId: context.customerUserId,
        orderId: context.orderId,
        scheduledAt: context.shippedAt,
        payload: {
          ...commonPayload,
          tracking_code: context.shipment?.tracking_code ?? null,
          carrier: context.shipment?.carrier ?? null
        }
      });
      if (created) seeded += 1;
    }

    if (context.deliveredAt) {
      const deliveredCheck = await insertLifecycleRun(admin, {
        runKey: buildRunKey(["lifecycle", context.orderId, "post_delivery_checkin"]),
        automationKey: "post_delivery_checkin",
        customerUserId: context.customerUserId,
        orderId: context.orderId,
        scheduledAt: addDays(context.deliveredAt, 1),
        payload: commonPayload
      });
      if (deliveredCheck) seeded += 1;

      const usageGuidance = await insertLifecycleRun(admin, {
        runKey: buildRunKey(["lifecycle", context.orderId, "usage_guidance"]),
        automationKey: "usage_guidance",
        customerUserId: context.customerUserId,
        orderId: context.orderId,
        scheduledAt: addDays(context.deliveredAt, 2),
        payload: commonPayload
      });
      if (usageGuidance) seeded += 1;

      const complementary = await insertLifecycleRun(admin, {
        runKey: buildRunKey(["lifecycle", context.orderId, "complementary_recommendation"]),
        automationKey: "complementary_recommendation",
        customerUserId: context.customerUserId,
        orderId: context.orderId,
        scheduledAt: addDays(context.deliveredAt, 6),
        payload: commonPayload
      });
      if (complementary) seeded += 1;

      for (const item of context.items) {
        if (!item.orderItemId) continue;
        const reviewCreated = await insertLifecycleRun(admin, {
          runKey: buildRunKey(["lifecycle", context.orderId, item.orderItemId, "review_request"]),
          automationKey: "review_request",
          customerUserId: context.customerUserId,
          orderId: context.orderId,
          orderItemId: item.orderItemId,
          productId: item.productId,
          scheduledAt: addDays(context.deliveredAt, 12),
          payload: {
            ...commonPayload,
            product_id: item.productId,
            product_slug: item.slug,
            product_title: item.title
          }
        });
        if (reviewCreated) seeded += 1;

        const reorderCreated = await insertLifecycleRun(admin, {
          runKey: buildRunKey(["lifecycle", context.orderId, item.orderItemId, "reorder_reminder"]),
          automationKey: "reorder_reminder",
          customerUserId: context.customerUserId,
          orderId: context.orderId,
          orderItemId: item.orderItemId,
          productId: item.productId,
          scheduledAt: addDays(
            context.deliveredAt,
            reorderDaysByCategory[normalizeCategory(item.category)] ?? reorderDaysByCategory.outro
          ),
          payload: {
            ...commonPayload,
            product_id: item.productId,
            product_slug: item.slug,
            product_title: item.title,
            product_category: normalizeCategory(item.category)
          }
        });
        if (reorderCreated) seeded += 1;
      }
    }
  }

  return { seeded, canceled };
};

const seedAbandonedCartRuns = async (admin: AnyAdmin, limit: number) => {
  const { data, error } = await admin
    .from("carts")
    .select("id,user_id,status,items,updated_at,created_at")
    .eq("status", "abandoned")
    .not("user_id", "is", null)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  const carts = (data ?? []) as CartRow[];
  let seeded = 0;

  for (const cart of carts) {
    const items = Array.isArray(cart.items) ? cart.items : [];
    const firstItem = items.find((item) => typeof item === "object" && item !== null) as
      | { productId?: string; quantity?: number }
      | undefined;
    const productId = String(firstItem?.productId ?? "").trim();
    if (!cart.user_id || !productId) continue;

    const productLookup = await admin
      .from("products")
      .select("id,slug,title,name,status,stock_quantity")
      .eq("id", productId)
      .maybeSingle();
    if (productLookup.error || !productLookup.data) continue;

    const orderLookup = await admin
      .from("order_items")
      .select("id,order:orders!inner(id,customer_id,status,created_at)")
      .eq("product_id", productId)
      .limit(25);
    if (orderLookup.error) continue;

    const purchased = ((orderLookup.data ?? []) as Array<{ order?: { customer_id?: string | null; status?: string | null }[] | { customer_id?: string | null; status?: string | null } | null }>).some(
      (row) => {
        const order = Array.isArray(row.order) ? row.order[0] : row.order;
        return order?.customer_id === cart.user_id && ["paid", "processing", "shipped", "delivered"].includes(normalizeStatus(order?.status));
      }
    );
    if (purchased) continue;

    const created = await insertLifecycleRun(admin, {
      runKey: buildRunKey(["lifecycle", "cart", cart.id, productId, "abandoned_interest"]),
      automationKey: "abandoned_interest",
      customerUserId: cart.user_id,
      cartId: cart.id,
      productId,
      scheduledAt: addDays(toIso(cart.updated_at ?? cart.created_at ?? new Date().toISOString())!, 0.25),
      payload: {
        interest_source: "cart",
        product_id: productId,
        product_slug: productLookup.data.slug ?? productId,
        product_title: productLookup.data.title ?? productLookup.data.name ?? "Produto BelaPop"
      }
    });
    if (created) seeded += 1;
  }

  return { seeded, scanned: carts.length };
};

const seedViewedProductRuns = async (admin: AnyAdmin, limit: number) => {
  const cutoffIso = new Date(Date.now() - 3 * DAY_MS).toISOString();
  const { data, error } = await admin
    .from("analytics_events")
    .select("id,user_id,product_id,type,created_at")
    .eq("type", "view_product")
    .not("user_id", "is", null)
    .not("product_id", "is", null)
    .gte("created_at", cutoffIso)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  const events = (data ?? []) as AnalyticsEventRow[];
  let seeded = 0;

  for (const event of events) {
    if (!event.user_id || !event.product_id) continue;

    const cartLookup = await admin
      .from("carts")
      .select("id,status,items")
      .eq("user_id", event.user_id)
      .in("status", ["active", "abandoned"])
      .order("updated_at", { ascending: false })
      .limit(10);
    if (cartLookup.error) continue;

    const hasCartInterest = ((cartLookup.data ?? []) as CartRow[]).some((cart) =>
      Array.isArray(cart.items)
        ? cart.items.some((item) => typeof item === "object" && item !== null && String((item as { productId?: string }).productId ?? "") === event.product_id)
        : false
    );
    if (hasCartInterest) continue;

    const orderLookup = await admin
      .from("order_items")
      .select("id,order:orders!inner(customer_id,status)")
      .eq("product_id", event.product_id)
      .limit(25);
    if (orderLookup.error) continue;

    const purchased = ((orderLookup.data ?? []) as Array<{ order?: { customer_id?: string | null; status?: string | null }[] | { customer_id?: string | null; status?: string | null } | null }>).some(
      (row) => {
        const order = Array.isArray(row.order) ? row.order[0] : row.order;
        return order?.customer_id === event.user_id && ["paid", "processing", "shipped", "delivered"].includes(normalizeStatus(order?.status));
      }
    );
    if (purchased) continue;

    const productLookup = await admin
      .from("products")
      .select("id,slug,title,name,status,stock_quantity")
      .eq("id", event.product_id)
      .maybeSingle();
    if (productLookup.error || !productLookup.data) continue;

    const created = await insertLifecycleRun(admin, {
      runKey: buildRunKey(["lifecycle", "view", event.user_id, event.product_id]),
      automationKey: "abandoned_interest",
      customerUserId: event.user_id,
      productId: event.product_id,
      scheduledAt: addDays(event.created_at, 0.75),
      payload: {
        interest_source: "view",
        product_id: event.product_id,
        product_slug: productLookup.data.slug ?? event.product_id,
        product_title: productLookup.data.title ?? productLookup.data.name ?? "Produto BelaPop"
      }
    });
    if (created) seeded += 1;
  }

  return { seeded, scanned: events.length };
};

const queueDueLifecycleRuns = async (admin: AnyAdmin, limit: number, contexts: OrderContext[]) => {
  const nowIso = new Date().toISOString();
  const { data, error } = await admin
    .from("customer_lifecycle_automation_runs")
    .select("id,run_key,automation_key,communication_type,customer_user_id,order_id,order_item_id,cart_id,product_id,status,channels,scheduled_at,payload")
    .eq("status", "scheduled")
    .lte("scheduled_at", nowIso)
    .order("scheduled_at", { ascending: true })
    .limit(limit);

  if (error) throw new Error(error.message);
  const runs = (data ?? []) as LifecycleRunRow[];
  if (!runs.length) return { queued: 0, skipped: 0, failed: 0 };

  const orderContextMap = new Map(contexts.map((context) => [context.orderId, context]));
  let queued = 0;
  let skipped = 0;
  let failed = 0;

  for (const run of runs) {
    try {
      const context = run.order_id ? orderContextMap.get(run.order_id) ?? null : null;
      const template = await renderTemplate(admin, run, context);
      if (!template) {
        await admin
          .from("customer_lifecycle_automation_runs")
          .update({
            status: "skipped",
            canceled_reason: "template_or_context_unavailable",
            finalized_at: new Date().toISOString()
          })
          .eq("id", run.id);
        skipped += 1;
        continue;
      }

      const eventId = await emitPlatformEvent({
        eventName: automationTemplateKey(run.automation_key),
        aggregateType: run.order_id ? "order" : "profile",
        aggregateId: run.order_id ?? run.customer_user_id,
        orderId: run.order_id ?? null,
        customerUserId: run.customer_user_id,
        occurredAt: run.scheduled_at,
        payload: {
          automation_key: run.automation_key,
          automation_run_id: run.id,
          communication_type: run.communication_type,
          product_id: run.product_id,
          cart_id: run.cart_id
        },
        idempotencyKey: buildRunKey(["platform-event", run.run_key])
      });

      await queueNotificationChannels({
        eventId,
        recipientUserId: run.customer_user_id,
        channels: template.channels,
        templateKey: automationTemplateKey(run.automation_key),
        title: template.title,
        subject: template.subject,
        body: template.body,
        html: template.html,
        ctaLabel: template.ctaLabel,
        ctaHref: template.ctaHref,
        metadata: {
          ...template.metadata,
          automation_key: run.automation_key,
          automation_run_id: run.id
        },
        dedupeSeed: run.run_key,
        automationRunId: run.id,
        communicationType: run.communication_type
      });

      await admin
        .from("customer_lifecycle_automation_runs")
        .update({
          status: "queued",
          queued_at: new Date().toISOString(),
          channels: template.channels
        })
        .eq("id", run.id);

      queued += 1;
    } catch (runError) {
      await admin
        .from("customer_lifecycle_automation_runs")
        .update({
          status: "failed",
          canceled_reason: runError instanceof Error ? runError.message : "unknown_error",
          finalized_at: new Date().toISOString()
        })
        .eq("id", run.id);
      failed += 1;
    }
  }

  return { queued, skipped, failed };
};

export async function processCustomerLifecycleAutomations({
  admin,
  seedLimit = 120,
  cartLimit = 60,
  viewLimit = 60,
  dispatchLimit = 150
}: ProcessLifecycleArgs): Promise<ProcessLifecycleResult> {
  const contexts = await loadRecentOrderContexts(admin, seedLimit);
  const orderStats = await seedOrderLifecycleRuns(admin, contexts);
  const cartStats = await seedAbandonedCartRuns(admin, cartLimit);
  const viewStats = await seedViewedProductRuns(admin, viewLimit);
  const queueStats = await queueDueLifecycleRuns(admin, dispatchLimit, contexts);

  return {
    orders_scanned: contexts.length,
    runs_seeded: orderStats.seeded + cartStats.seeded + viewStats.seeded,
    runs_canceled: orderStats.canceled,
    carts_scanned: cartStats.scanned,
    views_scanned: viewStats.scanned,
    queued: queueStats.queued,
    skipped: queueStats.skipped,
    failed: queueStats.failed
  };
}
