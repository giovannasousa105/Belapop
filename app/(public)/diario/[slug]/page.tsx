import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { CatalogProductCard } from "@/components/catalog/ProductCard";
import { Section } from "@/components/ui/Section";
import { getPublishedArticleBySlug } from "@/lib/queries/articles";
import { getPublicProducts } from "@/lib/queries/products";

export const revalidate = 300;

type ArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);

  if (!article) {
    return {
      title: "Diario BelaPop",
      description: "Conteudo editorial de beleza e autocuidado."
    };
  }

  return {
    title: `${article.title} | Diario BelaPop`,
    description: article.excerpt,
    openGraph: {
      title: `${article.title} | Diario BelaPop`,
      description: article.excerpt,
      images: [{ url: article.coverImageUrl }],
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

  const allProducts = await getPublicProducts(12);
  const selectedProducts = article.relatedProductSlugs.length
    ? allProducts
        .filter((product) => article.relatedProductSlugs.includes(product.slug))
        .slice(0, 3)
    : allProducts.slice(0, 3);

  const paragraphs = article.content
    .split("\n\n")
    .map((item) => item.trim())
    .filter(Boolean);
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    datePublished: article.publishedAt,
    author: {
      "@type": "Organization",
      name: "BelaPop"
    }
  };

  return (
    <div className="bg-bpOffWhite text-bpGraphite">
      <Section className="bg-white">
        <article className="mx-auto max-w-[760px]">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
          />
          <p className="text-[11px] uppercase tracking-[0.26em] text-bpPink">
            {article.category} • {article.readingTimeMinutes} min
          </p>
          <h1 className="mt-3 font-display text-4xl leading-tight text-bpBlack md:text-6xl">
            {article.title}
          </h1>
          <p className="mt-4 text-lg text-bpGraphite">{article.excerpt}</p>
          <div className="mt-8 h-72 rounded-bpLg bg-gradient-to-br from-bpOffWhite to-bpPinkSoft/25" />

          <div className="prose prose-lg mt-10 max-w-none text-bpGraphite">
            {paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <div className="mt-10 rounded-bpLg border border-bpPink/20 bg-bpOffWhite p-6">
            <h2 className="font-display text-2xl text-bpBlack">Explorar curadoria relacionada</h2>
            <p className="mt-2 text-sm text-bpGraphite">
              Produtos selecionados para prolongar o ritual apresentado neste artigo.
            </p>
            <Link
              href="/catalogo"
              className="mt-4 inline-flex text-xs uppercase tracking-[0.24em] text-bpPink"
            >
              Ver catalogo completo
            </Link>
          </div>
        </article>
      </Section>

      <Section className="bg-bpOffWhite">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h3 className="font-display text-3xl text-bpBlack">Selecionados</h3>
          <Link href="/catalogo" className="text-xs uppercase tracking-[0.24em] text-bpPink">
            Ver tudo
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {selectedProducts.map((product) => (
            <CatalogProductCard key={product.id} product={product} />
          ))}
        </div>
      </Section>
    </div>
  );
}


