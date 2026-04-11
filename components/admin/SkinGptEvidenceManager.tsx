"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Plus, Save, Search, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  getSkinGptEvidenceTopicLabel,
  parseTagsInput,
  type SkinGptEvidenceAdminRow
} from "@/lib/admin/skinGptEvidence.shared";
import { buildEvidenceBadge, formatEvidenceCitation } from "@/lib/skingpt/evidence";

type Option = { key?: string; slug?: string; label: string };

type Props = {
  documents: SkinGptEvidenceAdminRow[];
  options: {
    statuses: string[];
    topics: Array<{ slug: string; label: string }>;
    sourceFamilies: Array<{ key: string; label: string }>;
    studyTypes: Array<{ key: string; label: string }>;
    evidenceLevels: Array<{ key: string; label: string }>;
  };
};

type Draft = SkinGptEvidenceAdminRow;

const EMPTY_DRAFT: Draft = {
  id: "",
  slug: "",
  title: "",
  topicSlug: "acne",
  body: "",
  sourceLabel: "",
  sourceUrl: "",
  status: "draft",
  editorialBoost: 0,
  publishedAt: null,
  createdAt: null,
  updatedAt: null,
  sourceFamily: "pubmed",
  studyType: "systematic_review",
  evidenceLevel: "moderate",
  publishedYear: new Date().getFullYear(),
  lastReviewedAt: new Date().toISOString().slice(0, 10),
  tags: []
};

const sortDocuments = (items: Draft[]) =>
  [...items].sort((left, right) => {
    const statusScore = left.status === right.status ? 0 : left.status === "published" ? -1 : right.status === "published" ? 1 : left.status === "draft" ? -1 : 1;
    if (statusScore !== 0) return statusScore;
    return right.editorialBoost - left.editorialBoost || String(right.updatedAt ?? "").localeCompare(String(left.updatedAt ?? ""));
  });

function statusTone(status: string) {
  if (status === "published") return "border-emerald-300/70 bg-emerald-50 text-emerald-700";
  if (status === "archived") return "border-black/10 bg-bpOffWhite text-bpGraphite";
  return "border-bpPink/25 bg-bpPinkSoft/20 text-bpBlack";
}

export default function SkinGptEvidenceManager({ documents, options }: Props) {
  const router = useRouter();
  const [isSaving, startSaving] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [topicFilter, setTopicFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [documentsState, setDocumentsState] = useState<Draft[]>(sortDocuments(documents));
  const [selectedId, setSelectedId] = useState<string | null>(documents[0]?.id ?? null);
  const [draft, setDraft] = useState<Draft>(documents[0] ?? EMPTY_DRAFT);
  const [tagsInput, setTagsInput] = useState((documents[0]?.tags ?? []).join(", "));

  useEffect(() => {
    const sorted = sortDocuments(documents);
    setDocumentsState(sorted);
    if (!selectedId && sorted[0]) {
      setSelectedId(sorted[0].id);
    }
  }, [documents, selectedId]);

  const visibleDocuments = useMemo(() => {
    const query = search.trim().toLowerCase();
    return documentsState.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (topicFilter !== "all" && item.topicSlug !== topicFilter) return false;
      if (sourceFilter !== "all" && item.sourceFamily !== sourceFilter) return false;
      if (!query) return true;
      const haystack = [item.title, item.slug, item.body, item.sourceLabel ?? "", item.sourceFamily ?? "", item.topicSlug]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [documentsState, search, statusFilter, topicFilter, sourceFilter]);

  useEffect(() => {
    if (!selectedId && visibleDocuments[0]) {
      setSelectedId(visibleDocuments[0].id);
      return;
    }
    if (selectedId && !visibleDocuments.some((item) => item.id === selectedId)) {
      setSelectedId(visibleDocuments[0]?.id ?? null);
    }
  }, [selectedId, visibleDocuments]);

  useEffect(() => {
    const selected = documentsState.find((item) => item.id === selectedId);
    if (!selected) return;
    setDraft(selected);
    setTagsInput(selected.tags.join(", "));
    setMessage(null);
  }, [selectedId, documentsState]);

  const selectedEvidenceBadge = useMemo(() => buildEvidenceBadge({
    id: draft.id || "draft",
    slug: draft.slug,
    title: draft.title,
    topic_slug: draft.topicSlug,
    body: draft.body,
    source_label: draft.sourceLabel,
    source_url: draft.sourceUrl,
    status: draft.status,
    editorial_boost: draft.editorialBoost,
    published_at: draft.publishedAt,
    metadata: {
      source_family: draft.sourceFamily,
      study_type: draft.studyType,
      evidence_level: draft.evidenceLevel,
      published_year: draft.publishedYear,
      last_reviewed_at: draft.lastReviewedAt,
      tags: draft.tags
    }
  }), [draft]);

  const save = (mode: "create" | "update") => {
    setMessage(null);
    startSaving(async () => {
      try {
        const payload = {
          id: draft.id,
          slug: draft.slug,
          title: draft.title,
          topicSlug: draft.topicSlug,
          body: draft.body,
          sourceLabel: draft.sourceLabel,
          sourceUrl: draft.sourceUrl,
          status: draft.status,
          editorialBoost: draft.editorialBoost,
          publishedAt: draft.publishedAt,
          sourceFamily: draft.sourceFamily,
          studyType: draft.studyType,
          evidenceLevel: draft.evidenceLevel,
          publishedYear: draft.publishedYear,
          lastReviewedAt: draft.lastReviewedAt,
          tags: parseTagsInput(tagsInput).join(",")
        };

        const response = await fetch("/api/admin/skingpt/evidence", {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const json = (await response.json().catch(() => null)) as { error?: string; id?: string } | null;
        if (!response.ok) throw new Error(json?.error ?? "Falha ao salvar a evidencia.");
        setMessage(mode === "create" ? "Evidencia criada." : "Evidencia atualizada.");
        router.refresh();
        if (mode === "create" && json?.id) {
          setSelectedId(json.id);
        }
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Falha ao salvar a evidencia.");
      }
    });
  };

  const startNew = () => {
    const next = { ...EMPTY_DRAFT, publishedYear: new Date().getFullYear(), lastReviewedAt: new Date().toISOString().slice(0, 10) };
    setSelectedId(null);
    setDraft(next);
    setTagsInput("");
    setMessage(null);
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[0.84fr_1.16fr]">
      <section className="space-y-4 rounded-[28px] border border-black/10 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <label className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-bpGraphite/45" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por titulo, concern ou fonte"
              className="w-full rounded-full border border-black/10 bg-bpOffWhite px-10 py-3 text-sm text-bpBlack outline-none transition focus:border-bpPink/40"
            />
          </label>
          <button
            type="button"
            onClick={startNew}
            className="inline-flex items-center gap-2 rounded-full border border-bpPink/35 bg-bpPinkSoft/20 px-4 py-3 text-xs uppercase tracking-[0.24em] text-bpBlack"
          >
            <Plus size={14} />
            Nova evidencia
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-bpBlack">
            <option value="all">Todos os status</option>
            {options.statuses.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <select value={topicFilter} onChange={(event) => setTopicFilter(event.target.value)} className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-bpBlack">
            <option value="all">Todas as concerns</option>
            {options.topics.map((topic) => (
              <option key={topic.slug} value={topic.slug}>{topic.label}</option>
            ))}
          </select>
          <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)} className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-bpBlack">
            <option value="all">Todas as fontes</option>
            {options.sourceFamilies.map((item) => (
              <option key={item.key} value={item.key}>{item.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          {visibleDocuments.map((item) => {
            const active = item.id === selectedId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedId(item.id)}
                className={`w-full rounded-[24px] border p-4 text-left transition ${active ? "border-bpPink/50 bg-bpPinkSoft/15 shadow-sm" : "border-black/8 bg-bpOffWhite/40 hover:border-bpPink/25"}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] ${statusTone(item.status)}`}>
                    {item.status}
                  </span>
                  <span className="rounded-full border border-black/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-bpGraphite/70">
                    {getSkinGptEvidenceTopicLabel(item.topicSlug)}
                  </span>
                  <span className="rounded-full border border-black/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.22em] text-bpGraphite/70">
                    boost {item.editorialBoost}
                  </span>
                </div>
                <h3 className="mt-3 font-display text-2xl text-bpBlack">{item.title}</h3>
                <p className="mt-1 text-xs uppercase tracking-[0.24em] text-bpGraphite/65">{item.sourceLabel ?? item.sourceFamily ?? "Fonte clinica"}</p>
                <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-bpGraphite/80">{item.body}</p>
              </button>
            );
          })}
          {!visibleDocuments.length ? (
            <div className="rounded-[24px] border border-dashed border-black/10 bg-bpOffWhite/40 p-6 text-sm text-bpGraphite/70">
              Nenhuma evidencia encontrada com esse filtro.
            </div>
          ) : null}
        </div>
      </section>

      <section className="space-y-5 rounded-[28px] border border-black/10 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-bpGraphite/55">Curadoria clinica do SkinBela</p>
            <h2 className="mt-2 font-display text-3xl text-bpBlack">{draft.title || "Nova evidencia"}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.24em] ${statusTone(draft.status)}`}>
              {draft.status}
            </span>
            <span className="rounded-full border border-black/10 bg-bpOffWhite px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-bpGraphite">
              {selectedEvidenceBadge.sourceFamily}
            </span>
            <span className="rounded-full border border-black/10 bg-bpOffWhite px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-bpGraphite">
              {selectedEvidenceBadge.evidenceLevel ?? "sem nivel"}
            </span>
          </div>
        </div>

        <div className="rounded-[24px] border border-black/8 bg-bpOffWhite/50 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-1 h-5 w-5 text-bpPink" />
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-[0.24em] text-bpGraphite/60">Como o SkinBela le</p>
              <p className="text-sm leading-relaxed text-bpGraphite/82">Publicado e curado entra no ranking. Rascunho nao aparece para o usuario. O boost editorial desempata, mas nao atropela a hierarquia de evidencia.</p>
              <p className="text-xs text-bpGraphite/70">{draft.title ? formatEvidenceCitation({
                id: draft.id || "draft",
                slug: draft.slug,
                title: draft.title,
                topic_slug: draft.topicSlug,
                body: draft.body,
                source_label: draft.sourceLabel,
                source_url: draft.sourceUrl,
                status: draft.status,
                editorial_boost: draft.editorialBoost,
                published_at: draft.publishedAt,
                metadata: {
                  source_family: draft.sourceFamily,
                  study_type: draft.studyType,
                  evidence_level: draft.evidenceLevel,
                  published_year: draft.publishedYear,
                  last_reviewed_at: draft.lastReviewedAt,
                  tags: draft.tags
                }
              }) : "Preencha a evidencia para gerar a citacao."}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.22em] text-bpGraphite/65">Titulo</span>
            <input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-bpBlack" />
          </label>
          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.22em] text-bpGraphite/65">Slug</span>
            <input value={draft.slug} onChange={(event) => setDraft((current) => ({ ...current, slug: event.target.value }))} className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-bpBlack" />
          </label>
          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.22em] text-bpGraphite/65">Concern</span>
            <select value={draft.topicSlug} onChange={(event) => setDraft((current) => ({ ...current, topicSlug: event.target.value }))} className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-bpBlack">
              {options.topics.map((topic) => (
                <option key={topic.slug} value={topic.slug}>{topic.label}</option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.22em] text-bpGraphite/65">Status</span>
            <select value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value as Draft["status"] }))} className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-bpBlack">
              {options.statuses.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.22em] text-bpGraphite/65">Fonte</span>
            <input value={draft.sourceLabel ?? ""} onChange={(event) => setDraft((current) => ({ ...current, sourceLabel: event.target.value }))} className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-bpBlack" />
          </label>
          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.22em] text-bpGraphite/65">URL</span>
            <input value={draft.sourceUrl ?? ""} onChange={(event) => setDraft((current) => ({ ...current, sourceUrl: event.target.value }))} className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-bpBlack" />
          </label>
          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.22em] text-bpGraphite/65">Familia da fonte</span>
            <select value={draft.sourceFamily ?? ""} onChange={(event) => setDraft((current) => ({ ...current, sourceFamily: event.target.value }))} className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-bpBlack">
              {options.sourceFamilies.map((item) => (
                <option key={item.key} value={item.key}>{item.label}</option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.22em] text-bpGraphite/65">Tipo de estudo</span>
            <select value={draft.studyType ?? ""} onChange={(event) => setDraft((current) => ({ ...current, studyType: event.target.value }))} className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-bpBlack">
              {options.studyTypes.map((item) => (
                <option key={item.key} value={item.key}>{item.label}</option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.22em] text-bpGraphite/65">Nivel de evidencia</span>
            <select value={draft.evidenceLevel ?? ""} onChange={(event) => setDraft((current) => ({ ...current, evidenceLevel: event.target.value }))} className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-bpBlack">
              {options.evidenceLevels.map((item) => (
                <option key={item.key} value={item.key}>{item.label}</option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.22em] text-bpGraphite/65">Ano</span>
            <input type="number" value={draft.publishedYear ?? ""} onChange={(event) => setDraft((current) => ({ ...current, publishedYear: event.target.value ? Number(event.target.value) : null }))} className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-bpBlack" />
          </label>
          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.22em] text-bpGraphite/65">Ultima revisao</span>
            <input type="date" value={draft.lastReviewedAt ? draft.lastReviewedAt.slice(0, 10) : ""} onChange={(event) => setDraft((current) => ({ ...current, lastReviewedAt: event.target.value || null }))} className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-bpBlack" />
          </label>
          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.22em] text-bpGraphite/65">Publicado em</span>
            <input
              type="date"
              value={draft.publishedAt ? draft.publishedAt.slice(0, 10) : ""}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  publishedAt: event.target.value ? new Date(`${event.target.value}T00:00:00Z`).toISOString() : null
                }))
              }
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-bpBlack"
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.22em] text-bpGraphite/65">Boost editorial</span>
            <input type="number" min={0} max={100} value={draft.editorialBoost} onChange={(event) => setDraft((current) => ({ ...current, editorialBoost: Number(event.target.value || 0) }))} className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-bpBlack" />
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-xs uppercase tracking-[0.22em] text-bpGraphite/65">Tags</span>
            <input value={tagsInput} onChange={(event) => setTagsInput(event.target.value)} placeholder="acne, barreira, retinoide" className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-bpBlack" />
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-xs uppercase tracking-[0.22em] text-bpGraphite/65">Resumo clinico traduzido</span>
            <textarea value={draft.body} onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))} className="min-h-[220px] w-full rounded-[24px] border border-black/10 bg-white px-4 py-3 text-sm leading-relaxed text-bpBlack" />
          </label>
        </div>

        {message ? <p className="text-sm text-bpPink">{message}</p> : null}

        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => save(draft.id ? "update" : "create")} disabled={isSaving} className="inline-flex items-center gap-2 rounded-full bg-bpPink px-5 py-3 text-xs uppercase tracking-[0.26em] text-white shadow-sm disabled:opacity-60">
            <Save size={14} />
            {isSaving ? "Salvando..." : draft.id ? "Salvar evidencia" : "Criar evidencia"}
          </button>
        </div>
      </section>
    </div>
  );
}

