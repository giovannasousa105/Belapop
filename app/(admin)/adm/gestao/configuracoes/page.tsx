import { SettingsPage } from "@/components/adm/pages/SettingsPage";
import { resolveAdmListRoute, type AdmListRouteProps } from "@/lib/adm/route";

export default async function AdmSettingsRoute({ searchParams }: AdmListRouteProps) {
  const { filters, params } = await resolveAdmListRoute(searchParams);
  return <SettingsPage filters={filters} searchParamsSource={params} />;
}
