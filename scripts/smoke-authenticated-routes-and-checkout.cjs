#!/usr/bin/env node
const { randomUUID } = require("node:crypto");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const dotenv = require("dotenv");
const { createClient } = require("@supabase/supabase-js");

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const PORT = Number(process.env.SMOKE_AUTH_ROUTES_PORT || 3024);
const HOST = "127.0.0.1";
const BASE_URL = process.env.SMOKE_BASE_URL || `http://${HOST}:${PORT}`;
const READY_TIMEOUT_MS = 120_000;
const KEEP_RECORDS = process.argv.includes("--keep");
const USE_EXISTING_SERVER = process.env.SMOKE_USE_EXISTING_SERVER === "1";
const nextBin = require.resolve("next/dist/bin/next");

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

const browser = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function ensureJson(response) {
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

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

async function createTempUser(label) {
  const email = `${label}-${Date.now()}@belapop-smoke.local`;
  const password = `Bp!${randomUUID()}Aa1`;

  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: `Smoke ${label}` }
  });

  if (created.error || !created.data.user) {
    throw new Error(`Falha ao criar usuario temporario (${label}): ${created.error?.message ?? "desconhecido"}`);
  }

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
    throw new Error(`Falha ao criar profile ${role}: ${result.error.message}`);
  }
}

async function grantRoles(userId, roles, activeRole) {
  const memberships = roles.map((role) => ({
    user_id: userId,
    role,
    source: "smoke-authenticated-routes"
  }));

  const membershipUpsert = await admin
    .from("user_role_memberships")
    .upsert(memberships, { onConflict: "user_id,role" });
  if (membershipUpsert.error && membershipUpsert.error.code !== "42P01") {
    throw new Error(`Falha ao gravar memberships: ${membershipUpsert.error.message}`);
  }

  const activeUpsert = await admin
    .from("user_roles")
    .upsert({ user_id: userId, role: activeRole }, { onConflict: "user_id" });
  if (activeUpsert.error) {
    throw new Error(`Falha ao gravar active role: ${activeUpsert.error.message}`);
  }

  const userLookup = await admin.auth.admin.getUserById(userId);
  if (userLookup.error || !userLookup.data.user) {
    throw new Error(`Falha ao reler usuario ${userId} para app_metadata.`);
  }

  const metadataUpdate = await admin.auth.admin.updateUserById(userId, {
    app_metadata: {
      ...(userLookup.data.user.app_metadata || {}),
      role: activeRole
    }
  });

  if (metadataUpdate.error) {
    throw new Error(`Falha ao atualizar app_metadata: ${metadataUpdate.error.message}`);
  }
}

async function createPartnerSeller(userId) {
  const sellerId = randomUUID();
  const inserted = await admin.from("sellers").insert({
    id: sellerId,
    user_id: userId,
    store_name: "Smoke Seller",
    postal_code: "30140071",
    status: "active",
    commission_rate: 10
  });

  if (inserted.error) {
    throw new Error(`Falha ao criar seller de smoke: ${inserted.error.message}`);
  }

  return sellerId;
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

async function fetchWithSession(pathname, options, cookie) {
  return fetch(`${BASE_URL}${pathname}`, {
    ...options,
    headers: {
      ...(options?.headers || {}),
      Cookie: cookie
    }
  });
}

async function pickPublishedProduct() {
  const query = await admin
    .from("products")
    .select("id,name,status,stock_quantity,seller_id")
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
async function cleanupArtifacts(state) {
  if (!KEEP_RECORDS && state.paymentIntentId && String(process.env.STRIPE_SECRET_KEY || "").trim()) {
    try {
      const stripe = require("stripe")(String(process.env.STRIPE_SECRET_KEY).trim());
      await stripe.paymentIntents.cancel(state.paymentIntentId).catch(() => {});
    } catch {
      // no-op
    }
  }

  if (state.orderId) {
    try {
      await admin.from("payment_states").delete().eq("order_id", state.orderId);
    } catch {}
    try {
      await admin.from("payments").delete().eq("order_id", state.orderId);
    } catch {}
    try {
      await admin.from("checkout_payment_sessions").delete().eq("order_id", state.orderId);
    } catch {}
    try {
      await admin.from("sub_orders").delete().eq("order_id", state.orderId);
    } catch {}
    try {
      await admin.from("orders").delete().eq("id", state.orderId);
    } catch {}
  }

  if (state.partnerSellerId) {
    try {
      await admin.from("sellers").delete().eq("id", state.partnerSellerId);
    } catch {}
  }

  for (const userId of state.userIds) {
    try {
      await admin.from("carts").delete().eq("user_id", userId);
    } catch {}
    try {
      await admin.from("user_roles").delete().eq("user_id", userId);
    } catch {}
    try {
      await admin.from("user_role_memberships").delete().eq("user_id", userId);
    } catch {}
    try {
      await admin.from("seller_user_roles").delete().eq("user_id", userId);
    } catch {}
    try {
      await admin.from("profiles").delete().eq("id", userId);
    } catch {}
    try {
      await admin.auth.admin.deleteUser(userId);
    } catch {}
  }
}

async function assertJsonOk(pathname, cookie) {
  const response = await fetchWithSession(pathname, { method: "GET" }, cookie);
  const json = await ensureJson(response);
  if (!response.ok) {
    throw new Error(`Falha em ${pathname}: ${response.status} ${JSON.stringify(json)}`);
  }
  return json;
}

async function assertPageOk(pathname, cookie) {
  const response = await fetchWithSession(pathname, { method: "GET", redirect: "manual" }, cookie);
  const html = await response.text();
  if (response.status !== 200) {
    throw new Error(`Pagina ${pathname} respondeu ${response.status}`);
  }
  if (!html.includes("<html")) {
    throw new Error(`Pagina ${pathname} nao retornou HTML valido.`);
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
  const state = {
    userIds: [],
    partnerSellerId: null,
    orderId: null,
    paymentIntentId: null
  };

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

    const customer = await createTempUser("customer-route-smoke");
    state.userIds.push(customer.userId);
    await upsertProfile(customer.userId, customer.email, "customer", "Smoke Customer");
    await grantRoles(customer.userId, ["customer"], "customer");
    const customerSession = await signInAndSyncSession(customer);

    const adminUser = await createTempUser("admin-route-smoke");
    state.userIds.push(adminUser.userId);
    await upsertProfile(adminUser.userId, adminUser.email, "admin", "Smoke Admin");
    await grantRoles(adminUser.userId, ["customer", "admin"], "admin");
    const adminSession = await signInAndSyncSession(adminUser);

    const partnerUser = await createTempUser("partner-route-smoke");
    state.userIds.push(partnerUser.userId);
    await upsertProfile(partnerUser.userId, partnerUser.email, "seller", "Smoke Partner");
    await grantRoles(partnerUser.userId, ["customer", "seller"], "seller");
    state.partnerSellerId = await createPartnerSeller(partnerUser.userId);
    const partnerSession = await signInAndSyncSession(partnerUser);

    const customerMe = await assertJsonOk("/api/v1/me", customerSession.cookie);
    const customerSkin = await assertJsonOk("/api/v1/me/skin-profile", customerSession.cookie);
    const customerOrders = await assertJsonOk("/api/v1/orders", customerSession.cookie);
    const customerRecommendations = await assertJsonOk("/api/v1/products/recommendations", customerSession.cookie);
    const skinGptResponse = await fetchWithSession(
      "/api/v1/skingpt/ask",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: "Minha pele esta sensivel e reativa. O que devo priorizar agora?"
        })
      },
      customerSession.cookie
    );
    const skinGptJson = await ensureJson(skinGptResponse);
    if (!skinGptResponse.ok) {
      throw new Error(`Falha em /api/v1/skingpt/ask: ${skinGptResponse.status} ${JSON.stringify(skinGptJson)}`);
    }

    const customerSkinTypesCount = Array.isArray(customerSkin?.options?.skin_types)
      ? customerSkin.options.skin_types.length
      : 0;
    const customerConcernsCount = Array.isArray(customerSkin?.options?.skin_concerns)
      ? customerSkin.options.skin_concerns.length
      : 0;
    const customerRoutineStepsCount = Array.isArray(customerSkin?.options?.routine_steps)
      ? customerSkin.options.routine_steps.length
      : 0;

    if (customerSkinTypesCount === 0 || customerConcernsCount === 0) {
      throw new Error(
        `Skin profile sem opcoes suficientes: skin_types=${customerSkinTypesCount}, skin_concerns=${customerConcernsCount}.`
      );
    }

    if (!customerSkin?.profile) {
      const patchSkinResponse = await fetchWithSession(
        "/api/v1/me/skin-profile",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            skin_type_id: customerSkin.options.skin_types[0]?.id ?? null,
            main_concern_id: customerSkin.options.skin_concerns[0]?.id ?? null,
            sensitivity_level: 3,
            price_affinity_cents: 35000
          })
        },
        customerSession.cookie
      );
      const patchSkinJson = await ensureJson(patchSkinResponse);
      if (!patchSkinResponse.ok) {
        throw new Error(`Falha ao inicializar skin profile: ${patchSkinResponse.status} ${JSON.stringify(patchSkinJson)}`);
      }
    }

    const customerRoutine = await assertJsonOk("/api/v1/skincare/routine?limit=1", customerSession.cookie);
    const customerRoutineCart = await fetchWithSession(
      "/api/v1/skincare/routine",
      { method: "POST", headers: { "Content-Type": "application/json" } },
      customerSession.cookie
    );
    const customerRoutineCartJson = await ensureJson(customerRoutineCart);
    if (!customerRoutineCart.ok) {
      throw new Error(`Falha em /api/v1/skincare/routine POST: ${customerRoutineCart.status} ${JSON.stringify(customerRoutineCartJson)}`);
    }

    await assertPageOk("/conta", customerSession.cookie);
    await assertPageOk("/conta/pagamentos", customerSession.cookie);
    await assertPageOk("/conta/skincare", customerSession.cookie);

    const partnerOrders = await assertJsonOk("/api/partner/orders?page=1&page_size=5", partnerSession.cookie);
    const partnerProducts = await assertJsonOk("/api/partner/products", partnerSession.cookie);
    const partnerPayouts = await assertJsonOk("/api/partner/payouts", partnerSession.cookie);
    await assertPageOk("/parceiro", partnerSession.cookie);
    await assertPageOk("/parceiro/produtos", partnerSession.cookie);
    await assertPageOk("/parceiro/repasse", partnerSession.cookie);

    const adminFinance = await assertJsonOk("/api/admin/finance", adminSession.cookie);
    const adminCuration = await assertJsonOk("/api/admin/curadoria", adminSession.cookie);
    await assertPageOk("/admin/dashboard", adminSession.cookie);
    await assertPageOk("/admin/curadoria", adminSession.cookie);
    await assertPageOk("/admin/finance", adminSession.cookie);

    const product = await pickPublishedProduct();
    const cartId = await ensureCartForUser(customer.userId, product);
    const checkoutPayload = {
      cartId,
      address: {
        fullName: "Smoke Customer",
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
      "x-device-fingerprint": `smoke-${customer.userId}`
    };

    const checkoutFirst = await fetchWithSession(
      "/api/stripe/payment-intent",
      {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify(checkoutPayload)
      },
      customerSession.cookie
    );
    const checkoutFirstJson = await ensureJson(checkoutFirst);
    if (!checkoutFirst.ok) {
      throw new Error(`Checkout sintetico falhou (${checkoutFirst.status}): ${JSON.stringify(checkoutFirstJson)}`);
    }

    state.orderId = checkoutFirstJson.orderId;
    state.paymentIntentId = checkoutFirstJson.paymentIntentId;

    const checkoutSecond = await fetchWithSession(
      "/api/stripe/payment-intent",
      {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify(checkoutPayload)
      },
      customerSession.cookie
    );
    const checkoutSecondJson = await ensureJson(checkoutSecond);
    if (!checkoutSecond.ok) {
      throw new Error(`Checkout sintetico repetido falhou (${checkoutSecond.status}): ${JSON.stringify(checkoutSecondJson)}`);
    }

    if (checkoutFirstJson.orderId !== checkoutSecondJson.orderId) {
      throw new Error("Checkout sintetico sem idempotencia de orderId.");
    }

    if (checkoutFirstJson.paymentIntentId !== checkoutSecondJson.paymentIntentId) {
      throw new Error("Checkout sintetico sem idempotencia de paymentIntentId.");
    }

    console.log("== Smoke authenticated routes + checkout concluido ==");
    console.log(JSON.stringify({
      baseUrl: BASE_URL,
      customer: {
        userId: customer.userId,
        page: "/conta",
        meId: customerMe.id,
        cpfRequired: customerMe.cpf_required,
        ordersTotal: customerOrders.pagination?.total ?? customerOrders.total ?? 0,
        recommendationsCount: Array.isArray(customerRecommendations.items)
          ? customerRecommendations.items.length
          : Array.isArray(customerRecommendations)
            ? customerRecommendations.length
            : 0,
        routineCount: Array.isArray(customerRoutine.steps) ? customerRoutine.steps.length : 0,
        routineCartItems: Array.isArray(customerRoutineCartJson?.cart?.items) ? customerRoutineCartJson.cart.items.length : 0,
        skinGptSourceMode: skinGptJson?.answer?.source_mode ?? null,
        skinProfileOptions: {
          skinTypes: customerSkinTypesCount,
          concerns: customerConcernsCount,
          routineSteps: customerRoutineStepsCount
        }
      },
      partner: {
        userId: partnerUser.userId,
        sellerId: state.partnerSellerId,
        page: "/parceiro",
        ordersTotal: partnerOrders.total ?? 0,
        productsCount: Array.isArray(partnerProducts.items) ? partnerProducts.items.length : 0,
        payoutsCount: Array.isArray(partnerPayouts.items) ? partnerPayouts.items.length : 0
      },
      admin: {
        userId: adminUser.userId,
        page: "/admin/dashboard",
        financeSummaryKeys: adminFinance.summary ? Object.keys(adminFinance.summary) : [],
        collectionsCount: Array.isArray(adminCuration.collections) ? adminCuration.collections.length : 0
      },
      checkout: {
        orderId: checkoutFirstJson.orderId,
        paymentIntentId: checkoutFirstJson.paymentIntentId,
        availablePaymentMethods: checkoutFirstJson.availablePaymentMethods,
        idempotent: true
      }
    }, null, 2));

    if (!KEEP_RECORDS) {
      await cleanupArtifacts(state);
      state.userIds = [];
      state.partnerSellerId = null;
      state.orderId = null;
      state.paymentIntentId = null;
      console.log("Cleanup concluido.");
    } else {
      console.log("Registros mantidos por --keep.");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[FAIL] Smoke authenticated routes + checkout:", message);
    if (stdoutTail) console.error("\n--- next stdout tail ---\n" + stdoutTail);
    if (stderrTail) console.error("\n--- next stderr tail ---\n" + stderrTail);
    process.exitCode = 1;
  } finally {
    try {
      if (!KEEP_RECORDS) {
        await cleanupArtifacts(state).catch(() => {});
      }
    } finally {
      await stopServer();
    }
  }
}

run().catch((error) => {
  console.error("[FAIL] Smoke authenticated routes + checkout:", error instanceof Error ? error.message : String(error));
  process.exit(1);
});
