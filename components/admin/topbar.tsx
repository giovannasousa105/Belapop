"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import LogoutButton from "@/components/LogoutButton";
import PortalBackButton from "@/components/navigation/PortalBackButton";
import PortalRoleSwitcher from "@/components/PortalRoleSwitcher";
import type { Range } from "@/lib/admin/metrics-types";

export default function Topbar({
  updatedAtLabel,
  selectedRange
}: {
  updatedAtLabel: string;
  selectedRange: Range;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const quickRanges: Array<{ key: Range; label: string }> = [
    { key: "today", label: "Hoje" },
    { key: "7d", label: "7d" },
    { key: "30d", label: "30d" },
    { key: "90d", label: "90d" }
  ];

  const updateRange = (nextRange: Range) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", nextRange);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="pl-12 lg:pl-0">
          <PortalBackButton fallbackHref="/" className="mb-3" />
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Operacao BelaPop</p>
          <h1 className="text-lg font-semibold text-slate-900">Executive Control Tower</h1>
          <p className="text-xs text-slate-500">Atualizado em {updatedAtLabel}</p>
        </div>

        <div className="flex w-full flex-col gap-2 lg:w-auto">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
              {quickRanges.map((range) => (
                <button
                  key={range.key}
                  type="button"
                  onClick={() => updateRange(range.key)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    selectedRange === range.key
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>

            <Link
              href="/admin/orders"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
            >
              Ver pedidos
            </Link>

            <Link
              href="/admin/marketing"
              className="rounded-xl bg-slate-900 px-3 py-2 text-sm text-white transition hover:bg-slate-800"
            >
              Criar anuncio
            </Link>

            <PortalRoleSwitcher variant="light" compact />

            <LogoutButton
              redirectTo="/admin/login"
              className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Sair
            </LogoutButton>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select className="min-w-[170px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 sm:min-w-[190px]">
              <option>Todos os canais</option>
              <option>Marketplace</option>
              <option>Site</option>
              <option>App</option>
            </select>

            <select className="min-w-[170px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 sm:min-w-[190px]">
              <option>Todas as regioes</option>
              <option>Sudeste</option>
              <option>Sul</option>
              <option>Nordeste</option>
            </select>

            <select className="min-w-[170px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 sm:min-w-[190px]">
              <option>Todas as lojas</option>
              <option>Loja premium</option>
              <option>Loja ativa</option>
            </select>
          </div>
        </div>

      </div>
    </header>
  );
}
