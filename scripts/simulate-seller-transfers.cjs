const crypto = require("node:crypto");

const currency = "brl";
const orderId = "11111111-1111-4111-8111-111111111111";
const paymentIntent = {
  id: "pi_test_belapop_transfer_sim",
  currency,
  transfer_group: orderId
};

const scenarios = [
  {
    name: "pedido com 1 seller cria 1 transferencia",
    splits: [
      {
        subOrderId: "21111111-1111-4111-8111-111111111111",
        sellerId: "seller-clinical-luxury",
        stripeAccountId: "acct_test_clinical",
        grossAmountCents: 10000,
        platformFeeCents: 1200,
        shippingTotalCents: 1500,
        sellerNetCents: 10300
      }
    ]
  },
  {
    name: "pedido multi-seller cria 1 transferencia por seller",
    splits: [
      {
        subOrderId: "31111111-1111-4111-8111-111111111111",
        sellerId: "seller-glow",
        stripeAccountId: "acct_test_glow",
        grossAmountCents: 10000,
        platformFeeCents: 1200,
        shippingTotalCents: 1500,
        sellerNetCents: 10300
      },
      {
        subOrderId: "41111111-1111-4111-8111-111111111111",
        sellerId: "seller-sensitive",
        stripeAccountId: "acct_test_sensitive",
        grossAmountCents: 8500,
        platformFeeCents: 850,
        shippingTotalCents: 1200,
        sellerNetCents: 8850
      }
    ]
  },
  {
    name: "falha em uma transferencia fica registrada para conciliacao",
    splits: [
      {
        subOrderId: "51111111-1111-4111-8111-111111111111",
        sellerId: "seller-ok",
        stripeAccountId: "acct_test_ok",
        grossAmountCents: 12000,
        platformFeeCents: 1440,
        shippingTotalCents: 1800,
        sellerNetCents: 12360
      },
      {
        subOrderId: "61111111-1111-4111-8111-111111111111",
        sellerId: "seller-fail",
        stripeAccountId: "acct_test_fail",
        grossAmountCents: 9000,
        platformFeeCents: 1080,
        shippingTotalCents: 1000,
        sellerNetCents: 8920,
        shouldFail: true
      }
    ]
  }
];

function buildIdempotencyKey(paymentIntentId, sellerId) {
  return `transfer-${paymentIntentId}-${sellerId}`;
}

function transferIdFromKey(key) {
  return `tr_sim_${crypto.createHash("sha1").update(key).digest("hex").slice(0, 18)}`;
}

function createMemoryDb() {
  return {
    sellerTransfers: new Map(),
    marketplaceEvents: []
  };
}

function transferKey(orderIdValue, sellerId, paymentIntentId) {
  return `${orderIdValue}:${sellerId}:${paymentIntentId}`;
}

function simulateWebhookRun({ db, splits, paymentIntentValue }) {
  const results = [];

  for (const split of splits) {
    const rowKey = transferKey(orderId, split.sellerId, paymentIntentValue.id);
    const existing = db.sellerTransfers.get(rowKey);

    if (existing?.status === "transferred" && existing.stripe_transfer_id) {
      results.push({
        sellerId: split.sellerId,
        status: "skipped",
        stripeTransferId: existing.stripe_transfer_id,
        sellerNetCents: split.sellerNetCents
      });
      continue;
    }

    const pending = existing ?? {
      id: crypto.randomUUID(),
      order_id: orderId,
      sub_order_id: split.subOrderId,
      seller_id: split.sellerId,
      payment_intent_id: paymentIntentValue.id,
      stripe_account_id: split.stripeAccountId,
      stripe_transfer_id: null,
      gross_amount_cents: split.grossAmountCents,
      platform_fee_cents: split.platformFeeCents,
      shipping_total_cents: split.shippingTotalCents,
      seller_net_cents: split.sellerNetCents,
      currency: paymentIntentValue.currency.toUpperCase(),
      status: "pending",
      failure_reason: null
    };

    db.sellerTransfers.set(rowKey, pending);

    const idempotencyKey = buildIdempotencyKey(paymentIntentValue.id, split.sellerId);
    if (split.shouldFail) {
      pending.status = "failed";
      pending.failure_reason = "Simulated Stripe transfer failure";
      db.marketplaceEvents.push({
        event_name: "seller_transfer_failed",
        order_id: orderId,
        seller_id: split.sellerId,
        amount_cents: split.sellerNetCents,
        idempotency_key: idempotencyKey
      });
      results.push({
        sellerId: split.sellerId,
        status: "failed",
        sellerNetCents: split.sellerNetCents,
        failureReason: pending.failure_reason
      });
      continue;
    }

    pending.status = "transferred";
    pending.stripe_transfer_id = transferIdFromKey(idempotencyKey);
    pending.transferred_at = new Date("2026-05-05T12:00:00.000Z").toISOString();
    db.marketplaceEvents.push({
      event_name: "seller_transfer_created",
      order_id: orderId,
      seller_id: split.sellerId,
      amount_cents: split.sellerNetCents,
      idempotency_key: idempotencyKey,
      stripe_transfer_id: pending.stripe_transfer_id
    });
    results.push({
      sellerId: split.sellerId,
      status: "transferred",
      stripeTransferId: pending.stripe_transfer_id,
      sellerNetCents: split.sellerNetCents
    });
  }

  return results;
}

function centsToBRL(cents) {
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

const report = scenarios.map((scenario) => {
  const db = createMemoryDb();
  const firstRun = simulateWebhookRun({ db, splits: scenario.splits, paymentIntentValue: paymentIntent });
  const duplicateRun = simulateWebhookRun({ db, splits: scenario.splits, paymentIntentValue: paymentIntent });
  const rows = Array.from(db.sellerTransfers.values());
  const transferredRows = rows.filter((row) => row.status === "transferred");
  const failedRows = rows.filter((row) => row.status === "failed");
  const expectedTransfers = scenario.splits.filter((split) => !split.shouldFail).length;
  const expectedFailures = scenario.splits.filter((split) => split.shouldFail).length;

  if (transferredRows.length !== expectedTransfers) {
    throw new Error(`${scenario.name}: quantidade de transfers divergente.`);
  }
  if (failedRows.length !== expectedFailures) {
    throw new Error(`${scenario.name}: quantidade de falhas divergente.`);
  }
  if (rows.length !== scenario.splits.length) {
    throw new Error(`${scenario.name}: webhook duplicado criou linhas extras.`);
  }
  for (const split of scenario.splits) {
    const row = rows.find((item) => item.seller_id === split.sellerId);
    if (!row) throw new Error(`${scenario.name}: seller ${split.sellerId} sem ledger.`);
    const expectedNet = split.grossAmountCents + split.shippingTotalCents - split.platformFeeCents;
    if (row.seller_net_cents !== expectedNet) {
      throw new Error(`${scenario.name}: sellerNetCents incorreto para ${split.sellerId}.`);
    }
  }

  return {
    scenario: scenario.name,
    firstRun,
    duplicateRun,
    ledgerRows: rows.map((row) => ({
      sellerId: row.seller_id,
      status: row.status,
      gross: centsToBRL(row.gross_amount_cents),
      platformFee: centsToBRL(row.platform_fee_cents),
      shipping: centsToBRL(row.shipping_total_cents),
      sellerNet: centsToBRL(row.seller_net_cents),
      stripeTransferId: row.stripe_transfer_id,
      failureReason: row.failure_reason
    })),
    marketplaceEvents: db.marketplaceEvents.length
  };
});

console.log(
  JSON.stringify(
    {
      ok: true,
      mode: "local-memory-simulation",
      stripe: "mocked; no real Stripe API call",
      paymentIntentId: paymentIntent.id,
      transferGroup: paymentIntent.transfer_group,
      scenarios: report
    },
    null,
    2
  )
);
