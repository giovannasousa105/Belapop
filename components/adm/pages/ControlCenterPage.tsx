import Link from "next/link";

import { AlertBanner } from "@/components/adm/AlertBanner";
import { AdminTable } from "@/components/adm/AdminTable";
import { InsightBlock } from "@/components/adm/InsightBlock";
import { MetricCard } from "@/components/adm/MetricCard";
import { PriorityList } from "@/components/adm/PriorityList";
import { StatusBadge } from "@/components/adm/StatusBadge";
import { getCurrentAdmUser } from "@/lib/adm/auth/current-user";
import { canAccessRoute, filterRouteItems } from "@/lib/adm/auth/guards";
import { formatCurrency } from "@/lib/adm/format";
import { overviewRepository } from "@/lib/adm/repositories";

export async function ControlCenterPage() {
  const metrics = await overviewRepository.getDashboardMetrics();
  const topCriticalOrders = await overviewRepository.listTopCriticalOrders(4);
  const priorities = await overviewRepository.listPriorityCards(4);
  const currentUser = await getCurrentAdmUser();
  const canVisit = (href: string) => (currentUser ? canAccessRoute(currentUser, href).allowed : false);

  const metricCards = [
    {
      label: "GMV Operacional",
      value: formatCurrency(metrics.gmv),
      delta: "Consolidado mock de pedidos ativos",
      href: canVisit("/adm/dashboard-executivo") ? "/adm/dashboard-executivo?period=30d" : undefined
    },
    {
      label: "Pedidos Criticos",
      value: String(metrics.criticalOrders),
      delta: "Drill-down para fila de intervencao",
      href: canVisit("/adm/operacao/pedidos-criticos")
        ? "/adm/operacao/pedidos-criticos?priority=critica"
        : undefined
    },
    {
      label: "Curadoria Pendente",
      value: String(metrics.pendingCuration),
      href: canVisit("/adm/curadoria/produtos")
        ? "/adm/curadoria/produtos?status=pendente"
        : undefined
    },
    {
      label: "Alertas Financeiros",
      value: String(metrics.openAlerts),
      href: canVisit("/adm/financeiro/auditoria")
        ? "/adm/financeiro/auditoria?status=critico"
        : undefined
    },
    {
      label: "Sellers em Risco",
      value: String(metrics.sellersAtRisk),
      href: canVisit("/adm/operacao/parceiros")
        ? "/adm/operacao/parceiros?priority=alta"
        : undefined
    },
    {
      label: "Documentos Pendentes",
      value: String(metrics.pendingDocuments),
      href: canVisit("/adm/curadoria/documentos")
        ? "/adm/curadoria/documentos?status=pendente"
        : undefined
    }
  ];

  const quickActions = currentUser
    ? filterRouteItems(currentUser, [
        { label: "Abrir Hub de Qualidade", href: "/adm/qualidade-catalogo" },
        { label: "Reembolsos pendentes", href: "/adm/financeiro/reembolsos?status=pendente" },
        { label: "Reputacao critica", href: "/adm/catalogo-marca/reviews?status=critico" }
      ])
    : [];

  return (
    <div className="space-y-6">
      <AlertBanner
        title="Fluxo conectado"
        description="Este hub centraliza operacao, curadoria, qualidade, financeiro e relacionamento com navegacao contextual entre modulos."
      />

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {metricCards.map((card) => (
          <MetricCard
            key={card.label}
            label={card.label}
            value={card.value}
            delta={card.delta}
            href={card.href}
          />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <AdminTable
            rows={topCriticalOrders}
            rowKey={(order) => order.id}
            columns={[
              {
                id: "pedido",
                label: "Pedido",
                render: (order) => (
                  <div>
                    <p className="font-semibold">{order.id}</p>
                    <p className="text-xs text-[#6f675e]">{order.createdAt.slice(0, 10)}</p>
                  </div>
                )
              },
              {
                id: "seller",
                label: "Seller",
                render: (order) => (
                  canVisit("/adm/operacao/parceiros") ? (
                    <Link
                      href={`/adm/operacao/parceiros?seller=${order.sellerId}`}
                      className="text-[#2f2a25] underline underline-offset-4"
                    >
                      {order.sellerName}
                    </Link>
                  ) : (
                    order.sellerName
                  )
                )
              },
              {
                id: "problema",
                label: "Problema",
                render: (order) => <StatusBadge status={order.status} />
              },
              {
                id: "acao",
                label: "Acao",
                className: "text-right",
                render: (order) => (
                  canVisit(`/adm/operacao/logistica/envios/${order.shipmentId}`) ? (
                    <Link
                      href={`/adm/operacao/logistica/envios/${order.shipmentId}?order=${order.id}`}
                      className="text-xs font-semibold uppercase tracking-[0.16em] underline underline-offset-4"
                    >
                      Abrir envio
                    </Link>
                  ) : (
                    <span className="text-xs uppercase tracking-[0.16em] text-[#756d63]">Sem acesso</span>
                  )
                )
              }
            ]}
          />
        </div>

        <div className="space-y-4 xl:col-span-5">
          <PriorityList items={priorities} />
          <InsightBlock
            title="Atalho de reputacao"
            value="Reviews negativas concentradas em Perfumaria"
            note="Acesse o modulo Reviews para abrir analise por seller e produto."
          />
          <div className="rounded-2xl border border-[#d5cfc3] bg-white p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#6e675f]">Acoes rapidas</p>
            {quickActions.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {quickActions.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-full border border-[#ccc5b8] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em]"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-[#6a6259]">
                Este perfil possui acesso somente aos modulos liberados no menu lateral.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
