import { ReviewsPage } from "@/components/adm/pages/ReviewsPage";
import { resolveAdmListRoute, type AdmListRouteProps } from "@/lib/adm/route";

export default async function AdmReviewsRoute({ searchParams }: AdmListRouteProps) {
  const { params, filters } = await resolveAdmListRoute(searchParams);
  return <ReviewsPage filters={filters} searchParamsSource={params} />;
}
