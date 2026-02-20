import { SectionFrame } from "@/components/SectionFrame";
import { fetchAdminSettings } from "@/lib/admin/data";
import { LuxuryButton } from "@/components/LuxuryButton";

export default async function AdminSettingsPage() {
  const settings = await fetchAdminSettings();

  return (
    <div className="flex flex-col gap-6">
      <SectionFrame>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Configurações</p>
          <h1 className="font-display text-3xl text-bpBlack">Ajustes institucionais</h1>
          <p className="text-sm text-bpGraphite/80">
            Defina comissão padrão, banners ativos e variables estratégicas.
          </p>
        </div>
      </SectionFrame>

      <SectionFrame>
        <div className="flex items-center justify-between">
          <p className="text-sm text-bpGraphite/80">
            Volte aqui sempre que precisar ajustar comissão ou destacar banners.
          </p>
          <LuxuryButton variant="primary" href="/admin/settings/edit">
            Editar
          </LuxuryButton>
        </div>
        <div className="mt-4 space-y-3">
          {settings.map((row) => (
            <div
              key={row.key}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#F6D6E2] p-4"
            >
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">{row.key}</p>
                <p className="text-sm text-bpBlackSoft">{row.value}</p>
              </div>
              <LuxuryButton variant="secondary" href="/admin/settings/edit">
                Alterar
              </LuxuryButton>
            </div>
          ))}
          {settings.length === 0 && (
            <p className="text-sm text-bpGraphite/80">Nenhuma configuração registrada.</p>
          )}
        </div>
      </SectionFrame>
    </div>
  );
}
