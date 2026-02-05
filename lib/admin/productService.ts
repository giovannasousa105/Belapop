import { formatISO } from "date-fns";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { PRODUCT_SELECT_FIELDS, mapProductRow } from "@/lib/seller/productMapper";

export type AdminPendingProductRow = {
  id: string;
  name: string;
  price_cents: number;
  status: string;
  created_at: string | null;
  images: string[];
  seller_id: string;
  seller_name: string | null;
  seller_status: string | null;
  seller_postal_code: string | null;
  curated: boolean;
};

export type AdminProductDetail = {
  id: string;
  name: string;
  description: string;
  category: string | null;
  price: number;
  price_cents: number;
  status: string;
  images: string[];
  weightKg?: number;
  widthCm?: number;
  heightCm?: number;
  lengthCm?: number;
  stockQuantity?: number;
  curated?: boolean;
  reviewNotes?: string;
  curationFeedback?: string;
  seller: {
    id: string;
    store_name: string | null;
    status: string | null;
    postal_code: string | null;
    stripe_account_id: string | null;
  };
  createdAt: string;
};

const mapPendingRow = (row: any): AdminPendingProductRow => {
  const sellerInfo = Array.isArray(row.sellers) ? row.sellers[0] : undefined;
  return {
    id: row.id,
    name: row.name,
    price_cents: Number(row.price_cents ?? 0),
    status: row.status,
    created_at: row.created_at,
    images: Array.isArray(row.images) ? row.images : [],
    seller_id: row.seller_id,
    seller_name: sellerInfo?.store_name ?? null,
    seller_status: sellerInfo?.status ?? null,
    seller_postal_code: sellerInfo?.postal_code ?? null,
    curated: Boolean(row.curated)
  };
};

export async function fetchPendingProducts(): Promise<AdminPendingProductRow[]> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select(`${PRODUCT_SELECT_FIELDS}, sellers(store_name,status,postal_code,stripe_account_id)`)
    .in("status", ["pending_review", "needs_adjustment"])
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[admin/products] fetchPending failed", error);
    return [];
  }

  return (data ?? []).map(mapPendingRow);
}

export async function fetchProductDetail(productId: string): Promise<AdminProductDetail | null> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select(`${PRODUCT_SELECT_FIELDS}, sellers(store_name,status,postal_code,stripe_account_id)`)
    .eq("id", productId)
    .maybeSingle();

  if (error || !data) {
    console.error("[admin/productDetail] fetch failed", error);
    return null;
  }

  const sellerInfo = Array.isArray(data.sellers) ? data.sellers[0] : undefined;

  return {
    id: data.id,
    name: data.name,
    description: data.description ?? "",
    category: data.category ?? null,
    price: Number(data.price_cents ?? 0) / 100,
    price_cents: Number(data.price_cents ?? 0),
    status: data.status,
    images: Array.isArray(data.images) ? data.images : [],
    weightKg: data.weight_kg ?? undefined,
    widthCm: data.width_cm ?? undefined,
    heightCm: data.height_cm ?? undefined,
    lengthCm: data.length_cm ?? undefined,
    stockQuantity: data.stock_quantity ?? undefined,
    curated: Boolean(data.curated),
    reviewNotes: data.review_notes ?? undefined,
    curationFeedback: data.curation_feedback ?? undefined,
    createdAt: data.created_at ?? formatISO(new Date()),
    seller: {
      id: data.seller_id,
      store_name: sellerInfo?.store_name ?? null,
      status: sellerInfo?.status ?? null,
      postal_code: sellerInfo?.postal_code ?? null,
      stripe_account_id: sellerInfo?.stripe_account_id ?? null
    }
  };
}
