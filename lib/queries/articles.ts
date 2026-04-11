import "server-only";

import { cache } from "react";

import { posts as seedPosts } from "@/data/posts";
import { resolveDiaryCardCover } from "@/lib/diary/articleCovers";
import type { Article as PublicArticle } from "@/lib/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type EditorialArticle = PublicArticle & {
  category: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  readingTimeMinutes: number;
  relatedProductSlugs: string[];
  publishedAt: string;
};

const parseStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
};

const estimateReadingTime = (text: string) => {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(3, Math.round(words / 200));
};

const fallbackArticles = (): EditorialArticle[] =>
  seedPosts
    .filter((post) => post.status === "published")
    .map((post) => {
      const fallbackCover = resolveDiaryCardCover({
        slug: post.slug,
        category: post.category
      });

      return {
        id: post.id,
        slug: post.slug,
        title: post.title,
        category: post.category,
        excerpt: post.excerpt,
        cover_image_url: fallbackCover,
        content_md: post.content,
        reading_time_minutes: estimateReadingTime(post.content),
        related_product_slugs: [],
        status: "published" as const,
        published_at: post.updatedAt,
        content: post.content,
        coverImageUrl: fallbackCover,
        readingTimeMinutes: estimateReadingTime(post.content),
        relatedProductSlugs: [],
        publishedAt: post.updatedAt
      };
    })
    .sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

const mapSupabaseArticle = (row: Record<string, unknown>): EditorialArticle => {
  const content =
    (typeof row.content_md === "string" && row.content_md) ||
    (typeof row.content === "string" && row.content) ||
    (typeof row.content_json === "string" && row.content_json) ||
    "";

  const publishedAt =
    (typeof row.published_at === "string" && row.published_at) ||
    (typeof row.updated_at === "string" && row.updated_at) ||
    new Date().toISOString();

  const excerpt =
    (typeof row.excerpt === "string" && row.excerpt) ||
    content.slice(0, 180) ||
    "Notas editoriais de beleza e autocuidado.";

  const fallbackCover = resolveDiaryCardCover({
    slug: typeof row.slug === "string" ? row.slug : null,
    category: typeof row.category === "string" ? row.category : null,
    coverImageUrl:
      (typeof row.cover_image_url === "string" && row.cover_image_url) ||
      (typeof row.cover_image === "string" && row.cover_image) ||
      null
  });

  return {
    id: String(row.id ?? row.slug ?? publishedAt),
    slug: String(row.slug ?? ""),
    title: String(row.title ?? "Diário BelaPop"),
    category: String(row.category ?? "Ritual da Semana"),
    excerpt,
    cover_image_url: fallbackCover,
    content_md: content,
    reading_time_minutes:
      typeof row.reading_time_minutes === "number"
        ? row.reading_time_minutes
        : estimateReadingTime(content),
    related_product_slugs: parseStringArray(row.related_product_slugs),
    status:
      row.status === "published" || row.status === "draft"
        ? row.status
        : "published",
    published_at: publishedAt,
    content,
    coverImageUrl: fallbackCover,
    readingTimeMinutes:
      typeof row.reading_time_minutes === "number"
        ? row.reading_time_minutes
        : estimateReadingTime(content),
    relatedProductSlugs: parseStringArray(row.related_product_slugs),
    publishedAt
  };
};

const fetchSupabaseArticles = async (): Promise<EditorialArticle[]> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error || !data?.length) {
    throw new Error(error?.message ?? "No articles found");
  }

  return (data as Record<string, unknown>[])
    .map(mapSupabaseArticle)
    .filter((article) => article.slug.length > 0);
};

const fetchEditorialPosts = async (): Promise<EditorialArticle[]> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("editorial_posts")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error || !data?.length) {
    throw new Error(error?.message ?? "No editorial posts found");
  }

  return (data as Record<string, unknown>[])
    .map(mapSupabaseArticle)
    .filter((article) => article.slug.length > 0);
};

export const getPublishedArticles = cache(async (): Promise<EditorialArticle[]> => {
  try {
    return await fetchEditorialPosts();
  } catch {
    try {
      return await fetchSupabaseArticles();
    } catch {
      return fallbackArticles();
    }
  }
});

export const getPublishedArticleBySlug = cache(
  async (slug: string): Promise<EditorialArticle | null> => {
    const articles = await getPublishedArticles();
    return articles.find((article) => article.slug === slug) ?? null;
  }
);
