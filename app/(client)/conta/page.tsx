"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { ReorderButton } from "@/components/customer/ReorderButton";
import CustomerPaymentMethodsPanel from "@/components/customer/CustomerPaymentMethodsPanel";
import { useAuth } from "@/lib/AuthContext";
import {
  type OrderRow,
  type SubOrderRow,
  formatDateTimePtBr,
  formatMoneyFromCents,
  isClosedOrderStatus,
  shortId,
  statusClassName,
  statusLabel,
  statusMessage
} from "@/lib/customer/portal";
import {
  getCustomerAddresses,
  getCustomerFavoritesSummary,
  getCustomerNotifications,
  getCustomerTrackingByOrder,
  getCustomerOrders,
  getCustomerRecommendations,
  getCustomerSupportTickets,
  mapOrdersListToLegacy
} from "@/lib/customer/api";
import type { CustomerTrackingByOrderDto } from "@/lib/customer/dto";
import { buildSubOrderTrackingSummary } from "@/lib/customer/trackingSummary";

type ProductRecommendation = {
  id: string;
  name: string;
  price_cents: number | null;
};

type NotificationRow = {
  id: string;
  title: string;
  body: string;
  type: string;
  created_at: string;
};

const buildWhatsappHref = () => {
  const raw = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";
  const phone = raw.replace(/\D/g, "");
  if (!phone) return null;
  const text = encodeURIComponent("Ola, preciso de apoio com meu pedido na BelaPop.");
  return `https://wa.me/${phone}?text=${text}`;
};

export default function ContaPage() {
  const { ready, user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [subOrders, setSubOrders] = useState<SubOrderRow[]>([]);
  const [sellerMap, setSellerMap] = useState<Record<string, string>>({});
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [ticketCount, setTicketCount] = useState(0);
  const [addressCount, setAddressCount] = useState(0);
  const [recommendations, setRecommendations] = useState<ProductRecommendation[]>([]);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [trackingBySubOrder, setTrackingBySubOrder] = useState<
    Record<string, CustomerTrackingByOrderDto["sub_orders"][number]>
  >({});
  const whatsappHref = useMemo(buildWhatsappHref, []);

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
        const [ordersList, favorites, tickets, addresses, recommendationsList, notificationsList] =
          await Promise.all([
            getCustomerOrders({ page: 1, page_size: 30 }),
            getCustomerFavoritesSummary(1, 1),
            getCustomerSupportTickets({ page: 1, page_size: 1 }),
            getCustomerAddresses(),
            getCustomerRecommendations(4),
            getCustomerNotifications(5)
          ]);

        const mapped = mapOrdersListToLegacy(ordersList);
        const activeOrderIds = (mapped.orders as OrderRow[])
          .filter((order) => !isClosedOrderStatus(order.status))
          .slice(0, 8)
          .map((order) => order.id);
        const trackingMap = activeOrderIds.length
          ? (
              await Promise.allSettled(
                activeOrderIds.map(async (id) => {
                  const payload = await getCustomerTrackingByOrder(id);
                  return payload.sub_orders ?? [];
                })
              )
            ).reduce<Record<string, CustomerTrackingByOrderDto["sub_orders"][number]>>(
              (acc, result) => {
                if (result.status !== "fulfilled") return acc;
                for (const row of result.value) {
                  acc[row.sub_order_id] = row;
                }
                return acc;
              },
              {}
            )
          : {};

        if (!active) return;
        setOrders(mapped.orders as OrderRow[]);
        setSubOrders(mapped.subOrders as SubOrderRow[]);
        setSellerMap(mapped.sellerMap);
        setFavoritesCount(favorites.total ?? 0);
        setTicketCount(tickets.total ?? 0);
        setAddressCount(addresses.items.length);
        setRecommendations(
          recommendationsList.items.map((row) => ({
            id: row.id,
            name: row.name,
            price_cents: row.price_cents
          }))
        );
        setTrackingBySubOrder(trackingMap);
        setNotifications(
          notificationsList.items.map((row) => ({
            id: row.id,
            title: row.title,
            body: row.body,
            type: row.type ?? "",
            created_at: row.created_at
          }))
        );
      } catch {
        if (active) {
          setOrders([]);
          setSubOrders([]);
          setSellerMap({});
          setFavoritesCount(0);
          setTicketCount(0);
          setAddressCount(0);
          setRecommendations([]);
          setNotifications([]);
          setTrackingBySubOrder({});
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

  const activeOrders = useMemo(
    () => orders.filter((order) => !isClosedOrderStatus(order.status)),
    [orders]
  );

  const latestOrder = useMemo(() => orders[0] ?? null, [orders]);

  const nearestShipment = useMemo(() => {
    if (!activeOrders.length) return null;
    const activeOrderIds = new Set(activeOrders.map((order) => order.id));
    const candidates = subOrders
      .filter((subOrder) => activeOrderIds.has(subOrder.order_id))
      .map((subOrder) => ({
        subOrder,
        summary: buildSubOrderTrackingSummary({
          subOrder,
          tracking: trackingBySubOrder[subOrder.id] ?? null,
          sellerName: sellerMap[subOrder.seller_id],
          fallbackCreatedAt:
            activeOrders.find((order) => order.id === subOrder.order_id)?.created_at ?? subOrder.created_at ?? null
        })
      }))
      .filter(({ summary }) => summary.currentLabel !== "Entregue")
      .sort((left, right) => {
        if (left.summary.statusRank !== right.summary.statusRank) {
          return left.summary.statusRank - right.summary.statusRank;
        }
        if (left.summary.etaSortValue !== right.summary.etaSortValue) {
          return left.summary.etaSortValue - right.summary.etaSortValue;
        }
        return (left.subOrder.created_at ?? "").localeCompare(right.subOrder.created_at ?? "");
      });
    return candidates[0] ?? null;
  }, [activeOrders, sellerMap, subOrders, trackingBySubOrder]);

  const profileIncomplete = addressCount === 0 || !(user?.name ?? "").trim();

  return (
    <div className="space-y-8 pb-8">
      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.32em] text-bpGraphite/60">Painel do cliente</p>
        <h1 className="mt-3 font-display text-4xl text-bpBlack">
          Ola, {(user?.name ?? "Cliente").split(" ")[0]}
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-bpGraphite/75">
          Seu resumo de compras, entregas por lojista e suporte com protocolo.
        </p>

        {profileIncomplete ? (
          <div className="mt-5 rounded-2xl border border-bpPink/30 bg-bpPink/10 p-4 text-sm text-bpBlackSoft">
            Complete seu perfil para liberar rastreio completo e dados fiscais sem friccao.
            <Link href="/conta/dados" className="ml-2 font-medium text-bpPink">
              Atualizar agora
            </Link>
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.26em] text-bpGraphite/60">Pedidos ativos</p>
          <p className="mt-3 text-3xl font-semibold text-bpBlack">{activeOrders.length}</p>
          <Link href="/conta/pedidos" className="mt-4 inline-flex text-sm text-bpPink">
            Acompanhar pedidos
          </Link>
        </article>

        <article className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.26em] text-bpGraphite/60">Ultima compra</p>
          {latestOrder ? (
            <>
              <p className="mt-3 text-lg font-semibold text-bpBlack">Pedido {shortId(latestOrder.id)}</p>
              <p className="mt-1 text-sm text-bpGraphite/75">{formatMoneyFromCents(latestOrder.total_order_cents)}</p>
              <ReorderButton
                orderId={latestOrder.id}
                label="Comprar de novo"
                className="mt-4 inline-flex text-sm text-bpPink"
              />
            </>
          ) : (
            <p className="mt-3 text-sm text-bpGraphite/70">Sem compras recentes.</p>
          )}
        </article>

        <article className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.26em] text-bpGraphite/60">Entrega mais proxima</p>
          {nearestShipment ? (
            <>
              <p className="mt-3 text-lg font-semibold text-bpBlack">
                {sellerMap[nearestShipment.subOrder.seller_id] ?? "Lojista"}
              </p>
              <p className="mt-1 text-sm text-bpGraphite/75">{nearestShipment.summary.etaLabel}</p>
              <p className="mt-1 text-xs text-bpGraphite/65">
                {nearestShipment.summary.detailLine} - {nearestShipment.summary.lastUpdatedLabel}
              </p>
              <Link
                href={`/conta/rastreio?order=${nearestShipment.subOrder.order_id}`}
                className="mt-4 inline-flex text-sm text-bpPink"
              >
                Ver rastreio
              </Link>
            </>
          ) : (
            <p className="mt-3 text-sm text-bpGraphite/70">Sem entregas em transito.</p>
          )}
        </article>

        <article className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.26em] text-bpGraphite/60">Suporte</p>
          <p className="mt-3 text-3xl font-semibold text-bpBlack">{ticketCount}</p>
          <p className="mt-1 text-sm text-bpGraphite/75">Protocolos abertos</p>
          <Link href="/conta/reclamacoes-suporte" className="mt-4 inline-flex text-sm text-bpPink">
            Abrir reclamacao
          </Link>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Link
          href="/conta/rastreio"
          className="rounded-2xl border border-black/10 bg-white px-5 py-4 text-sm font-medium text-bpBlackSoft shadow-sm transition hover:border-bpPink/40"
        >
          Rastrear pedido
        </Link>
        <Link
          href="/conta/reclamacoes-suporte"
          className="rounded-2xl border border-black/10 bg-white px-5 py-4 text-sm font-medium text-bpBlackSoft shadow-sm transition hover:border-bpPink/40"
        >
          Abrir reclamacao
        </Link>
        {whatsappHref ? (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl border border-black/10 bg-white px-5 py-4 text-sm font-medium text-bpBlackSoft shadow-sm transition hover:border-bpPink/40"
          >
            Falar no WhatsApp
          </a>
        ) : (
          <div className="rounded-2xl border border-black/10 bg-white px-5 py-4 text-sm text-bpGraphite/70 shadow-sm">
            WhatsApp em atualizacao
          </div>
        )}
        <Link
          href="/catalogo"
          className="rounded-2xl border border-black/10 bg-white px-5 py-4 text-sm font-medium text-bpBlackSoft shadow-sm transition hover:border-bpPink/40"
        >
          Comprar agora
        </Link>
      </section>

      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/60">Skincare builder</p>
            <p className="mt-2 text-xl font-semibold text-bpBlack">Monte sua rotina completa</p>
            <p className="mt-2 max-w-2xl text-sm text-bpGraphite/75">
              Responda o quiz de pele, receba uma rotina por etapa e gere um carrinho pronto
              para recompra recorrente.
            </p>
          </div>
          <Link
            href="/conta/skincare"
            className="rounded-full border border-bpPink/40 bg-bpPink/10 px-5 py-3 text-xs uppercase tracking-[0.2em] text-bpBlack transition hover:border-bpPink/70 hover:bg-bpPink/20"
          >
            Abrir rotina
          </Link>
        </div>
      </section>

      <CustomerPaymentMethodsPanel compact />

      <section className="grid gap-5 xl:grid-cols-[1.15fr_1fr]">
        <article className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/60">Pedidos recentes</p>
              <p className="mt-2 text-xl font-semibold text-bpBlack">Por pedido e por lojista</p>
            </div>
            <Link href="/conta/pedidos" className="text-sm text-bpPink">
              Ver tudo
            </Link>
          </div>

          {loading ? (
            <p className="mt-6 text-sm text-bpGraphite/70">Carregando pedidos...</p>
          ) : orders.length === 0 ? (
            <p className="mt-6 text-sm text-bpGraphite/70">Voce ainda nao tem pedidos.</p>
          ) : (
            <div className="mt-5 space-y-3">
              {orders.slice(0, 5).map((order) => {
                const orderSubOrders = subOrders.filter((row) => row.order_id === order.id);
                return (
                  <Link
                    key={order.id}
                    href={`/conta/pedidos/${order.id}`}
                    className="block rounded-2xl border border-black/10 p-4 transition hover:border-bpPink/30 hover:bg-bpOffWhite/60"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-bpBlackSoft">Pedido {shortId(order.id)}</p>
                        <p className="text-xs text-bpGraphite/70">{formatDateTimePtBr(order.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-bpBlack">{formatMoneyFromCents(order.total_order_cents)}</p>
                        <span
                          className={`mt-1 inline-flex rounded-full border px-2 py-1 text-[11px] uppercase tracking-[0.16em] ${statusClassName(
                            order.status,
                            "order"
                          )}`}
                        >
                          {statusLabel(order.status, "order")}
                        </span>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-bpGraphite/75">{statusMessage(order.status, "order")}</p>

                    {orderSubOrders.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {orderSubOrders.map((subOrder) => (
                          <span
                            key={subOrder.id}
                            className="rounded-full border border-black/10 bg-white px-3 py-1 text-[11px] text-bpGraphite/80"
                          >
                            {sellerMap[subOrder.seller_id] ?? "Lojista"} -{" "}
                            {
                              buildSubOrderTrackingSummary({
                                subOrder,
                                tracking: trackingBySubOrder[subOrder.id] ?? null,
                                sellerName: sellerMap[subOrder.seller_id],
                                fallbackCreatedAt: order.created_at
                              }).currentLabel
                            }
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          )}
        </article>

        <article className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="rounded-2xl border border-black/10 bg-bpOffWhite/70 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.2em] text-bpGraphite/60">Mensagens recentes</p>
              <Link href="/conta/mensagens" className="text-xs uppercase tracking-[0.2em] text-bpPink">
                Ver mensagens
              </Link>
            </div>
            {notifications.length ? (
              <div className="mt-3 space-y-2">
                {notifications.slice(0, 3).map((notification) => (
                  <div key={notification.id} className="rounded-xl border border-black/10 bg-white p-3">
                    <p className="text-sm font-medium text-bpBlackSoft">{notification.title}</p>
                    <p className="mt-1 text-xs text-bpGraphite/70">{formatDateTimePtBr(notification.created_at)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-bpGraphite/70">Sem atualizacoes recentes.</p>
            )}
          </div>

          <p className="mt-5 text-xs uppercase tracking-[0.3em] text-bpGraphite/60">Sugestoes para voce</p>
          <p className="mt-2 text-xl font-semibold text-bpBlack">Curadoria editorial</p>
          <div className="mt-4 space-y-3">
            {recommendations.length ? (
              recommendations.map((product) => (
                <div key={product.id} className="rounded-2xl border border-black/10 p-4">
                  <p className="text-sm font-semibold text-bpBlackSoft">{product.name}</p>
                  <p className="mt-1 text-sm text-bpGraphite/75">{formatMoneyFromCents(product.price_cents)}</p>
                  <Link href="/catalogo" className="mt-3 inline-flex text-xs uppercase tracking-[0.2em] text-bpPink">
                    Ver no catalogo
                  </Link>
                </div>
              ))
            ) : (
              <p className="text-sm text-bpGraphite/70">Sem recomendacoes no momento.</p>
            )}
          </div>

          <div className="mt-5 rounded-2xl border border-black/10 bg-bpOffWhite/70 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-bpGraphite/60">Favoritos</p>
            <p className="mt-2 text-2xl font-semibold text-bpBlack">{favoritesCount}</p>
            <Link href="/conta/favoritos" className="mt-2 inline-flex text-sm text-bpPink">
              Ver lista salva
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}
