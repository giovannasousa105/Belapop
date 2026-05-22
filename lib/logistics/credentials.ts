import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const MANDABEM_TOKEN_SETTING_KEY = "mandabem_token_encrypted";

const getEncryptionSecret = () => {
  const secret =
    process.env.MANDABEM_TOKEN_ENCRYPTION_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.INTERNAL_JOB_SECRET ||
    process.env.STRIPE_SECRET_KEY;

  if (!secret) {
    throw new Error(
      "Nenhum segredo server-side disponivel para criptografar o token do Manda Bem."
    );
  }

  return createHash("sha256").update(secret).digest();
};

export const maskSecret = (value: string | null | undefined) => {
  const normalized = String(value ?? "").trim();
  if (!normalized) return null;
  const secretPart = normalized.includes(":")
    ? normalized.split(":").slice(-1)[0]
    : normalized;
  const suffix = secretPart.slice(-4);
  return suffix ? `••••${suffix}` : "••••";
};

export const encryptLogisticsSecret = (value: string) => {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionSecret(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `v1:${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted.toString(
    "base64"
  )}`;
};

export const decryptLogisticsSecret = (payload: string) => {
  const [version, ivBase64, authTagBase64, encryptedBase64] = payload.split(":");
  if (version !== "v1" || !ivBase64 || !authTagBase64 || !encryptedBase64) {
    throw new Error("Formato de segredo criptografado invalido.");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    getEncryptionSecret(),
    Buffer.from(ivBase64, "base64")
  );
  decipher.setAuthTag(Buffer.from(authTagBase64, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedBase64, "base64")),
    decipher.final()
  ]);
  return decrypted.toString("utf8");
};

const tableMissing = (message: string | undefined) => {
  const normalized = String(message ?? "").toLowerCase();
  return (
    normalized.includes("could not find the table") ||
    normalized.includes("schema cache") ||
    normalized.includes("relation") ||
    normalized.includes("does not exist")
  );
};

export async function persistEncryptedMandaBemToken(token: string) {
  const admin = getSupabaseAdminClient();
  const { error } = await admin.from("admin_settings").upsert(
    {
      key: MANDABEM_TOKEN_SETTING_KEY,
      value: encryptLogisticsSecret(token)
    },
    { onConflict: "key" }
  );

  if (error) {
    return {
      ok: false as const,
      message: tableMissing(error.message)
        ? "Tabela admin_settings ausente. Execute a migration de configuracoes."
        : error.message
    };
  }

  return { ok: true as const };
}

export async function clearEncryptedMandaBemToken() {
  const admin = getSupabaseAdminClient();
  const { error } = await admin
    .from("admin_settings")
    .delete()
    .eq("key", MANDABEM_TOKEN_SETTING_KEY);

  if (error && !tableMissing(error.message)) {
    return { ok: false as const, message: error.message };
  }

  return { ok: true as const };
}

export async function resolveStoredMandaBemToken() {
  const envToken = String(process.env.MANDABEM_API_TOKEN ?? "").trim();
  if (envToken) {
    return {
      token: envToken,
      source: "env" as const,
      masked: maskSecret(envToken)
    };
  }

  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("admin_settings")
    .select("value")
    .eq("key", MANDABEM_TOKEN_SETTING_KEY)
    .maybeSingle();

  if (error || !data?.value) {
    return {
      token: null,
      source: "none" as const,
      masked: null
    };
  }

  try {
    const decrypted = decryptLogisticsSecret(data.value);
    return {
      token: decrypted,
      source: "encrypted_setting" as const,
      masked: maskSecret(decrypted)
    };
  } catch {
    return {
      token: null,
      source: "none" as const,
      masked: null
    };
  }
}
