// Usage:
// NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... TARGET_EMAIL=... node scripts/grant-user-portal-roles.mjs
// Optional:
// TARGET_ROLES=customer,seller,admin ACTIVE_ROLE=customer
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local", override: true });

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
const SERVICE_ROLE = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
const TARGET_EMAIL = (process.env.TARGET_EMAIL ?? "").trim().toLowerCase();
const TARGET_ROLES = (process.env.TARGET_ROLES ?? "customer,seller,admin")
  .split(",")
  .map((entry) => entry.trim().toLowerCase())
  .filter(Boolean);
const ACTIVE_ROLE = (process.env.ACTIVE_ROLE ?? TARGET_ROLES[0] ?? "customer").trim().toLowerCase();

const VALID_ROLES = new Set(["customer", "seller", "admin"]);

function isMissingMembershipTable(error) {
  const code = String(error?.code ?? "");
  const message = String(error?.message ?? "").toLowerCase();
  return code === "42P01" || code === "PGRST205" || message.includes("user_role_memberships");
}

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

if (!TARGET_EMAIL) {
  console.error("Missing TARGET_EMAIL");
  process.exit(1);
}

const roles = Array.from(new Set(TARGET_ROLES.filter((role) => VALID_ROLES.has(role))));
if (!roles.length) {
  console.error("TARGET_ROLES does not contain valid roles (customer,seller,admin).");
  process.exit(1);
}

if (!VALID_ROLES.has(ACTIVE_ROLE)) {
  console.error("ACTIVE_ROLE must be one of: customer,seller,admin");
  process.exit(1);
}

if (!roles.includes(ACTIVE_ROLE)) {
  roles.push(ACTIVE_ROLE);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const PER_PAGE = 200;

async function findUserByEmail(email) {
  let page = 1;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: PER_PAGE });
    if (error) throw error;
    const users = data.users ?? [];
    const user = users.find((entry) => (entry.email ?? "").toLowerCase() === email.toLowerCase());
    if (user) return user;
    if (users.length < PER_PAGE) return null;
    page += 1;
  }
}

async function run() {
  const user = await findUserByEmail(TARGET_EMAIL);
  if (!user) {
    console.error(`User not found: ${TARGET_EMAIL}`);
    process.exit(1);
  }

  const memberships = roles.map((role) => ({
    user_id: user.id,
    role,
    source: "script-grant-user-portal-roles"
  }));

  const membershipUpsert = await supabase
    .from("user_role_memberships")
    .upsert(memberships, { onConflict: "user_id,role" });
  if (membershipUpsert.error && !isMissingMembershipTable(membershipUpsert.error)) {
    throw membershipUpsert.error;
  }

  if (roles.includes("admin")) {
    const metadataUpdate = await supabase.auth.admin.updateUserById(user.id, {
      app_metadata: {
        ...(user.app_metadata ?? {}),
        role: "admin"
      }
    });
    if (metadataUpdate.error) throw metadataUpdate.error;
  }

  const activeUpsert = await supabase
    .from("user_roles")
    .upsert({ user_id: user.id, role: ACTIVE_ROLE }, { onConflict: "user_id" });
  if (activeUpsert.error) throw activeUpsert.error;

  console.log("Roles granted successfully");
  console.log({ userId: user.id, email: TARGET_EMAIL, roles, activeRole: ACTIVE_ROLE });
}

run().catch((error) => {
  console.error("Failed:", error?.message ?? error);
  process.exit(1);
});
