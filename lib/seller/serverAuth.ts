import { NextRequest } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabaseServer";

type SellerAuthContext = {
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>;
  userId: string;
};

type SellerAuthResult = SellerAuthContext | { error: string; status: number };

export async function ensureSellerAuthenticated(
  request: NextRequest
): Promise<SellerAuthResult> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Autenticação necessária.", status: 401 };
  }

  return { supabase, userId: user.id };
}
