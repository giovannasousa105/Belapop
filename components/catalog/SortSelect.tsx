"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const options = [
  { value: "featured", label: "Recomendados" },
  { value: "new", label: "Novidades" },
  { value: "price_asc", label: "Menor preco" },
  { value: "price_desc", label: "Maior preco" }
];

export function SortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const value = sp.get("sort") ?? "featured";

  return (
    <div className="flex items-center justify-end">
      <label className="sr-only" htmlFor="sort">
        Ordenar
      </label>
      <select
        id="sort"
        value={value}
        onChange={(e) => {
          const params = new URLSearchParams(sp.toString());
          params.set("sort", e.target.value);
          router.push(`${pathname}?${params.toString()}`);
        }}
        className="rounded-[22px] border border-[rgba(216,160,172,0.18)] bg-white/82 px-4 py-2 text-xs uppercase tracking-[0.22em] text-bpBlack shadow-[0_10px_28px_rgba(91,49,56,0.04)] outline-none backdrop-blur"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
