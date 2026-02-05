import { SectionFrame } from "@/components/SectionFrame";
import { LuxuryButton } from "@/components/LuxuryButton";
import { StatusBadge } from "@/components/StatusBadge";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

async function getCoupons() {
  const res = await fetch(new URL("/api/admin/coupons", baseUrl).toString(), { cache: "no-store" });
  if (!res.ok) return { coupons: [] };
  return res.json();
}

export default async function CampaignsPage() {
  const { coupons } = await getCoupons();

  return (
    <div className="flex flex-col gap-8">
      <SectionFrame>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-noir-500">Campanhas</p>
            <h1 className="font-display text-3xl text-noir-950">Cupons e promoções</h1>
            <p className="text-sm text-noir-600">Gestão simples de cupons e status.</p>
          </div>
          <LuxuryButton tone="retail" href="#">Criar cupom</LuxuryButton>
        </div>
        <div className="mt-6 space-y-3">
          {coupons.map((c: any) => (
            <div key={c.id} className="flex items-center justify-between rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
              <div>
                <p className="text-sm font-semibold text-noir-900">{c.code}</p>
                <p className="text-xs text-noir-500">{c.discount_type ?? ""}</p>
              </div>
              <StatusBadge status={c.status ?? "active"} />
            </div>
          ))}
          {coupons.length === 0 && (
            <p className="text-sm text-noir-500">Nenhum cupom cadastrado.</p>
          )}
        </div>
      </SectionFrame>
    </div>
  );
}
