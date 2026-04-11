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
  sellerId: string;
  coverImage: string;
  gallery: { url: string; alt: string }[];
};

const FALLBACK_BADGE = "Selecao BelaPop";
const PDP_FALLBACK_GALLERY = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAU2BbAbeAwR5Vu09mQLjv0INQ3dKGhvUBcc4k7j91FBWyYf2Nh_x7eKFzKwzEIeHMhRGItg2_LrBVpLY5p5Wmpu72xuexID-FBVP9zl9y-CMTQhkGxyOgGaMcYPMeRYA8uqeIlLlmBTUZNy0BJGadN2Y3rx9ERHNwR8MHZiwkO_0yTkHqvh8fIgzJEGrlQUORnbsGhg-kq9Xo1u2cMDOMH250uY6mwOXRi2IyI044h_7bIyqWL5teoU-2_lDCCvSf2l9fu8VBu14OJ",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDUsV-42Fm_NmyAAmgNIXMTnYW-9Gp3NRScNNj0iD-tS-7WvHwTXN2SGRq9jp_xqGq4V3sheVMrqUccCXn9iAla4WBQT4DAnANg3O5kd-TRIV-AbQT63ZndWmKF1oxfzQHQ6NT1w9TRK2EjGBbfG7cnM_JBDLg-hyr0TCxKPqqV9uJ7t6kN2cnUFqDJ543kFkFsu2t9rSRO3kdMsc-G-gdw5XPrEfX1HdoVM62Zof5M9ExDWXGyOzhjMQMN6jn3e5vz3576T2QTmeOl",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDx4QqBs-OI7R_d-TTai2nIqjhpE66x7FT4NKmm5cqnQ-S9GICzlkfoZ7FmRHCVEkdenmcssFNuy76JrSg1uG1OgkV6B4z3qrJAp27ibnmEphm4J8PxvtNFbwIu4UiBBvdfANDcnHoc08uIDCOAiczFb2C6i-ZpDvp_BXH5KlImfx7tI9VEO8JQUOOixBP9jC2p6Zcwt0FDFx_v3W2TNsHTtj02oc025UnncevKG7giyoRj0nYLie9rMjq5OaaIM4rL7cbWq3y1hiLK",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuB79WAf8yVglJIsXN0Oip8fyOZLgtyQlSELikq51_DOqKQsYc60qfd5Dr8ljQktwA6iGdWfpfQB9oLtj42x0SYnpZLA2d0fRuoek0XdOc_Nw9GC9RNozLB5_i4X_08-pO-FQJuFN_hAz-SBK23MTBfIv0dJwcoErnz4EtcAHEooN8-RKu7qeZ1SRyiYt15AjkyryF1bhXMlvZHSq1_s3ZkKeeL8eTsZOazXdxZER5iBnuWg4B9N6DJMtUcCqrns21Rfdx1lvpcRpW0s"
] as const;

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
    .replace(/beauty intelligence/gi, "selecao por criterios de uso e formulacao")
    .replace(/marketplace premium/gi, "plataforma com parceiros verificados")
    .replace(/curadoria inteligente/gi, "sugestoes organizadas com mais clareza")
    .replace(/elevar a descoberta/gi, "facilitar a escolha")
    .replace(/obra-prima/gi, "produto")
    .replace(/ritual premium/gi, "rotina de uso")
    .replace(/experiencia premium/gi, "experiencia de cuidado")
    .replace(/regeneracao cutanea/gi, "cuidado da pele")
    .replace(/biometric[ao]s?/gi, "analise de pele")
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
  if (categoryKind === "maquiagem") return ["acabamento uniforme", "duracao estavel"];
  if (categoryKind === "cabelos") return ["controle de frizz", "brilho suave"];
  if (categoryKind === "perfumes") return ["presenca olfativa", "aplicacao controlada"];
  return ["hidratacao", "uso consistente"];
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
        hero_image_url: PDP_FALLBACK_GALLERY[0],
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
        coverImage: PDP_FALLBACK_GALLERY[0],
        gallery: PDP_FALLBACK_GALLERY.map((url, index) => ({
          url,
          alt: `${product.name} - imagem ${index + 1}`
        }))
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
    "Selecao BelaPop";
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
    PDP_FALLBACK_GALLERY[0];
  const coverImage = selectedGallery[0] || heroImage;
  const galleryForPdp = selectedGallery.length > 0 ? selectedGallery : Array.from(PDP_FALLBACK_GALLERY);

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

  return {
    id: String(row.id ?? slug),
    slug,
    title: rawTitle,
    brand: (typeof row.brand === "string" && row.brand) || "BelaPop",
    price_cents:
      getNumber(row.price_cents) || Math.round(getNumber(row.price) * 100) || 0,
    price:
      getNumber(row.price) ||
      Math.round(getNumber(row.price_cents) / 100) ||
      0,
    currency: (typeof row.currency === "string" && row.currency) || "BRL",
    hero_image_url: heroImage,
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
    sellerId:
      (typeof row.seller_id === "string" && row.seller_id) ||
      (typeof row.sellerId === "string" && row.sellerId) ||
      "unknown",
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
    .select("*")
    .in("status", ["active", "published"])
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data?.length) {
    throw new Error(error?.message ?? "No products found");
  }

  return (data as Record<string, unknown>[]).map(mapSupabaseProduct);
};

const fetchSupabaseProductsByIds = async (ids: string[]): Promise<EditorialProduct[]> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .in("id", ids)
    .in("status", ["active", "published"]);

  if (error || !data?.length) {
    throw new Error(error?.message ?? "No products found");
  }

  return (data as Record<string, unknown>[]).map(mapSupabaseProduct);
};

export const getPublicProducts = cache(async (limit = 8): Promise<EditorialProduct[]> => {
  try {
    const [priorityIds, liveProducts] = await Promise.all([
      fetchEditorialPriorityIds("featured"),
      fetchSupabaseProducts(limit)
    ]);
    return mergeWithFallbackProducts(liveProducts, limit, priorityIds);
  } catch {
    return buildFallbackProducts().slice(0, limit);
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
  } catch {
    const fallbackMap = new Map(buildFallbackProducts().map((product) => [product.id, product]));
    return uniqueIds
      .map((productId) => fallbackMap.get(productId) ?? null)
      .filter((product): product is EditorialProduct => Boolean(product));
  }
}

export const getPublicProductBySlug = cache(
  async (slug: string): Promise<EditorialProduct | null> => {
    const products = await getPublicProducts(60);
    return products.find((item) => item.slug === slug) ?? null;
  }
);
