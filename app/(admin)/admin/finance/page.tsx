import { SectionFrame } from "@/components/SectionFrame";
import { LuxuryButton } from "@/components/LuxuryButton";
import { MoneySummaryCard } from "@/components/admin/dashboard/MoneySummaryCard";
import { formatPrice } from "@/lib/utils";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

async function getFinance() {
  const res = await fetch(new URL("/api/admin/finance", baseUrl).toString(), { cache: "no-store" });
  if (!res.ok) return { receivable: 0, nextPayout: null, fees: 0, payouts: [] };
  return res.json();
}

export default async function FinancePage() {
  const data = await getFinance();

  return (
    <div className="flex flex-col gap-8">
      <SectionFrame>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Financeiro</p>
            <h1 className="font-display text-3xl text-bpBlack">Repasses e comissões</h1>
            <p className="text-sm text-bpGraphite/80">Visão simples de recebíveis e agenda de repasses.</p>
          </div>
          <LuxuryButton tone="retail" variant="secondary" href="#">Exportar CSV</LuxuryButton>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <MoneySummaryCard title="A receber" amount={formatPrice(data.receivable ?? 0)} badge="Hoje" />
          <MoneySummaryCard
            title="Próximo repasse"
            amount={data.nextPayout ? String(data.nextPayout) : "--"}
            subtitle={formatPrice(data.payouts?.[0]?.amount_cents ?? 0)}
          />
          <MoneySummaryCard title="Taxas estimadas" amount={formatPrice(data.fees ?? 0)} />
        </div>
      </SectionFrame>

      <SectionFrame>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Agenda</p>
            <h2 className="font-display text-xl text-bpBlack">Próximos repasses</h2>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {(data.payouts ?? []).map((p: any) => (
            <div key={p.id ?? p.scheduled_for ?? Math.random()} className="flex items-center justify-between rounded-2xl border border-black/10 bg-bpOffWhite px-3 py-2">
              <div className="text-sm text-bpBlackSoft">{p.scheduled_for ?? "Data"}</div>
              <div className="text-sm font-semibold text-bpBlackSoft">{formatPrice(p.amount_cents ?? 0)}</div>
              <div className="text-xs uppercase tracking-[0.2em] text-bpGraphite/70">{p.status ?? "scheduled"}</div>
            </div>
          ))}
          {(data.payouts ?? []).length === 0 && (
            <p className="text-sm text-bpGraphite/70">Nenhum repasse agendado.</p>
          )}
        </div>
      </SectionFrame>
    </div>
  );
}
