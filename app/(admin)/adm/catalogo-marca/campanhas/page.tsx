import { CampaignsPage } from "@/components/adm/pages/CampaignsPage";
import { resolveAdmListRoute, type AdmListRouteProps } from "@/lib/adm/route";

export default async function AdmCampaignsRoute({ searchParams }: AdmListRouteProps) {
  const { filters, params } = await resolveAdmListRoute(searchParams);
  return <CampaignsPage filters={filters} searchParamsSource={params} />;
}
