"use client";

import Link from "next/link";

import { LuxurySection } from "@/components/LuxurySection";
import { usePublishedDiaryPosts } from "@/lib/hooks/useDiaryPosts";

export default function DiarioPage() {
  const { posts } = usePublishedDiaryPosts();

  return (
    <LuxurySection
      eyebrow="Diário da Doutora"
      title="Editorial íntimo de beleza e bem-estar"
      subtitle="Notas suaves entre a medicina e a influência digital."
    >
      <div className="grid gap-6 md:grid-cols-2">
        {posts.map((post) => (
          <div key={post.slug} className="glass-panel rounded-2xl p-6">
            <div className="mb-4 h-40 rounded-2xl border border-white/10 bg-gradient-to-br from-noir-900 via-noir-950 to-luxe-600/30" />
            <p className="text-xs uppercase tracking-luxe text-blush-100/70">
              {post.category} • {new Date(post.updatedAt).toLocaleDateString("pt-BR")}
            </p>
            <h2 className="mt-3 font-display text-2xl text-blush-50">
              {post.title}
            </h2>
            <p className="mt-3 text-sm text-blush-100/70">{post.subtitle}</p>
            <Link
              href={`/diario/${post.slug}`}
              className="mt-6 inline-flex text-xs uppercase tracking-luxe text-blush-100/70 hover:text-blush-50"
            >
              Ler artigo
            </Link>
          </div>
        ))}
      </div>
    </LuxurySection>
  );
}
