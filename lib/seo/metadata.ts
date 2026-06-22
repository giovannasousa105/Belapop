import type { Metadata } from "next";

import type { ProdutoSeoData, UniversoSeoData, SkinIdSeoData } from "./seoTypes";

// NEXT_PUBLIC_SITE_URL é o nome da variável neste projeto
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://belapopoficial.com.br";

// ── Produto ───────────────────────────────────────────────────────────────────

export function gerarMetadataProduto(produto: ProdutoSeoData): Metadata {
  const titulo    = produto.nome;
  const descricao = construirDescricaoProduto(produto);
  const url       = `${BASE_URL}/produto/${produto.slug}`;
  const imagem_og = gerarOgImageProduto(produto);

  return {
    title:       titulo,
    description: descricao,

    alternates: {
      canonical: url,   // sem query params — evita duplicação por scan_id, ref, etc.
    },

    openGraph: {
      type:        "website",
      url,
      siteName:    "BelaPop",
      title:       `${titulo} · BelaPop`,
      description: descricao,
      images: [{
        url:    imagem_og,
        width:  1200,
        height: 630,
        alt:    `${produto.nome} — BelaPop`,
      }],
    },

    twitter: {
      card:        "summary_large_image",
      title:       `${titulo} · BelaPop`,
      description: descricao,
      images:      [imagem_og],
    },

    other: {
      "product:price:amount":   (produto.preco_centavos / 100).toFixed(2),
      "product:price:currency": "BRL",
      "product:availability":   produto.disponivel ? "instock" : "out of stock",
    },
  };
}

function construirDescricaoProduto(produto: ProdutoSeoData): string {
  const ativos        = produto.ativos_principais.slice(0, 3).join(", ");
  const disponivel    = produto.disponivel ? "Disponível agora" : "Lista de espera aberta";
  const base          = produto.descricao_curta || produto.descricao.slice(0, 100);
  const semVirgulas   = base.replace(/\.$/, "");

  const descricao = ativos
    ? `${semVirgulas}. Ativos: ${ativos}. ${disponivel}.`
    : `${semVirgulas}. Curadoria BelaPop. ${disponivel}.`;

  return descricao.slice(0, 160);   // Google trunca após 160 chars
}

function gerarOgImageProduto(produto: ProdutoSeoData): string {
  // Prioridade: OG Image dinâmica > variante editorial > imagem principal
  const nome   = encodeURIComponent(produto.nome);
  const preco  = (produto.preco_centavos / 100).toFixed(0);
  const imagem = encodeURIComponent(produto.imagem_principal);

  return `${BASE_URL}/api/og/produto?nome=${nome}&preco=${preco}&imagem=${imagem}`;
}

// ── Universo ──────────────────────────────────────────────────────────────────

export function gerarMetadataUniverso(
  universo: UniversoSeoData,
  opcoes?: { pagina?: number },
): Metadata {
  const url    = `${BASE_URL}/universo/${universo.slug}`;
  const titulo = `${universo.titulo} — Skincare Curado`;
  const desc   = universo.descricao.slice(0, 160);
  const pagina = opcoes?.pagina ?? 1;

  return {
    title:       universo.titulo,
    description: desc,
    // Canonical sempre aponta para página 1 sem filtros
    alternates: { canonical: url },
    // Páginas seguintes: noindex (evita duplicação de conteúdo paginado)
    robots: pagina > 1
      ? { index: false, follow: true }
      : { index: true,  follow: true },

    openGraph: {
      url,
      siteName:    "BelaPop",
      title:       `${titulo} · BelaPop`,
      description: desc,
      images: [{
        url:    universo.imagem || `${BASE_URL}/og-default.jpg`,
        width:  1200,
        height: 630,
        alt:    `${universo.titulo} — BelaPop`,
      }],
    },

    twitter: {
      card:        "summary_large_image",
      title:       `${titulo} · BelaPop`,
      description: desc,
      images:      [universo.imagem || `${BASE_URL}/og-default.jpg`],
    },
  };
}

// ── Skin ID público ───────────────────────────────────────────────────────────

export function gerarMetadataSkinId(data: SkinIdSeoData): Metadata {
  const url      = `${BASE_URL}/minha-pele/${data.skin_id}`;
  const titulo   = `Skin ID ${data.skin_id}`;
  const descricao =
    `Pele ${data.tipo_pele.toLowerCase()} · ` +
    `${data.total_scans} análises realizadas · BelaPop Skin Intelligence`;

  return {
    title:       titulo,
    description: descricao,
    alternates:  { canonical: url },
    // Perfis individuais não são indexados (privacidade)
    robots: { index: false, follow: false },
    openGraph: {
      url,
      siteName:    "BelaPop",
      title:       `${titulo} · BelaPop`,
      description: descricao,
      images: [{ url: `${BASE_URL}/og-default.jpg`, width: 1200, height: 630 }],
    },
  };
}

// ── Busca / Catálogo ──────────────────────────────────────────────────────────

export function gerarMetadataBusca(query?: string, universo?: string): Metadata {
  // Páginas de busca/filtro: noindex, follow
  // Cada combinação de filtros não vira URL indexada
  const titulo = query
    ? `Busca: "${query}"`
    : universo
    ? `${universo} — Buscar produtos`
    : "Catálogo BelaPop";

  return {
    title:  titulo,
    robots: { index: false, follow: true },
  };
}
