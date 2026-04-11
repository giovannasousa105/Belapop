import { RefundsPage } from "@/components/adm/pages/RefundsPage";
import { resolveAdmListRoute, type AdmListRouteProps } from "@/lib/adm/route";

export default async function AdmRefundsRoute({ searchParams }: AdmListRouteProps) {
  const { params, filters } = await resolveAdmListRoute(searchParams);
  return <RefundsPage filters={filters} searchParamsSource={params} />;
}
