"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { EmptyState } from "@/components/EmptyState";
import { PageHeading } from "@/components/PageHeading";
import { useAuth } from "@/lib/AuthContext";
import { getSupabaseClient } from "@/lib/supabase/client";
import { Order } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

const formatOrderId = (value: string) =>
  value.length > 8 ? value.slice(0, 8) + "..." : value;

export default function AccountHomePage() {
  const { ready, user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);
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

    const loadSummary = async () => {
      try {
        const { data: orderRows } = await supabase
          .from("orders")
          .select("*")
          .eq("customer_id", user.id)
          .order("created_at", { ascending: false });

        const mapped = (orderRows ?? []).map((row) => ({
          id: row.id,
          customerId: row.customer_id ?? "guest",
          totalProducts: Number(row.total_products_cents ?? 0) / 100,
          totalShipping: Number(row.total_shipping_cents ?? 0) / 100,
          totalOrder: Number(row.total_order_cents ?? 0) / 100,
          status: row.status ?? "Confirmado",
          createdAt: row.created_at ?? new Date().toISOString(),
          paymentMethod: "cartao" as const,
          address: row.address ?? {},
          destinationCep: row.destination_cep ?? "",
          paymentIntentId: row.payment_intent_id ?? undefined,
          totalAmount: Number(row.total_order_cents ?? 0) / 100,
          paymentStatus: row.payment_status ?? undefined
        }));

        const { count } = await supabase
          .from("favorites")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id);

        const { data: walletRows } = await supabase
          .from("wallet_transactions")
          .select("amount_cents")
          .eq("user_id", user.id);

        if (!active) return;
        setOrders(mapped);
        setFavoritesCount(count ?? 0);
        setWalletBalance(
          (walletRows ?? []).reduce((acc, row) => acc + Number(row.amount_cents ?? 0), 0) / 100
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadSummary();

    return () => {
      active = false;
    };
  }, [ready, user]);

  const recentOrders = useMemo(() => orders.slice(0, 3), [orders]);
  const inProgressCount = useMemo(
    () => orders.filter((order) => !["fulfilled", "cancelled"].includes(order.status)).length,
    [orders]
  );

  return (
    <div className="space-y-10">
      <PageHeading
        title="Minha Conta"
        subtitle="O resumo editorial das suas escolhas."
      />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">
                Pedidos
              </p>
              <h2 className="mt-2 font-display text-2xl text-bpBlack">
                Historico recente
              </h2>
            </div>
            <Link
              href="/account/orders"
              className="rounded-full border border-black/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-bpGraphite"
            >
              Ver todos
            </Link>
          </div>
          <div className="mt-6 space-y-3">
            {loading ? (
              <p className="text-sm text-bpGraphite/70">Carregando pedidos...</p>
            ) : recentOrders.length === 0 ? (
              <EmptyState
                title="Nenhum pedido por aqui ainda"
                body="Quando voce fizer sua primeira escolha, ela aparecera aqui com todos os detalhes."
                ctaLabel="Explorar a curadoria"
                ctaHref="/catalogo"
              />
            ) : (
              recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl border border-black/10 p-4 text-sm text-bpGraphite/80"
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
                    Total {formatPrice(order.totalOrder)} -{" "}
                    {new Date(order.createdAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short"
                    })}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="space-y-6">
          <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Entregas</p>
            <p className="mt-2 text-2xl font-semibold text-bpBlack">{inProgressCount}</p>
            <p className="text-sm text-bpGraphite/80">Em andamento</p>
          </div>
          <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Carteira</p>
            <p className="mt-2 text-2xl font-semibold text-bpBlack">
              {formatPrice(walletBalance)}
            </p>
            <p className="text-sm text-bpGraphite/80">Creditos disponiveis</p>
          </div>
          <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Favoritos</p>
            <p className="mt-2 text-2xl font-semibold text-bpBlack">{favoritesCount}</p>
            <p className="text-sm text-bpGraphite/80">Produtos guardados</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {[
          { label: "Rastrear pedido", href: "/account/orders" },
          { label: "Recomprar", href: "/catalogo" },
          { label: "Suporte", href: "/account/support" },
          { label: "Atualizar endereco", href: "/account/addresses" }
        ].map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="rounded-2xl border border-black/10 bg-white px-6 py-4 text-sm font-semibold text-bpBlackSoft shadow-sm transition hover:border-black/30"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
