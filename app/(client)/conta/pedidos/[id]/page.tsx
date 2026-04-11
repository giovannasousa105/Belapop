"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

import { OrderTimeline } from "@/components/OrderTimeline";
import { ReorderButton } from "@/components/customer/ReorderButton";
import { StatusBadge } from "@/components/customer/StatusBadge";
import { useAuth } from "@/lib/AuthContext";
import {
  type OrderRow,
  type SubOrderRow,
  formatDateTimePtBr,
  formatMoneyFromCents,
  getPrimarySubOrderUiStatus,
  getUiStatusByKey,
  pickPrimaryStatus,
  resolveSubOrderUiStatus,
  shortId,
  statusUiKey,
  UI_STATUS_MAP,
  statusLabel,
  statusMessage
} from "@/lib/customer/portal";
import type { CustomerTrackingByOrderDto } from "@/lib/customer/dto";
import { buildSubOrderTrackingSummary } from "@/lib/customer/trackingSummary";
import {
  getCustomerOrder,
  getCustomerOrderStatusHistory,
  getCustomerOrderSubOrders,
  getCustomerTrackingByOrder,
  mapDetailedSubOrderToLegacy,
  mapOrderDtoToLegacyRow
} from "@/lib/customer/api";

type HistoryRow = {
  id: string;
  status: string;
  created_at: string;
};

type OrderAddress = {
  street?: string;
  number?: string;
  city?: string;
  state?: string;
  zip?: string;
};

type OrderWithExtras = OrderRow & {
  payment_status?: string | null;
  address?: OrderAddress | null;
};

const toOrderNumber = (orderId: string, createdAt: string) => {
  const year = new Date(createdAt).getFullYear();
  const suffix = orderId.replace(/-/g, "").slice(0, 6).toUpperCase();
  return `BP-${year}-${suffix}`;
};

type SubOrderStatusInfoProps = {
  subOrder: SubOrderRow;
  orderId: string;
  orderCreatedAt: string;
  tracking: CustomerTrackingByOrderDto["sub_orders"][number] | null;
};

function SubOrderStatusInfo({
  subOrder,
  orderId,
  orderCreatedAt,
  tracking
}: SubOrderStatusInfoProps) {
  const orderNumber = useMemo(() => toOrderNumber(orderId, orderCreatedAt), [orderId, orderCreatedAt]);
  const status = useMemo(
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
    [orderId, orderNumber, subOrder.id, subOrder.shipping?.estimated_delivery_date, subOrder.status, tracking]
  );

  return <StatusBadge status={status} />;
}

export default function ContaPedidoDetalhePage() {
  const params = useParams();
  const orderId = String(params?.id ?? "");
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderWithExtras | null>(null);
  const [subOrders, setSubOrders] = useState<SubOrderRow[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [sellerMap, setSellerMap] = useState<Record<string, string>>({});
  const [productMap, setProductMap] = useState<Record<string, string>>({});
  const [trackingBySubOrder, setTrackingBySubOrder] = useState<
    Record<string, CustomerTrackingByOrderDto["sub_orders"][number]>
  >({});

  useEffect(() => {
    if (!orderId || !user) return;

    let active = true;
    setLoading(true);

    const load = async () => {
      try {
        const [orderPayload, subOrdersPayload, statusHistoryPayload, trackingPayload] = await Promise.all([
          getCustomerOrder(orderId),
          getCustomerOrderSubOrders(orderId),
          getCustomerOrderStatusHistory(orderId),
          getCustomerTrackingByOrder(orderId)
        ]);

        const mappedOrder = mapOrderDtoToLegacyRow(orderPayload) as OrderWithExtras;
        const mappedSubOrders = subOrdersPayload.items.map(mapDetailedSubOrderToLegacy);
        const mappedSellerMap = subOrdersPayload.items.reduce<Record<string, string>>((acc, subOrder) => {
          acc[subOrder.seller.seller_id] = subOrder.seller.seller_name;
          return acc;
        }, {});
        const mappedProductMap = subOrdersPayload.items.reduce<Record<string, string>>((acc, subOrder) => {
          for (const item of subOrder.items) {
            acc[item.product_id] = item.product_name;
          }
          return acc;
        }, {});

        if (!active) return;
        setOrder(mappedOrder);
        setSubOrders(mappedSubOrders);
        setHistory(statusHistoryPayload.history ?? []);
        setTrackingBySubOrder(
          (trackingPayload?.sub_orders ?? []).reduce<
            Record<string, CustomerTrackingByOrderDto["sub_orders"][number]>
          >((acc, row) => {
            acc[row.sub_order_id] = row;
            return acc;
          }, {})
        );
        setSellerMap(mappedSellerMap);
        setProductMap(mappedProductMap);
      } catch {
        if (active) {
          setOrder(null);
          setSubOrders([]);
          setHistory([]);
          setTrackingBySubOrder({});
          setSellerMap({});
          setProductMap({});
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [orderId, user]);

  const orderItems = useMemo(
    () =>
      subOrders.flatMap((subOrder) =>
        (Array.isArray(subOrder.items) ? subOrder.items : []).map((item, index) => ({
          key: `${subOrder.id}-${item.productId ?? "item"}-${index}`,
          productId: item.productId ?? "",
          quantity: item.quantity ?? 1,
          sellerId: subOrder.seller_id,
          subOrderId: subOrder.id
        }))
      ),
    [subOrders]
  );

  const primaryOrderUi = useMemo(() => {
    if (!order) return null;
    const picked = pickPrimaryStatus([
      { status: order.status, scope: "order" },
      ...subOrders.flatMap((row) => {
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
              createdAt: row.created_at ?? order.created_at,
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
  }, [order, sellerMap, subOrders, trackingBySubOrder]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-black/10 bg-white p-6 text-sm text-bpGraphite/70">
        Carregando detalhes do pedido...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="rounded-2xl border border-black/10 bg-white p-6 text-sm text-bpGraphite/70">
        Pedido nao encontrado.
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/60">Detalhe do pedido</p>
            <h1 className="mt-3 font-display text-4xl text-bpBlack">Pedido {shortId(order.id)}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <StatusBadge status={primaryOrderUi ?? getUiStatusByKey("ORDER_CREATED", UI_STATUS_MAP)} />
              <span className="text-sm text-bpGraphite/75">{formatDateTimePtBr(order.created_at)}</span>
              <span className="text-sm font-semibold text-bpBlack">{formatMoneyFromCents(order.total_order_cents)}</span>
            </div>
          </div>
          <ReorderButton
            orderId={order.id}
            label="Comprar pedido novamente"
            className="rounded-full border border-bpPink/40 bg-bpPink/10 px-4 py-2 text-xs uppercase tracking-[0.18em] text-bpBlack transition hover:border-bpPink/70 hover:bg-bpPink/20"
          />
        </div>
        <p className="mt-3 text-sm text-bpGraphite/75">{primaryOrderUi?.message ?? statusMessage(order.status, "order")}</p>
      </section>

      <OrderTimeline history={history} currentStatus={order.status ?? undefined} />

      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-bpBlack">Subpedidos por lojista</p>
          <Link href="/conta/rastreio" className="text-sm text-bpPink">
            Ver rastreio completo
          </Link>
        </div>

        <div className="mt-4 space-y-4">
          {subOrders.map((subOrder) => {
            const trackingSummary = buildSubOrderTrackingSummary({
              subOrder,
              tracking: trackingBySubOrder[subOrder.id] ?? null,
              sellerName: sellerMap[subOrder.seller_id],
              fallbackCreatedAt: order.created_at
            });

            return (
              <article key={subOrder.id} className="rounded-2xl border border-black/10 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-bpBlackSoft">
                  {sellerMap[subOrder.seller_id] ?? "Lojista"}
                </p>
                <SubOrderStatusInfo
                  subOrder={subOrder}
                  orderId={order.id}
                  orderCreatedAt={order.created_at}
                  tracking={trackingBySubOrder[subOrder.id] ?? null}
                />
              </div>

              <p className="mt-2 text-sm text-bpGraphite/75">
                {statusMessage(subOrder.status, "sub_order", {
                  storeName: sellerMap[subOrder.seller_id],
                  shippingDays: subOrder.shipping_days,
                  estimatedDeliveryDate: subOrder.shipping?.estimated_delivery_date ?? null,
                  createdAt: subOrder.created_at ?? order.created_at
                })}
              </p>

              <div className="mt-2 space-y-1 text-sm text-bpGraphite/75">
                <p>Rastreamento: {trackingSummary.detailLine}</p>
                <p>Previsao: {trackingSummary.etaLabel}</p>
                <p>
                  Envio: {formatMoneyFromCents(subOrder.shipping_total_cents)} - {trackingSummary.carrierLine}
                </p>
                <p className="text-xs text-bpGraphite/65">Ultima atualizacao: {trackingSummary.lastUpdatedLabel}</p>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href={`/conta/rastreio?order=${order.id}`}
                  className="rounded-full border border-black/15 px-3 py-2 text-xs uppercase tracking-[0.18em] text-bpGraphite"
                >
                  Rastrear
                </Link>
                <Link
                  href={`/conta/reclamacoes-suporte?order=${order.id}&seller=${subOrder.seller_id}&reason=atendimento`}
                  className="rounded-full border border-black/15 px-3 py-2 text-xs uppercase tracking-[0.18em] text-bpGraphite"
                >
                  Falar com loja
                </Link>
                <Link
                  href={`/conta/reclamacoes-suporte?order=${order.id}&seller=${subOrder.seller_id}&reason=nao_chegou`}
                  className="rounded-full border border-black/15 px-3 py-2 text-xs uppercase tracking-[0.18em] text-bpGraphite"
                >
                  Abrir reclamacao
                </Link>
                <Link
                  href={`/conta/trocas-e-devolucoes?order=${order.id}&seller=${subOrder.seller_id}`}
                  className="rounded-full border border-black/15 px-3 py-2 text-xs uppercase tracking-[0.18em] text-bpGraphite"
                >
                  Troca ou devolucao
                </Link>
                <ReorderButton
                  orderId={order.id}
                  subOrderId={subOrder.id}
                  label="Comprar itens desta loja"
                  className="rounded-full border border-bpPink/40 bg-bpPink/10 px-3 py-2 text-xs uppercase tracking-[0.18em] text-bpBlack transition hover:border-bpPink/70 hover:bg-bpPink/20"
                />
              </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-bpBlack">Resumo do pedido</p>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-black/10 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-bpGraphite/60">Pagamento</p>
            <p className="mt-2 text-sm text-bpGraphite/80">
              Metodo: {order.payment_provider || "Nao informado"}
            </p>
            <p className="text-sm text-bpGraphite/80">
              Status: {order.payment_status || statusLabel(order.status, "order")}
            </p>
          </div>

          <div className="rounded-2xl border border-black/10 p-4 md:col-span-2">
            <p className="text-xs uppercase tracking-[0.2em] text-bpGraphite/60">Endereco</p>
            {order.address ? (
              <p className="mt-2 text-sm text-bpGraphite/80">
                {order.address.street || ""}, {order.address.number || ""} - {order.address.city || ""}/
                {order.address.state || ""} - CEP {order.address.zip || ""}
              </p>
            ) : (
              <p className="mt-2 text-sm text-bpGraphite/70">Endereco em atualizacao.</p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-bpBlack">Itens</p>
        <div className="mt-4 space-y-3">
          {orderItems.length ? (
            orderItems.map((item) => (
              <article
                key={item.key}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/10 p-4"
              >
                <div>
                  <p className="text-sm font-semibold text-bpBlackSoft">
                    {productMap[item.productId] ?? "Produto"}
                  </p>
                  <p className="text-xs text-bpGraphite/70">
                    {sellerMap[item.sellerId] ?? "Lojista"} - {item.quantity} unidade(s)
                  </p>
                </div>
                <Link
                  href={`/conta/reclamacoes-suporte?order=${order.id}&seller=${item.sellerId}&reason=produto`}
                  className="rounded-full border border-black/15 px-3 py-2 text-xs uppercase tracking-[0.18em] text-bpGraphite"
                >
                  Suporte do item
                </Link>
                {item.productId ? (
                  <ReorderButton
                    orderId={order.id}
                    subOrderId={item.subOrderId}
                    productId={item.productId}
                    label="Comprar novamente"
                    className="rounded-full border border-bpPink/40 bg-bpPink/10 px-3 py-2 text-xs uppercase tracking-[0.18em] text-bpBlack transition hover:border-bpPink/70 hover:bg-bpPink/20"
                  />
                ) : null}
              </article>
            ))
          ) : (
            <p className="text-sm text-bpGraphite/70">Itens em atualizacao.</p>
          )}
        </div>
      </section>
    </div>
  );
}
