import { getSupabaseClient } from "@/lib/supabase/client";
import { SellerProfile, User, UserRole } from "@/lib/types";

const selectFields =
  "id,email,role,full_name,created_at,sellers(id,store_name,category,postal_code,whatsapp,instagram,status,stripe_account_id,commission_rate)";

const mapUser = (data: any): User => {
  const seller = data?.sellers;
  return {
    id: data.id,
    name: data.full_name ?? data.email ?? "",
    email: data.email ?? "",
    role: (data.role ?? "customer") as UserRole,
    createdAt: data.created_at ?? undefined,
    sellerProfile: seller
      ? {
          sellerId: seller.id ?? undefined,
          storeName: seller.store_name ?? "",
          responsibleName: data.full_name ?? "",
          contact: seller.whatsapp ?? seller.instagram ?? "",
          mainCategory: seller.category ?? "",
          postalCode: seller.postal_code ?? "",
          status: seller.status ?? "pending",
          stripeAccountId: seller.stripe_account_id ?? undefined,
          commissionRate: seller.commission_rate ?? undefined
        }
      : undefined
  };
};

export const userRepository = {
  getAll: async (): Promise<User[]> => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from("profiles").select(selectFields);
    if (error) {
      console.error("[users] getAll failed:", error);
      return [];
    }
    return (data ?? []).map(mapUser);
  },
  findById: async (id: string): Promise<User | null> => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("profiles")
      .select(selectFields)
      .eq("id", id)
      .maybeSingle();
    if (error) {
      console.error("[users] findById failed:", error);
      return null;
    }
    return data ? mapUser(data) : null;
  },
  updateSellerProfile: async (
    userId: string,
    profile: Partial<SellerProfile>
  ) => {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from("sellers")
      .update({
        store_name: profile.storeName ?? null,
        category: profile.mainCategory ?? null,
        postal_code: profile.postalCode ?? null,
        whatsapp: profile.contact ?? null,
        status: profile.status ?? null,
        stripe_account_id: profile.stripeAccountId ?? null,
        commission_rate: profile.commissionRate ?? null
      })
      .eq("user_id", userId);

    if (error) {
      console.error("[users] updateSellerProfile failed:", error);
      return { ok: false, message: error.message };
    }
    return { ok: true };
  }
};

