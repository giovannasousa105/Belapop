import { SellerCommunicationPage } from "@/components/adm/pages/SellerCommunicationPage";
import { resolveAdmListRoute, type AdmListRouteProps } from "@/lib/adm/route";

export default async function AdmSellerCommunicationRoute({ searchParams }: AdmListRouteProps) {
  const { filters, params } = await resolveAdmListRoute(searchParams);
  return <SellerCommunicationPage filters={filters} searchParamsSource={params} />;
}
