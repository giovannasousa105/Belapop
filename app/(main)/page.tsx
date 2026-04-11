import type { Metadata } from "next";
import { redirect } from "next/navigation";

import BelaPopLuxuryHomepage from "@/components/home/BelaPopLuxuryHomepage";
import {
  firstSearchParam,
  hasOAuthFailureParams,
  HOME_PAGE_DESCRIPTION,
  resolveAudienceParam,
  type SearchParamValue
} from "@/lib/home/publicHome";

export const revalidate = 120;

type HomePageProps = {
  searchParams?: Promise<Record<string, SearchParamValue>>;
};

export const metadata: Metadata = {
  title: "BelaPop | Skincare guiado pela sua pele",
  description: HOME_PAGE_DESCRIPTION,
  openGraph: {
    title: "BelaPop | Skincare guiado pela sua pele",
    description: HOME_PAGE_DESCRIPTION,
    images: [{ url: "/logo-dark.svg", alt: "BelaPop skincare guiado" }],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "BelaPop | Skincare guiado pela sua pele",
    description: HOME_PAGE_DESCRIPTION,
    images: ["/logo-dark.svg"]
  }
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = (await searchParams) ?? {};

  if (hasOAuthFailureParams(params)) {
    const audience = resolveAudienceParam(
      firstSearchParam(params.audience) ?? firstSearchParam(params.tab)
    );
    const reason =
      firstSearchParam(params.error_code) ?? firstSearchParam(params.error) ?? "oauth_failed";
    redirect(`/login?tab=${audience}&oauth_fallback=1&oauth_error=${encodeURIComponent(reason)}`);
  }

  return <BelaPopLuxuryHomepage />;
}
