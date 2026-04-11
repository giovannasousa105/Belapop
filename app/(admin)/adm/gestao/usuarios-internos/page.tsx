import { InternalUsersPage } from "@/components/adm/pages/InternalUsersPage";
import { resolveAdmListRoute, type AdmListRouteProps } from "@/lib/adm/route";

export default async function AdmInternalUsersRoute({ searchParams }: AdmListRouteProps) {
  const { filters } = await resolveAdmListRoute(searchParams);
  return <InternalUsersPage filters={filters} />;
}
