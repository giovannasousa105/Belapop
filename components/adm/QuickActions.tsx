import Link from "next/link";

type QuickActionItem = {
  label: string;
  href: string;
  description?: string;
};

type QuickActionsProps = {
  title?: string;
  items: QuickActionItem[];
};

export function QuickActions({ title = "Atalhos", items }: QuickActionsProps) {
  if (items.length === 0) return null;

  return (
    <div className="rounded-2xl border border-[#ddd8ce] bg-[#faf8f3] p-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#726a61]">{title}</p>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-xl border border-[#e5e0d7] bg-white px-3 py-3 transition hover:border-[#c9c2b7]"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#2e2925]">
              {item.label}
            </p>
            {item.description ? (
              <p className="mt-1 text-xs leading-5 text-[#6f675e]">{item.description}</p>
            ) : null}
          </Link>
        ))}
      </div>
    </div>
  );
}
