"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { useAuth } from "@/lib/AuthContext";
import { useStoredProducts } from "@/lib/hooks/useStoredProducts";

export default function SellerAnalyticsPage() {
  const { user } = useAuth();
  const { products } = useStoredProducts();
  const searchParams = useSearchParams();
  const channel = searchParams.get("channel") ?? "all";

  const sellerProducts = useMemo(
    () => products.filter((item) => item.sellerId === user?.sellerProfile?.sellerId),
    [products, user?.sellerProfile?.sellerId]
  );

  const cohorts = useMemo(
    () => [
      { label: "Novos clientes", repurchase30: "18%", repurchase60: "24%", repurchase90: "31%" },
      { label: "Recorrentes", repurchase30: "36%", repurchase60: "48%", repurchase90: "57%" }
    ],
    []
  );

  const attribution = [
    { model: "Last-click", description: "Distribui credito ao ultimo canal de toque." },
    { model: "Assistido", description: "Considera canal de descoberta e canal de fechamento." },
    { model: "View-through", description: "Conta exposicao recente com janela curta." }
  ];

  return (
    <div className="flex w-full flex-col gap-6">
      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Analytics avancado</p>
        <h1 className="mt-2 font-display text-3xl text-bpBlack">Funil, cohorts e atribuicao</h1>
        <p className="mt-2 text-sm text-bpGraphite/80">
          Segmentacao por canal, recorrencia e comportamento de checkout para decisao de crescimento.
        </p>
        <p className="mt-2 text-xs text-bpGraphite/70">Canal ativo no filtro global: {channel}</p>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="font-display text-2xl text-bpBlack">Cohorts (30/60/90 dias)</h2>
          <div className="mt-4 space-y-2">
            {cohorts.map((row) => (
              <div key={row.label} className="rounded-2xl border border-black/10 bg-[#FAFAFB] p-3">
                <p className="text-sm font-semibold text-bpBlackSoft">{row.label}</p>
                <p className="mt-1 text-xs text-bpGraphite/70">
                  30d: {row.repurchase30} | 60d: {row.repurchase60} | 90d: {row.repurchase90}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="font-display text-2xl text-bpBlack">Segmentos</h2>
          <ul className="mt-4 space-y-2 text-sm text-bpGraphite/80">
            <li>- Regiao (UF/cidade)</li>
            <li>- Ticket medio e faixa de gasto</li>
            <li>- Categoria e linha</li>
            <li>- Canal e dispositivo</li>
            <li>- Horario de compra</li>
            <li>- Abandono de checkout (frete, cupom, parcelamento)</li>
          </ul>
        </article>
      </section>

      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <h2 className="font-display text-2xl text-bpBlack">Niveis de atribuicao</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {attribution.map((item) => (
            <article key={item.model} className="rounded-2xl border border-black/10 bg-[#FAFAFB] p-4">
              <h3 className="text-lg font-semibold text-bpBlackSoft">{item.model}</h3>
              <p className="mt-2 text-sm text-bpGraphite/80">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <h2 className="font-display text-2xl text-bpBlack">LTV estimado por categoria</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {sellerProducts.slice(0, 3).map((product) => (
            <article key={product.id} className="rounded-2xl border border-black/10 bg-[#FAFAFB] p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-bpGraphite/70">{product.category}</p>
              <p className="mt-2 text-lg font-semibold text-bpBlackSoft">{product.name}</p>
              <p className="mt-1 text-sm text-bpGraphite/80">LTV estimado: R$ {(product.price * 2.6).toFixed(2)}</p>
            </article>
          ))}
          {sellerProducts.length === 0 ? (
            <p className="text-sm text-bpGraphite/80">Cadastre produtos para exibir LTV por categoria.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

