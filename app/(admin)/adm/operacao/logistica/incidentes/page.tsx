import { LogisticsIncidentsPage } from "@/components/adm/pages/LogisticsIncidentsPage";
import { resolveAdmListRoute, type AdmListRouteProps } from "@/lib/adm/route";

export default async function AdmLogisticsIncidentsRoute({ searchParams }: AdmListRouteProps) {
  const { params, filters } = await resolveAdmListRoute(searchParams);
  return <LogisticsIncidentsPage filters={filters} searchParamsSource={params} />;
}
