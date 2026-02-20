import Link from "next/link";

import type { EditorialArticle } from "@/lib/queries/articles";

type ArticleCardProps = {
  article: EditorialArticle;
};

export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Link
      href={`/diario/${article.slug}`}
      className="group block rounded-bpLg border border-bpPink/15 bg-white p-5 shadow-bpMicro transition hover:-translate-y-0.5 hover:shadow-bpSoft"
    >
      <div className="h-48 rounded-bpMd bg-gradient-to-br from-bpOffWhite to-bpPinkSoft/20" />
      <p className="mt-4 text-[11px] uppercase tracking-[0.24em] text-bpGraphite/70">
        {article.category} • {article.readingTimeMinutes} min
      </p>
      <h3 className="mt-2 line-clamp-2 font-display text-2xl text-bpBlack">
        {article.title}
      </h3>
      <p className="mt-2 line-clamp-3 text-sm text-bpGraphite">{article.excerpt}</p>
      <span className="mt-4 inline-flex text-xs uppercase tracking-[0.24em] text-bpPink">
        Ler artigo
      </span>
    </Link>
  );
}
