import { sortByEditorialCuration } from "@/lib/product/editorialCuration";
import { fetchEditorialPriorityIds } from "@/lib/product/editorialOrder";
import { createSupabaseServer } from "@/lib/supabase/server";

type SearchParams = Record<string, string | string[] | undefined>;
type FacetCountMap = Record<string, number>;

type CatalogProduct = {
  id: string;
  slug: string;
  title: string;
  category: string | null;
  brand: string | null;
  price_cents: number;
  currency: string | null;
  hero_image_url: string | null;
  badges: string[] | null;
  ritual: string | null;
  texture: string | null;
  tags: string[] | null;
  is_featured: boolean | null;
  created_at: string | null;
  in_stock: boolean;
};

type CatalogFacets = {
  brands: string[];
  brandCounts: FacetCountMap;
  tagCounts: FacetCountMap;
  minPrice: number;
  maxPrice: number;
};

function asString(v: unknown) {
  if (Array.isArray(v)) return v[0];
  return typeof v === "string" ? v : undefined;
}

function asArray(v: unknown) {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter(Boolean) as string[];
  if (typeof v === "string")
    return v
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  return [];
}

function uniqueIds(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function intersectIdSets(current: string[] | null, next: string[]) {
  const normalizedNext = uniqueIds(next);
  if (!normalizedNext.length) return [];
  if (!current) return normalizedNext;
  const nextSet = new Set(normalizedNext);
  return current.filter((id) => nextSet.has(id));
}

function toCatalogProduct(row: Record<string, unknown>): CatalogProduct {
  const stockQuantity =
    typeof row.stock_quantity === "number"
      ? row.stock_quantity
      : Number(row.stock_quantity ?? 0);

  return {
    id: String(row.id ?? ""),
    slug: String(row.slug ?? row.id ?? ""),
    title: String(row.title ?? row.name ?? "Produto BelaPop"),
    category: typeof row.category === "string" ? row.category : null,
    brand: typeof row.brand === "string" ? row.brand : null,
    price_cents:
      typeof row.price_cents === "number"
        ? row.price_cents
        : Number(row.price_cents ?? 0),
    currency: typeof row.currency === "string" ? row.currency : null,
    hero_image_url:
      typeof row.hero_image_url === "string" ? row.hero_image_url : null,
    badges: Array.isArray(row.badges)
      ? row.badges.filter((item): item is string => typeof item === "string")
      : null,
    ritual: typeof row.ritual === "string" ? row.ritual : null,
    texture: typeof row.texture === "string" ? row.texture : null,
    tags: Array.isArray(row.tags)
      ? row.tags.filter((item): item is string => typeof item === "string")
      : null,
    is_featured: typeof row.is_featured === "boolean" ? row.is_featured : null,
    created_at: typeof row.created_at === "string" ? row.created_at : null,
    in_stock: stockQuantity > 0
  };
}

export async function getCatalogData(searchParams: SearchParams) {
  const supabase = await createSupabaseServer();

  const q = asString(searchParams.q);
  const category = asString(searchParams.category) ?? asString(searchParams.categoria);
  const ritual = asString(searchParams.ritual);
  const texture = asString(searchParams.texture);
  const collection = asString(searchParams.collection);
  const origin = asString(searchParams.origin);
  const ingredient = asString(searchParams.ingredient);
  const brand = asArray(searchParams.brand);
  const tags = asArray(searchParams.tags);
  const inStock = asString(searchParams.stock); // "1" para em estoque
  const sort = asString(searchParams.sort) || "featured";
  const min = asString(searchParams.min);
  const max = asString(searchParams.max);
  let filteredProductIds: string[] | null = null;

  if (collection) {
    const { data: collectionRows, error: collectionError } = await supabase
      .from("collections")
      .select("id")
      .eq("slug", collection)
      .eq("status", "published")
      .limit(1);

    if (collectionError) throw collectionError;

    const collectionId = collectionRows?.[0]?.id as string | undefined;
    if (!collectionId) {
      return {
        products: [],
        facets: {
          brands: [],
          brandCounts: {},
          tagCounts: {},
          minPrice: 0,
          maxPrice: 0
        }
      };
    }

    const { data: collectionProducts, error: collectionProductsError } = await supabase
      .from("collection_products")
      .select("product_id")
      .eq("collection_id", collectionId);

    if (collectionProductsError) throw collectionProductsError;
    filteredProductIds = intersectIdSets(
      filteredProductIds,
      (collectionProducts ?? []).map((row) => String(row.product_id ?? ""))
    );
  }

  if (origin) {
    const { data: originRows, error: originError } = await supabase
      .from("origins")
      .select("id")
      .eq("slug", origin)
      .eq("status", "active")
      .limit(1);

    if (originError) throw originError;

    const originId = originRows?.[0]?.id as string | undefined;
    if (!originId) {
      return {
        products: [],
        facets: {
          brands: [],
          brandCounts: {},
          tagCounts: {},
          minPrice: 0,
          maxPrice: 0
        }
      };
    }

    const { data: originProducts, error: originProductsError } = await supabase
      .from("product_origins")
      .select("product_id")
      .eq("origin_id", originId);

    if (originProductsError) throw originProductsError;
    filteredProductIds = intersectIdSets(
      filteredProductIds,
      (originProducts ?? []).map((row) => String(row.product_id ?? ""))
    );
  }

  if (ingredient) {
    const { data: ingredientRows, error: ingredientError } = await supabase
      .from("ingredients")
      .select("id")
      .eq("slug", ingredient)
      .eq("status", "active")
      .limit(1);

    if (ingredientError) throw ingredientError;

    const ingredientId = ingredientRows?.[0]?.id as string | undefined;
    if (!ingredientId) {
      return {
        products: [],
        facets: {
          brands: [],
          brandCounts: {},
          tagCounts: {},
          minPrice: 0,
          maxPrice: 0
        }
      };
    }

    const { data: ingredientProducts, error: ingredientProductsError } = await supabase
      .from("product_ingredients")
      .select("product_id")
      .eq("ingredient_id", ingredientId);

    if (ingredientProductsError) throw ingredientProductsError;
    filteredProductIds = intersectIdSets(
      filteredProductIds,
      (ingredientProducts ?? []).map((row) => String(row.product_id ?? ""))
    );
  }

  let query = supabase
    .from("products")
    .select(
      "id,slug,title,name,category,brand,price_cents,currency,hero_image_url,badges,ritual,texture,tags,is_featured,created_at,stock_quantity,status"
    )
    .in("status", ["active", "published"]);

  // search (simples e rapido)
  if (q) {
    const safeQ = q.replace(/[%_]/g, "").trim();
    if (safeQ) {
      query = query.or(`title.ilike.%${safeQ}%,name.ilike.%${safeQ}%,brand.ilike.%${safeQ}%`);
    }
  }

  if (category) {
    const safeCategory = category.replace(/[%_]/g, "").trim();
    if (safeCategory) {
      query = query.ilike("category", `%${safeCategory}%`);
    }
  }

  if (ritual) query = query.eq("ritual", ritual);
  if (texture) query = query.eq("texture", texture);

  if (brand.length) query = query.in("brand", brand);

  if (tags.length) query = query.contains("tags", tags);

  if (inStock === "1") query = query.gt("stock_quantity", 0);

  if (min) query = query.gte("price_cents", Math.round(Number(min) * 100));
  if (max) query = query.lte("price_cents", Math.round(Number(max) * 100));
  if (filteredProductIds) {
    if (!filteredProductIds.length) {
      return {
        products: [],
        facets: {
          brands: [],
          brandCounts: {},
          tagCounts: {},
          minPrice: 0,
          maxPrice: 0
        }
      };
    }
    query = query.in("id", filteredProductIds);
  }

  // sort
  switch (sort) {
    case "new":
      query = query.order("created_at", { ascending: false });
      break;
    case "price_asc":
      query = query.order("price_cents", { ascending: true });
      break;
    case "price_desc":
      query = query.order("price_cents", { ascending: false });
      break;
    case "featured":
    default:
      query = query
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });
      break;
  }

  // products
  const { data: productsRaw, error } = await query;
  if (error) throw error;

  const products = (productsRaw ?? []).map((row) =>
    toCatalogProduct(row as Record<string, unknown>)
  );
  const priorityIds =
    sort === "featured" ? await fetchEditorialPriorityIds("featured") : [];
  const sortedProducts =
    sort === "featured" ? sortByEditorialCuration(products, { priorityIds }) : products;

  // facets (marcas + tags + range de preco)
  const { data: facetRows } = await supabase
    .from("products")
    .select("brand,tags,price_cents")
    .in("status", ["active", "published"]);

  const brandCounts: FacetCountMap = {};
  const tagCounts: FacetCountMap = {};
  const pricesCents: number[] = [];

  for (const row of facetRows ?? []) {
    if (typeof row.brand === "string" && row.brand.trim()) {
      brandCounts[row.brand] = (brandCounts[row.brand] ?? 0) + 1;
    }
    if (Array.isArray(row.tags)) {
      for (const tag of row.tags) {
        if (typeof tag !== "string" || !tag.trim()) continue;
        tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
      }
    }
    const priceCents =
      typeof row.price_cents === "number" ? row.price_cents : Number(row.price_cents ?? 0);
    if (Number.isFinite(priceCents) && priceCents > 0) {
      pricesCents.push(priceCents);
    }
  }

  const brands = Object.keys(brandCounts).sort((a, b) => a.localeCompare(b));

  const minPrice = pricesCents.length ? Math.floor(Math.min(...pricesCents) / 100) : 0;
  const maxPrice = pricesCents.length ? Math.ceil(Math.max(...pricesCents) / 100) : 0;

  const facets: CatalogFacets = {
    brands,
    brandCounts,
    tagCounts,
    minPrice,
    maxPrice
  };

  return {
    products: sortedProducts,
    facets
  };
}
