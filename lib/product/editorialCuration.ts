type EditorialSortable = {
  id: string;
  slug?: string | null;
  title?: string | null;
  name?: string | null;
  publishedAt?: string | null;
  created_at?: string | null;
  createdAt?: string | null;
};

export const CURATION_PRIORITY_SLUGS = [
  "oleo-capilar-nuit",
  "blush-veu-rose",
  "creme-barrier-celeste",
  "serum-radiance-01",
  "patch-olhos-aurora",
  "gel-limpeza-veludo",
  "lip-tint-atelier",
  "mascara-lumiere",
  "body-mist-rosa-profundo",
  "velas-calm-02",
  "cha-botanical-calm",
  "escova-ritual-zen"
];

type SortOptions = {
  priorityIds?: string[] | null;
};

export function sortByEditorialCuration<T extends EditorialSortable>(items: T[], options: SortOptions = {}) {
  const priorityIds = options.priorityIds?.filter(Boolean) ?? [];
  const idPriority =
    priorityIds.length > 0
      ? new Map(priorityIds.map((productId, index) => [productId, index]))
      : null;
  const slugPriority =
    idPriority === null
      ? new Map(CURATION_PRIORITY_SLUGS.map((slug, index) => [slug, index]))
      : null;

  return [...items].sort((left, right) => {
    const leftPriority =
      idPriority?.get(left.id) ??
      slugPriority?.get(left.slug ?? "") ??
      Number.MAX_SAFE_INTEGER;
    const rightPriority =
      idPriority?.get(right.id) ??
      slugPriority?.get(right.slug ?? "") ??
      Number.MAX_SAFE_INTEGER;

    if (leftPriority !== rightPriority) {
      return leftPriority - rightPriority;
    }

    const leftDate = Date.parse(String(left.publishedAt ?? left.created_at ?? left.createdAt ?? ""));
    const rightDate = Date.parse(String(right.publishedAt ?? right.created_at ?? right.createdAt ?? ""));

    if (Number.isFinite(leftDate) && Number.isFinite(rightDate) && leftDate !== rightDate) {
      return rightDate - leftDate;
    }

    const leftTitle = left.title ?? left.name ?? "";
    const rightTitle = right.title ?? right.name ?? "";
    return leftTitle.localeCompare(rightTitle, "pt-BR");
  });
}
