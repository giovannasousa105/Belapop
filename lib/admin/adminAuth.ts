import { NextRequest } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabaseServer";

type AdminContext = {
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>;
};
type AdminResult = AdminContext | { error: string; status: number };

export async function ensureAdminRequest(request: NextRequest): Promise<AdminResult> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Autenticação necessária.", status: 401 };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data || data.role !== "admin") {
    return { error: "Acesso restrito a administradores.", status: 403 };
  }

  return { supabase };
}
