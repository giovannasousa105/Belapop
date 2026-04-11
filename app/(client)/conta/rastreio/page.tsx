"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

import { useAuth } from "@/lib/AuthContext";
import {
  type OrderRow,
  type SubOrderRow,
  formatDateTimePtBr,
  getPrimarySubOrderUiStatus,
  getUiStatusByKey,
  pickPrimaryStatus,
  resolveSubOrderUiStatus,
  shortId,
  statusUiKey,
  TRACKING_TIMELINE_KEYS,
  UI_STATUS_MAP,
  type TrackingUiStatus
} from "@/lib/customer/portal";
import {
  type CustomerTrackingByOrderDto
} from "@/lib/customer/dto";
import { StatusBadge } from "@/components/customer/StatusBadge";
import { getCustomerOrders, getCustomerTrackingByOrder, mapOrdersListToLegacy } from "@/lib/customer/api";
import { buildSubOrderTrackingSummary } from "@/lib/customer/trackingSummary";

const toOrderNumber = (orderId: string, createdAt: string) => {
  const year = new Date(createdAt).getFullYear();
  const suffix = orderId.replace(/-/g, "").slice(0, 6).toUpperCase();
  return `BP-${year}-${suffix}`;
};

type SubOrderTrackingCardProps = {
  subOrder: SubOrderRow;
  orderId: string;
  orderCreatedAt: string;
  sellerName: string;
  tracking: CustomerTrackingByOrderDto["sub_orders"][number] | null;
};

const timelineKeys: TrackingUiStatus[] = [...TRACKING_TIMELINE_KEYS];

function SubOrderTrackingCard({
  subOrder,
  orderId,
  orderCreatedAt,
  sellerName,
  tracking
}: SubOrderTrackingCardProps) {
  const orderNumber = useMemo(() => toOrderNumber(orderId, orderCreatedAt), [orderId, orderCreatedAt]);

  const subStatus = useMemo(
    () =>
      getPrimarySubOrderUiStatus(
        {
          sub_order_id: subOrder.id,
          order_id: orderId,
          order_number: orderNumber,
          status: resolveSubOrderUiStatus(subOrder.status).replace("SUB_", ""),
          shipping: {
            estimated_delivery_date: subOrder.shipping?.estimated_delivery_date ?? null
          }
        },
        tracking,
        UI_STATUS_MAP
      ),
    [subOrder.id, subOrder.shipping?.estimated_delivery_date, subOrder.status, orderId, orderNumber, tracking]
  );

  const timeline = useMemo(
    () => timelineKeys.map((key) => ({ key, status: getUiStatusByKey(key, UI_STATUS_MAP) })),
    []
  );
  const trackingSummary = useMemo(
    () =>
      buildSubOrderTrackingSummary({
        subOrder,
        tracking,
        sellerName,
        fallbackCreatedAt: orderCreatedAt
      }),
    [orderCreatedAt, sellerName, subOrder, tracking]
  );

  return (
    <article className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-bpBlackSoft">{sellerName}</p>
          <p className="text-xs text-bpGraphite/70">{trackingSummary.carrierLine}</p>
        </div>
        <StatusBadge status={subStatus} />
      </div>
      <p className="mt-3 text-sm text-bpGraphite/75">{trackingSummary.detailLine}</p>
      <p className="mt-1 text-sm text-bpGraphite/70">Previsao: {trackingSummary.etaLabel}</p>
      <p className="mt-1 text-xs text-bpGraphite/65">
        Atualizado em {trackingSummary.lastUpdatedLabel}
      </p>

      <ol className="mt-5 space-y-3">
        {timeline.map((step, index) => {
          const done = subStatus.priority >= step.status.priority;
          return (
            <li key={step.key} className="flex items-start gap-3">
              <span
                className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] ${
                  done
                    ? "border-bpPink/60 bg-bpPink/20 text-bpBlack"
                    : "border-black/15 bg-white text-bpGraphite/70"
                }`}
              >
                {index + 1}
              </span>
              <div>
                <p className="text-sm text-bpBlackSoft">{step.status.label}</p>
                <p className="text-xs text-bpGraphite/65">
                  {done ? "Etapa concluida." : "Aguardando atualizacao."}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={`/conta/reclamacoes-suporte?order=${orderId}&seller=${subOrder.seller_id}&reason=nao_chegou`}
          className="rounded-full border border-black/15 px-3 py-2 text-xs uppercase tracking-[0.18em] text-bpGraphite"
        >
          Abrir reclamacao deste lojista
        </Link>
        <Link
          href={`/conta/pedidos/${orderId}`}
          className="rounded-full border border-black/15 px-3 py-2 text-xs uppercase tracking-[0.18em] text-bpGraphite"
        >
          Ver pedido completo
        </Link>
      </div>
    </article>
  );
}

export default function ContaRastreioPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const focusOrder = searchParams.get("order");
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [subOrders, setSubOrders] = useState<SubOrderRow[]>([]);
  const [sellerMap, setSellerMap] = useState<Record<string, string>>({});
  const [trackingBySubOrder, setTrackingBySubOrder] = useState<
    Record<string, CustomerTrackingByOrderDto["sub_orders"][number]>
  >({});

  useEffect(() => {
    if (!user) return;
    let active = true;
    setLoading(true);

    const load = async () => {
      try {
        const ordersList = await getCustomerOrders({ page: 1, page_size: 20 });
        const mapped = mapOrdersListToLegacy(ordersList);

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
  }, [user]);

  const selectedOrder = useMemo(() => {
    if (!orders.length) return null;
    if (focusOrder) {
      const target = orders.find((row) => row.id === focusOrder);
      if (target) return target;
    }
    return orders[0];
  }, [focusOrder, orders]);

  const selectedSubOrders = useMemo(() => {
    if (!selectedOrder) return [];
    return subOrders.filter((row) => row.order_id === selectedOrder.id);
  }, [selectedOrder, subOrders]);

  useEffect(() => {
    if (!selectedOrder) {
      setTrackingBySubOrder({});
      return;
    }
    let active = true;
    const loadTracking = async () => {
      try {
        const payload = await getCustomerTrackingByOrder(selectedOrder.id);
        if (!active) return;
        setTrackingBySubOrder(
          (payload.sub_orders ?? []).reduce<Record<string, CustomerTrackingByOrderDto["sub_orders"][number]>>(
            (acc, row) => {
              acc[row.sub_order_id] = row;
              return acc;
            },
            {}
          )
        );
      } catch {
        if (!active) return;
        setTrackingBySubOrder({});
      }
    };
    void loadTracking();
    return () => {
      active = false;
    };
  }, [selectedOrder]);

  const primaryOrderUi = useMemo(() => {
    if (!selectedOrder) return null;
    const picked = pickPrimaryStatus([
      { status: selectedOrder.status, scope: "order" },
      ...selectedSubOrders.flatMap((row) => {
        const tracking = trackingBySubOrder[row.id];
        const items: Array<{
          status: string | null | undefined;
          scope: "sub_order" | "tracking";
          options?: {
            storeName?: string | null;
            shippingDays?: number | null;
            estimatedDeliveryDate?: string | null;
            createdAt?: string | null;
            lastTrackingAt?: string | null;
          };
        }> = [
          {
            status: row.status,
            scope: "sub_order",
            options: {
              storeName: sellerMap[row.seller_id],
              shippingDays: row.shipping_days,
              estimatedDeliveryDate: row.shipping?.estimated_delivery_date ?? null,
              createdAt: row.created_at ?? selectedOrder.created_at,
              lastTrackingAt: tracking?.last_updated_at ?? null
            }
          }
        ];
        if (tracking?.current_status) {
          items.push({ status: tracking.current_status, scope: "tracking" });
        }
        return items;
      })
    ]);
    const pickedKey = picked ? statusUiKey(picked.status, picked.scope ?? "auto", picked.options) : null;
    return pickedKey ? getUiStatusByKey(pickedKey, UI_STATUS_MAP) : getUiStatusByKey("ORDER_CREATED", UI_STATUS_MAP);
  }, [selectedOrder, selectedSubOrders, sellerMap, trackingBySubOrder]);

  return (
    <div className="space-y-6 pb-8">
      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/60">Rastreio</p>
        <h1 className="mt-3 font-display text-4xl text-bpBlack">Acompanhe cada entrega</h1>
        <p className="mt-3 text-sm text-bpGraphite/75">
          Em marketplace, cada lojista tem envio proprio. Aqui voce acompanha cada subpedido com clareza.
        </p>
      </section>

      {loading ? (
        <div className="rounded-2xl border border-black/10 bg-white p-6 text-sm text-bpGraphite/70">
          Carregando rastreio...
        </div>
      ) : !selectedOrder ? (
        <div className="rounded-2xl border border-black/10 bg-white p-6 text-sm text-bpGraphite/70">
          Voce ainda nao possui pedidos para rastrear.
        </div>
      ) : (
        <>
          <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-bpGraphite/60">Visao geral</p>
                <p className="mt-1 text-lg font-semibold text-bpBlack">Pedido {shortId(selectedOrder.id)}</p>
                <p className="text-xs text-bpGraphite/70">{formatDateTimePtBr(selectedOrder.created_at)}</p>
              </div>
              <StatusBadge status={primaryOrderUi ?? getUiStatusByKey("ORDER_CREATED", UI_STATUS_MAP)} />
            </div>
            <p className="mt-3 text-sm text-bpGraphite/75">{primaryOrderUi?.message}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {orders.slice(0, 8).map((order) => (
                <Link
                  key={order.id}
                  href={`/conta/rastreio?order=${order.id}`}
                  className={`rounded-full border px-3 py-2 text-xs uppercase tracking-[0.18em] ${
                    order.id === selectedOrder.id
                      ? "border-bpPink/50 bg-bpPink/10 text-bpBlack"
                      : "border-black/10 text-bpGraphite/75"
                  }`}
                >
                  {shortId(order.id)}
                </Link>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            {selectedSubOrders.map((subOrder) => (
              <SubOrderTrackingCard
                key={subOrder.id}
                subOrder={subOrder}
                orderId={selectedOrder.id}
                orderCreatedAt={selectedOrder.created_at}
                sellerName={sellerMap[subOrder.seller_id] ?? "Lojista"}
                tracking={trackingBySubOrder[subOrder.id] ?? null}
              />
            ))}
          </section>
        </>
      )}
    </div>
  );
}
