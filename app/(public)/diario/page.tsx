import type { Metadata } from "next";
import Link from "next/link";

import { ArticleCard } from "@/components/diary/ArticleCard";
import { Section } from "@/components/ui/Section";
import { getPublishedArticles } from "@/lib/queries/articles";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Diario BelaPop | Editorial de beleza",
  description:
    "Ritual da semana, bastidores e historias editoriais de beleza e autocuidado."
};

const pageSize = 6;

type DiarioPageProps = {
  searchParams?: {
    page?: string;
    category?: string;
  };
};

export default async function DiarioPage({ searchParams }: DiarioPageProps) {
  const allArticles = await getPublishedArticles();
  const categories = Array.from(
    new Set([
      "Ritual da Semana",
      "Bastidores",
      "Texturas & Tendencias",
      "Mulheres que Inspiram",
      ...allArticles.map((article) => article.category)
    ])
  );

  const selectedCategory = searchParams?.category;
  const filtered = selectedCategory
    ? allArticles.filter((article) => article.category === selectedCategory)
    : allArticles;

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(
    totalPages,
    Math.max(1, Number(searchParams?.page ?? "1") || 1)
  );
  const pageStart = (currentPage - 1) * pageSize;
  const articles = filtered.slice(pageStart, pageStart + pageSize);

  return (
    <div className="bg-bpOffWhite text-bpGraphite">
      <Section className="bg-bpBlack text-bpOffWhite">
        <p className="text-[11px] uppercase tracking-[0.3em] text-bpPinkSoft">Diario BelaPop</p>
        <h1 className="mt-3 max-w-3xl font-display text-4xl leading-tight md:text-6xl">
          Diario editorial de beleza e autocuidado.
        </h1>
      </Section>

      <Section className="bg-white">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/diario"
            className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.2em] ${
              !selectedCategory
                ? "border-bpPink bg-bpPink text-bpOffWhite"
                : "border-bpPink/25 text-bpPink"
            }`}
          >
            Todas
          </Link>
          {categories.map((category) => (
            <Link
              key={category}
              href={`/diario?category=${encodeURIComponent(category)}`}
              className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.2em] ${
                selectedCategory === category
                  ? "border-bpPink bg-bpPink text-bpOffWhite"
                  : "border-bpPink/25 text-bpPink"
              }`}
            >
              {category}
            </Link>
          ))}
        </div>

        {articles.length > 0 ? (
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-bpLg border border-bpPink/15 bg-bpOffWhite p-8">
            <p className="font-display text-3xl text-bpBlack">Ainda em edicao.</p>
            <p className="mt-2 text-sm text-bpGraphite">Explore outra categoria do Diario BelaPop.</p>
          </div>
        )}

        <div className="mt-10 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-bpGraphite/70">
          <span>
            Pagina {currentPage} de {totalPages}
          </span>
          <div className="flex items-center gap-4">
            {currentPage > 1 ? (
              <Link
                href={`/diario?page=${currentPage - 1}${
                  selectedCategory ? `&category=${encodeURIComponent(selectedCategory)}` : ""
                }`}
                className="text-bpPink"
              >
                Anterior
              </Link>
            ) : (
              <span className="text-bpGraphite/30">Anterior</span>
            )}
            {currentPage < totalPages ? (
              <Link
                href={`/diario?page=${currentPage + 1}${
                  selectedCategory ? `&category=${encodeURIComponent(selectedCategory)}` : ""
                }`}
                className="text-bpPink"
              >
                Proxima
              </Link>
            ) : (
              <span className="text-bpGraphite/30">Proxima</span>
            )}
          </div>
        </div>
      </Section>
    </div>
  );
}


