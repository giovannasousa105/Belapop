import "server-only";

import { createHash } from "node:crypto";

import { buildDeterministicKey } from "@/lib/events/platformEventBus";
import { Address } from "@/lib/types";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type CheckoutPaymentMethodPreference = "automatic" | "cartao" | "pix" | "boleto";
export type CheckoutAvailablePaymentMethod = "cartao" | "pix" | "boleto";
export type CheckoutSessionStatus =
  | "draft_created"
  | "payment_intent_created"
  | "processing"
  | "requires_action"
  | "requires_payment_method"
  | "requires_confirmation"
  | "succeeded"
  | "failed"
  | "canceled"
  | "refunded"
  | "chargeback"
  | "risk_blocked"
  | "rate_limited";

export type CheckoutRequestMeta = {
  ipAddress: string | null;
  userAgent: string | null;
  deviceFingerprint: string | null;
};

export type CheckoutRiskAssessment = {
  score: number;
  tier: "low" | "medium" | "high" | "blocked";
  flags: string[];
  blocked: boolean;
  rateLimited: boolean;
  recentAttemptsByUser: number;
  recentAttemptsByIp: number;
  chargebackCount: number;
};

type SessionDraftInput = {
  customerId: string;
  orderId: string;
  idempotencyKey: string;
  cartHash: string;
  addressHash: string;
  paymentMethodPreference: CheckoutPaymentMethodPreference;
  currency: string;
  meta: CheckoutRequestMeta;
  risk: CheckoutRiskAssessment;
  pricingSnapshot: Record<string, unknown>;
  shippingSnapshot: Record<string, unknown>;
};

type SessionReservationInput = {
  customerId: string;
  idempotencyKey: string;
  cartHash: string;
  addressHash: string;
  paymentMethodPreference: CheckoutPaymentMethodPreference;
  currency: string;
  meta: CheckoutRequestMeta;
};

const ACTIVE_SESSION_STATUSES = [
  "draft_created",
  "payment_intent_created",
  "processing",
  "requires_action",
  "requires_payment_method",
  "requires_confirmation"
] as const;

const MISSING_TABLE_ERROR_CODES = new Set(["42P01", "42703", "PGRST204", "PGRST205"]);
const IDEMPOTENCY_WINDOW_MINUTES = 15;
const RISK_WINDOW_MINUTES = 10;

const normalizeText = (value: string | null | undefined) =>
  String(value ?? "").trim().toLowerCase();

const sanitizeZip = (value: string | null | undefined) => String(value ?? "").replace(/\D/g, "");
const sanitizeIp = (value: string | null | undefined) => {
  const raw = String(value ?? "").split(",")[0]?.trim() ?? "";
  return raw || null;
};

const hashJson = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");

const isMissingCheckoutSessionError = (error: { code?: string | null; message?: string | null } | null) => {
  if (!error) return false;
  if (error.code && MISSING_TABLE_ERROR_CODES.has(error.code)) return true;
  const message = String(error.message ?? "").toLowerCase();
  return message.includes("checkout_payment_sessions");
};

const buildAddressShape = (address: Address) => ({
  full_name: normalizeText(address.fullName),
  street: normalizeText(address.street),
  number: normalizeText(address.number),
  city: normalizeText(address.city),
  state: normalizeText(address.state),
  zip: sanitizeZip(address.zip),
  complement: normalizeText(address.complement)
});

const buildCartShape = (items: Array<{ productId: string; quantity: number }>) =>
  [...items]
    .map((item) => ({
      product_id: normalizeText(item.productId),
      quantity: Math.max(1, Math.floor(Number(item.quantity ?? 0)))
    }))
    .sort((left, right) => left.product_id.localeCompare(right.product_id));

export const buildCheckoutCartHash = (items: Array<{ productId: string; quantity: number }>) =>
  hashJson(buildCartShape(items));

export const buildCheckoutAddressHash = (address: Address) => hashJson(buildAddressShape(address));

export const buildCheckoutIdempotencyKey = (input: {
  customerId: string;
  currency: string;
  paymentMethodPreference: CheckoutPaymentMethodPreference;
  cartHash: string;
  addressHash: string;
}) => {
  const bucket = Math.floor(Date.now() / (IDEMPOTENCY_WINDOW_MINUTES * 60 * 1000));
  return buildDeterministicKey([
    "checkout.payment_intent",
    input.customerId,
    normalizeText(input.currency),
    input.paymentMethodPreference,
    input.cartHash,
    input.addressHash,
    String(bucket)
  ]);
};

export const extractCheckoutRequestMeta = (request: Request): CheckoutRequestMeta => ({
  ipAddress:
    sanitizeIp(request.headers.get("x-real-ip")) ??
    sanitizeIp(request.headers.get("x-forwarded-for")) ??
    sanitizeIp(request.headers.get("cf-connecting-ip")),
  userAgent: request.headers.get("user-agent")?.trim() || null,
  deviceFingerprint:
    request.headers.get("x-device-fingerprint")?.trim() ||
    request.headers.get("x-device-id")?.trim() ||
    null
});

export const mapStripePaymentMethodTypes = (
  paymentMethodTypes: string[] | null | undefined
): CheckoutAvailablePaymentMethod[] => {
  const normalized = new Set<string>((paymentMethodTypes ?? []).map((item) => normalizeText(item)));
  const result = new Set<CheckoutAvailablePaymentMethod>();

  if (normalized.has("card") || normalized.has("link")) result.add("cartao");
  if (normalized.has("pix")) result.add("pix");
  if (normalized.has("boleto")) result.add("boleto");
  if (result.size === 0) result.add("cartao");

  return Array.from(result);
};

export const assessCheckoutRisk = async (input: {
  customerId: string;
  totalAmountCents: number;
  meta: CheckoutRequestMeta;
}) => {
  const admin = getSupabaseAdminClient();
  const recentThreshold = new Date(Date.now() - RISK_WINDOW_MINUTES * 60 * 1000).toISOString();

  try {
    const [userAttemptsQuery, ipAttemptsQuery, chargebackQuery] = await Promise.all([
      admin
        .from("checkout_payment_sessions")
        .select("id", { count: "exact", head: true })
        .eq("customer_id", input.customerId)
        .gte("created_at", recentThreshold),
      input.meta.ipAddress
        ? admin
            .from("checkout_payment_sessions")
            .select("id", { count: "exact", head: true })
            .eq("request_ip", input.meta.ipAddress)
            .gte("created_at", recentThreshold)
        : Promise.resolve({ count: 0, error: null }),
      admin
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("customer_id", input.customerId)
        .eq("payment_status", "chargeback")
    ]);

    if (userAttemptsQuery.error) throw userAttemptsQuery.error;
    if ("error" in ipAttemptsQuery && ipAttemptsQuery.error) throw ipAttemptsQuery.error;
    if (chargebackQuery.error) throw chargebackQuery.error;

    const recentAttemptsByUser = Number(userAttemptsQuery.count ?? 0);
    const recentAttemptsByIp = Number(("count" in ipAttemptsQuery ? ipAttemptsQuery.count : 0) ?? 0);
    const chargebackCount = Number(chargebackQuery.count ?? 0);

    const flags: string[] = [];
    let score = 0;

    if (!input.meta.deviceFingerprint) {
      flags.push("missing_device_fingerprint");
      score += 8;
    }

    if (!input.meta.ipAddress) {
      flags.push("missing_ip_address");
      score += 6;
    }

    if (input.totalAmountCents >= 150_000) {
      flags.push("high_amount");
      score += 12;
    }

    if (input.totalAmountCents >= 350_000) {
      flags.push("very_high_amount");
      score += 18;
    }

    if (recentAttemptsByUser >= 3) {
      flags.push("user_velocity_medium");
      score += 18;
    }

    if (recentAttemptsByUser >= 6) {
      flags.push("user_velocity_high");
      score += 24;
    }

    if (recentAttemptsByIp >= 6) {
      flags.push("ip_velocity_medium");
      score += 16;
    }

    if (recentAttemptsByIp >= 10) {
      flags.push("ip_velocity_high");
      score += 24;
    }

    if (chargebackCount >= 1) {
      flags.push("historical_chargeback");
      score += 35;
    }

    const rateLimited = recentAttemptsByUser >= 8 || recentAttemptsByIp >= 12;
    const blocked = rateLimited || chargebackCount >= 2;
    const tier: CheckoutRiskAssessment["tier"] = blocked
      ? "blocked"
      : score >= 60
        ? "high"
        : score >= 30
          ? "medium"
          : "low";

    return {
      score: Number(score.toFixed(2)),
      tier,
      flags,
      blocked,
      rateLimited,
      recentAttemptsByUser,
      recentAttemptsByIp,
      chargebackCount
    } satisfies CheckoutRiskAssessment;
  } catch (error) {
    if (isMissingCheckoutSessionError(error as { code?: string; message?: string })) {
      console.warn(
        "[checkout/paymentSessions] checkout_payment_sessions indisponivel. Rode a migration 20260311_0200_checkout_payment_sessions_hardening.sql."
      );
      return {
        score: 0,
        tier: "low",
        flags: [],
        blocked: false,
        rateLimited: false,
        recentAttemptsByUser: 0,
        recentAttemptsByIp: 0,
        chargebackCount: 0
      } satisfies CheckoutRiskAssessment;
    }

    throw error;
  }
};

export const persistCheckoutSessionDraft = async (input: SessionDraftInput) => {
  const admin = getSupabaseAdminClient();

  try {
    const update = await admin
      .from("checkout_payment_sessions")
      .update({
        order_id: input.orderId,
        currency: input.currency.toUpperCase(),
        risk_score: input.risk.score,
        risk_tier: input.risk.tier,
        risk_flags: input.risk.flags,
        pricing_snapshot: input.pricingSnapshot,
        shipping_snapshot: input.shippingSnapshot,
        status: "draft_created",
        updated_at: new Date().toISOString()
      })
      .eq("customer_id", input.customerId)
      .eq("idempotency_key", input.idempotencyKey)
      .select("id,order_id,idempotency_key,status,payment_intent_id,provider,provider_status,allowed_payment_methods,created_at,expires_at")
      .single();

    if (update.error) throw update.error;
    return update.data;
  } catch (error) {
    if (isMissingCheckoutSessionError(error as { code?: string; message?: string })) {
      return null;
    }
    throw error;
  }
};

export const persistBlockedCheckoutAttempt = async (input: {
  customerId: string;
  idempotencyKey: string;
  cartHash: string;
  addressHash: string;
  paymentMethodPreference: CheckoutPaymentMethodPreference;
  currency: string;
  meta: CheckoutRequestMeta;
  risk: CheckoutRiskAssessment;
}) => {
  const admin = getSupabaseAdminClient();
  const status: CheckoutSessionStatus = input.risk.rateLimited ? "rate_limited" : "risk_blocked";

  try {
    await admin.from("checkout_payment_sessions").update({
      risk_score: input.risk.score,
      risk_tier: input.risk.tier,
      risk_flags: input.risk.flags,
      status,
      failure_code: status === "rate_limited" ? "CHECKOUT_RATE_LIMITED" : "CHECKOUT_BLOCKED_RISK",
      failure_reason:
        status === "rate_limited"
          ? "Tentativas excessivas na janela de checkout."
          : "Checkout bloqueado por risco elevado.",
      updated_at: new Date().toISOString()
    })
    .eq("customer_id", input.customerId)
    .eq("idempotency_key", input.idempotencyKey);
  } catch (error) {
    if (isMissingCheckoutSessionError(error as { code?: string; message?: string })) return;
    throw error;
  }
};

export const reserveCheckoutSession = async (input: SessionReservationInput) => {
  const admin = getSupabaseAdminClient();

  try {
    const existing = await admin
      .from("checkout_payment_sessions")
      .select(
        "id,order_id,idempotency_key,status,payment_intent_id,provider,provider_status,allowed_payment_methods,created_at,updated_at,expires_at"
      )
      .eq("customer_id", input.customerId)
      .eq("idempotency_key", input.idempotencyKey)
      .maybeSingle();

    if (existing.error && existing.error.code !== "PGRST116") {
      throw existing.error;
    }

    if (existing.data) {
      return {
        session: existing.data,
        wasExisting: true as const
      };
    }

    const insert = await admin
      .from("checkout_payment_sessions")
      .insert({
        customer_id: input.customerId,
        idempotency_key: input.idempotencyKey,
        cart_hash: input.cartHash,
        address_hash: input.addressHash,
        payment_method_preference: input.paymentMethodPreference,
        currency: input.currency.toUpperCase(),
        request_ip: input.meta.ipAddress,
        user_agent: input.meta.userAgent,
        device_fingerprint: input.meta.deviceFingerprint,
        status: "draft_created"
      })
      .select(
        "id,order_id,idempotency_key,status,payment_intent_id,provider,provider_status,allowed_payment_methods,created_at,updated_at,expires_at"
      )
      .single();

    if (insert.error) {
      if (insert.error.code === "23505") {
        const conflicted = await admin
          .from("checkout_payment_sessions")
          .select(
            "id,order_id,idempotency_key,status,payment_intent_id,provider,provider_status,allowed_payment_methods,created_at,updated_at,expires_at"
          )
          .eq("customer_id", input.customerId)
          .eq("idempotency_key", input.idempotencyKey)
          .maybeSingle();

        if (conflicted.error) throw conflicted.error;
        return {
          session: conflicted.data,
          wasExisting: true as const
        };
      }

      throw insert.error;
    }

    return {
      session: insert.data,
      wasExisting: false as const
    };
  } catch (error) {
    if (isMissingCheckoutSessionError(error as { code?: string; message?: string })) {
      return {
        session: null,
        wasExisting: false as const
      };
    }

    throw error;
  }
};

export const findReusableCheckoutSession = async (input: {
  customerId: string;
  idempotencyKey: string;
}) => {
  const admin = getSupabaseAdminClient();

  try {
    const query = await admin
      .from("checkout_payment_sessions")
      .select(
        "id,order_id,idempotency_key,status,payment_intent_id,provider,provider_status,allowed_payment_methods,currency,created_at,expires_at"
      )
      .eq("customer_id", input.customerId)
      .eq("idempotency_key", input.idempotencyKey)
      .in("status", [...ACTIVE_SESSION_STATUSES])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (query.error) throw query.error;
    if (!query.data) return null;

    const expiresAt = Date.parse(String(query.data.expires_at ?? ""));
    if (Number.isFinite(expiresAt) && expiresAt < Date.now()) return null;

    return query.data;
  } catch (error) {
    if (isMissingCheckoutSessionError(error as { code?: string; message?: string })) {
      return null;
    }
    throw error;
  }
};

export const updateCheckoutSessionAfterPaymentIntent = async (input: {
  idempotencyKey: string;
  customerId: string;
  orderId: string;
  paymentIntentId: string;
  provider: string;
  providerStatus: string;
  allowedPaymentMethods: CheckoutAvailablePaymentMethod[];
}) => {
  const admin = getSupabaseAdminClient();

  try {
    const update = await admin
      .from("checkout_payment_sessions")
      .update({
        order_id: input.orderId,
        payment_intent_id: input.paymentIntentId,
        provider: input.provider,
        provider_status: input.providerStatus,
        allowed_payment_methods: input.allowedPaymentMethods,
        status: "payment_intent_created",
        updated_at: new Date().toISOString()
      })
      .eq("customer_id", input.customerId)
      .eq("idempotency_key", input.idempotencyKey);

    if (update.error) throw update.error;
  } catch (error) {
    if (isMissingCheckoutSessionError(error as { code?: string; message?: string })) return;
    throw error;
  }
};

export const markCheckoutSessionFailure = async (input: {
  customerId?: string | null;
  orderId?: string | null;
  idempotencyKey?: string | null;
  failureCode: string;
  failureReason: string;
}) => {
  const admin = getSupabaseAdminClient();
  const updatePayload = {
    status: "failed",
    failure_code: input.failureCode,
    failure_reason: input.failureReason,
    updated_at: new Date().toISOString()
  };

  try {
    let query = admin.from("checkout_payment_sessions").update(updatePayload);

    if (input.orderId) {
      query = query.eq("order_id", input.orderId);
    } else if (input.customerId && input.idempotencyKey) {
      query = query.eq("customer_id", input.customerId).eq("idempotency_key", input.idempotencyKey);
    } else {
      return;
    }

    const result = await query;
    if (result.error) throw result.error;
  } catch (error) {
    if (isMissingCheckoutSessionError(error as { code?: string; message?: string })) return;
    throw error;
  }
};

export const updateCheckoutSessionProviderState = async (input: {
  paymentIntentId: string;
  providerStatus: string;
  status: CheckoutSessionStatus;
}) => {
  const admin = getSupabaseAdminClient();

  try {
    const result = await admin
      .from("checkout_payment_sessions")
      .update({
        provider_status: input.providerStatus,
        status: input.status,
        updated_at: new Date().toISOString(),
        expires_at:
          input.status === "payment_intent_created" ||
          input.status === "processing" ||
          input.status === "requires_action"
            ? new Date(Date.now() + 30 * 60 * 1000).toISOString()
            : new Date().toISOString()
      })
      .eq("payment_intent_id", input.paymentIntentId);

    if (result.error) throw result.error;
  } catch (error) {
    if (isMissingCheckoutSessionError(error as { code?: string; message?: string })) return;
    throw error;
  }
};
