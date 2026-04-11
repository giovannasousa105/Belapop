import "server-only";

import type {
  AdminVisualStatus,
  AuditSnapshot,
  Document,
  LogisticsIncident,
  Payout,
  Product,
  Refund,
  Review,
  Seller,
  Shipment
} from "@/types/adm";
import type { AuthenticatedAdmUser } from "@/types/adm/auth";

import { AdmActionError } from "@/lib/adm/actions/errors";
import type { AdmActionEntityType, AdmActionRequest, AdmActionResult } from "@/lib/adm/actions/types";
import { getAdmDataSource } from "@/lib/adm/repositories/source";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const ACTION_ENTITY_TYPES: Record<AdmActionRequest["type"], AdmActionEntityType> = {
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

const ACTION_LABELS: Record<AdmActionRequest["type"], string> = {
  "product.approve": "Aprovou produto para publicacao",
  "product.reject": "Reprovou produto em curadoria",
  "product.request-adjustment": "Solicitou ajuste de produto",
  "seller.activate": "Ativou seller na operacao",
  "seller.deactivate": "Inativou seller temporariamente",
  "seller.block": "Bloqueou seller por governanca",
  "payout.approve": "Aprovou repasse para processamento",
  "payout.hold": "Segurou repasse para auditoria",
  "refund.approve": "Aprovou reembolso",
  "refund.reject": "Recusou reembolso",
  "shipment.update-status": "Atualizou status logistico",
  "incident.register": "Registrou incidente logistico",
  "document.validate": "Validou documento de seller",
  "document.request-update": "Solicitou atualizacao de documento",
  "review.approve": "Aprovou review para exibicao",
  "review.hide": "Ocultou review por moderacao"
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

const nowIso = () => new Date().toISOString();

const addHours = (hours: number) => {
  const next = new Date();
  next.setHours(next.getHours() + hours);
  return next.toISOString();
};

const createId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

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
  const record = source as Record<string, unknown>;
  keys.forEach((key) => {
    const normalized = normalizeAuditValue(record[String(key)]);
    if (normalized !== undefined) {
      snapshot[String(key)] = normalized;
    }
  });

  return Object.keys(snapshot).length > 0 ? snapshot : undefined;
};

const actorUserIdOrNull = (value: string) => (UUID_RE.test(value) ? value : null);

const ensureSuccess = async <T>(
  label: string,
  promise: PromiseLike<{ data: T | null; error: { message?: string; code?: string } | null }>
) => {
  const { data, error } = await promise;
  if (error) {
    throw new AdmActionError(
      "PERSISTENCE_ERROR",
      500,
      `Nao foi possivel persistir a acao do ADM em ${label}: ${error.message ?? "erro desconhecido"}.`
    );
  }

  return data;
};

const getSellerActiveStatus = (seller: Seller): AdminVisualStatus =>
  seller.tier === "premium" ? "premium" : "aprovado";

const mapPriorityToSeverity = (priority?: LogisticsIncident["priority"]) => {
  if (priority === "critica") return "critical";
  if (priority === "alta") return "warn";
  if (priority === "media") return "warn";
  return "info";
};

const toIncidentStatus = (status: AdminVisualStatus): "open" | "in_progress" | "resolved" => {
  if (status === "resolvido" || status === "aprovado") return "resolved";
  if (status === "em-revisao") return "in_progress";
  return "open";
};

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60) || "manual_review";

async function upsertAdmEntityState(params: {
  entityType: AdmActionEntityType;
  entityId: string;
  sellerId?: string | null;
  status: AdminVisualStatus;
  notes?: string | null;
  payload?: Record<string, unknown>;
  user: AuthenticatedAdmUser;
}) {
  const admin = getSupabaseAdminClient();
  const { error } = await admin
    .from("adm_entity_states")
    .upsert(
      {
        entity_type: params.entityType,
        entity_id: params.entityId,
        seller_id: params.sellerId ?? null,
        status: params.status,
        notes: params.notes ?? null,
        payload: params.payload ?? {},
        actor_user_id: actorUserIdOrNull(params.user.id),
        actor_label: params.user.email ?? params.user.name,
        updated_at: nowIso()
      },
      { onConflict: "entity_type,entity_id" }
    )
    .select("id")
    .maybeSingle();

  if (!error) return;

  if (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    error.message?.includes("adm_entity_states")
  ) {
    throw new AdmActionError(
      "ADM_SCHEMA_MIGRATION_REQUIRED",
      503,
      "A persistencia de estados do ADM ainda nao foi aplicada no banco. Rode a migration 20260410_0100_adm_entity_states.sql."
    );
  }

  throw new AdmActionError(
    "PERSISTENCE_ERROR",
    500,
    `Nao foi possivel persistir a acao do ADM em adm_entity_states:${params.entityType}:${params.entityId}: ${
      error.message ?? "erro desconhecido"
    }.`
  );
}

async function upsertComplianceDocument(params: {
  document: Document;
  status: AdminVisualStatus;
  user: AuthenticatedAdmUser;
  contextPathname?: string;
  note?: string | null;
}) {
  const admin = getSupabaseAdminClient();
  const { error } = await admin
    .from("compliance_documents")
    .upsert(
      {
        id: params.document.id,
        seller_id: params.document.sellerId,
        product_id: null,
        document_type: params.document.type,
        status: params.status,
        due_date: params.document.dueDate,
        owner_area: params.document.owner,
        review_notes: params.note ?? null,
        metadata: {
          contextPathname: params.contextPathname ?? null,
          requestedBy: params.user.name
        },
        reviewed_at: nowIso(),
        reviewed_by: params.user.id,
        updated_at: nowIso()
      },
      { onConflict: "id" }
    )
    .select("id")
    .maybeSingle();

  if (!error) return;

  if (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    error.message?.includes("compliance_documents")
  ) {
    throw new AdmActionError(
      "ADM_SCHEMA_MIGRATION_REQUIRED",
      503,
      "A persistencia de documentos do ADM ainda nao foi aplicada no banco. Rode a migration 20260410_0200_compliance_documents.sql."
    );
  }

  throw new AdmActionError(
    "PERSISTENCE_ERROR",
    500,
    `Nao foi possivel persistir a acao do ADM em compliance_documents:${params.document.id}: ${
      error.message ?? "erro desconhecido"
    }.`
  );
}

async function updateProductReviewModeration(params: {
  review: Review;
  status: AdminVisualStatus;
  hidden: boolean;
  user: AuthenticatedAdmUser;
  note?: string | null;
}) {
  const admin = getSupabaseAdminClient();
  const { error } = await admin
    .from("product_reviews")
    .update({
      is_hidden: params.hidden,
      moderation_status: params.status,
      moderation_notes: params.note ?? null,
      moderated_at: nowIso(),
      moderated_by: params.user.id,
      updated_at: nowIso()
    })
    .eq("id", params.review.id)
    .select("id")
    .maybeSingle();

  if (!error) return;

  if (
    error.code === "42703" ||
    error.message?.includes("moderation_status") ||
    error.message?.includes("moderation_notes") ||
    error.message?.includes("moderated_at") ||
    error.message?.includes("moderated_by") ||
    error.message?.includes("is_hidden")
  ) {
    throw new AdmActionError(
      "ADM_SCHEMA_MIGRATION_REQUIRED",
      503,
      "A moderacao persistente de reviews ainda nao foi aplicada no banco. Rode a migration 20260411_0100_product_reviews_moderation.sql."
    );
  }

  throw new AdmActionError(
    "PERSISTENCE_ERROR",
    500,
    `Nao foi possivel persistir a moderacao da review ${params.review.id} em product_reviews: ${
      error.message ?? "erro desconhecido"
    }.`
  );
}

async function updateShipmentOperationalStatus(params: {
  shipment: Shipment;
  status: AdminVisualStatus;
  user: AuthenticatedAdmUser;
  note?: string | null;
}) {
  const admin = getSupabaseAdminClient();
  const { error } = await admin
    .from("shipments")
    .update({
      operational_status: params.status,
      operational_notes: params.note ?? null,
      operational_updated_at: nowIso(),
      operational_updated_by: params.user.id,
      updated_at: nowIso()
    })
    .eq("id", params.shipment.id)
    .select("id")
    .maybeSingle();

  if (!error) return;

  if (
    error.code === "42703" ||
    error.message?.includes("operational_status") ||
    error.message?.includes("operational_notes") ||
    error.message?.includes("operational_updated_at") ||
    error.message?.includes("operational_updated_by")
  ) {
    throw new AdmActionError(
      "ADM_SCHEMA_MIGRATION_REQUIRED",
      503,
      "A persistencia operacional de envios ainda nao foi aplicada no banco. Rode a migration 20260411_0200_shipments_operational_status.sql."
    );
  }

  throw new AdmActionError(
    "PERSISTENCE_ERROR",
    500,
    `Nao foi possivel persistir o status operacional do envio ${params.shipment.id} em shipments: ${
      error.message ?? "erro desconhecido"
    }.`
  );
}

async function writeAuditLog(params: {
  user: AuthenticatedAdmUser;
  entityType: AdmActionEntityType;
  entityId: string;
  actionType: AdmActionRequest["type"];
  storeId?: string | null;
  before?: AuditSnapshot;
  after?: AuditSnapshot;
  summary?: string;
}) {
  const admin = getSupabaseAdminClient();

  await ensureSuccess(
    `audit_log:${params.entityType}:${params.entityId}`,
    admin.from("audit_log").insert({
      actor_user_id: actorUserIdOrNull(params.user.id),
      actor_role: params.user.role,
      store_id: params.storeId ?? null,
      entity_type: params.entityType,
      entity_id: params.entityId,
      action: ACTION_LABELS[params.actionType],
      permission_used: params.actionType,
      before_data: params.before ?? null,
      after_data: params.after ?? null,
      notes: params.summary ?? null
    })
  );
}

async function updateFinanceAlertsByReference(
  ids: string[],
  nextStatus: "open" | "acknowledged" | "resolved" | "dismissed"
) {
  if (ids.length === 0) return;

  const admin = getSupabaseAdminClient();
  await ensureSuccess(
    `finance_ops_alerts:${nextStatus}`,
    admin.from("finance_ops_alerts").update({ status: nextStatus }).in("id", ids)
  );
}

function getEntityType(request: AdmActionRequest) {
  return ACTION_ENTITY_TYPES[request.type];
}

function buildBaseResult(
  request: AdmActionRequest,
  entityId: string,
  message: string,
  updatedStatus: AdminVisualStatus | undefined,
  revalidatedPaths: string[]
): AdmActionResult {
  return {
    success: true,
    actionType: request.type,
    entityId,
    entityType: getEntityType(request),
    message,
    updatedStatus,
    revalidatedPaths
  };
}

export async function executePersistentAdmAction(
  user: AuthenticatedAdmUser,
  request: AdmActionRequest,
  contextPathname: string | undefined,
  revalidatedPaths: string[]
): Promise<AdmActionResult> {
  const data = await getAdmDataSource();
  const admin = getSupabaseAdminClient();
  const now = nowIso();

  switch (request.type) {
    case "product.approve":
    case "product.reject":
    case "product.request-adjustment": {
      const product = data.products.find((row) => row.id === request.entityId);
      if (!product) throw new AdmActionError("NOT_FOUND", 404, "Produto nao encontrado.");

      const before = buildAuditSnapshot(product, PRODUCT_AUDIT_FIELDS);
      const visualStatus: AdminVisualStatus =
        request.type === "product.approve"
          ? "aprovado"
          : request.type === "product.reject"
            ? "reprovado"
            : "em-revisao";

      await ensureSuccess(
        `products:${product.id}`,
        admin
          .from("products")
          .update({
            status:
              request.type === "product.approve"
                ? "published"
                : request.type === "product.reject"
                  ? "paused"
                  : "review",
            curated: request.type === "product.approve",
            is_featured: request.type === "product.reject" ? false : product.featured,
            curation_feedback: request.payload?.reason ?? request.payload?.note ?? null,
            review_notes: request.payload?.reason ?? request.payload?.note ?? null,
            updated_at: now
          })
          .eq("id", product.id)
      );

      await upsertAdmEntityState({
        entityType: "product",
        entityId: product.id,
        sellerId: product.sellerId,
        status: visualStatus,
        notes: request.payload?.reason ?? request.payload?.note ?? null,
        payload: {
          contextPathname,
          requestedBy: user.name
        },
        user
      });

      const after: Product = {
        ...product,
        status: visualStatus,
        curationStatus: visualStatus,
        featured: request.type === "product.reject" ? false : product.featured
      };

      await writeAuditLog({
        user,
        entityType: "product",
        entityId: product.id,
        actionType: request.type,
        storeId: product.sellerId,
        before,
        after: buildAuditSnapshot(after, PRODUCT_AUDIT_FIELDS),
        summary:
          request.type === "product.approve"
            ? "Produto liberado para publicacao no catalogo premium."
            : request.type === "product.reject"
              ? "Produto removido do fluxo editorial ate nova submissao do seller."
              : "Produto retornou para revisao com solicitacao de ajuste editorial."
      });

      return buildBaseResult(
        request,
        product.id,
        request.type === "product.approve"
          ? "Produto aprovado para publicacao."
          : request.type === "product.reject"
            ? "Produto reprovado e devolvido ao seller."
            : "Ajuste solicitado ao seller.",
        visualStatus,
        revalidatedPaths
      );
    }

    case "seller.activate":
    case "seller.deactivate":
    case "seller.block": {
      const seller = data.sellers.find((row) => row.id === request.entityId);
      if (!seller) throw new AdmActionError("NOT_FOUND", 404, "Seller nao encontrado.");

      const before = buildAuditSnapshot(seller, SELLER_AUDIT_FIELDS);
      const visualStatus =
        request.type === "seller.activate"
          ? getSellerActiveStatus(seller)
          : request.type === "seller.block"
            ? "bloqueado"
            : "alerta";

      await ensureSuccess(
        `sellers:${seller.id}`,
        admin
          .from("sellers")
          .update({
            status: request.type === "seller.activate" ? "active" : "inactive",
            updated_at: now
          })
          .eq("id", seller.id)
      );

      await ensureSuccess(
        `seller_risk_profiles:${seller.id}`,
        admin.from("seller_risk_profiles").upsert(
          {
            seller_id: seller.id,
            risk_tier:
              request.type === "seller.block"
                ? "restricted"
                : seller.riskLevel === "critica"
                  ? "high"
                  : seller.riskLevel === "alta"
                    ? "medium"
                    : "low",
            payouts_blocked: request.type === "seller.block",
            computed_at: now
          },
          { onConflict: "seller_id" }
        )
      );

      await upsertAdmEntityState({
        entityType: "seller",
        entityId: seller.id,
        sellerId: seller.id,
        status: visualStatus,
        payload: {
          contextPathname,
          requestedBy: user.name,
          riskLevel: seller.riskLevel
        },
        user
      });

      const after: Seller = {
        ...seller,
        status: visualStatus
      };

      await writeAuditLog({
        user,
        entityType: "seller",
        entityId: seller.id,
        actionType: request.type,
        storeId: seller.id,
        before,
        after: buildAuditSnapshot(after, SELLER_AUDIT_FIELDS),
        summary:
          request.type === "seller.activate"
            ? "Seller reabilitado para operar no backoffice premium."
            : request.type === "seller.block"
              ? "Seller bloqueado por governanca operacional e risco elevado."
              : "Seller mantido fora da operacao ate nova validacao operacional."
      });

      return buildBaseResult(
        request,
        seller.id,
        request.type === "seller.activate"
          ? "Seller ativado na operacao."
          : request.type === "seller.block"
            ? "Seller bloqueado por governanca operacional."
            : "Seller inativado temporariamente.",
        visualStatus,
        revalidatedPaths
      );
    }

    case "payout.approve":
    case "payout.hold": {
      const payout = data.payouts.find((row) => row.id === request.entityId);
      if (!payout) throw new AdmActionError("NOT_FOUND", 404, "Repasse nao encontrado.");

      const before = buildAuditSnapshot(payout, PAYOUT_AUDIT_FIELDS);
      const visualStatus: AdminVisualStatus = request.type === "payout.approve" ? "aprovado" : "bloqueado";

      await ensureSuccess(
        `seller_payouts:${payout.id}`,
        admin
          .from("seller_payouts")
          .update({
            status: request.type === "payout.approve" ? "processing" : "blocked",
            updated_at: now
          })
          .eq("id", payout.id)
      );

      const linkedAlertIds = data.financialAlerts
        .filter((alert) => alert.payoutId === payout.id)
        .map((alert) => alert.id);
      await updateFinanceAlertsByReference(
        linkedAlertIds,
        request.type === "payout.approve" ? "resolved" : "acknowledged"
      );

      const after: Payout = {
        ...payout,
        status: visualStatus
      };

      await writeAuditLog({
        user,
        entityType: "payout",
        entityId: payout.id,
        actionType: request.type,
        storeId: payout.sellerId,
        before,
        after: buildAuditSnapshot(after, PAYOUT_AUDIT_FIELDS),
        summary:
          request.type === "payout.approve"
            ? "Repasse liberado apos validacao financeira do ciclo."
            : "Repasse colocado em espera por risco financeiro ou operacional."
      });

      return buildBaseResult(
        request,
        payout.id,
        request.type === "payout.approve"
          ? "Repasse aprovado para processamento."
          : "Repasse colocado em espera para auditoria.",
        visualStatus,
        revalidatedPaths
      );
    }

    case "refund.approve":
    case "refund.reject": {
      const refund = data.refunds.find((row) => row.id === request.entityId);
      if (!refund) throw new AdmActionError("NOT_FOUND", 404, "Reembolso nao encontrado.");

      const before = buildAuditSnapshot(refund, REFUND_AUDIT_FIELDS);
      const visualStatus: AdminVisualStatus = request.type === "refund.approve" ? "aprovado" : "reprovado";

      await ensureSuccess(
        `return_requests:${refund.id}`,
        admin
          .from("return_requests")
          .update({
            status: request.type === "refund.approve" ? "approved" : "rejected",
            updated_at: now
          })
          .eq("id", refund.id)
      );

      const linkedAlertIds = data.financialAlerts
        .filter((alert) => alert.refundId === refund.id)
        .map((alert) => alert.id);
      await updateFinanceAlertsByReference(linkedAlertIds, "resolved");

      const after: Refund = {
        ...refund,
        status: visualStatus
      };

      await writeAuditLog({
        user,
        entityType: "refund",
        entityId: refund.id,
        actionType: request.type,
        storeId: refund.sellerId,
        before,
        after: buildAuditSnapshot(after, REFUND_AUDIT_FIELDS),
        summary:
          request.type === "refund.approve"
            ? "Reembolso aprovado pelo backoffice com fechamento do caso financeiro."
            : "Solicitacao de reembolso recusada apos revisao do caso."
      });

      return buildBaseResult(
        request,
        refund.id,
        request.type === "refund.approve" ? "Reembolso aprovado." : "Reembolso recusado.",
        visualStatus,
        revalidatedPaths
      );
    }

    case "shipment.update-status": {
      const shipment = data.shipments.find((row) => row.id === request.entityId);
      if (!shipment) throw new AdmActionError("NOT_FOUND", 404, "Envio nao encontrado.");

      const before = buildAuditSnapshot(shipment, SHIPMENT_AUDIT_FIELDS);
      const nextStatus = request.payload.status;

      await updateShipmentOperationalStatus({
        shipment,
        status: nextStatus,
        note: "Status revisado manualmente no hub logistico.",
        user
      });

      const nextIncidentDbStatus = toIncidentStatus(nextStatus);
      await ensureSuccess(
        `logistics_exceptions:${shipment.orderId}`,
        admin
          .from("logistics_exceptions")
          .update({
            status: nextIncidentDbStatus,
            resolved_at: nextIncidentDbStatus === "resolved" ? now : null,
            updated_at: now
          })
          .eq("sub_order_id", shipment.orderId)
      );

      const after: Shipment = {
        ...shipment,
        status: nextStatus,
        lastUpdateAt: now
      };

      await writeAuditLog({
        user,
        entityType: "shipment",
        entityId: shipment.id,
        actionType: request.type,
        storeId: shipment.sellerId,
        before,
        after: buildAuditSnapshot(after, SHIPMENT_AUDIT_FIELDS),
        summary: "Status do envio revisado manualmente no hub logistico."
      });

      return buildBaseResult(
        request,
        shipment.id,
        `Status do envio atualizado para ${nextStatus}.`,
        nextStatus,
        revalidatedPaths
      );
    }

    case "incident.register": {
      const shipment = data.shipments.find((row) => row.id === request.entityId);
      if (!shipment) throw new AdmActionError("NOT_FOUND", 404, "Envio nao encontrado.");

      const sellerOrder = await ensureSuccess(
        `seller_orders:${shipment.orderId}`,
        admin
          .from("seller_orders")
          .select("id,order_id,seller_id")
          .eq("id", shipment.orderId)
          .maybeSingle()
      ) as { id: string; order_id: string; seller_id: string } | null;

      if (!sellerOrder) {
        throw new AdmActionError(
          "NOT_FOUND",
          404,
          "Seller order nao encontrado para registrar o incidente logistico."
        );
      }

      const existingIncident = data.logisticsIncidents.find((row) => row.shipmentId === shipment.id);
      const exceptionCode = slugify(request.payload?.type ?? existingIncident?.type ?? "manual_review");
      const visualStatus: AdminVisualStatus = "critico";
      const priority = request.payload?.priority ?? existingIncident?.priority ?? "alta";

      const persistedIncident = await ensureSuccess(
        `logistics_exceptions:${shipment.id}`,
        admin
          .from("logistics_exceptions")
          .upsert(
            {
              order_id: sellerOrder.order_id,
              sub_order_id: sellerOrder.id,
              seller_id: sellerOrder.seller_id,
              exception_code: exceptionCode,
              severity: mapPriorityToSeverity(priority),
              status: "open",
              source: "adm",
              payload: {
                shipment_id: shipment.id,
                tracking_code: shipment.trackingCode,
                summary:
                  request.payload?.summary ??
                  existingIncident?.summary ??
                  "Incidente aberto manualmente pelo backoffice.",
                type: request.payload?.type ?? existingIncident?.type ?? "Acompanhamento manual",
                contextPathname,
                requestedBy: user.name
              },
              dedupe_key: `adm:${shipment.id}:${exceptionCode}`,
              detected_at: now,
              last_seen_at: now,
              sla_due_at: addHours(priority === "critica" ? 4 : priority === "alta" ? 8 : 12),
              updated_at: now
            },
            { onConflict: "dedupe_key" }
          )
          .select("id")
          .maybeSingle()
      ) as { id: string } | null;

      const incidentId = String(persistedIncident?.id ?? existingIncident?.id ?? createId("inc"));
      const before = buildAuditSnapshot(existingIncident, INCIDENT_AUDIT_FIELDS);
      const afterIncident: LogisticsIncident = {
        id: incidentId,
        orderId: shipment.orderId,
        shipmentId: shipment.id,
        sellerId: shipment.sellerId,
        status: visualStatus,
        priority,
        type: request.payload?.type ?? existingIncident?.type ?? "Acompanhamento manual",
        summary:
          request.payload?.summary ??
          existingIncident?.summary ??
          "Incidente aberto manualmente pelo backoffice.",
        openedAt: now,
        refundId: existingIncident?.refundId
      };

      await updateShipmentOperationalStatus({
        shipment,
        status: "critico",
        note: afterIncident.summary,
        user
      });

      await upsertAdmEntityState({
        entityType: "incident",
        entityId: incidentId,
        sellerId: shipment.sellerId,
        status: visualStatus,
        notes: afterIncident.summary,
        payload: {
          shipmentId: shipment.id,
          orderId: shipment.orderId,
          priority
        },
        user
      });

      await writeAuditLog({
        user,
        entityType: "incident",
        entityId: incidentId,
        actionType: request.type,
        storeId: shipment.sellerId,
        before,
        after: buildAuditSnapshot(afterIncident, INCIDENT_AUDIT_FIELDS),
        summary: "Incidente logistico aberto ou atualizado com escalonamento critico."
      });

      return buildBaseResult(
        request,
        incidentId,
        "Incidente logistico registrado com sucesso.",
        visualStatus,
        revalidatedPaths
      );
    }

    case "document.validate":
    case "document.request-update": {
      const document = data.documents.find((row) => row.id === request.entityId);
      if (!document) throw new AdmActionError("NOT_FOUND", 404, "Documento nao encontrado.");

      const before = buildAuditSnapshot(document, DOCUMENT_AUDIT_FIELDS);
      const visualStatus: AdminVisualStatus =
        request.type === "document.validate" ? "aprovado" : request.payload?.status ?? "em-revisao";

      await upsertComplianceDocument({
        document,
        status: visualStatus,
        contextPathname,
        note:
          request.type === "document.validate"
            ? "Documento validado pelo backoffice."
            : "Documento devolvido para correcao ou nova submissao.",
        user
      });

      const after: Document = {
        ...document,
        status: visualStatus
      };

      await writeAuditLog({
        user,
        entityType: "document",
        entityId: document.id,
        actionType: request.type,
        storeId: document.sellerId,
        before,
        after: buildAuditSnapshot(after, DOCUMENT_AUDIT_FIELDS),
        summary:
          request.type === "document.validate"
            ? "Documento aprovado e seller atualizado na esteira de compliance."
            : "Documento devolvido para correcao ou nova submissao do seller."
      });

      return buildBaseResult(
        request,
        document.id,
        request.type === "document.validate"
          ? "Documento validado."
          : "Nova solicitacao enviada para o documento.",
        visualStatus,
        revalidatedPaths
      );
    }

    case "review.approve":
    case "review.hide": {
      const review = data.reviews.find((row) => row.id === request.entityId);
      if (!review) throw new AdmActionError("NOT_FOUND", 404, "Review nao encontrada.");

      const before = buildAuditSnapshot(review, REVIEW_AUDIT_FIELDS);
      const visualStatus: AdminVisualStatus =
        request.type === "review.approve" ? "aprovado" : request.payload?.status ?? "bloqueado";

      await updateProductReviewModeration({
        review,
        status: visualStatus,
        hidden: request.type !== "review.approve",
        note:
          request.type === "review.approve"
            ? "Review liberada para exibicao publica."
            : "Review ocultada por moderacao editorial.",
        user
      });

      const after: Review = {
        ...review,
        status: visualStatus
      };

      await writeAuditLog({
        user,
        entityType: "review",
        entityId: review.id,
        actionType: request.type,
        storeId: review.sellerId,
        before,
        after: buildAuditSnapshot(after, REVIEW_AUDIT_FIELDS),
        summary:
          request.type === "review.approve"
            ? "Review liberada para exibicao publica na experiencia BelaPop."
            : "Review retirada da vitrine publica por moderacao editorial."
      });

      return buildBaseResult(
        request,
        review.id,
        request.type === "review.approve"
          ? "Review aprovada para exibicao."
          : "Review moderada com sucesso.",
        visualStatus,
        revalidatedPaths
      );
    }
  }
}
