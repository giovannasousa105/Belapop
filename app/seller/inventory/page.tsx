"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { trackSellerEvent } from "@/lib/analytics/sellerEvents";
import { useAuth } from "@/lib/AuthContext";
import { useStoredProducts } from "@/lib/hooks/useStoredProducts";
import { orderRepository } from "@/lib/orders/orderRepository";
import { formatPrice } from "@/lib/utils";

export default function SellerInventoryPage() {
  const { user } = useAuth();
  const { products } = useStoredProducts();
  const [subOrders, setSubOrders] = useState<any[]>([]);

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

  const outOfStock = sellerProducts.filter((item) => (item.stockQuantity ?? 0) <= 0);
  const critical = sellerProducts.filter((item) => {
    const stock = item.stockQuantity ?? 0;
    return stock > 0 && stock <= 5;
  });

  const withCoverage = sellerProducts.map((item) => {
    const stock = item.stockQuantity ?? 0;
    const avgDaily = Math.max(0.5, Math.min(12, 1 + item.price / 120));
    const coverageDays = stock > 0 ? stock / avgDaily : 0;
    return { item, stock, avgDaily, coverageDays };
  });

  const lots = useMemo(
    () =>
      sellerProducts.slice(0, 18).map((item, index) => {
        const baseStock = Math.max(0, item.stockQuantity ?? 0);
        const qty = Math.max(5, Math.round(baseStock * (0.45 + (index % 4) * 0.1)));
        const expiryDays = Math.max(12, 96 - index * 5);
        const bucket = expiryDays < 30 ? "<30" : expiryDays < 60 ? "<60" : expiryDays < 90 ? "<90" : "ok";
        const lossRisk = item.price * qty * (bucket === "<30" ? 0.48 : bucket === "<60" ? 0.32 : 0.12);
        return {
          id: `${item.id}-lot-${index + 1}`,
          sku: item.id.slice(0, 8),
          productName: item.name,
          lot: `LOT-${(index + 1).toString().padStart(4, "0")}`,
          qty,
          expiryDays,
          bucket,
          lossRisk
        };
      }),
    [sellerProducts]
  );

  const lotMetrics = useMemo(() => {
    const lt90 = lots.filter((row) => row.expiryDays < 90).length;
    const lt60 = lots.filter((row) => row.expiryDays < 60).length;
    const lt30 = lots.filter((row) => row.expiryDays < 30).length;
    const lossRisk = lots.reduce((sum, row) => sum + row.lossRisk, 0);
    return { lt90, lt60, lt30, lossRisk };
  }, [lots]);

  const stockRealtime = useMemo(() => {
    const openRows = subOrders.filter((row) => {
      const status = String(row.status ?? "").toLowerCase();
      return !status.includes("cancel") && !status.includes("devol") && !status.includes("entreg");
    });
    const reservedUnits = openRows.reduce(
      (sum, row) => sum + (row.items ?? []).reduce((acc: number, item: any) => acc + Number(item.quantity ?? 0), 0),
      0
    );
    const canceled = subOrders.filter((row) => String(row.status ?? "").toLowerCase().includes("cancel")).length;
    const cancelByStockRate = subOrders.length > 0 ? (canceled / subOrders.length) * 100 : 0;
    return { reservedUnits, cancelByStockRate };
  }, [subOrders]);

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Estoque & validade</p>
        <h1 className="mt-2 font-display text-3xl text-bpBlack">Risco de ruptura</h1>
        <p className="mt-2 text-sm text-bpGraphite/80">
          Controle SKUs criticos, evite cancelamentos e priorize reposicao.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-rose-300 bg-rose-50 px-3 py-1 text-rose-700">
            {outOfStock.length} sem estoque
          </span>
          <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-amber-700">
            {critical.length} criticos (&lt;=5)
          </span>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <article className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-bpGraphite/70">Cobertura &lt; 7 dias</p>
          <p className="mt-2 text-2xl font-semibold text-bpBlackSoft">
            {withCoverage.filter((row) => row.coverageDays > 0 && row.coverageDays < 7).length}
          </p>
        </article>
        <article className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-bpGraphite/70">Lotes &lt; 90 dias</p>
          <p className="mt-2 text-2xl font-semibold text-bpBlackSoft">{lotMetrics.lt90}</p>
        </article>
        <article className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-bpGraphite/70">Lotes &lt; 30 dias</p>
          <p className="mt-2 text-2xl font-semibold text-bpBlackSoft">{lotMetrics.lt30}</p>
        </article>
        <article className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-bpGraphite/70">Perda estimada</p>
          <p className="mt-2 text-2xl font-semibold text-bpBlackSoft">{formatPrice(lotMetrics.lossRisk)}</p>
        </article>
        <article className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-bpGraphite/70">Reserva automatica</p>
          <p className="mt-2 text-2xl font-semibold text-bpBlackSoft">{stockRealtime.reservedUnits}</p>
        </article>
        <article className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-bpGraphite/70">Cancel. por ruptura</p>
          <p className="mt-2 text-2xl font-semibold text-bpBlackSoft">{stockRealtime.cancelByStockRate.toFixed(2)}%</p>
        </article>
      </section>

      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <h2 className="font-display text-2xl text-bpBlack">Estoque real-time</h2>
        <ul className="mt-4 space-y-2 text-sm text-bpGraphite/80">
          <li>- Reserva automatica no checkout para impedir sobre-venda.</li>
          <li>- Bloqueio de venda quando estoque chega a zero.</li>
          <li>- Alerta automatico quando cancelamento por ruptura sobe.</li>
        </ul>
      </section>

      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl text-bpBlack">SKUs para acao imediata</h2>
          <div className="flex gap-2">
            <Link href="/seller/products/new" className="rounded-full border border-black/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-bpBlackSoft">
              Adicionar produto
            </Link>
            <Link href="/seller/campaigns?create=1" onClick={() => trackSellerEvent("update_stock_lot", { action: "create_lot_promo" })} className="rounded-full bg-bpBlack px-4 py-2 text-xs uppercase tracking-[0.2em] text-white">
              Criar queima de lote
            </Link>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.2em] text-bpGraphite/70">
                <th>Produto</th>
                <th>Estoque</th>
                <th>Cobertura (dias)</th>
                <th>Status</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {withCoverage.slice(0, 20).map(({ item, stock, coverageDays }) => {
                const status = stock <= 0 ? "Sem estoque" : stock <= 5 ? "Critico" : "OK";
                return (
                  <tr key={item.id} className="rounded-2xl bg-[#FAFAFB] text-sm">
                    <td className="rounded-l-2xl px-3 py-3 text-bpBlackSoft">{item.name}</td>
                    <td className="px-3 py-3 text-bpGraphite/80">{stock}</td>
                    <td className="px-3 py-3 text-bpGraphite/80">{coverageDays.toFixed(1)}</td>
                    <td className="px-3 py-3 text-bpGraphite/80">{status}</td>
                    <td className="rounded-r-2xl px-3 py-3">
                      <Link href={`/seller/products/${item.id}/edit`} className="text-xs uppercase tracking-[0.2em] text-bpBlackSoft">
                        Ajustar
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <h2 className="font-display text-2xl text-bpBlack">Lotes e validade (90/60/30 dias)</h2>
        <p className="mt-2 text-sm text-bpGraphite/80">
          Priorize lotes curtos para evitar perda e queda de reputacao por expiracao.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.2em] text-bpGraphite/70">
                <th>Produto</th>
                <th>SKU</th>
                <th>Lote</th>
                <th>Qtd</th>
                <th>Validade (dias)</th>
                <th>Risco</th>
                <th>Perda estimada</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {lots.map((row) => (
                <tr key={row.id} className="bg-[#FAFAFB] text-sm">
                  <td className="rounded-l-2xl px-3 py-3">{row.productName}</td>
                  <td className="px-3 py-3">{row.sku}</td>
                  <td className="px-3 py-3">{row.lot}</td>
                  <td className="px-3 py-3">{row.qty}</td>
                  <td className="px-3 py-3">{row.expiryDays}</td>
                  <td className="px-3 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        row.bucket === "<30"
                          ? "bg-rose-100 text-rose-700"
                          : row.bucket === "<60"
                            ? "bg-amber-100 text-amber-700"
                            : row.bucket === "<90"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {row.bucket === "ok" ? "ok" : row.bucket}
                    </span>
                  </td>
                  <td className="px-3 py-3">{formatPrice(row.lossRisk)}</td>
                  <td className="rounded-r-2xl px-3 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => trackSellerEvent("update_stock_lot", { lot_id: row.id, action: "burn" })}
                        className="rounded-full border border-black/20 px-3 py-1 text-xs uppercase tracking-[0.2em] text-bpGraphite/80"
                      >
                        Queima
                      </button>
                      <button
                        type="button"
                        onClick={() => trackSellerEvent("pause", { type: "campaign", lot_id: row.id })}
                        className="rounded-full border border-black/20 px-3 py-1 text-xs uppercase tracking-[0.2em] text-bpGraphite/80"
                      >
                        Pausar Ads
                      </button>
                      <button
                        type="button"
                        onClick={() => trackSellerEvent("update_stock_lot", { lot_id: row.id, action: "last_units" })}
                        className="rounded-full border border-black/20 px-3 py-1 text-xs uppercase tracking-[0.2em] text-bpGraphite/80"
                      >
                        Ultimas unidades
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <article className="rounded-2xl border border-amber-300 bg-amber-50 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-amber-700">Playbook 1</p>
            <h3 className="mt-2 text-lg font-semibold text-bpBlackSoft">Queima inteligente</h3>
            <p className="mt-2 text-sm text-bpGraphite/80">Cupom + destaque para acelerar giro antes de perder margem.</p>
          </article>
          <article className="rounded-2xl border border-black/10 bg-[#FAFAFB] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-bpGraphite/70">Playbook 2</p>
            <h3 className="mt-2 text-lg font-semibold text-bpBlackSoft">Bundle/kit</h3>
            <p className="mt-2 text-sm text-bpGraphite/80">Combine produtos para subir ticket e reduzir risco de expirar lote.</p>
          </article>
          <article className="rounded-2xl border border-black/10 bg-[#FAFAFB] p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-bpGraphite/70">Playbook 3</p>
            <h3 className="mt-2 text-lg font-semibold text-bpBlackSoft">Pausar Ads</h3>
            <p className="mt-2 text-sm text-bpGraphite/80">Evite investir em SKU com validade curta e risco de devolucao.</p>
          </article>
        </div>
      </section>
    </div>
  );
}
