import { CriticalOrdersPage } from "@/components/adm/pages/CriticalOrdersPage";
import { resolveAdmListRoute, type AdmListRouteProps } from "@/lib/adm/route";

export default async function AdmCriticalOrdersRoute({ searchParams }: AdmListRouteProps) {
  const { params, filters } = await resolveAdmListRoute(searchParams);
  return <CriticalOrdersPage filters={filters} searchParamsSource={params} />;
}
