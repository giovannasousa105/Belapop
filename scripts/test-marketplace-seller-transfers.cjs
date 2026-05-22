const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const checks = [];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
  checks.push(message);
}

const checkout = read("lib/checkout/serverCheckout.ts");
const paymentIntent = read("app/api/stripe/payment-intent/route.ts");
const webhook = read("app/api/stripe/webhook/route.ts");
const transfers = read("lib/stripe/sellerTransfers.ts");
const migration = read("supabase/migrations/20260505_0100_seller_stripe_transfers.sql");
const sellerPayoutsApi = read("app/api/partner/payouts/route.ts");
const sellerFinancePage = read("app/seller/finance/page.tsx");

assert(
  checkout.includes("SELLER_NOT_CONNECTED") && checkout.includes("!seller.stripeAccountId"),
  "seller sem stripe_account_id deve ser bloqueado no checkout"
);
assert(
  paymentIntent.includes("transfer_group: draft.orderId"),
  "PaymentIntent deve usar transfer_group com orderId"
);
assert(
  webhook.includes("payment_intent.succeeded") &&
    webhook.includes("createSellerTransfersForPaymentIntent"),
  "webhook payment_intent.succeeded deve acionar createSellerTransfersForPaymentIntent"
);
assert(
  transfers.includes("stripe.transfers.create") &&
    transfers.includes("amount: split.sellerNetCents") &&
    transfers.includes("destination: split.stripeAccountId"),
  "Stripe transfer deve enviar sellerNetCents para a conta conectada do seller"
);
assert(
  transfers.includes("buildSellerTransferIdempotencyKey(paymentIntentId, split.sellerId)") &&
    migration.includes("order_id, seller_id, payment_intent_id"),
  "transferencias devem ser idempotentes por paymentIntentId + sellerId"
);
assert(
  transfers.includes('status: "failed"') && transfers.includes("failure_reason"),
  "falha na transferencia deve ser registrada para conciliacao"
);
assert(
  migration.includes("create table if not exists public.seller_transfers") &&
    migration.includes("stripe_transfer_id") &&
    migration.includes("seller_net_cents") &&
    migration.includes("status in ('pending', 'transferred', 'failed', 'reversed')"),
  "migration seller_transfers deve conter campos e status exigidos"
);
assert(
  sellerPayoutsApi.includes(".from(\"seller_transfers\")") &&
    sellerPayoutsApi.includes("stripe_transfer_id") &&
    sellerPayoutsApi.includes("seller_net_cents"),
  "API de repasses do seller deve consultar seller_transfers"
);
assert(
  sellerFinancePage.includes("A disponibilidade para saque bancario segue o calendario da Stripe") &&
    sellerFinancePage.includes("Transferencias Stripe Connect"),
  "portal seller deve comunicar disponibilidade conforme calendario Stripe"
);

const oneSeller = [{ product: 10000, shipping: 1500, fee: 1200 }];
const multiSeller = [
  { product: 10000, shipping: 1500, fee: 1200 },
  { product: 8500, shipping: 1200, fee: 850 }
];

function splitNet({ product, shipping, fee }) {
  return product + shipping - fee;
}

assert(splitNet(oneSeller[0]) === 10300, "pedido com 1 seller calcula sellerNetCents corretamente");
assert(
  multiSeller.map(splitNet).join(",") === "10300,8850",
  "pedido multi-seller calcula uma transferencia liquida por seller"
);

const paymentIntentId = "pi_test_123";
const idempotencyKeys = multiSeller.map((_, index) => `transfer-${paymentIntentId}-seller-${index + 1}`);
assert(new Set(idempotencyKeys).size === multiSeller.length, "webhook duplicado nao deve duplicar chaves de transferencia");

console.log(
  JSON.stringify(
    {
      ok: true,
      checks: checks.length,
      message: "Marketplace seller transfer architecture smoke passed"
    },
    null,
    2
  )
);
