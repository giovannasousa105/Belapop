"use client";

import { useState, useEffect } from "react";

import { AdminCartRow } from "@/lib/admin/carts";
import { formatPrice } from "@/lib/utils";

const statusLabels: Record<string, string> = {
  active: "Ativos",
  abandoned: "Abandonados",
  converted: "Convertidos"
};

const statusKeys = Object.keys(statusLabels) as Array<keyof typeof statusLabels>;

const fetchCarts = async (status: keyof typeof statusLabels) => {
  const response = await fetch(`/api/admin/carts/list?status=${status}`, {
    cache: "no-store"
  });
  if (!response.ok) {
    throw new Error("Falha ao buscar carrinhos");
  }
  const payload = await response.json();
  return {
    data: (payload.data ?? []) as AdminCartRow[],
    count: payload.count ?? (payload.data ?? []).length
  };
};

export const AdminCartTabs = () => {
  const [activeTab, setActiveTab] = useState<keyof typeof statusLabels>("active");
  const [cartsByStatus, setCartsByStatus] = useState<Record<string, AdminCartRow[]>>({
    active: [],
    abandoned: [],
    converted: []
  });
  const [counts, setCounts] = useState<Record<string, number>>(
    statusKeys.reduce((acc, key) => ({ ...acc, [key]: 0 }), {})
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = async (status: keyof typeof statusLabels) => {
    setLoading(true);
    setError(null);
    try {
      const { data, count } = await fetchCarts(status);
      setCartsByStatus((prev) => ({ ...prev, [status]: data }));
      setCounts((prev) => ({ ...prev, [status]: count }));
    } catch (err) {
      console.error("[admin/carts/fetch]", err);
      setError("Não foi possível carregar os carrinhos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadStatus(activeTab);
  }, [activeTab]);

  const activeItems = cartsByStatus[activeTab] ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        {statusKeys.map((status) => (
          <button
            key={status}
            onClick={() => setActiveTab(status)}
            className={`rounded-2xl border px-4 py-2 text-sm transition ${
              activeTab === status
                ? "border-noir-900 bg-noir-900/10 text-noir-900"
                : "border-[#F6D6E2] text-noir-600 hover:border-noir-900"
            }`}
          >
            {statusLabels[status]} ({counts[status] ?? 0})
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {loading ? (
        <p className="text-sm text-noir-500">Carregando...</p>
      ) : (
        <div className="space-y-3">
          {activeItems.map((cart) => (
            <details
              key={cart.id}
              className="group rounded-2xl border border-[#F6D6E2] p-4 transition hover:border-noir-900"
            >
              <summary className="flex items-center justify-between text-sm font-semibold text-noir-900">
                <span>Cart {cart.id}</span>
                <span>{formatPrice(cart.subtotal_cents)}</span>
              </summary>
              <div className="mt-3 text-xs text-noir-600">
                <p>Status: {cart.status}</p>
                <p>
                  Atualizado em{" "}
                  {cart.updated_at
                    ? new Date(cart.updated_at).toLocaleString("pt-BR")
                    : "—"}
                </p>
                <p>
                  Cliente:{" "}
                  {cart.user_email ?? cart.anon_id ?? "Anonimo"}
                </p>
                <div className="mt-2 space-y-1">
                  {cart.items.map((item, index) => (
                    <p key={`${item.productId}-${index}`}>
                      {item.productId} × {item.quantity}
                    </p>
                  ))}
                </div>
              </div>
            </details>
          ))}
          {activeItems.length === 0 && (
            <p className="text-sm text-noir-600">Nenhum carrinho nesta categoria.</p>
          )}
        </div>
      )}
    </div>
  );
};
