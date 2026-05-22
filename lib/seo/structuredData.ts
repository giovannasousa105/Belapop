import type { ProdutoSeoData } from "./seoTypes";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://belapopoficial.com.br";

// ── Product Schema ────────────────────────────────────────────────────────────

export function gerarProductSchema(produto: ProdutoSeoData): object {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type":    "Product",
    name:        produto.nome,
    description: produto.descricao,
    url:         `${BASE_URL}/produto/${produto.slug}`,
    image:       produto.imagens.slice(0, 5),
    brand: {
      "@type": "Brand",
      name:    produto.seller_nome,
    },
    offers: {
      "@type":       "Offer",
      priceCurrency: "BRL",
      price:         (produto.preco_centavos / 100).toFixed(2),
      availability:  produto.disponivel
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url:           `${BASE_URL}/produto/${produto.slug}`,
      seller: {
        "@type": "Organization",
        name:    "BelaPop",
      },
    },
  };

  if (produto.sku)      schema["sku"]      = produto.sku;
  if (produto.categoria) schema["category"] = produto.categoria;

  // Google exige mínimo de 3 avaliações para exibir rich snippet de rating
  if (produto.total_avaliacoes >= 3) {
    schema["aggregateRating"] = {
      "@type":      "AggregateRating",
      ratingValue:  produto.rating_medio.toFixed(1),
      ratingCount:  produto.total_avaliacoes,
      bestRating:   "5",
      worstRating:  "1",
    };
  }

  return schema;
}

// ── BreadcrumbList Schema ─────────────────────────────────────────────────────

export function gerarBreadcrumbSchema(
  items: Array<{ nome: string; url: string }>,
): object {
  return {
    "@context":      "https://schema.org",
    "@type":         "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type":   "ListItem",
      position:  index + 1,
      name:      item.nome,
      item:      item.url,
    })),
  };
}

// ── Organization Schema (homepage) ────────────────────────────────────────────

export function gerarOrganizationSchema(): object {
  return {
    "@context": "https://schema.org",
    "@type":    "Organization",
    name:        "BelaPop",
    url:         BASE_URL,
    logo:        `${BASE_URL}/logo.svg`,
    sameAs: [
      "https://instagram.com/belapop",
      "https://tiktok.com/@belapop",
    ],
    contactPoint: {
      "@type":             "ContactPoint",
      contactType:         "customer service",
      email:               "oi@belapop.com.br",
      availableLanguage:   "Portuguese",
    },
  };
}

// ── WebSite Schema (homepage — habilita search box no Google) ─────────────────

export function gerarWebSiteSchema(): object {
  return {
    "@context": "https://schema.org",
    "@type":    "WebSite",
    url:         BASE_URL,
    name:        "BelaPop",
    potentialAction: {
      "@type":       "SearchAction",
      target: {
        "@type":     "EntryPoint",
        urlTemplate: `${BASE_URL}/busca?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}
