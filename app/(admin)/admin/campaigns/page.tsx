import { SectionFrame } from "@/components/SectionFrame";
import CampaignsManager from "@/components/admin/CampaignsManager";
import { fetchAdminCampaigns } from "@/lib/admin/campaignService";

export default async function CampaignsPage() {
  const campaigns = await fetchAdminCampaigns();

  return (
    <div className="flex flex-col gap-8">
      <SectionFrame>
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-bpGraphite/70">Campanhas</p>
          <h1 className="font-display text-3xl text-bpBlack">Anuncios e promocoes</h1>
          <p className="text-sm text-bpGraphite/80">
            Crie e opere campanhas promocionais com vigencia, publico e controle de ativacao.
          </p>
        </div>
        <CampaignsManager initialCampaigns={campaigns} />
      </SectionFrame>
    </div>
  );
}
