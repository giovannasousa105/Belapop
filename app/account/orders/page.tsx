"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { EmptyState } from "@/components/EmptyState";
import { PageHeading } from "@/components/PageHeading";
import { useAuth } from "@/lib/AuthContext";
import { getSupabaseClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";

type OrderRow = {
  id: string;
  status: string;
  total_order_cents: number;
  created_at: string;
};

const formatOrderId = (value: string) =>
  value.length > 8 ? value.slice(0, 8) + "..." : value;

export default function AccountOrdersPage() {
  const { ready, user } = useAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      setOrders([]);
      setLoading(false);
      return;
    }
    let active = true;
    const supabase = getSupabaseClient();
    setLoading(true);

    const load = async () => {
      const { data } = await supabase
        .from("orders")
        .select("id,status,total_order_cents,created_at")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });
      if (!active) return;
      setOrders(data ?? []);
      setLoading(false);
    };
    void load();

    return () => {
      active = false;
    };
  }, [ready, user]);

  return (
    <div className="space-y-6">
      <PageHeading
        title="Meus Pedidos"
        subtitle="Cada escolha, registrada com cuidado."
      />
      {loading ? (
        <p className="text-sm text-bpGraphite/70">Carregando pedidos...</p>
      ) : orders.length === 0 ? (
        <EmptyState
          title="Nenhum pedido por aqui ainda"
          body="Quando você fizer sua primeira escolha, ela aparecerá aqui com todos os detalhes."
          ctaLabel="Explorar a curadoria"
          ctaHref="/catalogo"
        />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/account/orders/${order.id}`}
              className="block rounded-2xl border border-black/10 bg-white p-5 text-sm text-bpGraphite shadow-sm transition hover:border-black/30"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-bpBlackSoft">
                  Pedido {formatOrderId(order.id)}
                </p>
                <span className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">
                  {order.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-bpGraphite/80">
                Total {formatPrice((order.total_order_cents ?? 0) / 100)} •{" "}
                {new Date(order.created_at).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short"
                })}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
