export type SearchSynonymRow = {
  term: string;
  synonym: string;
};

const LOCAL_SYNONYMS: Record<string, string[]> = {
  hidratante: ["creme"],
  creme: ["hidratante"],
  batom: ["lipstick"],
  lipstick: ["batom"],
  perfume: ["fragrancia"],
  fragrancia: ["perfume"],
  skincare: ["pele"],
  pele: ["skincare"]
};

export const normalizeQuery = (value: string) => {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
};

export const expandSearchTerms = (
  query: string,
  dbSynonyms: SearchSynonymRow[] = []
) => {
  const normalized = normalizeQuery(query);
  if (!normalized) return [];

  const terms = new Set<string>([normalized]);

  const local = LOCAL_SYNONYMS[normalized];
  if (local) {
    local.forEach((item) => terms.add(normalizeQuery(item)));
  }

  dbSynonyms.forEach((row) => {
    const term = normalizeQuery(row.term);
    const synonym = normalizeQuery(row.synonym);
    if (term === normalized) terms.add(synonym);
    if (synonym === normalized) terms.add(term);
  });

  return Array.from(terms).filter(Boolean);
};

export const parseListParam = (value: string | null) => {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};
