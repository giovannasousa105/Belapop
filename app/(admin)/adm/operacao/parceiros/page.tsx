import { SellersPage } from "@/components/adm/pages/SellersPage";
import { resolveAdmListRoute, type AdmListRouteProps } from "@/lib/adm/route";

export default async function AdmPartnersRoute({ searchParams }: AdmListRouteProps) {
  const { params, filters } = await resolveAdmListRoute(searchParams);
  return <SellersPage filters={filters} searchParamsSource={params} />;
}
