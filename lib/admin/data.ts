import { getSupabaseServerClient } from "@/lib/supabaseServer";

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

  const { data: settings } = await supabase
    .from("admin_settings")
    .select("value")
    .eq("key", "commission_rate")
    .maybeSingle();

  const commissionRate = settings ? Number(settings.value) / 100 : 0.05;

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
    .limit(20);

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
  const { data } = await supabase
    .from("admin_settings")
    .select("key,value")
    .order("key");

  return (data ?? []) as { key: string; value: string }[];
}
