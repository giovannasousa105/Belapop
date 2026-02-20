"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { LuxuryButton } from "@/components/LuxuryButton";
import { NotificationRecord } from "@/lib/types";

const filterOptions = [
  { label: "Todas", value: "all" },
  { label: "Não lidas", value: "unread" }
] as const;

type FilterValue = typeof filterOptions[number]["value"];

export default function SellerNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterValue>("all");
  const [marking, setMarking] = useState(false);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("limit", "20");
      if (filter === "unread") {
        params.set("filter", "unread");
      }
      const response = await fetch(`/api/seller/notifications?${params.toString()}`);
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Não foi possível carregar as notificações.");
      }
      const data = await response.json();
      setNotifications(data.notifications ?? []);
    } catch (error) {
      console.error("[seller/notifications] list failed", error);
      setError("Erro ao buscar notificações.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications]
  );

  const handleMarkRead = async (id: string) => {
    setMarking(true);
    try {
      const response = await fetch("/api/seller/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      if (!response.ok) {
        throw new Error("Falha ao marcar a notificação.");
      }
      await loadNotifications();
    } catch (error) {
      console.error("[seller/notifications] mark-read failed", error);
    } finally {
      setMarking(false);
    }
  };

  const handleMarkAll = async () => {
    setMarking(true);
    try {
      await fetch("/api/seller/notifications/mark-all-read", { method: "POST" });
      await loadNotifications();
    } catch (error) {
      console.error("[seller/notifications] mark-all failed", error);
    } finally {
      setMarking(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="rounded-3xl border border-black/10 bg-white p-8 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Central</p>
        <h1 className="mt-3 font-display text-3xl text-bpBlack">Notificações BelaPop</h1>
        <p className="mt-2 text-sm text-bpGraphite/80">
          Um registro elegante de aprovações, ajustes e ações da curadoria.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={`rounded-full border px-4 py-2 uppercase tracking-[0.3em] transition ${
                filter === option.value
                  ? "border-bpPink/60 bg-bpPinkSoft/40 text-bpBlackSoft"
                  : "border-black/10 text-bpGraphite/80 hover:border-bpPink/40 hover:text-bpBlackSoft"
              }`}
            >
              {option.label}
            </button>
          ))}
          <span className="ml-auto text-xs text-bpGraphite/70">
            {unreadCount} nova{unreadCount === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Atividade recente</p>
            <h2 className="mt-1 font-display text-2xl text-bpBlack">Histórico</h2>
          </div>
          <LuxuryButton
            tone="retail"
            variant="outline"
            size="sm"
            onClick={handleMarkAll}
            disabled={marking || notifications.length === 0}
          >
            Marcar todas como lidas
          </LuxuryButton>
        </div>

        <div className="mt-6 space-y-4">
          {loading ? (
            <p className="text-sm text-bpGraphite/70">Sincronizando notificações...</p>
          ) : error ? (
            <p className="text-sm text-rose-500">{error}</p>
          ) : notifications.length === 0 ? (
            <p className="text-sm text-bpGraphite/80">Nenhuma notificação por enquanto.</p>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className="rounded-3xl border border-black/10 bg-bpOffWhite/60 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-bpBlackSoft">{notification.title}</p>
                    <p className="mt-2 text-sm text-bpGraphite/80">{notification.body}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 text-right text-xs text-bpGraphite/70">
                    {!notification.isRead && (
                      <span className="rounded-full border border-bpPink/70 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-bpPink">
                        Nova
                      </span>
                    )}
                    <span>
                      {new Date(notification.createdAt).toLocaleString("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "short"
                      })}
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {notification.ctaHref && (
                    <LuxuryButton tone="retail" size="sm" href={notification.ctaHref}>
                      {notification.ctaLabel ?? "Abrir"}
                    </LuxuryButton>
                  )}
                  {!notification.isRead && (
                    <button
                      onClick={() => handleMarkRead(notification.id)}
                      disabled={marking}
                      className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70 hover:text-bpBlackSoft"
                    >
                      Marcar como lida
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
