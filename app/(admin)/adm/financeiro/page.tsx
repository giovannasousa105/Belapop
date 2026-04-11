import { FinanceOverviewPage } from "@/components/adm/pages/FinanceOverviewPage";
import { resolveAdmListRoute, type AdmListRouteProps } from "@/lib/adm/route";

export default async function AdmFinanceRoute({ searchParams }: AdmListRouteProps) {
  const { filters } = await resolveAdmListRoute(searchParams);
  return <FinanceOverviewPage filters={filters} />;
}
