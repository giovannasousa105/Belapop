import "server-only";

import { cache } from "react";

// ── Tipos ─────────────────────────────────────────────────────────────────────

export type PubMedArticle = {
  pmid: string;
  title: string;
  authors: string[];
  journal: string;
  year: number | null;
  doi: string | null;
  pubType: string[];
  evidenceGrade: "A" | "B" | "C";
  pubmedUrl: string;
};

// ── Inferência de grau de evidência ──────────────────────────────────────────

function inferEvidenceGrade(pubTypes: string[]): "A" | "B" | "C" {
  const types = pubTypes.map((t) => t.toLowerCase());
  if (
    types.some(
      (t) =>
        t.includes("meta-analysis") ||
        t.includes("randomized controlled trial") ||
        t.includes("randomized clinical trial")
    )
  ) {
    return "A";
  }
  if (
    types.some(
      (t) =>
        t.includes("systematic review") ||
        t.includes("review") ||
        t.includes("clinical study")
    )
  ) {
    return "B";
  }
  return "C";
}

// ── Cliente PubMed (NCBI E-utilities) ────────────────────────────────────────

const BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";

function buildParams(params: Record<string, string>): string {
  const apiKey = process.env.NCBI_API_KEY;
  const p = new URLSearchParams({ db: "pubmed", retmode: "json", ...params });
  if (apiKey) p.set("api_key", apiKey);
  return p.toString();
}

/**
 * Busca artigos no PubMed para um ativo/ingrediente cosmético.
 * Memoizado com React `cache()` — uma chamada por ativo por request.
 * Resultado cacheado por 24h no servidor (Next.js `next.revalidate`).
 */
export const searchPubMed = cache(async (
  query: string,
  maxResults = 5
): Promise<PubMedArticle[]> => {
  try {
    // Etapa 1: esearch — obter PMIDs relevantes
    const searchTerm = `(${query}[tiab]) AND (skin[mesh] OR dermatology[mesh] OR cosmetic[tiab]) AND (clinical trial[pt] OR review[pt] OR randomized controlled trial[pt] OR meta-analysis[pt])`;
    const searchParams = buildParams({
      term: searchTerm,
      retmax: String(maxResults),
      sort: "relevance",
    });

    const searchRes = await fetch(`${BASE_URL}/esearch.fcgi?${searchParams}`, {
      next: { revalidate: 86400 },
      headers: { Accept: "application/json" },
    });

    if (!searchRes.ok) return [];

    const searchData = (await searchRes.json()) as {
      esearchresult?: { idlist?: string[] };
    };
    const ids = searchData.esearchresult?.idlist ?? [];
    if (ids.length === 0) return [];

    // Etapa 2: esummary — obter metadados dos artigos
    const summaryParams = buildParams({ id: ids.join(",") });

    const summaryRes = await fetch(`${BASE_URL}/esummary.fcgi?${summaryParams}`, {
      next: { revalidate: 86400 },
      headers: { Accept: "application/json" },
    });

    if (!summaryRes.ok) return [];

    const summaryData = (await summaryRes.json()) as {
      result?: Record<string, unknown> & { uids?: string[] };
    };

    const resultObj = summaryData.result ?? {};
    const uids: string[] = Array.isArray(resultObj.uids) ? (resultObj.uids as string[]) : ids;

    return uids.flatMap((pmid): PubMedArticle[] => {
      const article = resultObj[pmid] as Record<string, unknown> | undefined;
      if (!article || typeof article !== "object") return [];

      const pubTypes = Array.isArray(article.pubtype)
        ? (article.pubtype as string[])
        : [];

      const authors = Array.isArray(article.authors)
        ? (article.authors as Array<{ name?: string }>).map((a) => a.name ?? "").filter(Boolean)
        : [];

      const pubdate = typeof article.pubdate === "string" ? article.pubdate : "";
      const yearMatch = pubdate.match(/\d{4}/);
      const year = yearMatch ? parseInt(yearMatch[0], 10) : null;

      const articleIds = Array.isArray(article.articleids)
        ? (article.articleids as Array<{ idtype?: string; value?: string }>)
        : [];
      const doiEntry = articleIds.find((id) => id.idtype === "doi");
      const doi = doiEntry?.value ?? null;

      return [
        {
          pmid,
          title: typeof article.title === "string" ? article.title.replace(/<[^>]+>/g, "") : "",
          authors: authors.slice(0, 4), // máx 4 autores
          journal: typeof article.source === "string" ? article.source : "",
          year,
          doi,
          pubType: pubTypes,
          evidenceGrade: inferEvidenceGrade(pubTypes),
          pubmedUrl: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
        },
      ];
    });
  } catch {
    // Falha silenciosa — não quebra a análise
    return [];
  }
});

/**
 * Busca um artigo específico pelo PMID.
 * Útil para links diretos na UI quando já conhecemos o PMID.
 */
export function buildPubMedUrl(pmid: string): string {
  return `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`;
}
