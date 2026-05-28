"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { ReorderButton } from "@/components/customer/ReorderButton";
import CustomerPaymentMethodsPanel from "@/components/customer/CustomerPaymentMethodsPanel";
import { useAuth } from "@/lib/AuthContext";
import { buildLoginHref } from "@/lib/auth/redirects";
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
import {
  createEmptyPopClubAccountSnapshot,
  formatPopClubCredits,
  formatPopClubPoints,
  getPopClubAccountSnapshot,
  getPopClubProgressLabel,
  getPopClubSampleMessage
} from "@/lib/popclub/accountSnapshot";
import { popClubTierMap } from "@/lib/popclub/tiers";

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
  const text = encodeURIComponent("Olá, preciso de apoio com meu pedido na BelaPop.");
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
  const [popClubSummary, setPopClubSummary] = useState(createEmptyPopClubAccountSnapshot);
  const [trackingBySubOrder, setTrackingBySubOrder] = useState<
    Record<string, CustomerTrackingByOrderDto["sub_orders"][number]>
  >({});
  const whatsappHref = useMemo(buildWhatsappHref, []);

  useEffect(() => {
    if (!ready) return;

    if (!user) {
      router.replace(buildLoginHref("/conta"));
      return;
    }

    let active = true;
    setLoading(true);

    const load = async () => {
      try {
        const [ordersList, favorites, tickets, addresses, recommendationsList, notificationsList, loyaltySnapshot] =
          await Promise.all([
            getCustomerOrders({ page: 1, page_size: 30 }),
            getCustomerFavoritesSummary(1, 1),
            getCustomerSupportTickets({ page: 1, page_size: 1 }),
            getCustomerAddresses(),
            getCustomerRecommendations(4),
            getCustomerNotifications(5),
            getPopClubAccountSnapshot(user.id)
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
        setPopClubSummary(loyaltySnapshot);
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
          setPopClubSummary(createEmptyPopClubAccountSnapshot());
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
  const currentPopClubTier = popClubTierMap[popClubSummary.currentTier];

  return (
    <div className="space-y-8 pb-8">
      <section className="relative overflow-hidden rounded-3xl border border-[#e8e0d8] bg-gradient-to-br from-[#1e1e1e] via-[#2a1f1a] to-[#3d2318] p-8 shadow-[0_20px_60px_rgba(30,15,5,0.25)]">
        <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 bg-[radial-gradient(ellipse_at_top_right,_rgba(212,132,95,0.18)_0%,_transparent_65%)]" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-40 w-40 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(213,30,113,0.10)_0%,_transparent_65%)]" />

        <p className="text-[10px] font-medium uppercase tracking-[0.45em] text-[#d4845f]/80">
          Painel Exclusivo
        </p>
        <h1 className="mt-3 font-display text-5xl font-light tracking-wide text-white/95">
          Olá, {(user?.name ?? "Cliente").split(" ")[0]}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/55">
          Seu resumo de compras, entregas por lojista e suporte com protocolo.
        </p>

        {profileIncomplete ? (
          <div className="mt-6 inline-flex items-center gap-3 rounded-2xl border border-[#d4845f]/30 bg-[#d4845f]/10 px-5 py-3">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#d4845f]" />
            <p className="text-xs text-[#d4845f]/90">
              Complete seu perfil para rastreio completo e dados fiscais.{" "}
              <Link href="/conta/dados" className="underline underline-offset-2 hover:text-[#d4845f]">
                Atualizar agora
              </Link>
            </p>
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="group relative overflow-hidden rounded-2xl border border-[#e8e0d8] bg-white p-6 shadow-[0_4px_24px_rgba(30,15,5,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(30,15,5,0.12)]">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#d4845f]/60 to-transparent" />
          <p className="text-[10px] font-medium uppercase tracking-[0.38em] text-[#9b9b96]">Pedidos ativos</p>
          <p className="mt-4 font-display text-5xl font-light text-[#1e1e1e]">{activeOrders.length}</p>
          <Link href="/conta/pedidos" className="mt-4 inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-[#d51e71] transition-all hover:gap-2.5">
            Acompanhar →
          </Link>
        </article>

        <article className="group relative overflow-hidden rounded-2xl border border-[#e8e0d8] bg-white p-6 shadow-[0_4px_24px_rgba(30,15,5,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(30,15,5,0.12)]">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#d4845f]/60 to-transparent" />
          <p className="text-[10px] font-medium uppercase tracking-[0.38em] text-[#9b9b96]">Última compra</p>
          {latestOrder ? (
            <>
              <p className="mt-4 font-display text-xl font-light text-[#1e1e1e]">Pedido {shortId(latestOrder.id)}</p>
              <p className="mt-1 text-sm text-[#4a4a47]/70">{formatMoneyFromCents(latestOrder.total_order_cents)}</p>
              <ReorderButton
                orderId={latestOrder.id}
                label="Comprar de novo →"
                className="mt-4 inline-flex text-xs uppercase tracking-[0.2em] text-[#d51e71]"
              />
            </>
          ) : (
            <p className="mt-4 text-sm text-[#9b9b96]">Sem compras recentes.</p>
          )}
        </article>

        <article className="group relative overflow-hidden rounded-2xl border border-[#e8e0d8] bg-white p-6 shadow-[0_4px_24px_rgba(30,15,5,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(30,15,5,0.12)]">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#d4845f]/60 to-transparent" />
          <p className="text-[10px] font-medium uppercase tracking-[0.38em] text-[#9b9b96]">Entrega mais próxima</p>
          {nearestShipment ? (
            <>
              <p className="mt-4 font-display text-xl font-light text-[#1e1e1e]">
                {sellerMap[nearestShipment.subOrder.seller_id] ?? "Lojista"}
              </p>
              <p className="mt-1 text-sm text-[#4a4a47]/70">{nearestShipment.summary.etaLabel}</p>
              <p className="mt-1 text-xs text-[#9b9b96]">
                {nearestShipment.summary.detailLine} · {nearestShipment.summary.lastUpdatedLabel}
              </p>
              <Link
                href={`/conta/rastreio?order=${nearestShipment.subOrder.order_id}`}
                className="mt-4 inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-[#d51e71] transition-all hover:gap-2.5"
              >
                Ver rastreio →
              </Link>
            </>
          ) : (
            <p className="mt-4 text-sm text-[#9b9b96]">Sem entregas em trânsito.</p>
          )}
        </article>

        <article className="group relative overflow-hidden rounded-2xl border border-[#e8e0d8] bg-white p-6 shadow-[0_4px_24px_rgba(30,15,5,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(30,15,5,0.12)]">
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#d4845f]/60 to-transparent" />
          <p className="text-[10px] font-medium uppercase tracking-[0.38em] text-[#9b9b96]">Suporte</p>
          <p className="mt-4 font-display text-5xl font-light text-[#1e1e1e]">{ticketCount}</p>
          <p className="mt-1 text-sm text-[#4a4a47]/70">Protocolos abertos</p>
          <Link href="/conta/reclamacoes-suporte" className="mt-4 inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-[#d51e71] transition-all hover:gap-2.5">
            Abrir reclamação →
          </Link>
        </article>
      </section>

      <section className="relative overflow-hidden rounded-3xl border border-[#d4845f]/25 bg-gradient-to-br from-[#1e1e1e] to-[#2e1f14] p-8 shadow-[0_20px_60px_rgba(30,15,5,0.20)]">
        <div className="pointer-events-none absolute right-[-20px] top-[-20px] h-56 w-56 rounded-full bg-[#d4845f]/8 blur-3xl" />

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.45em] text-[#d4845f]/70">
              PopClub ✦
            </p>
            <h2 className="mt-2 font-display text-3xl font-light text-white">
              Nível {currentPopClubTier.label}
            </h2>
            <p className="mt-2 max-w-md text-sm text-white/45">
              Pontos, créditos e amostras exclusivas ligados aos seus pedidos.
            </p>
          </div>
          <Link
            href="/popclub/inicio"
            className="rounded-full border border-[#d4845f]/40 bg-[#d4845f]/15 px-5 py-2.5 text-xs uppercase tracking-[0.25em] text-[#d4845f] transition-all hover:bg-[#d4845f]/25"
          >
            Ver clube
          </Link>
        </div>

        <div className="mt-8">
          <div className="mb-2 flex justify-between text-[10px] uppercase tracking-[0.3em] text-white/40">
            <span>{currentPopClubTier.label}</span>
            <span>{getPopClubProgressLabel(popClubSummary)}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/8">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#d51e71] via-[#d4845f] to-[#a85a38] shadow-[0_0_12px_rgba(213,30,113,0.4)]"
              style={{ width: `${Math.max(0, Math.min(popClubSummary.progressBps, 10000)) / 100}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between">
            {["Essencial", "Premium", "Luxo"].map((nivel) => (
              <span key={nivel} className="text-[9px] uppercase tracking-[0.3em] text-white/30">{nivel}</span>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <article className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <p className="text-[10px] uppercase tracking-[0.35em] text-[#d4845f]/70">Pontos ativos</p>
            <p className="mt-3 font-display text-4xl font-light text-white">
              {formatPopClubPoints(popClubSummary.pointsBalance)}
            </p>
            <p className="mt-1 text-xs text-white/35">{getPopClubProgressLabel(popClubSummary)}</p>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <p className="text-[10px] uppercase tracking-[0.35em] text-[#d4845f]/70">Créditos</p>
            <p className="mt-3 font-display text-4xl font-light text-white">
              {formatPopClubCredits(popClubSummary.creditBalanceCents)}
            </p>
            <p className="mt-1 text-xs text-white/35">Saldo do clube</p>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <p className="text-[10px] uppercase tracking-[0.35em] text-[#d4845f]/70">Amostras premium</p>
            <p className="mt-3 font-display text-4xl font-light text-white">
              {popClubSummary.latestSampleSlots > 0 ? popClubSummary.latestSampleSlots : <span className="text-white/40">—</span>}
            </p>
            <p className="mt-1 text-xs text-white/35">{getPopClubSampleMessage(popClubSummary)}</p>
          </article>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Link
          href="/conta/rastreio"
          className="group flex flex-col gap-3 rounded-2xl border border-[#e8e0d8] bg-white p-5 shadow-[0_2px_16px_rgba(30,15,5,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#d4845f]/40 hover:shadow-[0_6px_24px_rgba(30,15,5,0.10)]"
        >
          <span className="text-lg text-[#d4845f] transition-transform group-hover:scale-110">📦</span>
          <div>
            <p className="text-sm font-medium text-[#1e1e1e]">Rastrear pedido</p>
            <p className="text-xs text-[#9b9b96]">Ver entregas</p>
          </div>
        </Link>
        <Link
          href="/conta/reclamacoes-suporte"
          className="group flex flex-col gap-3 rounded-2xl border border-[#e8e0d8] bg-white p-5 shadow-[0_2px_16px_rgba(30,15,5,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#d4845f]/40 hover:shadow-[0_6px_24px_rgba(30,15,5,0.10)]"
        >
          <span className="text-lg text-[#d4845f] transition-transform group-hover:scale-110">💬</span>
          <div>
            <p className="text-sm font-medium text-[#1e1e1e]">Abrir suporte</p>
            <p className="text-xs text-[#9b9b96]">Protocolo rápido</p>
          </div>
        </Link>
        {whatsappHref ? (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="group flex flex-col gap-3 rounded-2xl border border-[#e8e0d8] bg-white p-5 shadow-[0_2px_16px_rgba(30,15,5,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#d4845f]/40 hover:shadow-[0_6px_24px_rgba(30,15,5,0.10)]"
          >
            <span className="text-lg text-[#d4845f] transition-transform group-hover:scale-110">✦</span>
            <div>
              <p className="text-sm font-medium text-[#1e1e1e]">WhatsApp</p>
              <p className="text-xs text-[#9b9b96]">Concierge exclusivo</p>
            </div>
          </a>
        ) : (
          <div className="flex flex-col gap-3 rounded-2xl border border-[#e8e0d8] bg-white p-5 opacity-50 shadow-[0_2px_16px_rgba(30,15,5,0.05)]">
            <span className="text-lg text-[#9b9b96]">✦</span>
            <div>
              <p className="text-sm font-medium text-[#1e1e1e]">WhatsApp</p>
              <p className="text-xs text-[#9b9b96]">Em atualização</p>
            </div>
          </div>
        )}
        <Link
          href="/catalogo"
          className="group flex flex-col gap-3 rounded-2xl border border-[#e8e0d8] bg-white p-5 shadow-[0_2px_16px_rgba(30,15,5,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#d4845f]/40 hover:shadow-[0_6px_24px_rgba(30,15,5,0.10)]"
        >
          <span className="text-lg text-[#d4845f] transition-transform group-hover:scale-110">◈</span>
          <div>
            <p className="text-sm font-medium text-[#1e1e1e]">Comprar agora</p>
            <p className="text-xs text-[#9b9b96]">Curadoria do mês</p>
          </div>
        </Link>
      </section>

      <section className="relative overflow-hidden rounded-3xl border border-[#e8e0d8] bg-gradient-to-br from-[#fdf4f1] via-white to-[#faf8f5] p-8">
        <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 bg-[radial-gradient(ellipse,_rgba(213,30,113,0.06)_0%,_transparent_70%)]" />
        <p className="text-[10px] font-medium uppercase tracking-[0.45em] text-[#d51e71]/60">
          Skin Intelligence ✦
        </p>
        <p className="mt-2 text-xl font-semibold text-[#1e1e1e]">Monte sua rotina completa</p>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#4a4a47]/70">
          Responda o quiz de pele, receba uma rotina personalizada por etapa e gere um carrinho pronto para recompra.
        </p>
        <Link
          href="/conta/skincare"
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#1e1e1e] px-6 py-3 text-xs uppercase tracking-[0.25em] text-white shadow-[0_4px_16px_rgba(30,15,5,0.20)] transition-all hover:bg-[#2e1f14] hover:shadow-[0_6px_24px_rgba(30,15,5,0.30)]"
        >
          Iniciar rotina →
        </Link>
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
            <p className="mt-6 text-sm text-bpGraphite/70">Você ainda não tem pedidos.</p>
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

          <p className="mt-5 text-xs uppercase tracking-[0.3em] text-bpGraphite/60">Sugestões para você</p>
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
