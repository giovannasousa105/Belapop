"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { usePublishedDiaryPosts } from "@/lib/hooks/useDiaryPosts";
import { DiaryPost } from "@/lib/types";

type PageProps = {
  params: { slug: string };
};

export default function DiarioDetailPage({ params }: PageProps) {
  const { posts } = usePublishedDiaryPosts();
  const [post, setPost] = useState<DiaryPost | null>(null);

  useEffect(() => {
    const found = posts.find((item) => item.slug === params.slug) ?? null;
    setPost(found);
  }, [posts, params.slug]);

  const paragraphs = useMemo(
    () => (post?.content ? post.content.split("\n\n") : []),
    [post]
  );

  if (!post) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-4xl items-center justify-center px-6">
        <p className="text-sm text-blush-100/70">Conteúdo não encontrado.</p>
      </div>
    );
  }

  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-16">
      <div className="glass-panel rounded-3xl p-10">
        <div className="mb-6 h-60 rounded-3xl border border-white/10 bg-gradient-to-br from-noir-900 via-noir-950 to-luxe-600/30" />
        <p className="text-xs uppercase tracking-luxe text-blush-100/70">
          {post.category} • {new Date(post.updatedAt).toLocaleDateString("pt-BR")}
        </p>
        <h1 className="mt-4 font-display text-4xl text-blush-50">
          {post.title}
        </h1>
        <p className="mt-4 text-base text-blush-100/70">{post.subtitle}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.2em] text-blush-100/60">
          {post.tags.map((tag) => (
            <span key={tag} className="rounded-full border border-white/10 px-2 py-1">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-6 text-base leading-relaxed text-blush-100/80">
        {paragraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>

      <Link
        href="/diario"
        className="text-xs uppercase tracking-luxe text-blush-100/70 hover:text-blush-50"
      >
        Voltar ao diário
      </Link>
    </article>
  );
}
