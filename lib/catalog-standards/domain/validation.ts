import type { ProductSkuStandard, SellerStandardRecord } from "@/lib/catalog-standards/types";

const hasText = (value: string | null | undefined) => Boolean(value?.trim());

export function validateSellerStandardRecord(seller: SellerStandardRecord) {
  const issues: string[] = [];

  if (!hasText(seller.sellerId)) issues.push("seller_id ausente");
  if (!hasText(seller.brandName)) issues.push("nome comercial ausente");
  if (!hasText(seller.legalName)) issues.push("razao social ausente");
  if (!hasText(seller.cnpj)) issues.push("CNPJ ausente");
  if (!hasText(seller.contact.email)) issues.push("e-mail de contato ausente");
  if (!seller.shippingPolicy.postingSlaHours) issues.push("SLA de postagem ausente");
  if (!seller.returnPolicy.returnWindowDays) issues.push("janela de devolucao ausente");

  return issues;
}

export function validateProductSkuStandard(product: ProductSkuStandard) {
  const issues: string[] = [];

  if (!hasText(product.productId)) issues.push("product_id ausente");
  if (!hasText(product.sellerId)) issues.push("seller_id ausente");
  if (!hasText(product.normalizedName)) issues.push("nome padronizado ausente");
  if (!hasText(product.brand)) issues.push("marca ausente");
  if (!hasText(product.category)) issues.push("categoria ausente");
  if (!product.images.some((image) => image.kind === "main" && hasText(image.url))) {
    issues.push("imagem principal ausente");
  }
  if (!hasText(product.mainBenefit)) issues.push("beneficio principal ausente");
  if (!hasText(product.dispatchDeadline)) issues.push("prazo de envio ausente");
  if (!hasText(product.returnPolicyId)) issues.push("política de devolucao ausente");

  return issues;
}

export const isValidSellerStandardRecord = (seller: SellerStandardRecord) =>
  validateSellerStandardRecord(seller).length === 0;

export const isValidProductSkuStandard = (product: ProductSkuStandard) =>
  validateProductSkuStandard(product).length === 0;
