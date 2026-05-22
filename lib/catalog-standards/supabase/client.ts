import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const sanitizeEnvValue = (value: string | undefined) => {
  if (!value) return null;
  let sanitized = value.trim();
  if (sanitized.startsWith("\"") && sanitized.endsWith("\"") && sanitized.length >= 2) {
    sanitized = sanitized.slice(1, -1).trim();
  }
  sanitized = sanitized.replace(/\\r\\n|\\n|\\r/g, "").trim();
  return sanitized.length > 0 ? sanitized : null;
};

let readClient: SupabaseClient | null = null;

export function getCatalogStandardsSupabaseReadClient() {
  const url = sanitizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = sanitizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!url || !anonKey) return null;

  if (!readClient) {
    readClient = createClient(url, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  return readClient;
}
