"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { useAuth } from "@/lib/AuthContext";
import { type OrderRow, formatDateTimePtBr, formatMoneyFromCents, shortId, statusLabel } from "@/lib/customer/portal";
import { getCustomerOrders, mapOrdersListToLegacy } from "@/lib/customer/api";

const REASON_OPTIONS = [
  { key: "troca", label: "Troca por outro item" },
  { key: "reembolso", label: "Reembolso no metodo original" },
  { key: "vale", label: "Vale para proxima compra" }
];

const canRequestReturn = (status: string | null | undefined) => {
  const label = statusLabel(status, "order");
  return label === "Entregue" || label === "Enviado";
};

export default function ContaTrocasPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const focusOrder = searchParams.get("order");
  const focusSeller = searchParams.get("seller");
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [selectedIntent, setSelectedIntent] = useState("troca");

  useEffect(() => {
    if (!user) return;
    let active = true;
    setLoading(true);

    const load = async () => {
      try {
        const response = await getCustomerOrders({ page: 1, page_size: 20 });
        if (!active) return;
        setOrders(mapOrdersListToLegacy(response).orders as OrderRow[]);
      } catch {
        if (active) setOrders([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [user]);

  const eligibleOrders = useMemo(() => orders.filter((order) => canRequestReturn(order.status)), [orders]);

  return (
    <div className="space-y-6 pb-8">
      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/60">Trocas e devolucoes</p>
        <h1 className="mt-3 font-display text-4xl text-bpBlack">Self-service com transparencia</h1>
        <p className="mt-3 text-sm text-bpGraphite/75">
          Escolha troca, estorno ou vale. O processo gera protocolo e segue com historico no painel.
        </p>
      </section>

      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-bpBlack">O que voce deseja resolver?</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {REASON_OPTIONS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setSelectedIntent(item.key)}
              className={`rounded-full border px-3 py-2 text-xs uppercase tracking-[0.18em] ${
                selectedIntent === item.key
                  ? "border-bpPink/50 bg-bpPink/10 text-bpBlack"
                  : "border-black/10 text-bpGraphite/80"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <ol className="mt-5 space-y-2 text-sm text-bpGraphite/80">
          <li>1. Selecione o pedido elegivel.</li>
          <li>2. Informe motivo e evidencia (foto/video) no protocolo.</li>
          <li>3. Acompanhe SLA e resposta da loja na central de suporte.</li>
        </ol>
      </section>

      <section className="space-y-3">
        {loading ? (
          <div className="rounded-2xl border border-black/10 bg-white p-6 text-sm text-bpGraphite/70">
            Carregando pedidos elegiveis...
          </div>
        ) : eligibleOrders.length === 0 ? (
          <div className="rounded-2xl border border-black/10 bg-white p-6 text-sm text-bpGraphite/70">
            Nenhum pedido elegivel para troca ou devolucao no momento.
          </div>
        ) : (
          eligibleOrders.map((order) => (
            <article key={order.id} className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-bpBlackSoft">Pedido {shortId(order.id)}</p>
                  <p className="text-xs text-bpGraphite/70">{formatDateTimePtBr(order.created_at)}</p>
                </div>
                <p className="text-sm font-semibold text-bpBlack">{formatMoneyFromCents(order.total_order_cents)}</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`/conta/reclamacoes-suporte?order=${order.id}&seller=${focusSeller ?? ""}&reason=${selectedIntent}`}
                  className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.18em] ${
                    focusOrder === order.id ? "border-bpPink/50 bg-bpPink/10 text-bpBlack" : "border-black/15 text-bpGraphite"
                  }`}
                >
                  Solicitar agora
                </Link>
                <Link
                  href={`/conta/pedidos/${order.id}`}
                  className="rounded-full border border-black/15 px-4 py-2 text-xs uppercase tracking-[0.18em] text-bpGraphite"
                >
                  Ver detalhes
                </Link>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}
