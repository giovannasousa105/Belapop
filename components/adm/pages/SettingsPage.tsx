import Image from "next/image";
import { Cormorant_Garamond } from "next/font/google";
import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import {
  GripVertical,
  MapPinned,
  Settings,
  ShoppingBag,
  Truck,
} from "lucide-react";

import { FinanceSidebar } from "@/components/admin/financeiro/FinanceSidebar";

import { getAdmDataSource } from "@/lib/adm/repositories/source";
import type { AdmFilters, SearchParamsInput } from "@/lib/adm/url";

type SettingsPageProps = {
  filters: AdmFilters;
  searchParamsSource?: SearchParamsInput;
};

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const settingsTheme = {
  "--settings-bg": "#FAFAF8",
  "--settings-sidebar": "#F3F1ED",
  "--settings-surface": "#FFFFFF",
  "--settings-surface-low": "#EDEAE3",
  "--settings-surface-high": "#E4E1D9",
  "--settings-text": "#1C1A18",
  "--settings-text-soft": "#6B6459",
  "--settings-text-muted": "#9A9288",
  "--settings-accent": "#C8956C",
  "--settings-accent-dim": "#A87550",
  "--settings-border": "rgba(180,174,162,0.2)",
  "--settings-border-strong": "rgba(180,174,162,0.35)",
  "--settings-shadow": "0 16px 40px rgba(28,26,24,0.05)",
  "--settings-shadow-sm": "0 4px 16px rgba(28,26,24,0.04)",
  "--settings-timeline": "rgba(200,149,108,0.22)",
} as CSSProperties;

type HistoryItem = {
  value: string;
  date: string;
};

type DeadlineCard = {
  label: string;
  unit: string;
  value: string;
  icon: LucideIcon;
};

type Carrier = {
  name: string;
  coverage: string;
  image: string;
  alt: string;
};

type TierLimit = {
  name: string;
  tier: "newcomer" | "rising" | "elite";
  skuLimit: string;
  gmvCap: string;
};

const carriers: Carrier[] = [
  {
    name: "Correios (PAC/SEDEX)",
    coverage: "Atendimento Nacional",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDeSBVLFe3VqbAvxFxtURoCxqli_T59-phr4JZh8zbyAU7OG7f7wxc79RJXybNiHfzhMIpybhptdGFxWLy1P0oUUxXkrKXNOl6D3L-w33rHyWdgsuBUPVYGbruZfQzTfw-fsp-YbRDLiXDEb-PltBXhMYHUjttxPbdYhROgin3__uqzLZpKIbMNMXM8uEtzxym6IVsOWCPKWLdWvAn3Y_YQXWD80ZiMepkC2Fx1pODxXo3Qi1-dAkK3troUKLT-TM1KAjHN0WLaax3t",
    alt: "Logotipo minimalista da empresa de correios nacional em cores institucionais"
  },
  {
    name: "Loggi Express",
    coverage: "Centros Urbanos",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBU__QIC8ZSZJN7pLAh9qLKCtnv99JRBD4n66eDQmNQZOTUcBsC7qkN1o3dlGvy_A0nh4AjuAhB9Guwl5EetYejorfi2vnTN8XA8CgHcsMhoqQT8NsKYaMi33KE_jdyK4QMVT904yRXWW4qgPYVIh9YFkaqNsSVX7OIRTixwEAYIPy_50nusghiliWzV79Y9tYeyvd1RpjGfRehxuiRqyh0_A477DoAhjW6VmJ-Zl7J2KKa73Ue0CEko8uGvcl9EW-sawbgXgr0mvGX",
    alt: "Logotipo moderno da empresa de logística Loggi em design plano"
  }
];

const tierBadgeClasses: Record<TierLimit["tier"], string> = {
  newcomer: "border border-stone-200 bg-stone-100 text-stone-500",
  rising:   "border border-[#C8956C]/30 bg-[#FDF0E8] text-[#C8956C]",
  elite:    "border border-transparent bg-[#1C1A18] text-[#C8956C]",
};

function SectionIntro({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-2.5 pt-1">
      <h2 className={`${cormorant.className} text-[20px] font-medium leading-tight tracking-[-0.02em] text-[#1A1714]`}>
        {title}
      </h2>
      <p className="max-w-[200px] text-[13px] leading-relaxed text-[#6B5E54]">{description}</p>
    </div>
  );
}

function DeadlineSurface({ card }: { card: DeadlineCard }) {
  const Icon = card.icon;

  return (
    <div className="flex flex-col items-center rounded-2xl border border-[var(--settings-border)] bg-[var(--settings-surface)] p-6 text-center shadow-[var(--settings-shadow-sm)] transition hover:shadow-[var(--settings-shadow)]">
      <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--settings-accent)]/10">
        <Icon className="h-5 w-5 text-[var(--settings-accent)]" strokeWidth={1.7} />
      </span>
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--settings-text-muted)]">
        {card.label}
      </p>
      <div className="flex items-baseline gap-1">
        <input
          aria-label={card.label}
          readOnly
          value={card.value}
          className={`${cormorant.className} w-14 bg-transparent text-center text-4xl font-medium leading-none text-[var(--settings-text)] outline-none`}
        />
      </div>
      <span className="mt-2 text-xs text-[var(--settings-text-soft)]">{card.unit}</span>
    </div>
  );
}

function CarrierRow({ carrier }: { carrier: Carrier }) {
  return (
    <div className="group flex items-center justify-between rounded-xl border border-[var(--settings-border)] bg-[var(--settings-surface-low)] p-4 transition hover:bg-[var(--settings-surface-low)]/70 hover:shadow-[var(--settings-shadow-sm)]">
      <div className="flex items-center gap-4">
        <GripVertical className="h-4 w-4 cursor-grab text-[var(--settings-text-muted)]" strokeWidth={1.6} />
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-[var(--settings-shadow-sm)]">
          <Image src={carrier.image} alt={carrier.alt} width={28} height={18} className="h-auto w-auto max-h-4 object-contain" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--settings-text)]">{carrier.name}</p>
          <p className="text-xs text-[var(--settings-text-muted)]">{carrier.coverage}</p>
        </div>
      </div>
      <button
        type="button"
        className="rounded-lg p-2 text-[var(--settings-text-muted)] opacity-0 transition group-hover:opacity-100 hover:bg-white hover:text-[var(--settings-accent)]"
        aria-label={`Configurar ${carrier.name}`}
      >
        <Settings className="h-4 w-4" strokeWidth={1.7} />
      </button>
    </div>
  );
}

export async function SettingsPage({ filters: _filters, searchParamsSource: _searchParamsSource }: SettingsPageProps) {
  const data = await getAdmDataSource();
  const settingsRows = [...data.platformSettings].sort(
    (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
  );
  const takeRateSetting = settingsRows.find((row) => row.area === "financeiro") ?? settingsRows[0];
  const logisticsSetting = settingsRows.find((row) => row.area === "logistica");
  const securitySetting = settingsRows.find((row) => row.area === "seguranca");
  const visibleTakeRateHistory: HistoryItem[] = settingsRows.slice(0, 3).map((row) => ({
    value: `${row.label}: ${row.value}`,
    date: new Date(row.updatedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
  }));
  const visibleDeadlines: DeadlineCard[] = [
    { label: "Preparação", unit: "dias úteis", value: "2", icon: ShoppingBag },
    { label: "Postagem", unit: "dia útil", value: logisticsSetting ? "2" : "1", icon: Truck },
    { label: "Entrega Base", unit: "dias úteis", value: "5", icon: MapPinned }
  ];
  const visibleSellerLimits: TierLimit[] = [
    {
      tier: "newcomer",
      name: "Newcomer",
      skuLimit: `${Math.max(50, data.sellers.filter((s) => s.tier === "core").length * 25)} unidades`,
      gmvCap: "R$ 5.000"
    },
    {
      tier: "rising",
      name: "Rising Star",
      skuLimit: `${Math.max(500, data.products.length * 40)} unidades`,
      gmvCap: "R$ 50.000"
    },
    {
      tier: "elite",
      name: "Elite Curator",
      skuLimit: securitySetting ? "Ilimitado" : "800 unidades",
      gmvCap: "Sem restrições"
    }
  ];

  return (
    <div className="flex min-h-screen bg-[#FAFAF8] text-[#1A1714]" style={settingsTheme}>
      <FinanceSidebar activeHref="/adm/gestao/configuracoes" />

      {/* Main content */}
      <main className="flex min-h-screen flex-1 flex-col pl-[220px]">

        {/* Header */}
        <header className="sticky top-0 z-20 flex w-full items-center justify-between border-b border-[rgba(139,94,60,0.10)] bg-[#FAFAF8]/90 px-10 py-5 backdrop-blur-xl">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9E9589]">
              Módulo Gestão
            </p>
            <h1 className={`${cormorant.className} text-[28px] font-medium leading-tight tracking-[-0.02em] text-[#1A1714]`}>
              configuracoes
            </h1>
          </div>
        </header>

        {/* Page body */}
        <div className="flex-1 px-10 pb-36 pt-10">
          <div className="mx-auto max-w-4xl space-y-20">

            {/* Comissões */}
            <section className="grid grid-cols-1 gap-10 md:grid-cols-[200px_minmax(0,1fr)]" id="commissions">
              <SectionIntro
                title="Comissões"
                description="Defina a taxa de intermediação (Take Rate) global para todas as vendas processadas na BelaPop."
              />

              <div className="space-y-5">
                <div className="rounded-2xl border border-[var(--settings-border)] bg-[var(--settings-surface)] p-8 shadow-[var(--settings-shadow)]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--settings-text-muted)]">
                    Take Rate Atual
                  </p>

                  {/* Big number input with % badge */}
                  <div className="mt-5 flex items-end gap-1 border-b-2 border-[var(--settings-accent)]/25 pb-4">
                    <input
                      aria-label="Take rate atual"
                      readOnly
                      value={(takeRateSetting?.value ?? "18.5%").replace("%", "")}
                      className={`${cormorant.className} w-36 bg-transparent p-0 text-6xl font-medium leading-none text-[var(--settings-text)] outline-none`}
                    />
                    <span className={`${cormorant.className} mb-1 text-3xl font-light leading-none text-[var(--settings-text-muted)]`}>
                      %
                    </span>
                  </div>

                  {/* Tax History — vertical timeline */}
                  <div className="mt-8">
                    <p className="mb-5 text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--settings-text-muted)]">
                      Histórico de Alterações
                    </p>
                    <div className="relative pl-5">
                      <div
                        className="absolute bottom-0 left-[7px] top-1 w-px"
                        style={{ background: "var(--settings-timeline)" }}
                      />
                      {visibleTakeRateHistory.map((entry, i) => (
                        <div key={entry.date} className={`relative ${i < visibleTakeRateHistory.length - 1 ? "pb-5" : ""}`}>
                          <div className="absolute -left-[19px] top-[5px] h-2.5 w-2.5 rounded-full border-2 border-[var(--settings-accent)] bg-[var(--settings-surface)]" />
                          <div className="flex items-start justify-between gap-4">
                            <span className="text-sm text-[var(--settings-text)]">{entry.value}</span>
                            <span className="shrink-0 text-xs text-[var(--settings-text-muted)]">{entry.date}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Prazos Operacionais */}
            <section className="grid grid-cols-1 gap-10 md:grid-cols-[200px_minmax(0,1fr)]" id="deadlines">
              <SectionIntro
                title="Prazos Operacionais"
                description="Configuração de prazos para alinhar expectativas de clientes e parceiros logísticos."
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {visibleDeadlines.map((card) => (
                  <DeadlineSurface key={card.label} card={card} />
                ))}
              </div>
            </section>

            {/* Regras de Frete */}
            <section className="grid grid-cols-1 gap-10 md:grid-cols-[200px_minmax(0,1fr)]" id="shipping">
              <SectionIntro
                title="Regras de Frete"
                description="Hierarquia de transportadoras e regras regionais de frete grátis ou subsidiado."
              />

              <div className="space-y-5">
                <div className="rounded-2xl border border-[var(--settings-border)] bg-[var(--settings-surface)] p-7 shadow-[var(--settings-shadow)]">
                  <div className="mb-5 flex items-center justify-between">
                    <h3 className={`${cormorant.className} text-base font-medium leading-none tracking-[-0.01em] text-[var(--settings-text)]`}>
                      Prioridade de Transportadoras
                    </h3>
                    <button
                      type="button"
                      className="rounded-lg px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--settings-accent)] transition hover:bg-[var(--settings-accent)]/8"
                    >
                      + Adicionar Nova
                    </button>
                  </div>

                  <div className="space-y-3">
                    {(logisticsSetting ? carriers : carriers.slice(0, 1)).map((carrier) => (
                      <CarrierRow key={carrier.name} carrier={carrier} />
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Política de Devoluções */}
            <section className="grid grid-cols-1 gap-10 md:grid-cols-[200px_minmax(0,1fr)]" id="refunds">
              <SectionIntro
                title="Política de Devoluções"
                description="Automação de reembolsos e janelas de devolução para curadoria da experiência do cliente."
              />

              <div className="grid grid-cols-1 gap-5 rounded-2xl border border-[var(--settings-border)] bg-[var(--settings-surface)] p-8 shadow-[var(--settings-shadow)] md:grid-cols-2">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--settings-text-muted)]">
                    Janela de Devolução
                  </label>
                  <div className="mt-4 flex items-end gap-2 border-b-2 border-[var(--settings-accent)]/25 pb-3">
                    <input
                      aria-label="Janela de devolução"
                      readOnly
                      value="30"
                      className={`${cormorant.className} w-14 bg-transparent p-0 text-4xl font-medium leading-none text-[var(--settings-text)] outline-none`}
                    />
                    <span className="mb-0.5 rounded-md bg-[var(--settings-surface-low)] px-2.5 py-1 text-xs font-medium text-[var(--settings-text-soft)]">
                      dias corridos
                    </span>
                  </div>
                  <p className="mt-3 text-[11px] leading-relaxed text-[var(--settings-text-muted)]">
                    Padrão legal: 7 dias. BelaPop recomenda: 30 dias.
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--settings-text-muted)]">
                    Auto-Aprovação até
                  </label>
                  <div className="mt-4 flex items-end gap-2 border-b-2 border-[var(--settings-accent)]/25 pb-3">
                    <span className="mb-0.5 rounded-md bg-[var(--settings-surface-low)] px-2.5 py-1 text-xs font-medium text-[var(--settings-text-soft)]">
                      R$
                    </span>
                    <input
                      aria-label="Auto-aprovação até"
                      readOnly
                      value="150"
                      className={`${cormorant.className} w-20 bg-transparent p-0 text-4xl font-medium leading-none text-[var(--settings-text)] outline-none`}
                    />
                  </div>
                  <p className="mt-3 text-[11px] leading-relaxed text-[var(--settings-text-muted)]">
                    Reembolsos instantâneos para pedidos de baixo valor.
                  </p>
                </div>
              </div>
            </section>

            {/* Limites por Seller */}
            <section className="grid grid-cols-1 gap-10 pb-4 md:grid-cols-[200px_minmax(0,1fr)]" id="limits">
              <SectionIntro
                title="Limites por Seller"
                description="Escalonamento de capacidade por nível de maturidade do vendedor na plataforma."
              />

              <div className="overflow-hidden rounded-2xl border border-[var(--settings-border)] bg-[var(--settings-surface)] shadow-[var(--settings-shadow)]">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[var(--settings-border)] bg-[var(--settings-surface-low)]">
                      <th className="px-7 py-5 text-[9px] font-semibold uppercase tracking-[0.24em] text-[var(--settings-text-muted)]">
                        Nível
                      </th>
                      <th className="px-7 py-5 text-[9px] font-semibold uppercase tracking-[0.24em] text-[var(--settings-text-muted)]">
                        Limite de SKUs
                      </th>
                      <th className="px-7 py-5 text-[9px] font-semibold uppercase tracking-[0.24em] text-[var(--settings-text-muted)]">
                        Teto GMV Mensal
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--settings-border)]">
                    {visibleSellerLimits.map((tier) => (
                      <tr key={tier.name} className="group transition-colors hover:bg-[var(--settings-surface-low)]/50">
                        <td className="px-7 py-6">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${tierBadgeClasses[tier.tier]}`}
                          >
                            {tier.name}
                          </span>
                        </td>
                        <td className="px-7 py-6 text-sm text-[var(--settings-text)]">{tier.skuLimit}</td>
                        <td className="px-7 py-6 text-sm text-[var(--settings-text)]">{tier.gmvCap}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

          </div>
        </div>

        {/* Sticky footer */}
        <footer className="sticky bottom-0 z-40 flex items-center justify-between border-t border-[rgba(139,94,60,0.10)] bg-[#FAFAF8]/90 px-10 py-5 backdrop-blur-xl">
          <p className="text-xs text-[var(--settings-text-muted)]">
            Alterações não salvas serão descartadas automaticamente.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-xl border border-[var(--settings-border-strong)] bg-white px-7 py-2.5 text-sm font-medium text-[var(--settings-text)] transition hover:bg-[var(--settings-surface-low)]"
            >
              Descartar
            </button>
            <button
              type="button"
              className="rounded-xl bg-[var(--settings-accent)] px-9 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(200,149,108,0.30)] transition hover:bg-[var(--settings-accent-dim)] active:scale-[0.98]"
            >
              Salvar Alterações
            </button>
          </div>
        </footer>
      </main>
    </div>
  );
}
