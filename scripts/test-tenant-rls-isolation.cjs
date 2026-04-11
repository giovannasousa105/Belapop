#!/usr/bin/env node
const { randomUUID } = require("node:crypto");
const path = require("node:path");

const dotenv = require("dotenv");
const { createClient } = require("@supabase/supabase-js");

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const KEEP_RECORDS = process.argv.includes("--keep");

const supabaseUrl = String(process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const supabaseAnonKey = String(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "").trim();
const serviceRoleKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY sao obrigatorios."
  );
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const state = {
  userIds: [],
  sellerIds: [],
  productIds: [],
  orderIds: [],
  subOrderIds: [],
  sellerOrderIds: [],
  sellerPayoutIds: [],
  adjustmentIds: [],
  journalIds: [],
  requestIds: [],
  teamInviteIds: [],
  returnRequestIds: [],
  logisticsExceptionIds: []
};

function browserClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

async function createTempUser(label) {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const email = `${label}-${suffix}@belapop-rls.local`;
  const password = `Bp!${randomUUID()}Aa1`;

  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: `RLS ${label}` }
  });

  if (created.error || !created.data.user) {
    throw new Error(`Falha ao criar usuario temporario (${label}): ${created.error?.message ?? "desconhecido"}`);
  }

  state.userIds.push(created.data.user.id);

  return {
    userId: created.data.user.id,
    email,
    password
  };
}

async function upsertProfile(userId, email, role, fullName) {
  const result = await admin.from("profiles").upsert({
    id: userId,
    email,
    role,
    full_name: fullName
  });

  if (result.error) {
    throw new Error(`Falha ao gravar profile ${email}: ${result.error.message}`);
  }
}

async function grantAdmin(userId) {
  const result = await admin
    .from("user_roles")
    .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id" });

  if (result.error) {
    throw new Error(`Falha ao conceder admin para ${userId}: ${result.error.message}`);
  }
}

async function signIn(credentials) {
  const client = browserClient();
  const result = await client.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password
  });

  if (result.error || !result.data.session) {
    throw new Error(`Falha no sign in ${credentials.email}: ${result.error?.message ?? "sem sessao"}`);
  }

  return client;
}

async function insertOne(table, payload) {
  const result = await admin.from(table).insert(payload).select().single();
  if (result.error || !result.data) {
    throw new Error(`Falha ao inserir em ${table}: ${result.error?.message ?? "sem retorno"}`);
  }
  return result.data;
}

async function insertMany(table, payload) {
  const result = await admin.from(table).insert(payload).select();
  if (result.error) {
    throw new Error(`Falha ao inserir lote em ${table}: ${result.error.message}`);
  }
  return result.data || [];
}

async function ensureSellerOrder(payload) {
  const existing = await admin
    .from("seller_orders")
    .select("id")
    .eq("order_id", payload.order_id)
    .eq("seller_id", payload.seller_id)
    .maybeSingle();

  if (existing.error) {
    throw new Error(`Falha ao buscar seller_orders existente: ${existing.error.message}`);
  }

  if (existing.data?.id) {
    const result = await admin
      .from("seller_orders")
      .update({
        status: payload.status,
        payment_status: payload.payment_status,
        items_total_cents: payload.items_total_cents,
        shipping_cents: payload.shipping_cents,
        discount_allocated_cents: payload.discount_allocated_cents,
        fee_cents: payload.fee_cents,
        seller_payout_cents: payload.seller_payout_cents,
        shipped_at: payload.shipped_at,
        delivered_at: payload.delivered_at
      })
      .eq("id", existing.data.id)
      .select()
      .single();

    if (result.error || !result.data) {
      throw new Error(`Falha ao atualizar seller_orders existente: ${result.error?.message ?? "sem retorno"}`);
    }

    return result.data;
  }

  const result = await admin.from("seller_orders").insert(payload).select().single();
  if (result.error || !result.data) {
    throw new Error(`Falha ao inserir seller_orders: ${result.error?.message ?? "sem retorno"}`);
  }
  return result.data;
}

async function upsertMany(table, payload, onConflict) {
  const result = await admin.from(table).upsert(payload, { onConflict }).select();
  if (result.error) {
    throw new Error(`Falha ao fazer upsert em ${table}: ${result.error.message}`);
  }
  return result.data || [];
}

async function countVisible(client, table, filters) {
  let query = client.from(table).select("*", { count: "exact", head: true });

  for (const filter of filters) {
    if (filter.op === "eq") {
      query = query.eq(filter.column, filter.value);
      continue;
    }

    if (filter.op === "in") {
      query = query.in(filter.column, filter.value);
      continue;
    }

    throw new Error(`Filtro nao suportado em ${table}: ${filter.op}`);
  }

  const result = await query;
  if (result.error) {
    throw new Error(`Falha ao consultar ${table}: ${result.error.message}`);
  }

  return Number(result.count || 0);
}

async function assertVisibleCount(client, actor, table, filters, expected, label) {
  const actual = await countVisible(client, table, filters);
  if (actual !== expected) {
    throw new Error(`${label}: ${actor} esperava ${expected} em ${table}, recebeu ${actual}`);
  }
}

async function assertIsolation(clients, scenario) {
  const matrix = [
    { actor: "ownerA", client: clients.ownerA, expectedA: scenario.expected.ownerA[0], expectedB: scenario.expected.ownerA[1] },
    { actor: "memberA", client: clients.memberA, expectedA: scenario.expected.memberA[0], expectedB: scenario.expected.memberA[1] },
    { actor: "ownerB", client: clients.ownerB, expectedA: scenario.expected.ownerB[0], expectedB: scenario.expected.ownerB[1] },
    { actor: "admin", client: clients.admin, expectedA: scenario.expected.admin[0], expectedB: scenario.expected.admin[1] }
  ];

  for (const entry of matrix) {
    await assertVisibleCount(entry.client, entry.actor, scenario.table, scenario.filtersA, entry.expectedA, `${scenario.name} / tenant A`);
    await assertVisibleCount(entry.client, entry.actor, scenario.table, scenario.filtersB, entry.expectedB, `${scenario.name} / tenant B`);
  }
}

async function safeDelete(table, buildQuery) {
  try {
    const query = buildQuery(admin.from(table).delete());
    await query;
  } catch {
    // no-op
  }
}

async function cleanup() {
  if (KEEP_RECORDS) return;

  await safeDelete("logistics_exceptions", (query) => query.in("id", state.logisticsExceptionIds));
  await safeDelete("return_requests", (query) => query.in("id", state.returnRequestIds));
  await safeDelete("finance_adjustment_approvals", (query) => query.in("adjustment_id", state.adjustmentIds));
  await safeDelete("ledger_entries", (query) => query.in("journal_id", state.journalIds));
  await safeDelete("ledger_journals", (query) => query.in("id", state.journalIds));
  await safeDelete("seller_payout_items", (query) => query.in("seller_payout_id", state.sellerPayoutIds));
  await safeDelete("seller_holdbacks", (query) => query.in("seller_payout_id", state.sellerPayoutIds));
  await safeDelete("finance_adjustments", (query) => query.in("id", state.adjustmentIds));
  await safeDelete("seller_order_shipping_quotes", (query) => query.in("seller_order_id", state.sellerOrderIds));
  await safeDelete("seller_order_financial_snapshot", (query) => query.in("seller_order_id", state.sellerOrderIds));
  await safeDelete("seller_orders", (query) => query.in("id", state.sellerOrderIds));
  await safeDelete("sub_orders", (query) => query.in("id", state.subOrderIds));
  await safeDelete("seller_payouts", (query) => query.in("id", state.sellerPayoutIds));
  await safeDelete("seller_risk_signals", (query) => query.in("seller_id", state.sellerIds));
  await safeDelete("seller_risk_profiles", (query) => query.in("seller_id", state.sellerIds));
  await safeDelete("seller_fee_rules", (query) => query.in("seller_id", state.sellerIds));
  await safeDelete("brand_partnerships", (query) => query.in("seller_id", state.sellerIds));
  await safeDelete("product_ranking_snapshot", (query) => query.in("product_id", state.productIds));
  await safeDelete("product_scores", (query) => query.in("product_id", state.productIds));
  await safeDelete("seller_scores", (query) => query.in("seller_id", state.sellerIds));
  await safeDelete("products", (query) => query.in("id", state.productIds));
  await safeDelete("audit_log", (query) => query.in("request_id", state.requestIds));
  await safeDelete("seller_team_invites", (query) => query.in("id", state.teamInviteIds));
  await safeDelete("seller_team_members", (query) => query.in("seller_id", state.sellerIds));
  await safeDelete("sellers", (query) => query.in("id", state.sellerIds));
  await safeDelete("orders", (query) => query.in("id", state.orderIds));
  await safeDelete("user_roles", (query) => query.in("user_id", state.userIds));
  await safeDelete("profiles", (query) => query.in("id", state.userIds));

  for (const userId of state.userIds) {
    try {
      await admin.auth.admin.deleteUser(userId);
    } catch {
      // no-op
    }
  }
}

async function run() {
  const ownerA = await createTempUser("owner-a");
  const memberA = await createTempUser("member-a");
  const ownerB = await createTempUser("owner-b");
  const adminUser = await createTempUser("admin");

  await upsertProfile(ownerA.userId, ownerA.email, "seller", "Owner A");
  await upsertProfile(memberA.userId, memberA.email, "seller", "Member A");
  await upsertProfile(ownerB.userId, ownerB.email, "seller", "Owner B");
  await upsertProfile(adminUser.userId, adminUser.email, "admin", "Admin");
  await grantAdmin(adminUser.userId);

  const sellerA = await insertOne("sellers", {
    id: randomUUID(),
    user_id: ownerA.userId,
    store_name: `Tenant A ${Date.now()}`,
    postal_code: "30140071",
    status: "active",
    commission_rate: 10
  });
  const sellerB = await insertOne("sellers", {
    id: randomUUID(),
    user_id: ownerB.userId,
    store_name: `Tenant B ${Date.now()}`,
    postal_code: "30140071",
    status: "active",
    commission_rate: 12
  });
  state.sellerIds.push(sellerA.id, sellerB.id);

  await insertMany("seller_team_members", [
    {
      seller_id: sellerA.id,
      user_id: ownerA.userId,
      status: "active",
      invited_at: new Date().toISOString(),
      accepted_at: new Date().toISOString()
    },
    {
      seller_id: sellerA.id,
      user_id: memberA.userId,
      status: "active",
      invited_by: ownerA.userId,
      invited_at: new Date().toISOString(),
      accepted_at: new Date().toISOString()
    },
    {
      seller_id: sellerB.id,
      user_id: ownerB.userId,
      status: "active",
      invited_at: new Date().toISOString(),
      accepted_at: new Date().toISOString()
    }
  ]);

  const inviteA = await insertOne("seller_team_invites", {
    seller_id: sellerA.id,
    email: `invite-a-${Date.now()}@belapop-rls.local`,
    full_name: "Invite A",
    invited_by: ownerA.userId
  });
  const inviteB = await insertOne("seller_team_invites", {
    seller_id: sellerB.id,
    email: `invite-b-${Date.now()}@belapop-rls.local`,
    full_name: "Invite B",
    invited_by: ownerB.userId
  });
  state.teamInviteIds.push(inviteA.id, inviteB.id);

  const orderA = await insertOne("orders", {
    id: randomUUID(),
    customer_id: ownerA.userId,
    total_products_cents: 10000,
    total_shipping_cents: 1500,
    total_order_cents: 11500,
    status: "paid",
    payment_status: "paid"
  });
  const orderB = await insertOne("orders", {
    id: randomUUID(),
    customer_id: ownerB.userId,
    total_products_cents: 12000,
    total_shipping_cents: 1800,
    total_order_cents: 13800,
    status: "paid",
    payment_status: "paid"
  });
  state.orderIds.push(orderA.id, orderB.id);

  const subOrderA = await insertOne("sub_orders", {
    id: randomUUID(),
    order_id: orderA.id,
    seller_id: sellerA.id,
    items: [],
    product_total_cents: 10000,
    shipping_total_cents: 1500,
    platform_fee_cents: 1000,
    seller_net_cents: 10500,
    status: "paid",
    payment_status: "paid"
  });
  const subOrderB = await insertOne("sub_orders", {
    id: randomUUID(),
    order_id: orderB.id,
    seller_id: sellerB.id,
    items: [],
    product_total_cents: 12000,
    shipping_total_cents: 1800,
    platform_fee_cents: 1200,
    seller_net_cents: 12600,
    status: "paid",
    payment_status: "paid"
  });
  state.subOrderIds.push(subOrderA.id, subOrderB.id);

  const sellerOrderA = await ensureSellerOrder({
    id: randomUUID(),
    order_id: orderA.id,
    seller_id: sellerA.id,
    status: "delivered",
    payment_status: "paid",
    items_total_cents: 10000,
    shipping_cents: 1500,
    discount_allocated_cents: 0,
    fee_cents: 1000,
    seller_payout_cents: 10500,
    shipped_at: new Date().toISOString(),
    delivered_at: new Date().toISOString()
  });
  const sellerOrderB = await ensureSellerOrder({
    id: randomUUID(),
    order_id: orderB.id,
    seller_id: sellerB.id,
    status: "delivered",
    payment_status: "paid",
    items_total_cents: 12000,
    shipping_cents: 1800,
    discount_allocated_cents: 0,
    fee_cents: 1200,
    seller_payout_cents: 12600,
    shipped_at: new Date().toISOString(),
    delivered_at: new Date().toISOString()
  });
  state.sellerOrderIds.push(sellerOrderA.id, sellerOrderB.id);

  await upsertMany(
    "seller_order_financial_snapshot",
    [
      {
        seller_order_id: sellerOrderA.id,
        seller_id: sellerA.id,
        order_id: orderA.id,
        items_total_cents: 10000,
        shipping_cents: 1500,
        discount_allocated_cents: 0,
        fee_cents: 1000,
        seller_payout_cents: 10500,
        marketplace_margin_cents: 1000
      },
      {
        seller_order_id: sellerOrderB.id,
        seller_id: sellerB.id,
        order_id: orderB.id,
        items_total_cents: 12000,
        shipping_cents: 1800,
        discount_allocated_cents: 0,
        fee_cents: 1200,
        seller_payout_cents: 12600,
        marketplace_margin_cents: 1200
      }
    ],
    "seller_order_id"
  );

  const payoutA = await insertOne("seller_payouts", {
    id: randomUUID(),
    seller_id: sellerA.id,
    period_start: "2026-03-01",
    period_end: "2026-03-15",
    gross_payout_cents: 10500,
    net_payout_cents: 10500,
    status: "scheduled"
  });
  const payoutB = await insertOne("seller_payouts", {
    id: randomUUID(),
    seller_id: sellerB.id,
    period_start: "2026-03-01",
    period_end: "2026-03-15",
    gross_payout_cents: 12600,
    net_payout_cents: 12600,
    status: "scheduled"
  });
  state.sellerPayoutIds.push(payoutA.id, payoutB.id);

  await insertMany("seller_payout_items", [
    { seller_payout_id: payoutA.id, seller_order_id: sellerOrderA.id, payout_amount_cents: 10500 },
    { seller_payout_id: payoutB.id, seller_order_id: sellerOrderB.id, payout_amount_cents: 12600 }
  ]);

  await insertMany("seller_fee_rules", [
    { seller_id: sellerA.id, fee_bps: 1000 },
    { seller_id: sellerB.id, fee_bps: 1200 }
  ]);

  await insertMany("seller_order_shipping_quotes", [
    { seller_order_id: sellerOrderA.id, carrier: "Correios", service: "SEDEX", quoted_shipping_cents: 1500, final_shipping_cents: 1500 },
    { seller_order_id: sellerOrderB.id, carrier: "Correios", service: "PAC", quoted_shipping_cents: 1800, final_shipping_cents: 1800 }
  ]);

  await insertMany("seller_risk_profiles", [
    { seller_id: sellerA.id, risk_score: 12, risk_tier: "low", holdback_bps: 0, payouts_blocked: false },
    { seller_id: sellerB.id, risk_score: 18, risk_tier: "low", holdback_bps: 0, payouts_blocked: false }
  ]);

  await insertMany("seller_risk_signals", [
    { seller_id: sellerA.id, signal_type: "manual_test", signal_date: "2026-03-20", signal_value: 12, weight_bps: 0 },
    { seller_id: sellerB.id, signal_type: "manual_test", signal_date: "2026-03-20", signal_value: 18, weight_bps: 0 }
  ]);

  await insertMany("seller_holdbacks", [
    { seller_id: sellerA.id, seller_payout_id: payoutA.id, holdback_bps: 0, gross_payout_cents: 10500, holdback_cents: 0, net_after_holdback_cents: 10500, status: "active" },
    { seller_id: sellerB.id, seller_payout_id: payoutB.id, holdback_bps: 0, gross_payout_cents: 12600, holdback_cents: 0, net_after_holdback_cents: 12600, status: "active" }
  ]);

  const requestIdA = `tenant-rls-a-${randomUUID()}`;
  const requestIdB = `tenant-rls-b-${randomUUID()}`;
  state.requestIds.push(requestIdA, requestIdB);

  await insertMany("audit_log", [
    {
      actor_user_id: ownerA.userId,
      actor_role: "seller",
      store_id: sellerA.id,
      entity_type: "tenant_rls",
      entity_id: sellerA.id,
      action: "seed",
      request_id: requestIdA
    },
    {
      actor_user_id: ownerB.userId,
      actor_role: "seller",
      store_id: sellerB.id,
      entity_type: "tenant_rls",
      entity_id: sellerB.id,
      action: "seed",
      request_id: requestIdB
    }
  ]);

  const adjustmentA = await insertOne("finance_adjustments", {
    id: randomUUID(),
    seller_id: sellerA.id,
    amount: 50,
    reason: "tenant rls A",
    created_by: ownerA.userId
  });
  const adjustmentB = await insertOne("finance_adjustments", {
    id: randomUUID(),
    seller_id: sellerB.id,
    amount: 75,
    reason: "tenant rls B",
    created_by: ownerB.userId
  });
  state.adjustmentIds.push(adjustmentA.id, adjustmentB.id);

  await insertMany("finance_adjustment_approvals", [
    { adjustment_id: adjustmentA.id, approver_user_id: ownerA.userId, decision: "approved", comment: "ok" },
    { adjustment_id: adjustmentB.id, approver_user_id: ownerB.userId, decision: "approved", comment: "ok" }
  ]);

  const journalA = await insertOne("ledger_journals", {
    id: randomUUID(),
    store_id: sellerA.id,
    order_id: orderA.id,
    reference_type: "tenant_rls",
    reference_id: sellerA.id,
    created_by: ownerA.userId
  });
  const journalB = await insertOne("ledger_journals", {
    id: randomUUID(),
    store_id: sellerB.id,
    order_id: orderB.id,
    reference_type: "tenant_rls",
    reference_id: sellerB.id,
    created_by: ownerB.userId
  });
  state.journalIds.push(journalA.id, journalB.id);

  await insertMany("ledger_entries", [
    {
      journal_id: journalA.id,
      store_id: sellerA.id,
      order_id: orderA.id,
      account_code: "seller_payable",
      direction: "credit",
      amount: 50
    },
    {
      journal_id: journalA.id,
      store_id: sellerA.id,
      order_id: orderA.id,
      account_code: "adjustments_expense",
      direction: "debit",
      amount: 50
    },
    {
      journal_id: journalB.id,
      store_id: sellerB.id,
      order_id: orderB.id,
      account_code: "seller_payable",
      direction: "credit",
      amount: 75
    },
    {
      journal_id: journalB.id,
      store_id: sellerB.id,
      order_id: orderB.id,
      account_code: "adjustments_expense",
      direction: "debit",
      amount: 75
    }
  ]);

  const productA = await insertOne("products", {
    id: randomUUID(),
    seller_id: sellerA.id,
    name: "Produto Tenant A",
    price_cents: 10000,
    status: "published",
    stock_quantity: 10
  });
  const productB = await insertOne("products", {
    id: randomUUID(),
    seller_id: sellerB.id,
    name: "Produto Tenant B",
    price_cents: 12000,
    status: "published",
    stock_quantity: 10
  });
  state.productIds.push(productA.id, productB.id);

  await insertMany("seller_scores", [
    { seller_id: sellerA.id, final_score: 91, exposure_tier: "premium", eligible_featured: true },
    { seller_id: sellerB.id, final_score: 89, exposure_tier: "standard", eligible_featured: true }
  ]);

  await insertMany("product_scores", [
    { product_id: productA.id, seller_id: sellerA.id, final_score: 92, eligible_search: true, eligible_featured: true, in_stock: true },
    { product_id: productB.id, seller_id: sellerB.id, final_score: 88, eligible_search: true, eligible_featured: true, in_stock: true }
  ]);

  await insertMany("product_ranking_snapshot", [
    {
      id: randomUUID(),
      product_id: productA.id,
      seller_id: sellerA.id,
      surface: "search",
      seller_score: 91,
      product_score: 92,
      commercial_score: 60,
      context_score: 50,
      penalty_score: 0,
      final_rank_score: 88
    },
    {
      id: randomUUID(),
      product_id: productB.id,
      seller_id: sellerB.id,
      surface: "search",
      seller_score: 89,
      product_score: 88,
      commercial_score: 58,
      context_score: 50,
      penalty_score: 0,
      final_rank_score: 85
    }
  ]);

  await insertMany("brand_partnerships", [
    { seller_id: sellerA.id, partnership_type: "standard", commission_rate: 0.25, status: "active" },
    { seller_id: sellerB.id, partnership_type: "featured", commission_rate: 0.22, status: "active" }
  ]);

  const returnRequestA = await insertOne("return_requests", {
    id: randomUUID(),
    order_id: orderA.id,
    sub_order_id: subOrderA.id,
    seller_id: sellerA.id,
    customer_id: ownerA.userId,
    request_type: "refund",
    reason: "OTHER",
    status: "requested"
  });
  const returnRequestB = await insertOne("return_requests", {
    id: randomUUID(),
    order_id: orderB.id,
    sub_order_id: subOrderB.id,
    seller_id: sellerB.id,
    customer_id: ownerB.userId,
    request_type: "refund",
    reason: "OTHER",
    status: "requested"
  });
  state.returnRequestIds.push(returnRequestA.id, returnRequestB.id);

  const logisticsExceptionA = await insertOne("logistics_exceptions", {
    id: randomUUID(),
    order_id: orderA.id,
    sub_order_id: subOrderA.id,
    seller_id: sellerA.id,
    exception_code: "delivery_delay",
    dedupe_key: `tenant-rls-a-${randomUUID()}`,
    sla_due_at: new Date(Date.now() + 3600_000).toISOString()
  });
  const logisticsExceptionB = await insertOne("logistics_exceptions", {
    id: randomUUID(),
    order_id: orderB.id,
    sub_order_id: subOrderB.id,
    seller_id: sellerB.id,
    exception_code: "delivery_delay",
    dedupe_key: `tenant-rls-b-${randomUUID()}`,
    sla_due_at: new Date(Date.now() + 3600_000).toISOString()
  });
  state.logisticsExceptionIds.push(logisticsExceptionA.id, logisticsExceptionB.id);

  const clients = {
    ownerA: await signIn(ownerA),
    memberA: await signIn(memberA),
    ownerB: await signIn(ownerB),
    admin: await signIn(adminUser)
  };

  const scenarios = [
    {
      name: "seller_team_members",
      table: "seller_team_members",
      filtersA: [{ op: "eq", column: "seller_id", value: sellerA.id }],
      filtersB: [{ op: "eq", column: "seller_id", value: sellerB.id }],
      expected: { ownerA: [2, 0], memberA: [2, 0], ownerB: [0, 1], admin: [2, 1] }
    },
    {
      name: "seller_team_invites",
      table: "seller_team_invites",
      filtersA: [{ op: "eq", column: "seller_id", value: sellerA.id }],
      filtersB: [{ op: "eq", column: "seller_id", value: sellerB.id }],
      expected: { ownerA: [1, 0], memberA: [1, 0], ownerB: [0, 1], admin: [1, 1] }
    },
    {
      name: "audit_log",
      table: "audit_log",
      filtersA: [{ op: "eq", column: "request_id", value: requestIdA }],
      filtersB: [{ op: "eq", column: "request_id", value: requestIdB }],
      expected: { ownerA: [1, 0], memberA: [1, 0], ownerB: [0, 1], admin: [1, 1] }
    },
    {
      name: "finance_adjustments",
      table: "finance_adjustments",
      filtersA: [{ op: "eq", column: "id", value: adjustmentA.id }],
      filtersB: [{ op: "eq", column: "id", value: adjustmentB.id }],
      expected: { ownerA: [1, 0], memberA: [1, 0], ownerB: [0, 1], admin: [1, 1] }
    },
    {
      name: "finance_adjustment_approvals",
      table: "finance_adjustment_approvals",
      filtersA: [{ op: "eq", column: "adjustment_id", value: adjustmentA.id }],
      filtersB: [{ op: "eq", column: "adjustment_id", value: adjustmentB.id }],
      expected: { ownerA: [1, 0], memberA: [1, 0], ownerB: [0, 1], admin: [1, 1] }
    },
    {
      name: "ledger_journals",
      table: "ledger_journals",
      filtersA: [{ op: "eq", column: "id", value: journalA.id }],
      filtersB: [{ op: "eq", column: "id", value: journalB.id }],
      expected: { ownerA: [1, 0], memberA: [1, 0], ownerB: [0, 1], admin: [1, 1] }
    },
    {
      name: "ledger_entries",
      table: "ledger_entries",
      filtersA: [{ op: "eq", column: "journal_id", value: journalA.id }],
      filtersB: [{ op: "eq", column: "journal_id", value: journalB.id }],
      expected: { ownerA: [2, 0], memberA: [2, 0], ownerB: [0, 2], admin: [2, 2] }
    },
    {
      name: "seller_orders",
      table: "seller_orders",
      filtersA: [{ op: "eq", column: "id", value: sellerOrderA.id }],
      filtersB: [{ op: "eq", column: "id", value: sellerOrderB.id }],
      expected: { ownerA: [1, 0], memberA: [1, 0], ownerB: [0, 1], admin: [1, 1] }
    },
    {
      name: "seller_order_financial_snapshot",
      table: "seller_order_financial_snapshot",
      filtersA: [{ op: "eq", column: "seller_order_id", value: sellerOrderA.id }],
      filtersB: [{ op: "eq", column: "seller_order_id", value: sellerOrderB.id }],
      expected: { ownerA: [1, 0], memberA: [1, 0], ownerB: [0, 1], admin: [1, 1] }
    },
    {
      name: "seller_fee_rules",
      table: "seller_fee_rules",
      filtersA: [{ op: "eq", column: "seller_id", value: sellerA.id }],
      filtersB: [{ op: "eq", column: "seller_id", value: sellerB.id }],
      expected: { ownerA: [1, 0], memberA: [1, 0], ownerB: [0, 1], admin: [1, 1] }
    },
    {
      name: "seller_order_shipping_quotes",
      table: "seller_order_shipping_quotes",
      filtersA: [{ op: "eq", column: "seller_order_id", value: sellerOrderA.id }],
      filtersB: [{ op: "eq", column: "seller_order_id", value: sellerOrderB.id }],
      expected: { ownerA: [1, 0], memberA: [1, 0], ownerB: [0, 1], admin: [1, 1] }
    },
    {
      name: "seller_payouts",
      table: "seller_payouts",
      filtersA: [{ op: "eq", column: "id", value: payoutA.id }],
      filtersB: [{ op: "eq", column: "id", value: payoutB.id }],
      expected: { ownerA: [1, 0], memberA: [1, 0], ownerB: [0, 1], admin: [1, 1] }
    },
    {
      name: "seller_payout_items",
      table: "seller_payout_items",
      filtersA: [{ op: "eq", column: "seller_payout_id", value: payoutA.id }],
      filtersB: [{ op: "eq", column: "seller_payout_id", value: payoutB.id }],
      expected: { ownerA: [1, 0], memberA: [1, 0], ownerB: [0, 1], admin: [1, 1] }
    },
    {
      name: "seller_risk_profiles",
      table: "seller_risk_profiles",
      filtersA: [{ op: "eq", column: "seller_id", value: sellerA.id }],
      filtersB: [{ op: "eq", column: "seller_id", value: sellerB.id }],
      expected: { ownerA: [1, 0], memberA: [1, 0], ownerB: [0, 1], admin: [1, 1] }
    },
    {
      name: "seller_risk_signals",
      table: "seller_risk_signals",
      filtersA: [{ op: "eq", column: "seller_id", value: sellerA.id }],
      filtersB: [{ op: "eq", column: "seller_id", value: sellerB.id }],
      expected: { ownerA: [1, 0], memberA: [1, 0], ownerB: [0, 1], admin: [1, 1] }
    },
    {
      name: "seller_holdbacks",
      table: "seller_holdbacks",
      filtersA: [{ op: "eq", column: "seller_payout_id", value: payoutA.id }],
      filtersB: [{ op: "eq", column: "seller_payout_id", value: payoutB.id }],
      expected: { ownerA: [1, 0], memberA: [1, 0], ownerB: [0, 1], admin: [1, 1] }
    },
    {
      name: "seller_scores",
      table: "seller_scores",
      filtersA: [{ op: "eq", column: "seller_id", value: sellerA.id }],
      filtersB: [{ op: "eq", column: "seller_id", value: sellerB.id }],
      expected: { ownerA: [1, 0], memberA: [1, 0], ownerB: [0, 1], admin: [1, 1] }
    },
    {
      name: "product_scores",
      table: "product_scores",
      filtersA: [{ op: "eq", column: "product_id", value: productA.id }],
      filtersB: [{ op: "eq", column: "product_id", value: productB.id }],
      expected: { ownerA: [1, 0], memberA: [1, 0], ownerB: [0, 1], admin: [1, 1] }
    },
    {
      name: "product_ranking_snapshot",
      table: "product_ranking_snapshot",
      filtersA: [{ op: "eq", column: "product_id", value: productA.id }],
      filtersB: [{ op: "eq", column: "product_id", value: productB.id }],
      expected: { ownerA: [1, 0], memberA: [1, 0], ownerB: [0, 1], admin: [1, 1] }
    },
    {
      name: "brand_partnerships",
      table: "brand_partnerships",
      filtersA: [{ op: "eq", column: "seller_id", value: sellerA.id }],
      filtersB: [{ op: "eq", column: "seller_id", value: sellerB.id }],
      expected: { ownerA: [1, 0], memberA: [1, 0], ownerB: [0, 1], admin: [1, 1] }
    },
    {
      name: "return_requests",
      table: "return_requests",
      filtersA: [{ op: "eq", column: "id", value: returnRequestA.id }],
      filtersB: [{ op: "eq", column: "id", value: returnRequestB.id }],
      expected: { ownerA: [1, 0], memberA: [1, 0], ownerB: [0, 1], admin: [1, 1] }
    },
    {
      name: "logistics_exceptions",
      table: "logistics_exceptions",
      filtersA: [{ op: "eq", column: "id", value: logisticsExceptionA.id }],
      filtersB: [{ op: "eq", column: "id", value: logisticsExceptionB.id }],
      expected: { ownerA: [1, 0], memberA: [1, 0], ownerB: [0, 1], admin: [1, 1] }
    }
  ];

  for (const scenario of scenarios) {
    await assertIsolation(clients, scenario);
  }

  console.log("== Tenant RLS isolation OK ==");
  console.log(
    JSON.stringify(
      {
        sellers: { sellerA: sellerA.id, sellerB: sellerB.id },
        users: {
          ownerA: ownerA.userId,
          memberA: memberA.userId,
          ownerB: ownerB.userId,
          admin: adminUser.userId
        },
        scenarios: scenarios.map((scenario) => scenario.name),
        keepRecords: KEEP_RECORDS
      },
      null,
      2
    )
  );
}

run()
  .catch((error) => {
    console.error("[FAIL] Tenant RLS isolation:", error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    await cleanup();
  });
