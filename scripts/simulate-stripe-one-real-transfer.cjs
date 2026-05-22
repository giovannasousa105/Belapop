const crypto = require("node:crypto");
const path = require("node:path");

require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local"), quiet: true });
require("dotenv").config({ path: path.resolve(process.cwd(), ".env"), quiet: true });

const Stripe = require("stripe");

const secretKey = String(process.env.STRIPE_TEST_SECRET_KEY || process.env.STRIPE_SECRET_KEY || "").trim();
const connectedAccountId = String(
  process.env.STRIPE_TEST_CONNECTED_ACCOUNT_ID ||
    process.env.STRIPE_CONNECT_TEST_ACCOUNT_ID ||
    process.env.BELAPOP_TEST_CONNECTED_ACCOUNT_ID ||
    ""
).trim();

function fail(message) {
  console.error(JSON.stringify({ ok: false, error: message }, null, 2));
  process.exit(1);
}

function mask(value) {
  if (!value) return "<empty>";
  if (value.length <= 12) return "<set>";
  return `${value.slice(0, 7)}...${value.slice(-4)}`;
}

function centsToBRL(cents) {
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

if (!secretKey) {
  fail("Defina STRIPE_TEST_SECRET_KEY com uma chave sk_test antes de rodar a simulacao.");
}

if (!secretKey.startsWith("sk_test_")) {
  fail(
    `Simulacao bloqueada: a chave carregada (${mask(secretKey)}) nao e sk_test. ` +
      "Nao vou criar cobranca ou transferencia com chave live/restricted."
  );
}

if (!connectedAccountId || !connectedAccountId.startsWith("acct_")) {
  fail(
    "Defina STRIPE_TEST_CONNECTED_ACCOUNT_ID com a conta Stripe Connect de teste que deve receber o repasse."
  );
}

const stripe = new Stripe(secretKey, {
  apiVersion: "2025-10-29.clover"
});

async function main() {
  const orderId = `belapop-test-${crypto.randomUUID()}`;
  const amount = 100;
  const platformFee = 0;
  const sellerNet = amount - platformFee;
  const paymentIntentIdempotencyKey = `belapop-one-real-pi-${orderId}`;
  const transferIdempotencyKey = `belapop-one-real-transfer-${orderId}-${connectedAccountId}`;

  const paymentIntent = await stripe.paymentIntents.create(
    {
      amount,
      currency: "brl",
      confirm: true,
      payment_method: "pm_card_visa",
      payment_method_types: ["card"],
      description: "BelaPop simulacao segura R$ 1,00 em Stripe Test",
      transfer_group: orderId,
      metadata: {
        orderId,
        simulation: "one_real_transfer_test",
        sellerNetCents: String(sellerNet)
      }
    },
    {
      idempotencyKey: paymentIntentIdempotencyKey
    }
  );

  if (paymentIntent.status !== "succeeded") {
    fail(`PaymentIntent de teste nao aprovou. Status retornado: ${paymentIntent.status}`);
  }

  const transfer = await stripe.transfers.create(
    {
      amount: sellerNet,
      currency: "brl",
      destination: connectedAccountId,
      transfer_group: orderId,
      metadata: {
        orderId,
        paymentIntentId: paymentIntent.id,
        simulation: "one_real_transfer_test",
        grossAmountCents: String(amount),
        platformFeeCents: String(platformFee),
        sellerNetCents: String(sellerNet)
      }
    },
    {
      idempotencyKey: transferIdempotencyKey
    }
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: "stripe-test",
        realMoneyMoved: false,
        amount: centsToBRL(amount),
        sellerNet: centsToBRL(sellerNet),
        currency: "brl",
        orderId,
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          transferGroup: paymentIntent.transfer_group
        },
        transfer: {
          id: transfer.id,
          destination: transfer.destination,
          amount: centsToBRL(transfer.amount),
          transferGroup: transfer.transfer_group
        },
        idempotency: {
          paymentIntent: paymentIntentIdempotencyKey,
          transfer: transferIdempotencyKey
        },
        note:
          "Isso valida o fluxo em Stripe Test. O valor aparece no saldo de teste da conta conectada, nao em conta bancaria real."
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : "Erro desconhecido na simulacao Stripe Test.");
});
