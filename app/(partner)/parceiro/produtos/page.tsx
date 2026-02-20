import Link from "next/link";

import { getPartnerPortalAccess } from "@/lib/auth/partnerPortal";
import { formatPrice } from "@/lib/utils";

type ProductRow = {
  id: string;
  title: string | null;
  name: string | null;
  slug: string | null;
  status: string | null;
  price_cents: number | null;
  editorial_reason: string | null;
  ritual: string | null;
  sensation: string[] | null;
};

export default async function ParceiroProdutosPage() {
  const { supabase, sellerId } = await getPartnerPortalAccess({ requirePartner: true });

  if (!sellerId) {
    return (
      <div className="mx-auto w-full max-w-5xl px-6 py-10">
        <p className="text-sm text-bpGraphite/80">Finalize o onboarding para publicar produtos.</p>
      </div>
    );
  }

  const { data } = await supabase
    .from("products")
    .select("id,title,name,slug,status,price_cents,editorial_reason,ritual,sensation")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as ProductRow[];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Produtos</p>
          <h1 className="mt-2 font-display text-4xl text-bpBlack">Catalogo do parceiro</h1>
          <p className="mt-2 text-sm text-bpGraphite/80">
            Produtos entram em <strong>active</strong> apenas apos aprovacao da curadoria admin.
          </p>
        </div>
        <Link
          href="/seller/products/new"
          className="rounded-full bg-bpPink px-5 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-white"
        >
          Novo produto
        </Link>
      </div>

      <div className="space-y-3">
        {rows.length ? (
          rows.map((row) => (
            <div key={row.id} className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-bpBlack">
                    {row.title ?? row.name ?? "Produto sem titulo"}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.25em] text-bpGraphite/70">
                    {row.status ?? "draft"}
                  </p>
                </div>
                <p className="text-sm font-semibold text-bpBlack">
                  {formatPrice((row.price_cents ?? 0) / 100)}
                </p>
              </div>
              <p className="mt-2 text-sm text-bpGraphite/80">
                {row.editorial_reason ?? "Adicione o motivo curatorial para aprovacao."}
              </p>
              <p className="mt-2 text-xs text-bpGraphite/70">
                Ritual: {row.ritual ?? "Nao definido"} • Sensacoes: {(row.sensation ?? []).join(", ") || "Nao definido"}
              </p>
              <div className="mt-3">
                <Link
                  href={`/seller/products/${row.id}/edit`}
                  className="rounded-full border border-black/15 px-4 py-2 text-xs uppercase tracking-[0.25em] text-bpBlackSoft"
                >
                  Editar produto
                </Link>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-black/10 bg-white p-6 text-sm text-bpGraphite/80">
            Ainda em edicao. Crie seu primeiro produto em draft para iniciar a curadoria.
          </div>
        )}
      </div>
    </div>
  );
}
