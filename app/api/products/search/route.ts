import { NextResponse } from "next/server";

import { fetchEditorialPriorityIds } from "@/lib/product/editorialOrder";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  expandSearchTerms,
  normalizeQuery,
  parseListParam,
  type SearchSynonymRow
} from "@/lib/search";

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
  rituals: FacetCount[];
  textures: FacetCount[];
  sensations: FacetCount[];
  results: FacetCount[];
  moments: FacetCount[];
  skinTypes: FacetCount[];
  finishes: FacetCount[];
  tags: FacetCount[];
  availability: {
    inStock: number;
    readyDelivery: number;
    outOfStock: number;
  };
  priceRange: { min: number; max: number };
};

type ProductRow = {
  id: string;
  name: string | null;
  title: string | null;
  brand?: string | null;
  description?: string | null;
  category: string | null;
  ritual: string | null;
  texture: string | null;
  sensation: unknown;
  result: unknown;
  badges?: unknown;
  highlights?: unknown;
  price_cents: number | null;
  images: unknown;
  created_at: string | null;
  curated: boolean | null;
  is_featured?: boolean | null;
  stock_quantity: number | null;
  seller_id: string | null;
  sellers: unknown;
};

type ProductEntry = {
  row: ProductRow;
  brand: string | null;
  category: string | null;
  ritual: string | null;
  texture: string | null;
  sensation: string[];
  result: string[];
  moments: string[];
  skinTypes: string[];
  finishes: string[];
  tags: string[];
  inStock: boolean;
  createdAt: Date | null;
  price: number;
  searchText: string;
};

const EMPTY_UUID = "00000000-0000-0000-0000-000000000000";
const ACTIVE_STATUS = ["published", "active"];

const MOMENT_RULES = [
  {
    label: "Antes do trabalho",
    keywords: ["dia", "diurno", "office", "trabalho", "manh", "rotina matinal"]
  },
  {
    label: "Pos-banho",
    keywords: ["banho", "pos banho", "body", "corpo", "hidratacao corporal"]
  },
  {
    label: "Plantao",
    keywords: ["plantao", "longa duracao", "resistente", "fixacao", "duradouro"]
  },
  {
    label: "Evento",
    keywords: ["evento", "festa", "night out", "noite glam", "performance"]
  },
  {
    label: "Noite de autocuidado",
    keywords: ["noturno", "noite", "autocuidado", "ritual noturno", "relax"]
  }
] as const;

const SKIN_TYPE_RULES = [
  { label: "Pele oleosa", keywords: ["oleosa", "oleosidade", "controle de oleosidade"] },
  { label: "Pele seca", keywords: ["seca", "ressecada", "hidratacao intensa"] },
  { label: "Pele mista", keywords: ["mista"] },
  { label: "Pele sensivel", keywords: ["sensivel", "calmante", "suave", "sem fragrancia"] },
  { label: "Cabelo liso", keywords: ["liso"] },
  { label: "Cabelo ondulado", keywords: ["ondulado"] },
  { label: "Cabelo cacheado", keywords: ["cacheado", "cachos"] },
  { label: "Cabelo crespo", keywords: ["crespo"] }
] as const;

const FINISH_RULES = [
  { label: "Glow elegante", keywords: ["glow", "ilumina", "luminoso", "radiante"] },
  { label: "Matte aveludado", keywords: ["matte", "aveludado", "blur"] },
  { label: "Natural", keywords: ["natural", "segunda pele"] },
  { label: "Alta fixacao", keywords: ["fixacao", "longa duracao", "duradouro"] },
  { label: "Calmante", keywords: ["calmante", "calma", "sensivel"] },
  { label: "Refrescante", keywords: ["refrescante", "fresh", "gelado"] }
] as const;

const TAG_RULES = [
  { label: "Vegano", keywords: ["vegano", "vegan"] },
  { label: "Cruelty-free", keywords: ["cruelty free", "nao testado em animais"] },
  { label: "Sem fragrancia", keywords: ["sem fragrancia", "fragrance free"] },
  { label: "Sem parabenos", keywords: ["sem parabenos", "paraben"] },
  { label: "Sem alcool", keywords: ["sem alcool", "alcohol free"] },
  { label: "Presenteavel", keywords: ["presente", "gift", "presenteavel"] },
  { label: "Kit", keywords: ["kit", "duo", "trio"] }
] as const;

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

const normalizeToken = (value: string) =>
  normalizeQuery(value)
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const toTextArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
};

const getStoreName = (sellers: unknown): string | null => {
  if (!sellers) return null;
  if (Array.isArray(sellers)) {
    const first = sellers[0] as { store_name?: string | null } | undefined;
    return first?.store_name ?? null;
  }
  return (sellers as { store_name?: string | null }).store_name ?? null;
};

const getStringArrayFromJson = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item : ""))
    .filter(Boolean);
};

const parseBoolean = (value: string | null) => value === "1" || value === "true";

const mapToSortedFacet = (map: Map<string, number>): FacetCount[] =>
  Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => (b.count !== a.count ? b.count - a.count : a.name.localeCompare(b.name)));

const buildOrFilter = (terms: string[]) => {
  const clauses: string[] = [];
  terms.forEach((term) => {
    const safe = term.replace(/,/g, " ");
    clauses.push(`name.ilike.%${safe}%`);
    clauses.push(`title.ilike.%${safe}%`);
    clauses.push(`description.ilike.%${safe}%`);
    clauses.push(`category.ilike.%${safe}%`);
    clauses.push(`ritual.ilike.%${safe}%`);
    clauses.push(`texture.ilike.%${safe}%`);
    clauses.push(`sellers.store_name.ilike.%${safe}%`);
  });
  return clauses.join(",");
};

const deriveByRules = (
  haystack: string,
  rules: ReadonlyArray<{ label: string; keywords: readonly string[] }>
) => {
  const normalizedHaystack = normalizeToken(haystack);
  return rules
    .filter((rule) =>
      rule.keywords.some((keyword) => normalizedHaystack.includes(normalizeToken(keyword)))
    )
    .map((rule) => rule.label);
};

const buildProductEntry = (row: ProductRow): ProductEntry => {
  const brand = row.brand ?? getStoreName(row.sellers);
  const category = row.category ?? null;
  const ritual = row.ritual ?? null;
  const texture = row.texture ?? null;
  const sensation = toTextArray(row.sensation);
  const result = toTextArray(row.result);
  const badges = toTextArray(row.badges);
  const highlights = getStringArrayFromJson(row.highlights);
  const name = row.title ?? row.name ?? "";
  const inStock = Number(row.stock_quantity ?? 0) > 0;
  const createdAt = row.created_at ? new Date(row.created_at) : null;
  const price = Number(row.price_cents ?? 0) / 100;

  const searchableParts = [
    name,
    row.description ?? "",
    brand ?? "",
    category ?? "",
    ritual ?? "",
    texture ?? "",
    ...sensation,
    ...result,
    ...badges,
    ...highlights
  ];
  const searchText = normalizeToken(searchableParts.join(" "));

  const moments = deriveByRules(searchText, MOMENT_RULES);
  const skinTypes = deriveByRules(searchText, SKIN_TYPE_RULES);
  const finishes = deriveByRules(searchText, FINISH_RULES);
  const tags = deriveByRules(searchText, TAG_RULES);

  if (row.curated) {
    tags.push("Curadoria BelaPop");
  }

  return {
    row,
    brand,
    category,
    ritual,
    texture,
    sensation,
    result,
    moments: Array.from(new Set(moments)),
    skinTypes: Array.from(new Set(skinTypes)),
    finishes: Array.from(new Set(finishes)),
    tags: Array.from(new Set(tags)),
    inStock,
    createdAt,
    price,
    searchText
  };
};

const matchesAny = (values: string[], selected: string[]) => {
  if (!selected.length) return true;
  const normalized = new Set(values.map((item) => normalizeToken(item)));
  return selected.some((item) => normalized.has(normalizeToken(item)));
};

const toSlugToken = (value: string) => normalizeToken(value).replace(/\s+/g, "_");

const parseAvailability = (params: URLSearchParams) => {
  const raw = params.get("availability");
  if (raw === "all" || raw === "in_stock" || raw === "ready_delivery" || raw === "out_of_stock") {
    return raw;
  }
  if (parseBoolean(params.get("in_stock"))) {
    return "in_stock";
  }
  return "in_stock";
};

const parseSort = (params: URLSearchParams) => {
  const raw = params.get("sort");
  if (
    raw === "featured" ||
    raw === "newest" ||
    raw === "best_sellers" ||
    raw === "price_asc" ||
    raw === "price_desc" ||
    raw === "best_rated"
  ) {
    return raw;
  }
  return "featured";
};

const fetchProductRows = async () => {
  const supabase = getSupabaseAdminClient();
  const primarySelect =
    "id,name,title,brand,description,category,ritual,texture,sensation,result,badges,highlights,price_cents,images,created_at,curated,is_featured,stock_quantity,seller_id,sellers!products_seller_id_fkey(store_name)";
  const fallbackSelect =
    "id,name,title,description,category,ritual,texture,sensation,result,highlights,price_cents,images,created_at,curated,is_featured,stock_quantity,seller_id,sellers!products_seller_id_fkey(store_name)";

  const primary = await supabase
    .from("products")
    .select(primarySelect)
    .in("status", ACTIVE_STATUS);

  if (!primary.error) {
    return (primary.data ?? []) as ProductRow[];
  }

  const fallback = await supabase
    .from("products")
    .select(fallbackSelect)
    .in("status", ACTIVE_STATUS);

  if (fallback.error) {
    throw fallback.error;
  }

  return (fallback.data ?? []) as ProductRow[];
};

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = normalizeQuery(url.searchParams.get("q") ?? "");
    const brands = parseListParam(url.searchParams.get("brand"));
    const categories = parseListParam(url.searchParams.get("category"));
    const rituals = parseListParam(url.searchParams.get("ritual"));
    const textures = parseListParam(url.searchParams.get("texture"));
    const sensations = parseListParam(url.searchParams.get("sensation"));
    const results = parseListParam(url.searchParams.get("result"));
    const moments = parseListParam(url.searchParams.get("moment"));
    const skinTypes = parseListParam(url.searchParams.get("skin_type"));
    const finishes = parseListParam(url.searchParams.get("finish"));
    const tags = parseListParam(url.searchParams.get("tags"));
    const curated = parseBoolean(url.searchParams.get("curated"));
    const isNew = parseBoolean(url.searchParams.get("new"));
    const min = Number(url.searchParams.get("min") ?? "");
    const max = Number(url.searchParams.get("max") ?? "");
    const availability = parseAvailability(url.searchParams);
    const sort = parseSort(url.searchParams);
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const pageSize = Math.min(48, Math.max(6, Number(url.searchParams.get("pageSize") ?? 24)));

    const synonyms = q ? await getSynonyms(q) : [];
    const searchTerms = q ? expandSearchTerms(q, synonyms).map(normalizeToken).filter(Boolean) : [];

    let entries = (await fetchProductRows()).map(buildProductEntry);

    if (searchTerms.length) {
      entries = entries.filter((entry) =>
        searchTerms.some((term) => entry.searchText.includes(term))
      );
    }

    if (brands.length) {
      const brandSet = new Set(brands.map((item) => normalizeToken(item)));
      entries = entries.filter((entry) => brandSet.has(normalizeToken(entry.brand ?? "")));
    }

    if (categories.length) {
      const categorySet = new Set(categories.map((item) => normalizeToken(item)));
      entries = entries.filter((entry) =>
        categorySet.has(normalizeToken(entry.category ?? ""))
      );
    }

    if (rituals.length) {
      const ritualSet = new Set(rituals.map((item) => normalizeToken(item)));
      entries = entries.filter((entry) => ritualSet.has(normalizeToken(entry.ritual ?? "")));
    }

    if (textures.length) {
      const textureSet = new Set(textures.map((item) => normalizeToken(item)));
      entries = entries.filter((entry) => textureSet.has(normalizeToken(entry.texture ?? "")));
    }

    if (sensations.length) {
      entries = entries.filter((entry) => matchesAny(entry.sensation, sensations));
    }

    if (results.length) {
      entries = entries.filter((entry) => matchesAny(entry.result, results));
    }

    if (moments.length) {
      entries = entries.filter((entry) => matchesAny(entry.moments, moments));
    }

    if (skinTypes.length) {
      entries = entries.filter((entry) => matchesAny(entry.skinTypes, skinTypes));
    }

    if (finishes.length) {
      entries = entries.filter((entry) => matchesAny(entry.finishes, finishes));
    }

    if (tags.length) {
      entries = entries.filter((entry) => matchesAny(entry.tags, tags));
    }

    if (!Number.isNaN(min)) {
      entries = entries.filter((entry) => entry.price >= min);
    }

    if (!Number.isNaN(max)) {
      entries = entries.filter((entry) => entry.price <= max);
    }

    if (curated) {
      entries = entries.filter((entry) => Boolean(entry.row.curated));
    }

    if (isNew) {
      const threshold = Date.now() - 30 * 24 * 60 * 60 * 1000;
      entries = entries.filter((entry) => {
        const createdAt = entry.createdAt?.getTime();
        return typeof createdAt === "number" && createdAt >= threshold;
      });
    }

    if (availability === "in_stock" || availability === "ready_delivery") {
      entries = entries.filter((entry) => entry.inStock);
    } else if (availability === "out_of_stock") {
      entries = entries.filter((entry) => !entry.inStock);
    }

    const brandCounts = new Map<string, number>();
    const categoryCounts = new Map<string, number>();
    const ritualCounts = new Map<string, number>();
    const textureCounts = new Map<string, number>();
    const sensationCounts = new Map<string, number>();
    const resultCounts = new Map<string, number>();
    const momentCounts = new Map<string, number>();
    const skinTypeCounts = new Map<string, number>();
    const finishCounts = new Map<string, number>();
    const tagCounts = new Map<string, number>();
    let minPrice = Number.POSITIVE_INFINITY;
    let maxPrice = 0;
    let inStockCount = 0;
    let outOfStockCount = 0;

    entries.forEach((entry) => {
      if (entry.brand) {
        brandCounts.set(entry.brand, (brandCounts.get(entry.brand) ?? 0) + 1);
      }
      if (entry.category) {
        categoryCounts.set(entry.category, (categoryCounts.get(entry.category) ?? 0) + 1);
      }
      if (entry.ritual) {
        ritualCounts.set(entry.ritual, (ritualCounts.get(entry.ritual) ?? 0) + 1);
      }
      if (entry.texture) {
        textureCounts.set(entry.texture, (textureCounts.get(entry.texture) ?? 0) + 1);
      }
      entry.sensation.forEach((value) => {
        sensationCounts.set(value, (sensationCounts.get(value) ?? 0) + 1);
      });
      entry.result.forEach((value) => {
        resultCounts.set(value, (resultCounts.get(value) ?? 0) + 1);
      });
      entry.moments.forEach((value) => {
        momentCounts.set(value, (momentCounts.get(value) ?? 0) + 1);
      });
      entry.skinTypes.forEach((value) => {
        skinTypeCounts.set(value, (skinTypeCounts.get(value) ?? 0) + 1);
      });
      entry.finishes.forEach((value) => {
        finishCounts.set(value, (finishCounts.get(value) ?? 0) + 1);
      });
      entry.tags.forEach((value) => {
        tagCounts.set(value, (tagCounts.get(value) ?? 0) + 1);
      });

      minPrice = Math.min(minPrice, entry.price);
      maxPrice = Math.max(maxPrice, entry.price);
      if (entry.inStock) {
        inStockCount += 1;
      } else {
        outOfStockCount += 1;
      }
    });

    const ids = entries.map((entry) => entry.row.id);
    const supabase = getSupabaseAdminClient();

    const ratingMap = new Map<string, { total: number; count: number }>();
    if (ids.length) {
      let reviewRows: Array<{ product_id: string; rating: number; is_hidden?: boolean }> = [];
      try {
        const { data, error } = await supabase
          .from("product_reviews")
          .select("product_id,rating,is_hidden")
          .in("product_id", ids)
          .eq("is_hidden", false);

        if (error) throw error;
        reviewRows = (data ?? []) as Array<{ product_id: string; rating: number; is_hidden?: boolean }>;
      } catch {
        const { data } = await supabase
          .from("product_reviews")
          .select("product_id,rating")
          .in("product_id", ids);

        reviewRows = (data ?? []) as Array<{ product_id: string; rating: number; is_hidden?: boolean }>;
      }

      reviewRows.forEach((row) => {
        const entry = ratingMap.get(row.product_id) ?? { total: 0, count: 0 };
        entry.total += row.rating ?? 0;
        entry.count += 1;
        ratingMap.set(row.product_id, entry);
      });
    }

    const salesMap = new Map<string, number>();
    if (ids.length) {
      const { data: orderItemRows } = await supabase
        .from("order_items")
        .select("product_id,quantity")
        .in("product_id", ids);

      (orderItemRows ?? []).forEach((row) => {
        const qty = Number(row.quantity ?? 0);
        salesMap.set(row.product_id, (salesMap.get(row.product_id) ?? 0) + Math.max(1, qty));
      });
    }

    if (sort === "price_asc") {
      entries = [...entries].sort((a, b) => a.price - b.price);
    } else if (sort === "price_desc") {
      entries = [...entries].sort((a, b) => b.price - a.price);
    } else if (sort === "newest") {
      entries = [...entries].sort((a, b) => {
        const timeA = a.createdAt?.getTime() ?? 0;
        const timeB = b.createdAt?.getTime() ?? 0;
        return timeB - timeA;
      });
    } else if (sort === "best_rated") {
      entries = [...entries].sort((a, b) => {
        const ratingA = ratingMap.get(a.row.id);
        const ratingB = ratingMap.get(b.row.id);
        const avgA = ratingA ? ratingA.total / Math.max(ratingA.count, 1) : 0;
        const avgB = ratingB ? ratingB.total / Math.max(ratingB.count, 1) : 0;
        if (avgB !== avgA) return avgB - avgA;
        return (ratingB?.count ?? 0) - (ratingA?.count ?? 0);
      });
    } else if (sort === "best_sellers") {
      entries = [...entries].sort((a, b) => {
        const salesA = salesMap.get(a.row.id) ?? 0;
        const salesB = salesMap.get(b.row.id) ?? 0;
        if (salesB !== salesA) return salesB - salesA;
        const timeA = a.createdAt?.getTime() ?? 0;
        const timeB = b.createdAt?.getTime() ?? 0;
        return timeB - timeA;
      });
    } else {
      const priorityIds = await fetchEditorialPriorityIds("featured");
      const priorityMap = new Map(priorityIds.map((productId, index) => [productId, index]));
      entries = [...entries].sort((a, b) => {
        const editorialPriorityA = priorityMap.get(a.row.id) ?? Number.MAX_SAFE_INTEGER;
        const editorialPriorityB = priorityMap.get(b.row.id) ?? Number.MAX_SAFE_INTEGER;
        if (editorialPriorityA !== editorialPriorityB) {
          return editorialPriorityA - editorialPriorityB;
        }

        const featuredA = a.row.is_featured ? 1 : 0;
        const featuredB = b.row.is_featured ? 1 : 0;
        if (featuredB !== featuredA) return featuredB - featuredA;

        const curatedA = a.row.curated ? 1 : 0;
        const curatedB = b.row.curated ? 1 : 0;
        if (curatedB !== curatedA) return curatedB - curatedA;

        const stockA = a.inStock ? 1 : 0;
        const stockB = b.inStock ? 1 : 0;
        if (stockB !== stockA) return stockB - stockA;

        const salesA = salesMap.get(a.row.id) ?? 0;
        const salesB = salesMap.get(b.row.id) ?? 0;
        if (salesB !== salesA) return salesB - salesA;

        const ratingA = ratingMap.get(a.row.id);
        const ratingB = ratingMap.get(b.row.id);
        const avgA = ratingA ? ratingA.total / Math.max(ratingA.count, 1) : 0;
        const avgB = ratingB ? ratingB.total / Math.max(ratingB.count, 1) : 0;
        if (avgB !== avgA) return avgB - avgA;

        if (searchTerms.length) {
          const scoreA = searchTerms.reduce(
            (acc, term) => acc + (a.searchText.includes(term) ? 1 : 0),
            0
          );
          const scoreB = searchTerms.reduce(
            (acc, term) => acc + (b.searchText.includes(term) ? 1 : 0),
            0
          );
          if (scoreB !== scoreA) return scoreB - scoreA;
        }

        const timeA = a.createdAt?.getTime() ?? 0;
        const timeB = b.createdAt?.getTime() ?? 0;
        return timeB - timeA;
      });
    }

    const total = entries.length;
    const start = (page - 1) * pageSize;
    const paged = entries.slice(start, start + pageSize);

    const items: ProductCardDTO[] = paged.map((entry) => {
      const rating = ratingMap.get(entry.row.id);
      const imageList = Array.isArray(entry.row.images) ? entry.row.images : [];
      const imageUrl =
        imageList.length && typeof imageList[0] === "string"
          ? String(imageList[0])
          : null;
      const now = Date.now();
      const createdAt = entry.createdAt?.getTime() ?? 0;
      const isNewFlag = createdAt > 0 && now - createdAt < 30 * 24 * 60 * 60 * 1000;
      const name = entry.row.title ?? entry.row.name ?? "Produto BelaPop";

      return {
        id: entry.row.id,
        name,
        brand: entry.brand,
        category: entry.category,
        price: entry.price,
        imageUrl,
        ratingAvg: rating ? rating.total / Math.max(rating.count, 1) : 0,
        ratingCount: rating?.count ?? 0,
        curated: Boolean(entry.row.curated),
        isNew: isNewFlag,
        inStock: entry.inStock,
        sellerId: entry.row.seller_id ?? null
      };
    });

    const facets: Facets = {
      brands: mapToSortedFacet(brandCounts),
      categories: mapToSortedFacet(categoryCounts),
      rituals: mapToSortedFacet(ritualCounts),
      textures: mapToSortedFacet(textureCounts),
      sensations: mapToSortedFacet(sensationCounts),
      results: mapToSortedFacet(resultCounts),
      moments: mapToSortedFacet(momentCounts),
      skinTypes: mapToSortedFacet(skinTypeCounts),
      finishes: mapToSortedFacet(finishCounts),
      tags: mapToSortedFacet(tagCounts),
      availability: {
        inStock: inStockCount,
        readyDelivery: inStockCount,
        outOfStock: outOfStockCount
      },
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
      facets,
      suggestions: {
        moments: facets.moments.map((item) => ({
          value: toSlugToken(item.name),
          label: item.name,
          count: item.count
        })),
        finishes: facets.finishes.map((item) => ({
          value: toSlugToken(item.name),
          label: item.name,
          count: item.count
        })),
        tags: facets.tags.map((item) => ({
          value: toSlugToken(item.name),
          label: item.name,
          count: item.count
        }))
      }
    });
  } catch (error) {
    console.error("[products/search] failed:", error);
    return NextResponse.json(
      { error: "Algo saiu do roteiro. Tentar novamente." },
      { status: 500 }
    );
  }
}
