import { getSupabaseClient } from "@/lib/supabase/client";
import { SellerStatus, SellerStore } from "@/lib/types";

const selectFields =
  "id,user_id,store_name,category,postal_code,whatsapp,instagram,status,stripe_account_id,commission_rate,created_at,profiles(id,email,full_name)";

const mapSeller = (row: any): SellerStore => ({
  id: row.id,
  userId: row.user_id,
  storeName: row.store_name ?? "",
  category: row.category ?? undefined,
  postalCode: row.postal_code ?? undefined,
  whatsapp: row.whatsapp ?? undefined,
  instagram: row.instagram ?? undefined,
  status: row.status ?? "pending",
  stripeAccountId: row.stripe_account_id ?? undefined,
  commissionRate: row.commission_rate ?? undefined,
  createdAt: row.created_at ?? undefined,
  owner: row.profiles
    ? {
        id: row.profiles.id,
        email: row.profiles.email ?? undefined,
        fullName: row.profiles.full_name ?? undefined
      }
    : undefined
});

export const sellerRepository = {
  getAll: async (): Promise<SellerStore[]> => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from("sellers").select(selectFields);
    if (error) {
      console.error("[sellers] getAll failed:", error);
      return [];
    }
    return (data ?? []).map(mapSeller);
  },
  getById: async (id: string): Promise<SellerStore | null> => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("sellers")
      .select(selectFields)
      .eq("id", id)
      .maybeSingle();
    if (error) {
      console.error("[sellers] getById failed:", error);
      return null;
    }
    return data ? mapSeller(data) : null;
  },
  getByIds: async (ids: string[]): Promise<SellerStore[]> => {
    if (ids.length === 0) return [];
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("sellers")
      .select(selectFields)
      .in("id", ids);
    if (error) {
      console.error("[sellers] getByIds failed:", error);
      return [];
    }
    return (data ?? []).map(mapSeller);
  },
  updateStatus: async (sellerId: string, status: SellerStatus) => {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("sellers")
      .update({ status })
      .eq("id", sellerId);
    if (error) {
      console.error("[sellers] updateStatus failed:", error);
      return { ok: false, message: error.message };
    }
    return { ok: true };
  }
};

