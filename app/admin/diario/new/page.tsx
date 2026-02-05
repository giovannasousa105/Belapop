"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { DiaryPreview } from "@/components/admin/DiaryPreview";
import { LuxuryButton } from "@/components/LuxuryButton";
import { localDiaryRepository } from "@/lib/repositories/diaryRepository";
import { DiaryPost } from "@/lib/types";
import { createId } from "@/lib/utils";

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

export default function AdminDiaryNewPage() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    slug: "",
    coverImage: "",
    content: "",
    category: "Rotina",
    tags: "",
    status: "draft"
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title || !form.subtitle || !form.content) {
      setMessage("Preencha título, subtítulo e conteúdo.");
      return;
    }
    const slug = form.slug ? slugify(form.slug) : slugify(form.title);
    if (!slug) {
      setMessage("Informe um slug válido.");
      return;
    }
    const tags = form.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    const newPost: DiaryPost = {
      id: createId("post"),
      slug,
      title: form.title,
      subtitle: form.subtitle,
      coverImage: form.coverImage || "diario-editorial",
      content: form.content,
      category: form.category as DiaryPost["category"],
      tags,
      status: form.status as "draft" | "published",
      excerpt: form.subtitle || form.content.slice(0, 120),
      updatedAt: new Date().toISOString()
    };

    localDiaryRepository.upsert(newPost);
    router.push("/admin/diario");
  };

  return (
    <div className="flex w-full flex-col gap-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-noir-500">
          Novo post
        </p>
        <h1 className="mt-2 font-display text-3xl text-noir-950">
          Criar conteúdo editorial
        </h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <form
          onSubmit={handleSubmit}
          className="grid gap-4 rounded-3xl border border-black/10 bg-white p-8 shadow-sm md:grid-cols-2"
        >
          <input
            placeholder="Título"
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-noir-900 md:col-span-2"
          />
          <input
            placeholder="Subtítulo"
            value={form.subtitle}
            onChange={(event) =>
              setForm({ ...form, subtitle: event.target.value })
            }
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-noir-900 md:col-span-2"
          />
          <input
            placeholder="Slug (opcional)"
            value={form.slug}
            onChange={(event) => setForm({ ...form, slug: event.target.value })}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-noir-900"
          />
          <input
            placeholder="Cover image (ex.: diario-ritual)"
            value={form.coverImage}
            onChange={(event) =>
              setForm({ ...form, coverImage: event.target.value })
            }
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-noir-900"
          />
          <select
            value={form.category}
            onChange={(event) =>
              setForm({ ...form, category: event.target.value })
            }
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-noir-900"
          >
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select
            value={form.status}
            onChange={(event) =>
              setForm({ ...form, status: event.target.value })
            }
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-noir-900"
          >
            <option value="draft">Rascunho</option>
            <option value="published">Publicado</option>
          </select>
          <input
            placeholder="Tags (separe por vírgula)"
            value={form.tags}
            onChange={(event) => setForm({ ...form, tags: event.target.value })}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-noir-900 md:col-span-2"
          />
          <textarea
            placeholder="Conteúdo (parágrafos separados por linha em branco)"
            value={form.content}
            onChange={(event) =>
              setForm({ ...form, content: event.target.value })
            }
            className="min-h-[200px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-noir-900 md:col-span-2"
          />
          {message ? (
            <p className="text-xs text-luxe-600 md:col-span-2">{message}</p>
          ) : null}
          <div className="flex flex-wrap gap-3 md:col-span-2">
            <LuxuryButton tone="retail" size="lg" type="submit">
              Salvar post
            </LuxuryButton>
            <LuxuryButton tone="retail" variant="outline" size="lg" href="/admin/diario">
              Cancelar
            </LuxuryButton>
          </div>
        </form>

        <DiaryPreview
          title={form.title}
          subtitle={form.subtitle}
          content={form.content}
        />
      </div>
    </div>
  );
}
