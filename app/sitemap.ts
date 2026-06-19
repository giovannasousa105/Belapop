import type { MetadataRoute } from "next";

import { legalRoutes } from "@/lib/legal/content";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

// Revalidar o sitemap a cada 1 hora.
export const revalidate = 3600;

const UNIVERSOS = ["rosto", "corpo", "cabelo", "perfumaria", "wellness"] as const;

function getBaseUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://belapopoficial.com.br")
    .trim()
    .replace(/\/+$/, "");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const supabase = getSupabaseAdminClient();

  const { data: produtos, error: produtosError } = await supabase
    .from("products")
    .select("slug, updated_at, id")
    .eq("status", "published")
    .gt("stock_quantity", 0)
    .gt("price_cents", 0)
    .order("updated_at", { ascending: false })
    .limit(5000);

  if (produtosError) {
    console.warn("[sitemap] product lookup failed", produtosError.message);
  }

  const estaticas: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/skin-scan/foco`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/popclub`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/catalogo`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/kits`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/skincare`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/circulo`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/carrinho`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    ...Object.values(legalRoutes).map((route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ];

  const universos: MetadataRoute.Sitemap = UNIVERSOS.map((universo) => ({
    url: `${baseUrl}/universo/${universo}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const paginasProduto: MetadataRoute.Sitemap = (produtos ?? [])
    .filter((produto) => produto.slug)
    .map((produto) => ({
      url: `${baseUrl}/produto/${produto.slug as string}`,
      lastModified: produto.updated_at ? new Date(produto.updated_at as string) : new Date(),
      changeFrequency: "daily" as const,
      priority: 0.7,
    }));

  return [...estaticas, ...universos, ...paginasProduto];
}
