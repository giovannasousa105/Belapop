import { ContentShelvesPage } from "@/components/adm/pages/ContentShelvesPage";
import { resolveAdmListRoute, type AdmListRouteProps } from "@/lib/adm/route";

export default async function AdmContentShelvesRoute({ searchParams }: AdmListRouteProps) {
  const { filters, params } = await resolveAdmListRoute(searchParams);
  return <ContentShelvesPage filters={filters} searchParamsSource={params} />;
}
