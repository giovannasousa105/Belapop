import { RiskPage } from "@/components/adm/pages/RiskPage";
import { resolveAdmListRoute, type AdmListRouteProps } from "@/lib/adm/route";

export default async function AdmRiskRoute({ searchParams }: AdmListRouteProps) {
  const { filters, params } = await resolveAdmListRoute(searchParams);
  return <RiskPage filters={filters} searchParamsSource={params} />;
}
