import { z } from "zod";

const isoDateTimeSchema = z.iso.datetime({ offset: true });
const isoDateSchema = z.iso.date();

const uuidSchema = z.uuid();
const moneySchema = z.number().finite();

export const OrderStatusDtoSchema = z.enum([
  "CREATED",
  "PAYMENT_PENDING",
  "PAID",
  "CANCELLED",
  "PARTIALLY_PROCESSING",
  "PROCESSING",
  "PARTIALLY_SHIPPED",
  "SHIPPED",
  "PARTIALLY_DELIVERED",
  "DELIVERED",
  "REFUNDED",
  "PARTIALLY_REFUNDED"
]);

export const SubOrderStatusDtoSchema = z.enum([
  "PROCESSING",
  "READY_TO_SHIP",
  "SHIPPED",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "RETURN_REQUESTED",
  "RETURN_IN_TRANSIT",
  "RETURN_RECEIVED",
  "REFUNDED",
  "EXCHANGED"
]);

export const PaymentStatusDtoSchema = z.enum([
  "PAID",
  "REFUNDED",
  "CANCELLED",
  "PAYMENT_PENDING"
]);

export const PaymentMethodDtoSchema = z.enum(["PIX", "UNKNOWN"]);

export const TrackingStatusDtoSchema = z.enum([
  "LABEL_CREATED",
  "POSTED",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
  "EXCEPTION"
]);

export const TicketStatusDtoSchema = z.enum([
  "OPEN",
  "WAITING_STORE",
  "WAITING_CUSTOMER",
  "IN_REVIEW",
  "RESOLUTION_PROPOSED",
  "RESOLVED",
  "CLOSED",
  "CANCELLED",
  "ESCALATED"
]);

export const TicketReasonDtoSchema = z.enum([
  "NOT_RECEIVED",
  "DAMAGED_ITEM",
  "WRONG_ITEM",
  "QUALITY_ISSUE",
  "SERVICE_ISSUE",
  "OTHER"
]);

export const TicketDesiredResolutionDtoSchema = z.enum([
  "REFUND",
  "EXCHANGE",
  "RESHIP",
  "INFO"
]);

export const TicketMessageSenderTypeDtoSchema = z.enum(["CUSTOMER", "STORE", "SUPPORT"]);
export const TicketAttachmentTypeDtoSchema = z.enum(["IMAGE", "VIDEO", "FILE"]);

export const CustomerBlockDtoSchema = z
  .object({
    customer_id: uuidSchema,
    name: z.string().min(1),
    cpf: z.string().nullable(),
    email: z.string().email().nullable(),
    phone_e164: z.string().nullable()
  })
  .strict();

export const OrderPaymentDtoSchema = z
  .object({
    status: PaymentStatusDtoSchema,
    method: PaymentMethodDtoSchema,
    paid_at: isoDateTimeSchema.nullable(),
    provider: z.string().min(1),
    provider_reference: z.string().nullable()
  })
  .strict();

export const OrderDeliveryAddressDtoSchema = z
  .object({
    recipient_name: z.string(),
    street: z.string(),
    number: z.string(),
    complement: z.string(),
    district: z.string(),
    city: z.string(),
    state: z.string(),
    postal_code: z.string(),
    country: z.string()
  })
  .strict();

export const OrderTotalsDtoSchema = z
  .object({
    items_subtotal: moneySchema,
    shipping_total: moneySchema,
    discount_total: moneySchema,
    grand_total: moneySchema
  })
  .strict();

export const CustomerSellerSummaryDtoSchema = z
  .object({
    seller_id: uuidSchema,
    seller_name: z.string().min(1),
    store_id: uuidSchema.optional(),
    store_name: z.string().min(1).optional()
  })
  .strict();

export const CustomerOrderSubOrderDtoSchema = z
  .object({
    sub_order_id: uuidSchema,
    seller_id: uuidSchema,
    seller_name: z.string().min(1),
    store_id: uuidSchema,
    store_name: z.string().min(1),
    status: SubOrderStatusDtoSchema,
    shipping_cost: moneySchema,
    shipping_eta_days: z.number().int().nonnegative().nullable(),
    items_count: z.number().int().nonnegative()
  })
  .strict();

export const CustomerOrderLegacyDtoSchema = z
  .object({
    id: uuidSchema,
    status: z.string().nullable(),
    payment_status: z.string().nullable()
  })
  .strict();

export const CustomerOrderDtoSchema = z
  .object({
    order_id: uuidSchema,
    order_number: z.string().min(1),
    created_at: isoDateTimeSchema,
    currency: z.string().min(3),
    customer: CustomerBlockDtoSchema,
    payment: OrderPaymentDtoSchema,
    delivery_address: OrderDeliveryAddressDtoSchema,
    totals: OrderTotalsDtoSchema,
    status: OrderStatusDtoSchema,
    sub_orders: z.array(CustomerOrderSubOrderDtoSchema),
    legacy: CustomerOrderLegacyDtoSchema
  })
  .strict();

const SupportChannelDtoSchema = z
  .object({
    type: z.string().min(1),
    hours: z.string().min(1)
  })
  .strict();

export const CustomerSubOrderSellerDtoSchema = z
  .object({
    seller_id: uuidSchema,
    seller_name: z.string().min(1),
    support_channel: SupportChannelDtoSchema,
    store_id: uuidSchema,
    store_name: z.string().min(1)
  })
  .strict();

export const CustomerSubOrderStoreDtoSchema = CustomerSubOrderSellerDtoSchema;

export const CustomerSubOrderItemDtoSchema = z
  .object({
    item_id: z.string().min(1),
    product_id: z.string().min(1),
    product_name: z.string().min(1),
    variant: z.string().nullable(),
    quantity: z.number().int().positive(),
    unit_price: moneySchema,
    image_url: z.string().url().nullable().optional()
  })
  .strict();

export const CustomerSubOrderShippingDtoSchema = z
  .object({
    shipping_cost: moneySchema,
    service_level: z.string().min(1),
    carrier: z.string().min(1),
    posted_at: isoDateTimeSchema,
    tracking_code: z.string().nullable(),
    estimated_delivery_date: isoDateSchema.nullable()
  })
  .strict();

export const CustomerSubOrderPricingDtoSchema = z
  .object({
    items_subtotal: moneySchema,
    shipping_cost: moneySchema,
    discount_total: moneySchema,
    total: moneySchema
  })
  .strict();

export const CustomerSubOrderEligibilityDtoSchema = z
  .object({
    can_open_ticket: z.boolean(),
    can_request_return: z.boolean(),
    return_deadline_date: isoDateSchema
  })
  .strict();

export const CustomerSubOrderDtoSchema = z
  .object({
    sub_order_id: uuidSchema,
    order_id: uuidSchema,
    order_number: z.string().min(1),
    seller: CustomerSubOrderSellerDtoSchema,
    store: CustomerSubOrderStoreDtoSchema,
    status: SubOrderStatusDtoSchema,
    items: z.array(CustomerSubOrderItemDtoSchema),
    shipping: CustomerSubOrderShippingDtoSchema,
    pricing: CustomerSubOrderPricingDtoSchema,
    eligibility: CustomerSubOrderEligibilityDtoSchema
  })
  .strict();

export const CustomerSubOrderShippingOnlyDtoSchema = z
  .object({
    sub_order_id: uuidSchema,
    order_id: uuidSchema,
    order_number: z.string().min(1),
    seller_id: uuidSchema,
    seller_name: z.string().min(1),
    store_id: uuidSchema,
    store_name: z.string().min(1),
    status: SubOrderStatusDtoSchema,
    shipping: CustomerSubOrderShippingDtoSchema
  })
  .strict();

export const CustomerTrackingEventDtoSchema = z
  .object({
    event_id: z.string().min(1),
    status: TrackingStatusDtoSchema,
    label: z.string().min(1),
    occurred_at: isoDateTimeSchema,
    location: z.string().nullable()
  })
  .strict();

export const CustomerTrackingDtoSchema = z
  .object({
    sub_order_id: uuidSchema,
    carrier: z.string().min(1),
    tracking_code: z.string().nullable(),
    last_updated_at: isoDateTimeSchema,
    current_status: TrackingStatusDtoSchema,
    events: z.array(CustomerTrackingEventDtoSchema)
  })
  .strict();

export const CustomerTrackingByOrderSubOrderDtoSchema = CustomerTrackingDtoSchema.extend({
  seller_id: uuidSchema,
  seller_name: z.string().min(1),
  store_id: uuidSchema,
  store_name: z.string().min(1)
}).strict();

export const CustomerTrackingByOrderDtoSchema = z
  .object({
    order_id: uuidSchema,
    order_number: z.string().min(1),
    status: OrderStatusDtoSchema,
    created_at: isoDateTimeSchema,
    sub_orders: z.array(CustomerTrackingByOrderSubOrderDtoSchema),
    tracking_summary: z
      .object({
        total_sub_orders: z.number().int().nonnegative(),
        delivered_sub_orders: z.number().int().nonnegative()
      })
      .strict()
  })
  .strict();

export const CustomerTicketSlaDtoSchema = z
  .object({
    first_response_due_at: isoDateTimeSchema,
    resolution_due_at: isoDateTimeSchema
  })
  .strict();

export const CustomerTicketItemDtoSchema = z
  .object({
    item_id: z.string().min(1),
    product_name: z.string().min(1),
    variant: z.string().nullable(),
    quantity: z.number().int().positive()
  })
  .strict();

export const CustomerTicketAttachmentDtoSchema = z
  .object({
    attachment_id: z.string().min(1),
    type: TicketAttachmentTypeDtoSchema,
    filename: z.string().min(1),
    url: z.string().url(),
    uploaded_at: isoDateTimeSchema
  })
  .strict();

export const CustomerTicketMessageDtoSchema = z
  .object({
    message_id: z.string().min(1),
    sender_type: TicketMessageSenderTypeDtoSchema,
    text: z.string(),
    attachment_ids: z.array(z.string().min(1)),
    sent_at: isoDateTimeSchema
  })
  .strict();

export const CustomerTicketDtoSchema = z
  .object({
    ticket_id: uuidSchema,
    protocol: z.string().min(1),
    created_at: isoDateTimeSchema,
    customer_id: uuidSchema.nullable(),
    order_id: uuidSchema.nullable(),
    sub_order_id: uuidSchema.nullable(),
    seller_id: uuidSchema.nullable(),
    store_id: uuidSchema.nullable(),
    reason: TicketReasonDtoSchema,
    desired_resolution: TicketDesiredResolutionDtoSchema,
    status: TicketStatusDtoSchema,
    sla: CustomerTicketSlaDtoSchema,
    items: z.array(CustomerTicketItemDtoSchema),
    description: z.string(),
    attachments: z.array(CustomerTicketAttachmentDtoSchema),
    messages: z.array(CustomerTicketMessageDtoSchema)
  })
  .strict();

export const CustomerTicketSummaryDtoSchema = z
  .object({
    ticket_id: uuidSchema,
    protocol: z.string().min(1),
    created_at: isoDateTimeSchema,
    order_id: uuidSchema.nullable(),
    sub_order_id: uuidSchema.nullable(),
    seller_id: uuidSchema.nullable(),
    store_id: uuidSchema.nullable(),
    reason: TicketReasonDtoSchema,
    desired_resolution: TicketDesiredResolutionDtoSchema,
    status: TicketStatusDtoSchema,
    sla: CustomerTicketSlaDtoSchema,
    description: z.string()
  })
  .strict();

export const CustomerOrdersListDtoSchema = z
  .object({
    items: z.array(CustomerOrderDtoSchema),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    page_size: z.number().int().positive()
  })
  .strict();

export const CustomerOrderSubOrdersListDtoSchema = z
  .object({
    order_id: uuidSchema,
    items: z.array(CustomerSubOrderDtoSchema)
  })
  .strict();

export const CustomerTrackingSearchListDtoSchema = z
  .object({
    items: z.array(CustomerOrderDtoSchema)
  })
  .strict();

export const CustomerTicketListDtoSchema = z
  .object({
    items: z.array(CustomerTicketSummaryDtoSchema),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    page_size: z.number().int().positive()
  })
  .strict();

export const CustomerTicketMessagesListDtoSchema = z
  .object({
    items: z.array(CustomerTicketMessageDtoSchema),
    next_cursor: isoDateTimeSchema.nullable()
  })
  .strict();

// Lightweight status projection schemas used by UI status resolvers.
export const CustomerOrderStatusInputDtoSchema = z
  .object({
    order_id: uuidSchema,
    order_number: z.string().min(1),
    created_at: isoDateTimeSchema,
    status: OrderStatusDtoSchema,
    sub_orders: z.array(
      z
        .object({
          sub_order_id: uuidSchema,
          status: SubOrderStatusDtoSchema
        })
        .strict()
    )
  })
  .strict();

export const CustomerSubOrderStatusInputDtoSchema = z
  .object({
    sub_order_id: uuidSchema,
    order_id: uuidSchema,
    order_number: z.string().min(1),
    status: SubOrderStatusDtoSchema,
    shipping: z
      .object({
        estimated_delivery_date: isoDateSchema.nullable().optional()
      })
      .strict()
      .nullable()
      .optional()
  })
  .strict();

export const CustomerTrackingStatusInputDtoSchema = z
  .object({
    current_status: TrackingStatusDtoSchema.optional(),
    events: z
      .array(
        z
          .object({
            status: TrackingStatusDtoSchema,
            occurred_at: isoDateTimeSchema.optional()
          })
          .strict()
      )
      .optional()
  })
  .strict();

export type CustomerOrderDto = z.infer<typeof CustomerOrderDtoSchema>;
export type CustomerSubOrderDto = z.infer<typeof CustomerSubOrderDtoSchema>;
export type CustomerSubOrderShippingOnlyDto = z.infer<typeof CustomerSubOrderShippingOnlyDtoSchema>;
export type CustomerTrackingEventDto = z.infer<typeof CustomerTrackingEventDtoSchema>;
export type CustomerTrackingDto = z.infer<typeof CustomerTrackingDtoSchema>;
export type CustomerTrackingByOrderDto = z.infer<typeof CustomerTrackingByOrderDtoSchema>;
export type CustomerTicketDto = z.infer<typeof CustomerTicketDtoSchema>;
export type CustomerTicketSummaryDto = z.infer<typeof CustomerTicketSummaryDtoSchema>;
export type CustomerOrdersListDto = z.infer<typeof CustomerOrdersListDtoSchema>;
export type CustomerOrderSubOrdersListDto = z.infer<typeof CustomerOrderSubOrdersListDtoSchema>;
export type CustomerTrackingSearchListDto = z.infer<typeof CustomerTrackingSearchListDtoSchema>;
export type CustomerTicketListDto = z.infer<typeof CustomerTicketListDtoSchema>;
export type CustomerTicketMessagesListDto = z.infer<typeof CustomerTicketMessagesListDtoSchema>;
export type CustomerOrderStatusInputDto = z.infer<typeof CustomerOrderStatusInputDtoSchema>;
export type CustomerSubOrderStatusInputDto = z.infer<typeof CustomerSubOrderStatusInputDtoSchema>;
export type CustomerTrackingStatusInputDto = z.infer<typeof CustomerTrackingStatusInputDtoSchema>;

export const parseCustomerOrderDto = (payload: unknown) => CustomerOrderDtoSchema.parse(payload);
export const parseCustomerSubOrderDto = (payload: unknown) => CustomerSubOrderDtoSchema.parse(payload);
export const parseCustomerTrackingDto = (payload: unknown) => CustomerTrackingDtoSchema.parse(payload);
export const parseCustomerTrackingByOrderDto = (payload: unknown) =>
  CustomerTrackingByOrderDtoSchema.parse(payload);
export const parseCustomerTicketDto = (payload: unknown) => CustomerTicketDtoSchema.parse(payload);
export const parseCustomerOrdersListDto = (payload: unknown) =>
  CustomerOrdersListDtoSchema.parse(payload);
export const parseCustomerOrderSubOrdersListDto = (payload: unknown) =>
  CustomerOrderSubOrdersListDtoSchema.parse(payload);
export const parseCustomerTrackingSearchListDto = (payload: unknown) =>
  CustomerTrackingSearchListDtoSchema.parse(payload);
export const parseCustomerTicketListDto = (payload: unknown) =>
  CustomerTicketListDtoSchema.parse(payload);
export const parseCustomerTicketMessagesListDto = (payload: unknown) =>
  CustomerTicketMessagesListDtoSchema.parse(payload);
export const parseCustomerOrderStatusInputDto = (payload: unknown) =>
  CustomerOrderStatusInputDtoSchema.parse(payload);
export const parseCustomerSubOrderStatusInputDto = (payload: unknown) =>
  CustomerSubOrderStatusInputDtoSchema.parse(payload);
export const parseCustomerTrackingStatusInputDto = (payload: unknown) =>
  CustomerTrackingStatusInputDtoSchema.parse(payload);

export const safeParseCustomerOrderDto = (payload: unknown) => {
  const result = CustomerOrderDtoSchema.safeParse(payload);
  return result.success ? result.data : null;
};

export const safeParseCustomerSubOrderDto = (payload: unknown) => {
  const result = CustomerSubOrderDtoSchema.safeParse(payload);
  return result.success ? result.data : null;
};

export const safeParseCustomerTrackingDto = (payload: unknown) => {
  const result = CustomerTrackingDtoSchema.safeParse(payload);
  return result.success ? result.data : null;
};

export const safeParseCustomerTrackingByOrderDto = (payload: unknown) => {
  const result = CustomerTrackingByOrderDtoSchema.safeParse(payload);
  return result.success ? result.data : null;
};

export const safeParseCustomerTicketDto = (payload: unknown) => {
  const result = CustomerTicketDtoSchema.safeParse(payload);
  return result.success ? result.data : null;
};

export const safeParseCustomerOrdersListDto = (payload: unknown) => {
  const result = CustomerOrdersListDtoSchema.safeParse(payload);
  return result.success ? result.data : null;
};

export const safeParseCustomerOrderStatusInputDto = (payload: unknown) => {
  const result = CustomerOrderStatusInputDtoSchema.safeParse(payload);
  return result.success ? result.data : null;
};

export const safeParseCustomerSubOrderStatusInputDto = (payload: unknown) => {
  const result = CustomerSubOrderStatusInputDtoSchema.safeParse(payload);
  return result.success ? result.data : null;
};

export const safeParseCustomerTrackingStatusInputDto = (payload: unknown) => {
  const result = CustomerTrackingStatusInputDtoSchema.safeParse(payload);
  return result.success ? result.data : null;
};
