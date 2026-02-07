import { NextResponse } from "next/server";

import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { expandSearchTerms, normalizeQuery, parseListParam, type SearchSynonymRow } from "@/lib/search";

type ProductCardDTO = {
  id: string;
  name: string;
  brand: string | null;
  category: string | null;
  price: number;
  imageUrl: string | null;
  ratingAvg: number;
  ratingCount: number;
  curated: boolean;
  isNew: boolean;
  inStock: boolean;
  sellerId: string | null;
};

type FacetCount = { name: string; count: number };
type Facets = {
  brands: FacetCount[];
  categories: FacetCount[];
  priceRange: { min: number; max: number };
};

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

const parseBoolean = (value: string | null) =>
  value === "1" || value === "true";

const getStoreName = (sellers: unknown): string | null => {
  if (!sellers) return null;
  if (Array.isArray(sellers)) {
    return sellers[0]?.store_name ?? null;
  }
  return (sellers as { store_name?: string | null }).store_name ?? null;
};

export async function GET(req: Request) {
  const url = new URL(req.url);

  const q = normalizeQuery(url.searchParams.get("q") ?? "");
  const brands = parseListParam(url.searchParams.get("brand"));
  const categories = parseListParam(url.searchParams.get("category"));
  const min = Number(url.searchParams.get("min") ?? "");
  const max = Number(url.searchParams.get("max") ?? "");
  const curated = parseBoolean(url.searchParams.get("curated"));
  const isNew = parseBoolean(url.searchParams.get("new"));
  const inStock = parseBoolean(url.searchParams.get("in_stock"));
  const sort = url.searchParams.get("sort") ?? (q ? "relevance" : "newest");
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
  const pageSize = Math.min(48, Math.max(6, Number(url.searchParams.get("pageSize") ?? 24)));

  const supabase = getSupabaseAdminClient();

  const synonyms = q ? await getSynonyms(q) : [];
  const terms = q ? expandSearchTerms(q, synonyms) : [];

  let queryBuilder = supabase
    .from("products")
    .select("id,name,category,price_cents,images,created_at,curated,stock_quantity,seller_id,sellers(store_name)")
    .eq("status", "published");

  if (terms.length) {
    queryBuilder = queryBuilder.or(buildOrFilter(terms));
  }

  if (categories.length) {
    queryBuilder = queryBuilder.in("category", categories);
  }

  if (!Number.isNaN(min)) {
    queryBuilder = queryBuilder.gte("price_cents", Math.round(min * 100));
  }

  if (!Number.isNaN(max)) {
    queryBuilder = queryBuilder.lte("price_cents", Math.round(max * 100));
  }

  if (curated) {
    queryBuilder = queryBuilder.eq("curated", true);
  }

  if (inStock) {
    queryBuilder = queryBuilder.gt("stock_quantity", 0);
  }

  if (isNew) {
    const since = new Date();
    since.setDate(since.getDate() - 30);
    queryBuilder = queryBuilder.gte("created_at", since.toISOString());
  }

  const { data: allRows } = await queryBuilder;

  let rows = allRows ?? [];

  if (brands.length) {
    const brandSet = new Set(brands.map((b) => b.toLowerCase()));
    rows = rows.filter((row) =>
      brandSet.has((getStoreName(row.sellers) ?? "").toLowerCase())
    );
  }

  const brandCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();
  let minPrice = Number.POSITIVE_INFINITY;
  let maxPrice = 0;

  rows.forEach((row) => {
    const brand = getStoreName(row.sellers);
    const category = row.category ?? "Outros";
    const price = Number(row.price_cents ?? 0) / 100;
    if (brand) {
      brandCounts.set(brand, (brandCounts.get(brand) ?? 0) + 1);
    }
    categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
    minPrice = Math.min(minPrice, price);
    maxPrice = Math.max(maxPrice, price);
  });

  const ids = rows.map((row) => row.id);
  const needAllRatings = sort === "best_rated";
  const ratingIds = needAllRatings
    ? ids
    : ids.slice((page - 1) * pageSize, page * pageSize);

  const { data: reviewRows } = await supabase
    .from("product_reviews")
    .select("product_id,rating")
    .in("product_id", ratingIds.length ? ratingIds : ["00000000-0000-0000-0000-000000000000"]);

  const ratingMap = new Map<string, { total: number; count: number }>();
  (reviewRows ?? []).forEach((row) => {
    const entry = ratingMap.get(row.product_id) ?? { total: 0, count: 0 };
    entry.total += row.rating ?? 0;
    entry.count += 1;
    ratingMap.set(row.product_id, entry);
  });

  if (sort === "price_asc") {
    rows = [...rows].sort((a, b) => (a.price_cents ?? 0) - (b.price_cents ?? 0));
  } else if (sort === "price_desc") {
    rows = [...rows].sort((a, b) => (b.price_cents ?? 0) - (a.price_cents ?? 0));
  } else if (sort === "newest") {
    rows = [...rows].sort((a, b) => {
      const timeA = new Date(a.created_at ?? 0).getTime();
      const timeB = new Date(b.created_at ?? 0).getTime();
      return timeB - timeA;
    });
  } else if (sort === "best_rated") {
    rows = [...rows].sort((a, b) => {
      const ratingA = ratingMap.get(a.id);
      const ratingB = ratingMap.get(b.id);
      const avgA = ratingA ? ratingA.total / ratingA.count : 0;
      const avgB = ratingB ? ratingB.total / ratingB.count : 0;
      if (avgB !== avgA) return avgB - avgA;
      return (ratingB?.count ?? 0) - (ratingA?.count ?? 0);
    });
  }

  const total = rows.length;
  const start = (page - 1) * pageSize;
  const paged = rows.slice(start, start + pageSize);

  const items: ProductCardDTO[] = paged.map((row) => {
    const rating = ratingMap.get(row.id);
    const imageUrl =
      Array.isArray(row.images) && row.images.length
        ? String(row.images[0])
        : null;
    const createdAt = row.created_at ? new Date(row.created_at) : null;
    const now = new Date();
    const isNewFlag = createdAt
      ? now.getTime() - createdAt.getTime() < 30 * 24 * 60 * 60 * 1000
      : false;

    return {
      id: row.id,
      name: row.name,
      brand: getStoreName(row.sellers),
      category: row.category ?? null,
      price: Number(row.price_cents ?? 0) / 100,
      imageUrl,
      ratingAvg: rating ? rating.total / rating.count : 0,
      ratingCount: rating ? rating.count : 0,
      curated: Boolean(row.curated),
      isNew: isNewFlag,
      inStock: Number(row.stock_quantity ?? 0) > 0,
      sellerId: row.seller_id ?? null
    };
  });

  const facets: Facets = {
    brands: Array.from(brandCounts.entries()).map(([name, count]) => ({
      name,
      count
    })),
    categories: Array.from(categoryCounts.entries()).map(([name, count]) => ({
      name,
      count
    })),
    priceRange: {
      min: Number.isFinite(minPrice) ? minPrice : 0,
      max: maxPrice
    }
  };

  return NextResponse.json({
    items,
    page,
    pageSize,
    total,
    facets
  });
}
