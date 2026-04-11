import { CurationMonitoringPage } from "@/components/adm/pages/CurationMonitoringPage";
import { resolveAdmListRoute, type AdmListRouteProps } from "@/lib/adm/route";

export default async function AdmCurationMonitoringRoute({ searchParams }: AdmListRouteProps) {
  const { filters, params } = await resolveAdmListRoute(searchParams);
  return <CurationMonitoringPage filters={filters} searchParamsSource={params} />;
}
