import { DocumentsPage } from "@/components/adm/pages/DocumentsPage";
import { resolveAdmListRoute, type AdmListRouteProps } from "@/lib/adm/route";

export default async function AdmCurationDocumentsRoute({ searchParams }: AdmListRouteProps) {
  const { params, filters } = await resolveAdmListRoute(searchParams);
  return <DocumentsPage filters={filters} searchParamsSource={params} />;
}
