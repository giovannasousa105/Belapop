import { resolveFilters, type AdmFilters } from "@/lib/adm/url";

export type AdmRouteSearchParams = Promise<Record<string, string | string[] | undefined>>;

export type AdmListRouteProps = {
  searchParams?: AdmRouteSearchParams;
};

export async function resolveAdmListRoute(searchParams?: AdmRouteSearchParams): Promise<{
  params: Record<string, string | string[] | undefined>;
  filters: AdmFilters;
}> {
  const params = (await searchParams) ?? {};
  const filters = resolveFilters(params);

  return {
    params,
    filters
  };
}
