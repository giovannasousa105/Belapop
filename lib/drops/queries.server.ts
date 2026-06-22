import "server-only";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { DropPublic } from "@/types/drops";

export async function getDropBySlug(slug: string): Promise<DropPublic | null> {
  const supabase = getSupabaseAdminClient();

  const { data: drop, error } = await supabase
    .from("drops")
    .select("id, slug, title, subtitle, description, cover_image_url, opens_at, closes_at, status, sem_reposicao")
    .eq("slug", slug)
    .not("status", "in", "(draft)")
    .maybeSingle();

  if (error || !drop) return null;

  const { data: items } = await supabase
    .from("drop_items")
    .select(`
      id, drop_price_cents, max_quantity, sold_quantity, lote_id, fulfillment_eta_days,
      products (name, images)
    `)
    .eq("drop_id", drop.id);

  return {
    ...drop,
    items: (items ?? []).map((item) => ({
      id: item.id,
      drop_price_cents: item.drop_price_cents,
      max_quantity: item.max_quantity,
      sold_quantity: item.sold_quantity,
      lote_id: item.lote_id,
      fulfillment_eta_days: item.fulfillment_eta_days,
      product: Array.isArray(item.products)
        ? item.products[0] ?? null
        : (item.products as { name: string; images: string[] | null } | null),
    })),
  } as DropPublic;
}

export async function getDropStats(dropId: string) {
  const supabase = getSupabaseAdminClient();

  const { data } = await supabase
    .from("drops")
    .select("total_orders, gmv_cents, status")
    .eq("id", dropId)
    .single();

  const { data: items } = await supabase
    .from("drop_items")
    .select("id, max_quantity, sold_quantity")
    .eq("drop_id", dropId);

  return {
    total_orders: data?.total_orders ?? 0,
    gmv_cents: data?.gmv_cents ?? 0,
    status: data?.status ?? "draft",
    items: items ?? [],
  };
}

export async function confirmarDropVenda(args: {
  dropId: string;
  dropItemId: string;
  priceCents: number;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase.rpc("fn_confirmar_drop_venda", {
    p_drop_id: args.dropId,
    p_drop_item_id: args.dropItemId,
    p_price_cents: args.priceCents,
  });

  if (error) {
    throw new Error(`fn_confirmar_drop_venda failed: ${error.message}`);
  }

  const result = data as { ok: boolean; error?: string };
  return result;
}

export async function sincronizarStatusDrops(): Promise<{
  ok: boolean;
  abertos: number;
  fechados: number;
}> {
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase.rpc("fn_sincronizar_status_drops");

  if (error) {
    throw new Error(`fn_sincronizar_status_drops failed: ${error.message}`);
  }

  return data as { ok: boolean; abertos: number; fechados: number };
}
