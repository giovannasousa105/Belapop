import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";

import { CatalogoClientSearch } from "@/components/catalog/CatalogoClientSearch";
import { BelaPopValidatedFooter } from "@/components/luxury/BelaPopValidatedFooter";
import { BelaPopValidatedHeader } from "@/components/luxury/BelaPopValidatedHeader";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

type CatalogPageProps = {
  searchParams?: Promise<SearchParams>;
};

type HeaderSection = "skincare" | "maquiagem" | "cabelos" | "perfumes" | "skin-scan";

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function resolveCatalogSection(category: string | undefined): HeaderSection {
  switch ((category ?? "").toLowerCase()) {
    case "maquiagem": return "maquiagem";
    case "cabelos": return "cabelos";
    case "perfumes": return "perfumes";
    case "skincare":
    default: return "skincare";
  }
}

function resolveLiveCategoryRoute(category: string | undefined) {
  switch ((category ?? "").toLowerCase()) {
    case "skincare": return "/skincare";
    case "maquiagem": return "/maquiagem";
    case "cabelos": return "/cabelos";
    case "perfumes": return "/perfumes";
    default: return null;
  }
}

export async function generateMetadata({ searchParams }: CatalogPageProps): Promise<Metadata> {
  const params = (await searchParams) ?? {};
  const q = firstParam(params.q);

  return {
    title: q ? `${q} - Catalogo | BelaPop` : "Catalogo | BelaPop",
    description: "Catalogo BelaPop com busca por ativo, tipo de pele e necessidade.",
    openGraph: {
      title: q ? `${q} - Catalogo | BelaPop` : "Catalogo | BelaPop",
      description: "Catalogo BelaPop com busca por ativo, tipo de pele e necessidade.",
      url: "/catalogo",
      siteName: "BelaPop",
      images: [{ url: "/og-default.jpg", alt: "Catalogo BelaPop" }],
      type: "website",
    },
  };
}

export default async function CatalogoPage({ searchParams }: CatalogPageProps) {
  const params = (await searchParams) ?? {};
  const category = firstParam(params.categoria);
  const activeSection = resolveCatalogSection(category);

  const liveCategoryRoute = resolveLiveCategoryRoute(category);
  if (liveCategoryRoute) {
    redirect(liveCategoryRoute);
  }

  return (
    <div className="min-h-screen bg-white text-[#1c1b1b]" data-belapop-page="catalogo-public">
      <BelaPopValidatedHeader activeSection={activeSection} />
      <div className="pt-[78px] lg:pt-[86px]">
        <Suspense
          fallback={
            <div className="flex min-h-[60vh] items-center justify-center">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-black border-t-transparent" />
            </div>
          }
        >
          <CatalogoClientSearch />
        </Suspense>
      </div>
      <BelaPopValidatedFooter />
    </div>
  );
}
