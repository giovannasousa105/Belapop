import "server-only";

import { searchPubMed, buildPubMedUrl, type PubMedArticle } from "./pubmed";
import { searchDermatologyJournals, type CrossRefWork } from "./crossref";
import { findLocalEvidence, EVIDENCE_DATABASE, type LocalEvidence } from "./evidence-database";

// ── Re-exports ────────────────────────────────────────────────────────────────

export {
  findLocalEvidence,
  EVIDENCE_DATABASE,
  buildPubMedUrl,
};

export type { PubMedArticle, CrossRefWork, LocalEvidence };

// ── Tipos compostos ───────────────────────────────────────────────────────────

export type EvidenceForAtivo = {
  local: LocalEvidence | null;
  pubmed: PubMedArticle[];
  crossref: CrossRefWork[];
};

export type EvidenceSummary = {
  grade: "A" | "B" | "C" | null;
  fonte: string | null;
  summary: string | null;
  pubmedUrl: string | null;    // URL do primeiro PMID conhecido
  doiUrl: string | null;       // https://doi.org/{doi}
  cochraneUrl: string | null;
};

// ── Facade principal ─────────────────────────────────────────────────────────

/**
 * Retorna evidência consolidada para um ativo cosmético.
 *
 * Modo local (padrão): zero latência — apenas banco curado interno.
 * Modo remote: adiciona PubMed + CrossRef com cache de 24h no servidor.
 */
export async function getEvidenceForAtivo(
  ativo: string,
  { remote = false }: { remote?: boolean } = {}
): Promise<EvidenceForAtivo> {
  const local = findLocalEvidence(ativo) ?? null;

  if (!remote) {
    return { local, pubmed: [], crossref: [] };
  }

  const [pubmed, crossref] = await Promise.all([
    searchPubMed(`${ativo} skin cosmetic`, 3),
    searchDermatologyJournals(ativo, 2),
  ]);

  return { local, pubmed, crossref };
}

/**
 * Retorna um resumo de evidência pronto para exibição na UI.
 * Prioriza: banco local → PMIDs conhecidos → busca remota (se habilitado).
 */
export async function getEvidenceSummary(
  ativo: string,
  { remote = false }: { remote?: boolean } = {}
): Promise<EvidenceSummary> {
  const { local, pubmed } = await getEvidenceForAtivo(ativo, { remote });

  if (!local && pubmed.length === 0) {
    return { grade: null, fonte: null, summary: null, pubmedUrl: null, doiUrl: null, cochraneUrl: null };
  }

  const firstPmid = local?.pubmedIds?.[0];
  const pubmedUrl = firstPmid
    ? buildPubMedUrl(firstPmid)
    : pubmed[0]?.pubmedUrl ?? null;

  const doiUrl = local?.doi ? `https://doi.org/${local.doi}` : null;

  return {
    grade: local?.grade ?? pubmed[0]?.evidenceGrade ?? null,
    fonte: local?.fonte ?? pubmed[0]?.journal ?? null,
    summary: local?.summary ?? null,
    pubmedUrl,
    doiUrl,
    cochraneUrl: local?.cochrane ?? null,
  };
}

/**
 * Retorna evidências dos principais ativos de uma rotina.
 * Apenas banco local — sem chamadas externas, para não atrasar a análise.
 */
export function getEvidenceForRotina(
  ativosChave: string[]
): Map<string, LocalEvidence> {
  const map = new Map<string, LocalEvidence>();
  for (const ativo of ativosChave) {
    const ev = findLocalEvidence(ativo);
    if (ev) map.set(ativo, ev);
  }
  return map;
}

/**
 * Enriquece os passos de uma rotina com evidência do banco local.
 * Retorna o mesmo array com `evidencia` preenchido onde disponível.
 * Mutação segura — cria novo array sem mutar o original.
 */
export function enrichRotinaWithEvidence<
  T extends { ativosChave: string[]; evidencia?: { grau: "A" | "B" | "C"; fonte: string } }
>(passos: T[]): T[] {
  return passos.map((passo) => {
    // Já tem evidência — não sobrescrever
    if (passo.evidencia) return passo;

    // Buscar evidência para o primeiro ativo que tiver registro
    for (const ativo of passo.ativosChave) {
      const ev = findLocalEvidence(ativo);
      if (ev) {
        return { ...passo, evidencia: { grau: ev.grade, fonte: ev.fonte } };
      }
    }
    return passo;
  });
}
