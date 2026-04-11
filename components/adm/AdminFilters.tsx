"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import { startTransition, useMemo } from "react";

type Option = {
  value: string;
  label: string;
};

type AdminFiltersProps = {
  searchPlaceholder?: string;
  options?: {
    status?: Option[];
    action?: Option[];
    entity?: Option[];
    seller?: Option[];
    category?: Option[];
    period?: Option[];
    priority?: Option[];
    risk?: Option[];
    user?: Option[];
  };
  sorting?: {
    options: Option[];
    label?: string;
  };
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    pageSizeOptions?: number[];
  };
  showDateRange?: boolean;
};

const updateParam = (base: URLSearchParams, key: string, value: string) => {
  if (!value) {
    base.delete(key);
    return;
  }
  base.set(key, value);
};

function FilterField({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="min-w-0">
      <span className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--adm-text-soft)]">
        {label}
      </span>
      {children}
    </label>
  );
}

const controlClassName =
  "h-12 w-full rounded-2xl border border-[var(--adm-border)] bg-white px-4 text-sm text-[var(--adm-text)] outline-none transition focus:border-[var(--adm-border-strong)]";

export function AdminFilters({
  searchPlaceholder = "Buscar...",
  options,
  sorting,
  pagination,
  showDateRange = false
}: AdminFiltersProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const values = useMemo(
    () => ({
      q: searchParams.get("q") ?? "",
      status: searchParams.get("status") ?? "",
      action: searchParams.get("action") ?? "",
      entity: searchParams.get("entity") ?? "",
      seller: searchParams.get("seller") ?? "",
      category: searchParams.get("category") ?? "",
      period: searchParams.get("period") ?? "",
      priority: searchParams.get("priority") ?? "",
      risk: searchParams.get("risk") ?? "",
      user: searchParams.get("user") ?? "",
      from: searchParams.get("from") ?? "",
      to: searchParams.get("to") ?? "",
      page: searchParams.get("page") ?? "1",
      pageSize: searchParams.get("pageSize") ?? "10",
      sortBy: searchParams.get("sortBy") ?? "",
      sortDir: searchParams.get("sortDir") ?? "desc"
    }),
    [searchParams]
  );

  const pushParams = (key: string, value: string, resetPage = true) => {
    const params = new URLSearchParams(searchParams.toString());
    updateParam(params, key, value);
    if (resetPage && key !== "page" && key !== "pageSize") {
      params.set("page", "1");
    }

    startTransition(() => {
      const next = params.toString();
      router.replace(next ? `${pathname}?${next}` : pathname);
    });
  };

  const clearAll = () => {
    startTransition(() => {
      router.replace(pathname);
    });
  };

  return (
    <section className="rounded-[var(--adm-radius)] border border-[var(--adm-border)] bg-[var(--adm-surface-muted)] p-4 shadow-[var(--adm-shadow-micro)] sm:p-5">
      <div className="mb-4 flex items-center gap-2 text-[var(--adm-text-muted)]">
        <SlidersHorizontal className="h-4 w-4" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em]">Filtros e navegacao</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <FilterField label="Busca">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--adm-text-soft)]" />
            <input
              value={values.q}
              onChange={(event) => pushParams("q", event.target.value)}
              placeholder={searchPlaceholder}
              className={`${controlClassName} pl-11`}
            />
          </div>
        </FilterField>

        {options?.status ? (
          <FilterField label="Status">
            <select
              value={values.status}
              onChange={(event) => pushParams("status", event.target.value)}
              className={controlClassName}
            >
              <option value="">Todos</option>
              {options.status.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FilterField>
        ) : null}

        {options?.seller ? (
          <FilterField label="Seller">
            <select
              value={values.seller}
              onChange={(event) => pushParams("seller", event.target.value)}
              className={controlClassName}
            >
              <option value="">Todos</option>
              {options.seller.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FilterField>
        ) : null}

        {options?.category ? (
          <FilterField label="Categoria">
            <select
              value={values.category}
              onChange={(event) => pushParams("category", event.target.value)}
              className={controlClassName}
            >
              <option value="">Todas</option>
              {options.category.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FilterField>
        ) : null}

        {options?.period ? (
          <FilterField label="Periodo">
            <select
              value={values.period}
              onChange={(event) => pushParams("period", event.target.value)}
              className={controlClassName}
            >
              <option value="">Padrao</option>
              {options.period.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FilterField>
        ) : null}

        {options?.priority ? (
          <FilterField label="Prioridade">
            <select
              value={values.priority}
              onChange={(event) => pushParams("priority", event.target.value)}
              className={controlClassName}
            >
              <option value="">Todas</option>
              {options.priority.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FilterField>
        ) : null}

        {options?.risk ? (
          <FilterField label="Risco">
            <select
              value={values.risk}
              onChange={(event) => pushParams("risk", event.target.value)}
              className={controlClassName}
            >
              <option value="">Todos</option>
              {options.risk.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FilterField>
        ) : null}

        {options?.action ? (
          <FilterField label="Acao">
            <select
              value={values.action}
              onChange={(event) => pushParams("action", event.target.value)}
              className={controlClassName}
            >
              <option value="">Todas</option>
              {options.action.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FilterField>
        ) : null}

        {options?.entity ? (
          <FilterField label="Entidade">
            <select
              value={values.entity}
              onChange={(event) => pushParams("entity", event.target.value)}
              className={controlClassName}
            >
              <option value="">Todas</option>
              {options.entity.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FilterField>
        ) : null}

        {options?.user ? (
          <FilterField label="Usuario">
            <select
              value={values.user}
              onChange={(event) => pushParams("user", event.target.value)}
              className={controlClassName}
            >
              <option value="">Todos</option>
              {options.user.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FilterField>
        ) : null}

        {showDateRange ? (
          <FilterField label="De">
            <input
              type="date"
              value={values.from}
              onChange={(event) => pushParams("from", event.target.value)}
              className={controlClassName}
            />
          </FilterField>
        ) : null}

        {showDateRange ? (
          <FilterField label="Ate">
            <input
              type="date"
              value={values.to}
              onChange={(event) => pushParams("to", event.target.value)}
              className={controlClassName}
            />
          </FilterField>
        ) : null}

        {sorting ? (
          <FilterField label={sorting.label ?? "Ordenacao"}>
            <select
              value={values.sortBy}
              onChange={(event) => pushParams("sortBy", event.target.value)}
              className={controlClassName}
            >
              {sorting.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FilterField>
        ) : null}

        {sorting ? (
          <FilterField label="Direcao">
            <select
              value={values.sortDir}
              onChange={(event) => pushParams("sortDir", event.target.value)}
              className={controlClassName}
            >
              <option value="desc">Desc</option>
              <option value="asc">Asc</option>
            </select>
          </FilterField>
        ) : null}
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-[var(--adm-border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
        {pagination ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--adm-text-soft)]">
              {pagination.total === 0
                ? "Sem registros"
                : `${(pagination.page - 1) * pagination.pageSize + 1}-${Math.min(
                    pagination.page * pagination.pageSize,
                    pagination.total
                  )} de ${pagination.total}`}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={String(pagination.pageSize)}
                onChange={(event) => pushParams("pageSize", event.target.value, false)}
                className="h-10 rounded-2xl border border-[var(--adm-border)] bg-white px-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--adm-text)]"
              >
                {(pagination.pageSizeOptions ?? [10, 20, 50]).map((size) => (
                  <option key={size} value={size}>
                    {size}/pg
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => pushParams("page", String(Math.max(1, pagination.page - 1)), false)}
                disabled={pagination.page <= 1}
                className="rounded-full border border-[var(--adm-border)] bg-white px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--adm-text)] disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() =>
                  pushParams("page", String(Math.min(pagination.totalPages, pagination.page + 1)), false)
                }
                disabled={pagination.page >= pagination.totalPages}
                className="rounded-full border border-[var(--adm-border)] bg-white px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--adm-text)] disabled:opacity-40"
              >
                Proxima
              </button>
            </div>
          </div>
        ) : (
          <span />
        )}

        <button
          type="button"
          onClick={clearAll}
          className="rounded-full border border-[var(--adm-border)] bg-white px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--adm-text)]"
        >
          Limpar filtros
        </button>
      </div>
    </section>
  );
}
