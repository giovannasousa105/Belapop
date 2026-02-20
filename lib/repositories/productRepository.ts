import { getSupabaseClient } from "@/lib/supabase/client";
import { Product } from "@/lib/types";

const selectFields =
  "id,name,price_cents,currency,category,description,images,status,created_at,updated_at,seller_id,weight_kg,width_cm,height_cm,length_cm,highlights,image_tone,is_featured";

const fromDbStatus = (status?: string): Product["status"] => {
  if (status === "pending_review") return "review";
  if (status === "published" || status === "paused" || status === "draft") {
    return status;
  }
  return "draft";
};

const toDbStatus = (status: Product["status"]) =>
  status === "review" ? "pending_review" : status;

const mapProduct = (row: any): Product => ({
  id: row.id,
  name: row.name ?? "",
  price: Number(row.price_cents ?? 0) / 100,
  category: row.category,
  description: row.description ?? "",
  images: row.images ?? [],
  status: fromDbStatus(row.status),
  createdAt: row.created_at ?? new Date().toISOString(),
  sellerId: row.seller_id ?? "",
  weightKg: row.weight_kg ?? undefined,
  widthCm: row.width_cm ?? undefined,
  heightCm: row.height_cm ?? undefined,
  lengthCm: row.length_cm ?? undefined,
  highlights: Array.isArray(row.highlights) ? row.highlights : [],
  imageTone: row.image_tone ?? undefined,
  featured: row.is_featured ?? false
});

const toRow = (product: Product) => ({
  id: product.id,
  name: product.name,
  price_cents: Math.round(product.price * 100),
  currency: "BRL",
  category: product.category,
  description: product.description,
  images: product.images ?? [],
  status: toDbStatus(product.status ?? "draft"),
  created_at: product.createdAt ?? new Date().toISOString(),
  seller_id: product.sellerId,
  weight_kg: product.weightKg ?? null,
  width_cm: product.widthCm ?? null,
  height_cm: product.heightCm ?? null,
  length_cm: product.lengthCm ?? null,
  highlights: product.highlights ?? [],
  image_tone: product.imageTone ?? null,
  is_featured: product.featured ?? false
});

const SELLER_API_BASE = "/api/seller/products";

const decodeJson = async (response: Response) => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const fetchSeller = async (path: string, init: RequestInit) => {
  const response = await fetch(path, {
    credentials: "include",
    ...init
  });
  const json = await decodeJson(response);
  if (!response.ok) {
    const message = json?.error ?? "Não foi possível completar a ação.";
    throw new Error(message);
  }
  return json;
};

export const productRepository = {
  getAll: async (): Promise<Product[]> => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("products")
      .select(selectFields)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[products] getAll failed:", error);
      return [];
    }
    return (data ?? []).map(mapProduct);
  },
  getPublished: async (): Promise<Product[]> => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("products")
      .select(`${selectFields}, sellers(status)`)
      .eq("status", "published");
    if (error) {
      console.error("[products] getPublished failed:", error);
      return [];
    }
    const rows = data ?? [];
    return rows
      .filter((row: any) => {
        const sellerStatus = row.sellers?.status;
        return !sellerStatus || sellerStatus === "active";
      })
      .map(mapProduct);
  },
  getById: async (id: string): Promise<Product | null> => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("products")
      .select(selectFields)
      .eq("id", id)
      .maybeSingle();
    if (error) {
      console.error("[products] getById failed:", error);
      return null;
    }
    return data ? mapProduct(data) : null;
  },
  upsert: async (product: Product) => {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from("products").upsert(toRow(product));
    if (error) {
      console.error("[products] upsert failed:", error);
      return { ok: false, message: error.message };
    }
    return { ok: true };
  },
  remove: async (id: string) => {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      console.error("[products] remove failed:", error);
      return { ok: false, message: error.message };
    }
    return { ok: true };
  },
  listSellerProducts: async (): Promise<Product[]> => {
    const json = await fetchSeller(SELLER_API_BASE, { method: "GET" });
    return Array.isArray(json?.products) ? json.products : [];
  },
  getSellerProduct: async (id: string): Promise<Product | null> => {
    const json = await fetchSeller(`${SELLER_API_BASE}/${id}`, { method: "GET" });
    return json?.product ?? null;
  },
  createSellerProduct: async (payload: Partial<Product>) => {
    try {
      const json = await fetchSeller(SELLER_API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      return { ok: true, product: json.product ?? null };
    } catch (error) {
      console.error("[seller] createProduct failed", error);
      return { ok: false, message: error instanceof Error ? error.message : "Erro" };
    }
  },
  updateSellerProduct: async (id: string, payload: Partial<Product>) => {
    try {
      const json = await fetchSeller(`${SELLER_API_BASE}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      return { ok: true, product: json.product ?? null };
    } catch (error) {
      console.error("[seller] updateProduct failed", error);
      return { ok: false, message: error instanceof Error ? error.message : "Erro" };
    }
  },
  duplicateSellerProduct: async (id: string) => {
    try {
      const json = await fetchSeller(`${SELLER_API_BASE}?duplicateFrom=${encodeURIComponent(id)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      return { ok: true, product: json.product ?? null };
    } catch (error) {
      console.error("[seller] duplicateProduct failed", error);
      return { ok: false, message: error instanceof Error ? error.message : "Erro" };
    }
  }
};

