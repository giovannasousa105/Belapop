import "server-only";

import { cache } from "react";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type EditorialCurationSurface = "featured";

type EditorialOrderRow = {
  product_id: string;
  position: number;
};

type EditorialProductRow = {
  id: string;
  slug: string | null;
  title: string | null;
  name: string | null;
  category: string | null;
  brand: string | null;
  price_cents: number | null;
  hero_image_url: string | null;
  images: string[] | null;
  status: string | null;
  created_at: string | null;
};

export type EditorialCurationAdminProduct = {
  id: string;
  slug: string;
  title: string;
  category: string | null;
  brand: string | null;
  priceCents: number;
  heroImageUrl: string | null;
  images: string[];
  status: string | null;
  createdAt: string | null;
};

export type EditorialCurationAdminRow = {
  position: number;
  product: EditorialCurationAdminProduct;
};

const ACTIVE_PRODUCT_STATUSES = ["active", "published"];

const isMissingTableError = (error: unknown) => {
  const code = typeof error === "object" && error && "code" in error ? String((error as { code?: unknown }).code ?? "") : "";
  const message =
    typeof error === "object" && error && "message" in error
      ? String((error as { message?: unknown }).message ?? "")
      : "";
  return code === "42P01" || message.toLowerCase().includes("editorial_product_curations");
};

const mapProductRow = (row: EditorialProductRow): EditorialCurationAdminProduct => ({
  id: row.id,
  slug: row.slug ?? row.id,
  title: row.title ?? row.name ?? "Produto BelaPop",
  category: row.category,
  brand: row.brand,
  priceCents: Number(row.price_cents ?? 0),
  heroImageUrl: row.hero_image_url,
  images: Array.isArray(row.images) ? row.images : [],
  status: row.status,
  createdAt: row.created_at
});

const fetchPublishedProducts = async (): Promise<EditorialCurationAdminProduct[]> => {
  const admin = getSupabaseAdminClient();
  const primary = await admin
    .from("products")
    .select("id,slug,title,name,category,brand,price_cents,hero_image_url,images,status,created_at")
    .in("status", ACTIVE_PRODUCT_STATUSES)
    .order("created_at", { ascending: false })
    .limit(120);

  if (!primary.error) {
    return (primary.data ?? []).map((row) => mapProductRow(row as EditorialProductRow));
  }

  const fallback = await admin
    .from("products")
    .select("id,slug,title,name,category,price_cents,hero_image_url,images,status,created_at")
    .in("status", ACTIVE_PRODUCT_STATUSES)
    .order("created_at", { ascending: false })
    .limit(120);

  if (fallback.error) {
    throw fallback.error;
  }

  return (fallback.data ?? []).map((row) =>
    mapProductRow({ ...(row as EditorialProductRow), brand: null })
  );
};

export const fetchEditorialPriorityIds = cache(
  async (surface: EditorialCurationSurface = "featured"): Promise<string[]> => {
    const admin = getSupabaseAdminClient();
    const { data, error } = await admin
      .from("editorial_product_curations")
      .select("product_id,position")
      .eq("surface", surface)
      .eq("is_active", true)
      .order("position", { ascending: true });

    if (error) {
      if (isMissingTableError(error)) return [];
      console.error("[editorialOrder] priority lookup failed", error);
      return [];
    }

    return (data as EditorialOrderRow[] | null)?.map((row) => row.product_id) ?? [];
  }
);

export async function fetchEditorialCurationAdminData(
  surface: EditorialCurationSurface = "featured"
) {
  const [priorityIds, publishedProducts] = await Promise.all([
    fetchEditorialPriorityIds(surface),
    fetchPublishedProducts()
  ]);

  const productMap = new Map(publishedProducts.map((product) => [product.id, product]));
  const curated: EditorialCurationAdminRow[] = priorityIds
    .map((productId, index) => {
      const product = productMap.get(productId);
      if (!product) return null;
      return {
        position: index + 1,
        product
      };
    })
    .filter((row): row is EditorialCurationAdminRow => Boolean(row));

  const curatedIds = new Set(curated.map((row) => row.product.id));
  const available = publishedProducts.filter((product) => !curatedIds.has(product.id));

  return {
    surface,
    curated,
    available
  };
}
