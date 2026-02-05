import { SupabaseClient } from "@supabase/supabase-js";

const SELLER_FIELDS = "id,user_id,store_name,status";

type SellerRow = {
  id: string;
  user_id: string;
  store_name: string | null;
  status: string | null;
};

type ResolveSellerResult =
  | { error: true; message: string }
  | { error: false; seller: SellerRow };

export const resolveSellerByUser = async (
  supabase: SupabaseClient,
  userId: string
): Promise<ResolveSellerResult> => {
  const { data, error } = await supabase
    .from("sellers")
    .select(SELLER_FIELDS)
    .eq("user_id", userId)
    .maybeSingle<SellerRow>();

  if (error) {
    console.error("[seller/helper] seller fetch failed", error);
    return { error: true, message: "Não foi possível identificar a loja." };
  }

  if (!data) {
    return { error: true, message: "Loja não encontrada." };
  }

  return { error: false, seller: data };
};
