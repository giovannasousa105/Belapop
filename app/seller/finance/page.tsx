"use client";

import { useEffect, useMemo, useState } from "react";

import { trackSellerEvent } from "@/lib/analytics/sellerEvents";
import { useAuth } from "@/lib/AuthContext";
import { orderRepository } from "@/lib/orders/orderRepository";
import { formatPrice } from "@/lib/utils";

export default function SellerFinancePage() {
  const { user } = useAuth();
  const sellerId = user?.sellerProfile?.sellerId;
  const [subOrders, setSubOrders] = useState<any[]>([]);
  const [costRate, setCostRate] = useState("38");
  const [nowTs, setNowTs] = useState(() => Date.now());

  useEffect(() => {
    if (!sellerId) return;
    trackSellerEvent("payout_view", { seller_id: sellerId });
    let active = true;
    void orderRepository.getSubOrders().then((rows) => {
      if (!active) return;
      setSubOrders(rows.filter((row) => row.sellerId === sellerId));
    });
    return () => {
      active = false;
    };
  }, [sellerId]);

  useEffect(() => {
    setNowTs(Date.now());
  }, [subOrders.length]);

  const dre = useMemo(() => {
    const gross = subOrders.reduce((sum, row) => sum + Number(row.productTotal ?? 0), 0);
    const shipping = subOrders.reduce((sum, row) => sum + Number(row.shippingValue ?? 0), 0);
    const fee = subOrders.reduce((sum, row) => sum + Number(row.platformFee ?? 0), 0);
    const net = subOrders.reduce((sum, row) => sum + Number(row.sellerNetAmount ?? 0), 0);
    const pending = subOrders.filter((row) => row.paymentStatus !== "paid").length;
    return { gross, shipping, fee, net, pending };
  }, [subOrders]);

  const conciliationRows = useMemo(() => {
    return subOrders.slice(0, 40).map((row) => {
      const gross = Number(row.productTotal ?? 0);
      const shipping = Number(row.shippingValue ?? 0);
      const fee = Number(row.platformFee ?? gross * 0.11);
      const discount = gross * 0.02;
      const refund = String(row.status ?? "").toLowerCase().includes("devol") ? gross * 0.28 : 0;
      const payout =
        typeof row.sellerNetAmount === "number"
          ? Number(row.sellerNetAmount)
          : Math.max(0, gross + shipping - fee - discount - refund);
      return {
        id: row.orderId ?? row.id,
        gross,
        fee,
        discount,
        shipping,
        refund,
        payout,
        status: row.status ?? "confirmado"
      };
    });
  }, [subOrders]);

  const marginReal = useMemo(() => {
    const costRateNum = Number(costRate || "0");
    const estimatedCost = dre.gross * (costRateNum / 100);
    const margin = dre.gross > 0 ? ((dre.net - estimatedCost) / dre.gross) * 100 : 0;
    return { estimatedCost, margin };
  }, [dre.gross, dre.net, costRate]);

  const logisticLoss = useMemo(() => {
    const delayRows = subOrders.filter((row) => {
      const status = String(row.status ?? "").toLowerCase();
      const ageHours = (nowTs - new Date(row.createdAt ?? nowTs).getTime()) / (1000 * 60 * 60);
      return !status.includes("enviado") && !status.includes("entreg") && !status.includes("cancel") && ageHours > 48;
    });
    const returnRows = subOrders.filter((row) => String(row.status ?? "").toLowerCase().includes("devol"));
    const stockoutRows = subOrders.filter((row) => String(row.status ?? "").toLowerCase().includes("cancel"));

    const delayLoss = delayRows.reduce((sum, row) => sum + Number(row.productTotal ?? 0) * 0.08, 0);
    const returnLoss = returnRows.reduce((sum, row) => sum + Number(row.productTotal ?? 0) * 0.28, 0);
    const stockoutLoss = stockoutRows.reduce((sum, row) => sum + Number(row.productTotal ?? 0) * 0.22, 0);
    const internalFines = delayLoss * 0.35;
    const delayRefunds = delayRows.reduce((sum, row) => sum + Number(row.productTotal ?? 0) * 0.12, 0);
    const chargebacks = subOrders.filter((row) => row.paymentStatus !== "paid").length * 120;
    const returnCost = returnLoss * 0.55;
    const adjustedNet = dre.net - delayLoss - returnLoss - stockoutLoss;

    return {
      delayLoss,
      returnLoss,
      stockoutLoss,
      internalFines,
      delayRefunds,
      chargebacks,
      returnCost,
      adjustedNet
    };
  }, [subOrders, dre.net, nowTs]);

  const disputeLogs = [
    { id: "dsp-1", when: "Hoje 10:22", status: "aberta", note: "Divergencia em repasse do pedido #A102" },
    { id: "dsp-2", when: "Ontem 17:14", status: "em analise", note: "Estorno parcial nao refletido no extrato" },
    { id: "dsp-3", when: "28/02 09:30", status: "resolvida", note: "Taxa corrigida e repasse complementar efetuado" }
  ];

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Financeiro</p>
        <h1 className="mt-2 font-display text-3xl text-bpBlack">Recebiveis e DRE simplificado</h1>
        <p className="mt-2 text-sm text-bpGraphite/80">
          Acompanhe repasses, taxas e margem sem sair do portal do lojista.
        </p>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <article className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-bpGraphite/70">Receita bruta</p>
          <p className="mt-2 text-xl font-semibold text-bpBlackSoft">{formatPrice(dre.gross)}</p>
        </article>
        <article className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-bpGraphite/70">Frete</p>
          <p className="mt-2 text-xl font-semibold text-bpBlackSoft">{formatPrice(dre.shipping)}</p>
        </article>
        <article className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-bpGraphite/70">Taxas</p>
          <p className="mt-2 text-xl font-semibold text-bpBlackSoft">{formatPrice(dre.fee)}</p>
        </article>
        <article className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-bpGraphite/70">Liquido</p>
          <p className="mt-2 text-xl font-semibold text-bpBlackSoft">{formatPrice(dre.net)}</p>
        </article>
        <article className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-bpGraphite/70">Pendencias</p>
          <p className="mt-2 text-xl font-semibold text-bpBlackSoft">{dre.pending}</p>
        </article>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-bpGraphite/70">Multas internas</p>
          <p className="mt-2 text-xl font-semibold text-bpBlackSoft">{formatPrice(logisticLoss.internalFines)}</p>
        </article>
        <article className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-bpGraphite/70">Reembolso por atraso</p>
          <p className="mt-2 text-xl font-semibold text-bpBlackSoft">{formatPrice(logisticLoss.delayRefunds)}</p>
        </article>
        <article className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-bpGraphite/70">Chargebacks</p>
          <p className="mt-2 text-xl font-semibold text-bpBlackSoft">{formatPrice(logisticLoss.chargebacks)}</p>
        </article>
        <article className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-bpGraphite/70">Custo devolucoes</p>
          <p className="mt-2 text-xl font-semibold text-bpBlackSoft">{formatPrice(logisticLoss.returnCost)}</p>
        </article>
      </section>

      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl text-bpBlack">Repasses e pendencias</h2>
            <p className="mt-1 text-sm text-bpGraphite/80">Calendario de recebiveis e divergencias.</p>
          </div>
          <button
            type="button"
            onClick={() => trackSellerEvent("payout_dispute_open", { pending: dre.pending })}
            className="rounded-full border border-black/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-bpGraphite/80"
          >
            Abrir disputa
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl text-bpBlack">Conciliacao por pedido</h2>
          <p className="text-xs text-bpGraphite/70">Receita, taxas, descontos, frete, estorno e repasse final</p>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.2em] text-bpGraphite/70">
                <th>Pedido</th>
                <th>Bruto</th>
                <th>Taxas</th>
                <th>Descontos</th>
                <th>Frete</th>
                <th>Estornos</th>
                <th>Repasse</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {conciliationRows.map((row) => (
                <tr key={row.id} className="bg-[#FAFAFB] text-sm">
                  <td className="rounded-l-2xl px-3 py-3">{row.id}</td>
                  <td className="px-3 py-3">{formatPrice(row.gross)}</td>
                  <td className="px-3 py-3">{formatPrice(row.fee)}</td>
                  <td className="px-3 py-3">{formatPrice(row.discount)}</td>
                  <td className="px-3 py-3">{formatPrice(row.shipping)}</td>
                  <td className="px-3 py-3">{formatPrice(row.refund)}</td>
                  <td className="px-3 py-3">{formatPrice(row.payout)}</td>
                  <td className="rounded-r-2xl px-3 py-3">{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
        <article className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="font-display text-2xl text-bpBlack">DRE + Margem real</h2>
          <label className="mt-4 block text-xs uppercase tracking-[0.2em] text-bpGraphite/70">Custo do produto (%)</label>
          <input
            value={costRate}
            onChange={(event) => setCostRate(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-black/10 px-3 py-2 text-sm"
            placeholder="38"
          />
          <div className="mt-4 space-y-2 text-sm text-bpGraphite/80">
            <p>Receita liquida: {formatPrice(dre.net)}</p>
            <p>Custo estimado: {formatPrice(marginReal.estimatedCost)}</p>
            <p>Perda por atraso: {formatPrice(logisticLoss.delayLoss)}</p>
            <p>Perda por devolucao: {formatPrice(logisticLoss.returnLoss)}</p>
            <p>Perda por ruptura: {formatPrice(logisticLoss.stockoutLoss)}</p>
            <p className="font-semibold text-bpBlackSoft">Receita liquida ajustada: {formatPrice(logisticLoss.adjustedNet)}</p>
            <p className="font-semibold text-bpBlackSoft">Margem real estimada: {marginReal.margin.toFixed(1)}%</p>
          </div>
        </article>

        <article className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="font-display text-2xl text-bpBlack">Divergencias e disputas</h2>
          <div className="mt-4 space-y-2">
            {disputeLogs.map((log) => (
              <div key={log.id} className="rounded-2xl border border-black/10 bg-[#FAFAFB] p-3">
                <p className="text-sm font-semibold text-bpBlackSoft">{log.note}</p>
                <p className="mt-1 text-xs text-bpGraphite/70">
                  {log.when} | status: {log.status}
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
