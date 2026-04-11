import Image from "next/image";
import Link from "next/link";
import { Noto_Serif } from "next/font/google";
import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  CircleUserRound,
  GripVertical,
  LayoutDashboard,
  MapPinned,
  Settings,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  Store,
  Truck,
  Users,
  Wallet
} from "lucide-react";

import { getAdmDataSource } from "@/lib/adm/repositories/source";
import type { AdmFilters, SearchParamsInput } from "@/lib/adm/url";

type SettingsPageProps = {
  filters: AdmFilters;
  searchParamsSource?: SearchParamsInput;
};

const notoSerif = Noto_Serif({
  subsets: ["latin"],
  weight: ["400", "500", "700"]
});

const settingsTheme = {
  "--settings-bg": "#fbf9f4",
  "--settings-sidebar": "#f5f4ed",
  "--settings-surface": "#ffffff",
  "--settings-surface-low": "#efeee6",
  "--settings-surface-high": "#e2e3d9",
  "--settings-text": "#31332c",
  "--settings-text-soft": "#5e6058",
  "--settings-outline": "#797c73",
  "--settings-outline-variant": "#b1b3a9",
  "--settings-primary": "#5f5e5e",
  "--settings-primary-dim": "#535252",
  "--settings-secondary": "#6e5b4d",
  "--settings-tertiary": "#a23d3e",
  "--settings-border": "rgba(177, 179, 169, 0.15)",
  "--settings-shadow": "0 20px 40px rgba(49, 51, 44, 0.03)"
} as CSSProperties;

type SidebarItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  active?: boolean;
};

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
  tone: string;
  skuLimit: string;
  gmvCap: string;
};

const sidebarItems: SidebarItem[] = [
  { label: "Dashboard", href: "/adm/dashboard-executivo", icon: LayoutDashboard },
  { label: "Curadoria", href: "/adm/curadoria/produtos", icon: Sparkles },
  { label: "Sellers", href: "/adm/operacao/parceiros", icon: Store },
  { label: "Pedidos", href: "/adm/operacao/pedidos-criticos", icon: ShoppingBag },
  { label: "Logistica", href: "/adm/operacao/logistica", icon: Truck },
  { label: "Risco", href: "/adm/financeiro/risco", icon: ShieldAlert },
  { label: "Financeiro", href: "/adm/financeiro", icon: Wallet },
  { label: "Clientes", href: "/adm/relacionamento/clientes", icon: Users },
  { label: "Configuracoes", href: "/adm/gestao/configuracoes", icon: Settings, active: true }
];

const takeRateHistory: HistoryItem[] = [
  { value: "Alterado para 18.5%", date: "12 Jan, 2024" },
  { value: "Alterado para 15.0%", date: "05 Sep, 2023" }
];

const deadlines: DeadlineCard[] = [
  { label: "Preparacao", unit: "dias uteis", value: "2", icon: ShoppingBag },
  { label: "Postagem", unit: "dia util", value: "1", icon: Truck },
  { label: "Entrega Base", unit: "dias uteis", value: "5", icon: MapPinned }
];

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
    alt: "Logotipo moderno da empresa de logistica Loggi em design plano"
  }
];

const sellerLimits: TierLimit[] = [
  { name: "Newcomer", tone: "bg-stone-300", skuLimit: "50 unidades", gmvCap: "R$ 5.000" },
  { name: "Rising Star", tone: "bg-[var(--settings-secondary)]", skuLimit: "500 unidades", gmvCap: "R$ 50.000" },
  { name: "Elite Curator", tone: "bg-[var(--settings-text)]", skuLimit: "Ilimitado", gmvCap: "Sem restricoes" }
];

function SidebarLink({ item }: { item: SidebarItem }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 py-2 text-sm uppercase tracking-[0.12em] transition-colors duration-200 ${
        item.active
          ? "border-l-2 border-[var(--settings-primary)] pl-4 font-semibold text-[var(--settings-text)]"
          : "pl-4 font-normal text-[var(--settings-primary)] hover:bg-[var(--settings-surface-low)] hover:text-[var(--settings-text)]"
      }`}
    >
      <Icon className="h-4 w-4" strokeWidth={1.7} />
      <span>{item.label}</span>
    </Link>
  );
}

function SectionIntro({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-2">
      <h2 className={`${notoSerif.className} text-2xl leading-none tracking-[-0.02em] text-[var(--settings-text)]`}>
        {title}
      </h2>
      <p className="max-w-[220px] text-sm leading-6 text-[var(--settings-text-soft)]">{description}</p>
    </div>
  );
}

function DeadlineSurface({ card }: { card: DeadlineCard }) {
  const Icon = card.icon;

  return (
    <div className="rounded-[8px] border border-[var(--settings-border)] bg-[var(--settings-surface)] p-6 text-center">
      <Icon className="mx-auto mb-4 h-5 w-5 text-[var(--settings-secondary)]" strokeWidth={1.7} />
      <p className="mb-2 text-[10px] uppercase tracking-[0.15em] text-[var(--settings-text-soft)]">
        {card.label}
      </p>
      <input
        aria-label={card.label}
        readOnly
        value={card.value}
        className={`${notoSerif.className} w-full bg-transparent text-center text-2xl leading-none text-[var(--settings-text)] outline-none`}
      />
      <span className="text-xs text-[var(--settings-text-soft)]">{card.unit}</span>
    </div>
  );
}

function CarrierRow({ carrier }: { carrier: Carrier }) {
  return (
    <div className="group flex items-center justify-between rounded-[8px] bg-[var(--settings-surface-low)] p-4">
      <div className="flex items-center gap-4">
        <GripVertical className="h-4 w-4 text-[var(--settings-text-soft)]" strokeWidth={1.6} />
        <div className="flex h-10 w-10 items-center justify-center rounded-[4px] bg-white">
          <Image src={carrier.image} alt={carrier.alt} width={28} height={18} className="h-auto w-auto max-h-4 object-contain" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--settings-text)]">{carrier.name}</p>
          <p className="text-xs text-[var(--settings-text-soft)]">{carrier.coverage}</p>
        </div>
      </div>
      <Settings className="h-4 w-4 cursor-pointer text-[var(--settings-text-soft)] opacity-0 transition-opacity group-hover:opacity-100" strokeWidth={1.7} />
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
  const visibleTakeRateHistory = settingsRows.slice(0, 2).map((row) => ({
    value: `${row.label}: ${row.value}`,
    date: new Date(row.updatedAt).toLocaleDateString("pt-BR")
  }));
  const visibleDeadlines: DeadlineCard[] = [
    { label: "Preparacao", unit: "dias uteis", value: "2", icon: ShoppingBag },
    { label: "Postagem", unit: "dia util", value: logisticsSetting ? "2" : "1", icon: Truck },
    { label: "Entrega Base", unit: "dias uteis", value: "5", icon: MapPinned }
  ];
  const visibleSellerLimits: TierLimit[] = [
    {
      name: "Newcomer",
      tone: "bg-stone-300",
      skuLimit: `${Math.max(50, data.sellers.filter((seller) => seller.tier === "core").length * 25)} unidades`,
      gmvCap: "R$ 5.000"
    },
    {
      name: "Rising Star",
      tone: "bg-[var(--settings-secondary)]",
      skuLimit: `${Math.max(500, data.products.length * 40)} unidades`,
      gmvCap: "R$ 50.000"
    },
    {
      name: "Elite Curator",
      tone: "bg-[var(--settings-text)]",
      skuLimit: securitySetting ? "Ilimitado" : "800 unidades",
      gmvCap: "Sem restricoes"
    }
  ];
  return (
    <div className="flex min-h-screen bg-[var(--settings-bg)] text-[var(--settings-text)]" style={settingsTheme}>
      <aside className="fixed left-0 top-0 flex h-screen w-72 flex-col gap-y-2 bg-[var(--settings-sidebar)] px-6 py-10">
        <span className={`${notoSerif.className} mb-8 block text-xl italic text-[var(--settings-text)]`}>
          BelaPop Admin
        </span>

        <div className="mb-8 px-4">
          <p className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--settings-text)]">
            BelaPop Admin
          </p>
          <p className="text-xs uppercase tracking-tight text-[var(--settings-primary)]">Curator Access</p>
        </div>

        <nav className="flex-1 space-y-1">
          {sidebarItems.map((item) => (
            <SidebarLink key={item.href} item={item} />
          ))}
        </nav>
      </aside>

      <main className="ml-72 flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 flex w-full items-center justify-between bg-[var(--settings-bg)] px-12 py-6">
          <h1 className={`${notoSerif.className} text-2xl leading-none tracking-[-0.02em] text-[var(--settings-text)]`}>
            Configuracoes da Plataforma
          </h1>

          <div className="flex items-center gap-6">
            <button
              type="button"
              aria-label="Notificacoes"
              className="text-[var(--settings-primary)] transition-colors hover:text-[var(--settings-text)]"
            >
              <Bell className="h-5 w-5" strokeWidth={1.7} />
            </button>

            <button type="button" className="flex items-center gap-3">
              <CircleUserRound className="h-5 w-5 text-[var(--settings-primary)]" strokeWidth={1.7} />
              <span className="text-sm font-medium text-[var(--settings-text)]">Administrador</span>
            </button>
          </div>
        </header>

        <div className="h-px w-full bg-[var(--settings-sidebar)]" />

        <div className="max-w-5xl p-12">
          <div className="space-y-24">
            <section className="grid grid-cols-1 gap-12 md:grid-cols-[220px_minmax(0,1fr)]" id="commissions">
              <SectionIntro
                title="Commissions"
                description="Defina a taxa de intermediacao (Take Rate) global para todas as vendas processadas na BelaPop."
              />

              <div className="space-y-8">
                <div className="rounded-[8px] border border-[var(--settings-border)] bg-[var(--settings-surface)] p-8 shadow-[var(--settings-shadow)]">
                  <label className="block text-xs uppercase tracking-[0.18em] text-[var(--settings-text-soft)]">
                    Current Take Rate
                  </label>

                  <div className="mb-8 mt-4 flex items-baseline gap-2">
                    <input
                      aria-label="Current take rate"
                      readOnly
                      value={(takeRateSetting?.value ?? "18.5%").replace("%", "")}
                      className={`${notoSerif.className} w-32 bg-transparent p-0 text-5xl leading-none text-[var(--settings-text)] outline-none`}
                    />
                    <span className={`${notoSerif.className} text-2xl leading-none text-[var(--settings-text-soft)]`}>%</span>
                  </div>

                  <div className="mt-8 border-t border-[var(--settings-surface-low)] pt-8">
                    <p className="mb-4 text-xs uppercase tracking-[0.18em] text-[var(--settings-text-soft)]">
                      Tax History
                    </p>
                    <div className="space-y-4">
                      {visibleTakeRateHistory.map((entry) => (
                        <div key={entry.date} className="flex items-center justify-between py-2">
                          <span className="text-sm text-[var(--settings-text)]">{entry.value}</span>
                          <span className="text-xs text-[var(--settings-text-soft)]">{entry.date}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-12 md:grid-cols-[220px_minmax(0,1fr)]" id="deadlines">
              <SectionIntro
                title="Standard Deadlines"
                description="Configuracao de prazos operacionais para alinhar expectativas de clientes e parceiros logisticos."
              />

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                {visibleDeadlines.map((card) => (
                  <DeadlineSurface key={card.label} card={card} />
                ))}
              </div>
            </section>

            <section className="grid grid-cols-1 gap-12 md:grid-cols-[220px_minmax(0,1fr)]" id="shipping">
              <SectionIntro
                title="Shipping Rules"
                description="Hierarquia de transportadoras e regras regionais de frete gratis ou subsidiado."
              />

              <div className="space-y-6">
                <div className="rounded-[8px] border border-[var(--settings-border)] bg-[var(--settings-surface)] p-8 shadow-[var(--settings-shadow)]">
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className={`${notoSerif.className} text-lg leading-none tracking-[-0.02em] text-[var(--settings-text)]`}>
                      Prioridade de Transportadoras
                    </h3>
                    <button
                      type="button"
                      className="border-b border-[rgba(95,94,94,0.2)] pb-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--settings-primary)]"
                    >
                      Adicionar Nova
                    </button>
                  </div>

                  <div className="space-y-4">
                    {(logisticsSetting ? carriers : carriers.slice(0, 1)).map((carrier) => (
                      <CarrierRow key={carrier.name} carrier={carrier} />
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-12 md:grid-cols-[220px_minmax(0,1fr)]" id="refunds">
              <SectionIntro
                title="Refund Policies"
                description="Automacao de reembolsos e janelas de devolucao para curadoria de experiencia do cliente."
              />

              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-8 rounded-[8px] border border-[var(--settings-border)] bg-[var(--settings-surface)] p-8 shadow-[var(--settings-shadow)] md:grid-cols-2">
                  <div>
                    <label className="mb-4 block text-[10px] uppercase tracking-[0.15em] text-[var(--settings-text-soft)]">
                      Janela de Devolucao
                    </label>
                    <div className="flex items-center gap-3 border-b border-[rgba(177,179,169,0.3)] py-2">
                      <input
                        aria-label="Janela de devolucao"
                        readOnly
                        value="30"
                        className={`${notoSerif.className} w-16 bg-transparent p-0 text-2xl leading-none text-[var(--settings-text)] outline-none`}
                      />
                      <span className="text-sm text-[var(--settings-text-soft)]">dias corridos</span>
                    </div>
                    <p className="mt-3 text-[11px] italic text-[var(--settings-text-soft)]">
                      Padrao legal: 7 dias. BelaPop recomenda: 30 dias.
                    </p>
                  </div>

                  <div>
                    <label className="mb-4 block text-[10px] uppercase tracking-[0.15em] text-[var(--settings-text-soft)]">
                      Auto-Aprovacao ate
                    </label>
                    <div className="flex items-center gap-3 border-b border-[rgba(177,179,169,0.3)] py-2">
                      <span className="text-sm text-[var(--settings-text-soft)]">R$</span>
                      <input
                        aria-label="Auto-aprovacao ate"
                        readOnly
                        value="150"
                        className={`${notoSerif.className} w-24 bg-transparent p-0 text-2xl leading-none text-[var(--settings-text)] outline-none`}
                      />
                    </div>
                    <p className="mt-3 text-[11px] italic text-[var(--settings-text-soft)]">
                      Reembolsos instantaneos para pedidos de baixo valor.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-12 pb-24 md:grid-cols-[220px_minmax(0,1fr)]" id="limits">
              <SectionIntro
                title="Seller Limits"
                description="Escalonamento de capacidade por nivel de maturidade do vendedor na plataforma."
              />

              <div className="overflow-hidden rounded-[8px] border border-[var(--settings-border)] bg-[var(--settings-surface)] shadow-[var(--settings-shadow)]">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[var(--settings-surface-low)] bg-[var(--settings-surface-low)]">
                      <th className="px-8 py-6 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--settings-text-soft)]">
                        Nivel
                      </th>
                      <th className="px-8 py-6 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--settings-text-soft)]">
                        Limite de SKUs
                      </th>
                      <th className="px-8 py-6 text-[10px] font-semibold uppercase tracking-[0.15em] text-[var(--settings-text-soft)]">
                        Teto GMV Mensal
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--settings-surface-low)]">
                    {visibleSellerLimits.map((tier) => (
                      <tr key={tier.name} className="transition-colors hover:bg-[var(--settings-surface-low)]">
                        <td className="px-8 py-8">
                          <div className="flex items-center gap-3">
                            <div className={`h-2 w-2 rounded-full ${tier.tone}`} />
                            <span className={`${notoSerif.className} text-lg italic text-[var(--settings-text)]`}>
                              {tier.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-8 text-sm text-[var(--settings-text)]">{tier.skuLimit}</td>
                        <td className="px-8 py-8 text-sm text-[var(--settings-text)]">{tier.gmvCap}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>

        <footer className="sticky bottom-0 z-40 flex justify-end gap-4 border-t border-[var(--settings-surface-low)] bg-[rgba(251,249,244,0.8)] px-12 py-6 backdrop-blur-xl">
          <button
            type="button"
            className="rounded-[8px] bg-[var(--settings-surface-high)] px-8 py-3 text-sm font-medium text-[var(--settings-text)] transition-colors hover:bg-[var(--settings-surface-low)]"
          >
            Descartar
          </button>
          <button
            type="button"
            className="rounded-[8px] bg-[var(--settings-primary)] px-10 py-3 text-sm font-medium text-[var(--settings-surface)] shadow-[0_18px_32px_rgba(95,94,94,0.12)] transition-colors hover:bg-[var(--settings-primary-dim)]"
          >
            Salvar Alteracoes
          </button>
        </footer>
      </main>
    </div>
  );
}
