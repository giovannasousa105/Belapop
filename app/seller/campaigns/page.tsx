"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { trackSellerEvent } from "@/lib/analytics/sellerEvents";
import { formatPrice } from "@/lib/utils";

type Channel = "Organic" | "Search" | "Showcase" | "Recommended" | "Ads";
type CampaignStatus = "active" | "paused";

type Campaign = {
  id: string;
  name: string;
  channel: Channel;
  spend: number;
  impressions: number;
  clicks: number;
  addToCart: number;
  checkoutStarted: number;
  paidOrders: number;
  revenue: number;
  returnRate: number;
  status: CampaignStatus;
};

const seedCampaigns: Campaign[] = [
  {
    id: "cmp-search-01",
    name: "Search cabelos premium",
    channel: "Search",
    spend: 2400,
    impressions: 158400,
    clicks: 5480,
    addToCart: 846,
    checkoutStarted: 512,
    paidOrders: 286,
    revenue: 12480,
    returnRate: 2.2,
    status: "active"
  },
  {
    id: "cmp-showcase-02",
    name: "Vitrine skincare glow",
    channel: "Showcase",
    spend: 1750,
    impressions: 98200,
    clicks: 3870,
    addToCart: 642,
    checkoutStarted: 401,
    paidOrders: 224,
    revenue: 10680,
    returnRate: 1.9,
    status: "active"
  },
  {
    id: "cmp-ads-03",
    name: "Ads mascara reparadora",
    channel: "Ads",
    spend: 3220,
    impressions: 141900,
    clicks: 4210,
    addToCart: 520,
    checkoutStarted: 274,
    paidOrders: 108,
    revenue: 5160,
    returnRate: 4.3,
    status: "active"
  },
  {
    id: "cmp-reco-04",
    name: "Recomendados kit rotina",
    channel: "Recommended",
    spend: 980,
    impressions: 62200,
    clicks: 2430,
    addToCart: 478,
    checkoutStarted: 318,
    paidOrders: 194,
    revenue: 8880,
    returnRate: 1.6,
    status: "active"
  },
  {
    id: "cmp-organic-05",
    name: "Organic diario editorial",
    channel: "Organic",
    spend: 0,
    impressions: 82400,
    clicks: 5180,
    addToCart: 916,
    checkoutStarted: 602,
    paidOrders: 338,
    revenue: 14200,
    returnRate: 1.2,
    status: "active"
  }
];

export default function SellerCampaignsPage() {
  const [channelFilter, setChannelFilter] = useState<"all" | Channel>("all");
  const [campaigns, setCampaigns] = useState<Campaign[]>(seedCampaigns);

  const filtered = useMemo(() => {
    if (channelFilter === "all") return campaigns;
    return campaigns.filter((item) => item.channel === channelFilter);
  }, [campaigns, channelFilter]);

  const totals = useMemo(() => {
    const spend = filtered.reduce((sum, row) => sum + row.spend, 0);
    const impressions = filtered.reduce((sum, row) => sum + row.impressions, 0);
    const clicks = filtered.reduce((sum, row) => sum + row.clicks, 0);
    const addToCart = filtered.reduce((sum, row) => sum + row.addToCart, 0);
    const checkoutStarted = filtered.reduce((sum, row) => sum + row.checkoutStarted, 0);
    const paidOrders = filtered.reduce((sum, row) => sum + row.paidOrders, 0);
    const revenue = filtered.reduce((sum, row) => sum + row.revenue, 0);
    const refunds = filtered.reduce((sum, row) => sum + row.revenue * (row.returnRate / 100), 0);
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const cpc = clicks > 0 ? spend / clicks : 0;
    const roas = spend > 0 ? revenue / spend : 0;
    const marginPostAds = revenue > 0 ? ((revenue - spend - refunds) / revenue) * 100 : 0;
    return {
      spend,
      impressions,
      clicks,
      addToCart,
      checkoutStarted,
      paidOrders,
      revenue,
      ctr,
      cpc,
      roas,
      marginPostAds
    };
  }, [filtered]);

  const updateBudget = (campaignId: string, deltaPercent: number) => {
    setCampaigns((current) =>
      current.map((item) => {
        if (item.id !== campaignId) return item;
        const next = {
          ...item,
          spend: Math.max(0, item.spend * (1 + deltaPercent / 100))
        };
        return next;
      })
    );
    trackSellerEvent("budget_change", { campaign_id: campaignId, delta_percent: deltaPercent });
  };

  const toggleStatus = (campaignId: string) => {
    setCampaigns((current) =>
      current.map((item) => {
        if (item.id !== campaignId) return item;
        const nextStatus: CampaignStatus = item.status === "active" ? "paused" : "active";
        if (nextStatus === "paused") {
          trackSellerEvent("pause", { type: "campaign", campaign_id: campaignId });
        } else {
          trackSellerEvent("campaign_create", { type: "resume", campaign_id: campaignId });
        }
        return { ...item, status: nextStatus };
      })
    );
  };

  const highRoas = [...filtered]
    .filter((row) => row.spend > 0)
    .sort((a, b) => b.revenue / Math.max(1, b.spend) - a.revenue / Math.max(1, a.spend))[0];
  const lowRoas = [...filtered]
    .filter((row) => row.spend > 0)
    .sort((a, b) => a.revenue / Math.max(1, a.spend) - b.revenue / Math.max(1, b.spend))[0];
  const highReturn = [...filtered].sort((a, b) => b.returnRate - a.returnRate)[0];
  const suggestions = [
    {
      id: "s1",
      title: highRoas ? `Aumentar budget: ${highRoas.name}` : "Aumentar budget de campanha vencedora",
      impact: highRoas ? formatPrice(Math.max(400, highRoas.revenue * 0.11)) : formatPrice(600),
      confidence: highRoas && highRoas.revenue / Math.max(1, highRoas.spend) > 3 ? "alta" : "media",
      reason: "ROAS alto com conversao sustentada e estoque saudavel.",
      action: "Aumentar orcamento 10%",
      run: () => {
        if (!highRoas) return;
        updateBudget(highRoas.id, 10);
      }
    },
    {
      id: "s2",
      title: lowRoas ? `Revisar ou pausar: ${lowRoas.name}` : "Revisar campanha com ROAS baixo",
      impact: lowRoas ? formatPrice(Math.max(250, lowRoas.spend * 0.22)) : formatPrice(300),
      confidence: "alta",
      reason: "Gasto elevado sem retorno proporcional por 3 dias.",
      action: "Pausar campanha",
      run: () => {
        if (!lowRoas) return;
        toggleStatus(lowRoas.id);
      }
    },
    {
      id: "s3",
      title: highReturn ? `Corrigir qualidade de ${highReturn.name}` : "Corrigir produto com devolucao alta",
      impact: highReturn ? `${highReturn.returnRate.toFixed(1)}% devolucao` : "3.0% devolucao",
      confidence: "media",
      reason: "Campanha converte, mas devolucao alta pressiona reputacao e margem.",
      action: "Abrir plano de correcao",
      run: () => {
        trackSellerEvent("respond_review", { source: "campaign_suggestion" });
      }
    }
  ];

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Campanhas & ads</p>
        <h1 className="mt-2 font-display text-3xl text-bpBlack">Crescimento com atribuicao real</h1>
        <p className="mt-2 text-sm text-bpGraphite/80">
          Controle investimento, converte com margem e proteja reputacao com guardrails.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              trackSellerEvent("create_campaign", { type: "coupon" });
              trackSellerEvent("campaign_create", { type: "coupon" });
            }}
            className="rounded-full bg-bpBlack px-4 py-2 text-xs uppercase tracking-[0.2em] text-white"
          >
            Criar promocao
          </button>
          <Link href="/seller/reports" className="rounded-full border border-black/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-bpBlackSoft">
            Ver ROI por campanha
          </Link>
          <select
            value={channelFilter}
            onChange={(event) => setChannelFilter(event.target.value as "all" | Channel)}
            className="rounded-full border border-black/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-bpBlackSoft"
          >
            <option value="all">Todos canais</option>
            <option value="Organic">Organic</option>
            <option value="Search">Search</option>
            <option value="Showcase">Showcase</option>
            <option value="Recommended">Recommended</option>
            <option value="Ads">Ads</option>
          </select>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-bpGraphite/70">Investimento</p>
          <p className="mt-2 font-display text-3xl text-bpBlack">{formatPrice(totals.spend)}</p>
          <p className="mt-1 text-xs text-bpGraphite/70">canal: {channelFilter === "all" ? "mix total" : channelFilter}</p>
        </article>
        <article className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-bpGraphite/70">Impressoes / cliques</p>
          <p className="mt-2 font-display text-3xl text-bpBlack">
            {(totals.impressions / 1000).toFixed(1)}k / {(totals.clicks / 1000).toFixed(1)}k
          </p>
          <p className="mt-1 text-xs text-bpGraphite/70">CTR {totals.ctr.toFixed(2)}%</p>
        </article>
        <article className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-bpGraphite/70">Funil atribuido</p>
          <p className="mt-2 font-display text-3xl text-bpBlack">{totals.paidOrders}</p>
          <p className="mt-1 text-xs text-bpGraphite/70">
            ATC {totals.addToCart} | checkout {totals.checkoutStarted}
          </p>
        </article>
        <article className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-bpGraphite/70">ROAS / margem pos-ads</p>
          <p className="mt-2 font-display text-3xl text-bpBlack">{totals.roas.toFixed(2)}</p>
          <p className="mt-1 text-xs text-bpGraphite/70">
            CPC {formatPrice(totals.cpc)} | margem {totals.marginPostAds.toFixed(1)}%
          </p>
        </article>
      </section>

      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <h2 className="font-display text-2xl text-bpBlack">Campanhas por canal</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.2em] text-bpGraphite/70">
                <th>Campanha</th>
                <th>Canal</th>
                <th>Investimento</th>
                <th>Impressoes</th>
                <th>Cliques</th>
                <th>CTR</th>
                <th>CPC</th>
                <th>Pedidos</th>
                <th>ROAS</th>
                <th>Margem pos-ads</th>
                <th>Status</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => {
                const ctr = row.impressions > 0 ? (row.clicks / row.impressions) * 100 : 0;
                const cpc = row.clicks > 0 ? row.spend / row.clicks : 0;
                const roas = row.spend > 0 ? row.revenue / row.spend : 0;
                const marginPostAds =
                  row.revenue > 0
                    ? ((row.revenue - row.spend - row.revenue * (row.returnRate / 100)) / row.revenue) * 100
                    : 0;
                return (
                  <tr key={row.id} className="bg-[#FAFAFB] text-sm">
                    <td className="rounded-l-2xl px-3 py-3">{row.name}</td>
                    <td className="px-3 py-3">{row.channel}</td>
                    <td className="px-3 py-3">{formatPrice(row.spend)}</td>
                    <td className="px-3 py-3">{row.impressions.toLocaleString("pt-BR")}</td>
                    <td className="px-3 py-3">{row.clicks.toLocaleString("pt-BR")}</td>
                    <td className="px-3 py-3">{ctr.toFixed(2)}%</td>
                    <td className="px-3 py-3">{formatPrice(cpc)}</td>
                    <td className="px-3 py-3">{row.paidOrders}</td>
                    <td className="px-3 py-3">{roas.toFixed(2)}</td>
                    <td className="px-3 py-3">{marginPostAds.toFixed(1)}%</td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          row.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {row.status === "active" ? "ativa" : "pausada"}
                      </span>
                    </td>
                    <td className="rounded-r-2xl px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => updateBudget(row.id, 10)}
                          className="rounded-full border border-black/20 px-3 py-1 text-xs uppercase tracking-[0.2em] text-bpGraphite/80"
                        >
                          +10%
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleStatus(row.id)}
                          className="rounded-full border border-black/20 px-3 py-1 text-xs uppercase tracking-[0.2em] text-bpGraphite/80"
                        >
                          {row.status === "active" ? "Pausar" : "Retomar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <h2 className="font-display text-2xl text-bpBlack">Sugestoes inteligentes com impacto</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {suggestions.map((item) => (
            <article key={item.id} className="rounded-2xl border border-black/10 bg-[#FAFAFB] p-4">
              <h3 className="text-lg font-semibold text-bpBlackSoft">{item.title}</h3>
              <p className="mt-2 text-sm text-bpGraphite/80">{item.reason}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-black/20 px-2 py-1">Impacto: {item.impact}</span>
                <span className="rounded-full border border-black/20 px-2 py-1">Confianca: {item.confidence}</span>
              </div>
              <button
                type="button"
                onClick={item.run}
                className="mt-3 rounded-full bg-bpBlack px-3 py-1 text-xs uppercase tracking-[0.2em] text-white"
              >
                {item.action}
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <h2 className="font-display text-2xl text-bpBlack">Guardrails de automacao</h2>
        <ul className="mt-4 space-y-2 text-sm text-bpGraphite/80">
          <li>- ROAS alto com estoque saudavel: sugerir aumento de orcamento.</li>
          <li>- ROAS baixo por 3 dias: sugerir pausa e revisao de criativo.</li>
          <li>- Margem pos-ads negativa: bloquear aumento automatico.</li>
          <li>- Devolucao alta: forcar revisao de conteudo e qualidade antes de escalar verba.</li>
        </ul>
      </section>
    </div>
  );
}
