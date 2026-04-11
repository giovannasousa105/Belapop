import type { ListQueryParams, SortDirection } from "@/types/adm";

export type SearchParamsInput =
  | Record<string, string | string[] | undefined>
  | URLSearchParams
  | undefined;

export type AdmFilters = {
  q?: string;
  status?: string;
  action?: string;
  entity?: string;
  campaign?: string;
  seller?: string;
  category?: string;
  period?: string;
  priority?: string;
  product?: string;
  order?: string;
  shipment?: string;
  alert?: string;
  payout?: string;
  refund?: string;
  review?: string;
  document?: string;
  user?: string;
  risk?: string;
  activity?: string;
  page?: string;
  pageSize?: string;
  sortBy?: string;
  sortDir?: SortDirection;
  from?: string;
  to?: string;
};

const readParam = (
  source: SearchParamsInput,
  key: string
): string | undefined => {
  if (!source) return undefined;
  if (source instanceof URLSearchParams) {
    const value = source.get(key);
    return value || undefined;
  }
  const value = source[key];
  if (!value) return undefined;
  if (Array.isArray(value)) return value[0];
  return value;
};

export const resolveFilters = (source: SearchParamsInput): AdmFilters => ({
  q: readParam(source, "q"),
  status: readParam(source, "status"),
  action: readParam(source, "action"),
  entity: readParam(source, "entity"),
  campaign: readParam(source, "campaign"),
  seller: readParam(source, "seller"),
  category: readParam(source, "category"),
  period: readParam(source, "period"),
  priority: readParam(source, "priority"),
  product: readParam(source, "product"),
  order: readParam(source, "order"),
  shipment: readParam(source, "shipment"),
  alert: readParam(source, "alert"),
  payout: readParam(source, "payout"),
  refund: readParam(source, "refund"),
  review: readParam(source, "review"),
  document: readParam(source, "document"),
  user: readParam(source, "user"),
  risk: readParam(source, "risk"),
  activity: readParam(source, "activity"),
  page: readParam(source, "page"),
  pageSize: readParam(source, "pageSize"),
  sortBy: readParam(source, "sortBy"),
  sortDir: readParam(source, "sortDir") as SortDirection | undefined,
  from: readParam(source, "from"),
  to: readParam(source, "to")
});

export const buildHref = (
  pathname: string,
  current: SearchParamsInput,
  updates: Partial<Record<keyof AdmFilters, string | undefined>>
): string => {
  const params = new URLSearchParams();
  const base = resolveFilters(current);
  const merged = { ...base, ...updates };

  Object.entries(merged).forEach(([key, value]) => {
    if (!value) return;
    params.set(key, value);
  });

  const query = params.toString();
  if (!query) return pathname;
  return `${pathname}?${query}`;
};

export const includesInsensitive = (value: string, query?: string) => {
  if (!query) return true;
  return value.toLowerCase().includes(query.toLowerCase());
};

const parsePositiveInt = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.floor(parsed);
};

export const toListQueryParams = (
  source: SearchParamsInput,
  defaults?: Partial<Pick<ListQueryParams, "page" | "pageSize" | "sortBy" | "sortDir">>
): ListQueryParams => {
  const filters = resolveFilters(source);
  const sortDir = filters.sortDir === "asc" || filters.sortDir === "desc" ? filters.sortDir : undefined;

  return {
    q: filters.q,
    status: filters.status,
    action: filters.action,
    entity: filters.entity,
    campaign: filters.campaign,
    seller: filters.seller,
    category: filters.category,
    period: filters.period,
    priority: filters.priority,
    risk: filters.risk,
    product: filters.product,
    order: filters.order,
    shipment: filters.shipment,
    alert: filters.alert,
    payout: filters.payout,
    refund: filters.refund,
    review: filters.review,
    document: filters.document,
    user: filters.user,
    page: parsePositiveInt(filters.page, defaults?.page ?? 1),
    pageSize: parsePositiveInt(filters.pageSize, defaults?.pageSize ?? 10),
    sortBy: filters.sortBy ?? defaults?.sortBy,
    sortDir: sortDir ?? defaults?.sortDir ?? "desc",
    dateRange:
      filters.from || filters.to
        ? {
            from: filters.from,
            to: filters.to
          }
        : undefined
  };
};

export const hasActiveFilterParams = (filters: AdmFilters) =>
  Boolean(
    filters.q ||
      filters.status ||
      filters.action ||
      filters.entity ||
      filters.campaign ||
      filters.seller ||
      filters.category ||
      filters.period ||
      filters.priority ||
      filters.risk ||
      filters.user ||
      filters.from ||
      filters.to
  );
