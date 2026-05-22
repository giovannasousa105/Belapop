// Tipos de dados SEO — interfaces para geração de metadata e structured data.

export interface ProdutoSeoData {
  nome:              string;
  descricao_curta:   string;
  descricao:         string;
  slug:              string;
  imagem_principal:  string;
  imagens:           string[];
  preco_centavos:    number;
  seller_nome:       string;
  rating_medio:      number;
  total_avaliacoes:  number;
  sku:               string | null;
  categoria:         string | null;
  ativos_principais: string[];
  disponivel:        boolean;
  qtd_disponivel:    number | null;
}

export interface UniversoSeoData {
  slug:      string;
  titulo:    string;
  descricao: string;
  imagem:    string;
}

export interface SkinIdSeoData {
  skin_id:      string;
  tipo_pele:    string;
  total_scans:  number;
}
