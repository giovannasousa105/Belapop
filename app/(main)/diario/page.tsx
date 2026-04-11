import type { Metadata } from "next";

import { DiaryArticleExperience } from "@/components/diary/DiaryArticleExperience";

const DIARY_PAGE_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAHE2-GdHr9GjE-DsdApHTy1DydtvnmlkDenC7ss9bDQSXq50w1fzVnw1uagqNgoHXtdS3Qvj91IY9yfbDcxmxPU_uoyz3e2CLpi2H93LsPjipFKiEo5VmIspDEaCUa9fIS0gsgjQMd6bNj973XEWCsXES56hW08m_Bgq5qtCxE6ko71VZ80AHQf-OVkXDgJ3kPAyOwZ8PZIl69ekpEw8BzWONeB7UBs6XYVsPw3dpRKS9Hc8HC8zlmhoiq2u2J55BCa3r70naLitU9";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "BelaPop - Diario | Biologia Estetica & Luxo",
  description: "BelaPop - Diario | Biologia Estetica & Luxo",
  openGraph: {
    title: "BelaPop - Diario | Biologia Estetica & Luxo",
    description: "BelaPop - Diario | Biologia Estetica & Luxo",
    images: [{ url: DIARY_PAGE_IMAGE }],
    type: "article"
  }
};

export default function DiarioPage() {
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "BelaPop - Diario | Biologia Estetica & Luxo",
    description: "BelaPop - Diario | Biologia Estetica & Luxo",
    image: DIARY_PAGE_IMAGE,
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
