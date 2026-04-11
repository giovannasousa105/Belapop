import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

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

export async function createSupabaseServer() {
  const cookieStore = await cookies();

  const url = sanitizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = sanitizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!url || !anonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // render context read-only
        }
      }
    }
  });
}

export const createSupabaseServerClient = createSupabaseServer;
