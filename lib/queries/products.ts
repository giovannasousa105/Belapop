import "server-only";

import { cache } from "react";

import { products as seedProducts } from "@/data/products";
import { sortByEditorialCuration } from "@/lib/product/editorialCuration";
import { fetchEditorialPriorityIds } from "@/lib/product/editorialOrder";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { PublicProduct } from "@/lib/types";

export type EditorialProduct = PublicProduct & {
  brand: string;
  currency: string;
  tags: string[];
  description: string;
  ritual: string;
  texture: string;
  sensation: string[];
  result: string[];
  price: number;
  category: string;
  badge: string;
  editorialReason: string;
  howToUse: string[];
  ingredients?: string | null;
  inci?: string | null;
  sellerId: string;
  sellerName: string;
  sellerStatus: string | null;
  saleOrigin: "própria" | "marketplace";
  coverImage: string;
  gallery: { url: string; alt: string }[];
};

const FALLBACK_BADGE = "Selecao BelaPop";
const CATALOG_SEED_FALLBACK_ENABLED = process.env.NODE_ENV !== "production";
const PUBLIC_PRODUCT_STATUSES = ["published"] as const;
const SELLABLE_SELLER_STATUSES = new Set(["active", "approved"]);

const isExpectedNextDynamicUsageError = (error: unknown) =>
  typeof error === "object" &&
  error !== null &&
  "digest" in error &&
  String((error as { digest?: unknown }).digest).includes("DYNAMIC_SERVER_USAGE");

const LOGO_IMAGE_SET = new Set(["/logo.svg", "/logo-dark.svg"]);

type ProductCategoryKind = "skincare" | "maquiagem" | "cabelos" | "perfumes" | "outro";

const resolveCategoryKind = (value: string | null | undefined): ProductCategoryKind => {
  const normalized = (value ?? "").toLowerCase();
  if (normalized.includes("maqui")) return "maquiagem";
  if (normalized.includes("cabel")) return "cabelos";
  if (normalized.includes("perf")) return "perfumes";
  if (normalized.includes("skin")) return "skincare";
  return "outro";
};

const normalizeCopy = (value: string) =>
  value
    .replace(/\b\d{1,3}%\b/g, "")
    .replace(/beauty intelligence/gi, "seleção por critérios de uso e formulacao")
    .replace(/marketplace premium/gi, "plataforma com parceiros verificados")
    .replace(/curadoria inteligente/gi, "sugestoes organizadas com mais clareza")
    .replace(/elevar a descoberta/gi, "facilitar a escolha")
    .replace(/obra-prima/gi, "produto")
    .replace(/ritual premium/gi, "rotina de uso")
    .replace(/experiência premium/gi, "experiência de cuidado")
    .replace(/regeneracao cutanea/gi, "cuidado da pele")
    .replace(/biometric[ao]s?/gi, "análise de pele")
    .replace(/ia\b/gi, "curadoria")
    .replace(/\s+/g, " ")
    .trim();

const sanitizeList = (values: string[]) =>
  values.map((item) => normalizeCopy(item)).filter(Boolean);

const defaultRitualByCategory = (categoryKind: ProductCategoryKind) => {
  if (categoryKind === "maquiagem") return "Aplicacao diaria";
  if (categoryKind === "cabelos") return "Finalizacao capilar";
  if (categoryKind === "perfumes") return "Aplicacao em pontos de pulso";
  return "Uso diario";
};

const defaultTextureByCategory = (categoryKind: ProductCategoryKind) => {
  if (categoryKind === "maquiagem") return "Cobertura construivel";
  if (categoryKind === "cabelos") return "Toque leve";
  if (categoryKind === "perfumes") return "Difusao equilibrada";
  return "Textura leve";
};

const defaultSensationByCategory = (categoryKind: ProductCategoryKind) => {
  if (categoryKind === "maquiagem") return ["acabamento uniforme", "aplicacao precisa"];
  if (categoryKind === "cabelos") return ["toque leve", "controle diario"];
  if (categoryKind === "perfumes") return ["presenca equilibrada", "fixacao moderada"];
  return ["conforto diario", "aplicacao simples"];
};

const defaultResultByCategory = (categoryKind: ProductCategoryKind) => {
  if (categoryKind === "maquiagem") return ["acabamento uniforme", "duração estavel"];
  if (categoryKind === "cabelos") return ["controle de frizz", "brilho suave"];
  if (categoryKind === "perfumes") return ["presenca olfativa", "aplicacao controlada"];
  return ["hidratação", "uso consistente"];
};

const defaultHowToUseByCategory = (categoryKind: ProductCategoryKind) => {
  if (categoryKind === "maquiagem") {
    return [
      "Aplique sobre pele preparada e seca.",
      "Construa o acabamento em camadas finas.",
      "Ajuste a intensidade conforme o efeito desejado."
    ];
  }

  if (categoryKind === "cabelos") {
    return [
      "Aplique nos fios limpos e umidos ou secos.",
      "Distribua do comprimento para as pontas.",
      "Finalize com quantidade moderada."
    ];
  }

  if (categoryKind === "perfumes") {
    return [
      "Aplique em pele limpa e seca.",
      "Priorize pontos de pulso para melhor difusao.",
      "Reaplique quando necessario."
    ];
  }

  return [
    "Aplique sobre pele limpa.",
    "Distribua em camada uniforme.",
    "Repita conforme orientacao de uso do produto."
  ];
};

const defaultEditorialReasonByCategory = (categoryKind: ProductCategoryKind) => {
  if (categoryKind === "maquiagem") {
    return "Produto de maquiagem selecionado por formulacao clara e acabamento consistente.";
  }

  if (categoryKind === "cabelos") {
    return "Produto capilar selecionado por usabilidade diaria e resultado previsivel.";
  }

  if (categoryKind === "perfumes") {
    return "Fragrancia selecionada por perfil olfativo definido e aplicacao simples.";
  }

  return "Produto de skincare selecionado por formulacao objetiva e uso continuo.";
};

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const parseStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
};

const normalizeImageUrl = (value: string | null | undefined) => {
  if (typeof value !== "string") return null;
  const clean = value.trim();
  return clean.length > 0 ? clean : null;
};

const isEditorialPlaceholderImage = (value: string | null | undefined) => {
  const normalized = normalizeImageUrl(value)?.toLowerCase();
  if (!normalized) return true;
  if (LOGO_IMAGE_SET.has(normalized)) return true;
  if (normalized.includes("/editorial/product-hero-")) return true;
  if (normalized.includes("/editorial/") && normalized.endsWith(".svg")) return true;
  return false;
};

const isRenderableProductGalleryImage = (value: string | null | undefined) => {
  const normalized = normalizeImageUrl(value);
  if (!normalized) return false;
  return !isEditorialPlaceholderImage(normalized);
};

const dedupeImageUrls = (values: (string | null | undefined)[]) => {
  const unique = new Set<string>();
  values.forEach((value) => {
    const clean = normalizeImageUrl(value);
    if (!clean) return;
    unique.add(clean);
  });
  return Array.from(unique);
};

const getNumber = (value: unknown, fallback = 0) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

const getStockQuantity = (row: Record<string, unknown>) =>
  Math.max(0, Math.floor(getNumber(row.stock_quantity)));

const resolveSellerMetadata = (row: Record<string, unknown>) => {
  const hasExternalSeller =
    (typeof row.seller_id === "string" && row.seller_id) ||
    (typeof row.sellerId === "string" && row.sellerId);
  const sellerRecord =
    row.sellers && typeof row.sellers === "object"
      ? (row.sellers as Record<string, unknown>)
      : null;
  const sellerName =
    (sellerRecord && typeof sellerRecord.store_name === "string" && sellerRecord.store_name) ||
    (sellerRecord && typeof sellerRecord.name === "string" && sellerRecord.name) ||
    (typeof row.seller_name === "string" && row.seller_name) ||
    "BelaPop";
  // Products with no seller_id are BelaPop's own inventory — treat as active.
  const sellerStatus =
    (sellerRecord && typeof sellerRecord.status === "string" && sellerRecord.status) ||
    (hasExternalSeller ? null : "active");
  const sellerId =
    (typeof row.seller_id === "string" && row.seller_id) ||
    (typeof row.sellerId === "string" && row.sellerId) ||
    "unknown";

  return {
    sellerId,
    sellerName,
    sellerStatus,
    saleOrigin:
      sellerName.localeCompare("BelaPop", "pt-BR", { sensitivity: "accent" }) === 0
        ? ("própria" as const)
        : ("marketplace" as const)
  };
};

const isSellableProductRow = (row: Record<string, unknown>) => {
  const seller = resolveSellerMetadata(row);
  return (
    SELLABLE_SELLER_STATUSES.has(String(seller.sellerStatus ?? "")) &&
    getNumber(row.price_cents) > 0 &&
    getStockQuantity(row) > 0
  );
};

const buildFallbackProducts = (): EditorialProduct[] =>
  seedProducts
    .filter((product) => product.status === "published")
    .map((product) => {
      const categoryKind = resolveCategoryKind(product.category);
      const sanitizedDescription = normalizeCopy(product.description || "");
      const highlightList = sanitizeList(product.highlights ?? []);

      return {
        id: product.id,
        slug: slugify(product.name) || product.id,
        title: product.name,
        brand: "BelaPop",
        price_cents: Math.round(product.price * 100),
        price: product.price,
        currency: "BRL",
        hero_image_url: "",
        stock_quantity: Math.max(1, product.stockQuantity ?? 1),
        stockQuantity: Math.max(1, product.stockQuantity ?? 1),
        inStock: true,
        category: product.category,
        badge: FALLBACK_BADGE,
        badges: [FALLBACK_BADGE],
        tags: ["bp_curated"],
        description:
          sanitizedDescription || defaultEditorialReasonByCategory(categoryKind),
        ritual: defaultRitualByCategory(categoryKind),
        texture: highlightList[0] || defaultTextureByCategory(categoryKind),
        sensation: highlightList.slice(0, 2).length
          ? highlightList.slice(0, 2)
          : defaultSensationByCategory(categoryKind),
        result: highlightList.slice(1, 3).length
          ? highlightList.slice(1, 3)
          : defaultResultByCategory(categoryKind),
        editorialReason:
          sanitizedDescription || defaultEditorialReasonByCategory(categoryKind),
        howToUse: defaultHowToUseByCategory(categoryKind),
        sellerId: product.sellerId,
        sellerName: "BelaPop",
        sellerStatus: "active",
        saleOrigin: "própria",
        coverImage: "",
        gallery: []
      };
    });

const mergeWithFallbackProducts = (
  products: EditorialProduct[],
  limit: number,
  priorityIds: string[]
): EditorialProduct[] => {
  if (products.length >= limit) {
    return sortByEditorialCuration(products, { priorityIds }).slice(0, limit);
  }

  const seen = new Set<string>();
  products.forEach((product) => {
    seen.add(product.id);
    seen.add(product.slug);
  });

  const fallbackTopUp = buildFallbackProducts().filter((product) => {
    return !seen.has(product.id) && !seen.has(product.slug);
  });

  return sortByEditorialCuration([...products, ...fallbackTopUp], { priorityIds }).slice(0, limit);
};

const mapSupabaseProduct = (row: Record<string, unknown>): EditorialProduct => {
  const rawTitle =
    (typeof row.title === "string" && row.title) ||
    (typeof row.name === "string" && row.name) ||
    "Seleção BelaPop";
  const slug =
    (typeof row.slug === "string" && row.slug) ||
    slugify(rawTitle) ||
    String(row.id ?? "produto-belapop");
  const galleryFromRow = parseStringArray(row.gallery);
  const images = parseStringArray(row.images);
  const heroImageFromRow =
    typeof row.hero_image_url === "string" ? normalizeImageUrl(row.hero_image_url) : null;
  const mergedGalleryCandidates = dedupeImageUrls([...galleryFromRow, ...images]);
  const usableGallery = mergedGalleryCandidates.filter((url) => isRenderableProductGalleryImage(url));
  const selectedGallery = usableGallery.length > 0 ? usableGallery : mergedGalleryCandidates;
  const heroImage =
    (heroImageFromRow && isRenderableProductGalleryImage(heroImageFromRow) && heroImageFromRow) ||
    selectedGallery[0] ||
    "";
  const coverImage = selectedGallery[0] || heroImage;
  const galleryForPdp = selectedGallery;

  const howToUseJson = Array.isArray(row.how_to_use)
    ? parseStringArray(row.how_to_use)
    : [];
  const category =
    (typeof row.category === "string" && row.category) || "Skincare";
  const categoryKind = resolveCategoryKind(category);
  const description =
    (typeof row.description === "string" && normalizeCopy(row.description)) ||
    defaultEditorialReasonByCategory(categoryKind);
  const sensation = sanitizeList(parseStringArray(row.sensation));
  const result = sanitizeList(parseStringArray(row.result));
  const howToUse = sanitizeList(howToUseJson);
  const badges = sanitizeList(parseStringArray(row.badges));
  const seller = resolveSellerMetadata(row);
  const stockQuantity = getStockQuantity(row);

  return {
    id: String(row.id ?? slug),
    slug,
    title: rawTitle,
    brand: (typeof row.brand === "string" && row.brand) || "BelaPop",
    price_cents:
      getNumber(row.price_cents) || Math.round(getNumber(row.price) * 100) || 0,
    price:
      getNumber(row.price) ||
      (getNumber(row.price_cents) > 0 ? getNumber(row.price_cents) / 100 : 0),
    currency: (typeof row.currency === "string" && row.currency) || "BRL",
    hero_image_url: heroImage,
    stock_quantity: stockQuantity,
    stockQuantity,
    inStock: stockQuantity > 0,
    category,
    badge: badges[0] || FALLBACK_BADGE,
    badges,
    tags: parseStringArray(row.tags),
    description,
    ritual:
      (typeof row.ritual === "string" && row.ritual) ||
      defaultRitualByCategory(categoryKind),
    texture:
      (typeof row.texture === "string" && normalizeCopy(row.texture)) ||
      defaultTextureByCategory(categoryKind),
    sensation:
      sensation.length > 0 ? sensation : defaultSensationByCategory(categoryKind),
    result:
      result.length > 0 ? result : defaultResultByCategory(categoryKind),
    editorialReason:
      (typeof row.editorial_reason === "string" && normalizeCopy(row.editorial_reason)) ||
      description,
    howToUse:
      howToUse.length > 0
        ? howToUse
        : defaultHowToUseByCategory(categoryKind),
    ingredients:
      typeof row.ingredients === "string" && row.ingredients.trim()
        ? row.ingredients.trim()
        : null,
    inci:
      typeof row.inci === "string" && row.inci.trim()
        ? row.inci.trim()
        : null,
    sellerId: seller.sellerId,
    sellerName: seller.sellerName,
    sellerStatus: seller.sellerStatus,
    saleOrigin: seller.saleOrigin,
    coverImage,
    gallery: galleryForPdp.map((url, index) => ({
      url,
      alt: `${rawTitle} - imagem ${index + 1}`
    }))
  };
};

const fetchSupabaseProducts = async (limit: number): Promise<EditorialProduct[]> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, sellers!products_seller_id_fkey(id, store_name, status)")
    .in("status", [...PUBLIC_PRODUCT_STATUSES])
    .gt("price_cents", 0)
    .gt("stock_quantity", 0)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data?.length) {
    throw new Error(error?.message ?? "No products found");
  }

  return (data as Record<string, unknown>[])
    .filter(isSellableProductRow)
    .map(mapSupabaseProduct);
};

const fetchSupabaseProductsByIds = async (ids: string[]): Promise<EditorialProduct[]> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, sellers!products_seller_id_fkey(id, store_name, status)")
    .in("id", ids)
    .in("status", [...PUBLIC_PRODUCT_STATUSES])
    .gt("price_cents", 0)
    .gt("stock_quantity", 0);

  if (error || !data?.length) {
    throw new Error(error?.message ?? "No products found");
  }

  return (data as Record<string, unknown>[])
    .filter(isSellableProductRow)
    .map(mapSupabaseProduct);
};

const fetchSupabaseProductBySlug = async (slug: string): Promise<EditorialProduct | null> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, sellers!products_seller_id_fkey(id, store_name, status)")
    .eq("slug", slug)
    .in("status", [...PUBLIC_PRODUCT_STATUSES])
    .gt("price_cents", 0)
    .gt("stock_quantity", 0)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data || !isSellableProductRow(data as Record<string, unknown>)) {
    return null;
  }

  return mapSupabaseProduct(data as Record<string, unknown>);
};

export const getPublicProducts = cache(async (limit = 8): Promise<EditorialProduct[]> => {
  try {
    const [priorityIds, liveProducts] = await Promise.all([
      fetchEditorialPriorityIds("featured"),
      fetchSupabaseProducts(limit)
    ]);
    if (!CATALOG_SEED_FALLBACK_ENABLED) {
      return sortByEditorialCuration(liveProducts, { priorityIds }).slice(0, limit);
    }
    return mergeWithFallbackProducts(liveProducts, limit, priorityIds);
  } catch (error) {
    if (!isExpectedNextDynamicUsageError(error)) {
      console.warn("[catalog] public product fetch failed", error);
    }
    return CATALOG_SEED_FALLBACK_ENABLED ? buildFallbackProducts().slice(0, limit) : [];
  }
});

export async function getPublicProductsByIds(ids: string[]): Promise<EditorialProduct[]> {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  if (!uniqueIds.length) return [];

  try {
    const liveProducts = await fetchSupabaseProductsByIds(uniqueIds);
    const productMap = new Map(liveProducts.map((product) => [product.id, product]));
    return uniqueIds
      .map((productId) => productMap.get(productId) ?? null)
      .filter((product): product is EditorialProduct => Boolean(product));
  } catch (error) {
    if (!isExpectedNextDynamicUsageError(error)) {
      console.warn("[catalog] public products by ids fetch failed", error);
    }
    if (!CATALOG_SEED_FALLBACK_ENABLED) return [];
    const fallbackMap = new Map(buildFallbackProducts().map((product) => [product.id, product]));
    return uniqueIds
      .map((productId) => fallbackMap.get(productId) ?? null)
      .filter((product): product is EditorialProduct => Boolean(product));
  }
}

export const getPublicProductBySlug = cache(
  async (slug: string): Promise<EditorialProduct | null> => {
    try {
      return await fetchSupabaseProductBySlug(slug);
    } catch (error) {
      if (!isExpectedNextDynamicUsageError(error)) {
        console.warn("[catalog] public product by slug fetch failed", error);
      }
      if (!CATALOG_SEED_FALLBACK_ENABLED) return null;
      return buildFallbackProducts().find((item) => item.slug === slug) ?? null;
    }
  }
);

export async function getPublicProductById(id: string): Promise<EditorialProduct | null> {
  const [product] = await getPublicProductsByIds([id]);
  return product ?? null;
}
