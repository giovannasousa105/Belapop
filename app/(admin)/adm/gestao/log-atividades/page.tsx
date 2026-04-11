import { ActivityLogPage } from "@/components/adm/pages/ActivityLogPage";
import { resolveAdmListRoute, type AdmListRouteProps } from "@/lib/adm/route";

export default async function AdmActivityLogRoute({ searchParams }: AdmListRouteProps) {
  const { params, filters } = await resolveAdmListRoute(searchParams);
  return <ActivityLogPage filters={filters} searchParamsSource={params} />;
}
