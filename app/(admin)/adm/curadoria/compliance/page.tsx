import { CompliancePage } from "@/components/adm/pages/CompliancePage";
import { resolveAdmListRoute, type AdmListRouteProps } from "@/lib/adm/route";

export default async function AdmCurationComplianceRoute({ searchParams }: AdmListRouteProps) {
  const { filters, params } = await resolveAdmListRoute(searchParams);
  return <CompliancePage filters={filters} searchParamsSource={params} />;
}
