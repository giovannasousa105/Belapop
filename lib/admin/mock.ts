import type { ChartPoint } from "@/components/admin/charts/placeholder-chart";
import type { PerfPoint } from "@/components/admin/charts/performance-chart";

type DashboardKpi = {
  key: string;
  label: string;
  value: string;
  delta: string;
  hint: string;
  trend: "up" | "down" | "neutral";
  sparkline: number[];
};

type PriorityItem = {
  id: string;
  title: string;
  meta: string;
  severity: "high" | "medium" | "low";
  primaryActionLabel: string;
  primaryActionHref: string;
  secondaryActionLabel: string;
  secondaryActionHref: string;
};

type OpsQueueItem = {
  id: string;
  area: string;
  count: number;
  sla: string;
  href: string;
};

type HealthItem = {
  key: string;
  label: string;
  value: string;
  delta?: string;
};

type SimpleMetric = {
  label: string;
  value: string;
};

export type AdminDashboardViewModel = {
  updatedAtLabel: string;
  kpis: DashboardKpi[];
  performanceSeries: PerfPoint[];
  priorities: PriorityItem[];
  opsQueue: OpsQueueItem[];
  health: HealthItem[];
  commercial: {
    payments: SimpleMetric[];
    catalog: SimpleMetric[];
    carts: SimpleMetric[];
  };
  statusPoints: ChartPoint[];
  funnelPoints: ChartPoint[];
};

export const mockDashboard: AdminDashboardViewModel = {
  updatedAtLabel: "agora",
  kpis: [
    {
      key: "gmv",
      label: "GMV",
      value: "R$ 0,00",
      delta: "+0,0% vs periodo anterior",
      hint: "Soma dos pedidos pagos no periodo selecionado.",
      trend: "up",
      sparkline: [2, 3, 4, 4, 5, 4, 6]
    },
    {
      key: "revenue",
      label: "Receita (take rate)",
      value: "R$ 0,00",
      delta: "+0,0% vs periodo anterior",
      hint: "Estimativa de receita por comissao do marketplace.",
      trend: "up",
      sparkline: [1, 2, 3, 3, 4, 4, 5]
    },
    {
      key: "orders",
      label: "Pedidos",
      value: "0",
      delta: "+0,0% vs periodo anterior",
      hint: "Quantidade de pedidos criados no periodo.",
      trend: "up",
      sparkline: [1, 2, 2, 3, 2, 3, 4]
    },
    {
      key: "aov",
      label: "Ticket medio",
      value: "R$ 0,00",
      delta: "+0,0% vs periodo anterior",
      hint: "GMV dividido pelo total de pedidos pagos.",
      trend: "up",
      sparkline: [3, 3, 4, 3, 4, 4, 5]
    },
    {
      key: "conversion",
      label: "Conversao",
      value: "0,00%",
      delta: "+0,0% vs periodo anterior",
      hint: "Pagos sobre total de visitas no funil.",
      trend: "up",
      sparkline: [1, 1, 2, 2, 2, 3, 3]
    },
    {
      key: "sre_maturity",
      label: "Maturidade SRE",
      value: "0%",
      delta: "Cobertura 0% | 0 incidentes criticos",
      hint: "Combina cobertura de plantao, incidentes criticos e error budget.",
      trend: "neutral",
      sparkline: [0, 0, 0, 0, 0, 0, 0]
    },
    {
      key: "risk_control",
      label: "Controle de risco",
      value: "0%",
      delta: "0 sellers alto risco | holdback R$ 0,00",
      hint: "Resume risco antifraude, reconciliacao e holdbacks.",
      trend: "neutral",
      sparkline: [0, 0, 0, 0, 0, 0, 0]
    },
    {
      key: "cancel",
      label: "Cancelamento",
      value: "0,00%",
      delta: "0,0 p.p. vs periodo anterior",
      hint: "Pedidos cancelados sobre o total de pedidos.",
      trend: "neutral",
      sparkline: [2, 2, 2, 2, 2, 2, 2]
    }
  ],
  performanceSeries: [
    { ts: 1, label: "08:00", gmv: 0, orders: 0, cancelRate: 0 },
    { ts: 2, label: "10:00", gmv: 0, orders: 0, cancelRate: 0 },
    { ts: 3, label: "12:00", gmv: 0, orders: 0, cancelRate: 0 },
    { ts: 4, label: "14:00", gmv: 0, orders: 0, cancelRate: 0 },
    { ts: 5, label: "16:00", gmv: 0, orders: 0, cancelRate: 0 },
    { ts: 6, label: "18:00", gmv: 0, orders: 0, cancelRate: 0 },
    { ts: 7, label: "20:00", gmv: 0, orders: 0, cancelRate: 0 }
  ],
  priorities: [
    {
      id: "prio-pagamentos",
      title: "Pagamentos falhos",
      meta: "0 ocorrencias nas ultimas 24h.",
      severity: "low",
      primaryActionLabel: "Ver detalhes",
      primaryActionHref: "/admin/finance",
      secondaryActionLabel: "Abrir fila",
      secondaryActionHref: "/admin/orders"
    }
  ],
  opsQueue: [
    { id: "queue-payments", area: "Pagamentos e risco", count: 0, sla: "2h", href: "/admin/finance" },
    { id: "queue-logistics", area: "Logistica e frete", count: 0, sla: "6h", href: "/admin/orders" },
    { id: "queue-catalog", area: "Catalogo e estoque", count: 0, sla: "24h", href: "/admin/products" },
    { id: "queue-support", area: "Atendimento", count: 0, sla: "1h", href: "/admin/support" }
  ],
  health: [
    { key: "stores_active", label: "Lojas ativas", value: "0" },
    { key: "stores_pending", label: "Lojas pendentes", value: "0" },
    { key: "support_sla", label: "SLA suporte", value: "0 min" },
    { key: "reputation", label: "Reputacao media", value: "0,0/5" }
  ],
  commercial: {
    payments: [
      { label: "Pagamentos falhos", value: "0" },
      { label: "Chargebacks (30d)", value: "0" },
      { label: "Taxa de aprovacao", value: "0,0%" }
    ],
    catalog: [
      { label: "Produtos publicados", value: "0" },
      { label: "Sem estoque", value: "0" },
      { label: "Em revisao", value: "0" }
    ],
    carts: [
      { label: "Carrinhos ativos", value: "0" },
      { label: "Abandonados", value: "0" },
      { label: "Recuperacao", value: "0,0%" }
    ]
  },
  statusPoints: [
    { label: "Pago", value: 0 },
    { label: "Processando", value: 0 },
    { label: "Enviado", value: 0 },
    { label: "Entregue", value: 0 }
  ],
  funnelPoints: [
    { label: "Visitas", value: 0 },
    { label: "Add carrinho", value: 0 },
    { label: "Checkout", value: 0 },
    { label: "Pagos", value: 0 }
  ]
};
