import type { ReactNode } from "react";

type Column<T> = {
  id: string;
  label: string;
  className?: string;
  mobileLabel?: string;
  mobileHidden?: boolean;
  render: (row: T) => ReactNode;
};

type AdminTableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  rowClassName?: (row: T) => string | undefined;
};

export function AdminTable<T>({ columns, rows, rowKey, rowClassName }: AdminTableProps<T>) {
  const [primaryColumn, ...secondaryColumns] = columns;

  return (
    <>
      <div className="space-y-4 md:hidden">
        {rows.map((row) => (
          <article
            key={rowKey(row)}
            className={[
              "rounded-[var(--adm-radius)] border border-[var(--adm-border)] bg-[var(--adm-surface)] p-5 shadow-[var(--adm-shadow-micro)]",
              rowClassName?.(row)
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {primaryColumn ? <div>{primaryColumn.render(row)}</div> : null}
            <div className="mt-4 space-y-3 border-t border-[var(--adm-border)] pt-4">
              {secondaryColumns
                .filter((column) => !column.mobileHidden)
                .map((column) => (
                  <div key={column.id} className="flex items-start justify-between gap-4">
                    <span className="pt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--adm-text-soft)]">
                      {column.mobileLabel ?? column.label}
                    </span>
                    <div className="min-w-0 flex-1 text-right text-sm text-[var(--adm-text)]">
                      {column.render(row)}
                    </div>
                  </div>
                ))}
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-[var(--adm-radius)] border border-[var(--adm-border)] bg-[var(--adm-surface)] shadow-[var(--adm-shadow-micro)] md:block">
        <table className="min-w-full text-left">
          <thead className="bg-[var(--adm-surface-muted)]">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.id}
                  className={`px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--adm-text-soft)] ${column.className ?? ""}`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                className={[
                  "border-t border-[rgba(177,179,169,0.14)] align-top text-sm text-[var(--adm-text)] transition hover:bg-[rgba(245,244,237,0.55)]",
                  rowClassName?.(row)
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {columns.map((column) => (
                  <td key={column.id} className={`px-6 py-5 ${column.className ?? ""}`}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
