import "server-only";

import type { NextRequest } from "next/server";

import { resolveSellerScopeContext, type SellerScopeContext } from "@/lib/rbac/sellerAccessScope";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export type PartnerApiContext = {
  userId: string;
  scope: SellerScopeContext;
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>>;
  admin: ReturnType<typeof getSupabaseAdminClient>;
};

export type PartnerApiAuthResult =
  | { ok: true; ctx: PartnerApiContext }
  | { ok: false; status: number; error: string };

export const ensurePartnerApiContext = async (
  _request?: NextRequest
): Promise<PartnerApiAuthResult> => {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, status: 401, error: "Autenticacao necessaria." };
  }

  const scope = await resolveSellerScopeContext(user.id);
  if (!scope) {
    return { ok: false, status: 403, error: "Acesso de parceiro nao autorizado." };
  }

  return {
    ok: true,
    ctx: {
      userId: user.id,
      scope,
      supabase,
      admin: getSupabaseAdminClient()
    }
  };
};
