import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getDropBySlug } from "@/lib/drops/queries.server";
import { DropPdpClient } from "./DropPdpClient";

export const revalidate = 30;

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://belapopoficial.com.br";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const drop = await getDropBySlug(slug);

  if (!drop) {
    return { title: "Drop não encontrado — BelaPop" };
  }

  const firstImage = drop.items[0]?.product?.images?.[0];
  const description = drop.subtitle ?? "Lançamento exclusivo BelaPop — lote limitado, sem reposição.";

  return {
    title: `${drop.title} — Drop BelaPop`,
    description,
    openGraph: {
      title: `${drop.title} — Drop BelaPop`,
      description,
      url: `${BASE_URL}/drops/${slug}`,
      images: firstImage ? [{ url: firstImage }] : [],
      type: "website",
    },
    robots: drop.status === "draft" ? { index: false, follow: false } : undefined,
  };
}

export default async function DropPdpPage({ params }: Props) {
  const { slug } = await params;
  const drop = await getDropBySlug(slug);

  if (!drop) notFound();

  return <DropPdpClient drop={drop} />;
}
