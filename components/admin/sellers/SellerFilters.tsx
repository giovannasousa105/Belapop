"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { SellerCard, type SellerCardData } from "@/components/admin/sellers/SellerCard";

type Props = {
  sellers: SellerCardData[];
  initialQuery?: string;
  initialStatus?: string;
  initialTier?: string;
};

export function SellerFilters({ sellers, initialQuery = "", initialStatus = "", initialTier = "" }: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState(initialStatus);
  const [tier, setTier] = useState(initialTier);

  const visibleSellers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return sellers.filter((seller) => {
      const matchesQuery = !normalizedQuery || seller.name.toLowerCase().includes(normalizedQuery);
      const matchesStatus = !status || seller.status === status;
      const matchesTier = !tier || seller.tier === tier;
      return matchesQuery && matchesStatus && matchesTier;
    });
  }, [query, sellers, status, tier]);

  return (
    <>
      <section className="flex flex-wrap items-center gap-3 border-y border-[rgba(139,94,60,0.07)] bg-white px-8 py-4">
        <div className="relative min-w-[240px] flex-1">
          <Search
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9E9589]"
            strokeWidth={1.8}
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar..."
            className="w-full rounded-xl border border-[rgba(139,94,60,0.14)] bg-[#FAFAF8] py-3 pl-11 pr-4 text-[13px] text-[#1A1714] outline-none transition placeholder:text-[#9E9589] focus:border-[rgba(139,94,60,0.30)]"
          />
        </div>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="rounded-xl border border-[rgba(139,94,60,0.14)] bg-white px-4 py-3 text-[13px] text-[#6B5E54] outline-none"
        >
          <option value="">Status</option>
          <option value="ativo">Ativo</option>
          <option value="em-revisao">Em Revisao</option>
          <option value="pendente">Pendente</option>
          <option value="bloqueado">Bloqueado</option>
        </select>
        <select
          value={tier}
          onChange={(event) => setTier(event.target.value)}
          className="rounded-xl border border-[rgba(139,94,60,0.14)] bg-white px-4 py-3 text-[13px] text-[#6B5E54] outline-none"
        >
          <option value="">Nivel</option>
          <option value="newcomer">Newcomer</option>
          <option value="rising-star">Rising Star</option>
          <option value="elite-curator">Elite Curator</option>
        </select>
        <button
          type="button"
          className="rounded-xl bg-[#8B5E3C] px-5 py-3 text-[13px] font-semibold text-white transition hover:bg-[#7A5234]"
        >
          + Convidar Seller
        </button>
      </section>

      <section className="grid grid-cols-1 gap-5 px-8 py-6 lg:grid-cols-2">
        {visibleSellers.map((seller) => (
          <SellerCard key={seller.id} seller={seller} />
        ))}
      </section>
    </>
  );
}
