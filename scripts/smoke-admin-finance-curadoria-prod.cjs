#!/usr/bin/env node
const { randomUUID } = require("node:crypto");
const path = require("node:path");

const dotenv = require("dotenv");
const { createClient } = require("@supabase/supabase-js");

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const BASE_URL = String(process.env.SMOKE_ADMIN_BASE_URL || "https://belapopoficial.com.br").trim();
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

const browser = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

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
    source: "smoke-admin-finance-curadoria-prod"
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

  return { cookie };
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

async function cleanup(userId) {
  try {
    await admin.from("user_roles").delete().eq("user_id", userId);
  } catch {}
  try {
    await admin.from("user_role_memberships").delete().eq("user_id", userId);
  } catch {}
  try {
    await admin.from("profiles").delete().eq("id", userId);
  } catch {}
  try {
    await admin.auth.admin.deleteUser(userId);
  } catch {}
}

async function run() {
  let tempUserId = null;

  try {
    const adminUser = await createTempUser("admin-finance-curadoria-prod");
    tempUserId = adminUser.userId;

    await upsertProfile(adminUser.userId, adminUser.email, "admin", "Smoke Admin Finance Curadoria");
    await grantRoles(adminUser.userId, ["customer", "admin"], "admin");
    const adminSession = await signInAndSyncSession(adminUser);

    await assertPageOk("/admin/dashboard", adminSession.cookie);
    await assertPageOk("/admin/finance", adminSession.cookie);
    await assertPageOk("/admin/curadoria", adminSession.cookie);

    const finance = await assertJsonOk("/api/admin/finance", adminSession.cookie);
    const financeCommission = await assertJsonOk(
      "/api/admin/finance?entryType=commission_reversal",
      adminSession.cookie
    );
    const financeChargebackFee = await assertJsonOk(
      "/api/admin/finance?entryType=chargeback_fee",
      adminSession.cookie
    );
    const curation = await assertJsonOk("/api/admin/curadoria", adminSession.cookie);

    const summaryKeys = finance.summary ? Object.keys(finance.summary) : [];
    const dedicatedFilters = Array.isArray(finance?.summary?.ledger?.dedicated_filters)
      ? finance.summary.ledger.dedicated_filters
      : [];

    console.log("== Smoke admin finance + curadoria em producao concluido ==");
    console.log(
      JSON.stringify(
        {
          baseUrl: BASE_URL,
          admin: {
            userId: adminUser.userId,
            dashboardOk: true,
            financePageOk: true,
            curationPageOk: true
          },
          finance: {
            summaryKeys,
            activeEntryTypeFilter: finance?.summary?.ledger?.active_entry_type_filter ?? null,
            dedicatedFilters,
            recentLedgerEntries: Array.isArray(finance?.summary?.drilldown?.ledger?.recent_entries)
              ? finance.summary.drilldown.ledger.recent_entries.length
              : 0,
            recentTransactions: Array.isArray(finance?.summary?.drilldown?.ledger?.recent_transactions)
              ? finance.summary.drilldown.ledger.recent_transactions.length
              : 0,
            reconciliationReports: Array.isArray(finance?.summary?.drilldown?.reconciliation?.reports)
              ? finance.summary.drilldown.reconciliation.reports.length
              : 0,
            reconciliationIssues: Array.isArray(finance?.summary?.drilldown?.reconciliation?.issues)
              ? finance.summary.drilldown.reconciliation.issues.length
              : 0
          },
          commissionReversalFilter: {
            activeEntryTypeFilter: financeCommission?.summary?.ledger?.active_entry_type_filter ?? null,
            filteredLedgerEntries: Array.isArray(financeCommission?.summary?.drilldown?.ledger?.recent_entries)
              ? financeCommission.summary.drilldown.ledger.recent_entries.length
              : 0
          },
          chargebackFeeFilter: {
            activeEntryTypeFilter: financeChargebackFee?.summary?.ledger?.active_entry_type_filter ?? null,
            filteredLedgerEntries: Array.isArray(financeChargebackFee?.summary?.drilldown?.ledger?.recent_entries)
              ? financeChargebackFee.summary.drilldown.ledger.recent_entries.length
              : 0
          },
          curation: {
            kinds: Array.isArray(curation.kinds) ? curation.kinds.length : 0,
            collections: Array.isArray(curation.collections) ? curation.collections.length : 0,
            availableProducts: Array.isArray(curation.availableProducts) ? curation.availableProducts.length : 0
          }
        },
        null,
        2
      )
    );
  } finally {
    if (!KEEP_RECORDS && tempUserId) {
      await cleanup(tempUserId);
    }
  }
}

run().catch((error) => {
  console.error("[FAIL] Smoke admin finance + curadoria em producao:", error instanceof Error ? error.message : String(error));
  process.exit(1);
});
