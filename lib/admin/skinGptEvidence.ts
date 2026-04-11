import "server-only";

import { cache } from "react";

import {
  SKINGPT_EVIDENCE_LEVELS,
  SKINGPT_EVIDENCE_SOURCE_FAMILIES,
  SKINGPT_EVIDENCE_STATUSES,
  SKINGPT_EVIDENCE_STUDY_TYPES,
  SKINGPT_EVIDENCE_TOPICS,
  type SkinGptEvidenceAdminRow
} from "@/lib/admin/skinGptEvidence.shared";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { parseEvidenceMetadata } from "@/lib/skingpt/evidence";

type DermatologyDocumentRow = {
  id: string;
  slug: string;
  title: string;
  topic_slug: string;
  body: string;
  source_label: string | null;
  source_url: string | null;
  status: string | null;
  editorial_boost: number | null;
  published_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  metadata: Record<string, unknown> | null;
};

function mapDocument(row: DermatologyDocumentRow): SkinGptEvidenceAdminRow {
  const metadata = parseEvidenceMetadata(row.metadata);
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    topicSlug: row.topic_slug,
    body: row.body,
    sourceLabel: row.source_label,
    sourceUrl: row.source_url,
    status: (row.status ?? "draft") as SkinGptEvidenceAdminRow["status"],
    editorialBoost: Number(row.editorial_boost ?? 0),
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    sourceFamily: metadata.source_family,
    studyType: metadata.study_type,
    evidenceLevel: metadata.evidence_level,
    publishedYear: metadata.published_year,
    lastReviewedAt: metadata.last_reviewed_at,
    tags: metadata.tags
  };
}

async function loadSkinGptEvidenceAdminData() {
  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("dermatology_documents")
    .select("id,slug,title,topic_slug,body,source_label,source_url,status,editorial_boost,published_at,created_at,updated_at,metadata")
    .order("status", { ascending: true })
    .order("topic_slug", { ascending: true })
    .order("editorial_boost", { ascending: false })
    .order("updated_at", { ascending: false });

  if (error) throw error;

  return {
    documents: ((data ?? []) as DermatologyDocumentRow[]).map(mapDocument),
    options: {
      statuses: [...SKINGPT_EVIDENCE_STATUSES],
      topics: [...SKINGPT_EVIDENCE_TOPICS],
      sourceFamilies: [...SKINGPT_EVIDENCE_SOURCE_FAMILIES],
      studyTypes: [...SKINGPT_EVIDENCE_STUDY_TYPES],
      evidenceLevels: [...SKINGPT_EVIDENCE_LEVELS]
    }
  };
}

export const fetchSkinGptEvidenceAdminData = cache(loadSkinGptEvidenceAdminData);
export const fetchSkinGptEvidenceAdminDataUncached = loadSkinGptEvidenceAdminData;
