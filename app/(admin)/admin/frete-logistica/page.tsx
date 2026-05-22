import { LuxuryButton } from "@/components/LuxuryButton";
import { SectionFrame } from "@/components/SectionFrame";
import { fetchLogisticsAdminSnapshot } from "@/lib/logistics/settings";
import { requireRole } from "@/lib/auth/requireRole";

function formatDateTime(value: string | null | undefined) {
  if (!value) return "--";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "--";
  return parsed.toLocaleString("pt-BR");
}

export default async function AdminFreteLogisticaPage() {
  await requireRole(["admin"], {
    redirectTo: "/admin/login"
  });

  const snapshot = await fetchLogisticsAdminSnapshot();

  return (
    <div className="flex flex-col gap-6">
      <SectionFrame>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">
              Frete e logistica
            </p>
            <h1 className="font-display text-3xl text-bpBlack">Painel operacional do hub</h1>
            <p className="max-w-3xl text-sm text-bpGraphite/80">
              Visao central dos pedidos sincronizados, etiquetas, rastreios e status do
              provider ativo.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <span
              className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.2em] ${
                snapshot.runtime.mandabem.status === "connected"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : snapshot.runtime.mandabem.status === "invalid_token" ||
                      snapshot.runtime.mandabem.status === "auth_error"
                    ? "border-rose-200 bg-rose-50 text-rose-700"
                    : "border-amber-200 bg-amber-50 text-amber-700"
              }`}
            >
              {snapshot.runtime.activeProvider} • {snapshot.runtime.mandabem.status}
            </span>
            <LuxuryButton variant="secondary" href="/admin/settings">
              Configurar Manda Bem
            </LuxuryButton>
          </div>
        </div>
      </SectionFrame>

      <SectionFrame>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-black/10 bg-white p-4">
            <p className="text-[10px] uppercase tracking-[0.25em] text-bpGraphite/70">
              Provider
            </p>
            <p className="mt-3 font-display text-2xl text-bpBlack">
              {snapshot.runtime.activeProvider}
            </p>
          </div>
          <div className="rounded-2xl border border-black/10 bg-white p-4">
            <p className="text-[10px] uppercase tracking-[0.25em] text-bpGraphite/70">
              Pedidos sincronizados
            </p>
            <p className="mt-3 font-display text-2xl text-bpBlack">
              {snapshot.metrics.syncedOrders}
            </p>
          </div>
          <div className="rounded-2xl border border-black/10 bg-white p-4">
            <p className="text-[10px] uppercase tracking-[0.25em] text-bpGraphite/70">
              Etiquetas geradas
            </p>
            <p className="mt-3 font-display text-2xl text-bpBlack">
              {snapshot.metrics.labelsGenerated}
            </p>
          </div>
          <div className="rounded-2xl border border-black/10 bg-white p-4">
            <p className="text-[10px] uppercase tracking-[0.25em] text-bpGraphite/70">
              Rastreios ativos
            </p>
            <p className="mt-3 font-display text-2xl text-bpBlack">
              {snapshot.metrics.trackedShipments}
            </p>
          </div>
        </div>
      </SectionFrame>

      <SectionFrame>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="rounded-2xl border border-black/10 bg-white p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-bpGraphite/75">
              Status logistico
            </p>
            <div className="mt-4 space-y-3">
              {snapshot.statusBreakdown.length > 0 ? (
                snapshot.statusBreakdown.map((item) => (
                  <div
                    key={item.status}
                    className="flex items-center justify-between rounded-2xl border border-black/10 px-4 py-3 text-sm"
                  >
                    <span className="text-bpBlackSoft">{item.status}</span>
                    <span className="font-medium text-bpBlack">{item.count}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-bpGraphite/70">Nenhum status logistico ainda.</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-bpGraphite/75">
              Envios recentes
            </p>
            <div className="mt-4 space-y-3">
              {snapshot.recentShipments.length > 0 ? (
                snapshot.recentShipments.map((shipment) => (
                  <div
                    key={shipment.id}
                    className="rounded-2xl border border-[#F6D6E2] p-4 text-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium text-bpBlack">
                        Pedido {shipment.orderId.slice(0, 8)}
                      </span>
                      <span className="text-xs uppercase tracking-[0.18em] text-bpGraphite/70">
                        {shipment.status ?? "sem status"}
                      </span>
                    </div>
                    <p className="mt-2 text-bpGraphite/75">
                      {shipment.carrier ?? "Transportadora"} •{" "}
                      {shipment.trackingCode ?? "Sem rastreio"}
                    </p>
                    <p className="mt-1 text-xs text-bpGraphite/65">
                      Atualizado em {formatDateTime(shipment.updatedAt)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-bpGraphite/70">
                  Nenhum envio sincronizado para acompanhar.
                </p>
              )}
            </div>
          </div>
        </div>
      </SectionFrame>
    </div>
  );
}
