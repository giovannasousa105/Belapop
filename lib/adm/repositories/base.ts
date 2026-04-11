import type {
  DateRange,
  DetailResponse,
  FilterOption,
  ListQueryParams,
  ListResponse,
  PaginatedResult,
  SortDirection
} from "@/types/adm";

export type NormalizedListQuery = ListQueryParams & {
  page: number;
  pageSize: number;
  sortDir: SortDirection;
};

type NormalizeOptions = {
  defaultPage?: number;
  defaultPageSize?: number;
  maxPageSize?: number;
  defaultSortBy?: string;
  defaultSortDir?: SortDirection;
};

type Comparable = string | number | boolean | Date | null | undefined;

const toComparableNumber = (value: Comparable): number | string => {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "boolean") return value ? 1 : 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const asDate = Date.parse(value);
    if (!Number.isNaN(asDate) && /\d{4}-\d{2}-\d{2}/.test(value)) return asDate;
    return value.toLocaleLowerCase();
  }
  return "";
};

const toPositiveInt = (value: number | undefined, fallback: number) => {
  if (!value || !Number.isFinite(value) || value < 1) return fallback;
  return Math.floor(value);
};

export const normalizeListQuery = (
  params: ListQueryParams,
  options?: NormalizeOptions
): NormalizedListQuery => {
  const defaultPage = options?.defaultPage ?? 1;
  const defaultPageSize = options?.defaultPageSize ?? 10;
  const maxPageSize = options?.maxPageSize ?? 50;
  const page = toPositiveInt(params.page, defaultPage);
  const pageSize = Math.min(toPositiveInt(params.pageSize, defaultPageSize), maxPageSize);

  return {
    ...params,
    page,
    pageSize,
    sortBy: params.sortBy ?? options?.defaultSortBy,
    sortDir: params.sortDir ?? options?.defaultSortDir ?? "desc"
  };
};

export const includesQuery = (value: string, query?: string) => {
  if (!query) return true;
  return value.toLocaleLowerCase().includes(query.toLocaleLowerCase());
};

export const applySearch = <T>(
  rows: T[],
  query: string | undefined,
  mapper: (row: T) => string
) => {
  if (!query) return rows;
  return rows.filter((row) => includesQuery(mapper(row), query));
};

const normalizeDateValue = (value: string | Date | undefined | null) => {
  if (!value) return null;
  const normalized = value instanceof Date ? value : new Date(value);
  return Number.isNaN(normalized.getTime()) ? null : normalized;
};

export const applyDateRange = <T>(
  rows: T[],
  dateRange: DateRange | undefined,
  accessor: (row: T) => string | Date | undefined | null
) => {
  if (!dateRange?.from && !dateRange?.to) return rows;

  const fromDate = normalizeDateValue(dateRange.from ? `${dateRange.from}T00:00:00.000Z` : null);
  const toDate = normalizeDateValue(dateRange.to ? `${dateRange.to}T23:59:59.999Z` : null);

  return rows.filter((row) => {
    const currentDate = normalizeDateValue(accessor(row));
    if (!currentDate) return false;
    if (fromDate && currentDate < fromDate) return false;
    if (toDate && currentDate > toDate) return false;
    return true;
  });
};

export const applySort = <T>(
  rows: T[],
  sortBy: string | undefined,
  sortDir: SortDirection,
  accessors: Record<string, (row: T) => Comparable>
) => {
  if (!sortBy) return rows;
  const accessor = accessors[sortBy];
  if (!accessor) return rows;

  const sorted = [...rows].sort((left, right) => {
    const leftValue = toComparableNumber(accessor(left));
    const rightValue = toComparableNumber(accessor(right));

    if (leftValue < rightValue) return -1;
    if (leftValue > rightValue) return 1;
    return 0;
  });

  return sortDir === "asc" ? sorted : sorted.reverse();
};

export const paginate = <T>(rows: T[], page: number, pageSize: number): PaginatedResult<T> => {
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const normalizedPage = Math.min(page, totalPages);
  const start = (normalizedPage - 1) * pageSize;
  const end = start + pageSize;

  return {
    items: rows.slice(start, end),
    meta: {
      page: normalizedPage,
      pageSize,
      total,
      totalPages,
      hasPreviousPage: normalizedPage > 1,
      hasNextPage: normalizedPage < totalPages
    }
  };
};

export const toListResponse = <T>(
  rows: T[],
  page: number,
  pageSize: number,
  partial?: boolean
): ListResponse<T> => ({
  success: true,
  data: paginate(rows, page, pageSize),
  partial
});

export const toListError = <T>(code: string, message: string): ListResponse<T> => ({
  success: false,
  data: paginate([], 1, 10),
  error: { code, message }
});

export const toDetailResponse = <T>(data: T | null, partial?: boolean): DetailResponse<T> => ({
  success: true,
  data,
  partial
});

export const toDetailError = <T>(code: string, message: string): DetailResponse<T> => ({
  success: false,
  data: null,
  error: { code, message }
});

export const toOptions = (entries: Array<{ value: string; label?: string }>): FilterOption[] =>
  Array.from(new Map(entries.map((entry) => [entry.value, entry.label ?? entry.value]))).map(
    ([value, label]) => ({
      value,
      label
    })
  );
