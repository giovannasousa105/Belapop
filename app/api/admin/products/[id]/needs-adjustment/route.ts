import { NextRequest, NextResponse } from "next/server";

import { ensureAdminRequest } from "@/lib/admin/adminAuth";
import { performProductAction } from "@/lib/admin/productActionService";

export async function POST(
  request: NextRequest,
  paramsContext: { params: Promise<{ id: string }> }
) {
  const context = await ensureAdminRequest(request);
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const payload = await request
    .json()
    .catch(() => ({} as { notes?: string; reasons?: string[] }));

  try {
    const params = await paramsContext.params;
    const product = await performProductAction(context.supabase, params.id, {
      action: "needs_adjustment",
      notes: payload.notes,
      reasons: payload.reasons
    });
    return NextResponse.json({ product });
  } catch (error) {
    console.error("[admin/products/needs-adjustment] failed", error);
    const message = error instanceof Error ? error.message : "Não foi possível solicitar ajustes.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
