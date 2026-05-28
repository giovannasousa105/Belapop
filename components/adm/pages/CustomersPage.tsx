import Link from "next/link";
import { Cormorant_Garamond } from "next/font/google";
import { Search, Filter } from "lucide-react";

import { FinanceSidebar } from "@/components/admin/financeiro/FinanceSidebar";
import { StatusBadge } from "@/components/adm/StatusBadge";
import { customersRepository, optionsRepository } from "@/lib/adm/repositories";
import { formatCurrency } from "@/lib/adm/format";
import { hasActiveFilterParams, toListQueryParams, type AdmFilters } from "@/lib/adm/url";
import type { Customer } from "@/types/adm";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

type CustomersPageProps = {
  filters: AdmFilters;
};

const sortOptions = [
  { value: "ltv", label: "LTV" },
  { value: "name", label: "Nome" },
  { value: "openTickets", label: "Tickets" },
  { value: "status", label: "Status" },
];

const segmentConfig = {
  premium: { label: "✦ Premium", color: "#4A2800", bg: "linear-gradient(135deg,#F5D0A9,#E8C4A0)" },
  standard: { label: "Standard", color: "#374151", bg: "#F3F4F6" },
};

const customerStatusConfig: Record<string, { label: string; color: string; bg: string }> = {
  destaque: { label: "✦ Destaque", color: "#4A2800", bg: "linear-gradient(135deg,#F5D0A9,#E8C4A0)" },
  premium:  { label: "★ Premium",  color: "#4A2800", bg: "#FDE8D0" },
  aprovado: { label: "Aprovado",   color: "#065F46", bg: "#D1FAE5" },
  alerta:   { label: "⚠ Alerta",  color: "#92400E", bg: "#FEF3C7" },
  critico:  { label: "🔴 Crítico", color: "#7F1D1D", bg: "#FEE2E2" },
  bloqueado:{ label: "Bloqueado",  color: "#374151", bg: "#F3F4F6" },
};

function CustomerAvatar({ name, size = 52 }: { name: string; size?: number }) {
  const initials = name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const palettes: [string, string][] = [
    ["#F5D0A9", "#7A5234"],
    ["#D4E4FF", "#1E3A8A"],
    ["#D1FAE5", "#065F46"],
    ["#FDE8FF", "#6B21A8"],
  ];
  const [bg, text] = palettes[name.charCodeAt(0) % palettes.length];
  return (
    <span
      className={`${cormorant.className} inline-flex shrink-0 items-center justify-center rounded-xl font-bold`}
      style={{ width: size, height: size, background: bg, color: text, fontSize: size * 0.34 }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

function CustomerCard({ customer }: { customer: Customer }) {
  const isAlert = customer.status?.toLowerCase() === "alerta";
  const segCfg = segmentConfig[customer.segment] ?? segmentConfig.standard;
  const stCfg = customerStatusConfig[customer.status?.toLowerCase() ?? ""] ?? {
    label: customer.status,
    color: "#374151",
    bg: "#F3F4F6",
  };

  return (
    <article
      className={`flex flex-col gap-4 rounded-2xl border bg-white p-5 shadow-[0_4px_16px_rgba(28,26,24,0.04)] transition-all hover:-translate-y-0.5 hover:border-[rgba(139,94,60,0.28)] hover:shadow-[0_8px_28px_rgba(28,26,24,0.08)] ${
        isAlert
          ? "border-l-[3px] border-l-[#F59E0B] border-[rgba(139,94,60,0.14)]"
          : "border-[rgba(139,94,60,0.14)]"
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-3.5">
        <CustomerAvatar name={customer.name} size={52} />
        <div className="min-w-0">
          <h3 className={`${cormorant.className} text-[18px] font-semibold leading-tight text-[#1A1714]`}>
            {customer.name}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {/* Status badge */}
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{ color: stCfg.color, background: stCfg.bg }}
            >
              {stCfg.label}
            </span>
            {/* Segment chip */}
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{ color: segCfg.color, background: segCfg.bg }}
            >
              {segCfg.label}
            </span>
          </div>
        </div>
      </div>

      {/* LTV */}
      <div className="flex items-center justify-between border-y border-[rgba(139,94,60,0.08)] py-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.10em] text-[#9E9589]">
          LTV Total
        </span>
        <span
          className={`${cormorant.className} text-[22px] font-bold leading-none text-[#1A1714]`}
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {formatCurrency(customer.ltv)}
        </span>
      </div>

      {/* ID */}
      <div>
        <code className="rounded-md bg-[#F4F1EE] px-2 py-1 font-mono text-[11px] text-[#9E9589]">
          {customer.id}
        </code>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Link
          href={`/adm/operacao/pedidos-criticos?q=${encodeURIComponent(customer.name)}`}
          className="flex-1 rounded-[10px] bg-[#8B5E3C] py-2 text-center text-[12px] font-semibold text-white transition-all hover:bg-[#7A5234] hover:shadow-[0_4px_12px_rgba(139,94,60,0.3)]"
        >
          Ver Pedidos
        </Link>
        <Link
          href={`/adm/catalogo-marca/reviews?q=${encodeURIComponent(customer.name)}`}
          className="rounded-[10px] border border-[rgba(139,94,60,0.20)] px-4 py-2 text-[12px] font-medium text-[#6B5E54] transition-all hover:border-[#8B5E3C] hover:text-[#8B5E3C]"
        >
          Reviews
        </Link>
      </div>
    </article>
  );
}

export function CustomersPage({ filters }: CustomersPageProps) {
  const query = toListQueryParams(filters, {
    page: 1,
    pageSize: 10,
    sortBy: "ltv",
    sortDir: "desc",
  });

  const listResult = customersRepository.listCustomers(query);
  if (!listResult.success) {
    return (
      <div className="min-h-screen bg-[#FAFAF8]">
        <FinanceSidebar activeHref="/adm/relacionamento/clientes" />
        <main className="pl-[220px] flex items-center justify-center min-h-screen">
          <p className="text-[#9E9589]">Erro ao carregar clientes.</p>
        </main>
      </div>
    );
  }

  const rows = listResult.data.items;
  const premiumCount = rows.filter((r) => r.segment === "premium").length;
  const standardCount = rows.filter((r) => r.segment === "standard").length;
  const hasActiveFilters = hasActiveFilterParams(filters);

  // Segment filter from query
  const segFilter = (filters as Record<string, unknown>).segment as string | undefined;
  const displayRows = segFilter
    ? rows.filter((r) => r.segment === segFilter)
    : rows;

  const segTabs = [
    { label: "Todos", count: rows.length, value: undefined },
    { label: "Premium", count: premiumCount, value: "premium" },
    { label: "Standard", count: standardCount, value: "standard" },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#1A1714]">
      <FinanceSidebar activeHref="/adm/relacionamento/clientes" />

      <main className="pl-[220px]">
        {/* Header */}
        <header className="sticky top-0 z-20 border-b border-[rgba(139,94,60,0.10)] bg-[#FAFAF8]/90 px-10 py-5 backdrop-blur-md">
          <div className="flex items-center justify-between gap-6">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9E9589]">
                Módulo Relacionamento
              </p>
              <h1 className={`${cormorant.className} text-[28px] font-medium leading-tight tracking-[-0.02em] text-[#1A1714]`}>
                Clientes
              </h1>
              <p className="mt-0.5 text-[11px] text-[#9E9589]">
                {rows.length} cliente{rows.length !== 1 ? "s" : ""} no sistema
              </p>
            </div>
          </div>
        </header>

        <div className="px-10 py-8 space-y-6">
          {/* Filter bar */}
          <section className="flex items-center gap-3">
            <div className="group relative flex-1">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9E9589] transition-colors group-focus-within:text-[#8B5E3C]"
                strokeWidth={1.8}
              />
              <input
                type="text"
                defaultValue={filters.q}
                placeholder="Buscar cliente por nome ou segmento..."
                className="w-full rounded-xl border border-[rgba(139,94,60,0.14)] bg-white py-3 pl-11 pr-4 text-[13px] text-[#1A1714] outline-none transition focus:border-[rgba(139,94,60,0.30)] focus:ring-1 focus:ring-[rgba(139,94,60,0.20)] placeholder:text-[#9E9589]"
              />
            </div>
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl border border-[rgba(139,94,60,0.14)] bg-white px-5 py-3 text-[12px] font-semibold text-[#6B5E54] transition-colors hover:bg-[rgba(139,94,60,0.04)]"
            >
              <Filter className="h-4 w-4" strokeWidth={1.8} />
              Filtros
              {hasActiveFilters && (
                <span className="h-2 w-2 rounded-full bg-[#8B5E3C]" />
              )}
            </button>
            <div className="flex items-center gap-2 rounded-xl border border-[rgba(139,94,60,0.14)] bg-white px-4 py-3 text-[12px] text-[#6B5E54]">
              <span className="font-medium">Ordenar:</span>
              <select className="bg-transparent text-[#1A1714] outline-none">
                {sortOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </section>

          {/* Segment tabs */}
          <div className="flex gap-1 overflow-x-auto">
            {segTabs.map((tab) => {
              const active = segFilter === tab.value;
              return (
                <Link
                  key={String(tab.value ?? "todos")}
                  href={tab.value ? `/adm/relacionamento/clientes?segment=${tab.value}` : "/adm/relacionamento/clientes"}
                  className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-[12px] font-medium transition-all ${
                    active
                      ? "bg-[#8B5E3C] text-white shadow-[0_2px_8px_rgba(139,94,60,0.25)]"
                      : "border border-[rgba(139,94,60,0.14)] bg-white text-[#6B5E54] hover:bg-[rgba(139,94,60,0.04)]"
                  }`}
                >
                  {tab.label}
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${active ? "bg-white/20 text-white" : "bg-[rgba(139,94,60,0.08)] text-[#8B5E3C]"}`}>
                    {tab.count}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Customer cards grid */}
          {displayRows.length === 0 ? (
            <div className="rounded-2xl border border-[rgba(139,94,60,0.14)] bg-white py-16 text-center text-[13px] text-[#9E9589]">
              Nenhum cliente encontrado para os filtros ativos.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
              {displayRows.map((customer) => (
                <CustomerCard key={customer.id} customer={customer} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
