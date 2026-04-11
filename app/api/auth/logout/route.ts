import { NextResponse } from "next/server";

import { clearActiveSellerCookie } from "@/lib/auth/activeSeller";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store"
};

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut({ scope: "global" });

  if (error && !error.message.toLowerCase().includes("session")) {
    return NextResponse.json(
      { error: error.message },
      {
        status: 400,
        headers: NO_STORE_HEADERS
      }
    );
  }

  return clearActiveSellerCookie(
    NextResponse.json(
      { ok: true },
      {
        headers: NO_STORE_HEADERS
      }
    )
  );
}
