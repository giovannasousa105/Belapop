import { getSupabaseServerClient } from "@/lib/supabaseServer";

type SupabaseErrorLike = {
  code?: string | null;
  message?: string | null;
};

const MISSING_SCHEMA_ERROR_CODES = new Set(["42P01", "42703", "PGRST204", "PGRST205"]);

const isMissingSchemaError = (error: SupabaseErrorLike | null | undefined) => {
  if (!error) return false;

  if (error.code && MISSING_SCHEMA_ERROR_CODES.has(error.code)) {
    return true;
  }

  const message = String(error.message ?? "").toLowerCase();
  return (
    message.includes("could not find the table") ||
    message.includes("schema cache") ||
    message.includes("relation") ||
    message.includes("does not exist")
  );
};

export type AdminDashboardSummary = {
  gmv: number;
  commissionRate: number;
  totalOrders: number;
  activeSellers: number;
  pendingProducts: number;
};

export type AdminSellerRow = {
  id: string;
  store_name: string;
  status: string | null;
  origin_zip: string | null;
  created_at: string | null;
};

export type AdminProductRow = {
  id: string;
  name: string;
  price_cents: number;
  seller_id: string;
  status: string;
  curated: boolean;
  created_at: string | null;
};

export type AdminOrderRow = {
  id: string;
  total_cents: number;
  status: string;
  created_at: string | null;
  shipping_cents: number | null;
  commission_cents: number | null;
};

export type AdminDiaryRow = {
  id: string;
  title: string;
  category: string;
  published: boolean;
  created_at: string | null;
};

export async function fetchDashboardSummary(): Promise<AdminDashboardSummary> {
  const supabase = await getSupabaseServerClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("total_cents")
    .in("status", ["paid", "processing", "shipped", "delivered"]);

  const totalOrders = orders?.length ?? 0;
  const gmv = orders?.reduce((sum, order) => sum + (order.total_cents ?? 0), 0) ?? 0;

  const { data: sellers } = await supabase
    .from("sellers")
    .select("id,status")
    .in("status", ["active", null]);
  const activeSellers = sellers?.length ?? 0;

  const { data: products } = await supabase
    .from("products")
    .select("id,status")
    .in("status", ["review"]);
  const pendingProducts = products?.length ?? 0;

  const { data: settings, error: settingsError } = await supabase
    .from("admin_settings")
    .select("value")
    .eq("key", "commission_rate")
    .maybeSingle();

  const commissionRate =
    settingsError && !isMissingSchemaError(settingsError)
      ? 0.05
      : settings
        ? Number(settings.value) / 100
        : 0.05;

  return {
    gmv,
    commissionRate,
    totalOrders,
    activeSellers,
    pendingProducts
  };
}

export async function fetchSellers(): Promise<AdminSellerRow[]> {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("sellers")
    .select("id,store_name,status,origin_zip,created_at")
    .order("created_at", { ascending: false });

  return (data ?? []) as AdminSellerRow[];
}

export async function fetchProducts(): Promise<AdminProductRow[]> {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("products")
    .select("id,name,price_cents,seller_id,status,curated,created_at")
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => ({
    ...row,
    curated: row.curated ?? false
  })) as AdminProductRow[];
}

export async function fetchOrders(): Promise<AdminOrderRow[]> {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("orders")
    .select("id,total_cents,status,created_at,shipping_cents")
    .order("created_at", { ascending: false })
    .limit(120);

  return (data ?? []).map((row) => ({
    ...row,
    commission_cents: row.total_cents ? Math.floor(row.total_cents * 0.1) : 0
  })) as AdminOrderRow[];
}

export async function fetchDiaryPosts(): Promise<AdminDiaryRow[]> {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase
    .from("diario_posts")
    .select("id,title,category,published,created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  return (data ?? []) as AdminDiaryRow[];
}

export async function fetchAdminSettings() {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("admin_settings")
    .select("key,value")
    .order("key");

  if (error && isMissingSchemaError(error)) {
    return [] as { key: string; value: string }[];
  }

  return (data ?? []) as { key: string; value: string }[];
}
