"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { DiaryPreview } from "@/components/admin/DiaryPreview";
import { LuxuryButton } from "@/components/LuxuryButton";
import { localDiaryRepository } from "@/lib/repositories/diaryRepository";
import { DiaryPost } from "@/lib/types";

const categories: DiaryPost["category"][] = [
  "Rotina",
  "Autocuidado",
  "Pele",
  "Bem-estar"
];

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

export default function AdminDiaryEditPage() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<DiaryPost | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const postId = String(params?.id ?? "");

  useEffect(() => {
    const found = localDiaryRepository.getById(postId);
    if (!found) {
      setMessage("Post não localizado.");
      return;
    }
    setPost(found);
  }, [postId]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!post) return;
    if (!post.title || !post.subtitle || !post.content) {
      setMessage("Título, subtítulo e conteúdo são obrigatórios.");
      return;
    }
    const slug = slugify(post.slug || post.title);
    localDiaryRepository.upsert({
      ...post,
      slug,
      updatedAt: new Date().toISOString()
    });
    router.push("/admin/diario");
  };

  if (!post) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-4xl items-center justify-center px-6">
        <p className="text-sm text-bpGraphite/80">{message ?? "Carregando..."}</p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">
          Editar post
        </p>
        <h1 className="mt-2 font-display text-3xl text-bpBlack">
          {post.title}
        </h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <form
          onSubmit={handleSubmit}
          className="grid gap-4 rounded-3xl border border-black/10 bg-white p-8 shadow-sm md:grid-cols-2"
        >
          <input
            placeholder="Título"
            value={post.title}
            onChange={(event) => setPost({ ...post, title: event.target.value })}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-bpBlackSoft md:col-span-2"
          />
          <input
            placeholder="Subtítulo"
            value={post.subtitle}
            onChange={(event) =>
              setPost({ ...post, subtitle: event.target.value })
            }
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-bpBlackSoft md:col-span-2"
          />
          <input
            placeholder="Slug"
            value={post.slug}
            onChange={(event) => setPost({ ...post, slug: event.target.value })}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-bpBlackSoft"
          />
          <input
            placeholder="Cover image"
            value={post.coverImage}
            onChange={(event) =>
              setPost({ ...post, coverImage: event.target.value })
            }
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-bpBlackSoft"
          />
          <select
            value={post.category}
            onChange={(event) =>
              setPost({
                ...post,
                category: event.target.value as DiaryPost["category"]
              })
            }
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-bpBlackSoft"
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            value={post.status}
            onChange={(event) =>
              setPost({
                ...post,
                status: event.target.value as "draft" | "published"
              })
            }
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-bpBlackSoft"
          >
            <option value="draft">Rascunho</option>
            <option value="published">Publicado</option>
          </select>
          <input
            placeholder="Tags (separe por vírgula)"
            value={post.tags.join(", ")}
            onChange={(event) =>
              setPost({
                ...post,
                tags: event.target.value
                  .split(",")
                  .map((tag) => tag.trim())
                  .filter(Boolean)
              })
            }
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-bpBlackSoft md:col-span-2"
          />
          <textarea
            placeholder="Conteúdo"
            value={post.content}
            onChange={(event) =>
              setPost({ ...post, content: event.target.value })
            }
            className="min-h-[200px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-bpBlackSoft md:col-span-2"
          />
          {message ? (
            <p className="text-xs text-bpPink md:col-span-2">{message}</p>
          ) : null}
          <div className="flex flex-wrap gap-3 md:col-span-2">
            <LuxuryButton tone="retail" size="lg" type="submit">
              Salvar alterações
            </LuxuryButton>
            <LuxuryButton tone="retail" variant="outline" size="lg" href="/admin/diario">
              Cancelar
            </LuxuryButton>
          </div>
        </form>

        <DiaryPreview
          title={post.title}
          subtitle={post.subtitle}
          content={post.content}
        />
      </div>
    </div>
  );
}
