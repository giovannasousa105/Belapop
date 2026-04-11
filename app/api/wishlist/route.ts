import { NextResponse } from "next/server";

import { getSupabaseServerClient } from "@/lib/supabaseServer";

type WishlistItemRow = {
  id: string;
  product_id: string;
  products: {
    id: string;
    name: string;
    price_cents: number;
    category: string | null;
    images: string[] | null;
    seller_id: string | null;
  } | null;
};

type RawWishlistItemRow = Omit<WishlistItemRow, "products"> & {
  products: WishlistItemRow["products"] | WishlistItemRow["products"][] | null;
};

const requireUser = async () => {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return { supabase, user };
};

export async function GET() {
  const { supabase, user } = await requireUser();
  if (!user) {
    return NextResponse.json({ items: [] }, { status: 200 });
  }

  const { data, error } = await supabase
    .from("wishlist_items")
    .select(
      "id,product_id,products(id,name,price_cents,category,images,seller_id)"
    )
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rawItems = (data ?? []) as RawWishlistItemRow[];
  const items: WishlistItemRow[] = rawItems.map((row) => ({
    ...row,
    products: Array.isArray(row.products)
      ? row.products[0] ?? null
      : row.products ?? null
  }));

  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const { supabase, user } = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { productId?: string };
  if (!body.productId) {
    return NextResponse.json({ error: "productId_required" }, { status: 400 });
  }

  const { error } = await supabase.from("wishlist_items").upsert(
    {
      user_id: user.id,
      product_id: body.productId
    },
    { onConflict: "user_id,product_id", ignoreDuplicates: true }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { error: analyticsError } = await supabase.from("analytics_events").insert({
    type: "favorite",
    user_id: user.id,
    product_id: body.productId,
    metadata: {
      source: "wishlist"
    }
  });
  if (analyticsError) {
    console.error("[wishlist] failed to persist favorite analytics:", analyticsError.message);
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { supabase, user } = await requireUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as { productId?: string };
  if (!body.productId) {
    return NextResponse.json({ error: "productId_required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("wishlist_items")
    .delete()
    .eq("user_id", user.id)
    .eq("product_id", body.productId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
