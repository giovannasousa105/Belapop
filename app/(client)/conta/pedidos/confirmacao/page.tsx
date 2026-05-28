"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle, Package, Truck } from "lucide-react";

type OrderSummary = {
  order_id: string;
  order_number: string;
  totals?: {
    grand_total?: number;
  };
  status: string;
  sub_orders?: Array<{
    seller_name: string;
    items_count: number;
  }>;
};

const formatCurrency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

function LoadingState() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#d51e71] border-t-transparent" />
    </div>
  );
}

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("id") ?? searchParams.get("order");
  const orderCode = searchParams.get("code");
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      router.replace("/conta/pedidos");
      return;
    }

    let active = true;
    setLoading(true);

    fetch(`/api/v1/orders/${encodeURIComponent(orderId)}`, {
      credentials: "include",
      cache: "no-store"
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: OrderSummary | null) => {
        if (!active) return;
        setOrder(data);
        setLoading(false);
      })
      .catch(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [orderId, router]);

  if (loading) return <LoadingState />;

  const total = order?.totals?.grand_total ?? 0;
  const displayCode = order?.order_number ?? orderCode ?? orderId?.slice(0, 8).toUpperCase();

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#d51e71]/10">
        <CheckCircle className="h-10 w-10 text-[#d51e71]" strokeWidth={1.5} />
      </div>

      <h1 className="font-['Cormorant_Garamond'] text-4xl font-light tracking-[-0.02em] text-[#1e1e1e]">
        Pedido confirmado
      </h1>
      <p className="mt-2 text-sm text-black/45">
        Pedido <span className="font-semibold text-black/65">#{displayCode}</span>
        {total > 0 ? <> · {formatCurrency.format(total)}</> : null}
      </p>
      <p className="mt-4 text-sm leading-relaxed text-black/50">
        Receba atualizações por e-mail. Acompanhe o status em{" "}
        <strong className="text-black/70">Meus Pedidos</strong>.
      </p>

      <div className="mt-8 rounded-2xl border border-black/8 bg-white p-6 text-left shadow-sm">
        <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-black/35">
          Próximas etapas
        </p>
        <ol className="space-y-3">
          {[
            { icon: CheckCircle, label: "Pagamento confirmado", done: true },
            { icon: Package, label: "Loja separando os itens", done: false },
            { icon: Truck, label: "Envio via Mandabem com rastreio", done: false }
          ].map((item) => (
            <li key={item.label} className="flex items-center gap-3">
              <item.icon
                className={item.done ? "h-4 w-4 shrink-0 text-[#d51e71]" : "h-4 w-4 shrink-0 text-black/20"}
                strokeWidth={1.5}
              />
              <span className={`text-sm ${item.done ? "text-black/75" : "text-black/35"}`}>
                {item.label}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link
          href={orderId ? `/conta/pedidos/${orderId}` : "/conta/pedidos"}
          className="flex flex-1 items-center justify-center gap-2 rounded-full border border-black/12 px-6 py-3 text-sm font-medium text-black/65 transition hover:border-black/25 hover:text-black/80"
        >
          Ver pedido
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <Link
          href="/catalogo"
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#d51e71] px-6 py-3 text-sm font-medium text-white transition hover:bg-[#b5195f]"
        >
          Continuar comprando
        </Link>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ConfirmationContent />
    </Suspense>
  );
}
