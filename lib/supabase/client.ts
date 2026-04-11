"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

const sanitizeEnvValue = (value: string | undefined) => {
  if (!value) return value;
  let sanitized = value.trim();
  if (sanitized.startsWith('"') && sanitized.endsWith('"') && sanitized.length >= 2) {
    sanitized = sanitized.slice(1, -1).trim();
  }
  // Handle badly formatted env values copied with escaped newlines.
  sanitized = sanitized.replace(/\\r\\n|\\n|\\r/g, "").trim();
  return sanitized;
};

export function getSupabaseClient(): SupabaseClient {
  if (client) return client;

  const url = sanitizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = sanitizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!url || !anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  client = createBrowserClient(url, anonKey, {
    auth: {
      flowType: "pkce"
    }
  });
  return client;
}
