import "server-only";

import { cache } from "react";

import {
  CURATION_KINDS,
  listDiscoveryCollectionKinds,
  type DiscoveryCollectionAdminProduct,
  type DiscoveryCollectionAdminProductLink,
  type DiscoveryCollectionAdminRow,
  type DiscoveryCollectionKind
} from "@/lib/admin/discoveryCuration.shared";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type CollectionRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  kind: DiscoveryCollectionKind;
  status: "draft" | "published" | "archived";
  cover_image: string | null;
  editorial_boost: number | null;
  trend_boost: number | null;
  published_at: string | null;
};

type CollectionProductRow = {
  collection_id: string;
  product_id: string;
  position: number | null;
  editorial_boost: number | null;
};

type ProductRow = {
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

type ProductRankingRow = {
  product_id: string;
  product_score: number | null;
};

const ACTIVE_PRODUCT_STATUSES = ["active", "published"];

const mapProductRow = (
  row: ProductRow,
  productScore: number | null
): DiscoveryCollectionAdminProduct => ({
  id: row.id,
  slug: row.slug ?? row.id,
  title: row.title ?? row.name ?? "Produto BelaPop",
  category: row.category,
  brand: row.brand,
  priceCents: Number(row.price_cents ?? 0),
  heroImageUrl: row.hero_image_url,
  images: Array.isArray(row.images) ? row.images : [],
  status: row.status,
  createdAt: row.created_at,
  productScore: productScore === null ? null : Number(productScore)
});

async function loadDiscoveryCurationAdminData() {
  const admin = getSupabaseAdminClient();

  const [collectionsResult, linksResult, productsResult, rankingsResult] = await Promise.all([
    admin
      .from("collections")
      .select("id,slug,title,description,kind,status,cover_image,editorial_boost,trend_boost,published_at")
      .in("kind", [...CURATION_KINDS])
      .order("kind", { ascending: true })
      .order("trend_boost", { ascending: false })
      .order("editorial_boost", { ascending: false })
      .order("published_at", { ascending: false, nullsFirst: false }),
    admin.from("collection_products").select("collection_id,product_id,position,editorial_boost"),
    admin
      .from("products")
      .select("id,slug,title,name,category,brand,price_cents,hero_image_url,images,status,created_at")
      .in("status", ACTIVE_PRODUCT_STATUSES)
      .order("created_at", { ascending: false })
      .limit(300),
    admin.from("product_rankings").select("product_id,product_score")
  ]);

  const error =
    collectionsResult.error ?? linksResult.error ?? productsResult.error ?? rankingsResult.error;
  if (error) {
    throw error;
  }

  const rankingMap = new Map(
    ((rankingsResult.data ?? []) as ProductRankingRow[]).map((row) => [row.product_id, row.product_score])
  );

  const productMap = new Map(
    ((productsResult.data ?? []) as ProductRow[]).map((row) => [
      row.id,
      mapProductRow(row, rankingMap.get(row.id) ?? null)
    ])
  );

  const linksByCollection = new Map<string, DiscoveryCollectionAdminProductLink[]>();
  for (const row of (linksResult.data ?? []) as CollectionProductRow[]) {
    const product = productMap.get(row.product_id);
    if (!product) continue;
    const list = linksByCollection.get(row.collection_id) ?? [];
    list.push({
      productId: row.product_id,
      position: Number(row.position ?? 1),
      editorialBoost: Number(row.editorial_boost ?? 0),
      product
    });
    linksByCollection.set(row.collection_id, list);
  }

  for (const list of linksByCollection.values()) {
    list.sort((left, right) => left.position - right.position || right.editorialBoost - left.editorialBoost);
  }

  const collections = ((collectionsResult.data ?? []) as CollectionRow[]).map((row) => {
    const products = linksByCollection.get(row.id) ?? [];
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      description: row.description,
      kind: row.kind,
      status: row.status,
      coverImage: row.cover_image,
      editorialBoost: Number(row.editorial_boost ?? 0),
      trendBoost: Number(row.trend_boost ?? 0),
      publishedAt: row.published_at,
      productCount: products.length,
      products
    } satisfies DiscoveryCollectionAdminRow;
  });

  const availableProducts = Array.from(productMap.values()).sort((left, right) => {
    const scoreDelta = Number(right.productScore ?? -1) - Number(left.productScore ?? -1);
    if (scoreDelta !== 0) return scoreDelta;
    return String(right.createdAt ?? "").localeCompare(String(left.createdAt ?? ""));
  });

  return {
    kinds: listDiscoveryCollectionKinds(),
    collections,
    availableProducts
  };
}

export const fetchDiscoveryCurationAdminData = cache(loadDiscoveryCurationAdminData);
export const fetchDiscoveryCurationAdminDataUncached = loadDiscoveryCurationAdminData;
