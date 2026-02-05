import { getSupabaseServerClient } from "@/lib/supabaseServer";

export type AdminCartRow = {
  id: string;
  items: { productId: string; quantity: number }[];
  subtotal_cents: number;
  status: string;
  updated_at: string | null;
  user_email: string | null;
  anon_id: string | null;
};

export async function markAbandonedCarts() {
  const supabase = await getSupabaseServerClient();
  const threshold = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  await supabase
    .from("carts")
    .update({ status: "abandoned" })
    .eq("status", "active")
    .lt("updated_at", threshold);
}

export async function fetchAdminCarts(): Promise<AdminCartRow[]> {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("carts")
    .select("id,status,items,subtotal_cents,updated_at,anon_id,profiles(id,email)")
    .order("updated_at", { ascending: false });

  return (data ?? []).map((row: any) => ({
    id: row.id,
    items: row.items ?? [],
    subtotal_cents: row.subtotal_cents ?? 0,
    status: row.status ?? "active",
    updated_at: row.updated_at ?? null,
    user_email: row.profiles?.email ?? null,
    anon_id: row.anon_id ?? null
  }));
}
