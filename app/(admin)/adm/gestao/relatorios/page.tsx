import { ReportsPage } from "@/components/adm/pages/ReportsPage";
import { resolveAdmListRoute, type AdmListRouteProps } from "@/lib/adm/route";

export default async function AdmReportsRoute({ searchParams }: AdmListRouteProps) {
  const { filters, params } = await resolveAdmListRoute(searchParams);
  return <ReportsPage filters={filters} searchParamsSource={params} />;
}
