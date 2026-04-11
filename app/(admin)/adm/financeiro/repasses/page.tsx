import { PayoutsPage } from "@/components/adm/pages/PayoutsPage";
import { resolveAdmListRoute, type AdmListRouteProps } from "@/lib/adm/route";

export default async function AdmPayoutsRoute({ searchParams }: AdmListRouteProps) {
  const { params, filters } = await resolveAdmListRoute(searchParams);
  return <PayoutsPage filters={filters} searchParamsSource={params} />;
}
