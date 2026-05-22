import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";

import { loadPersistedSplitsForOrder } from "@/lib/checkout/serverCheckout";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type SellerTransferStatus = "pending" | "transferred" | "failed" | "reversed";

type SellerTransferSplit = Awaited<ReturnType<typeof loadPersistedSplitsForOrder>>[number];

type SellerTransferRow = {
  id: string;
  status: SellerTransferStatus | string | null;
  stripe_transfer_id: string | null;
};

export type SellerTransferResult = {
  sellerId: string;
  subOrderId: string;
  status: "transferred" | "failed" | "skipped";
  stripeTransferId: string | null;
  sellerNetCents: number;
  failureReason?: string | null;
};

const TRANSFER_STATUSES = new Set(["pending", "transferred", "failed", "reversed"]);

export const buildSellerTransferIdempotencyKey = (paymentIntentId: string, sellerId: string) =>
  `transfer-${paymentIntentId}-${sellerId}`;

const normalizeCurrency = (value: string | null | undefined) =>
  String(value ?? "brl").trim().toLowerCase() || "brl";

const normalizeFailureReason = (error: unknown) => {
  if (error instanceof Error && error.message.trim()) return error.message.slice(0, 700);
  return "Falha desconhecida ao criar transfer Stripe.";
};

const existingTransferIsFinal = (row: SellerTransferRow | null | undefined) =>
  row?.status === "transferred" && typeof row.stripe_transfer_id === "string" && row.stripe_transfer_id.trim();

async function findExistingTransfer(args: {
  admin: SupabaseClient;
  orderId: string;
  sellerId: string;
  paymentIntentId: string;
}) {
  const lookup = await args.admin
    .from("seller_transfers")
    .select("id,status,stripe_transfer_id")
    .eq("order_id", args.orderId)
    .eq("seller_id", args.sellerId)
    .eq("payment_intent_id", args.paymentIntentId)
    .maybeSingle();

  if (lookup.error) {
    throw new Error(`seller_transfers lookup failed: ${lookup.error.message}`);
  }

  return (lookup.data ?? null) as SellerTransferRow | null;
}

async function ensurePendingTransfer(args: {
  admin: SupabaseClient;
  orderId: string;
  paymentIntentId: string;
  split: SellerTransferSplit;
  currency: string;
}) {
  const existing = await findExistingTransfer({
    admin: args.admin,
    orderId: args.orderId,
    sellerId: args.split.sellerId,
    paymentIntentId: args.paymentIntentId
  });

  if (existing) return existing;

  const insert = await args.admin
    .from("seller_transfers")
    .insert({
      order_id: args.orderId,
      sub_order_id: args.split.subOrderId,
      seller_id: args.split.sellerId,
      payment_intent_id: args.paymentIntentId,
      stripe_account_id: args.split.stripeAccountId,
      gross_amount_cents: args.split.grossAmountCents,
      platform_fee_cents: args.split.platformFeeCents,
      shipping_total_cents: args.split.shippingTotalCents,
      seller_net_cents: args.split.sellerNetCents,
      currency: args.currency.toUpperCase(),
      status: "pending"
    })
    .select("id,status,stripe_transfer_id")
    .single();

  if (insert.error) {
    if (insert.error.code === "23505") {
      return findExistingTransfer({
        admin: args.admin,
        orderId: args.orderId,
        sellerId: args.split.sellerId,
        paymentIntentId: args.paymentIntentId
      });
    }
    throw new Error(`seller_transfers insert failed: ${insert.error.message}`);
  }

  return insert.data as SellerTransferRow;
}

async function markSellerTransfer(args: {
  admin: SupabaseClient;
  transferRowId: string;
  status: SellerTransferStatus;
  stripeTransferId?: string | null;
  failureReason?: string | null;
}) {
  const payload: Record<string, unknown> = {
    status: args.status,
    updated_at: new Date().toISOString()
  };

  if (args.stripeTransferId !== undefined) {
    payload.stripe_transfer_id = args.stripeTransferId;
  }
  if (args.failureReason !== undefined) {
    payload.failure_reason = args.failureReason;
  }
  if (args.status === "transferred") {
    payload.transferred_at = new Date().toISOString();
    payload.failure_reason = null;
  }

  const update = await args.admin
    .from("seller_transfers")
    .update(payload)
    .eq("id", args.transferRowId);

  if (update.error) {
    throw new Error(`seller_transfers update failed: ${update.error.message}`);
  }
}

async function recordMarketplaceTransferEvent(args: {
  admin: SupabaseClient;
  orderId: string;
  split: SellerTransferSplit;
  paymentIntentId: string;
  status: "transferred" | "failed";
  stripeTransferId?: string | null;
  failureReason?: string | null;
  currency: string;
}) {
  const insert = await args.admin.from("marketplace_events").insert({
    event_type: "finance",
    event_name: args.status === "transferred" ? "seller_transfer_created" : "seller_transfer_failed",
    occurred_at: new Date().toISOString(),
    channel: "marketplace",
    store_id: args.split.sellerId,
    order_id: args.orderId,
    amount_cents: args.split.sellerNetCents,
    currency: args.currency.toUpperCase(),
    external_ref: args.stripeTransferId ?? args.paymentIntentId,
    idempotency_key: buildSellerTransferIdempotencyKey(args.paymentIntentId, args.split.sellerId),
    source: "stripe_webhook",
    provider: "stripe",
    ingestion_status: "processed",
    metadata: {
      payment_intent_id: args.paymentIntentId,
      stripe_transfer_id: args.stripeTransferId ?? null,
      seller_id: args.split.sellerId,
      sub_order_id: args.split.subOrderId,
      gross_amount_cents: args.split.grossAmountCents,
      platform_fee_cents: args.split.platformFeeCents,
      shipping_total_cents: args.split.shippingTotalCents,
      seller_net_cents: args.split.sellerNetCents,
      status: args.status,
      failure_reason: args.failureReason ?? null
    }
  });

  if (insert.error && insert.error.code !== "23505") {
    throw new Error(`marketplace_events seller transfer insert failed: ${insert.error.message}`);
  }
}

export async function createSellerTransfersForPaymentIntent({
  stripe,
  paymentIntent,
  orderId,
  admin = getSupabaseAdminClient(),
  splits
}: {
  stripe: Stripe;
  paymentIntent: Stripe.PaymentIntent;
  orderId: string | null;
  admin?: SupabaseClient;
  splits?: SellerTransferSplit[];
}): Promise<SellerTransferResult[]> {
  if (!orderId) return [];

  const paymentIntentId = String(paymentIntent.id ?? "").trim();
  if (!paymentIntentId) {
    throw new Error("PaymentIntent sem id para criar transferencias.");
  }

  const currency = normalizeCurrency(paymentIntent.currency);
  const transferGroup = paymentIntent.transfer_group ?? orderId;
  const persistedSplits = splits ?? (await loadPersistedSplitsForOrder(orderId));
  const results: SellerTransferResult[] = [];

  for (const split of persistedSplits) {
    if (!split.stripeAccountId || split.sellerNetCents <= 0) continue;

    const pending = await ensurePendingTransfer({
      admin,
      orderId,
      paymentIntentId,
      split,
      currency
    });
    if (!pending?.id) {
      throw new Error(`seller_transfers pending row missing for seller ${split.sellerId}.`);
    }

    if (existingTransferIsFinal(pending)) {
      results.push({
        sellerId: split.sellerId,
        subOrderId: split.subOrderId,
        status: "skipped",
        stripeTransferId: pending?.stripe_transfer_id ?? null,
        sellerNetCents: split.sellerNetCents
      });
      continue;
    }

    try {
      const transfer = await stripe.transfers.create(
        {
          amount: split.sellerNetCents,
          currency,
          destination: split.stripeAccountId,
          transfer_group: transferGroup,
          metadata: {
            orderId,
            subOrderId: split.subOrderId,
            sellerId: split.sellerId,
            paymentIntentId,
            grossAmountCents: String(split.grossAmountCents),
            platformFeeCents: String(split.platformFeeCents),
            shippingTotalCents: String(split.shippingTotalCents),
            sellerNetCents: String(split.sellerNetCents)
          }
        },
        {
          idempotencyKey: buildSellerTransferIdempotencyKey(paymentIntentId, split.sellerId)
        }
      );

      await markSellerTransfer({
        admin,
        transferRowId: pending.id,
        status: "transferred",
        stripeTransferId: transfer.id
      });
      await recordMarketplaceTransferEvent({
        admin,
        orderId,
        split,
        paymentIntentId,
        status: "transferred",
        stripeTransferId: transfer.id,
        currency
      });

      results.push({
        sellerId: split.sellerId,
        subOrderId: split.subOrderId,
        status: "transferred",
        stripeTransferId: transfer.id,
        sellerNetCents: split.sellerNetCents
      });
    } catch (error) {
      const failureReason = normalizeFailureReason(error);
      await markSellerTransfer({
        admin,
        transferRowId: pending.id,
        status: "failed",
        failureReason
      });
      await recordMarketplaceTransferEvent({
        admin,
        orderId,
        split,
        paymentIntentId,
        status: "failed",
        failureReason,
        currency
      });

      results.push({
        sellerId: split.sellerId,
        subOrderId: split.subOrderId,
        status: "failed",
        stripeTransferId: null,
        sellerNetCents: split.sellerNetCents,
        failureReason
      });
    }
  }

  return results;
}

export function assertValidSellerTransferStatus(status: string) {
  return TRANSFER_STATUSES.has(status);
}
