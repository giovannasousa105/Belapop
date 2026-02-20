import Link from "next/link";

import { getPartnerPortalAccess } from "@/lib/auth/partnerPortal";
import { formatPrice } from "@/lib/utils";

type SubOrderRow = {
  id: string;
  order_id: string;
  status: string | null;
  created_at: string | null;
  product_total_cents: number | null;
  shipping_total_cents: number | null;
  items: unknown;
};

function getItemsCount(items: unknown) {
  if (!Array.isArray(items)) return 0;
  return items.reduce((sum, item) => {
    if (typeof item !== "object" || !item) return sum + 1;
    const quantity =
      typeof (item as { quantity?: unknown }).quantity === "number"
        ? (item as { quantity: number }).quantity
        : 1;
    return sum + quantity;
  }, 0);
}

export default async function ParceiroPedidosPage() {
  const { supabase, sellerId } = await getPartnerPortalAccess({ requirePartner: true });

  if (!sellerId) {
    return (
      <div className="mx-auto w-full max-w-5xl px-6 py-10">
        <p className="text-sm text-bpGraphite/80">Finalize o onboarding para acessar pedidos.</p>
      </div>
    );
  }

  const { data } = await supabase
    .from("sub_orders")
    .select("id,order_id,status,created_at,product_total_cents,shipping_total_cents,items")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false })
    .limit(50);

  const rows = (data ?? []) as SubOrderRow[];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Pedidos</p>
          <h1 className="mt-2 font-display text-4xl text-bpBlack">Fluxo de envio por item</h1>
        </div>
        <Link
          href="/seller/orders"
          className="rounded-full border border-black/15 px-5 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-bpBlackSoft"
        >
          Operacao completa
        </Link>
      </div>

      <div className="space-y-3">
        {rows.length ? (
          rows.map((row) => (
            <div key={row.id} className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-bpBlack">Pedido {row.order_id.slice(0, 8)}...</p>
                <p className="text-xs uppercase tracking-[0.25em] text-bpGraphite/70">{row.status ?? "created"}</p>
              </div>
              <p className="mt-2 text-sm text-bpGraphite/80">
                Itens {getItemsCount(row.items)} • Produtos {formatPrice((row.product_total_cents ?? 0) / 100)} • Frete{" "}
                {formatPrice((row.shipping_total_cents ?? 0) / 100)}
              </p>
              <p className="mt-2 text-xs text-bpGraphite/70">
                {row.created_at
                  ? new Date(row.created_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric"
                    })
                  : "Data indisponivel"}
              </p>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-black/10 bg-white p-6 text-sm text-bpGraphite/80">
            Ainda sem pedidos recebidos.
          </div>
        )}
      </div>
    </div>
  );
}

