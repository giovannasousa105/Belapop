import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { DiaryArticleExperience } from "@/components/diary/DiaryArticleExperience";
import { getPublishedArticleBySlug } from "@/lib/queries/articles";

export const revalidate = 300;

type ArticlePageProps = {
  params: Promise<{ slug: string }>;
};

const DIARY_ARTICLE_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAHE2-GdHr9GjE-DsdApHTy1DydtvnmlkDenC7ss9bDQSXq50w1fzVnw1uagqNgoHXtdS3Qvj91IY9yfbDcxmxPU_uoyz3e2CLpi2H93LsPjipFKiEo5VmIspDEaCUa9fIS0gsgjQMd6bNj973XEWCsXES56hW08m_Bgq5qtCxE6ko71VZ80AHQf-OVkXDgJ3kPAyOwZ8PZIl69ekpEw8BzWONeB7UBs6XYVsPw3dpRKS9Hc8HC8zlmhoiq2u2J55BCa3r70naLitU9";

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);

  if (!article) {
    return {
      title: "BelaPop - Diario | Biologia Estetica & Luxo",
      description: "BelaPop - Diario | Biologia Estetica & Luxo"
    };
  }

  return {
    title: "BelaPop - Diario | Biologia Estetica & Luxo",
    description: "BelaPop - Diario | Biologia Estetica & Luxo",
    openGraph: {
      title: "BelaPop - Diario | Biologia Estetica & Luxo",
      description: "BelaPop - Diario | Biologia Estetica & Luxo",
      images: [{ url: DIARY_ARTICLE_IMAGE }],
      type: "article"
    }
  };
}

export default async function DiarioArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);

  if (!article) {
    redirect("/diario");
  }

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "BelaPop - Diario | Biologia Estetica & Luxo",
    description: "BelaPop - Diario | Biologia Estetica & Luxo",
    datePublished: article.publishedAt,
    image: DIARY_ARTICLE_IMAGE,
    author: {
      "@type": "Organization",
      name: "BelaPop"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <DiaryArticleExperience />
    </>
  );
}
