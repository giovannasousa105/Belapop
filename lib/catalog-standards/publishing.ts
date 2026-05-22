import { ProductImageValidator } from "@/lib/catalog-standards/image";
import { normalizeProductName } from "@/lib/catalog-standards/naming";
import { ClaimValidator } from "@/lib/catalog-standards/claims";
import type {
  ProductPublishValidationResult,
  ProductSkuStandard,
  SellerStandardRecord,
  StandardIssue
} from "@/lib/catalog-standards/types";

const issue = (
  code: string,
  label: string,
  detail: string,
  field: string,
  severity: StandardIssue["severity"] = "critical"
): StandardIssue => ({
  code,
  detail,
  field,
  label,
  severity
});

const hasValue = (value: unknown) =>
  typeof value === "string" ? value.trim().length > 0 : value !== null && value !== undefined;

export function canPublishProduct(
  product: ProductSkuStandard,
  seller?: SellerStandardRecord | null
): ProductPublishValidationResult {
  const blockingIssues: StandardIssue[] = [];
  const warnings: StandardIssue[] = [];
  const naming = normalizeProductName(product.name, {
    activeOrDifferential: product.ingredients[0],
    brand: product.brand,
    line: product.line,
    productType: product.productType,
    volume: product.volume
  });
  const claims = ClaimValidator.validate(product.claims);
  const images = ProductImageValidator.validate(product.images);

  if (!product.images.some((image) => image.kind === "main" && hasValue(image.url))) {
    blockingIssues.push(issue("missing-main-image", "Imagem principal ausente", "SKU precisa de imagem principal antes da publicação.", "images"));
  }
  if (naming.blocked || !hasValue(product.normalizedName)) {
    blockingIssues.push(...naming.issues);
  }
  if (!hasValue(product.brand)) {
    blockingIssues.push(issue("missing-brand", "Marca ausente", "Informe a marca do produto.", "brand"));
  }
  if (!hasValue(product.category)) {
    blockingIssues.push(issue("missing-category", "Categoria ausente", "Informe categoria e subcategoria do SKU.", "category"));
  }
  if (!Number.isFinite(product.price) || product.price <= 0) {
    blockingIssues.push(issue("invalid-price", "Preco invalido", "Produto precisa de preco valido.", "price"));
  }
  if (!Number.isFinite(product.stock) || product.stock <= 0) {
    blockingIssues.push(issue("invalid-stock", "Estoque ausente", "Produto precisa de estoque disponivel para publicar.", "stock"));
  }
  if (!hasValue(product.mainBenefit)) {
    blockingIssues.push(issue("missing-main-benefit", "Beneficio principal ausente", "Informe o principal beneficio do SKU.", "mainBenefit"));
  }
  if (!hasValue(product.dispatchDeadline)) {
    blockingIssues.push(issue("missing-dispatch-deadline", "Prazo de envio ausente", "Informe prazo de postagem/envio.", "dispatchDeadline"));
  }
  if (!hasValue(product.returnPolicyId)) {
    blockingIssues.push(issue("missing-return-policy", "Política de devolucao ausente", "Vincule uma política de troca e devolucao.", "returnPolicyId"));
  }
  if (!seller || !["approved", "verified-belapop"].includes(seller.verificationStatus)) {
    blockingIssues.push(issue("seller-not-approved", "Seller não aprovado", "O seller precisa estar aprovado ou verificado BelaPop.", "sellerId"));
  }
  if (!["verified", "authentic-belapop"].includes(product.authenticity.standardStatus ?? product.authenticityStatus)) {
    blockingIssues.push(issue("authenticity-not-verified", "Autenticidade pendente", "Produto precisa ter autenticidade minima validada.", "authenticity"));
  }
  if (product.authenticity.invoiceRequired && !product.authenticity.invoiceAvailable) {
    blockingIssues.push(issue("invoice-not-available", "Nota fiscal pendente", "Produto precisa ter nota fiscal disponivel para publicar.", "authenticity"));
  }
  if (!product.packaging.protectedProduct || !product.packaging.leakProtection) {
    blockingIssues.push(issue("packaging-protection-missing", "Embalagem insuficiente", "Produto precisa estar protegido contra vazamento e quebra.", "packaging"));
  }
  if (product.packaging.invoiceIncluded === false || product.packaging.orderIdentification === false) {
    blockingIssues.push(issue("packaging-invoice-order-missing", "Identificacao de pedido pendente", "Embalagem precisa incluir nota fiscal e identificacao correta do pedido.", "packaging"));
  }
  if (!claims.isValid) {
    blockingIssues.push(...claims.issues.filter((item) => item.severity === "critical"));
  }
  if (!images.isValid) {
    blockingIssues.push(...images.alerts.filter((item) => item.severity === "critical"));
  }

  warnings.push(...naming.issues.filter((item) => item.severity !== "critical"));
  warnings.push(...claims.issues.filter((item) => item.severity !== "critical"));
  warnings.push(...images.alerts.filter((item) => item.severity !== "critical"));
  warnings.push(...product.validationAlerts.filter((item) => item.severity !== "critical"));
  if (product.packaging.cleanPackage === false || product.packaging.damagedBoxBlocked === false) {
    warnings.push(issue("packaging-presentation-review", "Apresentação de embalagem", "Revise limpeza e estado visual da embalagem.", "packaging", "warning"));
  }

  return {
    blockingIssues,
    canPublish: blockingIssues.length === 0,
    warnings
  };
}
