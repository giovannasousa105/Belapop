import "server-only";

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";

import { getPublicEnvServer } from "@/lib/env.server";

type PendingCookie = {
  name: string;
  options: CookieOptions;
  value: string;
};

export function createSupabaseRouteClient(request: NextRequest) {
  const { NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_URL } = getPublicEnvServer();
  const pendingCookies: PendingCookie[] = [];

  const supabase = createServerClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: {
      flowType: "pkce"
    },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          pendingCookies.push({ name, value, options });
        });
      }
    }
  });

  const applyCookies = <T extends NextResponse>(response: T) => {
    pendingCookies.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options);
    });
    return response;
  };

  return { applyCookies, supabase };
}
