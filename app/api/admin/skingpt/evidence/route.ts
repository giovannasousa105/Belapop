import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { ensureAdminRequest } from "@/lib/admin/adminAuth";
import { fetchSkinGptEvidenceAdminDataUncached } from "@/lib/admin/skinGptEvidence";
import {
  SKINGPT_EVIDENCE_LEVELS,
  SKINGPT_EVIDENCE_SOURCE_FAMILIES,
  SKINGPT_EVIDENCE_STATUSES,
  SKINGPT_EVIDENCE_STUDY_TYPES,
  SKINGPT_EVIDENCE_TOPICS,
  parseTagsInput,
  type SkinGptEvidenceStatus
} from "@/lib/admin/skinGptEvidence.shared";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const normalizeOptionalString = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const normalizeOptionalNumber = (value: unknown) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeOptionalIsoDate = (value: unknown) => {
  if (value === null) return null;
  if (typeof value !== "string" || !value.trim()) return undefined;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "invalid";
  return parsed.toISOString();
};

const normalizeStatus = (value: unknown): SkinGptEvidenceStatus | null =>
  typeof value === "string" && (SKINGPT_EVIDENCE_STATUSES as readonly string[]).includes(value)
    ? (value as SkinGptEvidenceStatus)
    : null;

const normalizeKnownOption = (value: unknown, options: readonly { key: string }[]) =>
  typeof value === "string" && options.some((item) => item.key === value) ? value : null;

const normalizeTopic = (value: unknown) =>
  typeof value === "string" && SKINGPT_EVIDENCE_TOPICS.some((item) => item.slug === value) ? value : null;

function toMetadata(body: Record<string, unknown>) {
  const sourceFamily = normalizeKnownOption(body.sourceFamily, SKINGPT_EVIDENCE_SOURCE_FAMILIES);
  const studyType = normalizeKnownOption(body.studyType, SKINGPT_EVIDENCE_STUDY_TYPES);
  const evidenceLevel = normalizeKnownOption(body.evidenceLevel, SKINGPT_EVIDENCE_LEVELS);
  const publishedYear = normalizeOptionalNumber(body.publishedYear);
  const lastReviewedAt = normalizeOptionalString(body.lastReviewedAt);
  const tags = Array.isArray(body.tags)
    ? body.tags.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim())
    : typeof body.tags === "string"
      ? parseTagsInput(body.tags)
      : [];

  return {
    source_family: sourceFamily,
    study_type: studyType,
    evidence_level: evidenceLevel,
    published_year: publishedYear,
    last_reviewed_at: lastReviewedAt,
    tags
  };
}

function revalidateEvidenceSurfaces() {
  revalidatePath("/admin/skinbela-evidence", "page");
  revalidatePath("/admin/skingpt-evidence", "page");
}

export async function GET(request: Request) {
  const auth = await ensureAdminRequest(request as any);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const data = await fetchSkinGptEvidenceAdminDataUncached();
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao carregar evidencias clinicas.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await ensureAdminRequest(request as any);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const title = normalizeOptionalString(body?.title);
  const topicSlug = normalizeTopic(body?.topicSlug);
  const textBody = normalizeOptionalString(body?.body);
  const sourceLabel = normalizeOptionalString(body?.sourceLabel);
  const sourceUrl = normalizeOptionalString(body?.sourceUrl);
  const status = normalizeStatus(body?.status) ?? "draft";
  const editorialBoost = Math.max(0, Math.min(100, normalizeOptionalNumber(body?.editorialBoost) ?? 0));
  const publishedAtInput = normalizeOptionalIsoDate(body?.publishedAt);

  if (publishedAtInput === "invalid") {
    return NextResponse.json({ error: "Data de publicacao invalida." }, { status: 400 });
  }

  const publishedAt = publishedAtInput ?? (status === "published" ? new Date().toISOString() : null);

  if (!title || !topicSlug || !textBody) {
    return NextResponse.json({ error: "Titulo, concern e resumo clinico sao obrigatorios." }, { status: 400 });
  }

  const slug = slugify(normalizeOptionalString(body?.slug) ?? title);
  if (!slug) {
    return NextResponse.json({ error: "Slug invalido." }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  const insert = await admin.from("dermatology_documents").insert({
    slug,
    title,
    topic_slug: topicSlug,
    body: textBody,
    source_label: sourceLabel,
    source_url: sourceUrl,
    status,
    editorial_boost: editorialBoost,
    published_at: publishedAt,
    metadata: toMetadata(body ?? {})
  }).select("id").single();

  if (insert.error) {
    return NextResponse.json({ error: insert.error.message }, { status: 500 });
  }

  revalidateEvidenceSurfaces();
  return NextResponse.json({ ok: true, id: insert.data.id }, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await ensureAdminRequest(request as any);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const id = normalizeOptionalString(body?.id);
  if (!id || !UUID_REGEX.test(id)) {
    return NextResponse.json({ error: "Id invalido." }, { status: 400 });
  }

  const title = normalizeOptionalString(body?.title);
  const topicSlug = normalizeTopic(body?.topicSlug);
  const textBody = normalizeOptionalString(body?.body);
  const sourceLabel = normalizeOptionalString(body?.sourceLabel);
  const sourceUrl = normalizeOptionalString(body?.sourceUrl);
  const status = normalizeStatus(body?.status);
  const editorialBoost = normalizeOptionalNumber(body?.editorialBoost);
  const publishedAt = normalizeOptionalIsoDate(body?.publishedAt);

  if (publishedAt === "invalid") {
    return NextResponse.json({ error: "Data de publicacao invalida." }, { status: 400 });
  }

  const payload: Record<string, unknown> = {
    metadata: toMetadata(body ?? {})
  };

  if (title) payload.title = title;
  if (topicSlug) payload.topic_slug = topicSlug;
  if (textBody) payload.body = textBody;
  payload.source_label = sourceLabel;
  payload.source_url = sourceUrl;
  if (status) payload.status = status;
  if (editorialBoost !== null) payload.editorial_boost = Math.max(0, Math.min(100, editorialBoost));
  if (publishedAt !== undefined) {
    payload.published_at = publishedAt;
  } else if (status === "published") {
    payload.published_at = new Date().toISOString();
  }

  const admin = getSupabaseAdminClient();
  const update = await admin.from("dermatology_documents").update(payload).eq("id", id);
  if (update.error) {
    return NextResponse.json({ error: update.error.message }, { status: 500 });
  }

  revalidateEvidenceSurfaces();
  return NextResponse.json({ ok: true, id });
}
