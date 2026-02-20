import { getPartnerPortalAccess } from "@/lib/auth/partnerPortal";
import { formatPrice } from "@/lib/utils";

type PayoutRow = {
  id: string;
  amount_cents: number | null;
  status: string | null;
  period_start: string | null;
  period_end: string | null;
  created_at: string | null;
};

export default async function ParceiroRepassePage() {
  const { supabase, sellerId } = await getPartnerPortalAccess({ requirePartner: true });

  if (!sellerId) {
    return (
      <div className="mx-auto w-full max-w-5xl px-6 py-10">
        <p className="text-sm text-bpGraphite/80">Finalize o onboarding para visualizar repasses.</p>
      </div>
    );
  }

  const [newModel, legacyModel] = await Promise.all([
    supabase
      .from("payouts")
      .select("id,amount_cents,status,period_start,period_end,created_at")
      .eq("partner_id", sellerId)
      .order("created_at", { ascending: false })
      .limit(24),
    supabase
      .from("payouts")
      .select("id,amount_cents,status,created_at")
      .eq("seller_id", sellerId)
      .order("created_at", { ascending: false })
      .limit(24)
  ]);

  const rows =
    ((newModel.data?.length ? newModel.data : legacyModel.data) as PayoutRow[] | null) ?? [];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-6 py-10">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Repasse</p>
        <h1 className="mt-2 font-display text-4xl text-bpBlack">Extrato por periodo</h1>
      </div>

      <div className="space-y-3">
        {rows.length ? (
          rows.map((row) => (
            <div key={row.id} className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-bpBlack">{formatPrice((row.amount_cents ?? 0) / 100)}</p>
                <p className="text-xs uppercase tracking-[0.25em] text-bpGraphite/70">{row.status ?? "pending"}</p>
              </div>
              <p className="mt-2 text-sm text-bpGraphite/80">
                Periodo: {row.period_start ?? "--"} ate {row.period_end ?? "--"}
              </p>
              <p className="mt-1 text-xs text-bpGraphite/70">
                Lancado em{" "}
                {row.created_at
                  ? new Date(row.created_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric"
                    })
                  : "--"}
              </p>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-black/10 bg-white p-6 text-sm text-bpGraphite/80">
            Ainda sem repasses contabilizados.
          </div>
        )}
      </div>
    </div>
  );
}

