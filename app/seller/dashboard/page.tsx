"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { LuxuryButton } from "@/components/LuxuryButton";
import { useAuth } from "@/lib/AuthContext";
import { useStoredProducts } from "@/lib/hooks/useStoredProducts";
import { orderRepository } from "@/lib/orders/orderRepository";
import { userRepository } from "@/lib/repositories/userRepository";
import { NotificationRecord, Order, SubOrder, User } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import type {
  ActivationIssueLevel,
  ActivationStatusResponse
} from "@/lib/seller/activationStatus";

const notices = [
  {
    title: "Diretrizes editoriais atualizadas",
    description:
      "Revise as diretrizes de imagem e descrição para manter o padrão de vitrine."
  },
  {
    title: "Campanhas institucionais do mês",
    description:
      "Envie sua seleção para campanhas sazonais até o dia 25."
  },
  {
    title: "Política comercial vigente",
    description:
      "Consulte as condições de repasse e prazos disponíveis no painel."
  }
];

const ACTIVATION_LEVEL_META: Record<
  ActivationIssueLevel,
  { label: string; border: string; background: string }
> = {
  blocker: {
    label: "Bloqueio",
    border: "border-[#F6D6DE]",
    background: "bg-[#FFF4F7]"
  },
  warning: {
    label: "Aviso",
    border: "border-[#FDEAD4]",
    background: "bg-[#FFFBF5]"
  },
  info: {
    label: "Info",
    border: "border-noir-200",
    background: "bg-noir-50/60"
  }
};

export default function SellerDashboardPage() {
  const { user, ready, updateSellerProfile } = useAuth();
  const { products } = useStoredProducts();
  const [orders, setOrders] = useState<Order[]>([]);
  const [subOrders, setSubOrders] = useState<SubOrder[]>([]);
  const [userMap, setUserMap] = useState<Map<string, User>>(new Map());
  const [onboardingLoading, setOnboardingLoading] = useState(false);
  const [onboardingError, setOnboardingError] = useState<string | null>(null);
  const [onboardingSuccess, setOnboardingSuccess] = useState<string | null>(
    null
  );
  const [activationStatus, setActivationStatus] =
    useState<ActivationStatusResponse | null>(null);
  const [activationLoading, setActivationLoading] = useState(false);
  const [activationError, setActivationError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState<string | null>(null);
  const activationPercent = activationStatus?.progressPercent ?? 0;
  const checklistItems = activationStatus?.checklist ?? [];
  const activationIssues = activationStatus?.issues ?? [];
  const unreadNotifications = notifications.filter(
    (notification) => !notification.isRead
  ).length;
  const activationProductSnapshot = useMemo(() => {
    if (!user?.sellerProfile?.sellerId) return "";
    return products
      .filter((product) => product.sellerId === user.sellerProfile?.sellerId)
      .map((product) =>
        [
          product.id,
          product.status,
          product.weightKg ?? 0,
          product.widthCm ?? 0,
          product.heightCm ?? 0,
          product.lengthCm ?? 0
        ].join(":")
      )
      .join("|");
  }, [products, user?.sellerProfile?.sellerId]);

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

  useEffect(() => {
    if (!ready) return;
    if (!user?.sellerProfile?.sellerId) {
      setActivationStatus(null);
      setActivationLoading(false);
      return;
    }

    let active = true;
    setActivationLoading(true);
    setActivationError(null);

    void fetch("/api/seller/activation-status")
      .then(async (response) => {
        if (!response.ok) {
          const text = await response.text();
          throw new Error(
            text || "Não foi possível carregar o centro de ativação."
          );
        }
        return response.json();
      })
      .then((data: ActivationStatusResponse) => {
        if (!active) return;
        setActivationStatus(data);
      })
      .catch((error) => {
        if (!active) return;
        console.error("[seller/dashboard] activation status:", error);
        setActivationError("Não foi possível carregar o centro de ativação.");
        setActivationStatus(null);
      })
      .finally(() => {
        if (!active) return;
        setActivationLoading(false);
      });

    return () => {
      active = false;
    };
  }, [ready, user?.sellerProfile?.sellerId, activationProductSnapshot]);

  const loadNotifications = useCallback(async () => {
    if (!ready) {
      return;
    }
    setNotificationsLoading(true);
    setNotificationsError(null);
    try {
      const response = await fetch("/api/seller/notifications?limit=5");
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Não foi possível carregar as notificações.");
      }
      const data = await response.json();
      setNotifications(data.notifications ?? []);
    } catch (error) {
      console.error("[seller/dashboard] notifications", error);
      setNotificationsError("Não foi possível carregar as notificações.");
    } finally {
      setNotificationsLoading(false);
    }
  }, [ready]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const sellerProducts = products.filter(
    (product) => product.sellerId === user?.sellerProfile?.sellerId
  );
  const activeProducts = sellerProducts.filter(
    (product) => product.status === "published"
  ).length;

  const sellerSubOrders = subOrders.filter(
    (subOrder) => subOrder.sellerId === user?.sellerProfile?.sellerId
  );

  const revenue = useMemo(() => {
    return sellerSubOrders.reduce((total, subOrder) => {
      const itemsTotal =
        subOrder.productTotal ??
        subOrder.items.reduce((sum, item) => {
          const product = products.find((p) => p.id === item.productId);
          return sum + (product?.price ?? 0) * item.quantity;
        }, 0);
      const net = subOrder.sellerNetAmount ?? itemsTotal;
      return total + net;
    }, 0);
  }, [sellerSubOrders, products]);

  const pendingPayouts = sellerSubOrders.filter(
    (subOrder) => subOrder.paymentStatus !== "paid"
  ).length;
  const paidPayouts = sellerSubOrders.filter(
    (subOrder) => subOrder.paymentStatus === "paid"
  ).length;

  const pendingShipments = sellerSubOrders.filter(
    (subOrder) => subOrder.status !== "Enviado"
  ).length;

  const recentOrders = useMemo(() => {
    return [...sellerSubOrders]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 5)
      .map((subOrder) => {
        const mainOrder = orders.find((order) => order.id === subOrder.orderId);
        const customer = mainOrder?.customerId
          ? userMap.get(mainOrder.customerId)
          : undefined;
        const itemCount = subOrder.items.reduce(
          (sum, item) => sum + item.quantity,
          0
        );
        return {
          ...subOrder,
          customerName: customer?.name ?? "Cliente convidado",
          itemCount
        };
      });
  }, [sellerSubOrders, orders, userMap]);

  const handleOnboard = async () => {
    if (!user) return;
    setOnboardingLoading(true);
    setOnboardingError(null);
    setOnboardingSuccess(null);
    try {
      const response = await fetch("/api/stripe/connect/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: user.sellerProfile?.stripeAccountId,
          email: user.email,
          businessName: user.sellerProfile?.storeName
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error ?? "Falha ao iniciar o onboarding.");
      }
      updateSellerProfile({ stripeAccountId: data.accountId });
      setOnboardingSuccess(
        "Redirecionando para a ativacao de pagamentos."
      );
      window.location.href = data.url;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Nao foi possivel iniciar.";
      setOnboardingError(message);
    } finally {
      setOnboardingLoading(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="rounded-3xl border border-black/10 bg-white p-8 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-noir-500">
          Dashboard do lojista
        </p>
        <h1 className="mt-3 font-display text-3xl text-noir-950">
          {user?.sellerProfile?.storeName ?? "Sua loja"}
        </h1>
        <p className="mt-2 text-sm text-noir-600">
          Visão consolidada de catálogo, pedidos e indicadores operacionais.
        </p>
      </div>

        <div className="rounded-2xl border border-black/10 bg-white p-8 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-noir-500">
                Centro de Ativa��o
              </p>
              <h2 className="mt-2 font-display text-2xl text-noir-950">
                Prepare sua loja para come�ar a vender.
              </h2>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.3em] text-noir-500">Progresso</p>
              <p className="mt-1 text-3xl font-semibold text-noir-950">
                {activationLoading ? "Carregando" : `${activationPercent}%`}
              </p>
            </div>
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-noir-100">
            <div
              className="h-full rounded-full bg-[#B80F5A] transition-[width]"
              style={{
                width: `${activationLoading ? 0 : activationPercent}%`
              }}
            />
          </div>
          <ul className="mt-6 space-y-3">
            {activationLoading ? (
              <li className="text-sm text-noir-500">Carregando checklist...</li>
            ) : checklistItems.length === 0 ? (
              <li className="text-sm text-noir-500">
                Nenhum item dispon�vel no momento.
              </li>
            ) : (
              checklistItems.map((item) => (
                <li
                  key={item.key}
                  className="flex flex-col gap-3 rounded-2xl border border-black/5 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-2xl font-semibold ${item.completed ? "text-luxe-600" : "text-noir-400"}`}
                    >
                      {item.completed ? "✓" : "○"}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-noir-900">
                        {item.label}
                      </p>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-noir-500">
                        {item.completed ? "Completo" : "Pendente"}
                      </p>
                    </div>
                  </div>
                  {!item.completed && item.ctaLabel && item.ctaHref ? (
                    <LuxuryButton
                      tone="retail"
                      size="sm"
                      variant="outline"
                      href={item.ctaHref}
                    >
                      {item.ctaLabel}
                    </LuxuryButton>
                  ) : null}
                </li>
              ))
            )}
          </ul>
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.3em] text-noir-500">
                Pend�ncias inteligentes
              </p>
              <span className="text-xs uppercase tracking-[0.3em] text-noir-500">
                Atualizado
              </span>
            </div>
            {activationLoading ? (
              <p className="text-sm text-noir-500">Sincronizando pend�ncias...</p>
            ) : activationIssues.length === 0 ? (
              <p className="text-sm text-noir-500">Sem pend�ncias no momento.</p>
            ) : (
              activationIssues.map((issue) => (
                <div
                  key={issue.message}
                  className={`rounded-2xl border-l-4 ${ACTIVATION_LEVEL_META[issue.level].border} ${ACTIVATION_LEVEL_META[issue.level].background} border border-black/5 p-4`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-noir-900">{issue.message}</p>
                    <span className="text-[11px] uppercase tracking-[0.3em] text-noir-500">
                      {ACTIVATION_LEVEL_META[issue.level].label}
                    </span>
                  </div>
                  <div className="mt-3">
                    <LuxuryButton
                      tone="retail"
                      size="sm"
                      variant="outline"
                      href={issue.ctaHref}
                    >
                      {issue.ctaLabel}
                    </LuxuryButton>
                  </div>
                </div>
              ))
            )}
          </div>
          {activationError ? (
            <p className="mt-4 text-sm text-red-500">{activationError}</p>
          ) : null}
        </div>

      <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-noir-500">
              Notificações
            </p>
            <h2 className="mt-2 font-display text-2xl text-noir-950">
              Atualizações da curadoria
            </h2>
          </div>
          <span className="rounded-full border border-noir-200 px-4 py-1 text-xs uppercase tracking-[0.3em] text-noir-500">
            {unreadNotifications} nova{unreadNotifications === 1 ? "" : "s"}
          </span>
        </div>
        <div className="mt-4 space-y-3">
          {notificationsLoading ? (
            <p className="text-sm text-noir-500">
              Sincronizando notificações...
            </p>
          ) : notificationsError ? (
            <p className="text-sm text-rose-500">{notificationsError}</p>
          ) : notifications.length === 0 ? (
            <p className="text-sm text-noir-600">
              Nenhuma atualização recente da curadoria.
            </p>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className="flex flex-col gap-2 rounded-2xl border border-black/10 bg-noir-50/60 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-noir-900">
                    {notification.title}
                  </p>
                  <p className="mt-1 text-xs text-noir-500">
                    {new Date(notification.createdAt).toLocaleDateString(
                      "pt-BR",
                      { dateStyle: "short", timeStyle: "short" }
                    )}
                  </p>
                  <p className="mt-2 text-sm text-noir-600">
                    {notification.body}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-noir-500">
                  {!notification.isRead && (
                    <span className="rounded-full border border-luxe-600/70 px-3 py-1 uppercase tracking-[0.3em] text-luxe-600">
                      Nova
                    </span>
                  )}
                  {notification.ctaHref && (
                    <LuxuryButton
                      tone="retail"
                      size="sm"
                      variant="outline"
                      href={notification.ctaHref}
                    >
                      {notification.ctaLabel ?? "Abrir"}
                    </LuxuryButton>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        <div className="mt-4 flex justify-end">
          <LuxuryButton tone="retail" variant="outline" size="sm" href="/seller/notifications">
            Ver todas
          </LuxuryButton>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-noir-500">
                Pedidos recentes
              </p>
              <h2 className="mt-2 font-display text-2xl text-noir-950">
                Últimas movimentações
              </h2>
            </div>
            <LuxuryButton tone="retail" variant="outline" href="/seller/orders">
              Ver pedidos
            </LuxuryButton>
          </div>
          {recentOrders.length === 0 ? (
            <p className="mt-6 text-sm text-noir-600">
              Nenhum pedido registrado para sua loja no momento.
            </p>
          ) : (
            <div className="mt-6 space-y-4 text-sm text-noir-600">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-black/10 p-4"
                >
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-noir-500">
                      Pedido {order.orderId}
                    </p>
                    <p className="mt-2 text-sm text-noir-900">
                      {order.customerName} • {order.itemCount} item(ns)
                    </p>
                    <p className="mt-1 text-xs text-noir-500">
                      Frete: {order.shippingService} • {formatPrice(order.shippingValue)}
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

        <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-noir-500">
            Avisos da plataforma
          </p>
          <h2 className="mt-2 font-display text-2xl text-noir-950">
            Comunicados institucionais
          </h2>
          <div className="mt-6 space-y-4 text-sm text-noir-600">
            {notices.map((notice) => (
              <div key={notice.title} className="rounded-2xl border border-black/10 p-4">
                <p className="text-sm font-medium text-noir-900">
                  {notice.title}
                </p>
                <p className="mt-2 text-sm text-noir-600">
                  {notice.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

