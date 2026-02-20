import { SectionFrame } from "@/components/SectionFrame";
import { StatusBadge } from "@/components/StatusBadge";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

async function getTickets() {
  const res = await fetch(new URL("/api/admin/support", baseUrl).toString(), { cache: "no-store" });
  if (!res.ok) return { tickets: [] };
  return res.json();
}

export default async function SupportPage() {
  const { tickets } = await getTickets();

  return (
    <div className="flex flex-col gap-8">
      <SectionFrame>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Suporte</p>
            <h1 className="font-display text-3xl text-bpBlack">Tickets / ocorrências</h1>
            <p className="text-sm text-bpGraphite/80">SLA visível e ações rápidas.</p>
          </div>
        </div>
        <div className="mt-6 space-y-3">
          {tickets.map((t: any) => (
            <div
              key={t.id}
              className="flex items-center justify-between rounded-2xl border border-black/10 bg-white p-4 shadow-sm"
            >
              <div>
                <p className="text-sm font-semibold text-bpBlackSoft">Ticket {t.id}</p>
                <p className="text-xs text-bpGraphite/70">Pedido: {t.order_id ?? "-"}</p>
              </div>
              <StatusBadge status={t.status ?? "open"} />
            </div>
          ))}
          {tickets.length === 0 && <p className="text-sm text-bpGraphite/70">Nenhum ticket encontrado.</p>}
        </div>
      </SectionFrame>
    </div>
  );
}
