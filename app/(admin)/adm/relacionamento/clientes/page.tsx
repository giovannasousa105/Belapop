import { CustomersPage } from "@/components/adm/pages/CustomersPage";
import { resolveAdmListRoute, type AdmListRouteProps } from "@/lib/adm/route";

export default async function AdmCustomersRoute({ searchParams }: AdmListRouteProps) {
  const { filters } = await resolveAdmListRoute(searchParams);
  return <CustomersPage filters={filters} />;
}
