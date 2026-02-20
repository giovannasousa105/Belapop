import { Suspense } from "react";
import { LuxuryButton } from "@/components/LuxuryButton";
import { SectionFrame } from "@/components/SectionFrame";
import { KpiCard } from "@/components/admin/dashboard/KpiCard";
import { TrendCard } from "@/components/admin/dashboard/TrendCard";
import { FunnelCard } from "@/components/admin/dashboard/FunnelCard";
import { GeoHeatmap } from "@/components/admin/dashboard/GeoHeatmap";
import { formatPrice } from "@/lib/utils";

type DashboardResponse = {
  kpis: {
    gmv_cents: number;
    total_orders: number;
    aov_cents: number;
    active_sellers: number;
    sla_shipping: number;
  };
  trend: { date: string; gmv_cents: number; orders: number }[];
  byCategory: Record<string, number>;
  funnel: { label: string; value: number }[];
  pendings: { products: number; sellers: number };
};

type GeoResponse = { data: { uf: string; value: number }[] };

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

async function getDashboard(): Promise<DashboardResponse | null> {
  const res = await fetch(new URL("/api/admin/dashboard", baseUrl).toString(), {
    cache: "no-store"
  });
  if (res.status === 401 || res.status === 403) return null;
  if (!res.ok) throw new Error("Failed to load dashboard");
  return res.json();
}

async function getGeo(): Promise<GeoResponse> {
  const res = await fetch(new URL("/api/admin/geostats", baseUrl).toString(), {
    cache: "no-store"
  });
  if (!res.ok) return { data: [] };
  return res.json();
}

export default async function AdminDashboardPage() {
  const [dashboard, geo] = await Promise.all([getDashboard(), getGeo()]);

  if (!dashboard) {
    return (
      <SectionFrame>
        <div className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Acesso restrito</p>
          <h1 className="font-display text-2xl text-bpBlack">Faça login como admin</h1>
          <p className="text-sm text-bpGraphite/80">
            Use uma conta com role <code>admin</code> para visualizar os KPIs operacionais.
          </p>
          <LuxuryButton tone="retail" href="/admin/login">
            Ir para login
          </LuxuryButton>
        </div>
      </SectionFrame>
    );
  }

  const trendData = dashboard.trend.map((row) => ({
    date: row.date,
    value: row.gmv_cents / 100
  }));

  const categoryBars = Object.entries(dashboard.byCategory).map(([label, value]) => ({
    label,
    value: Math.round(value / 100)
  }));

  return (
    <div className="flex flex-col gap-8">
      <SectionFrame>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Dashboard administrativo</p>
            <h1 className="font-display text-3xl text-bpBlack">Operações BelaPop</h1>
            <p className="text-sm text-bpGraphite/80">
              KPIs em tempo real com visão de GMV, comissionamento e saúde das lojas.
            </p>
          </div>
          <LuxuryButton tone="retail" variant="secondary" href="/admin/orders">
            Ver pedidos
          </LuxuryButton>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <KpiCard title="GMV" value={formatPrice(dashboard.kpis.gmv_cents)} delta={4.3} />
          <KpiCard title="Pedidos" value={dashboard.kpis.total_orders.toString()} delta={1.2} />
          <KpiCard title="Ticket médio" value={formatPrice(dashboard.kpis.aov_cents)} delta={0.8} />
          <KpiCard title="Lojistas ativos" value={dashboard.kpis.active_sellers.toString()} delta={2.1} />
          <KpiCard title="SLA frete" value={`${dashboard.kpis.sla_shipping.toFixed(1)}%`} delta={-0.4} />
        </div>
      </SectionFrame>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <TrendCard
            title="GMV últimos 30 dias"
            data={trendData}
            valueFormatter={(v) => formatPrice(Math.round(v * 100))}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <FunnelCard title="Funil de conversão" steps={dashboard.funnel} />
            <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
              <div className="text-xs uppercase tracking-[0.25em] text-bpGraphite/70">
                Vendas por categoria
              </div>
              <div className="mt-3 space-y-2">
                {categoryBars.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-xl border border-black/5 bg-bpOffWhite px-3 py-2"
                  >
                    <span className="text-sm text-bpBlackSoft">{item.label}</span>
                    <span className="text-sm font-semibold text-bpBlackSoft">{formatPrice(item.value * 100)}</span>
                  </div>
                ))}
                {categoryBars.length === 0 && (
                  <p className="text-sm text-bpGraphite/70">Sem categorias com vendas ainda.</p>
                )}
              </div>
            </div>
          </div>
        </div>
        <GeoHeatmap data={geo.data ?? []} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <SectionFrame>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Pendências</p>
              <h2 className="font-display text-xl text-bpBlack">Ações imediatas</h2>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-amber-700">Produtos pendentes</p>
              <p className="mt-2 text-2xl font-display text-amber-900">
                {dashboard.pendings.products}
              </p>
              <p className="text-sm text-amber-800">Aguardando aprovação/curadoria</p>
            </div>
            <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-sky-700">Lojistas pendentes</p>
              <p className="mt-2 text-2xl font-display text-sky-900">
                {dashboard.pendings.sellers}
              </p>
              <p className="text-sm text-sky-800">Aguardando onboarding</p>
            </div>
          </div>
        </SectionFrame>

        <SectionFrame>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Campanhas</p>
              <h2 className="font-display text-xl text-bpBlack">Criar anúncio</h2>
            </div>
            <LuxuryButton size="sm" tone="retail" href="/admin/products">
              Iniciar
            </LuxuryButton>
          </div>
          <p className="mt-3 text-sm text-bpGraphite/80">
            Destaque produtos com anúncios e promoções. Defina orçamento, duração e público.
          </p>
        </SectionFrame>
      </div>
    </div>
  );
}
