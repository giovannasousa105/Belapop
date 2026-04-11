export const CURATION_KINDS = [
  "curation",
  "featured",
  "editorial",
  "trend",
  "experience",
  "brand"
] as const;

export type DiscoveryCollectionKind = (typeof CURATION_KINDS)[number];

export type DiscoveryCollectionAdminProduct = {
  id: string;
  slug: string;
  title: string;
  category: string | null;
  brand: string | null;
  priceCents: number;
  heroImageUrl: string | null;
  images: string[];
  status: string | null;
  createdAt: string | null;
  productScore: number | null;
};

export type DiscoveryCollectionAdminProductLink = {
  productId: string;
  position: number;
  editorialBoost: number;
  product: DiscoveryCollectionAdminProduct;
};

export type DiscoveryCollectionAdminRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  kind: DiscoveryCollectionKind;
  status: "draft" | "published" | "archived";
  coverImage: string | null;
  editorialBoost: number;
  trendBoost: number;
  publishedAt: string | null;
  productCount: number;
  products: DiscoveryCollectionAdminProductLink[];
};

export type DiscoveryCollectionKindMeta = {
  key: DiscoveryCollectionKind;
  label: string;
  description: string;
};

const KIND_META: Record<DiscoveryCollectionKind, DiscoveryCollectionKindMeta> = {
  curation: {
    key: "curation",
    label: "Curadoria BelaPop",
    description: "Bloco editorial principal da home e vitrines manuais da marca."
  },
  featured: {
    key: "featured",
    label: "Featured",
    description: "Colecoes de destaque com prioridade editorial adicional."
  },
  editorial: {
    key: "editorial",
    label: "Editorial",
    description: "Colecoes conectadas ao Diario e campanhas de leitura editorial."
  },
  trend: {
    key: "trend",
    label: "Tendencias Globais",
    description: "Temas de descoberta por tendencia usados na home publica."
  },
  experience: {
    key: "experience",
    label: "Experiencias",
    description: "Colecoes por ritual, mood e jornada de uso."
  },
  brand: {
    key: "brand",
    label: "Marcas",
    description: "Vitrines por marca e assinatura de seller/brand."
  }
};

export const getDiscoveryCollectionKindMeta = (kind: DiscoveryCollectionKind) => KIND_META[kind];
export const listDiscoveryCollectionKinds = (): DiscoveryCollectionKindMeta[] =>
  CURATION_KINDS.map((kind) => KIND_META[kind]);
