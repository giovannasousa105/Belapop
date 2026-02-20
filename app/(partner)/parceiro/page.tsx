import Link from "next/link";

import { getPartnerPortalAccess } from "@/lib/auth/partnerPortal";
import { formatPrice } from "@/lib/utils";

type CountRow = { count: number | null };

export default async function ParceiroOverviewPage() {
  const { supabase, sellerId } = await getPartnerPortalAccess({ requirePartner: true });

  if (!sellerId) {
    return (
      <div className="mx-auto w-full max-w-5xl px-6 py-14">
        <div className="rounded-3xl border border-black/10 bg-white p-8 shadow-sm">
          <p className="text-xs uppercase tracking-[0.35em] text-bpGraphite/70">Portal do Parceiro</p>
          <h1 className="mt-3 font-display text-4xl text-bpBlack">Complete seu onboarding</h1>
          <p className="mt-3 text-sm text-bpGraphite/80">
            Precisamos validar dados da marca antes da operacao.
          </p>
          <Link
            href="/parceiro/onboarding?status=pending"
            className="mt-6 inline-flex rounded-full bg-bpPink px-5 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-white"
          >
            Solicitar parceria
          </Link>
        </div>
      </div>
    );
  }

  const [
    { count: pedidosCount },
    { data: pedidosRows },
    { count: ativosCount },
    { count: pendenciasCount },
    { count: aprovacoesCount }
  ] = await Promise.all([
    supabase
      .from("sub_orders")
      .select("*", { count: "exact", head: true })
      .eq("seller_id", sellerId),
    supabase
      .from("sub_orders")
      .select("seller_net_cents")
      .eq("seller_id", sellerId)
      .limit(100),
    supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("seller_id", sellerId)
      .in("status", ["active", "published"]),
    supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("seller_id", sellerId)
      .in("status", ["draft", "review", "paused"]),
    supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("seller_id", sellerId)
      .eq("status", "review")
  ]);

  const receitaCents = (pedidosRows ?? []).reduce(
    (sum, row) => sum + Number(row.seller_net_cents ?? 0),
    0
  );

  const kpis = [
    { label: "Pedidos", value: String(pedidosCount ?? 0) },
    { label: "Receita", value: formatPrice(receitaCents / 100) },
    { label: "Itens ativos", value: String(ativosCount ?? 0) }
  ];

  const avisos = [
    { label: "Pendencias", value: String(pendenciasCount ?? 0) },
    { label: "Aprovacoes em fila", value: String(aprovacoesCount ?? 0) }
  ];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-6 py-10">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-bpGraphite/70">Portal do Parceiro</p>
        <h1 className="mt-2 font-display text-4xl text-bpBlack">Operacao premium, sem atrito.</h1>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">{kpi.label}</p>
            <p className="mt-3 text-3xl font-semibold text-bpBlack">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {avisos.map((item) => (
          <div key={item.label} className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">{item.label}</p>
            <p className="mt-3 text-2xl font-semibold text-bpBlack">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Link href="/parceiro/produtos" className="rounded-2xl border border-black/10 px-4 py-3 text-sm font-semibold text-bpBlackSoft">
          Gerenciar produtos
        </Link>
        <Link href="/parceiro/pedidos" className="rounded-2xl border border-black/10 px-4 py-3 text-sm font-semibold text-bpBlackSoft">
          Ver pedidos
        </Link>
        <Link href="/parceiro/repasse" className="rounded-2xl border border-black/10 px-4 py-3 text-sm font-semibold text-bpBlackSoft">
          Acompanhar repasses
        </Link>
        <Link href="/parceiro/suporte" className="rounded-2xl border border-black/10 px-4 py-3 text-sm font-semibold text-bpBlackSoft">
          Falar com suporte
        </Link>
      </div>
    </div>
  );
}
