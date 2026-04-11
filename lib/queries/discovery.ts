import "server-only";

import { cache } from "react";

import { getPublicProducts, getPublicProductsByIds, type EditorialProduct } from "@/lib/queries/products";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServer } from "@/lib/supabase/server";

export type DiscoveryEditorialCard = {
  id: string;
  slug: string;
  title: string;
  description: string;
  coverImage: string;
  href: string;
  eyebrow: string;
  productCount: number;
  supportingLabel?: string;
};

type CollectionRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  published_at: string | null;
};

type OriginRow = {
  id: string;
  slug: string;
  name: string;
  country: string | null;
  description: string | null;
  cover_image: string | null;
};

type IngredientRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  benefits: string | null;
  cover_image: string | null;
};

type ProductTrendingRow = {
  product_id: string;
  trend_score: number | null;
};

const isMissingRelationError = (error: unknown) => {
  const code =
    typeof error === "object" && error && "code" in error
      ? String((error as { code?: unknown }).code ?? "")
      : "";
  const message =
    typeof error === "object" && error && "message" in error
      ? String((error as { message?: unknown }).message ?? "")
      : "";
  return code === "42P01" || message.toLowerCase().includes("does not exist");
};

const TREND_FALLBACK: DiscoveryEditorialCard[] = [
  {
    id: "trend-skincare-coreano",
    slug: "skincare-coreano",
    title: "Skincare coreano",
    description: "Camadas leves, brilho controlado e formulas pensadas para constancia diaria.",
    coverImage: "/editorial/essencia-sensorial.svg",
    href: "/catalogo?collection=skincare-coreano&sort=featured",
    eyebrow: "Tendencias globais",
    productCount: 4,
    supportingLabel: "Inovacao cosmetica"
  },
  {
    id: "trend-clean-beauty",
    slug: "clean-beauty-editorial",
    title: "Clean beauty",
    description: "Texturas limpas, pele confortavel e narrativas de formula mais objetivas.",
    coverImage: "/editorial/presenca-diurna.svg",
    href: "/catalogo?collection=clean-beauty-editorial&sort=featured",
    eyebrow: "Tendencias globais",
    productCount: 4,
    supportingLabel: "Formula essencial"
  },
  {
    id: "trend-ingredientes-raros",
    slug: "ingredientes-raros",
    title: "Ingredientes raros",
    description: "Ativos de performance com narrativa sensorial e leitura editorial.",
    coverImage: "/editorial/ritual-noturno.svg",
    href: "/catalogo?collection=ingredientes-raros&sort=featured",
    eyebrow: "Tendencias globais",
    productCount: 4,
    supportingLabel: "Performance premium"
  },
  {
    id: "trend-ritual-noturno",
    slug: "ritual-noturno-global",
    title: "Ritual noturno",
    description: "O fim do dia como experiencia: textura, aroma e recuperacao em camadas.",
    coverImage: "/editorial/ritual-noturno.svg",
    href: "/catalogo?collection=ritual-noturno-global&sort=featured",
    eyebrow: "Tendencias globais",
    productCount: 4,
    supportingLabel: "Sensorial"
  }
];

const CURATION_FALLBACK: DiscoveryEditorialCard[] = [
  {
    id: "curation-bela-pop",
    slug: "curadoria-bela-pop",
    title: "Curadoria BelaPop",
    description: "Selecao da editora com produtos que sustentam assinatura, textura e performance.",
    coverImage: "/editorial/brasilidades.svg",
    href: "/catalogo?collection=curadoria-bela-pop&sort=featured",
    eyebrow: "Curadoria BelaPop",
    productCount: 4,
    supportingLabel: "Selecao da editora"
  },
  {
    id: "curation-rituais-beleza-noturna",
    slug: "rituais-beleza-noturna",
    title: "Rituais beleza noturna",
    description: "Texturas envolventes para finalizar o dia com pele confortavel e assinatura sensorial.",
    coverImage: "/editorial/ritual-noturno.svg",
    href: "/catalogo?ritual=Ritual%20Noturno&sort=featured",
    eyebrow: "Curadoria BelaPop",
    productCount: 4,
    supportingLabel: "Ritual noturno"
  },
  {
    id: "curation-brasilidades",
    slug: "brasilidades-que-importam",
    title: "Brasilidades que importam",
    description: "Selecao pensada para diversidade real: pele negra, cabelo crespo e alta pigmentacao.",
    coverImage: "/editorial/brasilidades.svg",
    href: "/catalogo?tags=skin_tone_deep&tags=hair_crespo&tags=high_pigment&sort=featured",
    eyebrow: "Curadoria BelaPop",
    productCount: 4,
    supportingLabel: "Selecao inclusiva"
  }
];

const ORIGIN_FALLBACK: DiscoveryEditorialCard[] = [
  {
    id: "origin-franca",
    slug: "franca",
    title: "Franca",
    description: "Perfumaria classica, maquiagem de assinatura e acabamento sem excesso.",
    coverImage: "/editorial/presenca-diurna.svg",
    href: "/catalogo?origin=franca&sort=featured",
    eyebrow: "Beleza pelo mundo",
    productCount: 3,
    supportingLabel: "Perfumaria classica"
  },
  {
    id: "origin-japao",
    slug: "japao",
    title: "Japao",
    description: "Skincare minimalista, pele calma e formulas com conforto imediato.",
    coverImage: "/editorial/product-hero-skincare.svg",
    href: "/catalogo?origin=japao&sort=featured",
    eyebrow: "Beleza pelo mundo",
    productCount: 3,
    supportingLabel: "Skincare minimalista"
  },
  {
    id: "origin-coreia",
    slug: "coreia",
    title: "Coreia",
    description: "Inovacao cosmetica, camadas leves e rotina guiada por resultados.",
    coverImage: "/editorial/essencia-sensorial.svg",
    href: "/catalogo?origin=coreia&sort=featured",
    eyebrow: "Beleza pelo mundo",
    productCount: 3,
    supportingLabel: "Inovacao cosmetica"
  },
  {
    id: "origin-italia",
    slug: "italia",
    title: "Italia",
    description: "Fragrancias artesanais e rituais de corpo com gesto mais sofisticado.",
    coverImage: "/editorial/product-hero-corpo.svg",
    href: "/catalogo?origin=italia&sort=featured",
    eyebrow: "Beleza pelo mundo",
    productCount: 3,
    supportingLabel: "Fragrancias artesanais"
  }
];

const INGREDIENT_FALLBACK: DiscoveryEditorialCard[] = [
  {
    id: "ingredient-niacinamida",
    slug: "niacinamida",
    title: "Niacinamida",
    description: "Uniformiza o tom, melhora o brilho e sustenta formula de uso continuo.",
    coverImage: "/editorial/product-hero-skincare.svg",
    href: "/catalogo?ingredient=niacinamida&sort=featured",
    eyebrow: "Ingredientes raros",
    productCount: 1,
    supportingLabel: "Luminosidade"
  },
  {
    id: "ingredient-ceramidas",
    slug: "ceramidas",
    title: "Ceramidas",
    description: "Reforco de barreira, hidratacao profunda e conforto para peles sensibilizadas.",
    coverImage: "/editorial/product-hero-skincare.svg",
    href: "/catalogo?ingredient=ceramidas&sort=featured",
    eyebrow: "Ingredientes raros",
    productCount: 1,
    supportingLabel: "Barreira"
  },
  {
    id: "ingredient-acido-hialuronico",
    slug: "acido-hialuronico",
    title: "Acido hialuronico",
    description: "Preenche visualmente, retém agua e melhora o acabamento da pele.",
    coverImage: "/editorial/ritual-noturno.svg",
    href: "/catalogo?ingredient=acido-hialuronico&sort=featured",
    eyebrow: "Ingredientes raros",
    productCount: 1,
    supportingLabel: "Hidratacao"
  },
  {
    id: "ingredient-centella-asiatica",
    slug: "centella-asiatica",
    title: "Centella asiatica",
    description: "Acalma, reduz sensibilizacao visual e melhora a experiencia de rotina.",
    coverImage: "/editorial/product-hero-skincare.svg",
    href: "/catalogo?ingredient=centella-asiatica&sort=featured",
    eyebrow: "Ingredientes raros",
    productCount: 1,
    supportingLabel: "Calma"
  }
];

async function fetchCollectionCards(kind: "trend", limit: number): Promise<DiscoveryEditorialCard[]> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("collections")
    .select("id,slug,title,description,cover_image,published_at")
    .eq("status", "published")
    .eq("kind", kind)
    .order("trend_boost", { ascending: false })
    .order("editorial_boost", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  const collections = ((data ?? []) as CollectionRow[]).slice(0, limit);
  if (!collections.length) return [];

  const { data: links, error: linksError } = await supabase
    .from("collection_products")
    .select("collection_id,product_id")
    .in(
      "collection_id",
      collections.map((item) => item.id)
    );

  if (linksError) throw linksError;

  const counts = new Map<string, number>();
  for (const row of (links ?? []) as { collection_id: string; product_id: string }[]) {
    counts.set(row.collection_id, (counts.get(row.collection_id) ?? 0) + 1);
  }

  return collections.map((item) => ({
    id: item.id,
    slug: item.slug,
    title: item.title,
    description: item.description ?? "Selecao editorial com leitura de tendencia e produtos ligados ao tema.",
    coverImage: item.cover_image ?? "/editorial/presenca-diurna.svg",
    href: `/catalogo?collection=${encodeURIComponent(item.slug)}&sort=featured`,
    eyebrow: "Tendencias globais",
    productCount: counts.get(item.id) ?? 0,
    supportingLabel: "Curadoria + dados"
  }));
}

async function fetchCurationCards(limit: number): Promise<DiscoveryEditorialCard[]> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("collections")
    .select("id,slug,title,description,cover_image,published_at")
    .eq("status", "published")
    .in("kind", ["curation", "featured", "editorial"])
    .order("editorial_boost", { ascending: false })
    .order("trend_boost", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  const collections = ((data ?? []) as CollectionRow[]).slice(0, limit);
  if (!collections.length) return [];

  const { data: links, error: linksError } = await supabase
    .from("collection_products")
    .select("collection_id,product_id")
    .in(
      "collection_id",
      collections.map((item) => item.id)
    );

  if (linksError) throw linksError;

  const counts = new Map<string, number>();
  for (const row of (links ?? []) as { collection_id: string; product_id: string }[]) {
    counts.set(row.collection_id, (counts.get(row.collection_id) ?? 0) + 1);
  }

  return collections.map((item) => ({
    id: item.id,
    slug: item.slug,
    title: item.title,
    description:
      item.description ??
      "Selecao da editora com produtos ligados por textura, performance e assinatura editorial.",
    coverImage: item.cover_image ?? "/editorial/brasilidades.svg",
    href: `/catalogo?collection=${encodeURIComponent(item.slug)}&sort=featured`,
    eyebrow: "Curadoria BelaPop",
    productCount: counts.get(item.id) ?? 0,
    supportingLabel: "Selecao da editora"
  }));
}

async function fetchOriginCards(limit: number): Promise<DiscoveryEditorialCard[]> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("origins")
    .select("id,slug,name,country,description,cover_image")
    .eq("status", "active")
    .order("name", { ascending: true })
    .limit(limit);

  if (error) throw error;

  const origins = ((data ?? []) as OriginRow[]).slice(0, limit);
  if (!origins.length) return [];

  const { data: links, error: linksError } = await supabase
    .from("product_origins")
    .select("origin_id,product_id")
    .in(
      "origin_id",
      origins.map((item) => item.id)
    );

  if (linksError) throw linksError;

  const counts = new Map<string, number>();
  for (const row of (links ?? []) as { origin_id: string; product_id: string }[]) {
    counts.set(row.origin_id, (counts.get(row.origin_id) ?? 0) + 1);
  }

  return origins.map((item) => ({
    id: item.id,
    slug: item.slug,
    title: item.name,
    description: item.description ?? "Selecao editorial por escola cosmetica e origem cultural da formula.",
    coverImage: item.cover_image ?? "/editorial/presenca-diurna.svg",
    href: `/catalogo?origin=${encodeURIComponent(item.slug)}&sort=featured`,
    eyebrow: "Beleza pelo mundo",
    productCount: counts.get(item.id) ?? 0,
    supportingLabel: item.country ?? "Curadoria internacional"
  }));
}

async function fetchIngredientCards(limit: number): Promise<DiscoveryEditorialCard[]> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("ingredients")
    .select("id,slug,name,description,benefits,cover_image")
    .eq("status", "active")
    .order("name", { ascending: true })
    .limit(limit);

  if (error) throw error;

  const ingredients = ((data ?? []) as IngredientRow[]).slice(0, limit);
  if (!ingredients.length) return [];

  const { data: links, error: linksError } = await supabase
    .from("product_ingredients")
    .select("ingredient_id,product_id")
    .in(
      "ingredient_id",
      ingredients.map((item) => item.id)
    );

  if (linksError) throw linksError;

  const counts = new Map<string, number>();
  for (const row of (links ?? []) as { ingredient_id: string; product_id: string }[]) {
    counts.set(row.ingredient_id, (counts.get(row.ingredient_id) ?? 0) + 1);
  }

  return ingredients.map((item) => ({
    id: item.id,
    slug: item.slug,
    title: item.name,
    description:
      item.description ??
      item.benefits ??
      "Ingrediente com leitura editorial, beneficio claro e aplicacao em rotinas premium.",
    coverImage: item.cover_image ?? "/editorial/product-hero-skincare.svg",
    href: `/catalogo?ingredient=${encodeURIComponent(item.slug)}&sort=featured`,
    eyebrow: "Ingredientes raros",
    productCount: counts.get(item.id) ?? 0,
    supportingLabel: "Ativo em foco"
  }));
}

async function fetchTrendingNowProducts(limit: number): Promise<EditorialProduct[]> {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("product_trending")
    .select("product_id,trend_score")
    .order("trend_score", { ascending: false })
    .limit(Math.max(limit * 3, 12));

  if (error) throw error;

  const rankedIds = ((data ?? []) as ProductTrendingRow[])
    .sort((left, right) => (right.trend_score ?? 0) - (left.trend_score ?? 0))
    .map((item) => item.product_id)
    .filter(Boolean);

  if (!rankedIds.length) {
    return getPublicProducts(limit);
  }

  const products = await getPublicProductsByIds(rankedIds);
  return products.slice(0, limit);
}

export const getHomeTrendCollections = cache(async (limit = 4): Promise<DiscoveryEditorialCard[]> => {
  try {
    const items = await fetchCollectionCards("trend", limit);
    return items.length ? items.slice(0, limit) : TREND_FALLBACK.slice(0, limit);
  } catch (error) {
    if (!isMissingRelationError(error)) {
      console.warn("[discovery] trend collections fallback", error);
    }
    return TREND_FALLBACK.slice(0, limit);
  }
});

export const getHomeOriginCollections = cache(async (limit = 4): Promise<DiscoveryEditorialCard[]> => {
  try {
    const items = await fetchOriginCards(limit);
    return items.length ? items.slice(0, limit) : ORIGIN_FALLBACK.slice(0, limit);
  } catch (error) {
    if (!isMissingRelationError(error)) {
      console.warn("[discovery] origin collections fallback", error);
    }
    return ORIGIN_FALLBACK.slice(0, limit);
  }
});

export const getHomeCurationCollections = cache(async (limit = 3): Promise<DiscoveryEditorialCard[]> => {
  try {
    const items = await fetchCurationCards(limit);
    return items.length ? items.slice(0, limit) : CURATION_FALLBACK.slice(0, limit);
  } catch (error) {
    if (!isMissingRelationError(error)) {
      console.warn("[discovery] curation collections fallback", error);
    }
    return CURATION_FALLBACK.slice(0, limit);
  }
});

export const getHomeIngredientCollections = cache(async (limit = 4): Promise<DiscoveryEditorialCard[]> => {
  try {
    const items = await fetchIngredientCards(limit);
    return items.length ? items.slice(0, limit) : INGREDIENT_FALLBACK.slice(0, limit);
  } catch (error) {
    if (!isMissingRelationError(error)) {
      console.warn("[discovery] ingredient collections fallback", error);
    }
    return INGREDIENT_FALLBACK.slice(0, limit);
  }
});

export const getTrendingNowProducts = cache(async (limit = 4): Promise<EditorialProduct[]> => {
  try {
    const items = await fetchTrendingNowProducts(limit);
    if (items.length) return items.slice(0, limit);
    return (await getPublicProducts(limit)).slice(0, limit);
  } catch (error) {
    if (!isMissingRelationError(error)) {
      console.warn("[discovery] trending products fallback", error);
    }
    return (await getPublicProducts(limit)).slice(0, limit);
  }
});
