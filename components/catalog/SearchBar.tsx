"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { trackEvent } from "@/lib/analytics/tracker";

export function SearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const initial = useMemo(() => sp.get("q") ?? "", [sp]);
  const [value, setValue] = useState(initial);

  function apply(next: string) {
    const params = new URLSearchParams(sp.toString());
    const normalizedQuery = next.trim();
    if (normalizedQuery) {
      params.set("q", normalizedQuery);
      void trackEvent({
        type: "search",
        metadata: {
          query: normalizedQuery,
          surface: "catalog",
          pathname
        }
      });
    }
    else params.delete("q");
    params.delete("page");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <div className="w-full">
      <label className="sr-only" htmlFor="catalog-search">
        Buscar
      </label>
      <div className="flex items-center gap-2 rounded-[24px] border border-[rgba(216,160,172,0.18)] bg-white/82 px-3 py-2 shadow-[0_10px_28px_rgba(91,49,56,0.04)] backdrop-blur">
        <input
          id="catalog-search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") apply(value);
          }}
          placeholder="Buscar por marca, produto ou efeito..."
          className="w-full bg-transparent px-1 text-sm outline-none placeholder:text-bpGraphite/45"
        />
        <button
          type="button"
          onClick={() => apply(value)}
          className="rounded-full bg-bpBlackSoft px-4 py-2 text-xs uppercase tracking-[0.22em] text-bpOffWhite transition hover:bg-bpBlack"
        >
          Buscar
        </button>
      </div>
    </div>
  );
}
