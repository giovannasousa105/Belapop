import "server-only";

import { cache } from "react";

// ── Tipos ─────────────────────────────────────────────────────────────────────

export type CrossRefWork = {
  doi: string;
  title: string;
  authors: string[];
  journal: string | null;
  year: number | null;
  url: string;
  type: string;
};

// ── Periódicos de dermatologia prioritários ───────────────────────────────────

const DERMATOLOGY_JOURNALS = [
  "Journal of Investigative Dermatology",
  "British Journal of Dermatology",
  "Journal of the American Academy of Dermatology",
  "JAMA Dermatology",
  "Dermatology",
  "International Journal of Dermatology",
  "Journal of the European Academy of Dermatology and Venereology",
  "Skin Pharmacology and Physiology",
  "Contact Dermatitis",
  "Photodermatology Photoimmunology and Photomedicine",
];

/**
 * Busca artigos em periódicos de dermatologia via CrossRef API.
 * API pública, sem chave — requer User-Agent identificável (política Crossref).
 * Resultado cacheado por 24h no servidor.
 */
export const searchDermatologyJournals = cache(async (
  query: string,
  maxResults = 3
): Promise<CrossRefWork[]> => {
  try {
    const params = new URLSearchParams({
      query: `${query} skin cosmetic dermatology`,
      rows: String(maxResults),
      filter: "type:journal-article",
      sort: "relevance",
      select: "DOI,title,author,published-print,container-title,type,URL",
    });

    const res = await fetch(
      `https://api.crossref.org/works?${params.toString()}`,
      {
        next: { revalidate: 86400 },
        headers: {
          Accept: "application/json",
          // Crossref Etiquette Policy: identificar a aplicação
          "User-Agent": "BelaPop/1.0 (https://belapopoficial.com.br; mailto:contato@belapopoficial.com.br)",
        },
      }
    );

    if (!res.ok) return [];

    const data = (await res.json()) as {
      message?: {
        items?: Array<{
          DOI?: string;
          title?: string[];
          author?: Array<{ given?: string; family?: string }>;
          "container-title"?: string[];
          "published-print"?: { "date-parts"?: number[][] };
          "published-online"?: { "date-parts"?: number[][] };
          type?: string;
          URL?: string;
        }>;
      };
    };

    const items = data.message?.items ?? [];

    // Priorizar artigos de periódicos de dermatologia conhecidos
    const sorted = [...items].sort((a, b) => {
      const aIsKnown = DERMATOLOGY_JOURNALS.some((j) =>
        a["container-title"]?.[0]?.includes(j)
      ) ? 1 : 0;
      const bIsKnown = DERMATOLOGY_JOURNALS.some((j) =>
        b["container-title"]?.[0]?.includes(j)
      ) ? 1 : 0;
      return bIsKnown - aIsKnown;
    });

    return sorted.map((item): CrossRefWork => {
      const authors = (item.author ?? []).map((a) =>
        [a.given, a.family].filter(Boolean).join(" ")
      );

      const dateParts =
        item["published-print"]?.["date-parts"]?.[0] ??
        item["published-online"]?.["date-parts"]?.[0];
      const year = dateParts?.[0] ?? null;

      const doi = item.DOI ?? "";
      return {
        doi,
        title: item.title?.[0] ?? "",
        authors: authors.slice(0, 4),
        journal: item["container-title"]?.[0] ?? null,
        year,
        url: item.URL ?? (doi ? `https://doi.org/${doi}` : ""),
        type: item.type ?? "journal-article",
      };
    });
  } catch {
    return [];
  }
});
