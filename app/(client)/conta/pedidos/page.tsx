"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useAuth } from "@/lib/AuthContext";
import {
  type OrderRow,
  type SubOrderRow,
  formatDateTimePtBr,
  formatMoneyFromCents,
  getUiStatusByKey,
  pickPrimaryStatus,
  shortId,
  statusUiKey,
  UI_STATUS_MAP,
  statusLabel
} from "@/lib/customer/portal";
import { StatusBadge } from "@/components/customer/StatusBadge";
import { getCustomerOrders, mapOrdersListToLegacy } from "@/lib/customer/api";

type DateFilter = "all" | "7d" | "30d" | "90d";

const DATE_FILTERS: Array<{ key: DateFilter; label: string }> = [
  { key: "all", label: "Tudo" },
  { key: "7d", label: "7d" },
  { key: "30d", label: "30d" },
  { key: "90d", label: "90d" }
];

const STATUS_FILTERS = [
  { key: "all", label: "Todos" },
  { key: "Aguardando pagamento", label: "Aguardando pagamento" },
  { key: "Pagamento aprovado", label: "Pagamento aprovado" },
  { key: "Em preparacao", label: "Em preparacao" },
  { key: "Parcialmente enviado", label: "Parcialmente enviado" },
  { key: "Enviado", label: "Enviado" },
  { key: "Parcialmente entregue", label: "Parcialmente entregue" },
  { key: "Entregue", label: "Entregue" },
  { key: "Cancelado", label: "Cancelado" },
  { key: "Estornado", label: "Estornado" },
  { key: "Estorno parcial", label: "Estorno parcial" }
];

const matchDate = (createdAt: string, filter: DateFilter) => {
  if (filter === "all") return true;
  const days = filter === "7d" ? 7 : filter === "30d" ? 30 : 90;
  const since = Date.now() - days * 24 * 60 * 60 * 1000;
  return new Date(createdAt).getTime() >= since;
};

export default function ContaPedidosPage() {
  const { ready, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [subOrders, setSubOrders] = useState<SubOrderRow[]>([]);
  const [sellerMap, setSellerMap] = useState<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("30d");
  const [sellerFilter, setSellerFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [search, setSearch] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace("/login?tab=customer");
      return;
    }

    let active = true;
    setLoading(true);

    const load = async () => {
      try {
        const response = await getCustomerOrders({ page: 1, page_size: 100 });
        const mapped = mapOrdersListToLegacy(response);

        if (!active) return;
        setOrders(mapped.orders as OrderRow[]);
        setSubOrders(mapped.subOrders as SubOrderRow[]);
        setSellerMap(mapped.sellerMap);
      } catch {
        if (active) {
          setOrders([]);
          setSubOrders([]);
          setSellerMap({});
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [ready, router, user]);

  const paymentOptions = useMemo(() => {
    const options = Array.from(
      new Set(
        orders
          .map((order) => (order.payment_provider ?? "").trim())
          .filter(Boolean)
      )
    );
    return options.sort();
  }, [orders]);

  const sellers = useMemo(
    () =>
      Object.entries(sellerMap)
        .map(([id, name]) => ({ id, name }))
        .sort((left, right) => left.name.localeCompare(right.name, "pt-BR")),
    [sellerMap]
  );

  const orderSubOrdersByOrderId = useMemo(() => {
    return subOrders.reduce<Record<string, SubOrderRow[]>>((acc, row) => {
      if (!acc[row.order_id]) acc[row.order_id] = [];
      acc[row.order_id].push(row);
      return acc;
    }, {});
  }, [subOrders]);

  const orderStatusById = useMemo(() => {
    return orders.reduce<Record<string, ReturnType<typeof getUiStatusByKey>>>((acc, order) => {
      const orderSubOrders = orderSubOrdersByOrderId[order.id] ?? [];
      const picked = pickPrimaryStatus([
        { status: order.status, scope: "order" },
        ...orderSubOrders.map((row) => ({
          status: row.status,
          scope: "sub_order" as const,
          options: {
            storeName: sellerMap[row.seller_id],
            shippingDays: row.shipping_days,
            estimatedDeliveryDate: row.shipping?.estimated_delivery_date ?? null,
            createdAt: row.created_at
          }
        }))
      ]);
      const pickedKey = picked ? statusUiKey(picked.status, picked.scope ?? "auto", picked.options) : null;
      acc[order.id] = pickedKey ? getUiStatusByKey(pickedKey, UI_STATUS_MAP) : getUiStatusByKey("ORDER_CREATED", UI_STATUS_MAP);
      return acc;
    }, {});
  }, [orderSubOrdersByOrderId, orders, sellerMap]);

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orders.filter((order) => {
      if (!matchDate(order.created_at, dateFilter)) return false;
      const orderSubOrders = orderSubOrdersByOrderId[order.id] ?? [];
      const primaryOrderUi = orderStatusById[order.id];

      const label = primaryOrderUi?.label ?? "";
      if (statusFilter !== "all" && label !== statusFilter) return false;

      if (paymentFilter !== "all") {
        const provider = (order.payment_provider ?? "").toLowerCase();
        if (provider !== paymentFilter.toLowerCase()) return false;
      }

      if (sellerFilter !== "all" && !orderSubOrders.some((row) => row.seller_id === sellerFilter)) {
        return false;
      }

      if (!term) return true;

      const hasInOrder = order.id.toLowerCase().includes(term);
      const hasInSellers = orderSubOrders.some((subOrder) =>
        (sellerMap[subOrder.seller_id] ?? "").toLowerCase().includes(term)
      );
      return hasInOrder || hasInSellers;
    });
  }, [
    dateFilter,
    orderStatusById,
    orderSubOrdersByOrderId,
    orders,
    paymentFilter,
    search,
    sellerFilter,
    sellerMap,
    statusFilter
  ]);

  return (
    <div className="space-y-6 pb-8">
      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.32em] text-bpGraphite/60">Meus pedidos</p>
        <h1 className="mt-3 font-display text-4xl text-bpBlack">Historico completo</h1>
        <p className="mt-3 text-sm text-bpGraphite/75">
          Filtre por status, periodo, lojista e pagamento para localizar qualquer pedido em segundos.
        </p>
      </section>

      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por pedido, lojista ou protocolo"
            className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm"
          />

          <select
            value={sellerFilter}
            onChange={(event) => setSellerFilter(event.target.value)}
            className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm"
          >
            <option value="all">Todos os lojistas</option>
            {sellers.map((seller) => (
              <option key={seller.id} value={seller.id}>
                {seller.name}
              </option>
            ))}
          </select>

          <select
            value={paymentFilter}
            onChange={(event) => setPaymentFilter(event.target.value)}
            className="h-11 rounded-2xl border border-black/10 bg-white px-4 text-sm"
          >
            <option value="all">Todos os pagamentos</option>
            {paymentOptions.map((provider) => (
              <option key={provider} value={provider}>
                {provider}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2 overflow-x-auto">
            {DATE_FILTERS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setDateFilter(item.key)}
                className={`rounded-full border px-3 py-2 text-xs uppercase tracking-[0.2em] ${
                  dateFilter === item.key
                    ? "border-bpPink/50 bg-bpPink/10 text-bpBlack"
                    : "border-black/10 text-bpGraphite/80"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {STATUS_FILTERS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setStatusFilter(item.key)}
              className={`rounded-full border px-3 py-2 text-xs uppercase tracking-[0.2em] ${
                statusFilter === item.key
                  ? "border-bpPink/50 bg-bpPink/10 text-bpBlack"
                  : "border-black/10 text-bpGraphite/80"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        {loading ? (
          <div className="rounded-2xl border border-black/10 bg-white p-6 text-sm text-bpGraphite/70">
            Carregando pedidos...
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="rounded-2xl border border-black/10 bg-white p-6 text-sm text-bpGraphite/70">
            Nenhum pedido encontrado com os filtros atuais.
          </div>
        ) : (
          filteredOrders.map((order) => {
            const orderSubOrders = orderSubOrdersByOrderId[order.id] ?? [];
            const primaryOrderUi = orderStatusById[order.id];
            return (
              <article
                key={order.id}
                className="rounded-3xl border border-black/10 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-bpBlackSoft">Pedido {shortId(order.id)}</p>
                    <p className="text-xs text-bpGraphite/70">{formatDateTimePtBr(order.created_at)}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {primaryOrderUi ? <StatusBadge status={primaryOrderUi} /> : null}
                    <p className="text-sm font-semibold text-bpBlack">{formatMoneyFromCents(order.total_order_cents)}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-bpGraphite/75">{primaryOrderUi?.message}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {orderSubOrders.map((subOrder) => (
                    <span
                      key={subOrder.id}
                      className="rounded-full border border-black/10 bg-bpOffWhite px-3 py-1 text-[11px] text-bpGraphite/80"
                    >
                      {sellerMap[subOrder.seller_id] ?? "Lojista"} -{" "}
                      {statusLabel(subOrder.status, "sub_order", {
                        storeName: sellerMap[subOrder.seller_id],
                        shippingDays: subOrder.shipping_days,
                        estimatedDeliveryDate: subOrder.shipping?.estimated_delivery_date ?? null,
                        createdAt: subOrder.created_at
                      })}
                    </span>
                  ))}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/conta/pedidos/${order.id}`}
                    className="rounded-full border border-black/15 px-4 py-2 text-xs uppercase tracking-[0.2em] text-bpGraphite"
                  >
                    Ver detalhes
                  </Link>
                  <Link
                    href={`/conta/rastreio?order=${order.id}`}
                    className="rounded-full border border-black/15 px-4 py-2 text-xs uppercase tracking-[0.2em] text-bpGraphite"
                  >
                    Rastrear
                  </Link>
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}
