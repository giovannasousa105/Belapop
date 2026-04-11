import Image from "next/image";
import Link from "next/link";
import { Noto_Serif } from "next/font/google";
import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowUpDown,
  Eye,
  ImagePlus,
  LayoutDashboard,
  MoreVertical,
  Plus,
  Settings2,
  ShieldAlert,
  ShoppingCart,
  Sparkles,
  Star,
  Store,
  Truck,
  Users,
  Wallet
} from "lucide-react";

import { campaignsRepository } from "@/lib/adm/repositories";
import { getAdmDataSource } from "@/lib/adm/repositories/source";
import type { AdmFilters, SearchParamsInput } from "@/lib/adm/url";
import type { Campaign, Product } from "@/types/adm";

const notoSerif = Noto_Serif({
  subsets: ["latin"],
  weight: ["400", "700"]
});

const shelvesTheme = {
  "--shelves-bg": "#fbf9f4",
  "--shelves-sidebar": "#f5f4ed",
  "--shelves-surface": "#ffffff",
  "--shelves-surface-low": "#f5f4ed",
  "--shelves-surface-muted": "#efeee6",
  "--shelves-surface-high": "#e2e3d9",
  "--shelves-text": "#31332c",
  "--shelves-text-soft": "#5e6058",
  "--shelves-primary": "#5f5e5e",
  "--shelves-outline": "#797c73",
  "--shelves-outline-variant": "#b1b3a9",
  "--shelves-shadow": "0 20px 40px rgba(49, 51, 44, 0.05)"
} as CSSProperties;

type ContentShelvesPageProps = {
  filters: AdmFilters;
  searchParamsSource: SearchParamsInput;
};

type SidebarItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  active?: boolean;
};

type HeroSlotVisual = {
  image: string;
  alt: string;
  slotLabel: string;
  defaultPeriod: string;
};

type ShelfItem = {
  title: string;
  note: string;
  status: string;
  visible: boolean;
  icon: LucideIcon;
};

type CollectionCard = {
  title: string;
  note: string;
  image: string;
  alt: string;
};

type HighlightVisual = {
  image: string;
  alt: string;
  title: string;
  brand: string;
  stars: number;
  clicks: string;
  trendLabel: string;
  trendTone: "up" | "flat" | "down";
};

type SlotDisplay = {
  title: string;
  period: string;
  slotLabel: string;
  status: string;
};

const sidebarItems: SidebarItem[] = [
  { label: "Dashboard", href: "/adm/dashboard-executivo", icon: LayoutDashboard },
  { label: "Curadoria", href: "/adm/curadoria/produtos", icon: Sparkles, active: true },
  { label: "Sellers", href: "/adm/operacao/parceiros", icon: Store },
  { label: "Pedidos", href: "/adm/operacao/pedidos-criticos", icon: ShoppingCart },
  { label: "Logistica", href: "/adm/operacao/logistica", icon: Truck },
  { label: "Risco", href: "/adm/financeiro/risco", icon: ShieldAlert },
  { label: "Financeiro", href: "/adm/financeiro", icon: Wallet },
  { label: "Clientes", href: "/adm/relacionamento/clientes", icon: Users },
  { label: "Configuracoes", href: "/adm/gestao/configuracoes", icon: Settings2 }
];

const heroSlotVisuals: HeroSlotVisual[] = [
  {
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDyVfPLeRyFPZlZqZtK9QjkF37zzfio_dda4jwWewd8xt_mNGiWK3541srvzd92k2oLjO1tsCR3WZ14NdUI95ZpxiZ94Uc2lx9X-5Ul-25NHl1DdwFygySMCXeXhh98JVa1y3A-vQF6oSGjxDR6HkZI6pK2euDzasvt9PW2lSYidrAWA41WRbKbzA7_5GFv_qUnZo4dx_jZXtI9tl78EUcLGMry0nRwuszLXLEow_G0BlUDSOfFStsL02sy80NuLEknfN-9HwRs7AEH",
    alt: "premium beauty products collection in soft sunlight",
    slotLabel: "Hero principal",
    defaultPeriod: "01 Dez - 28 Fev"
  },
  {
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAerme1nJgdXmnjrY9B-LMOns7-82u2ZLlODwKkcwUg35Fn_S0sHq0tBA8saXG_iNALWEqPzbpyp_fUZbg0uEF2yBEROO1t8eljk07IHMzU3ZySvcBvNbKDQ0GAgi7tuub2svZI6oH5eqOXCDScGa2RBR0YVB81rRbZL_P-OoOjIiPLq74XcpdJoyJrg68xT98SOe7pVcJh8MDqtESkrMn_G1bxquKQ7gwl9cru4nUZ1AjOXj2cujeAPZCM5UJmAKJl01Ddo88mpsrP",
    alt: "minimal makeup palette on a stone surface",
    slotLabel: "Hero secundario",
    defaultPeriod: "Inicia em 15 Mar"
  }
];

const shelfItems: ShelfItem[] = [
  {
    title: "Novidades da Semana",
    note: "Ordenacao: Automatica (Data de Cadastro)",
    status: "Visivel",
    visible: true,
    icon: Sparkles
  },
  {
    title: "Mais Vendidos do Mes",
    note: "Ordenacao: Algoritmo de Conversao",
    status: "Visivel",
    visible: true,
    icon: ArrowUpDown
  },
  {
    title: "Ofertas Exclusivas App",
    note: "Ordenacao: Manual",
    status: "Oculto",
    visible: false,
    icon: Wallet
  }
];

const collectionCards: CollectionCard[] = [
  {
    title: "Skin Care de Luxo",
    note: "Vigencia: Perene",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuB44wkUNpPZ21SSWqT4v0_aoRq_GcYP7EXbmAXiYG-w92ia7hOh0i-06GKc9s0zB37Ey4qkJob3ekK3G9L75NL4TiUutIVUrQkRw0nl1gMOCYdFF8fyUTpeBSBTMGxN4NVp0qaKyy5RZA-uE9NzgU2LVSqtUfwlMz3tXkHz3BxS3J11U9wYSiSX3TSXpxzfgyG3TFcueYHlMryIHv_No3A2GTNqT1HM4oLE7gOxlc-2cCoRqUXNNKF4Rhb2LPwv-H0uHbTpgF1oyndx",
    alt: "luxury spa scene with artisanal containers"
  },
  {
    title: "Fragrancias de Verao",
    note: "Vigencia: Ate 28/02",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCNVIE12dftI1ybbEjgbDdoAlm-Mn4LvuHeWp3noalAvm2Y7OnP41UA9PC3cnKaJgI_mZcXc0or_Tz_P5OCzNeuEdRtcV7-2ONeqLnzvr5RLJVLEE62EwhYOPxKcG4xMMSp7IlFXPizoi40PQQjrJ8EqW6bDoF0Gf-2gc4mnvJa004ewh3KqJ8OeeqOH5bbtX2mnup0ews2Jqrf7VWYAdEgbzKZjUDvbbU-EJ9jP2VTnPS4ESQIQteurxohVVWut_ngB5OqbHejhSQO",
    alt: "elegant perfume bottles with golden hour light"
  }
];

const highlightVisuals: HighlightVisual[] = [
  {
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCg7aS-3uH55aoNEJqFiYfu0qxQLCoWL7ORdK5lAAlp--3FtFzqHx7ZxNCnMiIJyGIFX-gvTLUENfmzJxDuK7wX0SMPWwyc-i9BbWaIom8DgfCbM6ZHmSJQPs-6VL_7vn64xkXSmR3qvOnum-mimOaRja71WpM-6o5uSYXRCSqNOaA1m1fHEo3TYtbGFejlKO_YnpIwGZFifznxhCebDEikVSE4nnBTXGO6phON6bK2nlJSflw-4ptvxU3Ait-HzCZHubHYiMCiRdtM",
    alt: "luxury face serum bottle",
    title: "Serum Facial Lumiere",
    brand: "Beaute Lab",
    stars: 5,
    clicks: "1.284",
    trendLabel: "12%",
    trendTone: "up"
  },
  {
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuClVSczN2aohlq1M2PlkBNMYKxcIhXzNNozei_Q_O0BWJvlUsp0YHXvEv-ciVAZVCeT5KpCje_8pQAgQadFw7R5mYDzppNaOxi4MQBT2CodgL1O1mydo3ILQbQtaSjSbbURvZZPamRUtUm0YfO2Gnv6Phd_WkvYglzSN1KiuRE45YdT0zrxVNetKylHMEUOvDIz9xgzkS2O0DwygGCaVzcst-Ahyq74bRr-L8iIm22KYNhZQbCC291LCWLVqX8kgdpQ2qgTw5u0LoxI",
    alt: "luxury cosmetic cream jar",
    title: "Creme Hidratante Noite",
    brand: "Organique Botanics",
    stars: 4,
    clicks: "956",
    trendLabel: "-",
    trendTone: "flat"
  },
  {
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCriX9SbaWnD1Xnl2vK50BRJLPQ9hA-AY6Gi2CwVgkx-r3WSOl2ZnAy5fw21_qbcTc_rJKvm4wYIY6jASMfmHIfxabpx6oe1ec2b6wcCsKTWIpZ6LK47MNqJoHRgrYO8BFrZZ25xyo7np9oVDl8cS0mFr0i989G1IBu74cN0zotVf3EK_RZPTlqWwkSmzGSUSRE27y_xh_k16u0PpOm5CW78e-GPFgeGuuVV8M-Fl_BHAvWmTfBhh7JW5pyV8TcMMBqfu0TFG_67apa",
    alt: "minimalist perfume bottle",
    title: "Eau de Parfum Intense",
    brand: "Oud Maison",
    stars: 3,
    clicks: "812",
    trendLabel: "4%",
    trendTone: "down"
  }
];

const slotDisplays: SlotDisplay[] = [
  {
    title: "Colecao Essenciais de Verao",
    period: "01 Dez - 28 Fev",
    slotLabel: "Hero principal",
    status: "Ativo"
  },
  {
    title: "Lancamento Palette Nude",
    period: "Inicia em 15 Mar",
    slotLabel: "Hero secundario",
    status: "Agendado"
  }
];

const avatarImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA1_kf_3I2JsVepNHg-nKBYRkm5QcrCPANSuFgeCq4cLFQrxGVA-0I4XU7o7QDYUMtI_xW-NTImuvAb-E4liICP0LLGj53s-er7SZuRLUZzsC6rtE7p4A-VizvjixN-Ul4FRwa3cyrJuy2JxHQiNcqCjXsvMAn8pIkNWTbE6pol4a_b4QhpYWJZQRiMI1AbpFQj4u4Nt0OrPBk2ApuypMj6J-M9rHciFCeyO04mZIs-DtBgHIXocQJUxEMw5MH2p9CKDICRVyFjN4Ud";

function shelfStateChip(status: Campaign["status"]) {
  if (status === "destaque" || status === "aprovado" || status === "premium") {
    return "bg-white/80 text-[var(--shelves-text)]";
  }

  if (status === "em-revisao" || status === "pendente") {
    return "bg-[rgba(226,227,217,0.82)] text-[var(--shelves-text)]";
  }

  return "bg-[rgba(255,132,130,0.16)] text-[#7b292a]";
}

function buildHighlightProducts(products: Product[], productFilter?: string) {
  const featured = products.filter((product) => product.featured);
  const prioritized = productFilter
    ? [
        ...featured.filter((product) => product.id === productFilter),
        ...featured.filter((product) => product.id !== productFilter)
      ]
    : featured;

  return prioritized.slice(0, 3);
}

function SidebarLink({ item }: { item: SidebarItem }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={`flex items-center gap-4 px-8 py-3 text-sm transition-all ${
        item.active
          ? "border-l-2 border-[var(--shelves-primary)] pl-4 font-semibold text-[var(--shelves-text)]"
          : "text-[var(--shelves-primary)] hover:bg-[var(--shelves-surface-muted)]"
      }`}
    >
      <Icon className="h-5 w-5" strokeWidth={1.7} />
      <span>{item.label}</span>
    </Link>
  );
}

function EditorialStars({ stars }: { stars: number }) {
  return (
    <div className="flex items-center justify-center gap-1">
      {Array.from({ length: 5 }, (_, index) => {
        const active = index < stars;
        return (
          <Star
            key={`star-${index}`}
            className={`h-4 w-4 ${active ? "text-[#c9b46e]" : "text-[var(--shelves-outline-variant)]"}`}
            fill={active ? "currentColor" : "none"}
            strokeWidth={1.6}
          />
        );
      })}
    </div>
  );
}

export async function ContentShelvesPage({
  filters,
  searchParamsSource
}: ContentShelvesPageProps) {
  void searchParamsSource;

  const [dataSource, campaignResult] = await Promise.all([
    getAdmDataSource(),
    Promise.resolve(
      campaignsRepository.listCampaigns({
        page: 1,
        pageSize: 12,
        sortBy: "upliftPct",
        sortDir: "desc",
        status: filters.status,
        period: filters.period,
        campaign: filters.campaign,
        q: filters.q
      })
    )
  ]);

  const scopedCampaigns = campaignResult.data.items
    .filter((campaign) => (filters.seller ? campaign.sellerIds.includes(filters.seller) : true))
    .filter((campaign) => (filters.product ? campaign.productIds.includes(filters.product) : true));

  const heroSlots = (scopedCampaigns.length ? scopedCampaigns : dataSource.campaigns).slice(0, 2);
  const featuredProducts = buildHighlightProducts(dataSource.products, filters.product);

  return (
    <div className="flex min-h-screen bg-[var(--shelves-bg)] text-[var(--shelves-text)]" style={shelvesTheme}>
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col gap-y-6 border-r border-[rgba(177,179,169,0.15)] bg-[var(--shelves-sidebar)] py-8 text-sm tracking-wide">
        <div className="mb-4 px-8">
          <h1 className={`${notoSerif.className} text-lg text-[var(--shelves-text)]`}>Editorial Admin</h1>
          <p className="mt-1 text-xs uppercase tracking-[0.24em] text-[var(--shelves-primary)]">
            Marketplace Premium
          </p>
        </div>

        <nav className="flex flex-col gap-y-1">
          {sidebarItems.map((item) => (
            <SidebarLink key={item.href} item={item} />
          ))}
        </nav>

        <div className="mt-auto flex items-center gap-3 px-8">
          <div className="relative h-8 w-8 overflow-hidden rounded-full bg-[var(--shelves-surface-high)]">
            <Image src={avatarImage} alt="Beatriz S." fill sizes="32px" className="object-cover" />
          </div>
          <div>
            <p className="text-xs font-bold text-[var(--shelves-text)]">Beatriz S.</p>
            <p className="text-[10px] uppercase text-[var(--shelves-primary)]">Head of Curation</p>
          </div>
        </div>
      </aside>

      <main className="ml-64 flex-1 overflow-y-auto p-12">
        <header className="mb-16 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <h2 className={`${notoSerif.className} text-3xl font-normal tracking-tight text-[var(--shelves-text)]`}>
              Conteudo & Vitrines
            </h2>
            <p className="mt-1 text-sm font-light italic text-[var(--shelves-primary)]">
              Orquestracao editorial da home, categorias e slots premium
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl border border-[rgba(177,179,169,0.2)] bg-[var(--shelves-surface)] px-6 py-2.5 text-xs font-medium uppercase tracking-[0.18em] text-[var(--shelves-text)] transition-colors hover:bg-white"
            >
              <Eye className="h-4 w-4" strokeWidth={1.8} />
              Preview Loja
            </Link>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--shelves-primary)] px-8 py-2.5 text-xs font-medium uppercase tracking-[0.18em] text-white transition-colors hover:bg-[#535252]"
            >
              <Plus className="h-4 w-4" strokeWidth={1.8} />
              Nova Vitrine
            </button>
          </div>
        </header>

        <section className="mb-20">
          <div className="mb-8 flex items-end justify-between border-b border-[rgba(177,179,169,0.1)] pb-4">
            <h3 className={`${notoSerif.className} text-xl text-[var(--shelves-text)]`}>Slots Hero</h3>
            <button
              type="button"
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--shelves-primary)] transition-colors hover:text-[var(--shelves-text)]"
            >
              <ArrowUpDown className="h-4 w-4" strokeWidth={1.7} />
              Ordenar Slots
            </button>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {heroSlots.map((campaign, index) => {
              const visual = heroSlotVisuals[index] ?? heroSlotVisuals[0];
              const display = slotDisplays[index] ?? slotDisplays[0];

              return (
                <article
                  key={campaign.id}
                  className={`group relative rounded-xl bg-[var(--shelves-surface)] p-4 transition-all duration-500 hover:shadow-[var(--shelves-shadow)] ${
                    filters.campaign === campaign.id ? "ring-1 ring-[rgba(95,94,94,0.25)]" : ""
                  }`}
                >
                  <div className="relative mb-4 aspect-[16/9] overflow-hidden rounded-md bg-[var(--shelves-surface-muted)]">
                    <Image
                      src={visual.image}
                      alt={visual.alt}
                      fill
                      sizes="(max-width: 1024px) 100vw, 33vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute left-6 top-6 flex gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-tight backdrop-blur-md ${shelfStateChip(
                          campaign.status
                        )}`}
                      >
                        {display.status}
                      </span>
                    </div>
                  </div>

                  <div className="px-1">
                    <h4 className="text-sm font-medium text-[var(--shelves-text)]">{display.title}</h4>
                    <div className="mt-2 flex items-center gap-2 text-xs font-light text-[var(--shelves-primary)]">
                      <span>{display.period}</span>
                    </div>
                    <div className="mt-6 flex items-center justify-between border-t border-[rgba(177,179,169,0.1)] pt-4">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--shelves-outline)]">
                          {display.slotLabel}
                        </span>
                        <p className="mt-1 text-[10px] text-[var(--shelves-primary)]">
                          {campaign.productIds.length} SKU(s) - {campaign.sellerIds.length} seller(s)
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <Link
                          href={`/adm/catalogo-marca/campanhas?campaign=${campaign.id}`}
                          className="text-[var(--shelves-primary)] transition-colors hover:text-[var(--shelves-text)]"
                        >
                          <Settings2 className="h-5 w-5" strokeWidth={1.7} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}

            <button
              type="button"
              className="group flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[rgba(177,179,169,0.3)] p-8 transition-colors hover:border-[rgba(95,94,94,0.4)]"
            >
              <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--shelves-surface-muted)] transition-colors group-hover:bg-[rgba(95,94,94,0.1)]">
                <ImagePlus className="h-5 w-5 text-[var(--shelves-primary)]" strokeWidth={1.7} />
              </span>
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--shelves-primary)]">
                Adicionar Novo Slot
              </span>
              <span className="mt-1 text-[10px] italic text-[var(--shelves-outline)]">
                Hero, categoria ou grade secundaria
              </span>
            </button>
          </div>
        </section>

        <div className="mb-20 grid grid-cols-1 gap-12 lg:grid-cols-12">
          <section className="lg:col-span-7">
            <div className="mb-8 flex items-end justify-between border-b border-[rgba(177,179,169,0.1)] pb-4">
              <h3 className={`${notoSerif.className} text-xl text-[var(--shelves-text)]`}>
                Vitrines Inteligentes
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--shelves-outline)]">
                4 vitrines ativas
              </span>
            </div>

            <div className="space-y-4">
              {shelfItems.map((item) => {
                const Icon = item.icon;

                return (
                  <article
                    key={item.title}
                    className={`flex items-center gap-6 rounded-xl border p-6 transition-colors ${
                      item.visible
                        ? "border-transparent bg-[var(--shelves-surface)] hover:border-[var(--shelves-surface-muted)] hover:bg-[#fcfcfc]"
                        : "border-transparent bg-[rgba(255,255,255,0.5)] opacity-60"
                    }`}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[var(--shelves-surface-muted)] text-[var(--shelves-primary)]">
                      <Icon className="h-5 w-5" strokeWidth={1.7} />
                    </div>
                    <div className="flex-1">
                      <h5 className="text-sm font-semibold text-[var(--shelves-text)]">{item.title}</h5>
                      <p className="text-xs font-light text-[var(--shelves-primary)]">{item.note}</p>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--shelves-outline)]">
                          Status
                        </p>
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight ${
                            item.visible
                              ? "bg-[#eef2e6] text-[#4d602f]"
                              : "bg-[var(--shelves-surface-high)] text-[var(--shelves-outline)]"
                          }`}
                        >
                          {item.status}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-[var(--shelves-surface-muted)]"
                      >
                        <Settings2 className="h-4 w-4 text-[var(--shelves-text-soft)]" strokeWidth={1.7} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="lg:col-span-5">
            <div className="mb-8 flex items-end justify-between border-b border-[rgba(177,179,169,0.1)] pb-4">
              <h3 className={`${notoSerif.className} text-xl text-[var(--shelves-text)]`}>Colecoes</h3>
              <button
                type="button"
                className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--shelves-primary)] underline-offset-4 hover:underline"
              >
                Ver Todas
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {collectionCards.map((card) => (
                <article key={card.title} className="group relative h-40 overflow-hidden rounded-xl">
                  <Image
                    src={card.image}
                    alt={card.alt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 40vw"
                    className="object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-[rgba(49,51,44,0.8)] via-[rgba(49,51,44,0.2)] to-transparent p-6">
                    <h6 className={`${notoSerif.className} text-lg leading-tight text-white`}>{card.title}</h6>
                    <p className="mt-1 text-[10px] italic uppercase tracking-[0.2em] text-white/70">
                      {card.note}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        <section>
          <div className="mb-8 flex flex-col justify-between gap-4 border-b border-[rgba(177,179,169,0.1)] pb-4 lg:flex-row lg:items-end">
            <h3 className={`${notoSerif.className} text-xl text-[var(--shelves-text)]`}>Destaques da Home</h3>
            <div className="flex gap-4">
              <div className="flex rounded-lg bg-[var(--shelves-surface-muted)] p-1">
                <button
                  type="button"
                  className="rounded bg-white px-4 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--shelves-text)] shadow-sm"
                >
                  Home
                </button>
                <button
                  type="button"
                  className="px-4 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--shelves-primary)] transition-colors hover:text-[var(--shelves-text)]"
                >
                  Categorias
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl bg-[var(--shelves-surface)]">
            <table className="w-full text-left">
              <thead className="border-b border-[rgba(177,179,169,0.1)] bg-[rgba(239,238,230,0.3)]">
                <tr>
                  <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--shelves-outline)]">
                    Posicao
                  </th>
                  <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--shelves-outline)]">
                    Produto
                  </th>
                  <th className="px-8 py-6 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--shelves-outline)]">
                    Score Editorial
                  </th>
                  <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--shelves-outline)]">
                    Clicks (24h)
                  </th>
                  <th className="px-8 py-6 text-right text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--shelves-outline)]">
                    Acoes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(177,179,169,0.05)]">
                {featuredProducts.map((product, index) => {
                  const visual = highlightVisuals[index] ?? highlightVisuals[highlightVisuals.length - 1];
                  const trendClass =
                    visual.trendTone === "up"
                      ? "text-[#4d602f]"
                      : visual.trendTone === "down"
                        ? "text-[#a23d3e]"
                        : "text-[var(--shelves-text-soft)]";

                  return (
                    <tr key={product.id} className="group transition-colors hover:bg-[var(--shelves-surface-low)]">
                      <td className="px-8 py-6">
                        <span className={`${notoSerif.className} text-lg italic text-[var(--shelves-primary)]`}>
                          #{index + 1}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="relative h-12 w-12 overflow-hidden rounded bg-[var(--shelves-bg)]">
                            <Image src={visual.image} alt={visual.alt} fill sizes="48px" className="object-cover" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[var(--shelves-text)]">{visual.title}</p>
                            <p className="text-[10px] uppercase tracking-tight text-[var(--shelves-outline)]">
                              {visual.brand}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <EditorialStars stars={visual.stars} />
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-sm text-[var(--shelves-text)]">
                          {visual.clicks}{" "}
                          <span className={`ml-1 text-xs ${trendClass}`}>
                            {visual.trendTone === "flat" ? "—" : visual.trendTone === "up" ? "↑" : "↓"}{" "}
                            {visual.trendLabel}
                          </span>
                        </p>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <Link
                          href={`/adm/curadoria/produtos?product=${product.id}`}
                          className="inline-flex text-[var(--shelves-primary)] transition-colors hover:text-[var(--shelves-text)]"
                        >
                          <MoreVertical className="h-5 w-5" strokeWidth={1.7} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <footer className="mt-20 flex flex-col justify-between gap-6 border-t border-[rgba(177,179,169,0.1)] pt-10 text-[var(--shelves-outline-variant)] lg:flex-row lg:items-center">
          <p className="text-[10px] uppercase tracking-[0.18em]">© BelaPop Editorial CMS 2024</p>
          <div className="flex flex-wrap gap-8 text-[10px] font-bold uppercase tracking-[0.18em]">
            <Link href="/adm/curadoria/regras" className="transition-colors hover:text-[var(--shelves-text)]">
              Guia de Estilo
            </Link>
            <Link href="/adm/catalogo-marca/campanhas" className="transition-colors hover:text-[var(--shelves-text)]">
              Campanhas
            </Link>
            <Link
              href="/adm/operacao/comunicacao-sellers"
              className="transition-colors hover:text-[var(--shelves-text)]"
            >
              Suporte Admin
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
