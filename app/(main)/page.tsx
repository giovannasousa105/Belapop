import type { Metadata } from "next";
import { redirect } from "next/navigation";

import BelaPopLuxuryHomepage from "@/components/home/BelaPopLuxuryHomepage";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  firstSearchParam,
  hasOAuthFailureParams,
  HOME_PAGE_DESCRIPTION,
  resolveAudienceParam,
  type SearchParamValue
} from "@/lib/home/publicHome";
import { getPublicProducts } from "@/lib/queries/products";
import { gerarOrganizationSchema, gerarWebSiteSchema } from "@/lib/seo/structuredData";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://belapopoficial.com.br";

export const revalidate = 120;

type HomePageProps = {
  searchParams?: Promise<Record<string, SearchParamValue>>;
};

export const metadata: Metadata = {
  title: "BelaPop | Skincare guiado pela sua pele",
  description: HOME_PAGE_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: "BelaPop | Skincare guiado pela sua pele",
    description: HOME_PAGE_DESCRIPTION,
    url: "/",
    siteName: "BelaPop",
    images: [{ url: "/og-home.jpg", width: 1200, height: 630, alt: "BelaPop — Skincare guiado pela sua pele" }],
    videos: [{
      url: "https://belapopoficial.com.br/editorial/belapop-skin-scan-hero-mobile.webm",
      type: "video/webm",
      width: 1080,
      height: 1920
    }],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "BelaPop | Skincare guiado pela sua pele",
    description: HOME_PAGE_DESCRIPTION,
    images: ["/og-home.jpg"]
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

  const featuredProducts = await getPublicProducts(4);

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: featuredProducts.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: product.title,
      url: `${BASE_URL}/produto/${product.slug}`,
    })),
  };

  return (
    <>
<JsonLd schema={[gerarOrganizationSchema(), gerarWebSiteSchema(), itemListSchema]} />
      <BelaPopLuxuryHomepage featuredProducts={featuredProducts} />
    </>
  );
}
