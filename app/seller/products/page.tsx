"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { trackSellerEvent } from "@/lib/analytics/sellerEvents";
import { useAuth } from "@/lib/AuthContext";
import { useStoredProducts } from "@/lib/hooks/useStoredProducts";
import { orderRepository } from "@/lib/orders/orderRepository";
import { productRepository } from "@/lib/repositories/productRepository";
import { formatPrice } from "@/lib/utils";

const qualityScore = (product: any) => {
  let score = 0;
  if ((product.images?.length ?? 0) >= 5) score += 20;
  else if ((product.images?.length ?? 0) >= 3) score += 12;
  if ((product.name ?? "").trim().length >= 18) score += 12;
  if ((product.description ?? "").trim().length >= 160) score += 18;
  if (product.category) score += 10;
  if (product.weightKg && product.widthCm && product.heightCm && product.lengthCm) score += 10;
  if ((product.highlights?.length ?? 0) >= 3) score += 12;
  if ((product.stockQuantity ?? 0) > 0) score += 8;
  if (product.status === "published") score += 10;
  return Math.min(100, score);
};

const conversionScore = (input: {
  quality: number;
  pdpConv: number;
  atcRate: number;
  returnRate: number;
  rating: number;
  stock: number;
}) => {
  const base = input.quality * 0.32 + input.pdpConv * 2.1 + input.atcRate * 1.8 + input.rating * 11;
  const penalties = input.returnRate * 3 + (input.stock <= 0 ? 12 : input.stock <= 5 ? 6 : 0);
  return Math.max(0, Math.min(100, base - penalties));
};

export default function SellerProductsPage() {
  const { user } = useAuth();
  const { products, refresh } = useStoredProducts();
  const [subOrders, setSubOrders] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [bulkAction, setBulkAction] = useState("pause");
  const [bulkValue, setBulkValue] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  useEffect(() => {
    void orderRepository.getSubOrders().then(setSubOrders);
  }, []);

  const sellerProducts = useMemo(
    () => products.filter((item) => item.sellerId === user?.sellerProfile?.sellerId),
    [products, user?.sellerProfile?.sellerId]
  );

  const analytics = useMemo(() => {
    const map = new Map<string, { units: number; orders: number; returns: number }>();
    subOrders
      .filter((row) => row.sellerId === user?.sellerProfile?.sellerId)
      .forEach((row) => {
        const status = String(row.status ?? "").toLowerCase();
        (row.items ?? []).forEach((item: any) => {
          const current = map.get(item.productId) ?? { units: 0, orders: 0, returns: 0 };
          current.units += item.quantity;
          current.orders += 1;
          if (status.includes("devol")) current.returns += 1;
          map.set(item.productId, current);
        });
      });
    return map;
  }, [subOrders, user?.sellerProfile?.sellerId]);

  const rows = useMemo(() => {
    return sellerProducts
      .filter((product) => (statusFilter === "all" ? true : product.status === statusFilter))
      .map((product) => {
        const stats = analytics.get(product.id) ?? { units: 0, orders: 0, returns: 0 };
        const qScore = qualityScore(product);
        const pdpConv = Math.max(0.3, Math.min(12, 1.4 + stats.orders * 0.05));
        const atcRate = Math.max(0.6, Math.min(14, 2.2 + stats.orders * 0.08));
        const returnRate = stats.orders ? (stats.returns / stats.orders) * 100 : 0;
        const rating = Math.max(3.8, 5 - returnRate * 0.08);
        const convScore = conversionScore({
          quality: qScore,
          pdpConv,
          atcRate,
          returnRate,
          rating,
          stock: product.stockQuantity ?? 0
        });
        const complianceScore = (() => {
          let score = 0;
          if ((product.weightKg ?? 0) > 0) score += 20;
          if ((product.heightCm ?? 0) > 0 && (product.widthCm ?? 0) > 0 && (product.lengthCm ?? 0) > 0) score += 20;
          if ((product.description ?? "").toLowerCase().includes("uso")) score += 20;
          if ((product.description ?? "").toLowerCase().includes("benef")) score += 20;
          if ((product.stockQuantity ?? 0) >= 0) score += 10;
          if (product.category) score += 10;
          return score;
        })();
        return {
          product,
          pdpConv,
          atcRate,
          returnRate,
          rating,
          qScore,
          complianceScore,
          convScore,
          reservedStock: Math.max(0, Math.round((product.stockQuantity ?? 0) * 0.12))
        };
      })
      .sort((a, b) => b.convScore - a.convScore);
  }, [sellerProducts, statusFilter, analytics]);

  const selectedRow = useMemo(
    () => rows.find((row) => row.product.id === selectedProductId) ?? rows[0] ?? null,
    [rows, selectedProductId]
  );

  const toggleSelection = (id: string) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const bulkExecute = async () => {
    if (selectedIds.length === 0) return;
    trackSellerEvent("bulk_action_execute", { action: bulkAction, size: selectedIds.length });

    if (bulkAction === "pause") {
      await Promise.all(
        selectedIds.map(async (id) => {
          const product = sellerProducts.find((item) => item.id === id);
          if (!product) return;
          await productRepository.upsert({ ...product, status: "paused" });
        })
      );
    }

    if (bulkAction === "price_up" || bulkAction === "price_down") {
      const delta = Number(bulkValue || "0");
      if (!Number.isFinite(delta) || delta <= 0) return;
      await Promise.all(
        selectedIds.map(async (id) => {
          const product = sellerProducts.find((item) => item.id === id);
          if (!product) return;
          const multiplier = bulkAction === "price_up" ? 1 + delta / 100 : 1 - delta / 100;
          await productRepository.upsert({ ...product, price: Math.max(0.01, product.price * multiplier) });
          trackSellerEvent("change_price", { product_id: id, delta });
        })
      );
    }

    refresh();
    setSelectedIds([]);
    setBulkValue("");
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Produtos</p>
        <h1 className="mt-2 font-display text-3xl text-bpBlack">Conteudo + performance + conversao</h1>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {["all", "published", "review", "draft", "paused"].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.2em] ${statusFilter === status ? "border-bpPink/60 bg-[#FFF4F8]" : "border-black/10 text-bpGraphite/80"}`}
            >
              {status}
            </button>
          ))}
          <Link href="/seller/products/new" className="ml-auto rounded-full bg-bpBlack px-4 py-2 text-xs uppercase tracking-[0.2em] text-white">
            Adicionar produto
          </Link>
        </div>
      </section>

      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <select value={bulkAction} onChange={(event) => setBulkAction(event.target.value)} className="rounded-2xl border border-black/10 px-3 py-2 text-sm">
            <option value="pause">Pausar anuncio</option>
            <option value="price_up">Aumentar preco (%)</option>
            <option value="price_down">Reduzir preco (%)</option>
            <option value="coupon">Criar cupom (tracking)</option>
            <option value="content">Atualizar conteudo (tracking)</option>
          </select>
          <input value={bulkValue} onChange={(event) => setBulkValue(event.target.value)} placeholder="Valor %" className="rounded-2xl border border-black/10 px-3 py-2 text-sm" />
          <button type="button" onClick={bulkExecute} className="rounded-2xl bg-bpBlack px-4 py-2 text-xs uppercase tracking-[0.2em] text-white">Executar lote</button>
          <p className="text-xs text-bpGraphite/70">{selectedIds.length} selecionado(s)</p>
        </div>
      </section>

      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        {rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-black/20 bg-[#FAFAFB] p-6 text-center">
            <p className="text-sm text-bpGraphite/80">Estado vazio inteligente: importe catalogo ou crie seu primeiro produto.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.2em] text-bpGraphite/70">
                  <th />
                  <th>Produto / SKU</th>
                  <th>Preco</th>
                  <th>Estoque</th>
                  <th>Conv PDP</th>
                  <th>Add-to-cart</th>
                  <th>ATC para Checkout</th>
                  <th>Checkout para Pago</th>
                  <th>Devolucao</th>
                  <th>Nota</th>
                  <th>Qualidade</th>
                  <th>Compliance</th>
                  <th>Score conv</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.product.id} className="bg-[#FAFAFB] text-sm">
                    <td className="rounded-l-2xl px-3 py-3">
                      <input type="checkbox" checked={selectedIds.includes(row.product.id)} onChange={() => toggleSelection(row.product.id)} />
                    </td>
                    <td className="px-3 py-3">
                      <button type="button" onClick={() => trackSellerEvent("product_row_click", { product_id: row.product.id })} className="text-left">
                        <p className="font-semibold text-bpBlackSoft">{row.product.name}</p>
                        <p className="text-xs text-bpGraphite/70">SKU: {row.product.id.slice(0, 8)} | status: {row.product.status}</p>
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <p>{formatPrice(row.product.price)}</p>
                      <p className="text-xs text-bpGraphite/70">hist: n/a</p>
                    </td>
                    <td className="px-3 py-3">
                      <p>{row.product.stockQuantity ?? 0}</p>
                      <p className="text-xs text-bpGraphite/70">reserv: {row.reservedStock}</p>
                    </td>
                    <td className="px-3 py-3">{row.pdpConv.toFixed(2)}%</td>
                    <td className="px-3 py-3">{row.atcRate.toFixed(2)}%</td>
                    <td className="px-3 py-3">{Math.max(35, 72 - row.returnRate * 3).toFixed(1)}%</td>
                    <td className="px-3 py-3">{Math.max(30, 79 - row.returnRate * 4).toFixed(1)}%</td>
                    <td className="px-3 py-3">{row.returnRate.toFixed(2)}%</td>
                    <td className="px-3 py-3">{row.rating.toFixed(2)}</td>
                    <td className="px-3 py-3">{row.qScore}</td>
                    <td className="px-3 py-3">{row.complianceScore}</td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs ${row.convScore >= 70 ? "bg-emerald-100 text-emerald-700" : row.convScore >= 50 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>
                        {row.convScore.toFixed(0)}
                      </span>
                    </td>
                    <td className="rounded-r-2xl px-3 py-3">
                      <button
                        type="button"
                        onClick={() => setSelectedProductId(row.product.id)}
                        className="rounded-full border border-black/20 px-3 py-1 text-xs uppercase tracking-[0.2em] text-bpGraphite/80"
                      >
                        Detalhar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selectedRow ? (
        <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-bpGraphite/70">Produto selecionado</p>
              <h2 className="mt-1 font-display text-2xl text-bpBlack">{selectedRow.product.name}</h2>
              <p className="mt-1 text-sm text-bpGraphite/80">
                Score conversao {selectedRow.convScore.toFixed(0)} | Score qualidade {selectedRow.qScore}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="rounded-full border border-black/20 px-3 py-1 text-xs uppercase tracking-[0.2em] text-bpGraphite/80">
                Teste A/B foto
              </button>
              <button type="button" className="rounded-full border border-black/20 px-3 py-1 text-xs uppercase tracking-[0.2em] text-bpGraphite/80">
                Teste A/B titulo
              </button>
              <button type="button" className="rounded-full border border-black/20 px-3 py-1 text-xs uppercase tracking-[0.2em] text-bpGraphite/80">
                Teste A/B preco
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_1fr_1fr]">
            <article className="rounded-2xl border border-black/10 bg-[#FAFAFB] p-4">
              <h3 className="text-sm font-semibold text-bpBlackSoft">Funil do produto</h3>
              <div className="mt-3 space-y-2 text-xs text-bpGraphite/80">
                <p>PDP para ATC: {selectedRow.pdpConv.toFixed(2)}%</p>
                <p>ATC para Checkout: {Math.max(35, 72 - selectedRow.returnRate * 3).toFixed(1)}%</p>
                <p>Checkout para Pago: {Math.max(30, 79 - selectedRow.returnRate * 4).toFixed(1)}%</p>
                <p>Return rate: {selectedRow.returnRate.toFixed(2)}%</p>
              </div>
            </article>

            <article className="rounded-2xl border border-black/10 bg-[#FAFAFB] p-4">
              <h3 className="text-sm font-semibold text-bpBlackSoft">Heatmap de variante (simulado)</h3>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                {[72, 64, 58, 54, 48, 43].map((score, index) => (
                  <div
                    key={score + index}
                    className={`rounded-lg p-2 ${
                      score >= 60 ? "bg-emerald-100 text-emerald-700" : score >= 50 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    V{index + 1}: {score}%
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-2xl border border-black/10 bg-[#FAFAFB] p-4">
              <h3 className="text-sm font-semibold text-bpBlackSoft">Checklist de melhoria</h3>
              <ul className="mt-3 space-y-1 text-xs text-bpGraphite/80">
                <li>- Fotos 5+ com boa resolucao</li>
                <li>- Titulo com atributos principais</li>
                <li>- Descricao com uso e beneficios</li>
                <li>- Atributos completos por tipo de pele/cabelo</li>
                <li>- Lote/validade e dados obrigatorios</li>
              </ul>
            </article>
          </div>
        </section>
      ) : null}
    </div>
  );
}
