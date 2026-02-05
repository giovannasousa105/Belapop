import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { assertEnv } from "@/lib/env.server";

let adminClient: SupabaseClient | null = null;

export const getSupabaseAdminClient = () => {
  const supabaseUrl = assertEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = assertEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!adminClient) {
    adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }

  return adminClient;
};
