import "server-only";

import type { AdmPermission, AuthenticatedAdmUser } from "@/types/adm/auth";
import type {
  ActivityLog,
  AdminVisualStatus,
  AuditSnapshot,
  AuditTrailEntry,
  FinancialAlert,
  LogisticsIncident,
  Seller
} from "@/types/adm";

import { AdmActionError } from "@/lib/adm/actions/errors";
import { hasPermission } from "@/lib/adm/auth/permissions";
import { executePersistentAdmAction } from "@/lib/adm/actions/service.supabase";
import { getAdmDataSourceMode, mutateAdmDataSource, type AdmDataSource } from "@/lib/adm/repositories/source";

import type {
  AdmActionEntityType,
  AdmActionRequest,
  AdmActionResult,
  AdmActionType
} from "@/lib/adm/actions/types";

const ACTION_PERMISSIONS: Record<AdmActionType, AdmPermission> = {
  "product.approve": "approve_products",
  "product.reject": "approve_products",
  "product.request-adjustment": "manage_products",
  "seller.activate": "manage_sellers",
  "seller.deactivate": "manage_sellers",
  "seller.block": "manage_sellers",
  "payout.approve": "manage_finance",
  "payout.hold": "manage_finance",
  "refund.approve": "manage_refunds",
  "refund.reject": "manage_refunds",
  "shipment.update-status": "manage_logistics",
  "incident.register": "manage_logistics",
  "document.validate": "manage_documents",
  "document.request-update": "manage_documents",
  "review.approve": "manage_reviews",
  "review.hide": "manage_reviews"
};

const ACTION_ENTITY_TYPES: Record<AdmActionType, AdmActionEntityType> = {
  "product.approve": "product",
  "product.reject": "product",
  "product.request-adjustment": "product",
  "seller.activate": "seller",
  "seller.deactivate": "seller",
  "seller.block": "seller",
  "payout.approve": "payout",
  "payout.hold": "payout",
  "refund.approve": "refund",
  "refund.reject": "refund",
  "shipment.update-status": "shipment",
  "incident.register": "incident",
  "document.validate": "document",
  "document.request-update": "document",
  "review.approve": "review",
  "review.hide": "review"
};

const PRODUCT_AUDIT_FIELDS = [
  "sellerId",
  "category",
  "price",
  "status",
  "curationStatus",
  "qualityScore",
  "featured",
  "stock"
] as const;

const SELLER_AUDIT_FIELDS = [
  "category",
  "tier",
  "status",
  "riskLevel",
  "qualityScore",
  "activeProducts",
  "pendingDocuments"
] as const;

const PAYOUT_AUDIT_FIELDS = [
  "sellerId",
  "period",
  "grossAmount",
  "netAmount",
  "status",
  "scheduledAt"
] as const;

const REFUND_AUDIT_FIELDS = [
  "orderId",
  "sellerId",
  "customerId",
  "amount",
  "reason",
  "status",
  "requestedAt",
  "logisticsIncidentId"
] as const;

const SHIPMENT_AUDIT_FIELDS = [
  "orderId",
  "sellerId",
  "carrier",
  "trackingCode",
  "status",
  "eta",
  "lastUpdateAt"
] as const;

const INCIDENT_AUDIT_FIELDS = [
  "orderId",
  "shipmentId",
  "sellerId",
  "status",
  "priority",
  "type",
  "summary",
  "openedAt",
  "refundId"
] as const;

const DOCUMENT_AUDIT_FIELDS = ["sellerId", "type", "status", "dueDate", "owner"] as const;

const REVIEW_AUDIT_FIELDS = [
  "productId",
  "sellerId",
  "customerId",
  "rating",
  "status",
  "sentiment",
  "excerpt",
  "createdAt"
] as const;

type AuditRecordInput = {
  eventId?: string;
  createdAt?: string;
  user: AuthenticatedAdmUser;
  entityType: AdmActionEntityType | string;
  entityId: string;
  actionType: AdmActionType | string;
  actionLabel: string;
  status: AdminVisualStatus;
  summary?: string;
  contextPathname?: string;
  before?: AuditSnapshot;
  after?: AuditSnapshot;
  metadata?: AuditSnapshot;
};

const createTimestamp = () => new Date().toISOString();

const createId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

const normalizePathname = (value: string) => {
  const normalized = value.split("?")[0]?.split("#")[0] ?? value;
  if (normalized.length > 1 && normalized.endsWith("/")) {
    return normalized.slice(0, -1);
  }
  return normalized;
};

const getSellerActiveStatus = (seller: Seller): AdminVisualStatus =>
  seller.tier === "premium" ? "premium" : "aprovado";

const ensurePermission = (user: AuthenticatedAdmUser, request: AdmActionRequest) => {
  const permission = ACTION_PERMISSIONS[request.type];
  if (!hasPermission(user, permission)) {
    throw new AdmActionError(
      "FORBIDDEN",
      403,
      "Seu perfil interno nao possui permissao para executar esta acao."
    );
  }
};

const normalizeAuditValue = (value: unknown): AuditSnapshot[string] | undefined => {
  if (value === null) return null;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (Array.isArray(value)) {
    const normalized = value.filter(
      (item): item is string | number | boolean =>
        typeof item === "string" || typeof item === "number" || typeof item === "boolean"
    );
    return normalized.length > 0 ? normalized : undefined;
  }

  return undefined;
};

const buildAuditSnapshot = <T extends object>(
  source: T | null | undefined,
  keys: ReadonlyArray<keyof T>
): AuditSnapshot | undefined => {
  if (!source) return undefined;

  const snapshot: AuditSnapshot = {};
  const sourceRecord = source as Record<string, unknown>;
  keys.forEach((key) => {
    const normalized = normalizeAuditValue(sourceRecord[String(key)]);
    if (normalized !== undefined) {
      snapshot[String(key)] = normalized;
    }
  });

  return Object.keys(snapshot).length > 0 ? snapshot : undefined;
};

const buildAuditMetadata = (values: Record<string, unknown>): AuditSnapshot | undefined => {
  const metadata: AuditSnapshot = {};
  Object.entries(values).forEach(([key, value]) => {
    const normalized = normalizeAuditValue(value);
    if (normalized !== undefined) {
      metadata[key] = normalized;
    }
  });

  return Object.keys(metadata).length > 0 ? metadata : undefined;
};

const recordActivityEvent = (
  data: Pick<AdmDataSource, "activityLogs" | "auditTrail">,
  input: AuditRecordInput
) => {
  const eventId = input.eventId ?? createId("act");
  const createdAt = input.createdAt ?? createTimestamp();

  const activityLog: ActivityLog = {
    id: eventId,
    userId: input.user.id,
    entityType: input.entityType,
    entityId: input.entityId,
    action: input.actionLabel,
    status: input.status,
    createdAt
  };

  const auditEntry: AuditTrailEntry = {
    id: eventId,
    userId: input.user.id,
    entityType: input.entityType,
    entityId: input.entityId,
    actionType: input.actionType,
    actionLabel: input.actionLabel,
    status: input.status,
    createdAt,
    contextPathname: input.contextPathname,
    summary: input.summary,
    before: input.before,
    after: input.after,
    metadata: input.metadata
  };

  data.activityLogs.unshift(activityLog);
  data.auditTrail.unshift(auditEntry);
};

const updateLinkedAlertStatus = (
  alerts: FinancialAlert[],
  field: "payoutId" | "refundId",
  referenceId: string,
  status: AdminVisualStatus
) => {
  alerts.forEach((alert) => {
    if (alert[field] === referenceId) {
      alert.status = status;
    }
  });
};

const recomputeSellerPendingDocuments = (
  sellers: Seller[],
  documents: Array<{ sellerId: string; status: AdminVisualStatus }>,
  sellerId: string
) => {
  const seller = sellers.find((row) => row.id === sellerId);
  if (!seller) return;
  seller.pendingDocuments = documents.filter(
    (row) => row.sellerId === sellerId && row.status !== "aprovado"
  ).length;
};

const getBaseRevalidatedPaths = () => [
  "/adm",
  "/adm/qualidade-catalogo",
  "/adm/gestao/log-atividades"
];

const getRevalidatedPaths = (request: AdmActionRequest, contextPathname?: string) => {
  const paths = new Set<string>(getBaseRevalidatedPaths());

  if (contextPathname?.startsWith("/adm")) {
    paths.add(normalizePathname(contextPathname));
  }

  switch (request.type) {
    case "product.approve":
    case "product.reject":
    case "product.request-adjustment":
      paths.add("/adm/curadoria/produtos");
      break;
    case "seller.activate":
    case "seller.deactivate":
    case "seller.block":
      paths.add("/adm/operacao/parceiros");
      break;
    case "payout.approve":
    case "payout.hold":
      paths.add("/adm/financeiro");
      paths.add("/adm/financeiro/repasses");
      paths.add("/adm/financeiro/auditoria");
      break;
    case "refund.approve":
    case "refund.reject":
      paths.add("/adm/financeiro");
      paths.add("/adm/financeiro/reembolsos");
      paths.add("/adm/financeiro/auditoria");
      break;
    case "shipment.update-status":
    case "incident.register":
      paths.add("/adm/operacao/logistica");
      paths.add("/adm/operacao/logistica/incidentes");
      paths.add("/adm/operacao/pedidos-criticos");
      break;
    case "document.validate":
    case "document.request-update":
      paths.add("/adm/curadoria/documentos");
      paths.add("/adm/curadoria/compliance");
      paths.add("/adm/operacao/parceiros");
      break;
    case "review.approve":
    case "review.hide":
      paths.add("/adm/catalogo-marca/reviews");
      paths.add("/adm/operacao/parceiros");
      break;
  }

  return Array.from(paths);
};

export async function executeAdmAction(
  user: AuthenticatedAdmUser,
  request: AdmActionRequest,
  contextPathname?: string
): Promise<AdmActionResult> {
  ensurePermission(user, request);

  const revalidatedPaths = getRevalidatedPaths(request, contextPathname);

  if (getAdmDataSourceMode() === "supabase") {
    return executePersistentAdmAction(user, request, contextPathname, revalidatedPaths);
  }

  const entityType = ACTION_ENTITY_TYPES[request.type];
  const now = createTimestamp();

  return mutateAdmDataSource((data) => {
    switch (request.type) {
      case "product.approve": {
        const product = data.products.find((row) => row.id === request.entityId);
        if (!product) throw new AdmActionError("NOT_FOUND", 404, "Produto nao encontrado.");

        const before = buildAuditSnapshot(product, PRODUCT_AUDIT_FIELDS);
        product.status = "aprovado";
        product.curationStatus = "aprovado";
        data.curationStatuses
          .filter((row) => row.productId === product.id)
          .forEach((row) => {
            row.status = "aprovado";
            row.reviewer = user.name;
            row.reason = request.payload?.note ?? "Produto aprovado para publicacao.";
            row.updatedAt = now;
          });

        recordActivityEvent(data, {
          createdAt: now,
          user,
          entityType,
          entityId: product.id,
          actionType: request.type,
          actionLabel: "Aprovou produto para publicacao",
          status: product.status,
          contextPathname,
          summary: "Produto liberado para publicacao no catalogo premium.",
          before,
          after: buildAuditSnapshot(product, PRODUCT_AUDIT_FIELDS),
          metadata: buildAuditMetadata({ reviewer: user.name, note: request.payload?.note })
        });

        return {
          success: true,
          actionType: request.type,
          entityId: product.id,
          entityType,
          message: "Produto aprovado para publicacao.",
          updatedStatus: product.status,
          revalidatedPaths
        };
      }

      case "product.reject": {
        const product = data.products.find((row) => row.id === request.entityId);
        if (!product) throw new AdmActionError("NOT_FOUND", 404, "Produto nao encontrado.");

        const before = buildAuditSnapshot(product, PRODUCT_AUDIT_FIELDS);
        product.status = "reprovado";
        product.curationStatus = "reprovado";
        product.featured = false;
        data.curationStatuses
          .filter((row) => row.productId === product.id)
          .forEach((row) => {
            row.status = "reprovado";
            row.reviewer = user.name;
            row.reason = request.payload?.reason ?? "Produto reprovado pelo backoffice.";
            row.updatedAt = now;
          });

        recordActivityEvent(data, {
          createdAt: now,
          user,
          entityType,
          entityId: product.id,
          actionType: request.type,
          actionLabel: "Reprovou produto em curadoria",
          status: product.status,
          contextPathname,
          summary: "Produto removido do fluxo editorial ate nova submissao do seller.",
          before,
          after: buildAuditSnapshot(product, PRODUCT_AUDIT_FIELDS),
          metadata: buildAuditMetadata({ reviewer: user.name, reason: request.payload?.reason })
        });

        return {
          success: true,
          actionType: request.type,
          entityId: product.id,
          entityType,
          message: "Produto reprovado e devolvido ao seller.",
          updatedStatus: product.status,
          revalidatedPaths
        };
      }

      case "product.request-adjustment": {
        const product = data.products.find((row) => row.id === request.entityId);
        if (!product) throw new AdmActionError("NOT_FOUND", 404, "Produto nao encontrado.");

        const before = buildAuditSnapshot(product, PRODUCT_AUDIT_FIELDS);
        product.status = "em-revisao";
        product.curationStatus = "em-revisao";
        data.curationStatuses
          .filter((row) => row.productId === product.id)
          .forEach((row) => {
            row.status = "em-revisao";
            row.reviewer = user.name;
            row.reason = request.payload?.note ?? "Ajuste solicitado ao seller.";
            row.updatedAt = now;
          });

        recordActivityEvent(data, {
          createdAt: now,
          user,
          entityType,
          entityId: product.id,
          actionType: request.type,
          actionLabel: "Solicitou ajuste de produto",
          status: product.status,
          contextPathname,
          summary: "Produto retornou para revisao com solicitacao de ajuste editorial.",
          before,
          after: buildAuditSnapshot(product, PRODUCT_AUDIT_FIELDS),
          metadata: buildAuditMetadata({ reviewer: user.name, note: request.payload?.note })
        });

        return {
          success: true,
          actionType: request.type,
          entityId: product.id,
          entityType,
          message: "Ajuste solicitado ao seller.",
          updatedStatus: product.status,
          revalidatedPaths
        };
      }

      case "seller.activate": {
        const seller = data.sellers.find((row) => row.id === request.entityId);
        if (!seller) throw new AdmActionError("NOT_FOUND", 404, "Seller nao encontrado.");

        const before = buildAuditSnapshot(seller, SELLER_AUDIT_FIELDS);
        seller.status = getSellerActiveStatus(seller);

        recordActivityEvent(data, {
          createdAt: now,
          user,
          entityType,
          entityId: seller.id,
          actionType: request.type,
          actionLabel: "Ativou seller na operacao",
          status: seller.status,
          contextPathname,
          summary: "Seller reabilitado para operar no backoffice premium.",
          before,
          after: buildAuditSnapshot(seller, SELLER_AUDIT_FIELDS),
          metadata: buildAuditMetadata({ tier: seller.tier })
        });

        return {
          success: true,
          actionType: request.type,
          entityId: seller.id,
          entityType,
          message: "Seller ativado na operacao.",
          updatedStatus: seller.status,
          revalidatedPaths
        };
      }

      case "seller.deactivate": {
        const seller = data.sellers.find((row) => row.id === request.entityId);
        if (!seller) throw new AdmActionError("NOT_FOUND", 404, "Seller nao encontrado.");

        const before = buildAuditSnapshot(seller, SELLER_AUDIT_FIELDS);
        seller.status = "alerta";

        recordActivityEvent(data, {
          createdAt: now,
          user,
          entityType,
          entityId: seller.id,
          actionType: request.type,
          actionLabel: "Inativou seller temporariamente",
          status: seller.status,
          contextPathname,
          summary: "Seller mantido fora da operacao ate nova validacao operacional.",
          before,
          after: buildAuditSnapshot(seller, SELLER_AUDIT_FIELDS)
        });

        return {
          success: true,
          actionType: request.type,
          entityId: seller.id,
          entityType,
          message: "Seller inativado temporariamente.",
          updatedStatus: seller.status,
          revalidatedPaths
        };
      }

      case "seller.block": {
        const seller = data.sellers.find((row) => row.id === request.entityId);
        if (!seller) throw new AdmActionError("NOT_FOUND", 404, "Seller nao encontrado.");

        const before = buildAuditSnapshot(seller, SELLER_AUDIT_FIELDS);
        seller.status = "bloqueado";

        recordActivityEvent(data, {
          createdAt: now,
          user,
          entityType,
          entityId: seller.id,
          actionType: request.type,
          actionLabel: "Bloqueou seller por governanca",
          status: seller.status,
          contextPathname,
          summary: "Seller bloqueado por governanca operacional e risco elevado.",
          before,
          after: buildAuditSnapshot(seller, SELLER_AUDIT_FIELDS),
          metadata: buildAuditMetadata({ riskLevel: seller.riskLevel })
        });

        return {
          success: true,
          actionType: request.type,
          entityId: seller.id,
          entityType,
          message: "Seller bloqueado por governanca operacional.",
          updatedStatus: seller.status,
          revalidatedPaths
        };
      }

      case "payout.approve": {
        const payout = data.payouts.find((row) => row.id === request.entityId);
        if (!payout) throw new AdmActionError("NOT_FOUND", 404, "Repasse nao encontrado.");

        const before = buildAuditSnapshot(payout, PAYOUT_AUDIT_FIELDS);
        payout.status = "aprovado";
        updateLinkedAlertStatus(data.financialAlerts, "payoutId", payout.id, "resolvido");

        recordActivityEvent(data, {
          createdAt: now,
          user,
          entityType,
          entityId: payout.id,
          actionType: request.type,
          actionLabel: "Aprovou repasse para processamento",
          status: payout.status,
          contextPathname,
          summary: "Repasse liberado apos validacao financeira do ciclo.",
          before,
          after: buildAuditSnapshot(payout, PAYOUT_AUDIT_FIELDS),
          metadata: buildAuditMetadata({
            sellerId: payout.sellerId,
            orderIds: payout.orderIds
          })
        });

        return {
          success: true,
          actionType: request.type,
          entityId: payout.id,
          entityType,
          message: "Repasse aprovado para processamento.",
          updatedStatus: payout.status,
          revalidatedPaths
        };
      }

      case "payout.hold": {
        const payout = data.payouts.find((row) => row.id === request.entityId);
        if (!payout) throw new AdmActionError("NOT_FOUND", 404, "Repasse nao encontrado.");

        const before = buildAuditSnapshot(payout, PAYOUT_AUDIT_FIELDS);
        payout.status = "bloqueado";
        updateLinkedAlertStatus(data.financialAlerts, "payoutId", payout.id, "critico");

        recordActivityEvent(data, {
          createdAt: now,
          user,
          entityType,
          entityId: payout.id,
          actionType: request.type,
          actionLabel: "Segurou repasse para auditoria",
          status: payout.status,
          contextPathname,
          summary: "Repasse colocado em espera por risco financeiro ou operacional.",
          before,
          after: buildAuditSnapshot(payout, PAYOUT_AUDIT_FIELDS),
          metadata: buildAuditMetadata({
            sellerId: payout.sellerId,
            orderIds: payout.orderIds
          })
        });

        return {
          success: true,
          actionType: request.type,
          entityId: payout.id,
          entityType,
          message: "Repasse colocado em espera para auditoria.",
          updatedStatus: payout.status,
          revalidatedPaths
        };
      }

      case "refund.approve": {
        const refund = data.refunds.find((row) => row.id === request.entityId);
        if (!refund) throw new AdmActionError("NOT_FOUND", 404, "Reembolso nao encontrado.");

        const before = buildAuditSnapshot(refund, REFUND_AUDIT_FIELDS);
        refund.status = "aprovado";
        updateLinkedAlertStatus(data.financialAlerts, "refundId", refund.id, "resolvido");

        recordActivityEvent(data, {
          createdAt: now,
          user,
          entityType,
          entityId: refund.id,
          actionType: request.type,
          actionLabel: "Aprovou reembolso",
          status: refund.status,
          contextPathname,
          summary: "Reembolso aprovado pelo backoffice com fechamento do caso financeiro.",
          before,
          after: buildAuditSnapshot(refund, REFUND_AUDIT_FIELDS),
          metadata: buildAuditMetadata({
            amount: refund.amount,
            orderId: refund.orderId
          })
        });

        return {
          success: true,
          actionType: request.type,
          entityId: refund.id,
          entityType,
          message: "Reembolso aprovado.",
          updatedStatus: refund.status,
          revalidatedPaths
        };
      }

      case "refund.reject": {
        const refund = data.refunds.find((row) => row.id === request.entityId);
        if (!refund) throw new AdmActionError("NOT_FOUND", 404, "Reembolso nao encontrado.");

        const before = buildAuditSnapshot(refund, REFUND_AUDIT_FIELDS);
        refund.status = "reprovado";
        updateLinkedAlertStatus(data.financialAlerts, "refundId", refund.id, "resolvido");

        recordActivityEvent(data, {
          createdAt: now,
          user,
          entityType,
          entityId: refund.id,
          actionType: request.type,
          actionLabel: "Recusou reembolso",
          status: refund.status,
          contextPathname,
          summary: "Solicitacao de reembolso recusada apos revisao do caso.",
          before,
          after: buildAuditSnapshot(refund, REFUND_AUDIT_FIELDS),
          metadata: buildAuditMetadata({
            amount: refund.amount,
            orderId: refund.orderId
          })
        });

        return {
          success: true,
          actionType: request.type,
          entityId: refund.id,
          entityType,
          message: "Reembolso recusado.",
          updatedStatus: refund.status,
          revalidatedPaths
        };
      }

      case "shipment.update-status": {
        const shipment = data.shipments.find((row) => row.id === request.entityId);
        if (!shipment) throw new AdmActionError("NOT_FOUND", 404, "Envio nao encontrado.");

        const before = buildAuditSnapshot(shipment, SHIPMENT_AUDIT_FIELDS);
        shipment.status = request.payload.status;
        shipment.lastUpdateAt = now;

        const order = data.orders.find((row) => row.id === shipment.orderId);
        if (order) {
          order.logisticsStatus = request.payload.status;
        }

        const linkedIncident = data.logisticsIncidents.find((row) => row.shipmentId === shipment.id);
        const previousIncidentStatus = linkedIncident?.status;
        if (linkedIncident && request.payload.status === "resolvido") {
          linkedIncident.status = "resolvido";
        }

        recordActivityEvent(data, {
          createdAt: now,
          user,
          entityType,
          entityId: shipment.id,
          actionType: request.type,
          actionLabel: `Atualizou status logistico para ${request.payload.status}`,
          status: shipment.status,
          contextPathname,
          summary: "Status do envio revisado manualmente no hub logistico.",
          before,
          after: buildAuditSnapshot(shipment, SHIPMENT_AUDIT_FIELDS),
          metadata: buildAuditMetadata({
            orderId: shipment.orderId,
            incidentId: linkedIncident?.id,
            previousIncidentStatus
          })
        });

        return {
          success: true,
          actionType: request.type,
          entityId: shipment.id,
          entityType,
          message: `Status do envio atualizado para ${request.payload.status}.`,
          updatedStatus: shipment.status,
          revalidatedPaths
        };
      }

      case "incident.register": {
        const shipment = data.shipments.find((row) => row.id === request.entityId);
        if (!shipment) throw new AdmActionError("NOT_FOUND", 404, "Envio nao encontrado.");

        const order = data.orders.find((row) => row.id === shipment.orderId);
        const existingIncident = data.logisticsIncidents.find((row) => row.shipmentId === shipment.id);
        const before = buildAuditSnapshot(existingIncident, INCIDENT_AUDIT_FIELDS);
        const shipmentStatusBefore = shipment.status;
        const orderStatusBefore = order?.status;

        const incident =
          existingIncident ??
          (() => {
            const nextIncident: LogisticsIncident = {
              id: createId("inc"),
              orderId: shipment.orderId,
              shipmentId: shipment.id,
              sellerId: shipment.sellerId,
              status: "critico",
              priority: request.payload?.priority ?? "alta",
              type: request.payload?.type ?? "Acompanhamento manual",
              summary:
                request.payload?.summary ?? "Incidente aberto manualmente pelo backoffice.",
              openedAt: now
            };
            data.logisticsIncidents.unshift(nextIncident);
            return nextIncident;
          })();

        if (existingIncident) {
          incident.status = "critico";
          incident.priority = request.payload?.priority ?? incident.priority;
          incident.type = request.payload?.type ?? incident.type;
          incident.summary = request.payload?.summary ?? incident.summary;
        }

        shipment.status = "critico";
        shipment.lastUpdateAt = now;
        if (order) {
          order.logisticsStatus = "critico";
          order.status = "critico";
        }

        recordActivityEvent(data, {
          createdAt: now,
          user,
          entityType: "incident",
          entityId: incident.id,
          actionType: request.type,
          actionLabel: "Registrou incidente logistico",
          status: incident.status,
          contextPathname,
          summary: "Incidente logistico aberto ou atualizado com escalonamento critico.",
          before,
          after: buildAuditSnapshot(incident, INCIDENT_AUDIT_FIELDS),
          metadata: buildAuditMetadata({
            shipmentId: shipment.id,
            shipmentStatusBefore,
            shipmentStatusAfter: shipment.status,
            orderId: order?.id,
            orderStatusBefore,
            orderStatusAfter: order?.status
          })
        });

        return {
          success: true,
          actionType: request.type,
          entityId: incident.id,
          entityType: "incident",
          message: "Incidente logistico registrado com sucesso.",
          updatedStatus: incident.status,
          revalidatedPaths
        };
      }

      case "document.validate": {
        const document = data.documents.find((row) => row.id === request.entityId);
        if (!document) throw new AdmActionError("NOT_FOUND", 404, "Documento nao encontrado.");

        const before = buildAuditSnapshot(document, DOCUMENT_AUDIT_FIELDS);
        document.status = "aprovado";
        recomputeSellerPendingDocuments(data.sellers, data.documents, document.sellerId);

        recordActivityEvent(data, {
          createdAt: now,
          user,
          entityType,
          entityId: document.id,
          actionType: request.type,
          actionLabel: "Validou documento de seller",
          status: document.status,
          contextPathname,
          summary: "Documento aprovado e seller atualizado na esteira de compliance.",
          before,
          after: buildAuditSnapshot(document, DOCUMENT_AUDIT_FIELDS),
          metadata: buildAuditMetadata({ sellerId: document.sellerId })
        });

        return {
          success: true,
          actionType: request.type,
          entityId: document.id,
          entityType,
          message: "Documento validado.",
          updatedStatus: document.status,
          revalidatedPaths
        };
      }

      case "document.request-update": {
        const document = data.documents.find((row) => row.id === request.entityId);
        if (!document) throw new AdmActionError("NOT_FOUND", 404, "Documento nao encontrado.");

        const before = buildAuditSnapshot(document, DOCUMENT_AUDIT_FIELDS);
        document.status = request.payload?.status ?? "em-revisao";
        recomputeSellerPendingDocuments(data.sellers, data.documents, document.sellerId);

        recordActivityEvent(data, {
          createdAt: now,
          user,
          entityType,
          entityId: document.id,
          actionType: request.type,
          actionLabel: "Solicitou atualizacao de documento",
          status: document.status,
          contextPathname,
          summary: "Documento devolvido para correcao ou nova submissao do seller.",
          before,
          after: buildAuditSnapshot(document, DOCUMENT_AUDIT_FIELDS),
          metadata: buildAuditMetadata({
            sellerId: document.sellerId,
            requestedStatus: request.payload?.status
          })
        });

        return {
          success: true,
          actionType: request.type,
          entityId: document.id,
          entityType,
          message: "Nova solicitacao enviada para o documento.",
          updatedStatus: document.status,
          revalidatedPaths
        };
      }

      case "review.approve": {
        const review = data.reviews.find((row) => row.id === request.entityId);
        if (!review) throw new AdmActionError("NOT_FOUND", 404, "Review nao encontrada.");

        const before = buildAuditSnapshot(review, REVIEW_AUDIT_FIELDS);
        review.status = "aprovado";

        recordActivityEvent(data, {
          createdAt: now,
          user,
          entityType,
          entityId: review.id,
          actionType: request.type,
          actionLabel: "Aprovou review para exibicao",
          status: review.status,
          contextPathname,
          summary: "Review liberada para exibicao publica na experiencia BelaPop.",
          before,
          after: buildAuditSnapshot(review, REVIEW_AUDIT_FIELDS),
          metadata: buildAuditMetadata({
            rating: review.rating,
            sellerId: review.sellerId,
            productId: review.productId
          })
        });

        return {
          success: true,
          actionType: request.type,
          entityId: review.id,
          entityType,
          message: "Review aprovada para exibicao.",
          updatedStatus: review.status,
          revalidatedPaths
        };
      }

      case "review.hide": {
        const review = data.reviews.find((row) => row.id === request.entityId);
        if (!review) throw new AdmActionError("NOT_FOUND", 404, "Review nao encontrada.");

        const before = buildAuditSnapshot(review, REVIEW_AUDIT_FIELDS);
        review.status = request.payload?.status ?? "bloqueado";

        recordActivityEvent(data, {
          createdAt: now,
          user,
          entityType,
          entityId: review.id,
          actionType: request.type,
          actionLabel: "Ocultou review por moderacao",
          status: review.status,
          contextPathname,
          summary: "Review retirada da vitrine publica por moderacao editorial.",
          before,
          after: buildAuditSnapshot(review, REVIEW_AUDIT_FIELDS),
          metadata: buildAuditMetadata({
            moderationStatus: request.payload?.status,
            sellerId: review.sellerId,
            productId: review.productId
          })
        });

        return {
          success: true,
          actionType: request.type,
          entityId: review.id,
          entityType,
          message: "Review moderada com sucesso.",
          updatedStatus: review.status,
          revalidatedPaths
        };
      }

      default: {
        throw new AdmActionError("UNSUPPORTED_ACTION", 400, "Acao do ADM nao suportada.");
      }
    }
  });
}

export function toAdmActionFailure(error: unknown) {
  if (error instanceof AdmActionError) {
    return {
      statusCode: error.statusCode,
      body: {
        success: false,
        code: error.code,
        message: error.message
      }
    };
  }

  return {
    statusCode: 500,
    body: {
      success: false,
      code: "INTERNAL_ERROR",
      message: "Nao foi possivel concluir a acao do ADM."
    }
  };
}
