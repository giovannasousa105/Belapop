import { ExecutiveDashboardPage } from "@/components/adm/pages/ExecutiveDashboardPage";
import { formatCurrency } from "@/lib/adm/format";
import { overviewRepository } from "@/lib/adm/repositories";
import { getAdmDataSource } from "@/lib/adm/repositories/source";
import { resolveAdmListRoute, type AdmListRouteProps } from "@/lib/adm/route";

const ALERT_REFERENCE_TIME = new Date("2026-04-10T12:00:00-03:00").getTime();

const formatAlertTime = (value: string) => {
  const timestamp = new Date(value).getTime();
  const diffHours = Math.max(0, Math.floor((ALERT_REFERENCE_TIME - timestamp) / (1000 * 60 * 60)));

  if (diffHours < 24) {
    return new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(value));
  }

  if (diffHours < 48) {
    return "Ontem";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit"
  }).format(new Date(value));
};

export default async function AdmExecutiveDashboardRoute({ searchParams }: AdmListRouteProps) {
  const { filters } = await resolveAdmListRoute(searchParams);
  const [summary, metrics, data] = await Promise.all([
    overviewRepository.getExecutiveSummary(),
    overviewRepository.getDashboardMetrics(),
    getAdmDataSource()
  ]);

  const pendingSellers = data.sellers.filter(
    (seller) => seller.pendingDocuments > 0 || seller.status === "em-revisao" || seller.status === "alerta"
  ).length;
  const approvalRate =
    (data.products.filter((product) =>
      product.curationStatus === "aprovado" || product.curationStatus === "destaque"
    ).length /
      Math.max(data.products.length, 1)) *
    100;
  const atRiskOrders = data.orders.filter(
    (order) =>
      order.priority === "critica" || order.logisticsStatus === "critico" || order.logisticsStatus === "alerta"
  ).length;
  const sellerRiskRatio = (metrics.sellersAtRisk / Math.max(summary.activeSellers, 1)) * 100;

  const sellerMap = new Map(data.sellers.map((seller) => [seller.id, seller]));

  const summaryCards = [
    {
      label: "GMV MENSAL",
      value: formatCurrency(summary.gmv),
      detail: `${data.orders.length} pedidos monitorados`,
      tone: "positive" as const
    },
    {
      label: "PEDIDOS DIÁRIOS",
      value: String(data.orders.length),
      detail: `${summary.criticalIncidents} casos em observação`,
      tone: "neutral" as const
    },
    {
      label: "SELLERS ATIVOS",
      value: String(summary.activeSellers),
      detail: `${data.sellers.filter((seller) => seller.tier === "premium").length} premium`,
      tone: "positive" as const
    },
    {
      label: "SKUS ATIVOS",
      value: String(data.products.filter((product) => product.status !== "bloqueado").length),
      detail: `${data.products.filter((product) => product.featured).length} em destaque`,
      tone: "muted" as const
    }
  ];

  const operationCards = [
    {
      label: "Curadoria Pendente",
      value: `${metrics.pendingCuration} itens`,
      iconKey: "wand2" as const
    },
    {
      label: "Sellers Pendentes",
      value: `${pendingSellers} contas`,
      iconKey: "user-plus" as const
    },
    {
      label: "Taxa de Aprovação",
      value: `${approvalRate.toFixed(1)}%`,
      iconKey: "badge-check" as const
    },
    {
      label: "Pedidos em Risco",
      value: `${atRiskOrders} críticos`,
      iconKey: "alert-triangle" as const,
      accent: "danger" as const
    }
  ];

  const alertItems = [
    ...data.logisticsIncidents.map((incident) => ({
      sortTime: incident.openedAt,
      title: incident.type,
      description: incident.summary,
      time: formatAlertTime(incident.openedAt),
      iconKey: "truck" as const,
      tone: incident.priority === "critica" ? ("danger" as const) : ("neutral" as const)
    })),
    ...data.financialAlerts.map((alert) => ({
      sortTime: alert.createdAt,
      title: alert.type,
      description: alert.summary,
      time: formatAlertTime(alert.createdAt),
      iconKey: "wallet" as const,
      tone: alert.priority === "critica" ? ("danger" as const) : ("neutral" as const)
    })),
    ...data.refunds.map((refund) => ({
      sortTime: refund.requestedAt,
      title: "Reembolso em análise",
      description: `${sellerMap.get(refund.sellerId)?.name ?? "Seller"} • ${refund.reason}`,
      time: formatAlertTime(refund.requestedAt),
      iconKey: "undo2" as const,
      tone: refund.status === "pendente" ? ("danger" as const) : ("neutral" as const)
    })),
    ...data.documents
      .filter((document) => document.status !== "aprovado")
      .map((document) => ({
        sortTime: `${document.dueDate}T09:00:00Z`,
        title: document.type,
        description: `${sellerMap.get(document.sellerId)?.name ?? "Seller"} com vencimento em ${document.dueDate}`,
        time: formatAlertTime(`${document.dueDate}T09:00:00Z`),
        iconKey: "shield-alert" as const,
        tone: document.status === "bloqueado" ? ("danger" as const) : ("neutral" as const)
      }))
  ]
    .sort((left, right) => new Date(right.sortTime).getTime() - new Date(left.sortTime).getTime())
    .slice(0, 4)
    .map(({ sortTime: _sortTime, ...item }) => item);

  const insightCards = [
    {
      label: "Ticket Médio",
      value: formatCurrency(summary.avgTicket),
      detail: `${data.orders.length} pedidos`,
      detailTone: "positive" as const
    },
    {
      label: "Churn de Sellers",
      value: `${sellerRiskRatio.toFixed(1)}%`,
      detail: `${metrics.sellersAtRisk} em risco`,
      detailTone: metrics.sellersAtRisk > 0 ? ("danger" as const) : ("positive" as const)
    }
  ];

  void filters;

  return (
    <ExecutiveDashboardPage
      summaryCards={summaryCards}
      operationCards={operationCards}
      alerts={alertItems}
      insightCards={insightCards}
    />
  );
}
