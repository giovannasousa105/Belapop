"use client";

import { useEffect, useState } from "react";

import { belapopApi, OrderDetailResponse } from "@/lib/belapopApi";

type Props = {
  orderId: string;
};

export default function BelapopOrderDetail({ orderId }: Props) {
  const [order, setOrder] = useState<OrderDetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setOrder(null);
    setError(null);
    void (async () => {
      try {
        const detail = await belapopApi.getOrder(orderId);
        setOrder(detail);
      } catch (err) {
        setError((err as Error).message);
      }
    })();
  }, [orderId]);

  if (error) {
    return (
      <div className="rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
        Erro ao carregar pedido: {error}
      </div>
    );
  }

  if (!order) {
    return <p className="text-sm text-bpGraphite/80">Buscando informações...</p>;
  }

  return (
    <div className="space-y-4 rounded-2xl border border-bpBlack/10 bg-white p-6 shadow-sm">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Pedido</p>
        <p className="text-lg font-semibold text-bpBlackSoft">{order.order.id}</p>
        <p className="text-sm text-bpGraphite/80">
          Status: {order.order.status} · Total {(order.order.total_cents / 100).toFixed(2)} BRL
        </p>
      </div>

      <section className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Itens</p>
        <div className="space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-xl border px-3 py-2">
              <div>
                <p className="text-sm font-semibold text-bpBlackSoft">{item.title}</p>
                <p className="text-xs text-bpGraphite/70">
                  {item.quantity} × {(item.unit_price_cents / 100).toFixed(2)} BRL
                </p>
              </div>
              <p className="text-sm text-bpGraphite/80">{(item.line_total_cents / 100).toFixed(2)} BRL</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Envios</p>
        <div className="space-y-3">
          {order.shipments.map((shipment) => (
            <div
              key={shipment.id}
              className="rounded-xl border border-bpBlack/20 bg-bpOffWhite p-3 text-sm text-bpGraphite/80"
            >
              <p className="text-sm font-semibold text-bpBlackSoft">Loja {shipment.store_id}</p>
              <p>Status: {shipment.status}</p>
              <p>Frete {(shipment.shipping_cents / 100).toFixed(2)} BRL</p>
              <p>Transportadora: {shipment.carrier ?? "não informado"}</p>
              {shipment.tracking_code && <p>Tracking: {shipment.tracking_code}</p>}
            </div>
          ))}
        </div>
      </section>

      {order.payment && (
        <section className="space-y-1">
          <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Pagamento</p>
          <p className="text-sm text-bpGraphite">Status: {order.payment.status}</p>
          <p className="text-sm text-bpGraphite">
            Valor {(order.payment.amount_cents / 100).toFixed(2)} · Provider {order.payment.provider ?? "sem info"}
          </p>
        </section>
      )}
    </div>
  );
}
