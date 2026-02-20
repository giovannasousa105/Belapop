import { LuxuryButton } from "@/components/LuxuryButton";
import { SectionFrame } from "@/components/SectionFrame";
import { fetchSellers, AdminSellerRow } from "@/lib/admin/data";

const statusLabel = (status?: string | null) => {
  if (!status) return "Pendente";
  switch (status) {
    case "active":
      return "Ativo";
    case "paused":
      return "Pausado";
    case "rejected":
      return "Rejeitado";
    default:
      return status;
  }
};

export default async function AdminSellersPage() {
  const sellers = await fetchSellers();

  return (
    <div className="flex flex-col gap-6">
      <SectionFrame>
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Lojistas</p>
          <h1 className="font-display text-3xl text-bpBlack">Controle de contas</h1>
          <p className="text-sm text-bpGraphite/80">
            Aprovar, pausar ou reprovar lojistas com visão de CEP de origem e status.
          </p>
        </div>
      </SectionFrame>

      <SectionFrame>
        <div className="space-y-4">
          {sellers.map((seller) => (
            <div
              key={seller.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#F6D6E2] p-4"
            >
              <div>
                <p className="text-sm font-semibold text-bpBlackSoft">{seller.store_name}</p>
                <p className="text-xs text-bpGraphite/70">
                  CEP {seller.origin_zip ?? "—"} · {statusLabel(seller.status)}
                </p>
              </div>
              <div className="flex gap-2">
                <LuxuryButton variant="secondary" href={`/admin/sellers/${seller.id}`}>
                  Detalhes
                </LuxuryButton>
                <LuxuryButton variant="primary" href={`/admin/sellers/${seller.id}`}>
                  Aprovar
                </LuxuryButton>
              </div>
            </div>
          ))}
          {sellers.length === 0 && (
            <p className="text-sm text-bpGraphite/80">Nenhum lojista cadastrado.</p>
          )}
        </div>
      </SectionFrame>
    </div>
  );
}
