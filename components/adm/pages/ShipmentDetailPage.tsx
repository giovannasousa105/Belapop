import Link from "next/link";
import {
  ArrowRight,
  Copy,
  Package,
  ShieldAlert,
  Star,
  Ticket,
  Truck,
  Undo2,
  Users
} from "lucide-react";

import { AdminActionPanel } from "@/components/adm/AdminActionPanel";
import { AlertBanner } from "@/components/adm/AlertBanner";
import { PermissionGate } from "@/components/adm/auth/PermissionGate";
import { ErrorState, PartialDataState } from "@/components/adm/DataStates";
import { getCurrentAdmUser } from "@/lib/adm/auth/current-user";
import { filterPermissionedActions } from "@/lib/adm/auth/guards";
import { formatCurrency, formatDateTime } from "@/lib/adm/format";
import { logisticsRepository } from "@/lib/adm/repositories";
import { getAdmDataSource } from "@/lib/adm/repositories/source";

type ShipmentDetailPageProps = {
  shipmentId: string;
};

export async function ShipmentDetailPage({ shipmentId }: ShipmentDetailPageProps) {
  const result = await logisticsRepository.getShipmentById(shipmentId);
  const currentUser = await getCurrentAdmUser();

  if (!result.success) {
    return (
      <ErrorState
        title="Falha ao carregar detalhe do envio"
        description={result.error?.message ?? "Nao foi possivel carregar este envio."}
      />
    );
  }

  if (!result.data) {
    return (
      <AlertBanner
        tone="critical"
        title="Envio nao encontrado"
        description="Verifique o identificador e retorne para a central logistica."
        actionLabel="Voltar para logistica"
        actionHref="/adm/operacao/logistica"
      />
    );
  }

  const { shipment, order, productName, customerName, sellerName, incident, refund } = result.data;
  const dataSource = await getAdmDataSource();
  const seller = dataSource.sellers.find((entry) => entry.id === shipment.sellerId) ?? null;
  const customer = order
    ? dataSource.customers.find((entry) => entry.id === order.customerId) ?? null
    : null;
  const shipmentActions =
    currentUser
      ? filterPermissionedActions(currentUser, [
          {
            label: "Marcar em revisao",
            request: {
              type: "shipment.update-status" as const,
              entityId: shipment.id,
              payload: { status: "em-revisao" as const }
            },
            requiredPermissions: ["manage_logistics"]
          },
          {
            label: "Marcar resolvido",
            request: {
              type: "shipment.update-status" as const,
              entityId: shipment.id,
              payload: { status: "resolvido" as const }
            },
            requiredPermissions: ["manage_logistics"]
          },
          {
            label: "Registrar incidente",
            tone: "danger" as const,
            request: {
              type: "incident.register" as const,
              entityId: shipment.id
            },
            requiredPermissions: ["manage_logistics"]
          }
        ])
      : [];

  const timeline = [
    {
      id: "pedido",
      label: "Pedido criado",
      title: "Processamento inicial concluido pelo fluxo BelaPop.",
      timestamp: order ? formatDateTime(order.createdAt) : undefined,
      tone: "done" as const
    },
    {
      id: "preparo",
      label: "Preparado",
      title: sellerName
        ? `${sellerName} concluiu a preparacao premium do pacote.`
        : "Preparacao premium concluida no seller responsavel.",
      timestamp: order ? formatDateTime(order.createdAt) : undefined,
      tone: "done" as const
    },
    {
      id: "envio",
      label: "Enviado",
      title: `Coleta realizada pela ${shipment.carrier}.`,
      timestamp: formatDateTime(shipment.lastUpdateAt),
      tone: incident ? "active" : "done"
    },
    {
      id: "transito",
      label: incident ? "Em transito (atrasado)" : "Em transito",
      title: incident?.summary ?? "Rota em acompanhamento pelo modulo logistico.",
      timestamp: formatDateTime(shipment.lastUpdateAt),
      tone: incident ? "alert" : "active"
    },
    {
      id: "entrega",
      label: "Prazo limite",
      title: `Entrega prevista para ${shipment.eta.slice(0, 10)}.`,
      timestamp: shipment.eta.slice(0, 10),
      tone: "pending" as const
    }
  ];

  return (
    <div className="space-y-6">
      {result.partial ? <PartialDataState /> : null}

      <section className="rounded-[var(--adm-radius)] border border-[var(--adm-border)] bg-[var(--adm-surface)] p-6 shadow-[var(--adm-shadow-soft)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--adm-text-soft)]">
              Logistica / Detalhe do envio
            </p>
            <h2 className="mt-3 font-editorial text-4xl tracking-[-0.05em] text-[var(--adm-text)]">
              {shipment.id}
            </h2>
            <div className="mt-3 flex items-center gap-3">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  incident ? "bg-[var(--adm-tertiary)]" : "bg-[var(--adm-primary)]"
                }`}
              />
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--adm-text-soft)]">
                {incident ? "Status: atraso detectado" : "Status: fluxo monitorado"}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="inline-flex min-h-11 items-center gap-3 rounded-full border border-[var(--adm-border)] bg-[var(--adm-surface-muted)] px-4 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--adm-text)]">
              <Truck className="h-4 w-4" />
              {shipment.carrier}
            </div>
            <div className="inline-flex min-h-11 items-center gap-3 rounded-full border border-[var(--adm-border)] bg-[var(--adm-surface-muted)] px-4 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--adm-text)]">
              <Package className="h-4 w-4" />
              {shipment.status}
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <article className="space-y-6 rounded-[var(--adm-radius)] border border-[var(--adm-border)] bg-[var(--adm-surface)] p-6 shadow-[var(--adm-shadow-micro)] xl:col-span-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--adm-text-soft)]">
                Dados da cliente
              </p>
              <p className="mt-3 font-editorial text-2xl text-[var(--adm-text)]">
                {customerName ?? "Cliente premium"}
              </p>
              <div className="mt-3 space-y-2 text-sm text-[var(--adm-text-muted)]">
                <p>Segmento: {customer?.segment ?? "premium"}</p>
                <p>LTV: {customer ? formatCurrency(customer.ltv) : "Nao informado"}</p>
                <p>Tickets em aberto: {customer?.openTickets ?? 0}</p>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--adm-text-soft)]">
                Seller responsavel
              </p>
              <div className="mt-3 flex items-start gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--adm-surface-muted)] text-sm font-semibold uppercase text-[var(--adm-text)]">
                  {sellerName
                    ?.split(" ")
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join("") ?? "BP"}
                </span>
                <div>
                  <p className="font-editorial text-2xl text-[var(--adm-text)]">{sellerName ?? "Seller"}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-[var(--adm-text-muted)]">
                    <Star className="h-3.5 w-3.5 fill-current text-[var(--adm-text)]" />
                    <span>Score {seller?.qualityScore ?? "--"}</span>
                  </div>
                  <p className="mt-2 text-sm text-[var(--adm-text-muted)]">
                    Risco {seller?.riskLevel ?? "--"} • {seller?.category ?? "Marketplace premium"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-[var(--adm-border)] pt-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--adm-text-soft)]">
              Itens do pedido
            </p>
            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between gap-4 rounded-[20px] bg-[var(--adm-surface-muted)] p-4">
                <div className="flex items-center gap-4">
                  <span className="flex h-16 w-16 items-center justify-center rounded-[18px] bg-white text-[var(--adm-text-soft)]">
                    <Package className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[var(--adm-text)]">{productName ?? "Item premium"}</p>
                    <p className="text-xs text-[var(--adm-text-muted)]">
                      Pedido {order?.id ?? "--"} • Status {order?.status ?? shipment.status}
                    </p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-[var(--adm-text)]">
                  {order ? formatCurrency(order.total) : "--"}
                </p>
              </div>
            </div>
          </div>
        </article>

        <div className="space-y-4 xl:col-span-4">
          <article
            className={`rounded-[var(--adm-radius)] border p-6 shadow-[var(--adm-shadow-micro)] ${
              incident
                ? "border-[rgba(162,61,62,0.24)] bg-[rgba(162,61,62,0.06)]"
                : "border-[var(--adm-border)] bg-[var(--adm-surface)]"
            }`}
          >
            <div className="flex items-start gap-3">
              <ShieldAlert className={`mt-0.5 h-5 w-5 ${incident ? "text-[var(--adm-tertiary)]" : "text-[var(--adm-primary)]"}`} />
              <div>
                <p className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${incident ? "text-[var(--adm-tertiary)]" : "text-[var(--adm-text-soft)]"}`}>
                  {incident ? "Alerta critico" : "Fluxo acompanhado"}
                </p>
                <p className="mt-2 font-editorial text-2xl text-[var(--adm-text)]">
                  {incident ? "Atraso detectado" : "Sem bloqueios relevantes"}
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--adm-text-muted)]">
                  {incident?.summary ??
                    "O envio segue monitorado com o historico centralizado para intervencoes rapidas."}
                </p>
              </div>
            </div>
            {incident ? (
              <Link
                href={`/adm/operacao/logistica/incidentes?shipment=${shipment.id}`}
                className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--adm-tertiary)] px-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white"
              >
                Priorizar resolucao
              </Link>
            ) : null}
          </article>

          <article className="rounded-[var(--adm-radius)] border border-[var(--adm-border)] bg-[var(--adm-surface)] p-6 shadow-[var(--adm-shadow-micro)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--adm-text-soft)]">
              Acoes rapidas
            </p>
            <div className="mt-4 space-y-3">
              <PermissionGate route="/adm/operacao/logistica/incidentes">
                <Link
                  href={`/adm/operacao/logistica/incidentes?shipment=${shipment.id}`}
                  className="flex items-center justify-between rounded-[18px] bg-[var(--adm-surface-muted)] px-4 py-4 text-sm text-[var(--adm-text)] transition hover:bg-[var(--adm-surface-soft)]"
                >
                  <span>Notificar seller</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </PermissionGate>
              <Link
                href={`/adm/operacao/logistica/envios/${shipment.id}`}
                className="flex items-center justify-between rounded-[18px] bg-[var(--adm-surface-muted)] px-4 py-4 text-sm text-[var(--adm-text)] transition hover:bg-[var(--adm-surface-soft)]"
              >
                <span>Atualizar status</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <PermissionGate route="/adm/operacao/logistica/incidentes">
                <Link
                  href={`/adm/operacao/logistica/incidentes?shipment=${shipment.id}`}
                  className="flex items-center justify-between rounded-[18px] bg-[var(--adm-surface-muted)] px-4 py-4 text-sm text-[var(--adm-text)] transition hover:bg-[var(--adm-surface-soft)]"
                >
                  <span>Registrar incidente</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </PermissionGate>
              {refund ? (
                <PermissionGate route="/adm/financeiro/reembolsos">
                  <Link
                    href={`/adm/financeiro/reembolsos?refund=${refund.id}`}
                    className="flex items-center justify-between rounded-[18px] bg-[rgba(162,61,62,0.08)] px-4 py-4 text-sm text-[var(--adm-tertiary)] transition hover:bg-[rgba(162,61,62,0.12)]"
                  >
                    <span>Iniciar reembolso</span>
                    <Undo2 className="h-4 w-4" />
                  </Link>
                </PermissionGate>
              ) : null}
            </div>
          </article>

          {shipmentActions.length > 0 ? (
            <AdminActionPanel title="Acoes logisticas" actions={shipmentActions} />
          ) : null}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <article className="rounded-[var(--adm-radius)] border border-[var(--adm-border)] bg-[var(--adm-surface)] p-6 shadow-[var(--adm-shadow-micro)] xl:col-span-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--adm-text-soft)]">
            Informacoes logisticas
          </p>
          <div className="mt-6 space-y-5">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--adm-text-soft)]">Transportadora</p>
              <p className="mt-1 text-sm font-semibold text-[var(--adm-text)]">{shipment.carrier}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--adm-text-soft)]">Codigo de rastreio</p>
              <p className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-[var(--adm-text)]">
                {shipment.trackingCode}
                <Copy className="h-4 w-4 text-[var(--adm-text-soft)]" />
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--adm-text-soft)]">Ultima atualizacao</p>
              <p className="mt-1 text-sm font-semibold text-[var(--adm-text)]">
                {formatDateTime(shipment.lastUpdateAt)}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--adm-tertiary)]">Prazo limite</p>
              <p className="mt-1 text-sm font-semibold text-[var(--adm-tertiary)]">{shipment.eta.slice(0, 10)}</p>
            </div>
          </div>
        </article>

        <article className="rounded-[var(--adm-radius)] border border-[var(--adm-border)] bg-[var(--adm-surface)] p-6 shadow-[var(--adm-shadow-micro)] xl:col-span-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--adm-text-soft)]">
            Historico do percurso
          </p>
          <div className="relative mt-8 space-y-10 pl-8">
            <div className="absolute bottom-0 left-[7px] top-1 w-px bg-[rgba(177,179,169,0.35)]" />
            {timeline.map((step) => (
              <div key={step.id} className="relative">
                <span
                  className={`absolute -left-8 top-1 h-3.5 w-3.5 rounded-full border-4 border-[var(--adm-surface)] ${
                    step.tone === "alert"
                      ? "bg-[var(--adm-tertiary)]"
                      : step.tone === "pending"
                        ? "bg-[rgba(177,179,169,0.7)]"
                        : "bg-[var(--adm-primary)]"
                  }`}
                />
                <p
                  className={`text-xs font-semibold uppercase tracking-[0.16em] ${
                    step.tone === "alert" ? "text-[var(--adm-tertiary)]" : "text-[var(--adm-primary)]"
                  }`}
                >
                  {step.label}
                </p>
                <p className="mt-2 text-sm text-[var(--adm-text)]">{step.title}</p>
                {step.timestamp ? (
                  <p className="mt-1 text-[10px] italic text-[var(--adm-text-soft)]">{step.timestamp}</p>
                ) : null}
              </div>
            ))}
          </div>
        </article>
      </section>

      <footer className="flex flex-col gap-4 border-t border-[var(--adm-border)] pt-8 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex -space-x-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[var(--adm-bg)] bg-[var(--adm-surface-muted)] text-[10px] font-semibold uppercase text-[var(--adm-text)]">
              SU
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[var(--adm-bg)] bg-[var(--adm-surface-muted)] text-[10px] font-semibold uppercase text-[var(--adm-text)]">
              OP
            </span>
          </div>
          <p className="text-xs text-[var(--adm-text-muted)]">
            Equipe de suporte VIP disponivel para auxiliar na resolucao do envio.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <PermissionGate route="/adm/financeiro/reembolsos">
            <Link
              href={refund ? `/adm/financeiro/reembolsos?refund=${refund.id}` : `/adm/financeiro/reembolsos?order=${order?.id ?? ""}`}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--adm-border-strong)] px-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--adm-text)]"
            >
              <Undo2 className="h-4 w-4" />
              Reembolso
            </Link>
          </PermissionGate>
          <PermissionGate route="/adm/operacao/logistica/incidentes">
            <Link
              href={`/adm/operacao/logistica/incidentes?shipment=${shipment.id}`}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--adm-border-strong)] px-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--adm-text)]"
            >
              <Ticket className="h-4 w-4" />
              Incidentes
            </Link>
          </PermissionGate>
          <PermissionGate route="/adm/operacao/parceiros">
            <Link
              href={`/adm/operacao/parceiros?seller=${shipment.sellerId}`}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--adm-border-strong)] px-5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--adm-text)]"
            >
              <Users className="h-4 w-4" />
              Seller
            </Link>
          </PermissionGate>
        </div>
      </footer>
    </div>
  );
}
