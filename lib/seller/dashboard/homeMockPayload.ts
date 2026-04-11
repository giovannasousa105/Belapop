export type DashboardHomeFilterInput = {
  period?: string | null;
  compare?: string | null;
  channel?: string | null;
  state?: string | null;
  city?: string | null;
  category_id?: string | null;
};

type DashboardHomePayload = Record<string, unknown>;

const BASE_PAYLOAD: DashboardHomePayload = {
  updated_at: "2026-03-03T10:18:22-03:00",
  filters_applied: {
    period: "MTD",
    compare: "previous_period",
    channel: "all",
    state: "SP",
    city: "Sao Paulo",
    category_id: null
  },
  cards: [
    {
      key: "sla_today",
      title: "SLA Hoje",
      value: 96.2,
      unit: "%",
      delta: 1.3,
      subtitle: "Pedidos postados dentro do prazo",
      cta_label: "Ver excecoes",
      cta_link: "/orders?filter=sla_due"
    },
    {
      key: "orders_due_24h",
      title: "Vencendo em 24h",
      value: 12,
      unit: "pedidos",
      delta: -2,
      subtitle: "Ainda nao postados",
      cta_label: "Despachar agora",
      cta_link: "/orders?filter=sla_due"
    },
    {
      key: "tracking_missing",
      title: "Tracking pendente",
      value: 8,
      unit: "pedidos",
      delta: 3,
      subtitle: "Postados sem rastreio registrado",
      cta_label: "Adicionar rastreio",
      cta_link: "/orders?filter=tracking_missing"
    },
    {
      key: "gmv",
      title: "GMV",
      value: 128540.0,
      unit: "BRL",
      delta: 8.1,
      subtitle: "Pedidos pagos no periodo",
      cta_label: "Detalhar",
      cta_link: "/reports/sales?metric=gmv"
    },
    {
      key: "net_revenue",
      title: "Receita liquida",
      value: 103220.0,
      unit: "BRL",
      delta: 6.0,
      subtitle: "GMV - taxas - cupons - reembolsos",
      cta_label: "Conciliacao",
      cta_link: "/finance/reconciliation"
    },
    {
      key: "checkout_conversion",
      title: "Conversao (checkout)",
      value: 1.92,
      unit: "%",
      delta: -0.12,
      subtitle: "Sessions -> pedidos pagos",
      cta_label: "Ver funil",
      cta_link: "/analytics/funnel"
    },
    {
      key: "cancel_rupture_rate",
      title: "Cancel. por ruptura",
      value: 1.8,
      unit: "%",
      delta: -0.2,
      subtitle: "Falta de estoque",
      cta_label: "Ver motivos",
      cta_link: "/orders?filter=cancel_stockout"
    },
    {
      key: "expiration_critical",
      title: "Validade critica",
      value: 3,
      unit: "lotes",
      delta: 1,
      subtitle: "Lotes com <30 dias",
      cta_label: "Criar queima",
      cta_link: "/inventory/lots?filter=exp_lt_30"
    }
  ],
  time_series: {
    granularity: "day",
    range_days: 30,
    series: [
      {
        name: "gmv",
        unit: "BRL",
        points: [
          { t: "2026-02-02", v: 3120.0 },
          { t: "2026-02-03", v: 4015.0 },
          { t: "2026-02-04", v: 2890.0 },
          { t: "2026-02-05", v: 5330.0 },
          { t: "2026-02-06", v: 4780.0 },
          { t: "2026-02-07", v: 3910.0 },
          { t: "2026-02-08", v: 2505.0 }
        ]
      },
      {
        name: "paid_orders",
        unit: "orders",
        points: [
          { t: "2026-02-02", v: 24 },
          { t: "2026-02-03", v: 31 },
          { t: "2026-02-04", v: 21 },
          { t: "2026-02-05", v: 37 },
          { t: "2026-02-06", v: 35 },
          { t: "2026-02-07", v: 29 },
          { t: "2026-02-08", v: 18 }
        ]
      }
    ],
    compare_to_previous_period: {
      gmv_delta_percent: 8.1,
      paid_orders_delta_percent: 5.4
    }
  },
  funnel: {
    window_days: 30,
    model: "last_click_by_channel",
    steps: [
      { name: "sessions", count: 154200, rate_from_prev: 1.0 },
      { name: "pdp_views", count: 61200, rate_from_prev: 0.397 },
      { name: "add_to_cart", count: 10340, rate_from_prev: 0.169 },
      { name: "checkout_started", count: 6390, rate_from_prev: 0.618 },
      { name: "payment_approved", count: 2960, rate_from_prev: 0.463 }
    ],
    drop_off_insights: [
      {
        stage: "add_to_cart_to_checkout_started",
        drop_percent: 38.2,
        top_causes: [
          { cause: "frete_alto", confidence: "high" },
          { cause: "prazo_longo", confidence: "medium" }
        ],
        recommended_actions: [
          {
            label: "Simular frete e comparar concorrencia interna",
            href: "/pricing/shipping"
          },
          {
            label: "Criar cupom frete/kit",
            href: "/campaigns/new?template=frete"
          }
        ]
      }
    ]
  },
  attention_now: [
    {
      id: "att_001",
      severity: "critical",
      title: "5 pedidos vencem em 2h",
      message: "Priorize separacao e postagem para evitar impacto no ranking.",
      impact_amount: 1240.0,
      impact_orders: 5,
      primary_action: { label: "Resolver agora", href: "/orders?filter=sla_due" },
      secondary_action: { label: "Criar regra", href: "/alert-rules/new?type=sla_due" }
    },
    {
      id: "att_002",
      severity: "warning",
      title: "Tracking parado ha 4 dias",
      message: "3 pedidos com risco de devolucao e chargeback.",
      impact_amount: 690.0,
      impact_orders: 3,
      primary_action: { label: "Abrir excecoes", href: "/orders?filter=tracking_stalled" },
      secondary_action: {
        label: "Notificar transportadora",
        href: "/support/templates?carrier=jadlog"
      }
    },
    {
      id: "att_003",
      severity: "warning",
      title: "Lote com validade < 30 dias",
      message: "Risco de perda estimada R$ 420. Sugestao: queima inteligente.",
      impact_amount: 420.0,
      impact_orders: 0,
      primary_action: { label: "Criar queima", href: "/lots/queima?filter=exp_lt_30" },
      secondary_action: { label: "Pausar Ads do SKU", href: "/campaigns?filter=sku_ads" }
    }
  ],
  exceptions: {
    rows: [
      {
        order_id: "9d7b9f1a-3acb-4e7c-9d56-0b2c0cf3c9b1",
        status: "paid",
        operational_status: "separando",
        sla_status: "late",
        sla_due_at: "2026-03-03T08:00:00-03:00",
        total_amount: 189.9,
        carrier: null,
        tracking_code: null,
        created_at: "2026-03-02T15:22:10-03:00"
      },
      {
        order_id: "d41e2b0a-3f1c-4a31-98f0-4e7b3bbf9f21",
        status: "paid",
        operational_status: "pronto_envio",
        sla_status: "due_today",
        sla_due_at: "2026-03-03T14:00:00-03:00",
        total_amount: 79.9,
        carrier: "Correios",
        tracking_code: "",
        created_at: "2026-03-03T09:12:03-03:00"
      }
    ]
  },
  risk_skus: {
    rows: [
      {
        sku: "S123",
        product_title: "Mascara Reconstrutora 250g",
        days_coverage: 4.1,
        min_expiration_days: 45,
        recommended_action: "repor"
      },
      {
        sku: "S991",
        product_title: "Serum Vitamina C 30ml",
        days_coverage: 2.3,
        min_expiration_days: 20,
        recommended_action: "queima"
      }
    ]
  },
  carriers: [
    {
      carrier: "Correios",
      avg_delivery_days: 5.6,
      late_rate: 0.12,
      volume_orders: 418
    },
    {
      carrier: "Jadlog",
      avg_delivery_days: 4.2,
      late_rate: 0.08,
      volume_orders: 301
    }
  ],
  finance: {
    balance_to_receive: 12340.0,
    next_payout_date: "2026-03-07",
    has_disputes: true,
    disputes_count: 1
  },
  links: {
    dashboard: "/dashboard/home",
    orders_exceptions: "/orders?filter=exceptions",
    inventory_lots: "/inventory/lots",
    finance_reconciliation: "/finance/reconciliation"
  }
};

export const buildDashboardHomeMockResponse = (filters: DashboardHomeFilterInput = {}) => {
  const payload = structuredClone(BASE_PAYLOAD) as DashboardHomePayload;
  payload.updated_at = new Date().toISOString();
  payload.filters_applied = {
    period: filters.period ?? "MTD",
    compare: filters.compare ?? "previous_period",
    channel: filters.channel ?? "all",
    state: filters.state ?? "SP",
    city: filters.city ?? "Sao Paulo",
    category_id: filters.category_id ?? null
  };
  return payload;
};
