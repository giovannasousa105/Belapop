"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { OrderTimeline } from "@/components/OrderTimeline";
import { PageHeading } from "@/components/PageHeading";
import { useAuth } from "@/lib/AuthContext";
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";
import { formatPrice } from "@/lib/utils";

type OrderRow = {
  id: string;
  status: string;
  total_order_cents: number;
  created_at: string;
};

type SubOrderRow = {
  id: string;
  seller_id: string;
  status: string;
  shipping_service?: string | null;
  shipping_days?: number | null;
  shipping_total_cents?: number | null;
  product_total_cents?: number | null;
  items?: Array<{ productId?: string; quantity?: number }>;
};

type HistoryRow = {
  id: string;
  status: string;
  created_at: string;
};

const isReviewableStatus = (status?: string | null) => {
  if (!status) return false;
  const normalized = status
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
  return (
    normalized.includes("entregue") ||
    normalized.includes("delivered") ||
    normalized.includes("finalizado") ||
    normalized.includes("completed") ||
    normalized.includes("enviado")
  );
};

export default function AccountOrderDetailPage() {
  const params = useParams();
  const orderId = String(params?.id ?? "");
  const { ready, user } = useAuth();
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [subOrders, setSubOrders] = useState<SubOrderRow[]>([]);
  const [sellerMap, setSellerMap] = useState<Record<string, string>>({});
  const [productMap, setProductMap] = useState<Record<string, string>>({});
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready || !user || !orderId) return;
    let active = true;
    const supabase = getSupabaseBrowserClient();
    setLoading(true);

    const load = async () => {
      const { data: orderRow } = await supabase
        .from("orders")
        .select("id,status,total_order_cents,created_at")
        .eq("id", orderId)
        .eq("customer_id", user.id)
        .maybeSingle();

      const { data: subRows } = await supabase
        .from("sub_orders")
        .select(
          "id,seller_id,status,shipping_service,shipping_days,shipping_total_cents,product_total_cents,items"
        )
        .eq("order_id", orderId);

      const sellerIds = Array.from(
        new Set((subRows ?? []).map((row) => row.seller_id))
      );
      const { data: sellers } = await supabase
        .from("sellers")
        .select("id,store_name")
        .in(
          "id",
          sellerIds.length
            ? sellerIds
            : ["00000000-0000-0000-0000-000000000000"]
        );

      const productIds = Array.from(
        new Set(
          (subRows ?? [])
            .flatMap((row) => (Array.isArray(row.items) ? row.items : []))
            .map((item: { productId?: string }) => item.productId)
            .filter((id): id is string => Boolean(id))
        )
      );

      const { data: products } = await supabase
        .from("products")
        .select("id,name")
        .in(
          "id",
          productIds.length
            ? productIds
            : ["00000000-0000-0000-0000-000000000000"]
        );

      if (!active) return;
      setOrder(orderRow ?? null);
      setSubOrders(subRows ?? []);
      setSellerMap(
        (sellers ?? []).reduce<Record<string, string>>((acc, row) => {
          acc[row.id] = row.store_name ?? "Marca";
          return acc;
        }, {})
      );
      setProductMap(
        (products ?? []).reduce<Record<string, string>>((acc, row) => {
          acc[row.id] = row.name ?? "Produto";
          return acc;
        }, {})
      );
      setLoading(false);
    };

    void load();

    return () => {
      active = false;
    };
  }, [ready, user, orderId]);

  useEffect(() => {
    if (!ready || !user || !orderId) return;
    let active = true;
    const loadHistory = async () => {
      const res = await fetch(`/api/orders/${orderId}/status-history`);
      if (!res.ok) {
        if (active) setHistory([]);
        return;
      }
      const json = (await res.json()) as { history: HistoryRow[] };
      if (!active) return;
      setHistory(json.history ?? []);
    };
    void loadHistory();
    return () => {
      active = false;
    };
  }, [ready, user, orderId]);

  const total = useMemo(
    () => (order ? (order.total_order_cents ?? 0) / 100 : 0),
    [order]
  );

  const orderItems = useMemo(
    () =>
      subOrders.flatMap((sub) =>
        (Array.isArray(sub.items) ? sub.items : []).map((item, index) => ({
          key: `${sub.id}-${item.productId ?? "item"}-${index}`,
          productId: item.productId ?? "",
          quantity: item.quantity ?? 1,
          sellerId: sub.seller_id,
          subStatus: sub.status
        }))
      ),
    [subOrders]
  );

  if (loading) {
    return <p className="text-sm text-noir-500">Carregando pedido...</p>;
  }

  if (!order) {
    return (
      <div className="rounded-2xl border border-black/10 bg-white p-6 text-sm text-noir-600">
        Pedido não encontrado.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeading
        title="Resumo do pedido"
        subtitle="Cada envio é tratado com o cuidado editorial BelaPop."
      />

      <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.3em] text-noir-500">Pedido</p>
          <span className="text-xs uppercase tracking-[0.3em] text-noir-500">
            {order.status}
          </span>
        </div>
        <p className="mt-3 text-2xl font-semibold text-noir-950">
          {formatPrice(total)}
        </p>
        <p className="text-sm text-noir-600">
          Criado em{" "}
          {new Date(order.created_at).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric"
          })}
        </p>
      </div>

      <OrderTimeline history={history} currentStatus={order.status} />

      <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.3em] text-noir-500">Envios</p>
        </div>
        <p className="mt-3 text-sm text-noir-600">
          Quando há mais de uma marca, os envios são realizados separadamente para
          garantir rastreio adequado.
        </p>
        <div className="mt-4 space-y-4">
          {subOrders.map((sub) => (
            <div
              key={sub.id}
              className="rounded-2xl border border-black/10 p-4 text-sm"
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold text-noir-900">
                  {sellerMap[sub.seller_id] ?? "Marca"}
                </p>
                <span className="text-xs uppercase tracking-[0.3em] text-noir-500">
                  {sub.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-noir-600">
                Serviço {sub.shipping_service ?? "Padrão"} • Prazo{" "}
                {sub.shipping_days ? `${sub.shipping_days} dias` : "em atualização"}
              </p>
              <p className="mt-1 text-xs text-noir-500">
                Frete {formatPrice((sub.shipping_total_cents ?? 0) / 100)} • Produtos{" "}
                {formatPrice((sub.product_total_cents ?? 0) / 100)}
              </p>
              <p className="mt-2 text-xs text-noir-500">
                Tracking disponível após postagem.
              </p>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <Link
            href={`/account/support?order=${order.id}`}
            className="inline-flex rounded-full border border-black/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-noir-700"
          >
            Ajuda com este pedido
          </Link>
        </div>
      </div>

      <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.3em] text-noir-500">
            Itens do pedido
          </p>
        </div>
        <div className="mt-4 space-y-4">
          {orderItems.length ? (
            orderItems.map((item) => {
              const canReview =
                isReviewableStatus(order.status) ||
                isReviewableStatus(item.subStatus);
              return (
                <div
                  key={item.key}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-black/10 px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-semibold text-noir-900">
                      {productMap[item.productId] ?? "Produto"}
                    </p>
                    <p className="text-xs text-noir-500">
                      {sellerMap[item.sellerId] ?? "Marca"} • {item.quantity}x
                    </p>
                  </div>
                  {canReview && item.productId ? (
                    <Link
                      href={`/produto/${item.productId}#avaliacoes`}
                      className="rounded-full border border-black/10 px-4 py-2 text-[10px] uppercase tracking-[0.3em] text-noir-700 hover:border-luxe-600/40"
                    >
                      Avaliar
                    </Link>
                  ) : (
                    <span className="text-xs text-noir-500">
                      Avaliação disponível após entrega
                    </span>
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-sm text-noir-600">Itens em atualização.</p>
          )}
        </div>
      </div>
    </div>
  );
}
