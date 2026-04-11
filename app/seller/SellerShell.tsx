"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import LogoutButton from "@/components/LogoutButton";
import { LuxuryButton } from "@/components/LuxuryButton";
import PortalBackButton from "@/components/navigation/PortalBackButton";
import ActiveSellerSwitcher from "@/components/seller/ActiveSellerSwitcher";
import { trackSellerEvent } from "@/lib/analytics/sellerEvents";
import { useAuth } from "@/lib/AuthContext";

type GlobalPeriod = "today" | "7d" | "30d" | "mtd" | "custom";
type GlobalChannel = "all" | "organic" | "ads" | "showcase" | "search" | "recommended";
type CompareMode = "previous" | "month";
type CustomerType = "all" | "new" | "returning";

const SAVED_VIEW_KEY = "belapop.seller.saved_view.v2";

const navItems = [
  { href: "/parceiro", label: "Visao Geral" },
  { href: "/seller/orders", label: "Pedidos" },
  { href: "/seller/products", label: "Produtos" },
  { href: "/seller/inventory", label: "Estoque & Validade" },
  { href: "/seller/campaigns", label: "Campanhas & Ads" },
  { href: "/seller/support", label: "Atendimento" },
  { href: "/seller/finance", label: "Financeiro" },
  { href: "/seller/reputation", label: "Reputacao & Qualidade" },
  { href: "/seller/reports", label: "Relatorios" },
  { href: "/seller/alerts", label: "Alertas & Regras" },
  { href: "/seller/automations", label: "Automacoes" },
  { href: "/seller/analytics", label: "Analytics Avancado" },
  { href: "/seller/settings", label: "Configuracoes" },
  { href: "/seller/help", label: "Central do Vendedor" }
];

const periodOptions: Array<{ value: GlobalPeriod; label: string }> = [
  { value: "today", label: "Hoje" },
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "mtd", label: "MTD" },
  { value: "custom", label: "Personalizado" }
];

const channelOptions: Array<{ value: GlobalChannel; label: string }> = [
  { value: "all", label: "Todos canais" },
  { value: "organic", label: "Organico" },
  { value: "ads", label: "Ads" },
  { value: "showcase", label: "Vitrine" },
  { value: "search", label: "Search" },
  { value: "recommended", label: "Recomendados" }
];

const customerTypeOptions: Array<{ value: CustomerType; label: string }> = [
  { value: "all", label: "Todos clientes" },
  { value: "new", label: "Novos" },
  { value: "returning", label: "Recorrentes" }
];

const compareOptions: Array<{ value: CompareMode; label: string }> = [
  { value: "previous", label: "Periodo anterior" },
  { value: "month", label: "Mesmo periodo mes passado" }
];

const regionOptions = ["Todas regioes", "SP", "RJ", "MG", "PR", "RS", "BA", "SC", "GO", "DF"];
const categoryOptions = ["Todas categorias", "Skincare", "Maquiagem", "Bem-estar", "Cabelos", "Corpo"];

const isApprovedStatus = (status?: string) => status === "approved" || status === "active";

const getPrimaryAction = (pathname: string) => {
  if (pathname.startsWith("/seller/campaigns")) {
    return { href: "/seller/campaigns?create=1", label: "Criar promocao" };
  }

  if (pathname.startsWith("/seller/products")) {
    return { href: "/seller/products/new", label: "Adicionar produto" };
  }

  return { href: "/seller/products/new", label: "Adicionar produto" };
};

const isNavActive = (href: string, pathname: string) => {
  if (href === "/seller/products") return pathname.startsWith("/seller/products");
  if (href === "/seller/settings") {
    return pathname.startsWith("/seller/settings") || pathname.startsWith("/seller/profile");
  }
  return pathname === href;
};

const normalizePeriod = (value: string | null): GlobalPeriod => {
  if (value === "today" || value === "7d" || value === "30d" || value === "mtd" || value === "custom") {
    return value;
  }
  return "30d";
};

const normalizeChannel = (value: string | null): GlobalChannel => {
  if (value === "organic" || value === "ads" || value === "showcase" || value === "search" || value === "recommended" || value === "all") {
    return value;
  }
  return "all";
};

const normalizeCompare = (value: string | null): CompareMode => (value === "month" ? "month" : "previous");
const normalizeCustomerType = (value: string | null): CustomerType =>
  value === "new" || value === "returning" ? value : "all";

export default function SellerShell({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState<GlobalPeriod>("30d");
  const [channel, setChannel] = useState<GlobalChannel>("all");
  const [region, setRegion] = useState("Todas regioes");
  const [category, setCategory] = useState("Todas categorias");
  const [brand, setBrand] = useState("");
  const [line, setLine] = useState("");
  const [customerType, setCustomerType] = useState<CustomerType>("all");
  const [compareWith, setCompareWith] = useState<CompareMode>("previous");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [hasUnreadAlerts, setHasUnreadAlerts] = useState(false);
  const [savedViewLoaded, setSavedViewLoaded] = useState(false);

  useEffect(() => {
    if (!ready || !user) return;
    if (!isApprovedStatus(user.sellerProfile?.status)) {
      router.replace("/seller/activation");
    }
  }, [ready, user, router]);

  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
    setPeriod(normalizePeriod(searchParams.get("period")));
    setChannel(normalizeChannel(searchParams.get("channel")));
    setRegion(searchParams.get("region") ?? "Todas regioes");
    setCategory(searchParams.get("category") ?? "Todas categorias");
    setBrand(searchParams.get("brand") ?? "");
    setLine(searchParams.get("line") ?? "");
    setCustomerType(normalizeCustomerType(searchParams.get("customer_type")));
    setCompareWith(normalizeCompare(searchParams.get("compare")));
    setCustomStart(searchParams.get("start") ?? "");
    setCustomEnd(searchParams.get("end") ?? "");
  }, [searchParams]);

  useEffect(() => {
    if (!ready || !user) return;
    let active = true;

    void fetch("/api/seller/notifications?filter=unread&limit=1")
      .then((response) => (response.ok ? response.json() : { notifications: [] }))
      .then((data) => {
        if (!active) return;
        setHasUnreadAlerts((data.notifications?.length ?? 0) > 0);
      })
      .catch(() => {
        if (!active) return;
        setHasUnreadAlerts(false);
      });

    return () => {
      active = false;
    };
  }, [ready, user, pathname]);

  const currentSection = useMemo(
    () => navItems.find((item) => isNavActive(item.href, pathname))?.label ?? "Painel",
    [pathname]
  );

  if (!ready || !user) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-4xl items-center justify-center px-6">
        <p className="text-sm text-bpGraphite/70">Carregando...</p>
      </div>
    );
  }

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());

    if (query.trim()) params.set("q", query.trim());
    else params.delete("q");

    params.set("period", period);
    params.set("channel", channel);
    params.set("region", region);
    params.set("category", category);
    if (brand.trim()) params.set("brand", brand.trim());
    else params.delete("brand");
    if (line.trim()) params.set("line", line.trim());
    else params.delete("line");
    params.set("customer_type", customerType);
    params.set("compare", compareWith);

    if (period === "custom" && customStart && customEnd) {
      params.set("start", customStart);
      params.set("end", customEnd);
    } else {
      params.delete("start");
      params.delete("end");
    }

    const target = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(target);
    trackSellerEvent("filter_change", {
      period,
      channel,
      region,
      category,
      customer_type: customerType,
      compare: compareWith
    });
  };

  const clearFilters = () => {
    setQuery("");
    setPeriod("30d");
    setChannel("all");
    setRegion("Todas regioes");
    setCategory("Todas categorias");
    setBrand("");
    setLine("");
    setCustomerType("all");
    setCompareWith("previous");
    setCustomStart("");
    setCustomEnd("");
    router.replace(pathname);
  };

  const saveView = () => {
    if (typeof window === "undefined") return;
    const payload = {
      query,
      period,
      channel,
      region,
      category,
      brand,
      line,
      customerType,
      compareWith,
      customStart,
      customEnd
    };
    window.localStorage.setItem(SAVED_VIEW_KEY, JSON.stringify(payload));
    setSavedViewLoaded(true);
  };

  const restoreView = () => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(SAVED_VIEW_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as {
        query?: string;
        period?: GlobalPeriod;
        channel?: GlobalChannel;
        region?: string;
        category?: string;
        brand?: string;
        line?: string;
        customerType?: CustomerType;
        compareWith?: CompareMode;
        customStart?: string;
        customEnd?: string;
      };

      setQuery(parsed.query ?? "");
      setPeriod(parsed.period ?? "30d");
      setChannel(parsed.channel ?? "all");
      setRegion(parsed.region ?? "Todas regioes");
      setCategory(parsed.category ?? "Todas categorias");
      setBrand(parsed.brand ?? "");
      setLine(parsed.line ?? "");
      setCustomerType(parsed.customerType ?? "all");
      setCompareWith(parsed.compareWith ?? "previous");
      setCustomStart(parsed.customStart ?? "");
      setCustomEnd(parsed.customEnd ?? "");
      setSavedViewLoaded(true);
    } catch {
      setSavedViewLoaded(false);
    }
  };

  const primaryAction = getPrimaryAction(pathname);

  return (
    <div className="min-h-screen bg-[#F6F7F8] text-bpBlackSoft">
      <div className="mx-auto w-full max-w-[1440px] px-4 py-6 md:px-6">
        {!isApprovedStatus(user.sellerProfile?.status) ? (
          <div className="mb-6 rounded-2xl border border-bpPinkSoft bg-bpPinkSoft/20 px-5 py-4 text-sm text-bpPink/90">
            Sua loja ainda nao esta aprovada. Acompanhe em{" "}
            <Link href="/seller/activation" className="text-bpBlackSoft underline">
              /seller/activation
            </Link>
            .
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
          <aside className="h-fit rounded-3xl border border-white/12 bg-[#090a0f] p-5 text-white shadow-[0_12px_30px_rgba(0,0,0,0.25)] xl:sticky xl:top-6">
            <div className="border-b border-white/12 pb-4">
              <p className="text-[10px] uppercase tracking-[0.3em] text-white/78">Portal do lojista</p>
              <h2 className="mt-2 font-display text-2xl text-white">{user.sellerProfile?.storeName ?? "Sua loja"}</h2>
              <p className="mt-2 text-xs text-white/92">{user.email}</p>
              <ActiveSellerSwitcher variant="dark" className="mt-4" />
            </div>

            <nav className="mt-4 flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-2xl border px-4 py-2.5 text-sm transition ${
                    isNavActive(item.href, pathname)
                      ? "border-bpPink/60 bg-bpPink/20 text-white shadow-[0_0_0_1px_rgba(209,74,122,0.08)]"
                      : "border-transparent text-white/95 hover:border-white/15 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="mt-5 flex flex-col gap-2">
              <LuxuryButton tone="retail" href={primaryAction.href}>
                {primaryAction.label}
              </LuxuryButton>
              <LuxuryButton tone="retail" variant="outline" href="/seller/campaigns?create=1">
                Criar promocao
              </LuxuryButton>
              <LogoutButton
                redirectTo="/login?tab=partner"
                className="rounded-2xl border border-white/20 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/90 transition hover:border-white/35 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                Sair
              </LogoutButton>
            </div>
          </aside>

          <section className="flex min-w-0 flex-col gap-6">
            <header className="sticky top-3 z-30 rounded-3xl border border-black/10 bg-white/95 p-5 shadow-sm backdrop-blur">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <PortalBackButton fallbackHref="/parceiro" className="mb-3" />
                    <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Centro operacional</p>
                    <h1 className="mt-2 font-display text-2xl text-bpBlack">{currentSection}</h1>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href="/seller/notifications"
                      className="relative inline-flex h-10 items-center justify-center rounded-2xl border border-black/10 px-3 text-xs uppercase tracking-[0.2em] text-bpGraphite/80 transition hover:border-black/20 hover:text-bpBlackSoft"
                    >
                      Alertas
                      {hasUnreadAlerts ? <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-rose-500" /> : null}
                    </Link>
                    <LuxuryButton tone="retail" size="sm" href={primaryAction.href}>
                      {primaryAction.label}
                    </LuxuryButton>
                    <Link
                      href="/seller/settings"
                      className="inline-flex h-10 items-center rounded-2xl border border-black/10 px-3 text-xs uppercase tracking-[0.2em] text-bpGraphite/80 transition hover:border-black/20 hover:text-bpBlackSoft"
                    >
                      Perfil & Permissoes
                    </Link>
                    <LogoutButton
                      redirectTo="/login?tab=partner"
                      className="inline-flex h-10 items-center rounded-2xl border border-bpPink/60 bg-bpPink/10 px-3 text-xs uppercase tracking-[0.2em] text-bpBlackSoft transition hover:border-bpPink hover:bg-bpPink/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Sair
                    </LogoutButton>
                  </div>
                </div>

                <div className="grid gap-2 lg:grid-cols-5">
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Buscar pedido, SKU, cliente ou produto"
                    className="rounded-2xl border border-black/10 px-3 py-2 text-sm outline-none transition focus:border-bpPink lg:col-span-2"
                  />
                  <select
                    value={period}
                    onChange={(event) => setPeriod(event.target.value as GlobalPeriod)}
                    className="rounded-2xl border border-black/10 px-3 py-2 text-sm outline-none transition focus:border-bpPink"
                  >
                    {periodOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={channel}
                    onChange={(event) => setChannel(event.target.value as GlobalChannel)}
                    className="rounded-2xl border border-black/10 px-3 py-2 text-sm outline-none transition focus:border-bpPink"
                  >
                    {channelOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={region}
                    onChange={(event) => setRegion(event.target.value)}
                    className="rounded-2xl border border-black/10 px-3 py-2 text-sm outline-none transition focus:border-bpPink"
                  >
                    {regionOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-2 lg:grid-cols-6">
                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    className="rounded-2xl border border-black/10 px-3 py-2 text-sm outline-none transition focus:border-bpPink"
                  >
                    {categoryOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <input
                    value={brand}
                    onChange={(event) => setBrand(event.target.value)}
                    placeholder="Marca"
                    className="rounded-2xl border border-black/10 px-3 py-2 text-sm outline-none transition focus:border-bpPink"
                  />
                  <input
                    value={line}
                    onChange={(event) => setLine(event.target.value)}
                    placeholder="Linha"
                    className="rounded-2xl border border-black/10 px-3 py-2 text-sm outline-none transition focus:border-bpPink"
                  />
                  <select
                    value={customerType}
                    onChange={(event) => setCustomerType(event.target.value as CustomerType)}
                    className="rounded-2xl border border-black/10 px-3 py-2 text-sm outline-none transition focus:border-bpPink"
                  >
                    {customerTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={compareWith}
                    onChange={(event) => setCompareWith(event.target.value as CompareMode)}
                    className="rounded-2xl border border-black/10 px-3 py-2 text-sm outline-none transition focus:border-bpPink"
                  >
                    {compareOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={applyFilters}
                      className="flex-1 rounded-2xl bg-bpBlack px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:opacity-90"
                    >
                      Aplicar
                    </button>
                    <button
                      onClick={clearFilters}
                      className="flex-1 rounded-2xl border border-black/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-bpGraphite/80 transition hover:border-black/20 hover:text-bpBlackSoft"
                    >
                      Limpar
                    </button>
                  </div>
                </div>

                {period === "custom" ? (
                  <div className="grid gap-2 lg:grid-cols-[1fr_1fr_auto_auto]">
                    <input
                      type="date"
                      value={customStart}
                      onChange={(event) => setCustomStart(event.target.value)}
                      className="rounded-2xl border border-black/10 px-3 py-2 text-sm outline-none transition focus:border-bpPink"
                    />
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(event) => setCustomEnd(event.target.value)}
                      className="rounded-2xl border border-black/10 px-3 py-2 text-sm outline-none transition focus:border-bpPink"
                    />
                    <button
                      onClick={saveView}
                      className="rounded-2xl border border-black/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-bpGraphite/80 transition hover:border-black/20 hover:text-bpBlackSoft"
                    >
                      Salvar visao
                    </button>
                    <button
                      onClick={restoreView}
                      className="rounded-2xl border border-black/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-bpGraphite/80 transition hover:border-black/20 hover:text-bpBlackSoft"
                    >
                      Restaurar
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={saveView}
                      className="rounded-2xl border border-black/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-bpGraphite/80 transition hover:border-black/20 hover:text-bpBlackSoft"
                    >
                      Salvar visao
                    </button>
                    <button
                      onClick={restoreView}
                      className="rounded-2xl border border-black/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-bpGraphite/80 transition hover:border-black/20 hover:text-bpBlackSoft"
                    >
                      Restaurar visao
                    </button>
                    {savedViewLoaded ? (
                      <p className="text-xs text-emerald-700">Visao pronta para aplicar.</p>
                    ) : (
                      <p className="text-xs text-bpGraphite/70">Salve um preset para rotina diaria.</p>
                    )}
                  </div>
                )}
              </div>
            </header>

            <main>{children}</main>
          </section>
        </div>
      </div>
    </div>
  );
}
