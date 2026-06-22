import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type RatingSummary = {
  ratingMedio: number;
  totalAvaliacoes: number;
};

const REJECTED_STATUSES = ["reprovado", "bloqueado"];

export async function getProductRatingSummary(productId: string): Promise<RatingSummary> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("product_reviews")
    .select("rating")
    .eq("product_id", productId)
    .eq("is_hidden", false)
    .not("moderation_status", "in", `(${REJECTED_STATUSES.join(",")})`);

  if (error || !data || data.length === 0) {
    return { ratingMedio: 0, totalAvaliacoes: 0 };
  }

  const total = data.length;
  const avg = data.reduce((sum, r) => sum + (r.rating as number), 0) / total;
  return {
    ratingMedio: Math.round(avg * 10) / 10,
    totalAvaliacoes: total,
  };
}
