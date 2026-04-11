"use client";

import { useEffect, useMemo, useState } from "react";

import { trackSellerEvent } from "@/lib/analytics/sellerEvents";
import { useAuth } from "@/lib/AuthContext";
import { useStoredProducts } from "@/lib/hooks/useStoredProducts";
import { orderRepository } from "@/lib/orders/orderRepository";

type ScoreApiResponse = {
  score: number;
  grade: "A" | "B" | "C" | "D" | "E";
  components: {
    sla: number;
    cancel: number;
    returns: number;
    rating: number;
    stockout: number;
    response: number;
  };
  benchmark?: {
    peers_count: number;
    category_average_score: number | null;
    percentile: number | null;
    band: "top_20" | "mid" | "below_average" | "insufficient_data";
  };
  formula?: {
    summary?: string;
  };
  impacts?: Array<{
    key: string;
    level: "high" | "medium" | "low";
    message: string;
  }>;
  recommendations?: string[];
};

export default function SellerReputationPage() {
  const { user } = useAuth();
  const { products } = useStoredProducts();
  const [subOrders, setSubOrders] = useState<any[]>([]);
  const [nowTs, setNowTs] = useState(() => Date.now());
  const [scoreData, setScoreData] = useState<ScoreApiResponse | null>(null);

  const sellerProducts = useMemo(
    () => products.filter((item) => item.sellerId === user?.sellerProfile?.sellerId),
    [products, user?.sellerProfile?.sellerId]
  );

  useEffect(() => {
    const sellerId = user?.sellerProfile?.sellerId;
    if (!sellerId) return;
    let active = true;
    void orderRepository.getSubOrders().then((rows) => {
      if (!active) return;
      setSubOrders(rows.filter((row) => row.sellerId === sellerId));
    });
    return () => {
      active = false;
    };
  }, [user?.sellerProfile?.sellerId]);

  useEffect(() => {
    const sellerId = user?.sellerProfile?.sellerId;
    if (!sellerId) return;

    const controller = new AbortController();
    void fetch(`/api/stores/${sellerId}/logistics-score?window=30d`, {
      cache: "no-store",
      signal: controller.signal
    })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as ScoreApiResponse;
      })
      .then((payload) => {
        if (!payload) return;
        setScoreData(payload);
      })
      .catch(() => null);

    return () => controller.abort();
  }, [user?.sellerProfile?.sellerId]);

  useEffect(() => {
    setNowTs(Date.now());
  }, [subOrders.length]);

  const lowContent = useMemo(
    () =>
      sellerProducts.filter(
        (item) => (item.description?.length ?? 0) < 120 || (item.images?.length ?? 0) < 3
      ),
    [sellerProducts]
  );

  const statsByProduct = useMemo(() => {
    const map = new Map<string, { orders: number; returns: number; scoreLoss: number }>();
    subOrders.forEach((row) => {
      const status = String(row.status ?? "").toLowerCase();
      (row.items ?? []).forEach((item: any) => {
        const current = map.get(item.productId) ?? { orders: 0, returns: 0, scoreLoss: 0 };
        current.orders += item.quantity;
        if (status.includes("devol")) {
          current.returns += item.quantity;
          current.scoreLoss += 7;
        }
        if (status.includes("cancel")) {
          current.scoreLoss += 4;
        }
        map.set(item.productId, current);
      });
    });
    return map;
  }, [subOrders]);

  const returnRate = useMemo(() => {
    const total = subOrders.length;
    const returned = subOrders.filter((row) => String(row.status ?? "").toLowerCase().includes("devol")).length;
    return total > 0 ? (returned / total) * 100 : 0;
  }, [subOrders]);

  const complaintRate = useMemo(() => {
    const base = lowContent.length * 0.4 + returnRate * 0.55;
    return Math.max(0.1, Math.min(8.5, base));
  }, [lowContent.length, returnRate]);

  const rating = useMemo(() => {
    const penalty = returnRate * 0.09 + complaintRate * 0.05 + lowContent.length * 0.03;
    return Math.max(3.6, 5 - penalty);
  }, [returnRate, complaintRate, lowContent.length]);

  const riskProducts = useMemo(() => {
    return sellerProducts
      .map((item) => {
        const stats = statsByProduct.get(item.id) ?? { orders: 0, returns: 0, scoreLoss: 0 };
        const returnP = stats.orders > 0 ? (stats.returns / stats.orders) * 100 : 0;
        const contentPenalty = (item.description?.length ?? 0) < 120 || (item.images?.length ?? 0) < 3 ? 15 : 0;
        const score = Math.max(0, 100 - stats.scoreLoss - returnP * 3.8 - contentPenalty);
        return {
          id: item.id,
          name: item.name,
          score,
          returnRate: returnP,
          note: Math.max(3.5, 4.9 - returnP * 0.08 - contentPenalty * 0.01),
          orders: stats.orders
        };
      })
      .sort((a, b) => a.score - b.score)
      .slice(0, 8);
  }, [sellerProducts, statsByProduct]);

  const topReasons = useMemo(() => {
    const reasons = [
      { reason: "Atraso de despacho", value: Math.max(1, Math.round(returnRate * 0.7)) },
      { reason: "Descricao incompleta", value: Math.max(1, lowContent.length) },
      { reason: "Reacao/alergia", value: Math.max(0, Math.round(returnRate * 0.35)) },
      { reason: "Embalagem", value: Math.max(1, Math.round((complaintRate + returnRate) * 0.4)) },
      { reason: "Tamanho/expectativa", value: Math.max(1, Math.round(returnRate * 0.6)) }
    ];
    return reasons.sort((a, b) => b.value - a.value);
  }, [returnRate, complaintRate, lowContent.length]);

  const logistics = useMemo(() => {
    const delayed = subOrders.filter((row) => {
      const status = String(row.status ?? "").toLowerCase();
      const ageHours = (nowTs - new Date(row.createdAt ?? nowTs).getTime()) / (1000 * 60 * 60);
      return !status.includes("enviado") && !status.includes("entreg") && !status.includes("cancel") && ageHours > 48;
    });
    const canceled = subOrders.filter((row) => String(row.status ?? "").toLowerCase().includes("cancel"));
    const returnsDelay = subOrders.filter((row) => {
      const status = String(row.status ?? "").toLowerCase();
      const ageHours = (nowTs - new Date(row.createdAt ?? nowTs).getTime()) / (1000 * 60 * 60);
      return status.includes("devol") && ageHours > 96;
    });
    const trackingQuality = Math.max(40, 100 - delayed.length * 4.2 - returnsDelay.length * 3.1);
    const cancelByStockRate = subOrders.length > 0 ? (canceled.length / subOrders.length) * 100 : 0;
    const returnByDelayRate = subOrders.length > 0 ? (returnsDelay.length / subOrders.length) * 100 : 0;
    const logisticScore = Math.max(
      0,
      Math.min(100, 100 - delayed.length * 4.5 - cancelByStockRate * 1.8 - returnByDelayRate * 2.3)
    );
    return { delayed, canceled, returnsDelay, trackingQuality, cancelByStockRate, returnByDelayRate, logisticScore };
  }, [subOrders, nowTs]);

  const benchmarkSummary = useMemo(() => {
    if (!scoreData?.benchmark) return "Benchmark indisponivel por falta de pares.";
    const benchmark = scoreData.benchmark;
    if (benchmark.band === "insufficient_data" || benchmark.percentile === null) {
      return "Benchmark em aquecimento: aguardando base minima de pares.";
    }
    if (benchmark.band === "top_20") {
      return `Top ${Math.max(1, 100 - benchmark.percentile)}% da categoria.`;
    }
    if (benchmark.band === "mid") {
      return `Faixa media da categoria (percentil ${benchmark.percentile}).`;
    }
    return `Abaixo da media da categoria (percentil ${benchmark.percentile}).`;
  }, [scoreData]);

  const scoreComponents = useMemo(() => {
    if (!scoreData?.components) return [];
    return [
      { key: "sla", label: "SLA envio", value: scoreData.components.sla },
      { key: "cancel", label: "Cancelamento", value: scoreData.components.cancel },
      { key: "returns", label: "Devolucao", value: scoreData.components.returns },
      { key: "rating", label: "Avaliacao", value: scoreData.components.rating },
      { key: "stockout", label: "Ruptura", value: scoreData.components.stockout },
      { key: "response", label: "Resposta suporte", value: scoreData.components.response }
    ];
  }, [scoreData]);

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Reputacao & qualidade</p>
        <h1 className="mt-2 font-display text-3xl text-bpBlack">Saude da experiencia</h1>
        <p className="mt-2 text-sm text-bpGraphite/80">
          Monitoramento de nota, devolucao e qualidade de anuncio com plano de correcao.
        </p>
      </section>

      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">
              Score da loja
            </p>
            <h2 className="mt-2 font-display text-3xl text-bpBlack">
              {scoreData ? scoreData.score.toFixed(1) : logistics.logisticScore.toFixed(1)}
            </h2>
            <p className="mt-1 text-sm text-bpGraphite/80">
              Nota {scoreData?.grade ?? "C"} • {benchmarkSummary}
            </p>
          </div>
          <div className="max-w-xl rounded-2xl border border-bpPink/25 bg-[#FFF4F8] px-4 py-3 text-xs text-bpGraphite/85">
            {scoreData?.formula?.summary ??
              "Score composto por SLA, cancelamento, devolucao, avaliacao, ruptura e tempo de resposta."}
          </div>
        </div>

        {scoreComponents.length > 0 ? (
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {scoreComponents.map((component) => (
              <article key={component.key} className="rounded-2xl border border-black/10 bg-[#FAFAFB] p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-bpGraphite/70">{component.label}</p>
                <p className="mt-2 text-xl font-semibold text-bpBlackSoft">{component.value.toFixed(1)}</p>
              </article>
            ))}
          </div>
        ) : null}

        {scoreData?.impacts?.length ? (
          <div className="mt-4 space-y-2">
            {scoreData.impacts.slice(0, 3).map((impact) => (
              <div key={`${impact.key}-${impact.level}`} className="rounded-2xl border border-black/10 bg-[#FAFAFB] p-3 text-sm text-bpGraphite/80">
                {impact.message}
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <article className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-bpGraphite/70">Nota media</p>
          <p className="mt-2 text-2xl font-semibold text-bpBlackSoft">{rating.toFixed(2)}</p>
        </article>
        <article className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-bpGraphite/70">Devolucao</p>
          <p className="mt-2 text-2xl font-semibold text-bpBlackSoft">{returnRate.toFixed(2)}%</p>
        </article>
        <article className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-bpGraphite/70">Reclamacao</p>
          <p className="mt-2 text-2xl font-semibold text-bpBlackSoft">{complaintRate.toFixed(2)}%</p>
        </article>
        <article className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-bpGraphite/70">Anuncio baixo score</p>
          <p className="mt-2 text-2xl font-semibold text-bpBlackSoft">{lowContent.length}</p>
        </article>
        <article className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-bpGraphite/70">Score logistico</p>
          <p className="mt-2 text-2xl font-semibold text-bpBlackSoft">{logistics.logisticScore.toFixed(0)}</p>
          <p className="mt-1 text-xs text-bpGraphite/70">tracking: {logistics.trackingQuality.toFixed(0)}%</p>
        </article>
      </section>

      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <h2 className="font-display text-2xl text-bpBlack">Penalidades e impacto de ranking</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-black/10 bg-[#FAFAFB] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-bpGraphite/70">SLA em atraso</p>
            <p className="mt-2 text-xl font-semibold text-bpBlackSoft">{logistics.delayed.length} pedidos</p>
          </article>
          <article className="rounded-2xl border border-black/10 bg-[#FAFAFB] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-bpGraphite/70">Cancel. por estoque</p>
            <p className="mt-2 text-xl font-semibold text-bpBlackSoft">{logistics.cancelByStockRate.toFixed(2)}%</p>
          </article>
          <article className="rounded-2xl border border-black/10 bg-[#FAFAFB] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-bpGraphite/70">Devolucao por atraso</p>
            <p className="mt-2 text-xl font-semibold text-bpBlackSoft">{logistics.returnByDelayRate.toFixed(2)}%</p>
          </article>
          <article className="rounded-2xl border border-black/10 bg-[#FAFAFB] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-bpGraphite/70">Tracking correto</p>
            <p className="mt-2 text-xl font-semibold text-bpBlackSoft">{logistics.trackingQuality.toFixed(1)}%</p>
          </article>
        </div>
        <div className="mt-4 rounded-2xl border border-bpPink/25 bg-[#FFF4F8] p-4 text-sm text-bpGraphite/85">
          Impacto automatico: score logistico baixo pode reduzir ranking de busca, limitar campanhas e acionar alerta preventivo.
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_1fr]">
        <article className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl text-bpBlack">Produtos que derrubam reputacao</h2>
            <button
              type="button"
              onClick={() => trackSellerEvent("respond_review", { mode: "batch" })}
              className="rounded-full bg-bpBlack px-4 py-2 text-xs uppercase tracking-[0.2em] text-white"
            >
              Responder avaliacoes em lote
            </button>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.2em] text-bpGraphite/70">
                  <th>Produto</th>
                  <th>Score</th>
                  <th>Nota</th>
                  <th>Devolucao</th>
                  <th>Pedidos</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {riskProducts.map((item) => (
                  <tr key={item.id} className="bg-[#FAFAFB] text-sm">
                    <td className="rounded-l-2xl px-3 py-3">{item.name}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          item.score >= 70
                            ? "bg-emerald-100 text-emerald-700"
                            : item.score >= 50
                              ? "bg-amber-100 text-amber-700"
                              : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {item.score.toFixed(0)}
                      </span>
                    </td>
                    <td className="px-3 py-3">{item.note.toFixed(2)}</td>
                    <td className="px-3 py-3">{item.returnRate.toFixed(2)}%</td>
                    <td className="px-3 py-3">{item.orders}</td>
                    <td className="rounded-r-2xl px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => trackSellerEvent("respond_review", { product_id: item.id })}
                          className="rounded-full border border-black/20 px-3 py-1 text-xs uppercase tracking-[0.2em] text-bpGraphite/80"
                        >
                          Responder
                        </button>
                        <button
                          type="button"
                          onClick={() => trackSellerEvent("alert_rule_create", { product_id: item.id })}
                          className="rounded-full border border-black/20 px-3 py-1 text-xs uppercase tracking-[0.2em] text-bpGraphite/80"
                        >
                          Plano de correcao
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="font-display text-2xl text-bpBlack">Motivos top 5</h2>
          <div className="mt-4 space-y-2">
            {topReasons.map((item) => (
              <div key={item.reason} className="rounded-2xl border border-black/10 bg-[#FAFAFB] p-3">
                <p className="text-sm font-semibold text-bpBlackSoft">{item.reason}</p>
                <p className="mt-1 text-xs text-bpGraphite/70">{item.value} ocorrencia(s) no periodo</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl border border-bpPink/25 bg-[#FFF4F8] p-3 text-sm text-bpGraphite/85">
            Acao recomendada: foque primeiro em descricao completa, embalagem e tempo de despacho.
          </div>
        </article>
      </section>

      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <h2 className="font-display text-2xl text-bpBlack">Playbook de correcao</h2>
        <ul className="mt-4 space-y-2 text-sm text-bpGraphite/80">
          <li>- Conteudo: revisar titulo, beneficios, modo de uso e ativos.</li>
          <li>- Embalagem: reforcar protecao para itens com historico de avaria.</li>
          <li>- Prazo: priorizar expediacao de SKUs com maior nota de risco.</li>
          <li>- Qualidade: abrir tratativa para lotes com devolucao por irritacao.</li>
        </ul>
      </section>
    </div>
  );
}
