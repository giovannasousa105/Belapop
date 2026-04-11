export const HOME_PAGE_DESCRIPTION =
  "Interface de decisao em skincare com analise visual, curadoria com criterio e acompanhamento da rotina.";

export type SearchParamValue = string | string[] | undefined;

type HomeHeroProduct = {
  coverImage?: string | null;
  hero_image_url?: string | null;
};

type HomeCatalogData = {
  facets: {
    brands: string[];
    brandCounts: Record<string, number>;
  };
};

export type HomePartnerBrand = {
  name: string;
  count: number;
};

export function firstSearchParam(value: SearchParamValue) {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function resolveAudienceParam(value: string | undefined) {
  return value === "partner" ? "partner" : "customer";
}

export function hasOAuthFailureParams(params: Record<string, SearchParamValue>) {
  const rawError = firstSearchParam(params.error)?.toLowerCase() ?? "";
  const rawCode = firstSearchParam(params.error_code)?.toLowerCase() ?? "";
  const rawDescription = firstSearchParam(params.error_description)?.toLowerCase() ?? "";

  if (rawCode === "bad_oauth_state") return true;
  if (rawCode.includes("oauth")) return true;
  if (rawError.includes("oauth")) return true;
  if (rawDescription.includes("oauth")) return true;
  if (rawError === "access_denied") return true;
  return false;
}

export function resolveHomeHeroImage(products: HomeHeroProduct[]) {
  return products[0]?.coverImage ?? products[0]?.hero_image_url ?? "/editorial/ritual-noturno.svg";
}

export function buildHomePartnerBrands(catalogData: HomeCatalogData, limit = 6): HomePartnerBrand[] {
  return catalogData.facets.brands
    .slice(0, limit)
    .map((name) => ({
      name,
      count: catalogData.facets.brandCounts[name] ?? 0
    }))
    .filter((item) => Boolean(item.name));
}
