import { LogisticsPage } from "@/components/adm/pages/LogisticsPage";
import { resolveAdmListRoute, type AdmListRouteProps } from "@/lib/adm/route";

export default async function AdmLogisticsRoute({ searchParams }: AdmListRouteProps) {
  const { params, filters } = await resolveAdmListRoute(searchParams);
  return <LogisticsPage filters={filters} searchParamsSource={params} />;
}
