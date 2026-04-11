import Image from "next/image";
import Link from "next/link";
import { Noto_Serif } from "next/font/google";
import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bell,
  ChevronDown,
  Download,
  FileText,
  LayoutDashboard,
  Search,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Store,
  Truck,
  Users,
  Wallet
} from "lucide-react";

import { formatCurrency } from "@/lib/adm/format";
import { getAdmDataSource } from "@/lib/adm/repositories/source";
import type { AdmFilters, SearchParamsInput } from "@/lib/adm/url";

type ReportsPageProps = {
  filters: AdmFilters;
  searchParamsSource?: SearchParamsInput;
};

const notoSerif = Noto_Serif({
  subsets: ["latin"],
  weight: ["400", "500", "700"]
});

const reportsTheme = {
  "--reports-bg": "#fbf9f4",
  "--reports-sidebar": "#f5f4ed",
  "--reports-surface": "#ffffff",
  "--reports-surface-low": "#efeee6",
  "--reports-surface-high": "#e8e9e0",
  "--reports-surface-highest": "#e2e3d9",
  "--reports-text": "#31332c",
  "--reports-text-soft": "#5e6058",
  "--reports-outline": "#797c73",
  "--reports-outline-variant": "#b1b3a9",
  "--reports-primary": "#5f5e5e",
  "--reports-primary-dim": "#535252",
  "--reports-secondary": "#6e5b4d",
  "--reports-secondary-dim": "#625042",
  "--reports-tertiary": "#a23d3e",
  "--reports-shadow": "0 18px 40px rgba(49, 51, 44, 0.04)"
} as CSSProperties;

type SidebarItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  active?: boolean;
};

type Metric = {
  label: string;
  value: string;
  delta: string;
  tone: "green" | "secondary" | "tertiary";
  widthClass: string;
};

type CategoryPerformance = {
  name: string;
  value: string;
  barClass: string;
  widthPct?: number;
};

type BestSeller = {
  name: string;
  brand: string;
  units: string;
  margin: string;
  image: string;
  alt: string;
};

type SellerPerformance = {
  gmvValue?: number;
  initials: string;
  name: string;
  sales: string;
  growth: string;
  growthTone: "green" | "tertiary";
  returnRate: string;
  status: string;
  statusTone: "green" | "neutral" | "tertiary";
};

const sidebarItems: SidebarItem[] = [
  { label: "Dashboard", href: "/adm/dashboard-executivo", icon: LayoutDashboard },
  { label: "Curadoria", href: "/adm/curadoria/produtos", icon: Sparkles },
  { label: "Sellers", href: "/adm/operacao/parceiros", icon: Store },
  { label: "Pedidos", href: "/adm/operacao/pedidos-criticos", icon: ShoppingCart },
  { label: "Logística", href: "/adm/operacao/logistica", icon: Truck },
  { label: "Relatórios", href: "/adm/gestao/relatorios", icon: BarChart3, active: true },
  { label: "Financeiro", href: "/adm/financeiro", icon: Wallet },
  { label: "Clientes", href: "/adm/relacionamento/clientes", icon: Users },
  { label: "Configurações", href: "/adm/gestao/configuracoes", icon: Settings }
];

const metrics: Metric[] = [
  {
    label: "Total de Vendas",
    value: "R$ 142.850",
    delta: "+12%",
    tone: "green",
    widthClass: "w-2/3"
  },
  {
    label: "Margem Média",
    value: "32.4%",
    delta: "-1.2%",
    tone: "secondary",
    widthClass: "w-[32%]"
  },
  {
    label: "Taxa de Devolução",
    value: "2.15%",
    delta: "+0.3%",
    tone: "tertiary",
    widthClass: "w-[15%]"
  },
  {
    label: "Clientes Ativos",
    value: "1.284",
    delta: "+8.5%",
    tone: "green",
    widthClass: "w-4/5"
  }
];

const categories: CategoryPerformance[] = [
  { name: "Skincare Premium", value: "R$ 58.400 (41%)", barClass: "w-[41%] bg-[var(--reports-primary)]", widthPct: 41 },
  {
    name: "Maquiagem Editorial",
    value: "R$ 32.200 (23%)",
    barClass: "w-[23%] bg-[var(--reports-secondary)]",
    widthPct: 23
  },
  {
    name: "Fragrâncias de Nicho",
    value: "R$ 28.500 (20%)",
    barClass: "w-[20%] bg-[var(--reports-primary-dim)]",
    widthPct: 20
  },
  {
    name: "Hair Care de Luxo",
    value: "R$ 23.750 (16%)",
    barClass: "w-[16%] bg-[var(--reports-outline-variant)]",
    widthPct: 16
  }
];

const topProducts: BestSeller[] = [
  {
    name: "Divine Face Oil",
    brand: "L'Occitane en Provence",
    units: "124 Unidades",
    margin: "Margem: 42%",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDlTeoiV_otETlWKCLKInDSnhoPVBmiElTrs_grH1iCqrmRLEImn2eB9fqa0_cg5d3F1r72ejnpsIzoSwGO7RNkjqR7ostInvZ5Z6eoMa_ZhUoIU24HZjKqKpxOgSXjPJDaGaBW3PxhWoyt0ZSLD6seY6GywXINeHcF9B76OdVIf4CwlfVgb_zOfJcVV3ofVRUXYPNOQ3B235lU9ACUanAru34SW-FxRi_Uqiveg624SLE0etF6KZQTUYLKcIHkLUqHVN5pY_PuwjwG",
    alt: "luxury skincare bottle on a marble pedestal with soft neutral lighting and minimal composition"
  },
  {
    name: "Palette Terre d'Ombre",
    brand: "Maison de Beauté",
    units: "98 Unidades",
    margin: "Margem: 38%",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBxqdDiXtd7yRszMdcBxzHm_Ggf_N1fkAf7pMDhxlqtf9Ux2n-etvlHb41law3b7YeeLX-WvC7DISwBHfyVBnC0WjIb0Vloc2dAUrRNiVPQxDmZk9gRZyrgRKNV06q8YeJwfs3ejE00bkqKZ6YseJT6V49umHsVlQj7GTjKi5iSDx07vYVThIGf6wPsNjgEJlct2pELWIwMOjQtMzt8MfNBYyuFHCV6-aMWiHalO9kVVQIy2lWKsL9_CQP8i7rUT1loOpbX7jaMypO_",
    alt: "minimalist makeup palette with soft earth tones and elegant gold detailing on a neutral background"
  },
  {
    name: "Nocturne d'Orient",
    brand: "Atelier Cologne",
    units: "82 Unidades",
    margin: "Margem: 45%",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAcAsafGIELnIMr4goOOeETdU7gtktx6ZN2LGW_OO35g6yYLPw_EcpWDrE4JrQuNP26BrPWPq6o_vuCgRaw_yvniCNiRWWd7kdIWXDz4ag4CL-vMVaKdHPzOewVaPI9RNpRAniCcfjSAki2ZogRMZkrpbZmFGx28JkWZnRlDUpFNfXyCK4ZoxKepCI8cHrHWF7V7XK6mHxqY0VUB10la5sXJpL58e2Ae3xwEKvqMYtFtbrsujrYMHT74FgQfYVU174BixJuUxggIt8S",
    alt: "high-end perfume bottle with clear glass and minimalist black typography on a soft beige surface"
  }
];

const sellerPerformance: SellerPerformance[] = [
  {
    initials: "AB",
    name: "Atelier de Beauté Paris",
    sales: "R$ 42.150,00",
    growth: "+15.2%",
    growthTone: "green",
    returnRate: "1.2%",
    status: "Top Performer",
    statusTone: "green"
  },
  {
    initials: "MP",
    name: "Maison de Parfum",
    sales: "R$ 28.900,00",
    growth: "+8.7%",
    growthTone: "green",
    returnRate: "2.4%",
    status: "Estável",
    statusTone: "neutral"
  },
  {
    initials: "SG",
    name: "Skin Glow & Co",
    sales: "R$ 19.420,00",
    growth: "-3.1%",
    growthTone: "tertiary",
    returnRate: "4.8%",
    status: "Revisão",
    statusTone: "tertiary"
  }
];

function ReportsSidebarLink({ item }: { item: SidebarItem }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 pl-4 text-sm tracking-wide transition-all duration-200 ${
        item.active
          ? "translate-x-1 border-l-2 border-[var(--reports-primary)] font-bold text-[var(--reports-text)]"
          : "translate-x-1 text-[var(--reports-primary)] hover:text-[var(--reports-text)]"
      }`}
    >
      <Icon className="h-5 w-5" strokeWidth={1.7} />
      <span>{item.label}</span>
    </Link>
  );
}

function FilterField({
  label,
  options
}: {
  label: string;
  options: string[];
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] uppercase tracking-[0.2em] text-[var(--reports-outline)]">
        {label}
      </label>
      <div className="relative">
        <select className="w-full appearance-none rounded-lg border-none bg-[var(--reports-surface)] px-4 py-2.5 text-sm ring-1 ring-[rgba(177,179,169,0.15)] outline-none focus:ring-[var(--reports-primary)]">
          {options.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[var(--reports-outline)]"
          strokeWidth={1.8}
        />
      </div>
    </div>
  );
}

function MetricCard({ metric }: { metric: Metric }) {
  const deltaClass =
    metric.tone === "green"
      ? "text-green-600"
      : metric.tone === "secondary"
        ? "text-[var(--reports-secondary)]"
        : "text-[var(--reports-tertiary)]";
  const barClass =
    metric.tone === "green"
      ? "bg-[var(--reports-primary)]"
      : metric.tone === "secondary"
        ? "bg-[var(--reports-secondary)]"
        : "bg-[var(--reports-tertiary)]";

  return (
    <article className="rounded-xl border border-[rgba(177,179,169,0.1)] bg-[var(--reports-surface)] p-8 transition-colors duration-500 hover:bg-[var(--reports-surface-low)]">
      <p className="mb-4 text-[10px] uppercase tracking-[0.15em] text-[var(--reports-outline)]">
        {metric.label}
      </p>
      <div className="flex items-baseline gap-2">
        <span className={`text-3xl ${notoSerif.className}`}>{metric.value}</span>
        <span className={`text-xs ${deltaClass}`}>{metric.delta}</span>
      </div>
      <div className="mt-6 h-1 w-full overflow-hidden rounded-full bg-[var(--reports-surface-high)]">
        <div className={`h-full ${metric.widthClass} ${barClass} transition-all duration-1000`} />
      </div>
    </article>
  );
}

function ProductRow({ product, bordered = false }: { product: BestSeller; bordered?: boolean }) {
  return (
    <div
      className={`flex cursor-pointer items-center justify-between py-4 ${
        bordered ? "border-t border-[rgba(177,179,169,0.08)]" : ""
      }`}
    >
      <div className="flex items-center gap-6">
        <Image
          className="h-14 w-14 rounded-lg bg-[var(--reports-bg)] object-cover shadow-sm"
          src={product.image}
          alt={product.alt}
          width={56}
          height={56}
        />
        <div>
          <h4 className="text-sm font-bold">{product.name}</h4>
          <p className={`text-xs italic text-[var(--reports-outline)] ${notoSerif.className}`}>
            {product.brand}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-bold">{product.units}</p>
        <p className="text-[10px] uppercase tracking-tight text-green-600">{product.margin}</p>
      </div>
    </div>
  );
}

function StatusPill({ tone, label }: { tone: SellerPerformance["statusTone"]; label: string }) {
  const classes =
    tone === "green"
      ? "bg-green-100 text-green-800"
      : tone === "tertiary"
        ? "bg-[rgba(162,61,62,0.1)] text-[var(--reports-tertiary)]"
        : "bg-[var(--reports-surface-high)] text-[rgba(49,51,44,0.7)]";

  return (
    <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${classes}`}>
      {label}
    </span>
  );
}

export async function ReportsPage({ filters: _filters, searchParamsSource: _searchParamsSource }: ReportsPageProps) {
  const data = await getAdmDataSource();
  const sellerMap = Object.fromEntries(data.sellers.map((seller) => [seller.id, seller]));
  const productMap = Object.fromEntries(data.products.map((product) => [product.id, product]));
  const refundsByOrderId = Object.fromEntries(data.refunds.map((refund) => [refund.orderId, refund]));
  const totalSales = data.orders.reduce((sum, order) => sum + order.total, 0);
  const averageMargin = data.orders.length > 0 ? (data.orders.reduce((sum, order) => sum + order.total * 0.32, 0) / totalSales) * 100 : 0;
  const returnRate = data.orders.length > 0 ? (data.refunds.length / data.orders.length) * 100 : 0;
  const premiumCustomers = data.customers.filter((customer) => customer.segment === "premium").length;
  const reportMetrics: Metric[] = [
    {
      label: "Total de Vendas",
      value: formatCurrency(totalSales),
      delta: `+${Math.round((data.orders.filter((order) => order.status === "aprovado" || order.status === "resolvido").length / Math.max(data.orders.length, 1)) * 100)}%`,
      tone: "green",
      widthClass: "w-2/3"
    },
    {
      label: "Margem Media",
      value: `${averageMargin.toFixed(1)}%`,
      delta: `${data.financialAlerts.length > 1 ? "-" : "+"}${(data.financialAlerts.length * 0.4).toFixed(1)}%`,
      tone: "secondary",
      widthClass: "w-[32%]"
    },
    {
      label: "Taxa de Devolucao",
      value: `${returnRate.toFixed(2)}%`,
      delta: `+${(data.refunds.filter((refund) => refund.status !== "resolvido").length * 0.3).toFixed(1)}%`,
      tone: "tertiary",
      widthClass: "w-[15%]"
    },
    {
      label: "Clientes Ativos",
      value: String(data.customers.length),
      delta: `+${premiumCustomers}%`,
      tone: "green",
      widthClass: "w-4/5"
    }
  ];
  const categoryGroups = Array.from(new Set(data.products.map((product) => product.category))).map((category) => {
    const products = data.products.filter((product) => product.category === category);
    const productIds = new Set(products.map((product) => product.id));
    const sales = data.orders
      .filter((order) => productIds.has(order.productId))
      .reduce((sum, order) => sum + order.total, 0);
    const share = totalSales > 0 ? Math.round((sales / totalSales) * 100) : 0;

    return {
      name: category,
      value: `${formatCurrency(sales)} (${share}%)`,
      barClass: "bg-[var(--reports-primary)]",
      share
    };
  });
  const liveCategories: CategoryPerformance[] = categoryGroups
    .sort((left, right) => right.share - left.share)
    .slice(0, 4)
    .map((category, index) => ({
      name: category.name,
      value: category.value,
      barClass:
        index === 0
          ? "bg-[var(--reports-primary)]"
          : index === 1
            ? "bg-[var(--reports-secondary)]"
            : index === 2
              ? "bg-[var(--reports-primary-dim)]"
              : "bg-[var(--reports-outline-variant)]",
      widthPct: Math.max(category.share, 16)
    }));
  const productSales = data.products
    .map((product) => {
      const orders = data.orders.filter((order) => order.productId === product.id);
      return {
        product,
        units: orders.length,
        sales: orders.reduce((sum, order) => sum + order.total, 0)
      };
    })
    .sort((left, right) => right.units - left.units || right.sales - left.sales)
    .slice(0, 3);
  const liveTopProducts: BestSeller[] = productSales.map((entry, index) => ({
    name: entry.product.name,
    brand: sellerMap[entry.product.sellerId]?.name ?? "Seller removido",
    units: `${entry.units} unidades`,
    margin: `Margem: ${Math.max(22, Math.round(entry.product.qualityScore * 0.42))}%`,
    image: topProducts[index % topProducts.length].image,
    alt: topProducts[index % topProducts.length].alt
  }));
  const liveSellerPerformance: SellerPerformance[] = data.sellers
    .map((seller) => {
      const sellerOrders = data.orders.filter((order) => order.sellerId === seller.id);
      const sellerRefunds = sellerOrders.filter((order) => refundsByOrderId[order.id]);
      const growth = seller.status === "bloqueado" || seller.riskLevel === "critica" ? -3.1 : seller.tier === "premium" ? 15.2 : 8.7;
      return {
        gmvValue: seller.gmv30d,
        initials: seller.name
          .split(" ")
          .slice(0, 2)
          .map((part) => part[0]?.toUpperCase())
          .join(""),
        name: seller.name,
        sales: formatCurrency(seller.gmv30d),
        growth: `${growth > 0 ? "+" : ""}${growth.toFixed(1)}%`,
        growthTone: (growth > 0 ? "green" : "tertiary") as "green" | "tertiary",
        returnRate: `${((sellerRefunds.length / Math.max(sellerOrders.length, 1)) * 100).toFixed(1)}%`,
        status:
          seller.qualityScore >= 90 ? "Top Performer" : seller.status === "bloqueado" ? "Revisao" : "Estavel",
        statusTone:
          (seller.qualityScore >= 90
            ? "green"
            : seller.status === "bloqueado"
              ? "tertiary"
              : "neutral") as "green" | "neutral" | "tertiary"
      };
    })
    .sort((left, right) => right.gmvValue - left.gmvValue)
    .slice(0, 6);
  return (
    <div className="min-h-screen bg-[var(--reports-bg)] text-[var(--reports-text)]" style={reportsTheme}>
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col overflow-y-auto bg-[var(--reports-sidebar)] px-4 py-8">
        <div className="mb-12 px-4">
          <span className={`mb-1 block text-xl text-[var(--reports-text)] ${notoSerif.className}`}>
            BelaPop
          </span>
          <span className="text-[10px] uppercase tracking-[0.28em] text-[var(--reports-primary)] opacity-70">
            Backoffice Premium
          </span>
        </div>

        <nav className="space-y-6 text-sm tracking-wide">
          {sidebarItems.map((item) => (
            <ReportsSidebarLink key={item.href} item={item} />
          ))}
        </nav>

        <div className="mt-auto flex items-center gap-3 border-t border-[rgba(177,179,169,0.1)] px-4 pt-8">
          <div className="h-8 w-8 overflow-hidden rounded-full bg-[var(--reports-surface-highest)]">
            <Image
              alt="BelaPop Admin"
              className="h-full w-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBNymLNKD3JuMSRSkOoN80xdGIzi_NhrXUdapUxQrTKuyCeKM-uvabqy5t2NI1VC5C97Lvn4yByox4OrOtyOwpjwRHiVfmWX4HH0Wl1kRRpxgDAZTSeLXyJEuN4DsCdbo9Ok4OKvSeFyYK_VuMq2tDnzjQqx9rFinRJeDz7BCmKAz0QAg6qhVMjn8yCD738mU5eP_mdm3jWsBp8sMgLID9jCgcaD_cF059spFdMkyDZdrffss_QlHEANnZ63Amk0ruw6xS2iMTvdlO0"
              width={32}
              height={32}
            />
          </div>
          <div>
            <p className="text-xs font-bold">Admin BelaPop</p>
            <p className="text-[10px] opacity-60">Level 4</p>
          </div>
        </div>
      </aside>

      <main className="ml-64 min-h-screen pb-20">
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between bg-[var(--reports-bg)] px-12">
          <div className="flex items-center gap-6">
            <h1 className={`text-2xl italic text-[var(--reports-text)] ${notoSerif.className}`}>
              BelaPop
            </h1>
          </div>
          <div className="flex items-center gap-6">
            <button
              type="button"
              aria-label="Buscar"
              className="text-[var(--reports-primary)] opacity-70"
            >
              <Search className="h-5 w-5" strokeWidth={1.8} />
            </button>
            <div className="flex gap-4">
              <button
                type="button"
                aria-label="Notificações"
                className="text-[var(--reports-primary)] opacity-90 transition-opacity hover:opacity-100"
              >
                <Bell className="h-5 w-5" strokeWidth={1.8} />
              </button>
              <button
                type="button"
                aria-label="Pedidos"
                className="text-[var(--reports-primary)] opacity-90 transition-opacity hover:opacity-100"
              >
                <ShoppingBag className="h-5 w-5" strokeWidth={1.8} />
              </button>
            </div>
          </div>
        </header>

        <div className="block h-px w-full bg-[var(--reports-surface-low)]" />

        <div className="mx-auto max-w-[1200px] px-12 pt-12">
          <div className="mb-16 flex flex-col items-end justify-between gap-6 md:flex-row">
            <div className="space-y-2 self-start">
              <span className="text-[11px] uppercase tracking-[0.2em] text-[var(--reports-outline)]">
                Dashboard de Curadoria
              </span>
              <h2 className={`text-5xl tracking-tight text-[var(--reports-text)] ${notoSerif.className}`}>
                Relatórios e Performance
              </h2>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                className="group flex items-center gap-2 rounded-xl bg-[var(--reports-surface-highest)] px-8 py-3 text-sm tracking-wide text-[var(--reports-text)] transition-all hover:bg-[var(--reports-surface-high)]"
              >
                <Download className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" strokeWidth={1.8} />
                Exportar CSV
              </button>
              <button
                type="button"
                className="group flex items-center gap-2 rounded-xl bg-[var(--reports-primary)] px-8 py-3 text-sm tracking-wide text-white shadow-lg shadow-[rgba(95,94,94,0.1)] transition-all hover:bg-[var(--reports-primary-dim)]"
              >
                <FileText className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" strokeWidth={1.8} />
                Exportar PDF
              </button>
            </div>
          </div>

          <div className="mb-12 grid grid-cols-1 gap-6 rounded-xl bg-[var(--reports-surface-low)] p-8 md:grid-cols-4">
            <FilterField label="Período" options={["Últimos 30 dias", "Trimestre Atual", "Ano Civil"]} />
            <FilterField
              label="Seller"
              options={["Todos os Vendedores", "Atelier de Beauté", "Maison de Parfum"]}
            />
            <FilterField
              label="Categoria"
              options={["Todas as Categorias", "Skincare Premium", "Maquiagem Editorial"]}
            />
            <div className="flex items-end">
              <button
                type="button"
                className="h-[42px] w-full rounded-lg bg-[var(--reports-secondary)] text-xs uppercase tracking-[0.2em] text-white transition-colors hover:bg-[var(--reports-secondary-dim)]"
              >
                Filtrar
              </button>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-8 pb-16">
            <div className="col-span-12 grid grid-cols-1 gap-6 md:grid-cols-4">
              {(data.orders.length > 0 ? reportMetrics : metrics).map((metric) => (
                <MetricCard key={metric.label} metric={metric} />
              ))}
            </div>

            <section className="col-span-12 rounded-xl bg-[var(--reports-surface)] p-10 lg:col-span-5">
              <h3 className={`mb-10 text-2xl text-[var(--reports-text)] ${notoSerif.className}`}>
                Vendas por Categoria
              </h3>
              <div className="space-y-8">
                {(liveCategories.length > 0 ? liveCategories : categories).map((category) => (
                  <div key={category.name} className="group">
                    <div className="mb-2 flex justify-between">
                      <span className="text-sm font-medium">{category.name}</span>
                      <span className="text-sm text-[var(--reports-outline)]">{category.value}</span>
                    </div>
                    <div className="h-0.5 w-full overflow-hidden bg-[var(--reports-surface-high)]">
                      <div
                        className={`h-full origin-left transition-transform duration-500 group-hover:scale-x-105 ${category.barClass}`}
                        style={category.widthPct ? { width: `${category.widthPct}%` } : undefined}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="col-span-12 rounded-xl bg-[var(--reports-surface)] p-10 lg:col-span-7">
              <div className="mb-10 flex items-center justify-between">
                <h3 className={`text-2xl text-[var(--reports-text)] ${notoSerif.className}`}>
                  Produtos Mais Vendidos
                </h3>
                <Link
                  href="/adm/curadoria/produtos"
                  className="border-b border-[rgba(95,94,94,0.2)] pb-1 text-xs uppercase tracking-[0.2em] transition-all hover:border-[var(--reports-primary)]"
                >
                  Ver todos
                </Link>
              </div>
              <div className="space-y-6">
                {(liveTopProducts.length > 0 ? liveTopProducts : topProducts).map((product, index) => (
                  <ProductRow key={product.name} product={product} bordered={index > 0} />
                ))}
              </div>
            </section>

            <section className="col-span-12 overflow-x-auto rounded-xl bg-[var(--reports-surface)] p-10">
              <h3 className={`mb-10 text-2xl text-[var(--reports-text)] ${notoSerif.className}`}>
                Performance por Seller
              </h3>
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-[rgba(177,179,169,0.1)]">
                    <th className="pb-6 text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--reports-outline)]">
                      Vendedor
                    </th>
                    <th className="pb-6 text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--reports-outline)]">
                      Volume de Vendas
                    </th>
                    <th className="pb-6 text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--reports-outline)]">
                      Crescimento
                    </th>
                    <th className="pb-6 text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--reports-outline)]">
                      Taxa Retorno
                    </th>
                    <th className="pb-6 text-right text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--reports-outline)]">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(177,179,169,0.06)]">
                  {(liveSellerPerformance.length > 0 ? liveSellerPerformance : sellerPerformance).map((seller) => (
                    <tr key={seller.name} className="transition-colors hover:bg-[var(--reports-bg)]">
                      <td className="py-8">
                        <div className="flex items-center gap-4">
                          <div
                            className={`flex h-8 w-8 items-center justify-center rounded-full bg-[var(--reports-surface-high)] text-sm ${notoSerif.className}`}
                          >
                            {seller.initials}
                          </div>
                          <span className="text-sm font-bold">{seller.name}</span>
                        </div>
                      </td>
                      <td className={`py-8 text-base ${notoSerif.className}`}>{seller.sales}</td>
                      <td className="py-8">
                        <span
                          className={`text-sm font-medium ${
                            seller.growthTone === "green"
                              ? "text-green-600"
                              : "text-[var(--reports-tertiary)]"
                          }`}
                        >
                          {seller.growth}
                        </span>
                      </td>
                      <td className="py-8">
                        <span
                          className={`text-sm ${
                            seller.growthTone === "tertiary"
                              ? "text-[var(--reports-tertiary)]"
                              : "text-[rgba(49,51,44,0.7)]"
                          }`}
                        >
                          {seller.returnRate}
                        </span>
                      </td>
                      <td className="py-8 text-right">
                        <StatusPill tone={seller.statusTone} label={seller.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
