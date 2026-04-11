import { CatalogIntelligencePage } from "@/components/adm/pages/CatalogIntelligencePage";
import { resolveAdmListRoute, type AdmListRouteProps } from "@/lib/adm/route";

export default async function AdmCatalogIntelligenceRoute({ searchParams }: AdmListRouteProps) {
  const { filters, params } = await resolveAdmListRoute(searchParams);
  return <CatalogIntelligencePage filters={filters} searchParamsSource={params} />;
}
