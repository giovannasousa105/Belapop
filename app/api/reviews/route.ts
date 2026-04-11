import { NextResponse } from "next/server";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

type ReviewRow = {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;
  comment: string | null;
  is_verified: boolean;
  is_hidden?: boolean;
  moderation_status?: string | null;
  created_at: string;
  profiles?: { full_name: string | null } | null;
};

type RawReviewRow = Omit<ReviewRow, "profiles"> & {
  profiles?: { full_name: string | null }[] | { full_name: string | null } | null;
};

const allowedStatuses = new Set(["paid", "fulfilled", "delivered", "shipped", "processing"]);

export async function GET(req: Request) {
  const url = new URL(req.url);
  const productId = url.searchParams.get("productId");
  if (!productId) {
    return NextResponse.json({ error: "productId_required" }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  let rawReviews: RawReviewRow[] = [];
  try {
    const { data, error } = await supabase
      .from("product_reviews")
      .select("id,user_id,product_id,rating,comment,is_verified,is_hidden,moderation_status,created_at,profiles(full_name)")
      .eq("product_id", productId)
      .eq("is_hidden", false)
      .order("created_at", { ascending: false });

    if (error) throw error;
    rawReviews = (data ?? []) as RawReviewRow[];
  } catch {
    const { data } = await supabase
      .from("product_reviews")
      .select("id,user_id,product_id,rating,comment,is_verified,created_at,profiles(full_name)")
      .eq("product_id", productId)
      .order("created_at", { ascending: false });

    rawReviews = (data ?? []) as RawReviewRow[];
  }

  const reviews: ReviewRow[] = rawReviews.map((row) => ({
    ...row,
    profiles: Array.isArray(row.profiles)
      ? row.profiles[0] ?? null
      : row.profiles ?? null
  }));
  const total = reviews.reduce((acc, row) => acc + (row.rating ?? 0), 0);
  const count = reviews.length;
  const average = count ? total / count : 0;

  return NextResponse.json({ reviews, ratingAvg: average, ratingCount: count });
}

export async function POST(req: Request) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    productId?: string;
    rating?: number;
    comment?: string;
  };

  if (!body.productId || !body.rating) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  if (body.rating < 1 || body.rating > 5) {
    return NextResponse.json({ error: "invalid_rating" }, { status: 400 });
  }

  const { data: orders } = await supabase
    .from("orders")
    .select("id,status")
    .eq("customer_id", user.id);

  const validOrders = (orders ?? []).filter((order) =>
    allowedStatuses.has(order.status ?? "")
  );

  if (!validOrders.length) {
    return NextResponse.json({ error: "purchase_required" }, { status: 403 });
  }

  const { data: subOrders } = await supabase
    .from("sub_orders")
    .select("order_id,items,status")
    .in("order_id", validOrders.map((order) => order.id));

  const hasPurchase = (subOrders ?? []).some((sub) =>
    Array.isArray(sub.items)
      ? sub.items.some((item: { productId?: string }) => item.productId === body.productId)
      : false
  );

  if (!hasPurchase) {
    return NextResponse.json({ error: "purchase_required" }, { status: 403 });
  }

  const { error } = await supabase.from("product_reviews").insert({
    user_id: user.id,
    product_id: body.productId,
    rating: body.rating,
    comment: body.comment ?? null,
    is_verified: true
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
