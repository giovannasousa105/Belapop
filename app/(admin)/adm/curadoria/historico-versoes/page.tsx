import { CurationHistoryPage } from "@/components/adm/pages/CurationHistoryPage";
import { resolveAdmListRoute, type AdmListRouteProps } from "@/lib/adm/route";

export default async function AdmCurationHistoryRoute({ searchParams }: AdmListRouteProps) {
  const { filters, params } = await resolveAdmListRoute(searchParams);
  return <CurationHistoryPage filters={filters} searchParamsSource={params} />;
}
