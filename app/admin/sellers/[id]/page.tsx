"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { LuxuryButton } from "@/components/LuxuryButton";
import { orderRepository } from "@/lib/orders/orderRepository";
import { productRepository } from "@/lib/repositories/productRepository";
import { sellerRepository } from "@/lib/repositories/sellerRepository";
import { Product, SellerStatus, SellerStore, SubOrder } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

const statusLabel = (status?: SellerStatus) => {
  switch (status) {
    case "active":
      return "Aprovado";
    case "paused":
      return "Pausado";
    case "rejected":
      return "Reprovado";
    default:
      return "Pendente";
  }
};

export default function AdminSellerDetailPage() {
  const params = useParams();
  const sellerId = String(params?.id ?? "");
  const [seller, setSeller] = useState<SellerStore | null>(null);
  const [subOrders, setSubOrders] = useState<SubOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const [found, subOrdersData, productsData] = await Promise.all([
        sellerRepository.getById(sellerId),
        orderRepository.getSubOrders(),
        productRepository.getAll()
      ]);
      if (!active) return;
      setSeller(found);
      setSubOrders(subOrdersData.filter((order) => order.sellerId === sellerId));
      setProducts(productsData.filter((product) => product.sellerId === sellerId));
    };
    void load();
    return () => {
      active = false;
    };
  }, [sellerId]);

  const refreshSeller = async () => {
    const updated = await sellerRepository.getById(sellerId);
    if (updated) {
      setSeller(updated);
    }
  };

  const callSellerAdminEndpoint = async (action: "approve" | "pause") => {
    const response = await fetch(`/api/admin/sellers/${sellerId}/${action}`, {
      method: "POST"
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Não foi possível concluir a ação.");
    }
  };

  const handleApproveSeller = async () => {
    try {
      await callSellerAdminEndpoint("approve");
      await refreshSeller();
    } catch (error) {
      console.error("[admin/seller-detail] approve", error);
    }
  };

  const handlePauseSeller = async () => {
    try {
      await callSellerAdminEndpoint("pause");
      await refreshSeller();
    } catch (error) {
      console.error("[admin/seller-detail] pause", error);
    }
  };

  if (!seller) {
    return (
      <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-sm text-noir-600">Lojista não localizado.</p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="rounded-3xl border border-black/10 bg-white p-8 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-noir-500">
          Detalhe do lojista
        </p>
        <h1 className="mt-3 font-display text-3xl text-noir-950">
          {seller.storeName}
        </h1>
        <p className="mt-2 text-sm text-noir-600">Status: {statusLabel(seller.status)}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <LuxuryButton tone="retail" onClick={handleApproveSeller}>
            Aprovar
          </LuxuryButton>
          <LuxuryButton
            tone="retail"
            variant="outline"
            onClick={handlePauseSeller}
          >
            Pausar
          </LuxuryButton>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="font-display text-2xl text-noir-950">
            Dados da loja
          </h2>
          <div className="mt-4 grid gap-4 text-sm text-noir-600 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-noir-500">
                Responsável
              </p>
              <p className="mt-1 text-sm text-noir-900">
                {seller.owner?.fullName ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-noir-500">
                Categoria
              </p>
              <p className="mt-1 text-sm text-noir-900">
                {seller.category ?? "Não informada"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-noir-500">
                CEP de origem
              </p>
              <p className="mt-1 text-sm text-noir-900">
                {seller.postalCode ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-noir-500">
                Contato
              </p>
              <p className="mt-1 text-sm text-noir-900">
                {seller.whatsapp ?? seller.instagram ?? "—"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="font-display text-2xl text-noir-950">
            Indicadores
          </h2>
          <div className="mt-4 space-y-3 text-sm text-noir-600">
            <div className="flex justify-between">
              <span>Produtos cadastrados</span>
              <span>{products.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Pedidos vinculados</span>
              <span>{subOrders.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <h2 className="font-display text-2xl text-noir-950">Produtos</h2>
        {products.length === 0 ? (
          <p className="mt-4 text-sm text-noir-600">
            Nenhum produto cadastrado para este lojista.
          </p>
        ) : (
          <div className="mt-4 grid gap-3 text-sm text-noir-600">
            {products.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between rounded-2xl border border-black/10 p-4"
              >
                <span>{product.name}</span>
                <span>{formatPrice(product.price)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <h2 className="font-display text-2xl text-noir-950">Pedidos</h2>
        {subOrders.length === 0 ? (
          <p className="mt-4 text-sm text-noir-600">
            Nenhum pedido associado a este lojista.
          </p>
        ) : (
          <div className="mt-4 space-y-3 text-sm text-noir-600">
            {subOrders.map((order) => (
              <div
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-black/10 p-4"
              >
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-noir-500">
                    Pedido {order.orderId}
                  </p>
                  <p className="mt-1 text-sm text-noir-900">
                    Itens: {order.items.length} • Frete{" "}
                    {formatPrice(order.shippingValue)}
                  </p>
                </div>
                <span className="rounded-full border border-black/10 px-3 py-2 text-xs uppercase tracking-[0.3em] text-noir-600">
                  {order.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


