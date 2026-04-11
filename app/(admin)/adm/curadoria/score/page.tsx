import { QualityScorePage } from "@/components/adm/pages/QualityScorePage";
import { resolveAdmListRoute, type AdmListRouteProps } from "@/lib/adm/route";

export default async function AdmCurationScoreRoute({ searchParams }: AdmListRouteProps) {
  const { filters } = await resolveAdmListRoute(searchParams);
  return <QualityScorePage filters={filters} />;
}
