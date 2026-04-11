import { NextRequest, NextResponse } from "next/server";

import {
  clearActiveSellerCookie,
  normalizeActiveSellerId,
  setActiveSellerCookie
} from "@/lib/auth/activeSeller";
import {
  listAccessibleSellerProfiles,
  selectAccessibleSellerProfile
} from "@/lib/rbac/sellerAccessScope";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

type ActiveSellerBody = {
  sellerId?: string;
};

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as ActiveSellerBody | null;
  const sellerId = normalizeActiveSellerId(body?.sellerId ?? null);
  if (!sellerId) {
    return NextResponse.json({ error: "Loja invalida." }, { status: 400 });
  }

  const accessibleSellers = await listAccessibleSellerProfiles(user.id);
  const activeSeller = selectAccessibleSellerProfile(accessibleSellers, sellerId);
  if (!activeSeller || activeSeller.id !== sellerId) {
    return NextResponse.json({ error: "Loja fora do escopo autenticado." }, { status: 403 });
  }

  const response = NextResponse.json({
    ok: true,
    seller: {
      id: activeSeller.id,
      store_name: activeSeller.store_name,
      is_owner: activeSeller.is_owner,
      member_role: activeSeller.member_role
    }
  });

  return setActiveSellerCookie(response, activeSeller.id);
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  return clearActiveSellerCookie(response);
}
