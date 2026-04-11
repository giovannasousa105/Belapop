import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const REQUIRE_PASSKEY_PARTNER_KEY = "require_passkey_partner";
const DEFAULT_REQUIRE_PASSKEY_PARTNER = true;

type FlagReadResult = {
  enabled: boolean;
  available: boolean;
  source: "db" | "fallback";
  errorMessage?: string;
};

const parseBoolean = (value: string | null | undefined, fallback: boolean) => {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "on", "yes", "sim"].includes(normalized)) return true;
  if (["0", "false", "off", "no", "nao"].includes(normalized)) return false;
  return fallback;
};

const tableMissing = (message: string | undefined) =>
  (message ?? "").toLowerCase().includes("could not find the table") ||
  (message ?? "").toLowerCase().includes("schema cache") ||
  (message ?? "").toLowerCase().includes("relation") ||
  (message ?? "").toLowerCase().includes("does not exist");

export async function readRequirePasskeyPartnerFlag(): Promise<FlagReadResult> {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("admin_settings")
    .select("value")
    .eq("key", REQUIRE_PASSKEY_PARTNER_KEY)
    .maybeSingle();

  if (error) {
    return {
      enabled: DEFAULT_REQUIRE_PASSKEY_PARTNER,
      available: !tableMissing(error.message),
      source: "fallback",
      errorMessage: error.message
    };
  }

  return {
    enabled: parseBoolean(data?.value, DEFAULT_REQUIRE_PASSKEY_PARTNER),
    available: true,
    source: "db"
  };
}

export async function isRequirePasskeyPartnerEnabled() {
  const result = await readRequirePasskeyPartnerFlag();
  return result.enabled;
}

export async function setRequirePasskeyPartnerFlag(enabled: boolean) {
  const admin = getSupabaseAdminClient();
  const { error } = await admin.from("admin_settings").upsert(
    {
      key: REQUIRE_PASSKEY_PARTNER_KEY,
      value: enabled ? "true" : "false"
    },
    { onConflict: "key" }
  );

  if (error) {
    if (tableMissing(error.message)) {
      return {
        ok: false as const,
        message:
          "Tabela admin_settings ausente. Execute a migration de configuracoes para habilitar feature flags."
      };
    }

    return {
      ok: false as const,
      message: error.message
    };
  }

  return { ok: true as const };
}
