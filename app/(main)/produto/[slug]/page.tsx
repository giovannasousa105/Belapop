import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { JsonLd }                                            from "@/components/seo/JsonLd";
import { ProductPdpPremiumMobile }                           from "@/components/product/ProductPdpPremiumMobile";
import { getProductStandardForProduct, getSellerStandardBySellerId } from "@/lib/catalog-standards/server";
import { getPublicProductById, getPublicProductBySlug }      from "@/lib/queries/products";
import { gerarMetadataProduto }                              from "@/lib/seo/metadata";
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

  return {
    nome:              product.title,
    descricao_curta:   product.editorialReason ?? "",
    descricao:         product.description     ?? "",
    slug:              product.slug,
    imagem_principal,
    imagens:           imagens.length > 0 ? imagens : [product.coverImage ?? ""],
    preco_centavos:    product.price_cents,
    seller_nome:       product.sellerName ?? "BelaPop",
    rating_medio:      0,   // não disponível nesta query
    total_avaliacoes:  0,
    sku:               null,
    categoria:         product.category ?? null,
    ativos_principais: product.result?.slice(0, 5) ?? product.sensation?.slice(0, 5) ?? [],
    disponivel:        product.sellerStatus === "active" || product.sellerStatus === "approved",
    qtd_disponivel:    null,
  };
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug }   = await params;
  const product    = await resolveProduct(slug);

  if (!product) {
    return {
      title:       "Produto não encontrado",
      description: "Curadoria confiável para decisão em skincare.",
    };
  }

  return gerarMetadataProduto(toSeoData(product));
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
      <ProductPdpPremiumMobile
        product={product}
        productStandard={productStandard}
        sellerStandard={sellerStandard}
      />
    </>
  );
}
