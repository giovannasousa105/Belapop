#!/usr/bin/env node
const { createHmac, randomUUID } = require("node:crypto");
const { spawn } = require("node:child_process");
const path = require("node:path");

const dotenv = require("dotenv");
const { createClient } = require("@supabase/supabase-js");

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const PORT = Number(process.env.SMOKE_SALE_PORT || 3011);
const HOST = "127.0.0.1";
const BASE_URL = `http://${HOST}:${PORT}`;
const WEBHOOK_SECRET = process.env.SMOKE_PAYMENT_WEBHOOK_SECRET || "local-smoke-webhook-secret";
const TARGET_CUSTOMER_EMAIL = process.env.SMOKE_CUSTOMER_EMAIL || "giovannasousa105@gmail.com";
const KEEP_RECORDS = process.argv.includes("--keep");
const READY_TIMEOUT_MS = 120_000;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sao obrigatorios.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const nextBin = require.resolve("next/dist/bin/next");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const cents = (value) => Math.round(Number(value) * 100);

const postJson = async (pathname, body, headers = {}) => {
  const response = await fetch(`${BASE_URL}${pathname}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers
    },
    body: JSON.stringify(body)
  });
  const text = await response.text();
  const json = text ? JSON.parse(text) : null;
  return { ok: response.ok, status: response.status, json };
};

async function waitForServer() {
  const startedAt = Date.now();
  let lastError = "server_not_started";

  while (Date.now() - startedAt < READY_TIMEOUT_MS) {
    try {
      const response = await fetch(`${BASE_URL}/login`, { redirect: "manual" });
      if (response.status < 500) {
        return;
      }
      lastError = `http_${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await sleep(1500);
  }

  throw new Error(`Servidor nao ficou pronto em ${READY_TIMEOUT_MS}ms (${lastError}).`);
}

async function pickCustomer() {
  const byEmail = await supabase
    .from("profiles")
    .select("id,email,role")
    .eq("email", TARGET_CUSTOMER_EMAIL)
    .maybeSingle();

  if (!byEmail.error && byEmail.data) {
    return byEmail.data;
  }

  const fallback = await supabase
    .from("profiles")
    .select("id,email,role")
    .eq("role", "customer")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fallback.error || !fallback.data) {
    throw new Error("Nenhum cliente elegivel foi encontrado para o smoke.");
  }

  return fallback.data;
}

async function pickProduct() {
  const { data, error } = await supabase
    .from("products")
    .select(
      "id,name,price_cents,status,stock_quantity,seller_id,weight_kg,width_cm,height_cm,length_cm,sellers!products_seller_id_fkey(id,store_name,status,commission_rate,stripe_account_id)"
    )
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    throw new Error(`Falha ao buscar produtos: ${error.message}`);
  }

  const product = (data || []).find(
    (row) =>
      Number(row.stock_quantity ?? 0) > 0 &&
      row.sellers &&
      row.sellers.status === "active"
  );

  if (!product) {
    throw new Error("Nenhum produto publicado/ativo com estoque foi encontrado.");
  }

  return product;
}

async function verifyArtifacts(orderId, subOrderId, paymentIntentId, eventId) {
  const [orderLookup, subOrderLookup, paymentLookup, eventLookup, webhookLookup] = await Promise.all([
    supabase
      .from("orders")
      .select("id,status,payment_status,payment_provider,payment_intent_id,total_order_cents,total_shipping_cents,total_products_cents")
      .eq("id", orderId)
      .maybeSingle(),
    supabase
      .from("sub_orders")
      .select("id,status,payment_status")
      .eq("id", subOrderId)
      .maybeSingle(),
    supabase
      .from("payments")
      .select("order_id,status,provider,provider_ref,amount_cents,currency")
      .eq("order_id", orderId)
      .maybeSingle(),
    supabase
      .from("marketplace_events")
      .select("order_id,event_name,provider,external_ref,amount_cents,currency")
      .eq("order_id", orderId)
      .eq("event_name", "order_paid")
      .order("occurred_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("webhook_events")
      .select("provider,event_id,event_type,status")
      .eq("provider", "payment")
      .eq("event_id", eventId)
      .maybeSingle()
  ]);

  if (orderLookup.error) throw new Error(`Falha ao verificar order: ${orderLookup.error.message}`);
  if (subOrderLookup.error) throw new Error(`Falha ao verificar sub_order: ${subOrderLookup.error.message}`);
  if (paymentLookup.error) throw new Error(`Falha ao verificar payment: ${paymentLookup.error.message}`);
  if (eventLookup.error) throw new Error(`Falha ao verificar marketplace_events: ${eventLookup.error.message}`);
  if (webhookLookup.error) throw new Error(`Falha ao verificar webhook_events: ${webhookLookup.error.message}`);

  if (!orderLookup.data) throw new Error("Order nao encontrada apos o smoke.");
  if (!subOrderLookup.data) throw new Error("Sub_order nao encontrada apos o smoke.");
  if (!paymentLookup.data) throw new Error("Payment nao encontrado apos o smoke.");
  if (!eventLookup.data) throw new Error("Evento order_paid nao encontrado apos o smoke.");
  if (!webhookLookup.data) throw new Error("Webhook_events nao encontrado apos o smoke.");

  if (orderLookup.data.payment_status !== "paid") {
    throw new Error(`Order payment_status esperado=paid atual=${orderLookup.data.payment_status}`);
  }
  if (paymentLookup.data.status !== "paid") {
    throw new Error(`Payment status esperado=paid atual=${paymentLookup.data.status}`);
  }
  if (subOrderLookup.data.payment_status !== "paid") {
    throw new Error(
      `Sub_order payment_status esperado=paid atual=${subOrderLookup.data.payment_status}`
    );
  }
  if (subOrderLookup.data.status !== "awaiting_shipment") {
    throw new Error(`Sub_order status esperado=awaiting_shipment atual=${subOrderLookup.data.status}`);
  }
  if (eventLookup.data.external_ref !== paymentIntentId) {
    throw new Error("marketplace_events.external_ref divergente do payment intent.");
  }
  if (webhookLookup.data.status !== "processed") {
    throw new Error(`Webhook status esperado=processed atual=${webhookLookup.data.status}`);
  }

  return {
    order: orderLookup.data,
    subOrder: subOrderLookup.data,
    payment: paymentLookup.data,
    marketplaceEvent: eventLookup.data,
    webhookEvent: webhookLookup.data
  };
}

async function cleanupArtifacts(orderId, subOrderId, eventId) {
  const steps = [
    () => supabase.from("marketplace_events").delete().eq("order_id", orderId),
    () =>
      supabase
        .from("webhook_events")
        .delete()
        .eq("provider", "payment")
        .eq("event_id", eventId),
    () => supabase.from("payments").delete().eq("order_id", orderId),
    () => supabase.from("sub_orders").delete().eq("id", subOrderId),
    () => supabase.from("orders").delete().eq("id", orderId)
  ];

  for (const step of steps) {
    const result = await step();
    if (result.error) {
      throw new Error(`Falha no cleanup: ${result.error.message}`);
    }
  }
}

async function run() {
  const server = spawn(process.execPath, [nextBin, "dev", "-p", String(PORT), "-H", HOST], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ENABLE_SMOKE_SALE_STUB: "1",
      PAYMENT_WEBHOOK_SECRET: WEBHOOK_SECRET,
      NEXT_PUBLIC_SITE_URL: BASE_URL,
      APP_URL: BASE_URL
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  let stdoutTail = "";
  let stderrTail = "";

  server.stdout.on("data", (chunk) => {
    stdoutTail = `${stdoutTail}${chunk.toString()}`.slice(-4000);
  });
  server.stderr.on("data", (chunk) => {
    stderrTail = `${stderrTail}${chunk.toString()}`.slice(-4000);
  });

  const stopServer = async () => {
    if (server.killed || server.exitCode !== null) return;
    server.kill("SIGTERM");
    await sleep(1500);
    if (server.exitCode === null) {
      server.kill("SIGKILL");
    }
  };

  let orderId = null;
  let subOrderId = null;
  let eventId = null;

  try {
    await waitForServer();

    const [customer, product] = await Promise.all([pickCustomer(), pickProduct()]);
    const unitPrice = Number(product.price_cents) / 100;
    const cartItems = [
      {
        productId: product.id,
        sellerId: product.seller_id,
        quantity: 1,
        weightKg: Number(product.weight_kg ?? 0.3),
        widthCm: Number(product.width_cm ?? 12),
        heightCm: Number(product.height_cm ?? 6),
        lengthCm: Number(product.length_cm ?? 18),
        price: unitPrice
      }
    ];

    const quoteResponse = await postJson("/api/shipping/quote", {
      destinationCep: "38440000",
      cartItems
    });
    if (!quoteResponse.ok) {
      throw new Error(`Shipping quote falhou (${quoteResponse.status}): ${JSON.stringify(quoteResponse.json)}`);
    }

    const shipment = quoteResponse.json?.shipments?.[0];
    if (!shipment) {
      throw new Error("Shipping quote nao retornou shipment.");
    }

    orderId = randomUUID();
    subOrderId = randomUUID();

    const paymentResponse = await postJson("/api/stripe/payment-intent", {
      orderId,
      items: [
        {
          productId: product.id,
          sellerId: product.seller_id,
          sellerName: product.sellers.store_name,
          stripeAccountId: product.sellers.stripe_account_id ?? undefined,
          commissionRate: product.sellers.commission_rate ?? undefined,
          quantity: 1,
          price: unitPrice
        }
      ],
      shipments: [
        {
          sellerId: product.seller_id,
          price: shipment.price,
          serviceName: shipment.serviceName
        }
      ]
    });
    if (!paymentResponse.ok) {
      throw new Error(`Payment intent falhou (${paymentResponse.status}): ${JSON.stringify(paymentResponse.json)}`);
    }

    const split = paymentResponse.json?.splits?.[0];
    if (!split) {
      throw new Error("Payment intent nao retornou split.");
    }

    const createdAt = new Date().toISOString();
    const orderPayload = {
      id: orderId,
      customer_id: customer.id,
      total_products_cents: Number(product.price_cents),
      total_shipping_cents: cents(shipment.price),
      total_order_cents: cents(paymentResponse.json.totalAmount),
      status: "created",
      payment_status: "pending",
      payment_provider: "smoke_local",
      payment_intent_id: paymentResponse.json.paymentIntentId,
      address: {
        fullName: customer.email,
        street: "Rua Smoke",
        number: "100",
        city: "Araguari",
        state: "MG",
        zip: "38440000",
        complement: "Teste"
      },
      destination_cep: "38440000",
      created_at: createdAt,
      issues: {},
      shipping: {
        carrier: shipment.carrier,
        service_name: shipment.serviceName,
        price_cents: cents(shipment.price),
        destination_cep: "38440000"
      }
    };

    const orderInsert = await supabase.from("orders").insert(orderPayload);
    if (orderInsert.error) {
      throw new Error(`Insert order falhou: ${orderInsert.error.message}`);
    }

    const subOrderInsert = await supabase.from("sub_orders").insert({
      id: subOrderId,
      order_id: orderId,
      seller_id: product.seller_id,
      items: [
        {
          productId: product.id,
          sellerId: product.seller_id,
          quantity: 1
        }
      ],
      product_total_cents: Number(product.price_cents),
      shipping_total_cents: cents(shipment.price),
      platform_fee_cents: cents(split.platformFee),
      seller_net_cents: cents(split.sellerNetAmount),
      shipping_service: shipment.serviceName,
      shipping_days: shipment.deliveryTimeDays,
      status: "created",
      payment_status: "pending",
      created_at: createdAt
    });
    if (subOrderInsert.error) {
      throw new Error(`Insert sub_order falhou: ${subOrderInsert.error.message}`);
    }

    eventId = `smoke-payment-approved-${orderId}`;
    const webhookPayload = {
      event: "payment.approved",
      event_id: eventId,
      event_time: createdAt,
      data: {
        order_id: orderId,
        store_id: product.seller_id,
        amount: Number(paymentResponse.json.totalAmount),
        currency: "BRL",
        payment_method: "card",
        provider: "smoke_local",
        provider_reference: paymentResponse.json.paymentIntentId,
        device_id: "smoke-device",
        session_id: "smoke-session",
        ip_address: "127.0.0.1",
        user_agent: "smoke-product-sale-local"
      }
    };
    const rawWebhookBody = JSON.stringify(webhookPayload);
    const timestamp = String(Date.now());
    const signature = createHmac("sha256", WEBHOOK_SECRET)
      .update(`${timestamp}.${rawWebhookBody}`)
      .digest("hex");

    const webhookResponse = await fetch(`${BASE_URL}/api/webhooks/payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-timestamp": timestamp,
        "x-signature": `sha256=${signature}`
      },
      body: rawWebhookBody
    });
    const webhookText = await webhookResponse.text();
    const webhookJson = webhookText ? JSON.parse(webhookText) : null;
    if (!webhookResponse.ok || webhookJson?.processed !== true) {
      throw new Error(
        `Webhook payment falhou (${webhookResponse.status}): ${JSON.stringify(webhookJson)}`
      );
    }

    const verification = await verifyArtifacts(
      orderId,
      subOrderId,
      paymentResponse.json.paymentIntentId,
      eventId
    );

    console.log("== Smoke de venda concluido ==");
    console.log(
      JSON.stringify(
        {
          baseUrl: BASE_URL,
          customer: { id: customer.id, email: customer.email },
          product: {
            id: product.id,
            name: product.name,
            sellerId: product.seller_id,
            sellerName: product.sellers.store_name
          },
          shipment,
          paymentIntent: {
            id: paymentResponse.json.paymentIntentId,
            totalAmount: paymentResponse.json.totalAmount,
            mode: paymentResponse.json.mode ?? "live"
          },
          verification
        },
        null,
        2
      )
    );

    if (!KEEP_RECORDS) {
      await cleanupArtifacts(orderId, subOrderId, eventId);
      console.log("Cleanup concluido.");
    } else {
      console.log("Registros mantidos por --keep.");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[FAIL] Smoke de venda:", message);
    if (stdoutTail) {
      console.error("\n--- next stdout tail ---\n" + stdoutTail);
    }
    if (stderrTail) {
      console.error("\n--- next stderr tail ---\n" + stderrTail);
    }
    process.exitCode = 1;
  } finally {
    try {
      if (!KEEP_RECORDS && orderId && subOrderId && eventId) {
        await cleanupArtifacts(orderId, subOrderId, eventId).catch(() => {});
      }
    } finally {
      await stopServer();
    }
  }
}

run().catch((error) => {
  console.error("[FAIL] Smoke de venda:", error instanceof Error ? error.message : String(error));
  process.exit(1);
});
