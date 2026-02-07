import { NextResponse } from "next/server";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { expandSearchTerms, normalizeQuery, type SearchSynonymRow } from "@/lib/search";

type SearchProduct = {
  id: string;
  name: string;
  brand: string | null;
  price: number;
  imageUrl: string | null;
  ratingAvg: number;
  ratingCount: number;
};

type SearchFacet = { name: string; count: number };

const getSynonyms = async (query: string) => {
  const supabase = getSupabaseAdminClient();
  try {
    const { data, error } = await supabase
      .from("search_synonyms")
      .select("term,synonym")
      .or(`term.eq.${query},synonym.eq.${query}`);
    if (error) return [];
    return (data ?? []) as SearchSynonymRow[];
  } catch {
    return [];
  }
};

const buildOrFilter = (terms: string[]) => {
  const clauses: string[] = [];
  terms.forEach((term) => {
    const safe = term.replace(/,/g, " ");
    clauses.push(`name.ilike.%${safe}%`);
    clauses.push(`category.ilike.%${safe}%`);
    clauses.push(`sellers.store_name.ilike.%${safe}%`);
  });
  return clauses.join(",");
};

const getStoreName = (sellers: unknown): string | null => {
  if (!sellers) return null;
  if (Array.isArray(sellers)) {
    return sellers[0]?.store_name ?? null;
  }
  return (sellers as { store_name?: string | null }).store_name ?? null;
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const rawQuery = url.searchParams.get("q") ?? "";
  const limit = Number(url.searchParams.get("limit") ?? 8);
  const normalizedQuery = normalizeQuery(rawQuery);

  if (!normalizedQuery) {
    return NextResponse.json({
      products: [],
      brands: [],
      categories: [],
      normalizedQuery: ""
    });
  }

  const synonyms = await getSynonyms(normalizedQuery);
  const terms = expandSearchTerms(normalizedQuery, synonyms);
  const supabase = getSupabaseAdminClient();

  const { data: productRows } = await supabase
    .from("products")
    .select("id,name,category,price_cents,images,created_at,seller_id,sellers(store_name)")
    .eq("status", "published")
    .or(buildOrFilter(terms))
    .limit(limit);

  const ids = (productRows ?? []).map((row) => row.id);
  const { data: reviewRows } = await supabase
    .from("product_reviews")
    .select("product_id,rating")
    .in("product_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);

  const ratingMap = new Map<string, { total: number; count: number }>();
  (reviewRows ?? []).forEach((row) => {
    const entry = ratingMap.get(row.product_id) ?? { total: 0, count: 0 };
    entry.total += row.rating ?? 0;
    entry.count += 1;
    ratingMap.set(row.product_id, entry);
  });

  const products: SearchProduct[] = (productRows ?? []).map((row) => {
    const rating = ratingMap.get(row.id);
    const imageUrl =
      Array.isArray(row.images) && row.images.length
        ? String(row.images[0])
        : null;
    return {
      id: row.id,
      name: row.name,
      brand: getStoreName(row.sellers),
      price: Number(row.price_cents ?? 0) / 100,
      imageUrl,
      ratingAvg: rating ? rating.total / rating.count : 0,
      ratingCount: rating ? rating.count : 0
    };
  });

  const brandCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();
  products.forEach((product) => {
    if (product.brand) {
      brandCounts.set(product.brand, (brandCounts.get(product.brand) ?? 0) + 1);
    }
  });
  (productRows ?? []).forEach((row) => {
    const category = row.category ?? "Outros";
    categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
  });

  const brands: SearchFacet[] = Array.from(brandCounts.entries()).map(
    ([name, count]) => ({ name, count })
  );
  const categories: SearchFacet[] = Array.from(categoryCounts.entries()).map(
    ([name, count]) => ({ name, count })
  );

  return NextResponse.json({
    products,
    brands,
    categories,
    normalizedQuery
  });
}
