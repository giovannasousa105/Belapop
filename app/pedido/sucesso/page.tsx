"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { LuxuryButton } from "@/components/LuxuryButton";
import { useStoredProducts } from "@/lib/hooks/useStoredProducts";
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";
import { Order, SubOrder } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

function PedidoSucessoInner() {
  const [order, setOrder] = useState<Order | null>(null);
  const [subOrders, setSubOrders] = useState<SubOrder[]>([]);
  const { products } = useStoredProducts();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order");

  useEffect(() => {
    if (!orderId) return;
    let active = true;
    const supabase = getSupabaseBrowserClient();

    const load = async () => {
      const { data: orderRow } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .maybeSingle();
      const { data: subRows } = await supabase
        .from("sub_orders")
        .select("*")
        .eq("order_id", orderId);

      if (!active) return;
      if (orderRow) {
        setOrder({
          id: orderRow.id,
          customerId: orderRow.customer_id ?? "guest",
          totalProducts: Number(orderRow.total_products_cents ?? 0) / 100,
          totalShipping: Number(orderRow.total_shipping_cents ?? 0) / 100,
          totalOrder: Number(orderRow.total_order_cents ?? 0) / 100,
          status: orderRow.status ?? "Confirmado",
          createdAt: orderRow.created_at ?? new Date().toISOString(),
          paymentMethod: "cartao",
          address: orderRow.address ?? {},
          destinationCep: orderRow.destination_cep ?? "",
          paymentIntentId: orderRow.payment_intent_id ?? undefined,
          totalAmount: Number(orderRow.total_order_cents ?? 0) / 100,
          paymentStatus: orderRow.payment_status ?? undefined
        });
      } else {
        setOrder(null);
      }

      setSubOrders(
        (subRows ?? []).map((row) => ({
          id: row.id,
          orderId: row.order_id,
          sellerId: row.seller_id,
          items: row.items ?? [],
          shippingValue: Number(row.shipping_total_cents ?? 0) / 100,
          shippingService: row.shipping_service ?? "",
          status: row.status ?? "Confirmado",
          createdAt: row.created_at ?? new Date().toISOString(),
          productTotal: Number(row.product_total_cents ?? 0) / 100,
          shippingTotal: Number(row.shipping_total_cents ?? 0) / 100,
          platformFee: Number(row.platform_fee_cents ?? 0) / 100,
          sellerNetAmount: Number(row.seller_net_cents ?? 0) / 100,
          paymentStatus: row.payment_status ?? undefined
        }))
      );
    };

    void load();
    return () => {
      active = false;
    };
  }, [orderId]);

  const items = useMemo(
    () =>
      subOrders.flatMap((subOrder) =>
        subOrder.items.map((item) => {
          const product = products.find((p) => p.id === item.productId);
          return {
            ...item,
            product
          };
        })
      ),
    [subOrders, products]
  );

  if (!order) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-4xl items-center justify-center px-6">
        <div className="glass-panel rounded-2xl p-8 text-center">
          <h1 className="font-display text-3xl text-blush-50">
            Pedido não localizado
          </h1>
          <p className="mt-2 text-sm text-blush-100/70">
            Finalize um pedido para acompanhar o status por aqui.
          </p>
          <div className="mt-6">
            <LuxuryButton href="/catalogo">Explorar curadoria</LuxuryButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-16">
      <div className="glass-panel rounded-3xl p-10 text-center">
        <p className="text-xs uppercase tracking-luxe text-blush-100/70">
          Pedido confirmado
        </p>
        <h1 className="mt-4 font-display text-3xl text-blush-50 md:text-4xl">
          Seu pedido está em separação com todo cuidado.
        </h1>
        <p className="mt-4 text-sm text-blush-100/70">
          Status atual: {order.status}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <LuxuryButton variant="outline" href="/minha-conta">
            Ver minha conta
          </LuxuryButton>
          <LuxuryButton href="/catalogo">Continuar comprando</LuxuryButton>
        </div>
      </div>
      <div className="glass-panel rounded-2xl p-6">
        <h2 className="font-display text-2xl text-blush-50">Resumo</h2>
        <div className="mt-6 space-y-4 text-sm text-blush-100/70">
          {items.map((item) => (
            <div
              key={`${item.productId}-${item.sellerId}`}
              className="flex justify-between"
            >
              <span>
                {item.product?.name ?? "Produto"} • {item.quantity}x
              </span>
              <span>
                {item.product
                  ? formatPrice(item.product.price * item.quantity)
                  : "--"}
              </span>
            </div>
          ))}
          <div className="flex justify-between border-t border-white/10 pt-3 text-blush-50">
            <span>Total</span>
            <span>{formatPrice(order.totalOrder)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PedidoSucessoPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-[60vh] w-full max-w-4xl items-center justify-center px-6">
          <div className="glass-panel rounded-2xl p-8 text-center">
            <p className="text-sm text-blush-100/70">Carregando...</p>
          </div>
        </div>
      }
    >
      <PedidoSucessoInner />
    </Suspense>
  );
}

