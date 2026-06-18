import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAdmSessionState } from "@/lib/adm/auth/current-user";
import { hasPermission } from "@/lib/adm/auth/guards";

export const runtime = "nodejs";

async function requireAdmAuth() {
  const session = await getAdmSessionState();
  if (!session.user) return null;
  if (!hasPermission(session.user, "manage_products")) return null;
  return session.user;
}

// ── GET /api/adm/drops/[id] ───────────────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmAuth();
  if (!user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { id } = await params;
  const supabase = getSupabaseAdminClient();

  const { data: drop, error: dropError } = await supabase
    .from("drops")
    .select("*")
    .eq("id", id)
    .single();

  if (dropError || !drop) {
    return NextResponse.json({ error: "Drop não encontrado." }, { status: 404 });
  }

  const { data: items } = await supabase
    .from("drop_items")
    .select(`
      id, drop_price_cents, max_quantity, sold_quantity,
      stripe_payment_link_url, fulfillment_eta_days,
      products (id, name, slug, price_cents, images)
    `)
    .eq("drop_id", id);

  const { data: broadcasts } = await supabase
    .from("drop_broadcasts")
    .select("id, channel, sent_at, recipients_count, error_log")
    .eq("drop_id", id)
    .order("sent_at", { ascending: false });

  return NextResponse.json({ drop, items: items ?? [], broadcasts: broadcasts ?? [] });
}

// ── PATCH /api/adm/drops/[id] ─────────────────────────────────────────────────

const UpdateDropSchema = z.object({
  title:           z.string().min(3).max(120).optional(),
  subtitle:        z.string().max(200).optional(),
  description:     z.string().max(3000).optional(),
  cover_image_url: z.string().url().max(500).nullable().optional(),
  opens_at:        z.string().datetime().optional(),
  closes_at:       z.string().datetime().optional(),
  status:          z.enum(["draft", "scheduled", "live", "closed", "sold_out", "fulfilling", "delivered"]).optional(),
  notes:           z.string().max(1000).nullable().optional(),
  glass_qty:       z.number().int().min(0).optional(),
  items:       z.array(z.object({
    product_id:           z.string().uuid(),
    drop_price_cents:     z.number().int().positive(),
    max_quantity:         z.number().int().positive(),
    fulfillment_eta_days: z.number().int().positive().default(7),
  })).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmAuth();
  if (!user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { id } = await params;
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const parsed = UpdateDropSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 422 });
  }

  const { items, ...dropFields } = parsed.data;
  const supabase = getSupabaseAdminClient();

  // Verificar existência
  const { error: checkError } = await supabase.from("drops").select("id").eq("id", id).single();
  if (checkError) return NextResponse.json({ error: "Drop não encontrado." }, { status: 404 });

  // Atualizar campos do drop
  if (Object.keys(dropFields).length > 0) {
    const { error } = await supabase.from("drops").update(dropFields).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Atualizar itens: substitui tudo (upsert por product_id)
  if (items !== undefined) {
    // Remover itens que não estão mais na lista
    const productIds = items.map((i) => i.product_id);
    if (productIds.length > 0) {
      await supabase.from("drop_items").delete().eq("drop_id", id).not("product_id", "in", `(${productIds.map((p) => `'${p}'`).join(",")})`);
    } else {
      await supabase.from("drop_items").delete().eq("drop_id", id);
    }

    // Upsert dos itens
    if (items.length > 0) {
      const { error: itemsError } = await supabase.from("drop_items").upsert(
        items.map((item) => ({ drop_id: id, ...item })),
        { onConflict: "drop_id,product_id", ignoreDuplicates: false }
      );
      if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true });
}

// ── DELETE /api/adm/drops/[id] ────────────────────────────────────────────────

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdmAuth();
  if (!user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { id } = await params;
  const supabase = getSupabaseAdminClient();

  // Só permitir deletar rascunhos
  const { data: drop } = await supabase.from("drops").select("status").eq("id", id).single();
  if (!drop) return NextResponse.json({ error: "Drop não encontrado." }, { status: 404 });
  if (drop.status !== "draft") {
    return NextResponse.json({ error: "Somente rascunhos podem ser excluídos." }, { status: 409 });
  }

  const { error } = await supabase.from("drops").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
