#!/usr/bin/env node
const { randomUUID } = require("node:crypto");
const path = require("node:path");

const dotenv = require("dotenv");
const { createClient } = require("@supabase/supabase-js");

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const BASE_URL = String(process.env.SMOKE_ADMIN_BASE_URL || "https://belapopoficial.com.br").trim();

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
    source: "smoke-admin-skingpt-evidence-prod"
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

async function assertJsonOk(pathname, cookie, options = { method: "GET" }) {
  const response = await fetchWithSession(pathname, options, cookie);
  const json = await ensureJson(response);
  if (!response.ok) {
    throw new Error(`Falha em ${pathname}: ${response.status} ${JSON.stringify(json)}`);
  }
  return json;
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
    const adminUser = await createTempUser("admin-skingpt-evidence-prod");
    tempUserId = adminUser.userId;

    await upsertProfile(adminUser.userId, adminUser.email, "admin", "Smoke Admin SkinGPT Evidence");
    await grantRoles(adminUser.userId, ["customer", "admin"], "admin");
    const session = await signInAndSyncSession(adminUser);

    await assertPageOk("/admin/skingpt-evidence", session.cookie);
    const evidence = await assertJsonOk("/api/admin/skingpt/evidence", session.cookie);

    const firstDocument = Array.isArray(evidence.documents) ? evidence.documents[0] : null;
    if (!firstDocument?.id) {
      throw new Error("Nenhum documento de evidencia foi retornado pela API.");
    }

    const patchPayload = {
      id: firstDocument.id,
      slug: firstDocument.slug,
      title: firstDocument.title,
      topicSlug: firstDocument.topicSlug,
      body: firstDocument.body,
      sourceLabel: firstDocument.sourceLabel,
      sourceUrl: firstDocument.sourceUrl,
      status: firstDocument.status,
      editorialBoost: firstDocument.editorialBoost,
      publishedAt: firstDocument.publishedAt,
      sourceFamily: firstDocument.sourceFamily,
      studyType: firstDocument.studyType,
      evidenceLevel: firstDocument.evidenceLevel,
      publishedYear: firstDocument.publishedYear,
      lastReviewedAt: firstDocument.lastReviewedAt,
      tags: Array.isArray(firstDocument.tags) ? firstDocument.tags.join(",") : ""
    };

    const patched = await assertJsonOk("/api/admin/skingpt/evidence", session.cookie, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patchPayload)
    });

    console.log("== Smoke admin SkinGPT Evidence em producao concluido ==");
    console.log(
      JSON.stringify(
        {
          baseUrl: BASE_URL,
          pageOk: true,
          apiOk: true,
          patchOk: patched?.ok === true,
          documentsCount: Array.isArray(evidence.documents) ? evidence.documents.length : 0,
          topicsCount: Array.isArray(evidence?.options?.topics) ? evidence.options.topics.length : 0,
          sourceFamiliesCount: Array.isArray(evidence?.options?.sourceFamilies) ? evidence.options.sourceFamilies.length : 0,
          firstDocument: firstDocument
            ? {
                slug: firstDocument.slug,
                topicSlug: firstDocument.topicSlug,
                status: firstDocument.status,
                sourceFamily: firstDocument.sourceFamily
              }
            : null
        },
        null,
        2
      )
    );
  } finally {
    if (tempUserId) {
      await cleanup(tempUserId);
    }
  }
}

run().catch((error) => {
  console.error("[FAIL] Smoke admin SkinGPT Evidence em producao:", error instanceof Error ? error.message : String(error));
  process.exit(1);
});
