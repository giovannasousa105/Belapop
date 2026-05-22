import type { Metadata } from "next";
import { Suspense }      from "react";

import { UniversoGrid }        from "@/components/catalogo/UniversoGrid";
import { gerarMetadataUniverso } from "@/lib/seo/metadata";

const UNIVERSO_LABELS: Record<string, string> = {
  rosto:      "Rosto",
  corpo:      "Corpo",
  cabelo:     "Cabelo",
  perfumaria: "Perfumaria",
  wellness:   "Wellness",
};

const UNIVERSO_DESCRICOES: Record<string, string> = {
  rosto:
    "Produtos de skincare para o rosto com curadoria clínica BelaPop. " +
    "Séruns, hidratantes, protetores solares e mais.",
  corpo:
    "Linha completa de produtos para o corpo — hidratação profunda, " +
    "firmeza e bem-estar.",
  cabelo:
    "Tratamentos capilares curados para todos os tipos de cabelo. " +
    "Máscaras, óleos e finalizadores.",
  perfumaria:
    "Fragrâncias de presença equilibrada e composição refinada, " +
    "selecionadas pela BelaPop.",
  wellness:
    "Produtos de bem-estar, aromaterapia e autocuidado para uma rotina " +
    "completa.",
};

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://belapopoficial.com.br";

type UniversoPageProps = {
  params: Promise<{ universo: string }>;
};

export async function generateMetadata({ params }: UniversoPageProps): Promise<Metadata> {
  const { universo } = await params;
  const label        = UNIVERSO_LABELS[universo] ?? universo;
  const descricao    = UNIVERSO_DESCRICOES[universo] ?? `Produtos de ${label} com curadoria BelaPop.`;

  return gerarMetadataUniverso({
    slug:      universo,
    titulo:    label,
    descricao,
    imagem:    `${BASE_URL}/og-default.jpg`,
  });
}

export default async function UniversoPage({ params }: UniversoPageProps) {
  const { universo } = await params;
  const label        = UNIVERSO_LABELS[universo] ?? universo;

  return (
    <Suspense>
      <UniversoGrid universo={universo} label={label} />
    </Suspense>
  );
}
