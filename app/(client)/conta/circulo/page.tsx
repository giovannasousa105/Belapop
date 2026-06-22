"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useAuth } from "@/lib/AuthContext";
import { buildLoginHref } from "@/lib/auth/redirects";

type DropSummary = {
  id:              string;
  slug:            string;
  title:           string;
  subtitle:        string | null;
  cover_image_url: string | null;
  status:          string;
  opens_at:        string | null;
  closes_at:       string | null;
};

type DropOrder = {
  id:          string;
  drop_id:     string;
  status:      string;
  total_cents: number;
  created_at:  string;
  drops: { title: string; slug: string; number: number } | null;
};

type ApiResponse = {
  activeDrop: DropSummary | null;
  orders:     DropOrder[];
  isMember:   boolean;
  member:     { id: string; name: string; skin_concern: string } | null;
};

function formatMoney(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function formatTimeLeft(isoDate: string | null): string {
  if (!isoDate) return "";
  const diff = new Date(isoDate).getTime() - Date.now();
  if (diff <= 0) return "Encerrado";
  const days    = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours   = Math.floor((diff / (1000 * 60 * 60)) % 24);
  if (days > 0)  return `Fecha em ${days}d ${hours}h`;
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  return `Fecha em ${hours}h ${minutes}min`;
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  paid:     { label: "Pago",      cls: "border-green-200  bg-green-50  text-green-700"  },
  pending:  { label: "Pendente",  cls: "border-yellow-200 bg-yellow-50 text-yellow-700" },
  refunded: { label: "Estornado", cls: "border-gray-200   bg-gray-50   text-gray-600"   },
  failed:   { label: "Falhou",    cls: "border-red-200    bg-red-50    text-red-600"     },
};

export default function ContaCirculoPage() {
  const { ready, user } = useAuth();
  const router          = useRouter();
  const searchParams    = useSearchParams();
  const dropPago        = searchParams.get("drop_pago");

  const [data,    setData]    = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    if (!user) { router.replace(buildLoginHref("/conta/circulo")); return; }

    let active = true;
    setLoading(true);

    fetch("/api/conta/drops")
      .then((r) => r.json())
      .then((json) => { if (active) setData(json as ApiResponse); })
      .catch(() => { if (active) setData(null); })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [ready, user, router]);

  return (
    <div className="space-y-6 pb-28">

      {/* Cabeçalho */}
      <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <p className="text-xs uppercase tracking-[0.32em] text-bpGraphite/60">Meu Círculo</p>
        <h1 className="mt-3 font-display text-4xl text-bpBlack">Círculo BelaPop</h1>
        <p className="mt-3 text-sm text-bpGraphite/75">
          Drops exclusivos curados para membros. Acesso antecipado por WhatsApp.
        </p>
      </section>

      {/* Confirmação de compra */}
      {dropPago && (
        <section className="rounded-2xl border border-green-200 bg-green-50 px-5 py-4">
          <p className="text-sm font-medium text-green-800">
            Pedido confirmado para o Drop <strong>{dropPago}</strong>. Você receberá uma confirmação em breve.
          </p>
        </section>
      )}

      {loading ? (
        <section className="rounded-2xl border border-black/10 bg-white p-6 text-sm text-bpGraphite/70">
          Carregando...
        </section>
      ) : !data?.isMember ? (
        /* Não é membro */
        <section className="rounded-3xl border border-black/10 bg-white p-8 text-center shadow-sm">
          <p className="text-2xl">✦</p>
          <h2 className="mt-4 font-display text-2xl text-bpBlack">Você ainda não está no Círculo</h2>
          <p className="mt-3 text-sm text-bpGraphite/70">
            O Círculo BelaPop é gratuito. Inscreva-se para receber drops exclusivos no WhatsApp.
          </p>
          <Link
            href="/circulo"
            className="mt-6 inline-block rounded-full bg-bpBlack px-8 py-3 text-xs font-medium uppercase tracking-[0.2em] text-white"
          >
            Entrar no Círculo
          </Link>
        </section>
      ) : (
        <>
          {/* Drop ativo */}
          {data.activeDrop ? (
            <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.32em] text-bpGraphite/50">
                {data.activeDrop.status === "live" ? "Drop Aberto Agora" : "Próximo Drop"}
              </p>
              <Link
                href={`/drops/${data.activeDrop.slug}`}
                className="group flex items-start gap-4"
              >
                {data.activeDrop.cover_image_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={data.activeDrop.cover_image_url}
                    alt={data.activeDrop.title}
                    className="h-20 w-20 flex-shrink-0 rounded-xl object-cover"
                  />
                ) : (
                  <div className="h-20 w-20 flex-shrink-0 rounded-xl bg-bpPinkSoft" />
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="font-headline text-xl font-light text-bpBlack group-hover:underline">
                    {data.activeDrop.title}
                  </h2>
                  {data.activeDrop.subtitle && (
                    <p className="mt-1 text-sm text-bpGraphite/70 line-clamp-2">{data.activeDrop.subtitle}</p>
                  )}
                  <p className="mt-2 text-xs text-bpPinkCta font-medium">
                    {data.activeDrop.status === "live"
                      ? formatTimeLeft(data.activeDrop.closes_at)
                      : `Abre em ${formatDate(data.activeDrop.opens_at ?? "")}`}
                  </p>
                </div>
                <span className="text-bpGraphite/40 group-hover:text-bpBlack transition-colors">→</span>
              </Link>
            </section>
          ) : (
            <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
              <p className="text-xs uppercase tracking-[0.32em] text-bpGraphite/50">Drop ativo</p>
              <p className="mt-3 text-sm text-bpGraphite/70">
                Nenhum drop aberto no momento. Você será notificada pelo WhatsApp quando o próximo abrir.
              </p>
            </section>
          )}

          {/* Pedidos de drops */}
          <section className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.32em] text-bpGraphite/50">
              Meus Pedidos de Drops
            </p>

            {data.orders.length === 0 ? (
              <p className="text-sm text-bpGraphite/70">
                Você ainda não comprou nenhum drop.{" "}
                {data.activeDrop && (
                  <Link href={`/drops/${data.activeDrop.slug}`} className="underline underline-offset-2">
                    Ver drop aberto →
                  </Link>
                )}
              </p>
            ) : (
              <div className="space-y-3">
                {data.orders.map((order) => {
                  const statusInfo = STATUS_MAP[order.status] ?? { label: order.status, cls: "border-gray-200 bg-gray-50 text-gray-600" };
                  return (
                    <article
                      key={order.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-black/10 bg-bpOffWhite px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-bpBlack truncate">
                          {order.drops?.title ?? "Drop"}
                          {order.drops?.number ? ` #${order.drops.number}` : ""}
                        </p>
                        <p className="text-xs text-bpGraphite/60">{formatDate(order.created_at)}</p>
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-2">
                        <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em] ${statusInfo.cls}`}>
                          {statusInfo.label}
                        </span>
                        <span className="text-sm font-semibold text-bpBlack">
                          {formatMoney(order.total_cents)}
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}

    </div>
  );
}
