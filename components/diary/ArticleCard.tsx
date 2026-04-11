"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { EditorialCoverHeader } from "@/components/ui/EditorialCoverHeader";
import { getDiaryFallbackCover } from "@/lib/diary/articleCovers";
import type { EditorialArticle } from "@/lib/queries/articles";

type ArticleCardProps = {
  article: EditorialArticle;
};

export function ArticleCard({ article }: ArticleCardProps) {
  const fallbackCover = useMemo(
    () =>
      getDiaryFallbackCover({
        slug: article.slug,
        category: article.category,
        coverImageUrl: article.coverImageUrl
      }),
    [article.category, article.coverImageUrl, article.slug]
  );
  const [coverSrc, setCoverSrc] = useState(article.coverImageUrl || fallbackCover);
  return (
    <Link
      href={`/diario/${article.slug}`}
      className="group block overflow-hidden rounded-[30px] border border-[rgba(216,160,172,0.18)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,232,234,0.28)_100%)] shadow-[0_16px_44px_rgba(91,49,56,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(91,49,56,0.1)]"
    >
      <EditorialCoverHeader
        imageUrl={coverSrc}
        imageAlt={article.title}
        sizes="(max-width: 767px) 78vw, (max-width: 1279px) 33vw, 30vw"
        heightClassName="h-38 sm:h-44"
        leftLabel="Diario BelaPop"
        rightLabel="Editorial"
        title={article.category}
        subtitle={article.title}
        onImageError={() => {
          if (coverSrc !== fallbackCover) {
            setCoverSrc(fallbackCover);
          }
        }}
      />
      <div className="p-4 sm:p-5">
        <p className="text-[11px] uppercase tracking-[0.24em] text-bpGraphite/62">
          {article.category} {" / "} {article.readingTimeMinutes} min
        </p>
        <h3 className="mt-3 line-clamp-2 font-display text-[1.5rem] font-medium leading-[1.02] tracking-[-0.03em] text-bpBlack sm:text-[1.86rem]">{article.title}</h3>
        <p className="mt-3 line-clamp-3 text-[0.92rem] leading-6 text-bpGraphite/90 sm:text-sm sm:leading-relaxed">{article.excerpt}</p>
        <div className="mt-5 flex items-center justify-between gap-3">
          <span className="inline-flex text-xs uppercase tracking-[0.24em] text-bpPink">Ler artigo</span>
          <span className="text-[10px] uppercase tracking-[0.22em] text-bpRoseGold">Beauty reading</span>
        </div>
      </div>
    </Link>
  );
}
