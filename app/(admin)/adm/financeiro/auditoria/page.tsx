import { AuditPage } from "@/components/adm/pages/AuditPage";
import { resolveAdmListRoute, type AdmListRouteProps } from "@/lib/adm/route";

export default async function AdmAuditRoute({ searchParams }: AdmListRouteProps) {
  const { params, filters } = await resolveAdmListRoute(searchParams);
  return <AuditPage filters={filters} searchParamsSource={params} />;
}
