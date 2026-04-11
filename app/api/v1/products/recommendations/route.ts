import { NextRequest, NextResponse } from "next/server";

import { requireCustomerApiContext } from "@/lib/api/v1/customer-auth";
import { getPersonalizedRecommendations } from "@/lib/product/recommendations";

export async function GET(request: NextRequest) {
  const auth = await requireCustomerApiContext();
  if (!auth.ok) return auth.response;

  const { admin } = auth.ctx;
  const limit = Math.min(20, Math.max(1, Number(request.nextUrl.searchParams.get("limit") ?? "4")));
  try {
    const items = await getPersonalizedRecommendations(admin, auth.ctx.userId, limit);

    return NextResponse.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao gerar recomendacoes.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
