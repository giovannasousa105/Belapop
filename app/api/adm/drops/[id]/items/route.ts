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

const EDITABLE_STATUSES = ["draft", "scheduled"] as const;

// ── GET /api/adm/drops/[id]/items ────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdmAuth();
  if (!user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { id: dropId } = await params;
  const supabase = getSupabaseAdminClient();

  const { data: items, error } = await supabase
    .from("drop_items")
    .select(`
      id, drop_price_cents, max_quantity, sold_quantity,
      stripe_payment_link_url, fulfillment_eta_days, lote_id,
      products (id, name, slug, price_cents, images)
    `)
    .eq("drop_id", dropId)
    .order("id", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ items: items ?? [] });
}

const AddItemSchema = z.object({
  product_id:           z.string().uuid(),
  seller_id:            z.string().uuid(),
  drop_price_cents:     z.number().int().positive(),
  max_quantity:         z.number().int().min(1).max(10_000),
  fulfillment_eta_days: z.number().int().min(1).max(365).default(7),
});

// ── POST /api/adm/drops/[id]/items ───────────────────────────────────────────
// Cria lote + drop_item atomicamente. Máximo 1 item por drop (checkout usa maybeSingle).

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdmAuth();
  if (!user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { id: dropId } = await params;

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const parsed = AddItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Dados inválidos." }, { status: 422 });
  }

  const { product_id, seller_id, drop_price_cents, max_quantity, fulfillment_eta_days } = parsed.data;
  const supabase = getSupabaseAdminClient();

  const { data: drop } = await supabase
    .from("drops")
    .select("id, status")
    .eq("id", dropId)
    .single();

  if (!drop) return NextResponse.json({ error: "Drop não encontrado." }, { status: 404 });

  if (!EDITABLE_STATUSES.includes(drop.status as typeof EDITABLE_STATUSES[number])) {
    return NextResponse.json({ error: "Somente drops em rascunho ou agendados podem ser editados." }, { status: 409 });
  }

  const { data: existing } = await supabase
    .from("drop_items")
    .select("id")
    .eq("drop_id", dropId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Este drop já tem um produto. Remova-o antes de adicionar outro." }, { status: 409 });
  }

  // Criar lote para gerenciar estoque deste item
  const { data: lote, error: loteError } = await supabase
    .from("lotes")
    .insert({
      produto_id:        product_id,
      seller_id,
      qtd_total:         max_quantity,
      qtd_disponivel:    max_quantity,
      qtd_reservada:     0,
      limiar_alerta_pct: 20,
      status:            "ABERTO",
    })
    .select("id")
    .single();

  if (loteError || !lote) {
    return NextResponse.json({ error: "Erro ao criar lote de estoque." }, { status: 500 });
  }

  const { data: item, error: itemError } = await supabase
    .from("drop_items")
    .insert({
      drop_id:              dropId,
      product_id,
      lote_id:              lote.id,
      drop_price_cents,
      max_quantity,
      sold_quantity:        0,
      fulfillment_eta_days,
    })
    .select(`id, drop_price_cents, max_quantity, sold_quantity, fulfillment_eta_days,
             stripe_payment_link_url, products (id, name, slug)`)
    .single();

  if (itemError || !item) {
    await supabase.from("lotes").delete().eq("id", lote.id);
    return NextResponse.json({ error: "Erro ao adicionar item ao drop." }, { status: 500 });
  }

  return NextResponse.json({ item }, { status: 201 });
}

// ── DELETE /api/adm/drops/[id]/items?item_id=xxx ─────────────────────────────

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireAdmAuth();
  if (!user) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const { id: dropId } = await params;
  const itemId = new URL(req.url).searchParams.get("item_id");

  if (!itemId) {
    return NextResponse.json({ error: "item_id é obrigatório." }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();

  const { data: drop } = await supabase
    .from("drops")
    .select("status")
    .eq("id", dropId)
    .single();

  if (!drop) return NextResponse.json({ error: "Drop não encontrado." }, { status: 404 });

  if (!EDITABLE_STATUSES.includes(drop.status as typeof EDITABLE_STATUSES[number])) {
    return NextResponse.json({ error: "Não é possível remover itens de drops ao vivo ou encerrados." }, { status: 409 });
  }

  const { data: item } = await supabase
    .from("drop_items")
    .select("id, lote_id")
    .eq("id", itemId)
    .eq("drop_id", dropId)
    .single();

  if (!item) return NextResponse.json({ error: "Item não encontrado." }, { status: 404 });

  const { error: deleteError } = await supabase
    .from("drop_items")
    .delete()
    .eq("id", itemId);

  if (deleteError) return NextResponse.json({ error: "Erro ao remover item." }, { status: 500 });

  if (item.lote_id) {
    await supabase.from("lotes").update({ status: "SUSPENSO" }).eq("id", item.lote_id);
  }

  return NextResponse.json({ success: true });
}
