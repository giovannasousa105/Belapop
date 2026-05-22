import { createRebuyReminders } from "@/lib/lifecycle/postPurchase/rebuy";
import { getComplementaryRecommendations, recommendationRules } from "@/lib/lifecycle/postPurchase/recommendations";
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
  reviewRequestWhatsApp
} from "@/lib/lifecycle/postPurchase/templates";
import type {
  Customer,
  LifecycleEvent,
  LifecycleRule,
  LifecycleTemplate,
  Order,
  PostPurchaseMessage,
  ProductUsageGuide,
  RecommendationProduct,
  ReviewRequest
} from "@/lib/lifecycle/postPurchase/types";

export const mockLifecycleCustomers: Customer[] = [
  {
    id: "cus-marina",
    name: "Marina Alves",
    email: "marina.alves@example.com",
    phone: "+5511999990101",
    marketingConsent: true,
    whatsappOptIn: true,
    smsOptIn: false,
    skinProfile: {
      skinType: "sensível",
      concerns: ["barreira", "vermelhidao", "ressecamento"],
      contraindications: ["retinol alto", "esfoliacao agressiva"],
      lastSkinScanAt: "2026-04-20T14:30:00.000Z",
      skinScanSummary: "Barreira sensibilizada com necessidade de conforto e baixa irritabilidade.",
      routinePreference: "premium"
    },
    purchaseCount: 4,
    lastPurchaseAt: "2026-04-24T11:00:00.000Z"
  },
  {
    id: "cus-bianca",
    name: "Bianca Torres",
    email: "bianca.torres@example.com",
    phone: "+5521999990202",
    marketingConsent: true,
    whatsappOptIn: false,
    optOutChannels: ["whatsapp"],
    skinProfile: {
      skinType: "mista",
      concerns: ["manchas", "oleosidade", "textura"],
      lastSkinScanAt: "2026-04-12T09:10:00.000Z",
      skinScanSummary: "Oleosidade em zona T e prioridade para uniformizacao com proteção diaria.",
      routinePreference: "essencial"
    },
    purchaseCount: 2,
    lastPurchaseAt: "2026-04-05T12:00:00.000Z"
  },
  {
    id: "cus-luiza",
    name: "Luiza Nogueira",
    email: "luiza.nogueira@example.com",
    phone: "+5531999990303",
    marketingConsent: false,
    whatsappOptIn: false,
    optOutChannels: ["email", "whatsapp", "sms"],
    skinProfile: {
      skinType: "normal",
      concerns: ["glow", "primeiros sinais"],
      routinePreference: "luxo"
    },
    purchaseCount: 1,
    lastPurchaseAt: "2026-04-28T16:40:00.000Z"
  }
];

export const mockLifecycleOrders: Order[] = [
  {
    id: "ord-1001",
    customerId: "cus-marina",
    status: "delivered",
    confirmedAt: "2026-04-24T11:00:00.000Z",
    shippedAt: "2026-04-25T14:20:00.000Z",
    deliveredAt: "2026-04-27T17:10:00.000Z",
    sellerNames: ["Aurora Maison"],
    skinScanId: "scan-marina-0420",
    items: [
      {
        id: "item-1001-a",
        productId: "creme-barrier-celeste",
        sku: "AUR-BAR-CRE-50",
        productName: "Aurora Maison Barrier Creme Ceramidas 50g",
        category: "hidratante",
        concern: "barreira",
        skinTypes: ["sensível", "seca", "mista"],
        routineStep: "hidratação",
        usageFrequency: "manha e noite",
        howToUse: ["Aplique uma camada fina apos limpeza e serum.", "Reforce em areas sensibilizadas."],
        precautions: ["Evite aplicar sobre pele lesionada.", "Reduza ativos intensos nos primeiros dias."],
        combinesWith: ["limpeza suave", "protetor solar", "pantenol"],
        avoidWith: ["esfoliacao agressiva"],
        sellerName: "Aurora Maison",
        quantity: 1,
        unitPriceCents: 21900,
        averageDurationDays: 38
      }
    ]
  },
  {
    id: "ord-1002",
    customerId: "cus-bianca",
    status: "delivered",
    confirmedAt: "2026-04-05T12:00:00.000Z",
    shippedAt: "2026-04-06T15:30:00.000Z",
    deliveredAt: "2026-04-09T13:15:00.000Z",
    sellerNames: ["BelaPop Curadoria"],
    items: [
      {
        id: "item-1002-a",
        productId: "serum-vitamina-c-luxe",
        sku: "BLP-VC-LUX-30",
        productName: "BelaPop Clinical Serum Vitamina C 30ml",
        category: "serum-vitamina-c",
        concern: "manchas",
        skinTypes: ["mista", "oleosa", "normal"],
        routineStep: "tratamento da manha",
        usageFrequency: "uma vez ao dia",
        howToUse: ["Use pela manha antes do hidratante.", "Finalize com protetor solar."],
        precautions: ["Introduza aos poucos se houver sensibilidade.", "Não use sobre pele irritada."],
        combinesWith: ["protetor solar", "hidratante leve"],
        avoidWith: ["esfoliante forte na mesma rotina"],
        sellerName: "BelaPop Curadoria",
        quantity: 1,
        unitPriceCents: 28900,
        averageDurationDays: 50
      }
    ]
  },
  {
    id: "ord-1003",
    customerId: "cus-luiza",
    status: "delivered",
    confirmedAt: "2026-04-28T16:40:00.000Z",
    shippedAt: "2026-04-29T10:00:00.000Z",
    deliveredAt: "2026-05-01T18:20:00.000Z",
    sellerNames: ["BelaPop Curadoria", "Aurora Maison"],
    bundleId: "kit-barreira-premium",
    bundleName: "Kit Barreira Premium",
    items: [
      {
        id: "item-1003-a",
        productId: "gel-limpeza-calmo",
        sku: "BLP-CALM-GEL-200",
        productName: "BelaPop Gel de Limpeza Calmo 200ml",
        category: "limpeza",
        concern: "barreira",
        skinTypes: ["sensível", "normal", "mista"],
        routineStep: "limpeza",
        usageFrequency: "manha e noite",
        howToUse: ["Massageie sobre a pele umida.", "Enxague sem friccionar."],
        precautions: ["Evite contato direto com os olhos."],
        combinesWith: ["hidratante calmante", "protetor solar"],
        sellerName: "BelaPop Curadoria",
        quantity: 1,
        unitPriceCents: 15900,
        averageDurationDays: 50,
        isBundleItem: true
      },
      {
        id: "item-1003-b",
        productId: "protetor-mineral-velvet",
        sku: "AUR-MIN-FPS-50",
        productName: "Aurora Maison Protetor Mineral FPS 50 40ml",
        category: "protetor-solar",
        concern: "proteção solar",
        skinTypes: ["sensível", "normal", "seca"],
        routineStep: "proteção",
        usageFrequency: "todos os dias pela manha",
        howToUse: ["Aplique como ultimo passo da manha.", "Reaplique em exposicao prolongada."],
        precautions: ["Não substitui barreiras fisicas de proteção solar."],
        combinesWith: ["antioxidante", "hidratante"],
        sellerName: "Aurora Maison",
        quantity: 1,
        unitPriceCents: 19800,
        averageDurationDays: 30,
        isBundleItem: true
      }
    ]
  }
];

export const mockRecommendationCatalog: RecommendationProduct[] = [
  {
    id: "hidratante-pantenol-calmo",
    name: "BelaPop Hidratante Pantenol Calmo 50g",
    category: "hidratante",
    concern: "pantenol calmante barreira",
    skinTypes: ["sensível", "seca", "mista"],
    tags: ["calmante", "barreira", "baixa irritabilidade"],
    priceCents: 18900,
    href: "/produto/hidratante-pantenol-calmo",
    image: "/catalog/premium-product-placeholder.svg"
  },
  {
    id: "protetor-solar-seda-fps50",
    name: "BelaPop Protetor Solar Seda FPS 50 40ml",
    category: "protetor-solar",
    concern: "proteção solar uniformizacao",
    skinTypes: ["mista", "oleosa", "normal"],
    tags: ["fps", "toque seco", "uniformizacao"],
    priceCents: 16900,
    href: "/produto/protetor-solar-seda-fps50",
    image: "/catalog/premium-product-placeholder.svg"
  },
  {
    id: "antioxidante-glow-c",
    name: "BelaPop Antioxidante Glow C 30ml",
    category: "serum-vitamina-c",
    concern: "antioxidante uniformizacao manchas",
    skinTypes: ["normal", "mista", "oleosa"],
    tags: ["antioxidante", "uniformizacao", "glow"],
    priceCents: 24900,
    href: "/produto/antioxidante-glow-c",
    image: "/catalog/premium-product-placeholder.svg"
  },
  {
    id: "mascara-conforto-ceramidas",
    name: "Aurora Maison Mascara Conforto Ceramidas 60ml",
    category: "mascara",
    concern: "ceramidas barreira conforto",
    skinTypes: ["sensível", "seca"],
    tags: ["ceramidas", "barreira", "conforto"],
    priceCents: 22900,
    href: "/produto/mascara-conforto-ceramidas",
    image: "/catalog/premium-product-placeholder.svg"
  }
];

export const mockLifecycleRules: LifecycleRule[] = [
  {
    id: "rule-order-confirmed-usage",
    title: "Guia de uso apos pedido confirmado",
    eventType: "order_confirmed",
    messageType: "usage_guide",
    delayDays: 0,
    channels: ["email"],
    communicationType: "transactional",
    status: "active",
    description: "Ensina ordem, frequencia, cuidados, combina com e evitar junto."
  },
  {
    id: "rule-order-shipped-usage-backfill",
    title: "Reforco de uso quando pedido e enviado",
    eventType: "order_shipped",
    messageType: "usage_guide",
    delayDays: 0,
    channels: ["email", "whatsapp"],
    communicationType: "transactional",
    status: "active",
    description: "Garante que a cliente receba orientacao de uso antes da chegada, sem duplicar o guia ja enviado."
  },
  {
    id: "rule-delivery-plus-2",
    title: "Check-in 2 dias apos entrega",
    eventType: "delivery_plus_2",
    messageType: "delivery_follow_up",
    delayDays: 2,
    channels: ["email", "whatsapp"],
    communicationType: "transactional",
    status: "active",
    description: "Confirma recebimento, estado do pedido e acesso ao suporte."
  },
  {
    id: "rule-delivery-plus-7",
    title: "Recomendação complementar 7 dias apos entrega",
    eventType: "delivery_plus_7",
    messageType: "complementary_recommendation",
    delayDays: 7,
    channels: ["email", "whatsapp"],
    communicationType: "marketing",
    status: "active",
    description: "Sugere complemento por categoria, necessidade, Skin Scan ou bundle."
  },
  {
    id: "rule-delivery-plus-21-review",
    title: "Convite para avaliação real",
    eventType: "delivery_plus_21",
    messageType: "review_request",
    delayDays: 21,
    channels: ["email", "whatsapp"],
    communicationType: "marketing",
    status: "active",
    description: "Pede opiniao real, nota e comentario sem incentivo a avaliação positiva."
  },
  {
    id: "rule-rebuy-by-category",
    title: "Lembrete de recompra por categoria",
    eventType: "product_running_low",
    messageType: "rebuy_reminder",
    delayDays: 30,
    channels: ["email", "whatsapp"],
    communicationType: "marketing",
    status: "active",
    description: "Usa duração media de limpador, serum, hidratante, protetor, mascara e bundle."
  },
  {
    id: "rule-customer-without-rebuy",
    title: "Cliente sem recompra",
    eventType: "customer_without_rebuy",
    messageType: "rebuy_reminder",
    delayDays: 60,
    channels: ["email", "whatsapp"],
    communicationType: "marketing",
    status: "active",
    description: "Identifica clientes sem nova compra e oferece recompra ou alternativa premium respeitando opt-out."
  }
];

export const mockReviewRequests: ReviewRequest[] = mockLifecycleOrders.flatMap((order) =>
  order.items.map((item) => ({
    id: `review-${order.id}-${item.id}`,
    customerId: order.customerId,
    orderId: order.id,
    orderItemId: item.id,
    productId: item.productId,
    productName: item.productName,
    requestedAt: "2026-05-08T09:00:00.000Z",
    status: "pending"
  }))
);

export const mockRebuyReminders = mockLifecycleOrders.flatMap(createRebuyReminders);

export const mockUsageGuides: ProductUsageGuide[] = mockLifecycleOrders.flatMap((order) =>
  order.items.map((item) => ({
    productId: item.productId,
    productName: item.productName,
    routineStep: item.routineStep,
    howToUse: item.howToUse,
    frequency: item.usageFrequency,
    precautions: item.precautions,
    combinesWith: item.combinesWith,
    avoidWith: item.avoidWith ?? [],
    ctaLabel: "Ver minha rotina",
    ctaHref: "/minha-rotina"
  }))
);

const previewCustomer = mockLifecycleCustomers[0];
const previewOrder = mockLifecycleOrders[0];
const previewRecommendations = getComplementaryRecommendations(
  previewOrder,
  previewCustomer.skinProfile,
  mockRecommendationCatalog
);
const previewReview = mockReviewRequests[0];
const previewRebuy = mockRebuyReminders[0];

export const mockLifecycleTemplates: LifecycleTemplate[] = [
  postPurchaseUsageEmail({ customer: previewCustomer, order: previewOrder }),
  deliveryFollowUpEmail({ customer: previewCustomer, order: previewOrder }),
  complementaryRecommendationEmail({
    customer: previewCustomer,
    order: previewOrder,
    recommendations: previewRecommendations
  }),
  rebuyReminderEmail({
    customer: previewCustomer,
    order: previewOrder,
    rebuyReminder: previewRebuy
  }),
  reviewRequestEmail({
    customer: previewCustomer,
    order: previewOrder,
    reviewRequest: previewReview
  }),
  postPurchaseUsageWhatsApp({ customer: previewCustomer, order: previewOrder }),
  deliveryFollowUpWhatsApp({ customer: previewCustomer, order: previewOrder }),
  complementaryRecommendationWhatsApp({
    customer: previewCustomer,
    order: previewOrder,
    recommendations: previewRecommendations
  }),
  rebuyReminderWhatsApp({
    customer: previewCustomer,
    order: previewOrder,
    rebuyReminder: previewRebuy
  }),
  reviewRequestWhatsApp({
    customer: previewCustomer,
    order: previewOrder,
    reviewRequest: previewReview
  })
];

export const mockLifecycleEvents: LifecycleEvent[] = [
  {
    id: "evt-ord-1001-delivered",
    type: "order_delivered",
    customerId: "cus-marina",
    orderId: "ord-1001",
    occurredAt: "2026-04-27T17:10:00.000Z"
  },
  {
    id: "evt-ord-1002-delivered",
    type: "order_delivered",
    customerId: "cus-bianca",
    orderId: "ord-1002",
    occurredAt: "2026-04-09T13:15:00.000Z"
  },
  {
    id: "evt-scan-marina",
    type: "skin_scan_available",
    customerId: "cus-marina",
    orderId: "ord-1001",
    occurredAt: "2026-04-20T14:30:00.000Z",
    payload: { skin_type: "sensivel" }
  }
];

export const mockPostPurchaseMessages: PostPurchaseMessage[] = [
  {
    id: "msg-usage-ord-1001",
    messageId: "lifecycle:cus-marina:ord-1001:postPurchaseUsageEmail",
    customerId: "cus-marina",
    orderId: "ord-1001",
    orderItemId: "item-1001-a",
    templateId: "postPurchaseUsageEmail",
    channel: "email",
    type: "transactional",
    messageType: "usage_guide",
    scheduledAt: "2026-04-24T11:05:00.000Z",
    sentAt: "2026-04-24T11:06:00.000Z",
    status: "sent",
    subject: "Marina, seu ritual BelaPop começa aqui",
    body: "Seu ritual chegou. Agora vamos te ajudar a usar da melhor forma.",
    ctaLabel: "Ver minha rotina",
    ctaHref: "/minha-rotina",
    dedupeKey: "cus-marina:ord-1001:postPurchaseUsageEmail"
  },
  {
    id: "msg-review-ord-1002",
    messageId: "lifecycle:cus-bianca:ord-1002:reviewRequestEmail",
    customerId: "cus-bianca",
    orderId: "ord-1002",
    orderItemId: "item-1002-a",
    templateId: "reviewRequestEmail",
    channel: "email",
    type: "marketing",
    messageType: "review_request",
    scheduledAt: "2026-04-30T09:00:00.000Z",
    status: "scheduled",
    subject: "Bianca, como foi sua experiência real?",
    body: "Queremos saber como foi sua experiência real com esse produto.",
    ctaLabel: "Avaliar produto",
    ctaHref: "/avaliar-produto?request=review-ord-1002-item-1002-a",
    dedupeKey: "cus-bianca:ord-1002:reviewRequestEmail"
  }
];

export const postPurchaseLifecycleMock = {
  customers: mockLifecycleCustomers,
  orders: mockLifecycleOrders,
  products: mockRecommendationCatalog,
  templates: mockLifecycleTemplates,
  events: mockLifecycleEvents,
  rules: mockLifecycleRules,
  recommendationRules,
  rebuyReminders: mockRebuyReminders,
  reviewRequests: mockReviewRequests,
  messages: mockPostPurchaseMessages,
  usageGuides: mockUsageGuides
};
