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
  sellerIds: []
};

function browserClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

async function createTempUser(label) {
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const email = `${label}-${suffix}@belapop-rbac.local`;
  const password = `Bp!${randomUUID()}Aa1`;

  const created = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: `RBAC ${label}` }
  });

  if (created.error || !created.data.user) {
    throw new Error(
      `Falha ao criar usuario temporario (${label}): ${created.error?.message ?? "desconhecido"}`
    );
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

async function insertOne(table, payload) {
  const result = await admin.from(table).insert(payload).select().single();
  if (result.error || !result.data) {
    throw new Error(`Falha ao inserir em ${table}: ${result.error?.message ?? "sem retorno"}`);
  }
  return result.data;
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

async function countVisible(client, table, filters) {
  let query = client.from(table).select("*", { count: "exact", head: true });

  for (const filter of filters) {
    query = query.eq(filter.column, filter.value);
  }

  const result = await query;
  if (result.error) {
    throw new Error(`Falha ao consultar ${table}: ${result.error.message}`);
  }

  return Number(result.count || 0);
}

async function assertCount(client, actor, table, filters, expected, label) {
  const actual = await countVisible(client, table, filters);
  if (actual !== expected) {
    throw new Error(`${label}: ${actor} esperava ${expected} em ${table}, recebeu ${actual}`);
  }
}

async function assertRole(client, sellerId, userId, expectedRole, label) {
  const result = await client
    .from("seller_user_roles")
    .select("role")
    .eq("seller_id", sellerId)
    .eq("user_id", userId)
    .maybeSingle();

  if (result.error) {
    throw new Error(`${label}: falha ao ler seller_user_roles: ${result.error.message}`);
  }

  if (String(result.data?.role ?? "") !== expectedRole) {
    throw new Error(
      `${label}: role esperado ${expectedRole}, recebido ${String(result.data?.role ?? "vazio")}`
    );
  }
}

async function assertPermission(client, sellerId, userId, permissionKey, expected, label) {
  const result = await client
    .from("seller_user_permissions")
    .select("bool_value,number_value")
    .eq("seller_id", sellerId)
    .eq("user_id", userId)
    .eq("permission_key", permissionKey)
    .maybeSingle();

  if (result.error) {
    throw new Error(`${label}: falha ao ler seller_user_permissions: ${result.error.message}`);
  }

  const actual =
    result.data?.bool_value === null || result.data?.bool_value === undefined
      ? Number(result.data?.number_value)
      : Boolean(result.data?.bool_value);

  if (actual !== expected) {
    throw new Error(`${label}: valor esperado ${expected}, recebido ${String(actual)}`);
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

  await safeDelete("seller_team_members", (query) => query.in("seller_id", state.sellerIds));
  await safeDelete("sellers", (query) => query.in("id", state.sellerIds));
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
  const ownerB = await createTempUser("owner-b");
  const sharedMember = await createTempUser("shared-member");
  const adminUser = await createTempUser("admin");

  await upsertProfile(ownerA.userId, ownerA.email, "seller", "Owner A");
  await upsertProfile(ownerB.userId, ownerB.email, "seller", "Owner B");
  await upsertProfile(sharedMember.userId, sharedMember.email, "seller", "Shared Member");
  await upsertProfile(adminUser.userId, adminUser.email, "admin", "Admin");
  await grantAdmin(adminUser.userId);

  const sellerA = await insertOne("sellers", {
    id: randomUUID(),
    user_id: ownerA.userId,
    store_name: `Scoped RBAC A ${Date.now()}`,
    postal_code: "30140071",
    status: "active",
    commission_rate: 10
  });
  const sellerB = await insertOne("sellers", {
    id: randomUUID(),
    user_id: ownerB.userId,
    store_name: `Scoped RBAC B ${Date.now()}`,
    postal_code: "30140071",
    status: "active",
    commission_rate: 12
  });
  state.sellerIds.push(sellerA.id, sellerB.id);

  const teamMembersResult = await admin.from("seller_team_members").upsert(
    [
      {
        seller_id: sellerA.id,
        user_id: ownerA.userId,
        status: "active",
        invited_at: new Date().toISOString(),
        accepted_at: new Date().toISOString()
      },
      {
        seller_id: sellerB.id,
        user_id: ownerB.userId,
        status: "active",
        invited_at: new Date().toISOString(),
        accepted_at: new Date().toISOString()
      },
      {
        seller_id: sellerA.id,
        user_id: sharedMember.userId,
        status: "active",
        invited_by: ownerA.userId,
        invited_at: new Date().toISOString(),
        accepted_at: new Date().toISOString()
      },
      {
        seller_id: sellerB.id,
        user_id: sharedMember.userId,
        status: "active",
        invited_by: ownerB.userId,
        invited_at: new Date().toISOString(),
        accepted_at: new Date().toISOString()
      }
    ],
    { onConflict: "seller_id,user_id" }
  );
  if (teamMembersResult.error) {
    throw new Error(`Falha ao gravar seller_team_members: ${teamMembersResult.error.message}`);
  }

  const rolesResult = await admin.from("seller_user_roles").upsert(
    [
      { seller_id: sellerA.id, user_id: ownerA.userId, role: "ADMIN" },
      { seller_id: sellerB.id, user_id: ownerB.userId, role: "ADMIN" },
      { seller_id: sellerA.id, user_id: sharedMember.userId, role: "OPERACAO" },
      { seller_id: sellerB.id, user_id: sharedMember.userId, role: "FINANCEIRO" }
    ],
    { onConflict: "seller_id,user_id" }
  );
  if (rolesResult.error) {
    throw new Error(`Falha ao gravar seller_user_roles: ${rolesResult.error.message}`);
  }

  const permissionsResult = await admin.from("seller_user_permissions").upsert(
    [
      {
        seller_id: sellerA.id,
        user_id: sharedMember.userId,
        permission_key: "promo.max_discount_percent",
        bool_value: null,
        number_value: 10
      },
      {
        seller_id: sellerB.id,
        user_id: sharedMember.userId,
        permission_key: "finance.export",
        bool_value: true,
        number_value: null
      }
    ],
    { onConflict: "seller_id,user_id,permission_key" }
  );
  if (permissionsResult.error) {
    throw new Error(`Falha ao gravar seller_user_permissions: ${permissionsResult.error.message}`);
  }

  const clients = {
    ownerA: await signIn(ownerA),
    ownerB: await signIn(ownerB),
    sharedMember: await signIn(sharedMember),
    admin: await signIn(adminUser)
  };

  await assertCount(
    clients.ownerA,
    "ownerA",
    "seller_user_roles",
    [{ column: "seller_id", value: sellerA.id }],
    2,
    "roles seller A"
  );
  await assertCount(
    clients.ownerA,
    "ownerA",
    "seller_user_roles",
    [{ column: "seller_id", value: sellerB.id }],
    0,
    "roles seller B invisiveis para ownerA"
  );
  await assertCount(
    clients.ownerB,
    "ownerB",
    "seller_user_roles",
    [{ column: "seller_id", value: sellerB.id }],
    2,
    "roles seller B"
  );
  await assertCount(
    clients.sharedMember,
    "sharedMember",
    "seller_user_roles",
    [{ column: "seller_id", value: sellerA.id }],
    2,
    "shared member ve roles seller A"
  );
  await assertCount(
    clients.sharedMember,
    "sharedMember",
    "seller_user_roles",
    [{ column: "seller_id", value: sellerB.id }],
    2,
    "shared member ve roles seller B"
  );
  await assertCount(
    clients.admin,
    "admin",
    "seller_user_roles",
    [{ column: "seller_id", value: sellerA.id }],
    2,
    "admin ve roles seller A"
  );
  await assertCount(
    clients.admin,
    "admin",
    "seller_user_roles",
    [{ column: "seller_id", value: sellerB.id }],
    2,
    "admin ve roles seller B"
  );

  await assertCount(
    clients.ownerA,
    "ownerA",
    "seller_user_permissions",
    [{ column: "seller_id", value: sellerA.id }],
    1,
    "ownerA ve permissions seller A"
  );
  await assertCount(
    clients.ownerA,
    "ownerA",
    "seller_user_permissions",
    [{ column: "seller_id", value: sellerB.id }],
    0,
    "ownerA nao ve permissions seller B"
  );
  await assertCount(
    clients.sharedMember,
    "sharedMember",
    "seller_user_permissions",
    [{ column: "seller_id", value: sellerA.id }],
    1,
    "shared member ve permissions seller A"
  );
  await assertCount(
    clients.sharedMember,
    "sharedMember",
    "seller_user_permissions",
    [{ column: "seller_id", value: sellerB.id }],
    1,
    "shared member ve permissions seller B"
  );

  await assertRole(
    clients.sharedMember,
    sellerA.id,
    sharedMember.userId,
    "OPERACAO",
    "role scoped seller A"
  );
  await assertRole(
    clients.sharedMember,
    sellerB.id,
    sharedMember.userId,
    "FINANCEIRO",
    "role scoped seller B"
  );
  await assertPermission(
    clients.sharedMember,
    sellerA.id,
    sharedMember.userId,
    "promo.max_discount_percent",
    10,
    "permission scoped seller A"
  );
  await assertPermission(
    clients.sharedMember,
    sellerB.id,
    sharedMember.userId,
    "finance.export",
    true,
    "permission scoped seller B"
  );

  console.log("== Seller RBAC scoped by seller_id OK ==");
  console.log(
    JSON.stringify(
      {
        sellers: { sellerA: sellerA.id, sellerB: sellerB.id },
        users: {
          ownerA: ownerA.userId,
          ownerB: ownerB.userId,
          sharedMember: sharedMember.userId,
          admin: adminUser.userId
        },
        keepRecords: KEEP_RECORDS
      },
      null,
      2
    )
  );
}

run()
  .catch((error) => {
    console.error("[FAIL] Seller RBAC scope:", error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    await cleanup();
  });
