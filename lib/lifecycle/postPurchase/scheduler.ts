import {
  mockLifecycleCustomers,
  mockLifecycleOrders,
  mockPostPurchaseMessages,
  mockRecommendationCatalog,
  mockRebuyReminders,
  mockReviewRequests
} from "@/lib/lifecycle/postPurchase/mocks";
import { createRebuyReminders } from "@/lib/lifecycle/postPurchase/rebuy";
import { getComplementaryRecommendations } from "@/lib/lifecycle/postPurchase/recommendations";
import {
  complementaryRecommendationEmail,
  complementaryRecommendationWhatsApp,
  deliveryFollowUpEmail,
  deliveryFollowUpWhatsApp,
  postPurchaseUsageEmail,
  postPurchaseUsageWhatsApp,
  rebuyReminderEmail,
  rebuyReminderWhatsApp,
  reviewRequestEmail,
  reviewRequestWhatsApp,
  type LifecycleTemplateRenderer
} from "@/lib/lifecycle/postPurchase/templates";
import type {
  Customer,
  LifecycleChannel,
  LifecycleCommunicationType,
  LifecycleProcessorResult,
  LifecycleTemplateId,
  Order,
  PostPurchaseMessage,
  RebuyReminder,
  RecommendationProduct,
  ReviewRequest
} from "@/lib/lifecycle/postPurchase/types";

type ProcessorState = {
  customers: Customer[];
  orders: Order[];
  messages: PostPurchaseMessage[];
  products: RecommendationProduct[];
  rebuyReminders: RebuyReminder[];
  reviewRequests: ReviewRequest[];
  now?: string;
};

const DAY_MS = 86_400_000;

const templateRenderers: Record<LifecycleTemplateId, LifecycleTemplateRenderer> = {
  complementaryRecommendationEmail,
  complementaryRecommendationWhatsApp,
  deliveryFollowUpEmail,
  deliveryFollowUpWhatsApp,
  postPurchaseUsageEmail,
  postPurchaseUsageWhatsApp,
  rebuyReminderEmail,
  rebuyReminderWhatsApp,
  reviewRequestEmail,
  reviewRequestWhatsApp
};

export const buildLifecycleMessageId = ({
  customerId,
  orderId,
  orderItemId,
  templateId
}: {
  customerId: string;
  orderId?: string;
  orderItemId?: string;
  templateId: LifecycleTemplateId;
}) => ["lifecycle", customerId, orderId, orderItemId, templateId].filter(Boolean).join(":");

export const hasMessageBeenSent = (
  messages: PostPurchaseMessage[],
  input: {
    customerId: string;
    orderId?: string;
    templateId: LifecycleTemplateId;
  }
) =>
  messages.some(
    (message) =>
      message.customerId === input.customerId &&
      message.orderId === input.orderId &&
      message.templateId === input.templateId &&
      Boolean(message.sentAt)
  );

export const shouldSendLifecycleMessage = (
  customer: Customer,
  channel: LifecycleChannel,
  communicationType: LifecycleCommunicationType
) => {
  if (customer.optOutChannels?.includes(channel)) return false;
  if (communicationType === "marketing" && !customer.marketingConsent) return false;
  if (channel === "whatsapp" && !customer.whatsappOptIn) return false;
  if (channel === "sms" && !customer.smsOptIn) return false;
  if (channel === "push" && !customer.pushOptIn) return false;
  return true;
};

const daysSince = (iso: string, nowIso: string) =>
  Math.floor((Date.parse(nowIso) - Date.parse(iso)) / DAY_MS);

const createMessage = ({
  customer,
  order,
  templateId,
  scheduledAt,
  messages,
  itemId,
  recommendations,
  rebuyReminder,
  reviewRequest
}: {
  customer: Customer;
  order: Order;
  templateId: LifecycleTemplateId;
  scheduledAt: string;
  messages: PostPurchaseMessage[];
  itemId?: string;
  recommendations?: RecommendationProduct[];
  rebuyReminder?: RebuyReminder;
  reviewRequest?: ReviewRequest;
}): PostPurchaseMessage | null => {
  const item = itemId ? order.items.find((candidate) => candidate.id === itemId) : order.items[0];
  const renderer = templateRenderers[templateId];
  const template = renderer({
    customer,
    order,
    item,
    recommendations,
    rebuyReminder,
    reviewRequest
  });
  const messageId = buildLifecycleMessageId({
    customerId: customer.id,
    orderId: order.id,
    orderItemId: item?.id,
    templateId
  });

  if (!shouldSendLifecycleMessage(customer, template.channel, template.type)) return null;
  if (messages.some((message) => message.messageId === messageId)) return null;

  return {
    id: messageId,
    messageId,
    customerId: customer.id,
    orderId: order.id,
    orderItemId: item?.id,
    templateId,
    channel: template.channel,
    type: template.type,
    messageType: template.messageType,
    scheduledAt,
    status: "scheduled",
    subject: template.subject,
    body: template.body,
    ctaLabel: template.ctaLabel,
    ctaHref: template.ctaHref,
    dedupeKey: `${customer.id}:${order.id}:${templateId}`,
    metadata: {
      template_id: templateId,
      order_id: order.id,
      product_id: item?.productId ?? null
    }
  };
};

export function processOrderConfirmedOrders(state: ProcessorState): PostPurchaseMessage[] {
  const nowIso = state.now ?? new Date().toISOString();
  const created: PostPurchaseMessage[] = [];

  for (const order of state.orders.filter((candidate) => candidate.confirmedAt)) {
    const customer = state.customers.find((candidate) => candidate.id === order.customerId);
    if (!customer) continue;
    const delta = daysSince(order.confirmedAt, nowIso);
    if (delta < 0) continue;

    for (const templateId of ["postPurchaseUsageEmail", "postPurchaseUsageWhatsApp"] as const) {
      const message = createMessage({
        customer,
        order,
        templateId,
        scheduledAt: order.confirmedAt,
        messages: [...state.messages, ...created]
      });
      if (message) created.push(message);
    }
  }

  return created;
}

export function processShippedOrders(state: ProcessorState): PostPurchaseMessage[] {
  const nowIso = state.now ?? new Date().toISOString();
  const created: PostPurchaseMessage[] = [];

  for (const order of state.orders.filter((candidate) => candidate.shippedAt)) {
    const customer = state.customers.find((candidate) => candidate.id === order.customerId);
    if (!customer || !order.shippedAt) continue;
    const delta = daysSince(order.shippedAt, nowIso);
    if (delta < 0) continue;

    for (const templateId of ["postPurchaseUsageEmail", "postPurchaseUsageWhatsApp"] as const) {
      const message = createMessage({
        customer,
        order,
        templateId,
        scheduledAt: order.shippedAt,
        messages: [...state.messages, ...created]
      });
      if (message) created.push(message);
    }
  }

  return created;
}

export function processDeliveredOrders(state: ProcessorState): PostPurchaseMessage[] {
  const nowIso = state.now ?? new Date().toISOString();
  const created: PostPurchaseMessage[] = [];

  for (const order of state.orders.filter((candidate) => candidate.status === "delivered" && candidate.deliveredAt)) {
    const customer = state.customers.find((candidate) => candidate.id === order.customerId);
    if (!customer || !order.deliveredAt) continue;
    const delta = daysSince(order.deliveredAt, nowIso);

    if (delta >= 0) {
      for (const templateId of ["postPurchaseUsageEmail", "postPurchaseUsageWhatsApp"] as const) {
        const message = createMessage({
          customer,
          order,
          templateId,
          scheduledAt: order.deliveredAt,
          messages: [...state.messages, ...created]
        });
        if (message) created.push(message);
      }
    }

    if (delta >= 2) {
      for (const templateId of ["deliveryFollowUpEmail", "deliveryFollowUpWhatsApp"] as const) {
        const message = createMessage({
          customer,
          order,
          templateId,
          scheduledAt: new Date(Date.parse(order.deliveredAt) + 2 * DAY_MS).toISOString(),
          messages: [...state.messages, ...created]
        });
        if (message) created.push(message);
      }
    }
  }

  return created;
}

export function processComplementaryRecommendations(state: ProcessorState): PostPurchaseMessage[] {
  const nowIso = state.now ?? new Date().toISOString();
  const created: PostPurchaseMessage[] = [];

  for (const order of state.orders.filter((candidate) => candidate.status === "delivered" && candidate.deliveredAt)) {
    const customer = state.customers.find((candidate) => candidate.id === order.customerId);
    if (!customer || !order.deliveredAt) continue;
    const delta = daysSince(order.deliveredAt, nowIso);
    if (delta < 7 || delta > 14) continue;

    const recommendations = getComplementaryRecommendations(order, customer.skinProfile, state.products);
    if (!recommendations.length) continue;

    for (const templateId of ["complementaryRecommendationEmail", "complementaryRecommendationWhatsApp"] as const) {
      const message = createMessage({
        customer,
        order,
        templateId,
        scheduledAt: new Date(Date.parse(order.deliveredAt) + 7 * DAY_MS).toISOString(),
        messages: [...state.messages, ...created],
        recommendations
      });
      if (message) created.push(message);
    }
  }

  return created;
}

export function processReviewRequests(state: ProcessorState): PostPurchaseMessage[] {
  const nowIso = state.now ?? new Date().toISOString();
  const created: PostPurchaseMessage[] = [];

  for (const request of state.reviewRequests.filter((candidate) => candidate.status === "pending")) {
    const order = state.orders.find((candidate) => candidate.id === request.orderId);
    const customer = state.customers.find((candidate) => candidate.id === request.customerId);
    if (!order || !customer || !order.deliveredAt) continue;
    const delta = daysSince(order.deliveredAt, nowIso);
    if (delta < 10 || delta > 21) continue;

    for (const templateId of ["reviewRequestEmail", "reviewRequestWhatsApp"] as const) {
      const message = createMessage({
        customer,
        order,
        templateId,
        scheduledAt: new Date(Date.parse(order.deliveredAt) + 10 * DAY_MS).toISOString(),
        messages: [...state.messages, ...created],
        itemId: request.orderItemId,
        reviewRequest: request
      });
      if (message) created.push(message);
    }
  }

  return created;
}

export function processRebuyReminders(state: ProcessorState): PostPurchaseMessage[] {
  const nowIso = state.now ?? new Date().toISOString();
  const created: PostPurchaseMessage[] = [];
  const reminders = state.rebuyReminders.length
    ? state.rebuyReminders
    : state.orders.flatMap(createRebuyReminders);

  for (const reminder of reminders.filter((candidate) => candidate.status === "scheduled")) {
    if (Date.parse(reminder.remindAt) > Date.parse(nowIso)) continue;
    const order = state.orders.find((candidate) => candidate.id === reminder.orderId);
    const customer = state.customers.find((candidate) => candidate.id === reminder.customerId);
    if (!order || !customer) continue;

    for (const templateId of ["rebuyReminderEmail", "rebuyReminderWhatsApp"] as const) {
      const message = createMessage({
        customer,
        order,
        templateId,
        scheduledAt: reminder.remindAt,
        messages: [...state.messages, ...created],
        itemId: reminder.orderItemId,
        rebuyReminder: reminder
      });
      if (message) created.push(message);
    }
  }

  return created;
}

export function processCustomersWithoutRebuy(state: ProcessorState): PostPurchaseMessage[] {
  const nowIso = state.now ?? new Date().toISOString();
  const created: PostPurchaseMessage[] = [];

  for (const customer of state.customers.filter((candidate) => candidate.lastPurchaseAt)) {
    if (!customer.lastPurchaseAt) continue;
    const delta = daysSince(customer.lastPurchaseAt, nowIso);
    if (delta < 60) continue;

    const latestOrder = state.orders
      .filter((order) => order.customerId === customer.id)
      .sort((left, right) => Date.parse(right.confirmedAt) - Date.parse(left.confirmedAt))[0];
    if (!latestOrder || latestOrder.items.length === 0) continue;

    const reminder =
      state.rebuyReminders.find((candidate) => candidate.customerId === customer.id && candidate.orderId === latestOrder.id) ??
      createRebuyReminders(latestOrder)[0];
    if (!reminder) continue;

    for (const templateId of ["rebuyReminderEmail", "rebuyReminderWhatsApp"] as const) {
      const message = createMessage({
        customer,
        order: latestOrder,
        templateId,
        scheduledAt: nowIso,
        messages: [...state.messages, ...created],
        itemId: reminder?.orderItemId,
        rebuyReminder: reminder
      });
      if (message) created.push(message);
    }
  }

  return created;
}

export function dailyLifecycleProcessor(state: Partial<ProcessorState> = {}): LifecycleProcessorResult & {
  messages: PostPurchaseMessage[];
} {
  const fullState: ProcessorState = {
    customers: state.customers ?? mockLifecycleCustomers,
    orders: state.orders ?? mockLifecycleOrders,
    messages: state.messages ?? mockPostPurchaseMessages,
    products: state.products ?? mockRecommendationCatalog,
    rebuyReminders: state.rebuyReminders ?? mockRebuyReminders,
    reviewRequests: state.reviewRequests ?? mockReviewRequests,
    now: state.now ?? "2026-05-08T12:00:00.000Z"
  };

  const confirmed = processOrderConfirmedOrders(fullState);
  const shipped = processShippedOrders({
    ...fullState,
    messages: [...fullState.messages, ...confirmed]
  });
  const delivered = processDeliveredOrders({
    ...fullState,
    messages: [...fullState.messages, ...confirmed, ...shipped]
  });
  const complementary = processComplementaryRecommendations({
    ...fullState,
    messages: [...fullState.messages, ...confirmed, ...shipped, ...delivered]
  });
  const reviews = processReviewRequests({
    ...fullState,
    messages: [...fullState.messages, ...confirmed, ...shipped, ...delivered, ...complementary]
  });
  const rebuy = processRebuyReminders({
    ...fullState,
    messages: [...fullState.messages, ...confirmed, ...shipped, ...delivered, ...complementary, ...reviews]
  });
  const noRebuy = processCustomersWithoutRebuy({
    ...fullState,
    messages: [...fullState.messages, ...confirmed, ...shipped, ...delivered, ...complementary, ...reviews, ...rebuy]
  });
  const messages = [...confirmed, ...shipped, ...delivered, ...complementary, ...reviews, ...rebuy, ...noRebuy];

  return {
    eventsProcessed: fullState.orders.length + fullState.customers.length,
    messagesCreated: messages.length,
    messagesSkipped: Math.max(0, fullState.orders.length * 5 + fullState.customers.length - messages.length),
    recommendationsGenerated: fullState.orders.reduce(
      (total, order) =>
        total +
        getComplementaryRecommendations(
          order,
          fullState.customers.find((customer) => customer.id === order.customerId)?.skinProfile,
          fullState.products
        ).length,
      0
    ),
    rebuyRemindersCreated: fullState.rebuyReminders.length,
    reviewRequestsCreated: fullState.reviewRequests.length,
    messages
  };
}
