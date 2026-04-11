import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  ActivityLog,
  AdminVisualStatus,
  AuditTrailEntry,
  Customer,
  Document,
  FinancialAlert,
  InternalUser,
  LogisticsIncident,
  Order,
  Payout,
  PriorityLevel,
  Product,
  QualityScore,
  Refund,
  Review,
  Seller,
  Shipment,
  TimePeriod
} from "@/types/adm";
import type { AdmDataSource } from "@/lib/adm/repositories/source.types";

type QueryResult<T> = {
  ok: boolean;
  rows: T[];
};

type AnyRow = Record<string, unknown>;

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const toStringValue = (value: unknown) =>
  typeof value === "string" ? value : value == null ? "" : String(value);

const toNullableString = (value: unknown) => {
  const normalized = toStringValue(value).trim();
  return normalized.length > 0 ? normalized : null;
};

const toNumberValue = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toBooleanValue = (value: unknown) => value === true;

const toDateValue = (value: unknown) => {
  const normalized = toNullableString(value);
  if (!normalized) return null;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toIsoString = (value: unknown, fallback = new Date().toISOString()) =>
  toDateValue(value)?.toISOString() ?? fallback;

const toDateOnly = (value: unknown, fallback = new Date().toISOString().slice(0, 10)) =>
  toIsoString(value, fallback).slice(0, 10);

const toCurrencyValue = (value: unknown) => Number((toNumberValue(value) / 100).toFixed(2));

const toObjectValue = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
};

const toArraySnapshotValue = (value: unknown) =>
  Array.isArray(value)
    ? value
        .map((entry) => {
          if (typeof entry === "string" || typeof entry === "number" || typeof entry === "boolean") {
            return entry;
          }
          return null;
        })
        .filter((entry): entry is string | number | boolean => entry !== null)
    : undefined;

const toAuditSnapshot = (value: unknown) => {
  const source = toObjectValue(value);
  const snapshotEntries: Array<
    [string, string | number | boolean | null | Array<string | number | boolean>]
  > = [];

  Object.entries(source).forEach(([key, entry]) => {
    if (
      entry === null ||
      typeof entry === "string" ||
      typeof entry === "number" ||
      typeof entry === "boolean"
    ) {
      snapshotEntries.push([key, entry]);
      return;
    }

    const arrayValue = toArraySnapshotValue(entry);
    if (arrayValue) {
      snapshotEntries.push([key, arrayValue]);
    }
  });

  const snapshot = Object.fromEntries(snapshotEntries);

  return Object.keys(snapshot).length > 0 ? snapshot : undefined;
};

const normalizeAdminStatus = (
  value: unknown,
  options?: {
    score?: number;
    featured?: boolean;
    blocked?: boolean;
    curated?: boolean;
  }
): AdminVisualStatus => {
  if (options?.blocked) return "bloqueado";
  if (options?.featured) return "destaque";

  const normalized = toStringValue(value).trim().toLowerCase();

  if (["aprovado"].includes(normalized)) return "aprovado";
  if (["em-revisao", "revisao"].includes(normalized)) return "em-revisao";
  if (["pendente"].includes(normalized)) return "pendente";
  if (["reprovado"].includes(normalized)) return "reprovado";
  if (["critico"].includes(normalized)) return "critico";
  if (["alerta"].includes(normalized)) return "alerta";
  if (["resolvido"].includes(normalized)) return "resolvido";
  if (["bloqueado"].includes(normalized)) return "bloqueado";
  if (["premium"].includes(normalized)) return "premium";
  if (["destaque"].includes(normalized)) return "destaque";

  if (["blocked", "suspended", "disabled", "restricted"].includes(normalized)) return "bloqueado";
  if (["premium", "exclusive"].includes(normalized)) return "premium";
  if (["approved", "active", "published", "paid", "delivered", "released"].includes(normalized)) {
    return options?.curated ? "aprovado" : "resolvido";
  }
  if (["review", "processing", "in_analysis", "under_review", "label_created"].includes(normalized)) {
      return "em-revisao";
  }
  if (["pending", "created", "scheduled", "draft"].includes(normalized)) return "pendente";
  if (["rejected", "failed", "cancelled", "canceled", "archived"].includes(normalized)) return "reprovado";
  if (["critical", "returned", "chargeback"].includes(normalized)) return "critico";
  if (["warning", "late", "open", "paused", "refund_pending"].includes(normalized)) return "alerta";
  if (["fulfilled", "completed", "resolved"].includes(normalized)) return "resolvido";

  if (typeof options?.score === "number") {
    if (options.score >= 95) return "premium";
    if (options.score >= 85) return "aprovado";
    if (options.score >= 70) return "em-revisao";
    if (options.score >= 55) return "alerta";
    return "critico";
  }

  return "pendente";
};

const normalizePriority = (value: unknown, score?: number): PriorityLevel => {
  const normalized = toStringValue(value).trim().toLowerCase();
  if (["critical", "critica", "restricted"].includes(normalized)) return "critica";
  if (["high", "alta", "warning"].includes(normalized)) return "alta";
  if (["medium", "media", "moderate"].includes(normalized)) return "media";
  if (["low", "baixa", "premium", "standard"].includes(normalized)) return "baixa";

  if (typeof score === "number") {
    if (score >= 80) return "baixa";
    if (score >= 60) return "media";
    if (score >= 45) return "alta";
    return "critica";
  }

  return "media";
};

const normalizeSentiment = (rating: number): Review["sentiment"] => {
  if (rating <= 2) return "negativo";
  if (rating === 3) return "neutro";
  return "positivo";
};

const normalizeTrend = (score: number): QualityScore["trend"] => {
  if (score >= 90) return "up";
  if (score < 70) return "down";
  return "stable";
};

const normalizePeriod = (start: unknown, end: unknown): TimePeriod => {
  const from = toDateValue(start);
  const to = toDateValue(end);
  if (!from || !to) return "30d";
  const diffDays = Math.max(1, Math.round((to.getTime() - from.getTime()) / DAY_IN_MS) + 1);
  if (diffDays <= 7) return "7d";
  if (diffDays >= 90) return "90d";
  return "30d";
};

const deriveOrderPriority = ({
  orderStatus,
  shipmentStatus,
  alertPriority,
  deadline
}: {
  orderStatus: string;
  shipmentStatus: string;
  alertPriority?: PriorityLevel;
  deadline?: string | null;
}): PriorityLevel => {
  if (alertPriority) return alertPriority;
  if (["canceled", "cancelled", "refunded", "returned"].includes(orderStatus)) return "critica";
  if (["returned", "cancelled", "canceled"].includes(shipmentStatus)) return "critica";
  if (deadline && new Date(deadline).getTime() < Date.now()) return "alta";
  if (["label_created", "pending"].includes(shipmentStatus)) return "media";
  return "baixa";
};

const summarizeReview = (row: AnyRow) => {
  const comment = toNullableString(row.comment) ?? toNullableString(row.body);
  const title = toNullableString(row.title);
  const raw = comment ?? title ?? "Review sem comentario.";
  return raw.length > 140 ? `${raw.slice(0, 137)}...` : raw;
};

const summarizeAlert = (row: AnyRow) =>
  toNullableString(row.body) ?? toNullableString(row.title) ?? toNullableString(row.alert_type) ?? "Alerta financeiro";

const inferIncidentFromShipment = (
  shipment: Shipment,
  order: Order | undefined,
  refund?: Refund
): LogisticsIncident | null => {
  const lastUpdate = new Date(shipment.lastUpdateAt).getTime();
  const eta = new Date(`${shipment.eta}T23:59:59.999Z`).getTime();
  const now = Date.now();

  if (shipment.status === "critico") {
    return {
      id: `inc-${shipment.id}`,
      orderId: shipment.orderId,
      shipmentId: shipment.id,
      sellerId: shipment.sellerId,
      status: "critico",
      priority: "critica",
      type: "Falha de entrega",
      summary: "Envio com excecao critica e risco imediato de escalacao.",
      openedAt: shipment.lastUpdateAt,
      refundId: refund?.id
    };
  }

  if (shipment.status === "alerta" || eta < now) {
    return {
      id: `inc-${shipment.id}`,
      orderId: shipment.orderId,
      shipmentId: shipment.id,
      sellerId: shipment.sellerId,
      status: eta < now ? "critico" : "alerta",
      priority: eta < now ? "critica" : "alta",
      type: "SLA excedido",
      summary: "Prazo logistico ultrapassado ou risco alto de atraso no envio.",
      openedAt: shipment.lastUpdateAt,
      refundId: refund?.id
    };
  }

  if (shipment.status === "pendente" && now - lastUpdate > DAY_IN_MS) {
    return {
      id: `inc-${shipment.id}`,
      orderId: shipment.orderId,
      shipmentId: shipment.id,
      sellerId: shipment.sellerId,
      status: "em-revisao",
      priority: "media",
      type: "Etiqueta sem expedicao",
      summary: "Envio criado sem movimentacao operacional recente.",
      openedAt: shipment.lastUpdateAt,
      refundId: refund?.id
    };
  }

  if (order?.status === "reprovado") {
    return {
      id: `inc-${shipment.id}`,
      orderId: shipment.orderId,
      shipmentId: shipment.id,
      sellerId: shipment.sellerId,
      status: "critico",
      priority: "critica",
      type: "Pedido cancelado em transito",
      summary: "Cancelamento financeiro com operacao logistica ainda aberta.",
      openedAt: shipment.lastUpdateAt,
      refundId: refund?.id
    };
  }

  return null;
};

const safeSelect = async <T>(
  label: string,
  promise: PromiseLike<{ data: T[] | null; error: { message?: string } | null }>
): Promise<QueryResult<T>> => {
  try {
    const { data, error } = await promise;
    if (error) {
      console.warn(`[adm][supabase] ${label} indisponivel: ${error.message ?? "erro desconhecido"}`);
      return { ok: false, rows: [] };
    }
    return { ok: true, rows: (data ?? []) as T[] };
  } catch (error) {
    console.warn(`[adm][supabase] ${label} falhou`, error);
    return { ok: false, rows: [] };
  }
};

type AdmEntityStateRow = {
  entity_type: string;
  entity_id: string;
  seller_id: string | null;
  status: string;
  notes: string | null;
  payload: Record<string, unknown>;
};

const buildEntityStateKey = (entityType: string, entityId: string) => `${entityType}:${entityId}`;

const toEntityStateMap = (rows: AnyRow[]) =>
  new Map<string, AdmEntityStateRow>(
    rows.map((row) => {
      const entityType = toStringValue(row.entity_type);
      const entityId = toStringValue(row.entity_id);

      return [
        buildEntityStateKey(entityType, entityId),
        {
          entity_type: entityType,
          entity_id: entityId,
          seller_id: toNullableString(row.seller_id),
          status: toStringValue(row.status),
          notes: toNullableString(row.notes),
          payload: toObjectValue(row.payload)
        }
      ];
    })
  );

const resolveEntityState = (
  stateMap: Map<string, AdmEntityStateRow>,
  entityType: string,
  entityId: string
) => stateMap.get(buildEntityStateKey(entityType, entityId)) ?? null;

const toRefundVisualStatus = (value: unknown): Refund["status"] => {
  const normalized = toStringValue(value).trim().toLowerCase();
  if (normalized === "requested") return "pendente";
  if (normalized === "approved") return "aprovado";
  if (normalized === "in_transit" || normalized === "received") return "em-revisao";
  if (normalized === "resolved") return "resolvido";
  if (normalized === "rejected") return "reprovado";
  if (normalized === "cancelled" || normalized === "canceled") return "alerta";
  return normalizeAdminStatus(value);
};

const toPayoutVisualStatus = (value: unknown, holdbackCents: unknown): Payout["status"] => {
  const normalized = toStringValue(value).trim().toLowerCase();
  if (normalized === "blocked" || toNumberValue(holdbackCents) > 0) return "bloqueado";
  if (normalized === "scheduled") return "pendente";
  if (normalized === "processing") return "aprovado";
  if (normalized === "paid") return "resolvido";
  if (normalized === "canceled" || normalized === "cancelled" || normalized === "rejected") {
    return "reprovado";
  }
  return normalizeAdminStatus(value);
};

const toIncidentVisualStatus = (status: unknown, severity: unknown): LogisticsIncident["status"] => {
  const normalized = toStringValue(status).trim().toLowerCase();
  if (normalized === "resolved" || normalized === "dismissed") return "resolvido";
  if (normalized === "in_progress") return "em-revisao";
  if (normalized === "escalated") return "critico";
  if (normalized === "open") {
    return toStringValue(severity).trim().toLowerCase() === "critical" ? "critico" : "alerta";
  }

  return normalizeAdminStatus(status);
};

export async function loadSupabaseAdmDataSource(base: AdmDataSource): Promise<AdmDataSource> {
  const pickFirstString = (...values: unknown[]) => {
    for (const value of values) {
      const normalized = toNullableString(value);
      if (normalized) return normalized;
    }

    return null;
  };

  const toRoundedScore = (value: unknown, fallback = 0) => Math.round(toNumberValue(value || fallback));

  const toRiskPriority = (value: unknown, score?: number): PriorityLevel => {
    const normalized = toStringValue(value).trim().toLowerCase();
    if (normalized === "restricted") return "critica";
    if (normalized === "high") return "alta";
    if (normalized === "medium") return "media";
    if (normalized === "low") return "baixa";
    return normalizePriority(value, score);
  };

  const toSellerTier = (value: unknown, score: number): Seller["tier"] => {
    const normalized = toStringValue(value).trim().toLowerCase();
    if (normalized === "premium") return "premium";
    if (normalized === "warning" || normalized === "restricted" || normalized === "standard") return "core";
    return score >= 90 ? "premium" : "core";
  };

  const toCurationStatus = (row: AnyRow, score: number): Product["curationStatus"] => {
    const status = toStringValue(row.status).trim().toLowerCase();
    const curated = toBooleanValue(row.curated);

    if (curated) return "aprovado";
    if (status === "review" || status === "needs_adjustment") return "em-revisao";
    if (status === "draft") return "pendente";
    if (status === "rejected") return "reprovado";
    if (status === "paused") return "alerta";
    if (status === "published") return "aprovado";

    return normalizeAdminStatus(status, {
      score,
      featured: toBooleanValue(row.is_featured),
      curated
    });
  };

  const deriveDatePlusDays = (value: unknown, days: number) => {
    const reference = toDateValue(value) ?? new Date();
    reference.setUTCDate(reference.getUTCDate() + days);
    return reference.toISOString().slice(0, 10);
  };

  const inferInternalArea = (email: string | null, actorRole: string | null) => {
    const source = `${email ?? ""} ${actorRole ?? ""}`.toLowerCase();
    if (source.includes("curadoria")) return "Curadoria";
    if (source.includes("finan")) return "Financeiro";
    if (source.includes("logist")) return "Operacao";
    if (source.includes("compl")) return "Compliance";
    if (source.includes("catalog")) return "Catalogo e Marca";
    if (source.includes("operac")) return "Operacao";
    return "Backoffice";
  };

  const getProfileDisplayName = (
    profileMap: Record<string, { name: string; email: string | null; role: string | null }>,
    profileId: string | null,
    fallbackPrefix: string
  ) => {
    if (!profileId) return `${fallbackPrefix} sem identificacao`;
    const profile = profileMap[profileId];
    if (profile?.name) return profile.name;
    if (profile?.email) return profile.email.split("@")[0] ?? `${fallbackPrefix} ${profileId.slice(0, 8)}`;
    return `${fallbackPrefix} ${profileId.slice(0, 8)}`;
  };

  try {
    const supabase = getSupabaseAdminClient();

    const [
      sellerRowsResult,
      sellerScoresResult,
      sellerRiskResult,
      productRowsResult,
      productScoresResult,
      orderRowsResult,
      sellerOrderRowsResult,
      orderItemRowsResult,
      shipmentRowsResult,
      sellerPayoutRowsResult,
      returnRequestRowsResult,
      logisticsExceptionRowsResult,
      financeAlertRowsResult,
      productReviewRowsResult,
      complianceDocumentRowsResult,
      admEntityStateRowsResult,
      auditLogRowsResult,
      profileRowsResult
    ] = await Promise.all([
      safeSelect<AnyRow>("sellers", supabase.from("sellers").select("*")),
      safeSelect<AnyRow>("seller_scores", supabase.from("seller_scores").select("*")),
      safeSelect<AnyRow>("seller_risk_profiles", supabase.from("seller_risk_profiles").select("*")),
      safeSelect<AnyRow>("products", supabase.from("products").select("*")),
      safeSelect<AnyRow>("product_scores", supabase.from("product_scores").select("*")),
      safeSelect<AnyRow>("orders", supabase.from("orders").select("*")),
      safeSelect<AnyRow>("seller_orders", supabase.from("seller_orders").select("*")),
      safeSelect<AnyRow>("order_items", supabase.from("order_items").select("*")),
      safeSelect<AnyRow>("shipments", supabase.from("shipments").select("*")),
      safeSelect<AnyRow>("seller_payouts", supabase.from("seller_payouts").select("*")),
      safeSelect<AnyRow>("return_requests", supabase.from("return_requests").select("*")),
      safeSelect<AnyRow>("logistics_exceptions", supabase.from("logistics_exceptions").select("*")),
      safeSelect<AnyRow>("finance_ops_alerts", supabase.from("finance_ops_alerts").select("*")),
      safeSelect<AnyRow>("product_reviews", supabase.from("product_reviews").select("*")),
      safeSelect<AnyRow>("compliance_documents", supabase.from("compliance_documents").select("*")),
      safeSelect<AnyRow>("adm_entity_states", supabase.from("adm_entity_states").select("*")),
      safeSelect<AnyRow>("audit_log", supabase.from("audit_log").select("*")),
      safeSelect<AnyRow>("profiles", supabase.from("profiles").select("*"))
    ]);

    const baseCustomersById = Object.fromEntries(base.customers.map((customer) => [customer.id, customer]));
    const baseInternalUsersById = Object.fromEntries(base.internalUsers.map((user) => [user.id, user]));
    const baseProductsById = Object.fromEntries(base.products.map((product) => [product.id, product]));
    const baseSellersById = Object.fromEntries(base.sellers.map((seller) => [seller.id, seller]));

    const profileMap = Object.fromEntries(
      profileRowsResult.rows.map((row) => {
        const id = toStringValue(row.id);

        return [
          id,
          {
            id,
            name:
              pickFirstString(row.full_name, row.name, row.email, `Perfil ${id.slice(0, 8)}`) ??
              `Perfil ${id.slice(0, 8)}`,
            email: pickFirstString(row.email),
            role: pickFirstString(row.role)
          }
        ];
      })
    );

    const sellerScoreMap = Object.fromEntries(
      sellerScoresResult.rows.map((row) => [toStringValue(row.seller_id), row])
    );
    const sellerRiskMap = Object.fromEntries(
      sellerRiskResult.rows.map((row) => [toStringValue(row.seller_id), row])
    );
    const productScoreMap = Object.fromEntries(
      productScoresResult.rows.map((row) => [toStringValue(row.product_id), row])
    );
    const rawOrderMap = Object.fromEntries(orderRowsResult.rows.map((row) => [toStringValue(row.id), row]));
    const rawSellerOrderMap = Object.fromEntries(
      sellerOrderRowsResult.rows.map((row) => [toStringValue(row.id), row])
    );
    const admEntityStateMap = toEntityStateMap(admEntityStateRowsResult.rows);

    const rawOrderItemsBySellerOrderId = new Map<string, AnyRow[]>();
    const rawOrderItemsByOrderId = new Map<string, AnyRow[]>();

    orderItemRowsResult.rows.forEach((row) => {
      const sellerOrderId = toNullableString(row.seller_order_id);
      if (sellerOrderId) {
        rawOrderItemsBySellerOrderId.set(sellerOrderId, [
          ...(rawOrderItemsBySellerOrderId.get(sellerOrderId) ?? []),
          row
        ]);
      }

      const orderId = toStringValue(row.order_id);
      rawOrderItemsByOrderId.set(orderId, [...(rawOrderItemsByOrderId.get(orderId) ?? []), row]);
    });

    const mappedFinancialAlerts: FinancialAlert[] =
      financeAlertRowsResult.ok && financeAlertRowsResult.rows.length > 0
        ? financeAlertRowsResult.rows.map((row) => {
            const payload = toObjectValue(row.payload);
            const severity = toNullableString(row.severity);

            return {
              id: toStringValue(row.id),
              sellerId: pickFirstString(row.seller_id, payload.seller_id, payload.store_id) ?? "",
              orderId: pickFirstString(payload.seller_order_id, payload.order_id, payload.sub_order_id) ?? undefined,
              payoutId: pickFirstString(payload.seller_payout_id, payload.payout_id) ?? undefined,
              refundId: pickFirstString(payload.refund_id, payload.refund_request_id) ?? undefined,
              status: normalizeAdminStatus(row.status ?? severity),
              priority: severity === "critical" ? "critica" : severity === "warn" ? "alta" : "media",
              type:
                pickFirstString(row.alert_type, row.title, "Alerta financeiro") ?? "Alerta financeiro",
              summary: summarizeAlert(row),
              createdAt: toIsoString(row.created_at)
            };
          })
        : [];

    const financialAlertByOrderId = new Map<string, FinancialAlert>();
    mappedFinancialAlerts.forEach((alert) => {
      if (alert.orderId && !financialAlertByOrderId.has(alert.orderId)) {
        financialAlertByOrderId.set(alert.orderId, alert);
      }
    });

    const mappedProducts: Product[] =
      productRowsResult.ok && productRowsResult.rows.length > 0
        ? productRowsResult.rows.map((row) => {
            const id = toStringValue(row.id);
            const scoreRow = productScoreMap[id];
            const qualityScore = toRoundedScore(
              scoreRow?.final_score,
              baseProductsById[id]?.qualityScore ?? 0
            );
            const featured =
              toBooleanValue(row.is_featured) || toBooleanValue(scoreRow?.eligible_featured);
            const status = normalizeAdminStatus(row.status, {
              score: qualityScore,
              featured,
              curated: toBooleanValue(row.curated)
            });

            return {
              id,
              sellerId: toStringValue(row.seller_id),
              name:
                pickFirstString(row.name, row.slug, `Produto ${id.slice(0, 8)}`) ??
                `Produto ${id.slice(0, 8)}`,
              category: pickFirstString(row.category, "Sem categoria") ?? "Sem categoria",
              price: toCurrencyValue(row.price_cents),
              status,
              curationStatus: toCurationStatus(row, qualityScore),
              qualityScore,
              featured,
              stock: Math.max(0, Math.round(toNumberValue(row.stock_quantity)))
            };
          })
        : [];

    const productsBySellerId = mappedProducts.reduce<Record<string, Product[]>>((accumulator, product) => {
      accumulator[product.sellerId] = [...(accumulator[product.sellerId] ?? []), product];
      return accumulator;
    }, {});

    const rawSellerOrderByParentOrderSellerKey = sellerOrderRowsResult.rows.reduce<Record<string, AnyRow>>(
      (accumulator, row) => {
        const parentOrderId = toStringValue(row.order_id);
        const sellerId = toStringValue(row.seller_id);

        accumulator[`${parentOrderId}:${sellerId}`] = row;
        if (!accumulator[`${parentOrderId}:*`]) accumulator[`${parentOrderId}:*`] = row;
        return accumulator;
      },
      {}
    );

    const mappedShipments: Shipment[] =
      shipmentRowsResult.ok && shipmentRowsResult.rows.length > 0
        ? shipmentRowsResult.rows
            .map((row) => {
              const parentOrderId = toStringValue(row.order_id);
              const sellerId =
                pickFirstString(
                  row.seller_id,
                  rawSellerOrderByParentOrderSellerKey[`${parentOrderId}:*`]?.seller_id,
                  rawOrderItemsByOrderId.get(parentOrderId)?.[0]?.seller_id
                ) ?? "";
              const sellerOrder =
                rawSellerOrderByParentOrderSellerKey[`${parentOrderId}:${sellerId}`] ??
                rawSellerOrderByParentOrderSellerKey[`${parentOrderId}:*`];
              const shipmentId = toStringValue(row.id);

              return {
                id: shipmentId,
                orderId: sellerOrder ? toStringValue(sellerOrder.id) : parentOrderId,
                sellerId,
                carrier:
                  pickFirstString(
                    row.carrier,
                    row.shipping_carrier,
                    row.service,
                    row.method,
                    sellerOrder?.shipping_method,
                    "Transportadora"
                  ) ?? "Transportadora",
                trackingCode:
                  pickFirstString(
                    row.tracking_code,
                    row.tracking_number,
                    row.code,
                    sellerOrder?.tracking_code,
                    `TRK-${shipmentId.slice(0, 8)}`
                  ) ?? `TRK-${shipmentId.slice(0, 8)}`,
                status: normalizeAdminStatus(
                  row.operational_status ?? row.status ?? row.shipping_status
                ),
                eta: toDateOnly(
                  row.estimated_delivery_at ?? row.eta ?? row.delivered_at ?? row.shipped_at,
                  deriveDatePlusDays(row.created_at, 3)
                ),
                lastUpdateAt: toIsoString(
                  row.operational_updated_at ??
                    row.updated_at ??
                    row.last_update_at ??
                    row.delivered_at ??
                    row.shipped_at ??
                    row.created_at
                )
              };
            })
            .filter((shipment) => shipment.orderId.length > 0 && shipment.sellerId.length > 0)
        : [];

    const shipmentByOrderId = mappedShipments.reduce<Record<string, Shipment>>((accumulator, shipment) => {
      accumulator[shipment.orderId] = shipment;
      return accumulator;
    }, {});

    const mappedOrders: Order[] =
      sellerOrderRowsResult.ok && sellerOrderRowsResult.rows.length > 0
        ? sellerOrderRowsResult.rows.map((row) => {
            const id = toStringValue(row.id);
            const parentOrder = rawOrderMap[toStringValue(row.order_id)];
            const orderItems = rawOrderItemsBySellerOrderId.get(id) ?? [];
            const firstItem = orderItems[0];
            const shipment = shipmentByOrderId[id];
            const alert =
              financialAlertByOrderId.get(id) ??
              financialAlertByOrderId.get(toStringValue(row.order_id));
            const fallbackEta = deriveDatePlusDays(row.created_at ?? parentOrder?.created_at, 3);

            return {
              id,
              customerId: pickFirstString(parentOrder?.customer_id) ?? "",
              sellerId: toStringValue(row.seller_id),
              productId:
                pickFirstString(
                  firstItem?.product_id,
                  rawOrderItemsByOrderId.get(toStringValue(row.order_id))?.[0]?.product_id
                ) ?? "",
              shipmentId: shipment?.id ?? "",
              status: normalizeAdminStatus(row.status),
              logisticsStatus: shipment?.status ?? normalizeAdminStatus(row.status),
              priority: deriveOrderPriority({
                orderStatus: toStringValue(row.status).trim().toLowerCase(),
                shipmentStatus: shipment ? shipment.status : toStringValue(row.status).trim().toLowerCase(),
                alertPriority: alert?.priority,
                deadline: shipment?.eta ?? fallbackEta
              }),
              total: toCurrencyValue(toNumberValue(row.items_total_cents) + toNumberValue(row.shipping_cents)),
              createdAt: toIsoString(row.created_at ?? parentOrder?.created_at),
              eta: shipment?.eta ?? fallbackEta
            };
          })
        : [];

    const mappedRefundsFromReturnRequests: Refund[] =
      returnRequestRowsResult.ok && returnRequestRowsResult.rows.length > 0
        ? returnRequestRowsResult.rows.map((row) => {
            const metadata = toObjectValue(row.metadata);
            const sellerOrderId =
              pickFirstString(row.sub_order_id, row.seller_order_id, row.order_id) ?? "";
            const order =
              mappedOrders.find((entry) => entry.id === sellerOrderId) ??
              mappedOrders.find((entry) => entry.id === toStringValue(row.order_id));
            const amountCents = toNumberValue(
              metadata.refund_amount_cents ??
                metadata.refund_cents ??
                metadata.amount_cents ??
                metadata.requested_amount_cents
            );

            return {
              id: toStringValue(row.id),
              orderId: sellerOrderId,
              sellerId: toStringValue(row.seller_id),
              customerId: pickFirstString(row.customer_id, order?.customerId) ?? "",
              amount: amountCents > 0 ? toCurrencyValue(amountCents) : order?.total ?? 0,
              reason:
                pickFirstString(row.reason, metadata.reason, metadata.refund_reason, row.request_type) ??
                "Ajuste financeiro",
              status: toRefundVisualStatus(row.status),
              requestedAt: toIsoString(row.created_at),
              logisticsIncidentId: undefined
            };
          })
        : [];

    const mappedRefundsFromAlerts = mappedFinancialAlerts
      .map<Refund | null>((alert) => {
        const rawAlert = financeAlertRowsResult.rows.find((row) => toStringValue(row.id) === alert.id);
        const payload = toObjectValue(rawAlert?.payload);
        const refundId = alert.refundId ?? pickFirstString(payload.refund_id, payload.refund_request_id);
        const amountCents = toNumberValue(
          payload.refund_amount_cents ?? payload.refund_cents ?? payload.amount_cents
        );
        const orderReference = alert.orderId;
        const order = orderReference ? mappedOrders.find((entry) => entry.id === orderReference) : undefined;

        if (!refundId || !orderReference || amountCents <= 0) return null;

        return {
          id: refundId,
          orderId: orderReference,
          sellerId: alert.sellerId,
          customerId: order?.customerId ?? "",
          amount: toCurrencyValue(amountCents),
          reason: pickFirstString(payload.reason, payload.refund_reason, alert.type) ?? alert.type,
          status: (
            alert.status === "resolvido"
              ? "resolvido"
              : alert.status === "critico"
                ? "pendente"
                : "em-revisao"
          ) as Refund["status"],
          requestedAt: alert.createdAt,
          logisticsIncidentId: undefined
        };
      })
      .filter((entry): entry is Refund => entry !== null);

    const mappedRefunds =
      mappedRefundsFromReturnRequests.length > 0
        ? mappedRefundsFromReturnRequests
        : mappedRefundsFromAlerts;

    const refundByOrderId = Object.fromEntries(mappedRefunds.map((refund) => [refund.orderId, refund]));

    const mappedIncidentsFromExceptions: LogisticsIncident[] =
      logisticsExceptionRowsResult.ok && logisticsExceptionRowsResult.rows.length > 0
        ? logisticsExceptionRowsResult.rows.map((row) => {
            const payload = toObjectValue(row.payload);
            const sellerOrderId =
              pickFirstString(row.sub_order_id, payload.seller_order_id, payload.sub_order_id) ?? "";
            const shipment =
              mappedShipments.find((entry) => entry.orderId === sellerOrderId) ??
              mappedShipments.find(
                (entry) => entry.id === (pickFirstString(payload.shipment_id) ?? "")
              );
            const refund = sellerOrderId ? refundByOrderId[sellerOrderId] : undefined;

            return {
              id: toStringValue(row.id),
              orderId: sellerOrderId,
              shipmentId: shipment?.id ?? "",
              sellerId: toStringValue(row.seller_id),
              status: toIncidentVisualStatus(row.status, row.severity),
              priority: normalizePriority(row.severity),
              type: pickFirstString(row.exception_code, payload.type, "Excecao logistica") ?? "Excecao logistica",
              summary:
                pickFirstString(payload.summary, payload.message, payload.reason, row.exception_code) ??
                "Excecao logistica em acompanhamento.",
              openedAt: toIsoString(row.detected_at ?? row.created_at),
              refundId: refund?.id
            };
          })
        : [];

    const mappedIncidents: LogisticsIncident[] =
      mappedIncidentsFromExceptions.length > 0
        ? mappedIncidentsFromExceptions
        : mappedShipments.length > 0
          ? mappedShipments
              .map((shipment) =>
                inferIncidentFromShipment(
                  shipment,
                  mappedOrders.find((order) => order.id === shipment.orderId),
                  refundByOrderId[shipment.orderId]
                )
              )
              .filter((incident): incident is LogisticsIncident => Boolean(incident))
          : [];

    const mappedPayouts: Payout[] =
      sellerPayoutRowsResult.ok && sellerPayoutRowsResult.rows.length > 0
        ? sellerPayoutRowsResult.rows.map((row) => {
            const id = toStringValue(row.id);
            const relatedOrderIds = sellerOrderRowsResult.rows
              .filter((sellerOrder) => toStringValue(sellerOrder.seller_payout_id) === id)
              .map((sellerOrder) => toStringValue(sellerOrder.id));

            return {
              id,
              sellerId: toStringValue(row.seller_id),
              orderIds: relatedOrderIds,
              period: normalizePeriod(row.period_start, row.period_end),
              grossAmount: toCurrencyValue(row.gross_payout_cents),
              netAmount: toCurrencyValue(
                row.net_after_holdback_cents ?? row.net_payout_cents ?? row.gross_payout_cents
              ),
              status: toPayoutVisualStatus(row.status, row.holdback_cents),
              scheduledAt: toDateOnly(row.scheduled_at ?? row.period_end ?? row.created_at)
            };
          })
        : [];

    const mappedSellers: Seller[] =
      sellerRowsResult.ok && sellerRowsResult.rows.length > 0
        ? sellerRowsResult.rows.map((row) => {
            const id = toStringValue(row.id);
            const scoreRow = sellerScoreMap[id];
            const riskRow = sellerRiskMap[id];
            const qualityScore = toRoundedScore(
              scoreRow?.final_score,
              baseSellersById[id]?.qualityScore ?? 0
            );
            const tier = toSellerTier(scoreRow?.exposure_tier, qualityScore);
            const blocked =
              toBooleanValue(riskRow?.payouts_blocked) ||
              toStringValue(scoreRow?.exposure_tier).trim().toLowerCase() === "restricted";

            return {
              id,
              name:
                pickFirstString(
                  row.store_name,
                  row.name,
                  profileMap[toStringValue(row.user_id)]?.name,
                  `Seller ${id.slice(0, 8)}`
                ) ?? `Seller ${id.slice(0, 8)}`,
              category:
                pickFirstString(
                  row.category,
                  productsBySellerId[id]?.[0]?.category,
                  baseSellersById[id]?.category,
                  "Sem categoria"
                ) ?? "Sem categoria",
              tier,
              status: normalizeAdminStatus(row.status ?? scoreRow?.exposure_tier, {
                score: qualityScore,
                featured: tier === "premium",
                blocked
              }),
              riskLevel: toRiskPriority(riskRow?.risk_tier, toNumberValue(riskRow?.risk_score)),
              qualityScore,
              activeProducts: productsBySellerId[id]?.filter((product) => product.status !== "bloqueado").length ?? 0,
              gmv30d: Number(
                mappedOrders
                  .filter((order) => order.sellerId === id)
                  .reduce((sum, order) => sum + order.total, 0)
                  .toFixed(2)
              ),
              pendingDocuments: base.documents.filter(
                (document) => document.sellerId === id && document.status !== "aprovado"
              ).length
            };
          })
        : [];

    const mappedReviews: Review[] =
      productReviewRowsResult.ok && productReviewRowsResult.rows.length > 0
        ? productReviewRowsResult.rows.map((row) => {
            const productId = toStringValue(row.product_id);
            const product = mappedProducts.find((entry) => entry.id === productId);
            const rating = Math.max(1, Math.min(5, Math.round(toNumberValue(row.rating))));
            const reviewId = toStringValue(row.id);
            const moderationStatus = toNullableString(row.moderation_status);
            const isHidden = toBooleanValue(row.is_hidden);
            const derivedStatus: Review["status"] =
              rating <= 2
                ? "critico"
                : rating === 3
                  ? "alerta"
                  : toBooleanValue(row.is_verified)
                    ? "premium"
                    : "aprovado";

            return {
              id: reviewId,
              productId,
              sellerId: product?.sellerId ?? "",
              customerId: toStringValue(row.user_id),
              rating,
              status: moderationStatus
                ? normalizeAdminStatus(moderationStatus)
                : isHidden
                  ? "bloqueado"
                  : derivedStatus,
              sentiment: normalizeSentiment(rating),
              excerpt: summarizeReview(row),
              createdAt: toIsoString(row.created_at)
            };
          })
        : [];

    const mappedDocuments: Document[] =
      complianceDocumentRowsResult.ok && complianceDocumentRowsResult.rows.length > 0
        ? complianceDocumentRowsResult.rows.map((row) => ({
            id: toStringValue(row.id),
            sellerId: toStringValue(row.seller_id),
            type:
              pickFirstString(row.document_type, row.type, toObjectValue(row.metadata).document_type, "Documento") ??
              "Documento",
            status: normalizeAdminStatus(row.status),
            dueDate: toDateOnly(row.due_date ?? row.reviewed_at ?? row.created_at),
            owner:
              pickFirstString(row.owner_area, row.owner, toObjectValue(row.metadata).owner_area, "Compliance") ??
              "Compliance"
          }))
        : base.documents;

    const auditEntriesFromSupabase: AuditTrailEntry[] =
      auditLogRowsResult.ok && auditLogRowsResult.rows.length > 0
        ? auditLogRowsResult.rows.map((row) => {
            const actorUserId = pickFirstString(row.actor_user_id, "system") ?? "system";
            const action = pickFirstString(row.action, row.permission_used, "system.event") ?? "system.event";

            return {
              id: toStringValue(row.id),
              userId: actorUserId,
              entityType: pickFirstString(row.entity_type, "entity") ?? "entity",
              entityId: pickFirstString(row.entity_id, "sem-id") ?? "sem-id",
              actionType: pickFirstString(row.permission_used, action) ?? action,
              actionLabel: action,
              status: normalizeAdminStatus(row.action ?? row.permission_used),
              createdAt: toIsoString(row.occurred_at),
              contextPathname: undefined,
              summary: pickFirstString(row.notes) ?? undefined,
              before: toAuditSnapshot(row.before_data),
              after: toAuditSnapshot(row.after_data),
              metadata: toAuditSnapshot({
                actor_role: toNullableString(row.actor_role),
                request_id: toNullableString(row.request_id),
                store_id: toNullableString(row.store_id),
                permission_used: toNullableString(row.permission_used)
              })
            };
          })
        : [];

    const mappedActivityLogs: ActivityLog[] = auditEntriesFromSupabase.map((entry) => ({
      id: entry.id,
      userId: entry.userId,
      entityType: entry.entityType,
      entityId: entry.entityId,
      action: entry.actionLabel,
      status: entry.status,
      createdAt: entry.createdAt
    }));

    const adminProfileIds = new Set(
      profileRowsResult.rows
        .filter((row) => toStringValue(row.role).trim().toLowerCase() === "admin")
        .map((row) => toStringValue(row.id))
    );

    auditLogRowsResult.rows.forEach((row) => {
      const actorUserId = toNullableString(row.actor_user_id);
      if (actorUserId) adminProfileIds.add(actorUserId);
    });

    const mappedInternalUsers: InternalUser[] = Array.from(adminProfileIds).map((userId) => {
      const profile = profileMap[userId];
      const latestAudit = auditLogRowsResult.rows
        .filter((row) => toStringValue(row.actor_user_id) === userId)
        .sort(
          (left, right) =>
            new Date(toIsoString(right.occurred_at)).getTime() - new Date(toIsoString(left.occurred_at)).getTime()
        )[0];
      const actorRole = pickFirstString(
        latestAudit?.actor_role,
        profile?.role,
        baseInternalUsersById[userId]?.role,
        "Administrador"
      );

      return {
        id: userId,
        name:
          profile?.name ??
          baseInternalUsersById[userId]?.name ??
          `Usuario ${userId.slice(0, 8)}`,
        role: actorRole ?? "Administrador",
        area: inferInternalArea(profile?.email ?? null, actorRole ?? null),
        status:
          actorRole?.toLowerCase().includes("master") || profile?.email?.includes("master")
            ? "premium"
            : "aprovado",
        lastAccessAt: toIsoString(latestAudit?.occurred_at ?? new Date().toISOString())
      };
    });

    const customerIds = new Set<string>();
    mappedOrders.forEach((order) => {
      if (order.customerId) customerIds.add(order.customerId);
    });
    mappedReviews.forEach((review) => {
      if (review.customerId) customerIds.add(review.customerId);
    });

    const mappedCustomers: Customer[] = Array.from(customerIds).map((customerId) => {
      const profile = profileMap[customerId];
      const customerOrders = mappedOrders.filter((order) => order.customerId === customerId);
      const ltv = Number(customerOrders.reduce((sum, order) => sum + order.total, 0).toFixed(2));
      const riskFlag =
        customerOrders.some((order) => order.status === "critico" || order.priority === "critica") ||
        baseCustomersById[customerId]?.riskFlag === true;
      const segment: Customer["segment"] = ltv >= 1500 ? "premium" : "standard";

      return {
        id: customerId,
        name:
          profile?.name ??
          baseCustomersById[customerId]?.name ??
          getProfileDisplayName(profileMap, customerId, "Cliente"),
        segment,
        status: riskFlag ? "alerta" : segment === "premium" ? "premium" : "aprovado",
        ltv,
        openTickets: baseCustomersById[customerId]?.openTickets ?? 0,
        riskFlag
      };
    });

    const mappedQualityScores: QualityScore[] =
      sellerScoresResult.ok && sellerScoresResult.rows.length > 0
        ? sellerScoresResult.rows.map((row) => {
            const score = toRoundedScore(row.final_score);

            return {
              id: `seller-score-${toStringValue(row.seller_id)}`,
              sellerId: toStringValue(row.seller_id),
              score,
              status: normalizeAdminStatus(row.exposure_tier, { score }),
              trend: normalizeTrend(score),
              updatedAt: toIsoString(row.computed_at)
            };
          })
        : [];

    const resolvedProducts =
      mappedProducts.length > 0
        ? mappedProducts.map((product) => {
            const state = resolveEntityState(admEntityStateMap, "product", product.id);
            if (!state) return product;

            const nextStatus = normalizeAdminStatus(state.status);
            return {
              ...product,
              status: nextStatus,
              curationStatus: nextStatus
            };
          })
        : base.products;

    const resolvedShipments =
      mappedShipments.length > 0
        ? mappedShipments
        : base.shipments;

    const resolvedOrders =
      mappedOrders.length > 0
        ? mappedOrders.map((order) => {
            const shipment = resolvedShipments.find((entry) => entry.id === order.shipmentId);
            const nextStatus: AdminVisualStatus =
              order.status === "critico" || shipment?.status === "critico" ? "critico" : order.status;
            return shipment
              ? {
                  ...order,
                  logisticsStatus: shipment.status,
                  status: nextStatus
                }
              : order;
          })
        : base.orders;

    const resolvedRefundsBase = (mappedRefunds.length > 0 ? mappedRefunds : base.refunds).map((refund) => {
      const logisticsIncident = mappedIncidents.find((incident) => incident.orderId === refund.orderId);

      return {
        ...refund,
        status: refund.status,
        logisticsIncidentId: logisticsIncident?.id ?? refund.logisticsIncidentId
      };
    });

    const resolvedIncidents =
      (mappedIncidents.length > 0 ? mappedIncidents : base.logisticsIncidents).map((incident) => {
        const state = resolveEntityState(admEntityStateMap, "incident", incident.id);
        return state
          ? {
              ...incident,
              status: normalizeAdminStatus(state.status)
            }
          : incident;
      });

    const resolvedPayouts =
      mappedPayouts.length > 0 ? mappedPayouts : base.payouts;

    const resolvedDocuments = mappedDocuments;

    const resolvedReviews = mappedReviews.length > 0 ? mappedReviews : base.reviews;

    const resolvedSellers =
      (mappedSellers.length > 0 ? mappedSellers : base.sellers).map((seller) => {
        const state = resolveEntityState(admEntityStateMap, "seller", seller.id);
        return {
          ...seller,
          status: state ? normalizeAdminStatus(state.status) : seller.status,
          activeProducts: resolvedProducts.filter(
            (product) => product.sellerId === seller.id && product.status !== "bloqueado"
          ).length,
          pendingDocuments: resolvedDocuments.filter(
            (document) => document.sellerId === seller.id && document.status !== "aprovado"
          ).length
        };
      });

    return {
      ...base,
      sellers: resolvedSellers,
      products: resolvedProducts,
      curationStatuses: base.curationStatuses,
      curationRules: base.curationRules,
      orders: resolvedOrders,
      shipments: resolvedShipments,
      logisticsIncidents: resolvedIncidents,
      payouts: resolvedPayouts,
      refunds: resolvedRefundsBase,
      financialAlerts: mappedFinancialAlerts.length > 0 ? mappedFinancialAlerts : base.financialAlerts,
      customers: mappedCustomers.length > 0 ? mappedCustomers : base.customers,
      reviews: resolvedReviews,
      documents: resolvedDocuments,
      complianceFlags: base.complianceFlags,
      campaigns: base.campaigns,
      internalUsers: mappedInternalUsers.length > 0 ? mappedInternalUsers : base.internalUsers,
      platformSettings: base.platformSettings,
      activityLogs: mappedActivityLogs.length > 0 ? mappedActivityLogs : base.activityLogs,
      auditTrail: auditEntriesFromSupabase.length > 0 ? auditEntriesFromSupabase : base.auditTrail,
      qualityScores: mappedQualityScores.length > 0 ? mappedQualityScores : base.qualityScores
    };
  } catch (error) {
    console.warn("[adm][supabase] fallback para mockData por falha no adapter", error);
    return base;
  }
}
