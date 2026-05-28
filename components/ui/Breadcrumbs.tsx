import Link from "next/link";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
  className?: string;
};

export function Breadcrumbs({ items, className = "" }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Caminho de navegação" className={className}>
      {/* Mobile: only show previous item */}
      <div className="md:hidden">
        {items.length >= 2 && items[items.length - 2].href ? (
          <Link
            href={items[items.length - 2].href!}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-black/50 hover:text-black"
          >
            <span aria-hidden="true">←</span>
            {items[items.length - 2].label}
          </Link>
        ) : null}
      </div>

      {/* Desktop: full breadcrumb trail */}
      <ol className="hidden md:flex md:flex-wrap md:items-center md:gap-1" aria-label="breadcrumb">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.label} className="flex items-center gap-1">
              {index > 0 && (
                <span className="text-[11px] text-black/25" aria-hidden="true">/</span>
              )}
              {isLast || !item.href ? (
                <span
                  className="text-[11px] font-semibold text-black/80"
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-[11px] text-black/45 hover:text-black"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
