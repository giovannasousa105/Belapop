import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type ChargebackEconomicPostingsInput = {
  orderId: string;
  provider: string;
  providerReference: string;
  providerEventId?: string | null;
  currency?: string | null;
  chargebackFeeCents?: number | null;
};

type ChargebackSlice = {
  subOrderId: string;
  sellerId: string;
  cashInCents: number;
  platformFeeCents: number;
  sellerNetCents: number;
  shippingCents: number;
  couponCents: number;
};

const centsToAmount = (value: number) => Number((value / 100).toFixed(2));

const isMissingRpcError = (message: string) => {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("does not exist") ||
    normalized.includes("function") && normalized.includes("does not exist") ||
    normalized.includes("could not find") ||
    normalized.includes("pgrst")
  );
};

const allocateCents = (
  totalCents: number,
  rows: Array<{ key: string; weight: number }>
) => {
  if (totalCents <= 0 || rows.length === 0) return new Map<string, number>();

  const positiveRows = rows.map((row) => ({
    key: row.key,
    weight: Math.max(0, row.weight)
  }));
  const totalWeight = positiveRows.reduce((sum, row) => sum + row.weight, 0);
  if (totalWeight <= 0) {
    return new Map(positiveRows.map((row, index) => [row.key, index === 0 ? totalCents : 0]));
  }

  const allocations = positiveRows.map((row) => {
    const raw = (totalCents * row.weight) / totalWeight;
    const floor = Math.floor(raw);
    return {
      key: row.key,
      amount: floor,
      remainder: raw - floor
    };
  });

  let distributed = allocations.reduce((sum, row) => sum + row.amount, 0);
  allocations
    .sort((a, b) => b.remainder - a.remainder)
    .forEach((row) => {
      if (distributed >= totalCents) return;
      row.amount += 1;
      distributed += 1;
    });

  return new Map(allocations.map((row) => [row.key, row.amount]));
};

const loadChargebackSlices = async (orderId: string): Promise<ChargebackSlice[]> => {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("sub_orders")
    .select(
      "id,seller_id,product_total_cents,shipping_total_cents,platform_fee_cents,seller_net_cents"
    )
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`chargeback sub_orders lookup failed: ${error.message}`);
  }

  return ((data ?? []) as Array<Record<string, unknown>>)
    .map((row) => {
      const productTotalCents = Number(row.product_total_cents ?? 0);
      const shippingCents = Number(row.shipping_total_cents ?? 0);
      const platformFeeCents = Number(row.platform_fee_cents ?? 0);
      const sellerNetCents = Number(row.seller_net_cents ?? 0);
      const cashInCents = Math.max(0, productTotalCents + shippingCents);
      const couponCents = Math.max(0, platformFeeCents + sellerNetCents - cashInCents);

      return {
        subOrderId: String(row.id ?? ""),
        sellerId: String(row.seller_id ?? ""),
        cashInCents,
        platformFeeCents: Math.max(0, platformFeeCents),
        sellerNetCents: Math.max(0, sellerNetCents),
        shippingCents: Math.max(0, shippingCents),
        couponCents
      };
    })
    .filter((row) => row.subOrderId && row.sellerId && row.cashInCents > 0);
};

const postChargebackReversal = async (
  slice: ChargebackSlice,
  input: ChargebackEconomicPostingsInput
) => {
  const admin = getSupabaseAdminClient();
  const referenceId = [
    input.provider,
    input.providerReference,
    input.providerEventId ?? "chargeback",
    slice.subOrderId,
    "reversal"
  ].join(":");

  const { error } = await admin.rpc("ledger_post_chargeback_reversal_final_v1", {
    p_store_id: slice.sellerId,
    p_cash_reversal: centsToAmount(slice.cashInCents),
    p_marketplace_fee: centsToAmount(slice.platformFeeCents),
    p_coupon_marketplace: centsToAmount(slice.couponCents),
    p_seller_payable: centsToAmount(slice.sellerNetCents),
    p_shipping_component: centsToAmount(slice.shippingCents),
    p_order_id: input.orderId,
    p_reference_id: referenceId,
    p_currency: input.currency ?? "BRL",
    p_memo: `chargeback reversal final v1 - ${slice.subOrderId}`
  });

  if (error) {
    if (isMissingRpcError(error.message ?? "")) {
      console.warn(
        "[Chargeback ledger] chargeback reversal RPC indisponivel. Rode a migration 20260311_0000_chargeback_postings_v1.sql."
      );
      return;
    }
    throw new Error(`chargeback reversal posting failed: ${error.message}`);
  }
};

const postChargebackFee = async (
  slice: ChargebackSlice,
  chargebackFeeCents: number,
  input: ChargebackEconomicPostingsInput
) => {
  const admin = getSupabaseAdminClient();
  const referenceId = [
    input.provider,
    input.providerReference,
    input.providerEventId ?? "chargeback",
    slice.subOrderId,
    "chargeback_fee"
  ].join(":");

  const { error } = await admin.rpc("ledger_post_chargeback_fee_v1", {
    p_store_id: slice.sellerId,
    p_amount: centsToAmount(chargebackFeeCents),
    p_order_id: input.orderId,
    p_reference_id: referenceId,
    p_currency: input.currency ?? "BRL",
    p_source_account: "cash_clearing",
    p_memo: `chargeback fee v1 - ${slice.subOrderId}`
  });

  if (error) {
    if (isMissingRpcError(error.message ?? "")) {
      console.warn(
        "[Chargeback ledger] chargeback fee RPC indisponivel. Rode a migration 20260311_0000_chargeback_postings_v1.sql."
      );
      return;
    }
    throw new Error(`chargeback fee posting failed: ${error.message}`);
  }
};

export const postChargebackEconomicEntries = async (
  input: ChargebackEconomicPostingsInput
) => {
  const slices = await loadChargebackSlices(input.orderId);
  if (slices.length === 0) return;

  for (const slice of slices) {
    await postChargebackReversal(slice, input);
  }

  const totalFeeCents = Math.max(0, Number(input.chargebackFeeCents ?? 0));
  if (totalFeeCents <= 0) return;

  const allocations = allocateCents(
    totalFeeCents,
    slices.map((slice) => ({ key: slice.subOrderId, weight: slice.cashInCents }))
  );

  for (const slice of slices) {
    const feeCents = allocations.get(slice.subOrderId) ?? 0;
    if (feeCents <= 0) continue;
    await postChargebackFee(slice, feeCents, input);
  }
};
