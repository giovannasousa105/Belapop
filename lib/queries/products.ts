import "server-only";

import { cache } from "react";

import { products as seedProducts } from "@/data/products";
import type { PublicProduct } from "@/lib/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type EditorialProduct = PublicProduct & {
  brand: string;
  currency: string;
  ritual: string;
  texture: string;
  sensation: string[];
  result: string[];
  price: number;
  category: string;
  badge: string;
  editorialReason: string;
  howToUse: string[];
  coverImage: string;
  gallery: { url: string; alt: string }[];
};

const FALLBACK_BADGE = "Curadoria";

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
    .map((product) => ({
      id: product.id,
      slug: slugify(product.name) || product.id,
      title: product.name,
      brand: "BelaPop",
      price_cents: Math.round(product.price * 100),
      price: product.price,
      currency: "BRL",
      hero_image_url: `/products/${slugify(product.name)}.jpg`,
      category: product.category,
      badge: FALLBACK_BADGE,
      badges: [FALLBACK_BADGE],
      ritual: product.category === "Bem-estar" ? "Essência Sensorial" : "Ritual Noturno",
      texture: product.highlights?.[0] ?? "Toque leve",
      sensation: product.highlights?.slice(0, 2) ?? ["Sensorial premium"],
      result: product.highlights?.slice(1, 3) ?? ["Presença", "Performance"],
      editorialReason:
        product.description ||
        "Selecionado por desempenho consistente e acabamento editorial.",
      howToUse: [
        "Aplique sobre pele limpa.",
        "Distribua com movimentos suaves.",
        "Finalize no seu ritual com calma."
      ],
      coverImage: `/products/${slugify(product.name)}.jpg`,
      gallery: [
        {
          url: `/products/${slugify(product.name)}.jpg`,
          alt: `${product.name} em destaque`
        }
      ]
    }));

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
  const coverImage =
    (typeof row.hero_image_url === "string" && row.hero_image_url) ||
    galleryFromRow[0] ||
    images[0] ||
    "/logo.svg";

  const howToUseJson = Array.isArray(row.how_to_use)
    ? parseStringArray(row.how_to_use)
    : [];

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
    hero_image_url:
      (typeof row.hero_image_url === "string" && row.hero_image_url) ||
      coverImage,
    category:
      (typeof row.category === "string" && row.category) || "Curadoria BelaPop",
    badge: parseStringArray(row.badges)[0] || FALLBACK_BADGE,
    badges: parseStringArray(row.badges),
    ritual:
      (typeof row.ritual === "string" && row.ritual) || "Ritual Noturno",
    texture:
      (typeof row.texture === "string" && row.texture) || "Textura aveludada",
    sensation:
      parseStringArray(row.sensation).length > 0
        ? parseStringArray(row.sensation)
        : ["Presença elegante"],
    result:
      parseStringArray(row.result).length > 0
        ? parseStringArray(row.result)
        : ["Performance sensorial"],
    editorialReason:
      (typeof row.editorial_reason === "string" && row.editorial_reason) ||
      (typeof row.description === "string" && row.description) ||
      "Entrou na curadoria por qualidade de fórmula e assinatura sensorial.",
    howToUse:
      howToUseJson.length > 0
        ? howToUseJson
        : [
            "Prepare a pele com limpeza suave.",
            "Aplique em movimentos curtos e precisos.",
            "Finalize com camada leve para preservar o toque."
          ],
    coverImage,
    gallery: (galleryFromRow.length ? galleryFromRow : images).map((url, index) => ({
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

export const getPublicProducts = cache(async (limit = 8): Promise<EditorialProduct[]> => {
  try {
    return await fetchSupabaseProducts(limit);
  } catch {
    return buildFallbackProducts().slice(0, limit);
  }
});

export const getPublicProductBySlug = cache(
  async (slug: string): Promise<EditorialProduct | null> => {
    const products = await getPublicProducts(60);
    return products.find((item) => item.slug === slug) ?? null;
  }
);
