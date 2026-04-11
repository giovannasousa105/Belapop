import Link from "next/link";

import { StatusBadge } from "@/components/adm/StatusBadge";
import type { AdminVisualStatus } from "@/types/adm";

export type PriorityItem = {
  id: string;
  title: string;
  detail: string;
  status: AdminVisualStatus;
  href: string;
};

type PriorityListProps = {
  items: PriorityItem[];
};

export function PriorityList({ items }: PriorityListProps) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          className="block rounded-2xl border border-[#d8d4cc] bg-white px-4 py-3 transition hover:border-[#b6b0a6]"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-[#2c2824]">{item.title}</p>
            <StatusBadge status={item.status} />
          </div>
          <p className="mt-2 text-xs text-[#726b62]">{item.detail}</p>
        </Link>
      ))}
    </div>
  );
}
