#!/usr/bin/env node
const { z } = require("zod");

const BASE_URL = process.env.SMOKE_BASE_URL || "http://localhost:3000";
const SMOKE_COOKIE = process.env.SMOKE_COOKIE || "";
const SMOKE_BEARER_TOKEN = process.env.SMOKE_BEARER_TOKEN || "";

const ORDER_STATUS = [
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
];

const SUB_ORDER_STATUS = [
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
];

const TICKET_STATUS = [
  "OPEN",
  "WAITING_STORE",
  "WAITING_CUSTOMER",
  "IN_REVIEW",
  "RESOLUTION_PROPOSED",
  "RESOLVED",
  "CLOSED",
  "CANCELLED",
  "ESCALATED"
];

const TICKET_REASON = [
  "NOT_RECEIVED",
  "DAMAGED_ITEM",
  "WRONG_ITEM",
  "QUALITY_ISSUE",
  "SERVICE_ISSUE",
  "OTHER"
];

const TICKET_DESIRED_RESOLUTION = ["REFUND", "EXCHANGE", "RESHIP", "INFO"];

const TRACKING_STATUS = [
  "LABEL_CREATED",
  "POSTED",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
  "RETURNED"
];

const DateTimeSchema = z.string().datetime({ offset: true });
const DateOnlySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const NonEmptyString = z.string().min(1);
const MoneySchema = z.number();

const CustomerSchema = z.object({
  customer_id: NonEmptyString,
  name: NonEmptyString,
  cpf: z.string().nullable(),
  email: z.string().nullable(),
  phone_e164: z.string().nullable()
});

const PaymentSchema = z.object({
  status: z.enum(["PAID", "PAYMENT_PENDING", "REFUNDED", "CANCELLED"]),
  method: z.enum(["PIX", "UNKNOWN"]),
  paid_at: DateTimeSchema.nullable(),
  provider: NonEmptyString,
  provider_reference: z.string().nullable()
});

const DeliveryAddressSchema = z.object({
  recipient_name: z.string(),
  street: z.string(),
  number: z.string(),
  complement: z.string(),
  district: z.string(),
  city: z.string(),
  state: z.string(),
  postal_code: z.string(),
  country: z.string()
});

const OrderSubOrderSummarySchema = z.object({
  sub_order_id: NonEmptyString,
  seller_id: NonEmptyString,
  seller_name: NonEmptyString,
  store_id: NonEmptyString,
  store_name: NonEmptyString,
  status: z.enum(SUB_ORDER_STATUS),
  shipping_cost: MoneySchema,
  shipping_eta_days: z.number().nullable(),
  items_count: z.number().int()
});

const OrderSchema = z
  .object({
    order_id: NonEmptyString,
    order_number: NonEmptyString,
    created_at: DateTimeSchema,
    currency: z.string(),
    customer: CustomerSchema,
    payment: PaymentSchema,
    delivery_address: DeliveryAddressSchema,
    totals: z.object({
      items_subtotal: MoneySchema,
      shipping_total: MoneySchema,
      discount_total: MoneySchema,
      grand_total: MoneySchema
    }),
    status: z.enum(ORDER_STATUS),
    sub_orders: z.array(OrderSubOrderSummarySchema)
  })
  .passthrough();

const OrderListSchema = z.object({
  page: z.number().int(),
  page_size: z.number().int(),
  total: z.number().int(),
  items: z.array(OrderSchema)
});

const SubOrderItemSchema = z.object({
  item_id: NonEmptyString,
  product_id: NonEmptyString,
  product_name: NonEmptyString,
  variant: z.string().nullable(),
  quantity: z.number().int().positive(),
  unit_price: MoneySchema,
  image_url: z.string().nullable()
});

const SubOrderSchema = z.object({
  sub_order_id: NonEmptyString,
  order_id: NonEmptyString,
  order_number: NonEmptyString,
  seller: z.object({
    seller_id: NonEmptyString,
    seller_name: NonEmptyString,
    support_channel: z.object({
      type: NonEmptyString,
      hours: NonEmptyString
    }),
    store_id: NonEmptyString,
    store_name: NonEmptyString
  }),
  store: z.object({
    store_id: NonEmptyString,
    store_name: NonEmptyString,
    support_channel: z.object({
      type: NonEmptyString,
      hours: NonEmptyString
    })
  }),
  status: z.enum(SUB_ORDER_STATUS),
  items: z.array(SubOrderItemSchema),
  shipping: z.object({
    shipping_cost: MoneySchema,
    service_level: z.string(),
    carrier: z.string(),
    posted_at: DateTimeSchema,
    tracking_code: z.string().nullable(),
    estimated_delivery_date: DateOnlySchema.nullable()
  }),
  pricing: z.object({
    items_subtotal: MoneySchema,
    shipping_cost: MoneySchema,
    discount_total: MoneySchema,
    total: MoneySchema
  }),
  eligibility: z.object({
    can_open_ticket: z.boolean(),
    can_request_return: z.boolean(),
    return_deadline_date: DateOnlySchema
  })
});

const SubOrderListSchema = z.object({
  order_id: NonEmptyString,
  items: z.array(SubOrderSchema)
});

const TrackingEventSchema = z.object({
  event_id: NonEmptyString,
  status: z.string().min(1),
  label: NonEmptyString,
  occurred_at: DateTimeSchema,
  location: z.string().nullable()
});

const TrackingSchema = z.object({
  sub_order_id: NonEmptyString,
  carrier: NonEmptyString,
  tracking_code: z.string().nullable(),
  last_updated_at: DateTimeSchema,
  current_status: z.enum(TRACKING_STATUS).or(z.string().min(1)),
  events: z.array(TrackingEventSchema)
});

const TrackingByOrderSchema = z.object({
  order_id: NonEmptyString,
  order_number: NonEmptyString,
  status: z.enum(ORDER_STATUS),
  created_at: DateTimeSchema,
  sub_orders: z.array(
    TrackingSchema.extend({
      seller_id: NonEmptyString,
      seller_name: NonEmptyString,
      store_id: NonEmptyString,
      store_name: NonEmptyString
    })
  ),
  tracking_summary: z.object({
    total_sub_orders: z.number().int(),
    delivered_sub_orders: z.number().int()
  })
});

const TicketAttachmentSchema = z.object({
  attachment_id: NonEmptyString,
  type: z.enum(["IMAGE", "VIDEO", "FILE"]),
  filename: NonEmptyString,
  url: z.string().url(),
  uploaded_at: DateTimeSchema
});

const TicketMessageSchema = z.object({
  message_id: NonEmptyString,
  sender_type: z.enum(["CUSTOMER", "STORE", "SUPPORT"]),
  text: z.string(),
  attachment_ids: z.array(z.string()),
  sent_at: DateTimeSchema
});

const TicketSchema = z.object({
  ticket_id: NonEmptyString,
  protocol: NonEmptyString,
  created_at: DateTimeSchema,
  customer_id: z.string().nullable(),
  order_id: z.string().nullable(),
  sub_order_id: z.string().nullable(),
  seller_id: z.string().nullable(),
  store_id: z.string().nullable(),
  reason: z.enum(TICKET_REASON),
  desired_resolution: z.enum(TICKET_DESIRED_RESOLUTION),
  status: z.enum(TICKET_STATUS),
  sla: z.object({
    first_response_due_at: DateTimeSchema,
    resolution_due_at: DateTimeSchema
  }),
  items: z.array(
    z.object({
      item_id: NonEmptyString,
      product_name: NonEmptyString,
      variant: z.string().nullable(),
      quantity: z.number().int().positive()
    })
  ),
  description: z.string(),
  attachments: z.array(TicketAttachmentSchema),
  messages: z.array(TicketMessageSchema)
});

const TicketListItemSchema = z.object({
  ticket_id: NonEmptyString,
  protocol: NonEmptyString,
  created_at: DateTimeSchema,
  order_id: z.string().nullable(),
  sub_order_id: z.string().nullable(),
  store_id: z.string().nullable(),
  reason: z.enum(TICKET_REASON),
  desired_resolution: z.enum(TICKET_DESIRED_RESOLUTION),
  status: z.enum(TICKET_STATUS),
  sla: z.object({
    first_response_due_at: DateTimeSchema,
    resolution_due_at: DateTimeSchema
  }),
  description: z.string()
});

const TicketListSchema = z.object({
  page: z.number().int(),
  page_size: z.number().int(),
  total: z.number().int(),
  items: z.array(TicketListItemSchema)
});

const TicketMessagesListSchema = z.object({
  items: z.array(TicketMessageSchema),
  next_cursor: z.string().nullable()
});

const fixtures = {
  order: {
    order_id: "3c1f3c6b-1d6f-4c2b-a9d5-1c3b6d8f7a10",
    order_number: "BP-2026-000123",
    created_at: "2026-03-05T14:22:10-03:00",
    currency: "BRL",
    customer: {
      customer_id: "0d6b3a7a-9e2c-4d40-9d0c-4f3fd3b6f111",
      name: "Giovanna Ferreira",
      cpf: "123.456.789-09",
      email: "giovanna@email.com",
      phone_e164: "+5534999999999"
    },
    payment: {
      status: "PAID",
      method: "PIX",
      paid_at: "2026-03-05T14:24:01-03:00",
      provider: "STRIPE",
      provider_reference: "pay_8f7b2c..."
    },
    delivery_address: {
      recipient_name: "Giovanna Ferreira",
      street: "Av. BelaPop",
      number: "100",
      complement: "Apto 301",
      district: "Centro",
      city: "Araguari",
      state: "MG",
      postal_code: "38440-000",
      country: "BR"
    },
    totals: {
      items_subtotal: 189.9,
      shipping_total: 24.8,
      discount_total: 10,
      grand_total: 204.7
    },
    status: "PARTIALLY_SHIPPED",
    sub_orders: [
      {
        sub_order_id: "b9d8e4a7-1a02-4e23-a1de-3f4e1b01c9a1",
        store_id: "store_001",
        store_name: "Loja Rosa Lux",
        status: "SHIPPED",
        shipping_cost: 14.9,
        shipping_eta_days: 3,
        items_count: 2
      },
      {
        sub_order_id: "6b2b9d9b-8b5e-43a9-bb47-7d3127d0c2c2",
        store_id: "store_002",
        store_name: "Loja Black Beauty",
        status: "PROCESSING",
        shipping_cost: 9.9,
        shipping_eta_days: 5,
        items_count: 1
      }
    ]
  },
  subOrder: {
    sub_order_id: "b9d8e4a7-1a02-4e23-a1de-3f4e1b01c9a1",
    order_id: "3c1f3c6b-1d6f-4c2b-a9d5-1c3b6d8f7a10",
    order_number: "BP-2026-000123",
    store: {
      store_id: "store_001",
      store_name: "Loja Rosa Lux",
      support_channel: {
        type: "IN_APP_CHAT",
        hours: "09:00-18:00"
      }
    },
    status: "SHIPPED",
    items: [
      {
        item_id: "item_aa01",
        product_id: "prod_001",
        product_name: "Batom Velvet Rosa",
        variant: "Rosa 04",
        quantity: 1,
        unit_price: 59.9,
        image_url: "https://cdn.belapop.com/products/prod_001.png"
      },
      {
        item_id: "item_aa02",
        product_id: "prod_010",
        product_name: "Blush Soft Touch",
        variant: "Peach 02",
        quantity: 1,
        unit_price: 79.9,
        image_url: "https://cdn.belapop.com/products/prod_010.png"
      }
    ],
    shipping: {
      shipping_cost: 14.9,
      service_level: "PAC",
      carrier: "Correios",
      posted_at: "2026-03-05T16:10:00-03:00",
      tracking_code: "BR123456789BR",
      estimated_delivery_date: "2026-03-08"
    },
    pricing: {
      items_subtotal: 139.8,
      shipping_cost: 14.9,
      discount_total: 0,
      total: 154.7
    },
    eligibility: {
      can_open_ticket: true,
      can_request_return: true,
      return_deadline_date: "2026-03-15"
    }
  },
  tracking: {
    sub_order_id: "b9d8e4a7-1a02-4e23-a1de-3f4e1b01c9a1",
    carrier: "Correios",
    tracking_code: "BR123456789BR",
    last_updated_at: "2026-03-06T10:05:12-03:00",
    current_status: "IN_TRANSIT",
    events: [
      {
        event_id: "trk_001",
        status: "LABEL_CREATED",
        label: "Etiqueta gerada",
        occurred_at: "2026-03-05T15:40:00-03:00",
        location: "Araguari/MG"
      },
      {
        event_id: "trk_002",
        status: "POSTED",
        label: "Postado",
        occurred_at: "2026-03-05T16:10:00-03:00",
        location: "Araguari/MG"
      },
      {
        event_id: "trk_003",
        status: "IN_TRANSIT",
        label: "Em transito",
        occurred_at: "2026-03-06T09:58:00-03:00",
        location: "Uberlandia/MG"
      }
    ]
  },
  ticket: {
    ticket_id: "tkt_9a7f3d2b-2e2a-4d3c-9c28-1b5f4d2c0a22",
    protocol: "BP-SUP-2026-000981",
    created_at: "2026-03-06T11:12:20-03:00",
    customer_id: "0d6b3a7a-9e2c-4d40-9d0c-4f3fd3b6f111",
    order_id: "3c1f3c6b-1d6f-4c2b-a9d5-1c3b6d8f7a10",
    sub_order_id: "b9d8e4a7-1a02-4e23-a1de-3f4e1b01c9a1",
    store_id: "store_001",
    reason: "DAMAGED_ITEM",
    desired_resolution: "EXCHANGE",
    status: "WAITING_STORE",
    sla: {
      first_response_due_at: "2026-03-06T23:59:59-03:00",
      resolution_due_at: "2026-03-09T23:59:59-03:00"
    },
    items: [
      {
        item_id: "item_aa01",
        product_name: "Batom Velvet Rosa",
        variant: "Rosa 04",
        quantity: 1
      }
    ],
    description: "O produto chegou com a tampa quebrada e vazando um pouco. Quero troca.",
    attachments: [
      {
        attachment_id: "att_001",
        type: "IMAGE",
        filename: "batom_quebrado.jpg",
        url: "https://secure.cdn.belapop.com/support/att_001",
        uploaded_at: "2026-03-06T11:13:02-03:00"
      }
    ],
    messages: [
      {
        message_id: "msg_001",
        sender_type: "CUSTOMER",
        text: "Chegou quebrado, anexei foto. Quero troca.",
        attachment_ids: ["att_001"],
        sent_at: "2026-03-06T11:13:10-03:00"
      },
      {
        message_id: "msg_002",
        sender_type: "STORE",
        text: "Sentimos muito. Vamos providenciar a troca. Pode confirmar o endereco?",
        attachment_ids: [],
        sent_at: "2026-03-06T12:05:44-03:00"
      }
    ]
  }
};

function headers() {
  const result = {
    Accept: "application/json"
  };
  if (SMOKE_COOKIE) {
    result.Cookie = SMOKE_COOKIE;
  }
  if (SMOKE_BEARER_TOKEN) {
    result.Authorization = `Bearer ${SMOKE_BEARER_TOKEN}`;
  }
  return result;
}

function printOk(label) {
  console.log(`[OK] ${label}`);
}

function printSkip(label) {
  console.log(`[SKIP] ${label}`);
}

async function requestJson(pathname) {
  const url = `${BASE_URL}${pathname}`;
  const response = await fetch(url, {
    method: "GET",
    headers: headers()
  });
  const raw = await response.text();
  let payload = null;
  try {
    payload = raw ? JSON.parse(raw) : null;
  } catch {
    throw new Error(`Resposta nao-JSON em ${pathname}: ${raw.slice(0, 240)}`);
  }
  if (!response.ok) {
    const errorMessage =
      payload && typeof payload === "object" && "error" in payload
        ? String(payload.error)
        : JSON.stringify(payload);
    throw new Error(`HTTP ${response.status} em ${pathname}: ${errorMessage}`);
  }
  return payload;
}

function validateFixtures() {
  OrderSchema.parse(fixtures.order);
  SubOrderSchema.parse(fixtures.subOrder);
  TrackingSchema.parse(fixtures.tracking);
  TicketSchema.parse(fixtures.ticket);
  printOk("Fixtures JSON (order, sub-order, tracking, ticket) validos no contrato");
}

async function validateLive() {
  const hasAuth = Boolean(SMOKE_COOKIE || SMOKE_BEARER_TOKEN);
  if (!hasAuth) {
    printSkip("Live /api/v1 ignorado: defina SMOKE_COOKIE (ou SMOKE_BEARER_TOKEN)");
    printSkip("Exemplo: SMOKE_BASE_URL=https://SEU-DOMINIO SMOKE_COOKIE=\"sb-...\" npm run smoke:contract:customer:v1");
    return;
  }

  const ordersList = OrderListSchema.parse(
    await requestJson("/api/v1/orders?page=1&page_size=20")
  );
  printOk("/api/v1/orders");

  if (ordersList.items.length === 0) {
    printSkip("Sem orders para continuar encadeamento live");
  } else {
    const orderId = ordersList.items[0].order_id;
    const orderDetail = OrderSchema.parse(await requestJson(`/api/v1/orders/${orderId}`));
    if (orderDetail.order_id !== orderId) {
      throw new Error("order_id divergente entre listagem e detalhe");
    }
    printOk("/api/v1/orders/{order_id}");

    const subOrdersByOrder = SubOrderListSchema.parse(
      await requestJson(`/api/v1/orders/${orderId}/sub-orders`)
    );
    printOk("/api/v1/orders/{order_id}/sub-orders");

    const trackingByOrder = TrackingByOrderSchema.parse(
      await requestJson(`/api/v1/tracking/by-order/${orderId}`)
    );
    if (trackingByOrder.order_id !== orderId) {
      throw new Error("order_id divergente em tracking by-order");
    }
    printOk("/api/v1/tracking/by-order/{order_id}");

    const subOrderId =
      subOrdersByOrder.items[0]?.sub_order_id ??
      orderDetail.sub_orders[0]?.sub_order_id ??
      null;

    if (!subOrderId) {
      printSkip("Order sem sub-orders para validar endpoints de sub-order/tracking por sub-order");
    } else {
      const subOrderDetail = SubOrderSchema.parse(
        await requestJson(`/api/v1/sub-orders/${subOrderId}`)
      );
      if (subOrderDetail.sub_order_id !== subOrderId) {
        throw new Error("sub_order_id divergente no detalhe");
      }
      printOk("/api/v1/sub-orders/{sub_order_id}");

      const trackingBySubOrder = TrackingSchema.parse(
        await requestJson(`/api/v1/tracking/by-sub-order/${subOrderId}`)
      );
      if (trackingBySubOrder.sub_order_id !== subOrderId) {
        throw new Error("sub_order_id divergente no tracking por sub-order");
      }
      printOk("/api/v1/tracking/by-sub-order/{sub_order_id}");
    }
  }

  const ticketsList = TicketListSchema.parse(
    await requestJson("/api/v1/support/tickets?page=1&page_size=20")
  );
  printOk("/api/v1/support/tickets");

  if (ticketsList.items.length === 0) {
    printSkip("Sem tickets para validar detalhe e messages");
    return;
  }

  const ticketId = ticketsList.items[0].ticket_id;
  const ticketDetail = TicketSchema.parse(
    await requestJson(`/api/v1/support/tickets/${ticketId}`)
  );
  if (ticketDetail.ticket_id !== ticketId) {
    throw new Error("ticket_id divergente em detalhe");
  }
  printOk("/api/v1/support/tickets/{ticket_id}");

  TicketMessagesListSchema.parse(
    await requestJson(`/api/v1/support/tickets/${ticketId}/messages?limit=20`)
  );
  printOk("/api/v1/support/tickets/{ticket_id}/messages");
}

async function main() {
  console.log("== BelaPop Customer API v1 Contract Smoke ==");
  console.log(`Base URL: ${BASE_URL}`);
  validateFixtures();
  await validateLive();
  console.log("Smoke concluido.");
}

main().catch((error) => {
  console.error("[FAIL] Contract smoke:", error instanceof Error ? error.message : String(error));
  process.exit(1);
});
