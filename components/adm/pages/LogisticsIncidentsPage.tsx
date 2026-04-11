import Link from "next/link";
import { AlertTriangle, Filter, ShieldAlert, Users } from "lucide-react";

import { AdminFilters } from "@/components/adm/AdminFilters";
import { AdminPageHeader } from "@/components/adm/AdminPageHeader";
import { AdminTable } from "@/components/adm/AdminTable";
import { EmptyState } from "@/components/adm/EmptyState";
import { ErrorState, NoResultsState, PartialDataState } from "@/components/adm/DataStates";
import { StatusBadge } from "@/components/adm/StatusBadge";
import { getAdmDataSource } from "@/lib/adm/repositories/source";
import { logisticsRepository } from "@/lib/adm/repositories";
import {
  buildHref,
  hasActiveFilterParams,
  toListQueryParams,
  type AdmFilters,
  type SearchParamsInput
} from "@/lib/adm/url";

type LogisticsIncidentsPageProps = {
  filters: AdmFilters;
  searchParamsSource: SearchParamsInput;
};

const sortOptions = [
  { value: "openedAt", label: "Data de abertura" },
  { value: "priority", label: "Prioridade" },
  { value: "seller", label: "Seller" },
  { value: "status", label: "Status" }
];

const statusTabs = [
  { key: "pendente", label: "Aberto" },
  { key: "em-revisao", label: "Em resolucao" },
  { key: "resolvido", label: "Resolvido" }
];

export async function LogisticsIncidentsPage({
  filters,
  searchParamsSource
}: LogisticsIncidentsPageProps) {
  const query = toListQueryParams(searchParamsSource, {
    page: 1,
    pageSize: 10,
    sortBy: "openedAt",
    sortDir: "desc"
  });

  const listResult = await logisticsRepository.listIncidents(query);
  if (!listResult.success) {
    return (
      <ErrorState
        title="Falha ao carregar incidentes"
        description={listResult.error?.message ?? "Nao foi possivel carregar incidentes logisticos."}
      />
    );
  }

  const dataSource = await getAdmDataSource();
  const openCount = dataSource.logisticsIncidents.filter((incident) => incident.status !== "resolvido").length;
  const criticalCount = dataSource.logisticsIncidents.filter(
    (incident) => incident.priority === "critica"
  ).length;
  const resolutionRate = dataSource.logisticsIncidents.length
    ? (dataSource.logisticsIncidents.filter((incident) => incident.status === "resolvido").length /
        dataSource.logisticsIncidents.length) *
      100
    : 0;
  const showNoResults = listResult.data.items.length === 0 && hasActiveFilterParams(filters);

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Logistica / Incidentes"
        title="Incidentes logisticos"
        description="Monitoramento dos casos abertos com leitura premium, filtro funcional e destaque imediato para incidentes de alta prioridade."
        aside={
          <div className="flex items-center gap-3 rounded-full border border-[var(--adm-border)] bg-[var(--adm-surface)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--adm-text-soft)]">
            <Filter className="h-4 w-4" />
            <span>Operacao monitorada em tempo real</span>
          </div>
        }
      />

      <section className="flex flex-wrap gap-2 rounded-full border border-[var(--adm-border)] bg-[var(--adm-surface-muted)] p-1">
        {statusTabs.map((tab) => {
          const active = filters.status === tab.key || (!filters.status && tab.key === "pendente");

          return (
            <Link
              key={tab.key}
              href={buildHref("/adm/operacao/logistica/incidentes", searchParamsSource, {
                status: tab.key,
                page: undefined
              })}
              className={`inline-flex min-h-11 items-center justify-center rounded-full px-5 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                active
                  ? "bg-[var(--adm-surface)] text-[var(--adm-text)] shadow-[var(--adm-shadow-micro)]"
                  : "text-[var(--adm-text-soft)] hover:text-[var(--adm-text)]"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <article className="rounded-[var(--adm-radius)] border border-[var(--adm-border)] bg-[var(--adm-surface)] p-6 shadow-[var(--adm-shadow-micro)] xl:col-span-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--adm-text-soft)]">
            Taxa de resolucao
          </p>
          <p className="mt-3 font-editorial text-4xl text-[var(--adm-text)]">
            {resolutionRate.toFixed(0)}%
          </p>
          <p className="mt-3 text-sm leading-6 text-[var(--adm-text-muted)]">
            Aumento de 4.2% na ultima janela de operacao devido ao novo fluxo de escalonamento.
          </p>
        </article>
        <article className="rounded-[var(--adm-radius)] border border-[var(--adm-border)] bg-[var(--adm-surface-muted)] p-6 shadow-[var(--adm-shadow-micro)] xl:col-span-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <h3 className="font-editorial text-2xl italic text-[var(--adm-text)]">
                Monitoramento critico
              </h3>
              <p className="mt-2 text-sm leading-6 text-[var(--adm-text-muted)]">
                Existem atualmente {criticalCount} incidentes em prioridade maxima e {openCount} casos
                aguardando tratativa do time operacional.
              </p>
            </div>
            <Link
              href="/adm/operacao/logistica/incidentes?priority=critica"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--adm-text)] px-6 text-xs font-semibold uppercase tracking-[0.18em] text-white"
            >
              Verificar alertas
            </Link>
          </div>
        </article>
      </section>

      <AdminFilters
        searchPlaceholder="Buscar incidente por tipo, resumo ou shipment"
        options={{
          status: [
            { value: "pendente", label: "Aberto" },
            { value: "em-revisao", label: "Em resolucao" },
            { value: "resolvido", label: "Resolvido" }
          ],
          seller: dataSource.sellers.map((seller) => ({ value: seller.id, label: seller.name })),
          priority: [
            { value: "critica", label: "Critica" },
            { value: "alta", label: "Alta" },
            { value: "media", label: "Media" },
            { value: "baixa", label: "Baixa" }
          ],
          period: [
            { value: "7d", label: "7 dias" },
            { value: "30d", label: "30 dias" },
            { value: "90d", label: "90 dias" }
          ]
        }}
        sorting={{ options: sortOptions }}
        pagination={listResult.data.meta}
        showDateRange
      />

      {listResult.partial ? <PartialDataState /> : null}

      {showNoResults ? (
        <NoResultsState
          title="Sem incidentes para os filtros ativos"
          description="Ajuste status, prioridade, seller ou busca para localizar incidentes."
          actionHref="/adm/operacao/logistica/incidentes"
          actionLabel="Limpar filtros"
        />
      ) : listResult.data.items.length === 0 ? (
        <EmptyState
          title="Sem incidentes no recorte atual"
          description="O fluxo logistico esta estabilizado para os filtros aplicados."
        />
      ) : (
        <>
          <AdminTable
            rows={listResult.data.items}
            rowKey={(incident) => incident.id}
            rowClassName={(incident) =>
              incident.priority === "critica"
                ? "border-l-2 border-l-[var(--adm-tertiary)]"
                : incident.priority === "alta"
                  ? "border-l-2 border-l-[var(--adm-secondary)]"
                  : undefined
            }
            columns={[
              {
                id: "pedido",
                label: "Pedido",
                render: (incident) => (
                  <span className="font-editorial text-lg text-[var(--adm-text)]">{incident.orderId}</span>
                )
              },
              {
                id: "seller",
                label: "Seller",
                render: (incident) => (
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--adm-surface-muted)] text-[10px] font-semibold uppercase text-[var(--adm-text)]">
                      {incident.sellerName
                        .split(" ")
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join("")}
                    </span>
                    <span className="text-sm font-medium text-[var(--adm-text)]">{incident.sellerName}</span>
                  </div>
                )
              },
              {
                id: "problema",
                label: "Tipo de problema",
                render: (incident) => (
                  <span className="text-sm text-[var(--adm-text-muted)]">{incident.type}</span>
                )
              },
              {
                id: "status",
                label: "Status",
                render: (incident) => <StatusBadge status={incident.status} />
              },
              {
                id: "prioridade",
                label: "Prioridade",
                render: (incident) => (
                  <div className="flex items-center gap-2">
                    <AlertTriangle
                      className={`h-4 w-4 ${
                        incident.priority === "critica"
                          ? "text-[var(--adm-tertiary)]"
                          : incident.priority === "alta"
                            ? "text-[var(--adm-secondary)]"
                            : "text-[var(--adm-text-soft)]"
                      }`}
                    />
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--adm-text)]">
                      {incident.priority}
                    </span>
                  </div>
                )
              },
              {
                id: "data",
                label: "Data",
                render: (incident) => (
                  <span className="text-sm text-[var(--adm-text-soft)]">{incident.openedAt}</span>
                )
              },
              {
                id: "acoes",
                label: "Acoes",
                className: "text-right",
                render: (incident) => (
                  <div className="flex justify-end gap-3 text-[11px] font-semibold uppercase tracking-[0.16em]">
                    <Link
                      href={`/adm/operacao/logistica/envios/${incident.shipmentId}?shipment=${incident.shipmentId}`}
                      className="text-[var(--adm-text)] underline underline-offset-4"
                    >
                      Detalhe envio
                    </Link>
                    <Link
                      href={
                        incident.refundId
                          ? `/adm/financeiro/reembolsos?refund=${incident.refundId}`
                          : `/adm/financeiro/reembolsos?order=${incident.orderId}`
                      }
                      className="text-[var(--adm-text-soft)] underline underline-offset-4"
                    >
                      Reembolso
                    </Link>
                  </div>
                )
              }
            ]}
          />

          <div className="text-center">
            <p className="font-editorial text-lg italic text-[var(--adm-text-soft)]/70">
              Compromisso com a excelencia em cada entrega.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
