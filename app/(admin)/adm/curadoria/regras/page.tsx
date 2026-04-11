import { CurationRulesPage } from "@/components/adm/pages/CurationRulesPage";
import { resolveAdmListRoute, type AdmListRouteProps } from "@/lib/adm/route";

export default async function AdmCurationRulesRoute({ searchParams }: AdmListRouteProps) {
  const { filters, params } = await resolveAdmListRoute(searchParams);
  return <CurationRulesPage filters={filters} searchParamsSource={params} />;
}
