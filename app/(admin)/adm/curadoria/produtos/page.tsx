import { ProductsPage } from "@/components/adm/pages/ProductsPage";
import { resolveAdmListRoute, type AdmListRouteProps } from "@/lib/adm/route";

export default async function AdmCurationProductsRoute({ searchParams }: AdmListRouteProps) {
  const { params, filters } = await resolveAdmListRoute(searchParams);
  return <ProductsPage filters={filters} searchParamsSource={params} />;
}
