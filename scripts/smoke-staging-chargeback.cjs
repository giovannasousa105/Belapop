#!/usr/bin/env node
const { randomUUID } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const dotenv = require("dotenv");
const { createClient } = require("@supabase/supabase-js");

dotenv.config({ path: path.join(process.cwd(), ".env.staging") });

const KEEP_RECORDS = process.argv.includes("--keep");
const STAGING_BASE_URL = String(process.env.NEXT_PUBLIC_SITE_URL || "").trim();
const supabaseUrl = String(process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const serviceRoleKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY de staging sao obrigatorios."
  );
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const runTag = `chargeback-smoke-${Date.now()}`;

const state = {
  customerId: null,
  sellerOwnerUserId: null,
  customerEmail: `${runTag}-customer@belapop-staging.local`,
  sellerOwnerEmail: `${runTag}-seller@belapop-staging.local`,
  sellerId: randomUUID(),
  orderId: randomUUID(),
  subOrderId: randomUUID(),
  paymentId: randomUUID()
};

const assertNoError = (label, error) => {
  if (error) {
    throw new Error(`${label}: ${error.message}`);
  }
};

async function insertSyntheticFixtures() {
  const createdCustomer = await admin.auth.admin.createUser({
    email: state.customerEmail,
    password: `Bp!${randomUUID()}Aa1`,
    email_confirm: true,
    user_metadata: { full_name: "Chargeback Smoke Customer" }
  });
  assertNoError("customer auth create failed", createdCustomer.error);
  state.customerId = createdCustomer.data.user?.id ?? null;
  if (!state.customerId) {
    throw new Error("customer auth create failed: user id ausente");
  }

  const createdSellerOwner = await admin.auth.admin.createUser({
    email: state.sellerOwnerEmail,
    password: `Bp!${randomUUID()}Aa1`,
    email_confirm: true,
    user_metadata: { full_name: "Chargeback Smoke Seller Owner" }
  });
  assertNoError("seller owner auth create failed", createdSellerOwner.error);
  state.sellerOwnerUserId = createdSellerOwner.data.user?.id ?? null;
  if (!state.sellerOwnerUserId) {
    throw new Error("seller owner auth create failed: user id ausente");
  }

  const { error: profileError } = await admin.from("profiles").upsert({
    id: state.customerId,
    email: state.customerEmail,
    role: "customer",
    full_name: "Chargeback Smoke Customer"
  }, { onConflict: "id" });
  assertNoError("profiles insert failed", profileError);

  const { error: sellerError } = await admin.from("sellers").insert({
    id: state.sellerId,
    user_id: state.sellerOwnerUserId,
    store_name: "Chargeback Smoke Seller",
    postal_code: "30140071",
    status: "active",
    commission_rate: 0.25
  });
  assertNoError("sellers insert failed", sellerError);

  const { error: orderError } = await admin.from("orders").insert({
    id: state.orderId,
    customer_id: state.customerId,
    total_products_cents: 10000,
    total_shipping_cents: 1500,
    total_order_cents: 11500,
    total_cents: 11500,
    status: "created",
    payment_status: "chargeback",
    payment_provider: "stripe",
    payment_intent_id: `pi_staging_${runTag}`,
    destination_cep: "38440000",
    address: {
      fullName: "Chargeback Smoke Customer",
      street: "Rua de Teste",
      number: "100",
      city: "Araguari",
      state: "MG",
      zip: "38440000"
    }
  });
  assertNoError("orders insert failed", orderError);

  const { error: subOrderError } = await admin.from("sub_orders").insert({
    id: state.subOrderId,
    order_id: state.orderId,
    seller_id: state.sellerId,
    items: [],
    product_total_cents: 10000,
    shipping_total_cents: 1500,
    platform_fee_cents: 2500,
    seller_net_cents: 9000,
    shipping_service: "PAC",
    shipping_days: 4,
    status: "chargeback",
    payment_status: "chargeback"
  });
  assertNoError("sub_orders insert failed", subOrderError);

  const { error: paymentError } = await admin.from("payments").insert({
    id: state.paymentId,
    order_id: state.orderId,
    status: "paid",
    amount_cents: 11500,
    currency: "BRL",
    provider: "stripe",
    provider_ref: `pi_staging_${runTag}`
  });
  assertNoError("payments insert failed", paymentError);
}

async function postSyntheticChargeback() {
  const reversalReference = `${runTag}:${state.orderId}:reversal`;
  const feeReference = `${runTag}:${state.orderId}:fee`;

  const { data: reversalData, error: reversalError } = await admin.rpc(
    "ledger_post_chargeback_reversal_final_v1",
    {
      p_store_id: state.sellerId,
      p_cash_reversal: 115,
      p_marketplace_fee: 25,
      p_coupon_marketplace: 0,
      p_seller_payable: 90,
      p_shipping_component: 15,
      p_order_id: state.orderId,
      p_reference_id: reversalReference,
      p_currency: "BRL",
      p_memo: `synthetic chargeback reversal ${runTag}`
    }
  );
  assertNoError("chargeback reversal rpc failed", reversalError);

  const { data: feeData, error: feeError } = await admin.rpc("ledger_post_chargeback_fee_v1", {
    p_store_id: state.sellerId,
    p_amount: 7.5,
    p_order_id: state.orderId,
    p_reference_id: feeReference,
    p_currency: "BRL",
    p_source_account: "cash_clearing",
    p_memo: `synthetic chargeback fee ${runTag}`
  });
  assertNoError("chargeback fee rpc failed", feeError);

  return {
    reversalJournalId: reversalData ?? null,
    feeJournalId: feeData ?? null
  };
}

async function loadEvidence() {
  const { data: recentEntries, error: entriesError } = await admin
    .from("marketplace_ledger_entries")
    .select(
      "id,order_id,seller_id,entry_type,amount,currency,reference_id,reference_type,account_code,direction,description,created_at"
    )
    .order("created_at", { ascending: false })
    .limit(200);
  assertNoError("marketplace_ledger_entries lookup failed", entriesError);

  const { data: recentTransactions, error: txError } = await admin
    .from("ledger_transactions")
    .select(
      "id,transaction_type,seller_id,order_id,reference_type,reference_id,status,created_at,lines_count,total_debit_cents,total_credit_cents"
    )
    .order("created_at", { ascending: false })
    .limit(100);
  assertNoError("ledger_transactions lookup failed", txError);

  const entries = (recentEntries ?? []).filter((row) => row.order_id === state.orderId);
  const transactions = (recentTransactions ?? []).filter((row) => row.order_id === state.orderId);

  const commissionReversalEntries = entries.filter(
    (row) => row.entry_type === "commission_reversal"
  );
  const chargebackFeeEntries = entries.filter((row) => row.entry_type === "chargeback_fee");
  const chargebackEntries = entries.filter((row) => row.entry_type === "chargeback");

  const recentDedicatedFilterCounts = {
    commission_reversal: (recentEntries ?? []).filter(
      (row) => row.entry_type === "commission_reversal"
    ).length,
    chargeback_fee: (recentEntries ?? []).filter((row) => row.entry_type === "chargeback_fee").length
  };

  const financeDrilldownShape = {
    active_entry_type_filter: "commission_reversal",
    recent_entries: commissionReversalEntries.slice(0, 20),
    recent_transactions: transactions.filter((row) => {
      if (row.transaction_type === "commission_reversal") return true;
      return commissionReversalEntries.some(
        (entry) =>
          (entry.order_id && entry.order_id === row.order_id) ||
          (entry.reference_id && entry.reference_id === row.reference_id)
      );
    })
  };

  return {
    entries,
    transactions,
    commissionReversalEntries,
    chargebackFeeEntries,
    chargebackEntries,
    recentDedicatedFilterCounts,
    financeDrilldownShape
  };
}

async function cleanup() {
  const { error: deleteJournalsError } = await admin
    .from("ledger_journals")
    .delete()
    .eq("order_id", state.orderId);
  assertNoError("ledger_journals cleanup failed", deleteJournalsError);

  const { error: paymentsError } = await admin.from("payments").delete().eq("order_id", state.orderId);
  assertNoError("payments cleanup failed", paymentsError);

  const { error: subOrdersError } = await admin
    .from("sub_orders")
    .delete()
    .eq("order_id", state.orderId);
  assertNoError("sub_orders cleanup failed", subOrdersError);

  const { error: ordersError } = await admin.from("orders").delete().eq("id", state.orderId);
  assertNoError("orders cleanup failed", ordersError);

  const { error: sellerError } = await admin.from("sellers").delete().eq("id", state.sellerId);
  assertNoError("sellers cleanup failed", sellerError);

  const { error: profileError } = await admin.from("profiles").delete().eq("id", state.customerId);
  assertNoError("profiles cleanup failed", profileError);

  if (state.customerId) {
    const deletedCustomer = await admin.auth.admin.deleteUser(state.customerId);
    assertNoError("customer auth cleanup failed", deletedCustomer.error);
  }

  if (state.sellerOwnerUserId) {
    const deletedSellerOwner = await admin.auth.admin.deleteUser(state.sellerOwnerUserId);
    assertNoError("seller owner auth cleanup failed", deletedSellerOwner.error);
  }
}

async function run() {
  let cleanupStatus = "skipped";
  let result = null;
  try {
    await insertSyntheticFixtures();
    const postingResult = await postSyntheticChargeback();
    const evidence = await loadEvidence();

    if (evidence.commissionReversalEntries.length === 0) {
      throw new Error("commission_reversal nao apareceu no ledger de staging.");
    }

    if (evidence.chargebackFeeEntries.length === 0) {
      throw new Error("chargeback_fee nao apareceu no ledger de staging.");
    }

    if (evidence.transactions.length === 0) {
      throw new Error("Nenhuma ledger_transaction encontrada para o chargeback sintetico.");
    }

    result = {
      ok: true,
      staging_base_url: STAGING_BASE_URL || null,
      order_id: state.orderId,
      seller_id: state.sellerId,
      sub_order_id: state.subOrderId,
      payment_id: state.paymentId,
      reversal_journal_id: postingResult.reversalJournalId,
      chargeback_fee_journal_id: postingResult.feeJournalId,
      evidence: {
        commission_reversal_entries: evidence.commissionReversalEntries.length,
        chargeback_fee_entries: evidence.chargebackFeeEntries.length,
        chargeback_entries: evidence.chargebackEntries.length,
        transactions: evidence.transactions.length,
        recent_dedicated_filter_counts: evidence.recentDedicatedFilterCounts,
        commission_reversal_samples: evidence.commissionReversalEntries.slice(0, 3),
        chargeback_fee_samples: evidence.chargebackFeeEntries.slice(0, 3),
        chargeback_transaction_types: Array.from(
          new Set(evidence.transactions.map((row) => row.transaction_type))
        ),
        finance_drilldown_shape: {
          active_entry_type_filter: evidence.financeDrilldownShape.active_entry_type_filter,
          recent_entries_count: evidence.financeDrilldownShape.recent_entries.length,
          recent_transactions_count: evidence.financeDrilldownShape.recent_transactions.length
        }
      }
    };
  } finally {
    if (!KEEP_RECORDS) {
      try {
        await cleanup();
        cleanupStatus = "done";
      } catch (error) {
        cleanupStatus = `failed: ${error instanceof Error ? error.message : String(error)}`;
      }
      fs.mkdirSync(path.join(process.cwd(), "tmp"), { recursive: true });
      fs.writeFileSync(
        path.join(process.cwd(), "tmp", "staging-chargeback-cleanup-status.txt"),
        cleanupStatus,
        "utf8"
      );
    }
  }

  if (result) {
    result.cleanup = cleanupStatus;
    console.log(JSON.stringify(result, null, 2));
  }
}

run().catch((error) => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        order_id: state.orderId,
        seller_id: state.sellerId
      },
      null,
      2
    )
  );
  process.exit(1);
});
