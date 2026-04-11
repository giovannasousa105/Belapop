import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getPreviewScreen, previewScreens } from "@/components/previews/belapop/data";
import { PreviewScreenRenderer } from "@/components/previews/belapop/screen-registry";

type PreviewScreenPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return previewScreens.map((screen) => ({ slug: screen.slug }));
}

export async function generateMetadata({
  params
}: PreviewScreenPageProps): Promise<Metadata> {
  const { slug } = await params;
  const screen = getPreviewScreen(slug);

  if (!screen) {
    return {
      title: "Preview | BelaPop"
    };
  }

  return {
    title: `${screen.title} | Preview BelaPop`,
    description: screen.description
  };
}

export default async function PreviewScreenPage({ params }: PreviewScreenPageProps) {
  const { slug } = await params;
  const screen = getPreviewScreen(slug);

  if (!screen) {
    notFound();
  }

  return <PreviewScreenRenderer slug={screen.slug} />;
}
