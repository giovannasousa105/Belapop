import { ALLOWED_CLAIMS, BLOCKED_CLAIM_TERMS } from "@/lib/catalog-standards/claims";
import { canPublishProduct } from "@/lib/catalog-standards/publishing";
import type {
  CatalogQualityStandardSnapshot,
  CatalogStandardDashboard,
  ProductSkuStandard,
  SellerStandardRecord
} from "@/lib/catalog-standards/types";

const countBy = <T>(items: T[], predicate: (item: T) => boolean) =>
  items.filter(predicate).length;

export const createSellerPolicies = (sellers: SellerStandardRecord[]) =>
  sellers.map((seller) => ({
    authenticity: seller.authenticityPolicy,
    returnPolicy: seller.returnPolicy,
    sellerId: seller.sellerId,
    shippingPolicy: seller.shippingPolicy
  }));

export const createVerificationStatuses = (products: ProductSkuStandard[]) =>
  products.map((product) => ({
    authenticity: product.authenticity.status,
    badges:
      product.authenticity.status === "verified"
        ? ["Produto Autentico", "Nota Fiscal Garantida", "Curadoria BelaPop"]
        : ["Revisao BelaPop"],
    productId: product.productId,
    sellerApproved: product.authenticity.approvedSeller
  }));

export function createCatalogStandardDashboard(
  sellers: SellerStandardRecord[],
  products: ProductSkuStandard[]
): CatalogStandardDashboard {
  const averageSellerScore =
    sellers.length > 0
      ? Math.round(sellers.reduce((total, seller) => total + seller.qualityScore, 0) / sellers.length)
      : 0;
  const productsBlockedForPublish = products.filter((product) => {
    const seller = sellers.find((item) => item.sellerId === product.sellerId);
    return !canPublishProduct(product, seller).canPublish;
  });

  return {
    claimControls: {
      blacklist: Array.from(BLOCKED_CLAIM_TERMS),
      whitelist: Array.from(ALLOWED_CLAIMS)
    },
    governancePillars: [
      "Padrao por Seller",
      "Padrao por SKU",
      "Controle de autenticidade",
      "Regras logisticas",
      "Regras visuais",
      "Regras de claims",
      "Regras de embalagem",
      "Score de qualidade"
    ],
    metrics: [
      {
        detail: "Sellers com termo, CNPJ, políticas ou auditoria pendentes.",
        id: "pending-sellers",
        label: "Sellers pendentes",
        status: "pending",
        value: String(countBy(sellers, (seller) => seller.status !== "approved"))
      },
      {
        detail: "Itens sem todos os campos editoriais, SEO, lote ou guia técnico.",
        id: "incomplete-skus",
        label: "SKUs incompletos",
        status: "review",
        value: String(countBy(products, (product) => product.missingFields.length > 0))
      },
      {
        detail: "Imagens com baixa resolucao, texto promocional, ratio irregular ou metadados ausentes.",
        id: "image-alerts",
        label: "Alertas de imagem",
        status: "review",
        value: String(countBy(products, (product) => product.validationAlerts.some((alert) => alert.field === "images")))
      },
      {
        detail: "Claims bloqueados ou fora da whitelist BelaPop.",
        id: "claim-alerts",
        label: "Claims invalidos",
        status: "blocked",
        value: String(countBy(products, (product) => product.validationAlerts.some((alert) => alert.field === "claims")))
      },
      {
        detail: "Produtos sem autenticidade final, NF, origem ou lote validado.",
        id: "auth-pending",
        label: "Autenticidade pendente",
        status: "pending",
        value: String(countBy(products, (product) => product.authenticity.status !== "verified"))
      },
      {
        detail: "Sellers sem envio premium, rastreio ou SLA consistente.",
        id: "shipping-policy-alerts",
        label: "Política de envio",
        status: "review",
        value: String(countBy(sellers, (seller) => !seller.shippingPolicy.premiumShipping || seller.shippingPolicy.postingSlaHours > 36))
      },
      {
        detail: "Sellers aprovados, verificados ou prontos para operar dentro do padrao.",
        id: "approved-sellers",
        label: "Sellers aprovados",
        status: "approved",
        value: String(countBy(sellers, (seller) => ["approved", "verified-belapop"].includes(seller.verificationStatus)))
      },
      {
        detail: "Sellers reprovados ou suspensos ate recompor documentacao e qualidade.",
        id: "rejected-sellers",
        label: "Sellers reprovados",
        status: "blocked",
        value: String(countBy(sellers, (seller) => ["rejected", "suspended"].includes(seller.verificationStatus)))
      },
      {
        detail: "Produtos que não passam em imagem, naming, seller, política, estoque ou autenticidade.",
        id: "blocked-products",
        label: "Produtos bloqueados",
        status: "blocked",
        value: String(productsBlockedForPublish.length)
      },
      {
        detail: "Media consolidada de envio, reclamacoes, resposta, catalogo, visual e confiabilidade.",
        id: "average-seller-score",
        label: "Score medio por seller",
        status: averageSellerScore >= 85 ? "approved" : "review",
        value: `${averageSellerScore}/100`
      }
    ],
    operationalAlerts: [
      "SKU com claim proibido deve voltar para rascunho antes de qualquer destaque comercial.",
      "Seller com SLA acima de 36h perde selo Envio Premium ate recompor histórico.",
      "Produto sem NF ou origem declarada não recebe badge Produto Autentico.",
      "Imagem principal com texto promocional deve ser substituida por packshot limpo."
    ]
  };
}

export function createCatalogQualityStandardSnapshot(
  sellers: SellerStandardRecord[],
  products: ProductSkuStandard[]
): CatalogQualityStandardSnapshot {
  return {
    architectureName: "BelaPop Quality Standard",
    dashboard: createCatalogStandardDashboard(sellers, products),
    policies: createSellerPolicies(sellers),
    products,
    sellers,
    verificationStatuses: createVerificationStatuses(products)
  };
}
