"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { EmptyState } from "@/components/EmptyState";
import { PageHeading } from "@/components/PageHeading";
import { useAuth } from "@/lib/AuthContext";
import { getSupabaseClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";

type OrderSummary = {
  id: string;
  status: string;
  total_order_cents: number;
  created_at: string;
};

const formatOrderId = (value: string) => (value.length > 8 ? value.slice(0, 8) + "..." : value);

const buildWhatsappHref = () => {
  const raw = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";
  const phone = raw.replace(/\D/g, "");
  if (!phone) return null;
  const text = encodeURIComponent("Ola, preciso de apoio com minha curadoria BelaPop.");
  return `https://wa.me/${phone}?text=${text}`;
};

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function ContaPage() {
  const { ready, user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [nextOrder, setNextOrder] = useState<OrderSummary | null>(null);
  const [rituals, setRituals] = useState<string[]>([]);
  const whatsappHref = useMemo(buildWhatsappHref, []);

  useEffect(() => {
    if (!ready) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.role === "seller") {
      router.replace("/parceiro");
      return;
    }

    if (user.role === "admin") {
      router.replace("/admin");
      return;
    }

    let active = true;
    const supabase = getSupabaseClient();
    setLoading(true);

    const load = async () => {
      try {
        const [{ data: orders }, { count }, { data: ritualRows }] = await Promise.all([
          supabase
            .from("orders")
            .select("id,status,total_order_cents,created_at")
            .eq("customer_id", user.id)
            .order("created_at", { ascending: false })
            .limit(10),
          supabase.from("favorites").select("id", { count: "exact", head: true }).eq("user_id", user.id),
          supabase
            .from("products")
            .select("ritual")
            .in("status", ["active", "published"])
            .not("ritual", "is", null)
            .limit(18)
        ]);

        if (!active) return;

        const candidate = (orders ?? []).find((order) =>
          !["delivered", "cancelled", "canceled", "refunded"].includes(
            String(order.status ?? "").toLowerCase()
          )
        );

        setNextOrder(candidate ?? orders?.[0] ?? null);
        setFavoritesCount(count ?? 0);

        const uniqueRituals = Array.from(
          new Set(
            (ritualRows ?? [])
              .map((row) => (typeof row.ritual === "string" ? row.ritual.trim() : ""))
              .filter(Boolean)
          )
        ).slice(0, 4);

        setRituals(uniqueRituals);
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [ready, router, user]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-6 py-10">
      <PageHeading title="Minha curadoria" subtitle="Meus pedidos, meus rituais, minhas escolhas." />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Proximo pedido</p>
          {loading ? (
            <p className="mt-4 text-sm text-bpGraphite/70">Preparando sua selecao...</p>
          ) : nextOrder ? (
            <div className="mt-4 space-y-3">
              <p className="text-lg font-semibold text-bpBlack">Pedido {formatOrderId(nextOrder.id)}</p>
              <p className="text-sm text-bpGraphite/80">{nextOrder.status}</p>
              <p className="text-sm text-bpGraphite/80">
                Total {formatPrice((nextOrder.total_order_cents ?? 0) / 100)}
              </p>
              <Link
                href="/conta/pedidos"
                className="inline-flex rounded-full border border-black/15 px-4 py-2 text-xs uppercase tracking-[0.25em] text-bpBlackSoft"
              >
                Ver timeline
              </Link>
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState
                title="Sem pedidos por aqui."
                body="Explore a curadoria e monte seu proximo ritual."
                ctaLabel="Ir ao catalogo"
                ctaHref="/catalogo"
              />
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Favoritos</p>
          <p className="mt-4 text-3xl font-semibold text-bpBlack">{favoritesCount}</p>
          <p className="mt-2 text-sm text-bpGraphite/80">Wishlist editorial salva.</p>
          <Link
            href="/conta/favoritos"
            className="mt-5 inline-flex rounded-full border border-black/15 px-4 py-2 text-xs uppercase tracking-[0.25em] text-bpBlackSoft"
          >
            Abrir wishlist
          </Link>
        </div>

        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Rituais recomendados</p>
          {loading ? (
            <p className="mt-4 text-sm text-bpGraphite/70">Preparando sua selecao...</p>
          ) : rituals.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {rituals.map((ritual) => (
                <Link
                  key={ritual}
                  href={`/catalogo?ritual=${encodeURIComponent(ritual)}`}
                  className="rounded-full border border-bpPink/40 px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-bpPink"
                >
                  {ritual}
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-bpGraphite/80">Ainda em edicao.</p>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/conta/dados"
          className="rounded-2xl border border-black/10 bg-white px-6 py-4 text-sm font-semibold text-bpBlackSoft shadow-sm transition hover:border-black/30"
        >
          Dados e enderecos
        </Link>
        {whatsappHref ? (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="rounded-2xl border border-black/10 bg-white px-6 py-4 text-sm font-semibold text-bpBlackSoft shadow-sm transition hover:border-black/30"
          >
            Concierge no WhatsApp
          </a>
        ) : (
          <div className="rounded-2xl border border-black/10 bg-white px-6 py-4 text-sm text-bpGraphite/70 shadow-sm">
            Concierge em atualizacao.
          </div>
        )}
      </div>
    </div>
  );
}
