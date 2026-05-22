export type LifecycleChannel = "email" | "whatsapp" | "sms" | "push" | "in_app";

export type LifecycleCommunicationType = "transactional" | "marketing";

export type LifecycleEventType =
  | "order_confirmed"
  | "order_shipped"
  | "order_delivered"
  | "delivery_plus_2"
  | "delivery_plus_7"
  | "delivery_plus_21"
  | "rebuy_30"
  | "rebuy_45"
  | "rebuy_60"
  | "product_running_low"
  | "customer_without_rebuy"
  | "skin_scan_available"
  | "bundle_purchased"
  | "sku_purchased";

export type LifecycleTemplateId =
  | "postPurchaseUsageEmail"
  | "deliveryFollowUpEmail"
  | "complementaryRecommendationEmail"
  | "rebuyReminderEmail"
  | "reviewRequestEmail"
  | "postPurchaseUsageWhatsApp"
  | "deliveryFollowUpWhatsApp"
  | "complementaryRecommendationWhatsApp"
  | "rebuyReminderWhatsApp"
  | "reviewRequestWhatsApp";

export type PostPurchaseMessageType =
  | "usage_guide"
  | "delivery_follow_up"
  | "complementary_recommendation"
  | "rebuy_reminder"
  | "review_request";

export type LifecycleAutomationStatus = "active" | "paused" | "draft";

export type ProductLifecycleCategory =
  | "limpeza"
  | "serum"
  | "serum-vitamina-c"
  | "hidratante"
  | "protetor-solar"
  | "tonico-esfoliante"
  | "mascara"
  | "bundle"
  | "outro";

export interface CustomerSkinProfile {
  skinType: "normal" | "seca" | "oleosa" | "mista" | "sensível";
  concerns: string[];
  contraindications?: string[];
  lastSkinScanAt?: string;
  skinScanSummary?: string;
  routinePreference?: "essencial" | "premium" | "luxo";
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  marketingConsent: boolean;
  whatsappOptIn: boolean;
  smsOptIn?: boolean;
  pushOptIn?: boolean;
  optOutChannels?: LifecycleChannel[];
  skinProfile?: CustomerSkinProfile;
  purchaseCount: number;
  lastPurchaseAt?: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  category: ProductLifecycleCategory;
  concern?: string;
  skinTypes?: string[];
  routineStep: string;
  usageFrequency: string;
  howToUse: string[];
  precautions: string[];
  combinesWith: string[];
  avoidWith?: string[];
  sellerName: string;
  quantity: number;
  unitPriceCents: number;
  averageDurationDays?: number;
  isBundleItem?: boolean;
}

export interface Order {
  id: string;
  customerId: string;
  status: "confirmed" | "shipped" | "delivered" | "canceled";
  confirmedAt: string;
  shippedAt?: string;
  deliveredAt?: string;
  sellerNames: string[];
  items: OrderItem[];
  bundleId?: string;
  bundleName?: string;
  skinScanId?: string;
}

export interface ProductUsageGuide {
  productId: string;
  productName: string;
  routineStep: string;
  howToUse: string[];
  frequency: string;
  precautions: string[];
  combinesWith: string[];
  avoidWith: string[];
  ctaLabel: string;
  ctaHref: string;
}

export interface LifecycleTemplate {
  id: LifecycleTemplateId;
  name: string;
  channel: LifecycleChannel;
  type: LifecycleCommunicationType;
  messageType: PostPurchaseMessageType;
  subject?: string;
  previewText?: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  status: LifecycleAutomationStatus;
}

export interface PostPurchaseMessage {
  id: string;
  messageId: string;
  customerId: string;
  orderId?: string;
  orderItemId?: string;
  templateId: LifecycleTemplateId;
  channel: LifecycleChannel;
  type: LifecycleCommunicationType;
  messageType: PostPurchaseMessageType;
  scheduledAt: string;
  sentAt?: string;
  status: "scheduled" | "sent" | "skipped" | "blocked";
  subject?: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  dedupeKey: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface LifecycleEvent {
  id: string;
  type: LifecycleEventType;
  customerId: string;
  orderId?: string;
  productId?: string;
  occurredAt: string;
  payload?: Record<string, string | number | boolean | null>;
}

export interface RecommendationProduct {
  id: string;
  name: string;
  category: ProductLifecycleCategory;
  concern?: string;
  skinTypes?: string[];
  tags: string[];
  priceCents: number;
  href: string;
  image?: string;
  reason?: string;
}

export interface RecommendationRule {
  id: string;
  label: string;
  sourceCategory?: ProductLifecycleCategory;
  sourceConcern?: string;
  requiredSkinType?: CustomerSkinProfile["skinType"];
  avoidForSensitiveSkin?: boolean;
  targetCategories: ProductLifecycleCategory[];
  targetConcerns?: string[];
  priority: number;
  reason: string;
}

export interface ReviewRequest {
  id: string;
  customerId: string;
  orderId: string;
  orderItemId: string;
  productId: string;
  productName: string;
  requestedAt: string;
  status: "pending" | "completed" | "skipped";
  rating?: number;
  feedback?: string;
  photoUrl?: string;
}

export interface RebuyReminder {
  id: string;
  customerId: string;
  orderId: string;
  orderItemId: string;
  productId: string;
  productName: string;
  category: ProductLifecycleCategory;
  recommendedAfterDays: number;
  remindAt: string;
  status: "scheduled" | "sent" | "dismissed";
  ctaHref: string;
}

export interface LifecycleRule {
  id: string;
  title: string;
  eventType: LifecycleEventType;
  messageType: PostPurchaseMessageType;
  delayDays: number;
  channels: LifecycleChannel[];
  communicationType: LifecycleCommunicationType;
  status: LifecycleAutomationStatus;
  description: string;
}

export interface LifecycleProcessorResult {
  eventsProcessed: number;
  messagesCreated: number;
  messagesSkipped: number;
  recommendationsGenerated: number;
  rebuyRemindersCreated: number;
  reviewRequestsCreated: number;
}
