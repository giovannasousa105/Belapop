"use client";

import { useEffect, useMemo, useState } from "react";

import { LuxuryButton } from "@/components/LuxuryButton";
import { useAuth } from "@/lib/AuthContext";
import { useStoredProducts } from "@/lib/hooks/useStoredProducts";
import { orderRepository } from "@/lib/orders/orderRepository";
import { userRepository } from "@/lib/repositories/userRepository";
import { Order, SubOrder, User } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

export default function SellerOrdersPage() {
  const { user } = useAuth();
  const { products } = useStoredProducts();
  const [orders, setOrders] = useState<Order[]>([]);
  const [subOrders, setSubOrders] = useState<SubOrder[]>([]);
  const [userMap, setUserMap] = useState<Map<string, User>>(new Map());

  useEffect(() => {
    let active = true;
    const load = async () => {
      const [ordersData, subOrdersData, users] = await Promise.all([
        orderRepository.getAll(),
        orderRepository.getSubOrders(),
        userRepository.getAll()
      ]);
      if (!active) return;
      setOrders(ordersData);
      setSubOrders(subOrdersData);
      setUserMap(new Map(users.map((item) => [item.id, item])));
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  const sellerSubOrders = useMemo(
    () =>
      subOrders.filter(
        (subOrder) => subOrder.sellerId === user?.sellerProfile?.sellerId
      ),
    [subOrders, user?.sellerProfile?.sellerId]
  );

  const rows = useMemo(() => {
    return sellerSubOrders
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .map((subOrder) => {
        const mainOrder = orders.find((order) => order.id === subOrder.orderId);
        const customer = mainOrder?.customerId
          ? userMap.get(mainOrder.customerId)
          : undefined;
        const itemLabels = subOrder.items.map((item) => {
          const product = products.find((p) => p.id === item.productId);
          return `${product?.name ?? "Produto"} (${item.quantity}x)`;
        });
        return {
          ...subOrder,
          customerName: customer?.name ?? "Cliente convidado",
          itemLabels,
          mainOrderId: mainOrder?.id ?? subOrder.orderId
        };
      });
  }, [sellerSubOrders, orders, products, userMap]);

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-noir-500">
            Pedidos
          </p>
          <h1 className="mt-2 font-display text-3xl text-noir-950">
            Pedidos do lojista
          </h1>
          <p className="mt-2 text-sm text-noir-600">
            Visualize pedidos, clientes e status de envio.
          </p>
        </div>
        <LuxuryButton tone="retail" variant="outline" href="/seller/dashboard">
          Voltar ao dashboard
        </LuxuryButton>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <p className="text-sm text-noir-600">
            Nenhum pedido registrado para sua loja.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {rows.map((row) => (
            <div
              key={row.id}
              className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-noir-500">
                    Pedido {row.mainOrderId}
                  </p>
                  <p className="mt-2 text-sm text-noir-900">
                    {row.customerName}
                  </p>
                  <p className="mt-1 text-xs text-noir-500">
                    Criado em{" "}
                    {new Date(row.createdAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <span className="rounded-full border border-black/10 px-3 py-2 text-xs uppercase tracking-[0.3em] text-noir-600">
                  {row.status}
                </span>
              </div>
              <div className="mt-4 border-t border-black/10 pt-4 text-sm text-noir-600">
                <p className="text-xs uppercase tracking-[0.3em] text-noir-500">
                  Produtos
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-4">
                  {row.itemLabels.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-noir-500">
                  <span>Frete: {row.shippingService}</span>
                  <span>{formatPrice(row.shippingValue)}</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-noir-500">
                  <span>
                    Pagamento: {row.paymentStatus === "paid" ? "Pago" : "Pendente"}
                  </span>
                  <span>
                    Repasse:{" "}
                    {formatPrice(
                      row.sellerNetAmount ??
                        row.items.reduce((sum, item) => {
                          const product = products.find(
                            (p) => p.id === item.productId
                          );
                          return sum + (product?.price ?? 0) * item.quantity;
                        }, 0)
                    )}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
