// ─── Tipos do Catálogo BelaPop ────────────────────────────────────────────────

export type UniversoCatalogo =
  | 'rosto'
  | 'corpo'
  | 'cabelo'
  | 'perfumaria'
  | 'wellness';

export type OrdenacaoBusca =
  | 'relevancia'
  | 'preco_asc'
  | 'preco_desc'
  | 'mais_vendidos'
  | 'melhor_avaliados';

// ─── DTO de produto no card ──────────────────────────────────────────────────

export interface ProdutoCardDTO {
  id: string;
  name: string;
  brand: string | null;
  price_cents: number;
  images: string[];
  universo: UniversoCatalogo | null;
  necessidades: string[];
  tipo_pele_indicado: string[];
  nivel_sensibilidade_max: number;
  passo_rotina: string | null;
  periodo: string | null;
  total_vendas_30d: number;
  rating_medio: number;
  total_avaliacoes: number;
  curated: boolean;
  is_featured: boolean;
  stock_quantity: number;
  compat_score: number | null;  // 0-100, null se sem skin profile
  na_wishlist: boolean;
}

// ─── DTO de detalhe de produto ───────────────────────────────────────────────

export interface ProdutoDetalheDTO extends ProdutoCardDTO {
  description: string | null;
  highlights: string[];
  ativos_principais: string[];
  duracao_media_dias: number;
  seller_id: string | null;
  status: string;
  avaliacoes_recentes: AvaliacaoDTO[];
}

// ─── Filtros de busca ────────────────────────────────────────────────────────

export interface FiltrosBusca {
  query?: string;
  universo?: UniversoCatalogo;
  necessidades?: string[];
  tipo_pele?: string[];
  sensibilidade_max?: number;
  passo_rotina?: string;
  periodo?: string;
  preco_min?: number;
  preco_max?: number;
  curated?: boolean;
  ordenacao?: OrdenacaoBusca;
  pagina?: number;
  por_pagina?: number;
}

// ─── Resultado de busca paginado ─────────────────────────────────────────────

export interface ResultadoBusca {
  itens: ProdutoCardDTO[];
  total: number;
  pagina: number;
  por_pagina: number;
  total_paginas: number;
}

// ─── Wishlist ────────────────────────────────────────────────────────────────

export interface WishlistItem {
  id: string;
  product_id: string;
  compat_score: number | null;
  tipo_pele: string | null;
  criado_em: string;
  produto: ProdutoCardDTO | null;
}

// ─── Avaliações ──────────────────────────────────────────────────────────────

export interface AvaliacaoDTO {
  id: string;
  user_id: string;
  nota: number;
  titulo: string | null;
  texto: string | null;
  tipo_pele: string | null;
  compat_score: number | null;
  criado_em: string;
}

export interface CriarAvaliacaoInput {
  product_id: string;
  nota: number;        // 1-5
  titulo?: string;
  texto?: string;
  tipo_pele?: string;
  compat_score?: number;
}

// ─── Row bruto do fn_buscar_produtos ─────────────────────────────────────────

export interface BuscarProdutosRow {
  id: string;
  name: string | null;
  brand: string | null;
  price_cents: number | null;
  images: unknown;
  universo: string | null;
  necessidades: string[] | null;
  tipo_pele_indicado: string[] | null;
  nivel_sensibilidade_max: number | null;
  passo_rotina: string | null;
  periodo: string | null;
  total_vendas_30d: number | null;
  rating_medio: string | null;
  total_avaliacoes: number | null;
  curated: boolean | null;
  is_featured: boolean | null;
  stock_quantity: number | null;
  compat_score: number | null;
  na_wishlist: boolean | null;
  rank_score: number | null;
  total_count: string | null;
}
