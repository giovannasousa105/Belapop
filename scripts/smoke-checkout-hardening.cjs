#!/usr/bin/env node
const { randomUUID } = require("node:crypto");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const dotenv = require("dotenv");
const { createClient } = require("@supabase/supabase-js");

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const PORT = Number(process.env.SMOKE_CHECKOUT_PORT || 3023);
const HOST = "127.0.0.1";
const BASE_URL = process.env.SMOKE_BASE_URL || `http://${HOST}:${PORT}`;
const READY_TIMEOUT_MS = 120_000;
const KEEP_RECORDS = process.argv.includes("--keep");
const USE_EXISTING_SERVER = process.env.SMOKE_USE_EXISTING_SERVER === "1";
const nextBin = require.resolve("next/dist/bin/next");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY e SUPABASE_SERVICE_ROLE_KEY sao obrigatorios."
  );
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const browser = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const ensureJson = async (response) => {
  const text = await response.text();
  return text ? JSON.parse(text) : null;
};

function parseSetCookies(response) {
  const raw = typeof response.headers.getSetCookie === "function"
    ? response.headers.getSetCookie()
    : (() => {
        const single = response.headers.get("set-cookie");
        return single ? [single] : [];
      })();

  return raw
    .map((value) => String(value).split(";")[0]?.trim())
    .filter(Boolean)
    .join("; ");
}

async function waitForServer() {
  const startedAt = Date.now();
  let lastError = "server_not_started";

  while (Date.now() - startedAt < READY_TIMEOUT_MS) {
    try {
      const response = await fetch(`${BASE_URL}/login`, { redirect: "manual" });
      if (response.status < 500) return;
      lastError = `http_${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }

    await sleep(1500);
  }

  throw new Error(`Servidor nao ficou pronto em ${READY_TIMEOUT_MS}ms (${lastError}).`);
}

async function createTempUser() {
  const email = `checkout-hardening-${Date.now()}@belapop-smoke.local`;
  const password = `Bp!${randomUUID()}Aa1`;

  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: "Checkout Hardening Smoke"
    }
  });

  if (created.error || !created.data.user) {
    throw new Error(`Falha ao criar usuario temporario: ${created.error?.message ?? "desconhecido"}`);
  }

  await admin.from("profiles").upsert({
    id: created.data.user.id,
    email,
    role: "customer",
    full_name: "Checkout Hardening Smoke"
  });

  return {
    userId: created.data.user.id,
    email,
    password
  };
}

async function signInAndSyncSession(credentials) {
  const signedIn = await browser.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password
  });

  if (signedIn.error || !signedIn.data.session) {
    throw new Error(`Falha no sign in temporario: ${signedIn.error?.message ?? "sem sessao"}`);
  }

  const syncResponse = await fetch(`${BASE_URL}/api/auth/sync-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      accessToken: signedIn.data.session.access_token,
      refreshToken: signedIn.data.session.refresh_token
    })
  });

  const syncJson = await ensureJson(syncResponse);
  if (!syncResponse.ok) {
    throw new Error(`Falha ao sincronizar sessao: ${JSON.stringify(syncJson)}`);
  }

  const cookie = parseSetCookies(syncResponse);
  if (!cookie) {
    throw new Error("Nao foi possivel obter cookies da sessao sincronizada.");
  }

  return {
    cookie,
    accessToken: signedIn.data.session.access_token,
    refreshToken: signedIn.data.session.refresh_token
  };
}

async function pickPublishedProduct() {
  const query = await admin
    .from("products")
    .select("id,name,seller_id,stock_quantity,status")
    .eq("status", "published")
    .gt("stock_quantity", 0)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (query.error || !query.data) {
    throw new Error(`Nenhum produto publicado elegivel para o smoke: ${query.error?.message ?? "sem produto"}`);
  }

  return query.data;
}

async function ensureCartForUser(userId, product) {
  const payload = {
    user_id: userId,
    status: "active",
    items: [
      {
        productId: product.id,
        quantity: 1,
        sellerId: product.seller_id
      }
    ],
    subtotal_cents: 0
  };

  const result = await admin
    .from("carts")
    .upsert(payload, { onConflict: "user_id" })
    .select("id")
    .maybeSingle();

  if (result.error || !result.data?.id) {
    throw new Error(`Falha ao criar carrinho para smoke: ${result.error?.message ?? "sem id"}`);
  }

  return result.data.id;
}

async function fetchWithSession(pathname, options = {}, cookie) {
  const headers = {
    ...(options.headers || {}),
    Cookie: cookie
  };

  return fetch(`${BASE_URL}${pathname}`, {
    ...options,
    headers
  });
}

async function cleanupArtifacts({ userId, orderId, checkoutSessionId, paymentIntentId }) {
  if (!KEEP_RECORDS && paymentIntentId && paymentIntentId.startsWith("pi_")) {
    try {
      const stripe = require("stripe")(String(process.env.STRIPE_SECRET_KEY || "").trim());
      if (process.env.STRIPE_SECRET_KEY) {
        await stripe.paymentIntents.cancel(paymentIntentId).catch(() => {});
      }
    } catch {
      // no-op
    }
  }

  if (orderId) {
    await admin.from("payment_states").delete().eq("order_id", orderId);
    await admin.from("payments").delete().eq("order_id", orderId);
    await admin.from("checkout_payment_sessions").delete().eq("order_id", orderId);
    await admin.from("sub_orders").delete().eq("order_id", orderId);
    await admin.from("orders").delete().eq("id", orderId);
  } else if (checkoutSessionId) {
    await admin.from("checkout_payment_sessions").delete().eq("id", checkoutSessionId);
  }

  if (userId) {
    try {
      await admin.from("carts").delete().eq("user_id", userId);
    } catch {
      // no-op
    }
    try {
      await admin.from("profiles").delete().eq("id", userId);
    } catch {
      // no-op
    }
    try {
      await admin.auth.admin.deleteUser(userId);
    } catch {
      // no-op
    }
  }
}

async function run() {
  if (!USE_EXISTING_SERVER && !fs.existsSync(path.join(process.cwd(), ".next", "BUILD_ID"))) {
    throw new Error("Build de producao ausente. Rode `npm run build` antes do smoke.");
  }

  const server = USE_EXISTING_SERVER
    ? null
    : spawn(
        process.execPath,
        [nextBin, "start", "-p", String(PORT), "-H", HOST],
        {
          cwd: process.cwd(),
          env: {
            ...process.env,
            ENABLE_SMOKE_SALE_STUB: "1",
            NEXT_PUBLIC_SITE_URL: BASE_URL,
            APP_URL: BASE_URL
          },
          stdio: ["ignore", "pipe", "pipe"]
        }
      );

  let stdoutTail = "";
  let stderrTail = "";
  let userId = null;
  let orderId = null;
  let checkoutSessionId = null;
  let paymentIntentId = null;

  if (server) {
    server.stdout.on("data", (chunk) => {
      stdoutTail = `${stdoutTail}${chunk.toString()}`.slice(-6000);
    });
    server.stderr.on("data", (chunk) => {
      stderrTail = `${stderrTail}${chunk.toString()}`.slice(-6000);
    });
  }

  const stopServer = async () => {
    if (!server) return;
    if (server.killed || server.exitCode !== null) return;
    server.kill("SIGTERM");
    await sleep(1500);
    if (server.exitCode === null) server.kill("SIGKILL");
  };

  try {
    await waitForServer();

    const tempUser = await createTempUser();
    userId = tempUser.userId;
    const session = await signInAndSyncSession(tempUser);
    const product = await pickPublishedProduct();
    const cartId = await ensureCartForUser(userId, product);

    const profileResponse = await fetchWithSession(
      "/api/v1/me/skin-profile",
      { method: "GET" },
      session.cookie
    );
    const profileJson = await ensureJson(profileResponse);
    if (!profileResponse.ok) {
      throw new Error(`Rota autenticada falhou: ${JSON.stringify(profileJson)}`);
    }

    const checkoutPayload = {
      cartId,
      address: {
        fullName: "Checkout Hardening Smoke",
        street: "Rua Teste",
        number: "100",
        city: "Araguari",
        state: "MG",
        zip: "38440000",
        complement: "Smoke"
      }
    };

    const requestHeaders = {
      "Content-Type": "application/json",
      "x-device-fingerprint": `smoke-${userId}`
    };

    const firstResponse = await fetchWithSession(
      "/api/stripe/payment-intent",
      {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify(checkoutPayload)
      },
      session.cookie
    );
    const firstJson = await ensureJson(firstResponse);
    if (!firstResponse.ok) {
      throw new Error(`Primeiro checkout falhou (${firstResponse.status}): ${JSON.stringify(firstJson)}`);
    }

    orderId = firstJson.orderId;
    checkoutSessionId = firstJson.checkoutSessionId ?? null;
    paymentIntentId = firstJson.paymentIntentId;

    const secondResponse = await fetchWithSession(
      "/api/stripe/payment-intent",
      {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify(checkoutPayload)
      },
      session.cookie
    );
    const secondJson = await ensureJson(secondResponse);
    if (!secondResponse.ok) {
      throw new Error(`Segundo checkout falhou (${secondResponse.status}): ${JSON.stringify(secondJson)}`);
    }

    if (firstJson.orderId !== secondJson.orderId) {
      throw new Error("Idempotencia falhou: orderId divergente entre requests identicos.");
    }

    if (firstJson.paymentIntentId !== secondJson.paymentIntentId) {
      throw new Error("Idempotencia falhou: paymentIntentId divergente entre requests identicos.");
    }

    const sessionQuery = await admin
      .from("checkout_payment_sessions")
      .select("id,order_id,payment_intent_id,status,risk_tier,risk_score,pricing_snapshot,shipping_snapshot,allowed_payment_methods")
      .eq("order_id", orderId)
      .maybeSingle();

    if (sessionQuery.error || !sessionQuery.data) {
      throw new Error(`Sessao de checkout nao encontrada no banco: ${sessionQuery.error?.message ?? "sem sessao"}`);
    }

    const subOrdersQuery = await admin
      .from("sub_orders")
      .select("id,shipping_total_cents,product_total_cents,platform_fee_cents,seller_net_cents,shipping_service")
      .eq("order_id", orderId);

    if (subOrdersQuery.error || !subOrdersQuery.data?.length) {
      throw new Error(`Suborders nao criadas corretamente: ${subOrdersQuery.error?.message ?? "sem suborders"}`);
    }

    if (!sessionQuery.data.pricing_snapshot || !sessionQuery.data.shipping_snapshot) {
      throw new Error("Snapshots de pricing/shipping nao foram persistidos.");
    }

    const allowed = Array.isArray(sessionQuery.data.allowed_payment_methods)
      ? sessionQuery.data.allowed_payment_methods
      : [];
    if (allowed.length === 0) {
      throw new Error("Sessao de checkout sem allowed_payment_methods.");
    }

    console.log("== Smoke checkout hardening concluido ==");
    console.log(
      JSON.stringify(
        {
          baseUrl: BASE_URL,
          authenticatedRoute: {
            ok: true,
            endpoint: "/api/v1/me/skin-profile",
            status: profileResponse.status
          },
          checkout: {
            first: {
              checkoutSessionId: firstJson.checkoutSessionId,
              orderId: firstJson.orderId,
              paymentIntentId: firstJson.paymentIntentId,
              availablePaymentMethods: firstJson.availablePaymentMethods
            },
            second: {
              checkoutSessionId: secondJson.checkoutSessionId,
              orderId: secondJson.orderId,
              paymentIntentId: secondJson.paymentIntentId,
              availablePaymentMethods: secondJson.availablePaymentMethods
            },
            idempotent: true
          },
          checkoutSession: sessionQuery.data,
          subOrders: subOrdersQuery.data
        },
        null,
        2
      )
    );

    if (!KEEP_RECORDS) {
      await cleanupArtifacts({ userId, orderId, checkoutSessionId, paymentIntentId });
      userId = null;
      orderId = null;
      checkoutSessionId = null;
      paymentIntentId = null;
      console.log("Cleanup concluido.");
    } else {
      console.log("Registros mantidos por --keep.");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[FAIL] Smoke checkout hardening:", message);
    if (stdoutTail) console.error("\n--- next stdout tail ---\n" + stdoutTail);
    if (stderrTail) console.error("\n--- next stderr tail ---\n" + stderrTail);
    process.exitCode = 1;
  } finally {
    try {
      if (!KEEP_RECORDS) {
        await cleanupArtifacts({ userId, orderId, checkoutSessionId, paymentIntentId }).catch(() => {});
      }
    } finally {
      await stopServer();
    }
  }
}

run().catch((error) => {
  console.error("[FAIL] Smoke checkout hardening:", error instanceof Error ? error.message : String(error));
  process.exit(1);
});
