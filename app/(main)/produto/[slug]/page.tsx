import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { JsonLd }                                            from "@/components/seo/JsonLd";
import { Breadcrumbs }                                       from "@/components/ui/Breadcrumbs";
import { ProductPdpPremiumMobile }                           from "@/components/product/ProductPdpPremiumMobile";
import { getProductStandardForProduct, getSellerStandardBySellerId } from "@/lib/catalog-standards/server";
import { getPublicProductById, getPublicProductBySlug }      from "@/lib/queries/products";
import { CATALOG_PRODUCTS }                                  from "@/lib/catalog-search";
import { PRODUCT_DETAILS }                                   from "@/lib/product-data";
import { gerarProductSchema, gerarBreadcrumbSchema }         from "@/lib/seo/structuredData";
import type { ProdutoSeoData }                               from "@/lib/seo/seoTypes";
import type { EditorialProduct }                             from "@/lib/queries/products";

export const revalidate = 300;

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://belapopoficial.com.br";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

async function resolveProduct(value: string) {
  const bySlug = await getPublicProductBySlug(value);
  if (bySlug) return bySlug;

  const byId = await getPublicProductById(value);
  if (byId) return byId;

  return null;
}

// Mapeia EditorialProduct → ProdutoSeoData para as funções de SEO
function toSeoData(product: EditorialProduct): ProdutoSeoData {
  const imagens = product.gallery.map((g) => g.url);
  const imagem_principal = imagens[0] ?? product.coverImage ?? "";
  const details = PRODUCT_DETAILS[product.slug] ?? null;

  return {
    nome:              product.title,
    descricao_curta:   details?.subtitulo ?? product.editorialReason ?? "",
    descricao:         details?.descricao ?? product.description ?? "",
    slug:              product.slug,
    imagem_principal,
    imagens:           imagens.length > 0 ? imagens : [product.coverImage ?? ""],
    preco_centavos:    product.price_cents,
    seller_nome:       product.sellerName ?? "BelaPop",
    rating_medio:      0,
    total_avaliacoes:  0,
    sku:               null,
    categoria:         product.category ?? null,
    ativos_principais:
      details?.ativos.slice(0, 5).map((ativo) => ativo.nome) ??
      product.result?.slice(0, 5) ??
      product.sensation?.slice(0, 5) ??
      [],
    disponivel:        product.sellerStatus === "active" || product.sellerStatus === "approved",
    qtd_disponivel:    null,
  };
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug }   = await params;
  const product    = await resolveProduct(slug);
  const details    = PRODUCT_DETAILS[product?.slug ?? slug];
  const catalogItem = CATALOG_PRODUCTS.find((item) => item.slug === (product?.slug ?? slug));

  if (!product || !details || !catalogItem) {
    return {
      title:       "Produto não encontrado",
      description: "Curadoria confiável para decisão em skincare.",
    };
  }

  const ativosSEO = details.ativos
    .slice(0, 3)
    .map((ativo) => ativo.nome)
    .join(", ");
  const priceSEO = catalogItem.price
    ? catalogItem.price.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2,
      })
    : "";
  const description = `${details.subtitulo} ${details.descricao.slice(0, 100)}. Ativos: ${ativosSEO}. ${priceSEO ? `A partir de ${priceSEO}. ` : ""}Frete gratis acima de R$ 350.`;
  const keywords = [
    catalogItem.name,
    ...catalogItem.keyActives,
    ...catalogItem.tags,
    ...catalogItem.skinTypes.map((skinType) => `pele ${skinType}`),
    "BelaPop",
    "skincare",
    `comprar ${catalogItem.name}`,
  ].join(", ");
  const url = `${BASE_URL}/produto/${catalogItem.slug}`;
  const ogUrl = `${BASE_URL}/api/og/produto?nome=${encodeURIComponent(catalogItem.name)}&slug=${encodeURIComponent(catalogItem.slug)}&subtitulo=${encodeURIComponent(details.subtitulo)}&categoria=${encodeURIComponent(catalogItem.category)}&preco=${encodeURIComponent(priceSEO)}`;

  return {
    title: `${catalogItem.name} - ${details.subtitulo} · BelaPop`,
    description: description.slice(0, 160),
    keywords,
    openGraph: {
      title: `${catalogItem.name} · BelaPop`,
      description: description.slice(0, 120),
      url,
      type: "website",
      images: [
        {
          url: ogUrl,
          width: 1200,
          height: 630,
          alt: `${catalogItem.name} - BelaPop`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${catalogItem.name} · BelaPop`,
      description: description.slice(0, 120),
      images: [ogUrl],
    },
    alternates: {
      canonical: url,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function ProdutoPage({ params }: ProductPageProps) {
  const { slug }   = await params;
  const product    = await resolveProduct(slug);

  if (!product) notFound();

  const productStandard = await getProductStandardForProduct(product);
  const sellerStandard  = await getSellerStandardBySellerId(productStandard.sellerId);

  const seoData = toSeoData(product);

  const productSchema    = gerarProductSchema(seoData);
  const breadcrumbSchema = gerarBreadcrumbSchema([
    { nome: "Início",   url: `${BASE_URL}/` },
    { nome: "Catálogo", url: `${BASE_URL}/catalogo` },
    { nome: product.title, url: `${BASE_URL}/produto/${product.slug}` },
  ]);

  return (
    <>
      <JsonLd schema={[productSchema, breadcrumbSchema]} />
      <div className="px-5 pt-[86px] pb-2 md:px-8 lg:pt-[94px]">
        <Breadcrumbs
          items={[
            { label: "Início", href: "/" },
            { label: "Catálogo", href: "/catalogo" },
            { label: product.title }
          ]}
        />
      </div>
      <ProductPdpPremiumMobile
        product={product}
        productStandard={productStandard}
        sellerStandard={sellerStandard}
      />
    </>
  );
}
