import { NextRequest, NextResponse } from "next/server";

import { ensureAdminRequest } from "@/lib/admin/adminAuth";
import { createNotification } from "@/lib/notifications/notificationService";

export async function POST(
  request: NextRequest,
  paramsContext: { params: Promise<{ id: string }> }
) {
  const context = await ensureAdminRequest(request);
  if ("error" in context) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  try {
    const { data, error } = await context.supabase
      .from("sellers")
      .update({ status: "active" })
    .eq("id", (await paramsContext.params).id)
      .select("id,user_id")
      .maybeSingle();

    if (error || !data) {
      throw error ?? new Error("Loja não encontrada.");
    }

    if (!data.user_id) {
      throw new Error("Loja sem usuário associado.");
    }

    await createNotification({
      recipientUserId: data.user_id,
      sellerId: data.id,
      type: "seller_approved",
      title: "Sua loja foi aprovada",
      body: "Agora você pode publicar produtos e começar a vender.",
      ctaLabel: "Adicionar produto",
      ctaHref: "/seller/products/new",
      metadata: { sellerId: data.id }
    });

    return NextResponse.json({ seller: data });
  } catch (error) {
    console.error("[admin/sellers/approve] failed", error);
    const message = error instanceof Error ? error.message : "Não foi possível aprovar a loja.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
