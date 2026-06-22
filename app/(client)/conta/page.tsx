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
      <section className="relative overflow-hidden border-b border-[rgba(201,169,110,0.30)] bg-[linear-gradient(135deg,#080808_0%,#160e1a_45%,#090909_100%)] px-8 py-14 sm:px-12">
        <div className="pointer-events-none absolute right-[-80px] top-[-80px] h-[300px] w-[300px] rounded-full bg-[radial-gradient(ellipse,rgba(201,169,110,0.10)_0%,transparent_70%)]" />
        <div className="pointer-events-none absolute bottom-[-60px] left-[-60px] h-[250px] w-[250px] rounded-full bg-[radial-gradient(ellipse,rgba(124,92,158,0.12)_0%,transparent_70%)]" />

        <p className="text-[9px] font-semibold uppercase tracking-[0.45em] text-[#c9a96e]">
          ✦ Painel Exclusivo
        </p>
        <h1 className="mt-4 font-display text-[clamp(2.5rem,5vw,4rem)] font-light leading-none tracking-[-0.01em] text-white">
          Olá, {(user?.name ?? "Cliente").split(" ")[0]}
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/45">
          Seu resumo de compras, entregas por lojista e suporte com protocolo.
        </p>

        {profileIncomplete ? (
          <div className="mt-6 inline-flex items-center gap-3 border border-[rgba(201,169,110,0.25)] bg-[rgba(201,169,110,0.08)] px-5 py-3">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#c9a96e]" />
            <p className="text-xs text-[#c9a96e]/90">
              Complete seu perfil para rastreio completo e dados fiscais.{" "}
              <Link href="/conta/dados" className="underline underline-offset-2 hover:text-[#c9a96e]">
                Atualizar agora
              </Link>
            </p>
          </div>
        ) : null}
      </section>

      <section className="grid grid-cols-2 gap-px bg-[#e2dbd4] border border-[#e2dbd4] lg:grid-cols-4">
        <article className="relative bg-white p-7 transition-colors duration-300 hover:bg-[#faf8f5] hover:z-10 hover:ring-1 hover:ring-[#c9a96e]">
          <p className="text-[10px] font-medium uppercase tracking-[0.38em] text-[#9a9290]">Pedidos ativos</p>
          <p className="mt-5 font-display text-5xl font-light text-[#080808]">{activeOrders.length}</p>
          <Link href="/conta/pedidos" className="mt-5 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-[#c9a96e] transition-all hover:gap-2.5">
            Acompanhar →
          </Link>
        </article>

        <article className="relative bg-white p-7 transition-colors duration-300 hover:bg-[#faf8f5] hover:z-10 hover:ring-1 hover:ring-[#c9a96e]">
          <p className="text-[10px] font-medium uppercase tracking-[0.38em] text-[#9a9290]">Última compra</p>
          {latestOrder ? (
            <>
              <p className="mt-5 font-display text-xl font-light text-[#080808]">Pedido {shortId(latestOrder.id)}</p>
              <p className="mt-1 text-sm text-[#5f5a55]">{formatMoneyFromCents(latestOrder.total_order_cents)}</p>
              <ReorderButton
                orderId={latestOrder.id}
                label="Comprar de novo →"
                className="mt-5 inline-flex text-[10px] uppercase tracking-[0.2em] text-[#c9a96e]"
              />
            </>
          ) : (
            <p className="mt-5 text-sm text-[#9a9290]">Sem compras recentes.</p>
          )}
        </article>

        <article className="relative bg-white p-7 transition-colors duration-300 hover:bg-[#faf8f5] hover:z-10 hover:ring-1 hover:ring-[#c9a96e]">
          <p className="text-[10px] font-medium uppercase tracking-[0.38em] text-[#9a9290]">Entrega mais próxima</p>
          {nearestShipment ? (
            <>
              <p className="mt-5 font-display text-xl font-light text-[#080808]">
                {sellerMap[nearestShipment.subOrder.seller_id] ?? "Lojista"}
              </p>
              <p className="mt-1 text-sm text-[#5f5a55]">{nearestShipment.summary.etaLabel}</p>
              <p className="mt-1 text-xs text-[#9a9290]">
                {nearestShipment.summary.detailLine} · {nearestShipment.summary.lastUpdatedLabel}
              </p>
              <Link
                href={`/conta/rastreio?order=${nearestShipment.subOrder.order_id}`}
                className="mt-5 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-[#c9a96e] transition-all hover:gap-2.5"
              >
                Ver rastreio →
              </Link>
            </>
          ) : (
            <p className="mt-5 text-sm text-[#9a9290]">Sem entregas em trânsito.</p>
          )}
        </article>

        <article className="relative bg-white p-7 transition-colors duration-300 hover:bg-[#faf8f5] hover:z-10 hover:ring-1 hover:ring-[#c9a96e]">
          <p className="text-[10px] font-medium uppercase tracking-[0.38em] text-[#9a9290]">Suporte</p>
          <p className="mt-5 font-display text-5xl font-light text-[#080808]">{ticketCount}</p>
          <p className="mt-1 text-sm text-[#5f5a55]">Protocolos abertos</p>
          <Link href="/conta/reclamacoes-suporte" className="mt-5 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-[#c9a96e] transition-all hover:gap-2.5">
            Abrir reclamação →
          </Link>
        </article>
      </section>

      <section className="relative overflow-hidden border border-[rgba(201,169,110,0.22)] bg-[linear-gradient(135deg,#0d0d1a_0%,#1a1228_45%,#0a1020_100%)]">
        {/* Glows decorativos */}
        <div className="pointer-events-none absolute right-[-80px] top-[-80px] h-[300px] w-[300px] rounded-full bg-[radial-gradient(ellipse,rgba(201,169,110,0.12)_0%,transparent_70%)]" />
        <div className="pointer-events-none absolute bottom-[-60px] left-[-60px] h-[250px] w-[250px] rounded-full bg-[radial-gradient(ellipse,rgba(124,92,158,0.15)_0%,transparent_70%)]" />

        {/* Header */}
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-6 border-b border-white/[0.06] px-10 py-10">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#c9a96e]">✦ PopClub</span>
              <span className="border border-[rgba(201,169,110,0.30)] bg-[rgba(201,169,110,0.12)] px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.15em] text-[#c9a96e]">
                {currentPopClubTier.label}
              </span>
            </div>
            <h2 className="mt-3 font-display text-[2.25rem] font-light leading-none tracking-[0.01em] text-white">
              Seus Pontos
            </h2>
            <p className="mt-2 text-xs text-white/40">Acumulados em compras elegíveis</p>
          </div>
          <div className="text-right">
            <p className="font-display text-[4rem] font-light leading-none text-white">
              {formatPopClubPoints(popClubSummary.pointsBalance)}
            </p>
            <p className="mt-1 text-[9px] uppercase tracking-[0.2em] text-white/40">pontos ativos</p>
          </div>
        </div>

        {/* Barra de progresso */}
        <div className="relative z-10 border-b border-white/[0.06] px-10 py-6">
          <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-[0.15em] text-white/50">
            <span>
              {popClubSummary.currentTier === "luxo"
                ? "Nível máximo ✦"
                : `Progresso para ${popClubSummary.currentTier === "essencial" ? "Premium" : "Luxo"}`}
            </span>
            <span className="text-[#c9a96e] font-medium">{getPopClubProgressLabel(popClubSummary)}</span>
          </div>
          <div className="relative h-[2px] w-full bg-white/[0.08]">
            <div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#7c5c9e] to-[#c9a96e] transition-[width] duration-[1500ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
              style={{ width: `${Math.max(2, Math.min(popClubSummary.progressBps, 10000)) / 100}%` }}
            />
          </div>
          <div className="mt-3 flex justify-between">
            {(["essencial", "premium", "luxo"] as const).map((tier) => {
              const active = popClubSummary.currentTier === tier;
              return (
                <div key={tier} className="flex flex-col gap-0.5">
                  <span className={`text-[8px] uppercase tracking-[0.15em] ${active ? "font-semibold text-[#c9a96e]" : "text-white/30"}`}>
                    {active ? "● " : "○ "}{popClubTierMap[tier]?.label ?? tier}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats */}
        <div className="relative z-10 grid grid-cols-3 border-b border-white/[0.06]">
          <div className="border-r border-white/[0.06] px-8 py-6 text-center">
            <p className="text-[8px] uppercase tracking-[0.2em] text-white/40">Pontos</p>
            <p className="mt-2 font-display text-[2rem] font-light leading-none text-white">
              {formatPopClubPoints(popClubSummary.pointsBalance)}
            </p>
            <p className="mt-1 text-[8px] text-white/30">ativos</p>
          </div>
          <div className="border-r border-white/[0.06] px-8 py-6 text-center">
            <p className="text-[8px] uppercase tracking-[0.2em] text-white/40">Créditos</p>
            <p className="mt-2 font-display text-[2rem] font-light leading-none text-[#c9a96e]">
              {formatPopClubCredits(popClubSummary.creditBalanceCents)}
            </p>
            <p className="mt-1 text-[8px] text-white/30">saldo clube</p>
          </div>
          <div className="px-8 py-6 text-center">
            <p className="text-[8px] uppercase tracking-[0.2em] text-white/40">Amostras</p>
            <p className="mt-2 font-display text-[2rem] font-light leading-none">
              {popClubSummary.latestSampleSlots > 0
                ? <span className="text-white">{popClubSummary.latestSampleSlots}</span>
                : <span className="text-white/30">—</span>}
            </p>
            <p className="mt-1 text-[8px] text-white/30">Premium+</p>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="relative z-10 flex items-center justify-between px-10 py-5">
          <p className="text-[11px] font-light text-white/35">Acumule pontos em cada pedido elegível</p>
          <Link
            href="/popclub/inicio"
            className="bg-[#c9a96e] px-6 py-2.5 text-[9px] font-bold uppercase tracking-[0.2em] text-[#0d0d1a] transition-colors hover:bg-[#b8975a]"
          >
            Ver Clube →
          </Link>
        </div>
      </section>

      <section className="grid gap-px bg-[#e2dbd4] border border-[#e2dbd4] md:grid-cols-2 xl:grid-cols-4">
        <Link
          href="/conta/rastreio"
          className="group flex flex-col gap-4 bg-white p-6 transition-colors duration-200 hover:bg-[#faf8f5] hover:ring-1 hover:ring-[#c9a96e] hover:z-10"
        >
          <span className="text-lg text-[#c9a96e]">📦</span>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-[#1e1e1e]">Rastrear pedido</p>
            <p className="mt-0.5 text-[10px] text-[#9b9b96]">Ver entregas</p>
          </div>
        </Link>
        <Link
          href="/conta/reclamacoes-suporte"
          className="group flex flex-col gap-4 bg-white p-6 transition-colors duration-200 hover:bg-[#faf8f5] hover:ring-1 hover:ring-[#c9a96e] hover:z-10"
        >
          <span className="text-lg text-[#c9a96e]">💬</span>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-[#1e1e1e]">Abrir suporte</p>
            <p className="mt-0.5 text-[10px] text-[#9b9b96]">Protocolo rápido</p>
          </div>
        </Link>
        {whatsappHref ? (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="group flex flex-col gap-4 bg-white p-6 transition-colors duration-200 hover:bg-[#faf8f5] hover:ring-1 hover:ring-[#c9a96e] hover:z-10"
          >
            <span className="text-lg text-[#c9a96e]">✦</span>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-[#1e1e1e]">WhatsApp</p>
              <p className="mt-0.5 text-[10px] text-[#9b9b96]">Concierge exclusivo</p>
            </div>
          </a>
        ) : (
          <div className="flex flex-col gap-4 bg-white p-6 opacity-40">
            <span className="text-lg text-[#9b9b96]">✦</span>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-[#1e1e1e]">WhatsApp</p>
              <p className="mt-0.5 text-[10px] text-[#9b9b96]">Em atualização</p>
            </div>
          </div>
        )}
        <Link
          href="/catalogo"
          className="group flex flex-col gap-4 bg-white p-6 transition-colors duration-200 hover:bg-[#faf8f5] hover:ring-1 hover:ring-[#c9a96e] hover:z-10"
        >
          <span className="text-lg text-[#c9a96e]">◈</span>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-[#1e1e1e]">Comprar agora</p>
            <p className="mt-0.5 text-[10px] text-[#9b9b96]">Curadoria do mês</p>
          </div>
        </Link>
      </section>

      <section className="relative overflow-hidden border border-[#e2dbd4] bg-[#faf8f5] p-8">
        <div className="pointer-events-none absolute right-0 top-0 h-56 w-56 bg-[radial-gradient(ellipse,rgba(201,169,110,0.08)_0%,transparent_70%)]" />
        <p className="text-[10px] font-medium uppercase tracking-[0.45em] text-[#c9a96e]">
          Skin Intelligence ✦
        </p>
        <p className="mt-3 font-display text-[1.65rem] font-light leading-tight text-[#080808]">Monte sua rotina completa</p>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#4a4a47]/70">
          Responda o quiz de pele, receba uma rotina personalizada por etapa e gere um carrinho pronto para recompra.
        </p>
        <Link
          href="/conta/skincare"
          className="mt-6 inline-flex items-center gap-2 bg-[#080808] px-7 py-3 text-[10px] uppercase tracking-[0.25em] text-white transition-colors hover:bg-[#1e1e1e]"
        >
          Iniciar rotina →
        </Link>
      </section>

      <CustomerPaymentMethodsPanel compact />

      <section className="grid gap-px bg-[#e2dbd4] border border-[#e2dbd4] xl:grid-cols-[1.15fr_1fr]">
        <article className="bg-white p-8">
          <div className="flex items-center justify-between gap-3 border-b border-[#e2dbd4] pb-6">
            <div>
              <p className="text-[9px] font-medium uppercase tracking-[0.38em] text-[#9a9290]">Pedidos recentes</p>
              <p className="mt-2 font-display text-2xl font-light text-[#080808]">Por pedido e por lojista</p>
            </div>
            <Link href="/conta/pedidos" className="text-[10px] uppercase tracking-[0.2em] text-[#c9a96e] hover:text-[#b8975a]">
              Ver tudo →
            </Link>
          </div>

          {loading ? (
            <p className="mt-6 text-sm text-[#4a4a47]/70">Carregando pedidos...</p>
          ) : orders.length === 0 ? (
            <p className="mt-6 text-sm text-[#4a4a47]/70">Você ainda não tem pedidos.</p>
          ) : (
            <div className="mt-5 space-y-2">
              {orders.slice(0, 5).map((order) => {
                const orderSubOrders = subOrders.filter((row) => row.order_id === order.id);
                return (
                  <Link
                    key={order.id}
                    href={`/conta/pedidos/${order.id}`}
                    className="block border border-[#e2dbd4] p-4 transition-colors hover:border-[#c9a96e]/40 hover:bg-[#faf8f5]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#1e1e1e]">Pedido {shortId(order.id)}</p>
                        <p className="text-[10px] text-[#9a9290]">{formatDateTimePtBr(order.created_at)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-[#080808]">{formatMoneyFromCents(order.total_order_cents)}</p>
                        <span
                          className={`mt-1 inline-flex border px-2 py-0.5 text-[9px] uppercase tracking-[0.16em] ${statusClassName(
                            order.status,
                            "order"
                          )}`}
                        >
                          {statusLabel(order.status, "order")}
                        </span>
                      </div>
                    </div>
                    <p className="mt-2 text-[11px] text-[#4a4a47]/70">{statusMessage(order.status, "order")}</p>

                    {orderSubOrders.length ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {orderSubOrders.map((subOrder) => (
                          <span
                            key={subOrder.id}
                            className="border border-[#e2dbd4] bg-[#faf8f5] px-2.5 py-0.5 text-[10px] text-[#4a4a47]/80"
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

        <article className="bg-white p-8">
          <div className="border border-[#e2dbd4] bg-[#faf8f5] p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[9px] uppercase tracking-[0.2em] text-[#9a9290]">Mensagens recentes</p>
              <Link href="/conta/mensagens" className="text-[9px] uppercase tracking-[0.2em] text-[#c9a96e] hover:text-[#b8975a]">
                Ver mensagens →
              </Link>
            </div>
            {notifications.length ? (
              <div className="mt-3 space-y-2">
                {notifications.slice(0, 3).map((notification) => (
                  <div key={notification.id} className="border border-[#e2dbd4] bg-white p-3">
                    <p className="text-[11px] font-medium text-[#1e1e1e]">{notification.title}</p>
                    <p className="mt-1 text-[10px] text-[#9a9290]">{formatDateTimePtBr(notification.created_at)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-[11px] text-[#4a4a47]/70">Sem atualizações recentes.</p>
            )}
          </div>

          <p className="mt-7 text-[9px] uppercase tracking-[0.38em] text-[#9a9290]">Sugestões para você</p>
          <p className="mt-2 font-display text-2xl font-light text-[#080808]">Curadoria editorial</p>
          <div className="mt-4 space-y-2">
            {recommendations.length ? (
              recommendations.map((product) => (
                <div key={product.id} className="border border-[#e2dbd4] p-4">
                  <p className="text-[11px] font-semibold text-[#1e1e1e]">{product.name}</p>
                  <p className="mt-1 text-sm text-[#4a4a47]/75">{formatMoneyFromCents(product.price_cents)}</p>
                  <Link href="/catalogo" className="mt-2.5 inline-flex text-[9px] uppercase tracking-[0.2em] text-[#c9a96e] hover:text-[#b8975a]">
                    Ver no catálogo →
                  </Link>
                </div>
              ))
            ) : (
              <p className="text-[11px] text-[#4a4a47]/70">Sem recomendações no momento.</p>
            )}
          </div>

          <div className="mt-5 border border-[#e2dbd4] bg-[#faf8f5] p-5">
            <p className="text-[9px] uppercase tracking-[0.2em] text-[#9a9290]">Favoritos</p>
            <p className="mt-3 font-display text-4xl font-light text-[#080808]">{favoritesCount}</p>
            <Link href="/conta/favoritos" className="mt-3 inline-flex text-[9px] uppercase tracking-[0.2em] text-[#c9a96e] hover:text-[#b8975a]">
              Ver lista salva →
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}
