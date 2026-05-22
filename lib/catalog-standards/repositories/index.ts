import "server-only";

import { unstable_cache } from "next/cache";

import { belapopContact } from "@/lib/brand/contact";
import { hasUsableCatalogStandardSnapshot } from "@/lib/catalog-standards/adapters/snapshot";
import { resolveProductStandardForProduct, resolveSellerStandard } from "@/lib/catalog-standards/mock";
import { fallbackCatalogStandardsRepository } from "@/lib/catalog-standards/repositories/fallback";
import { createSupabaseCatalogStandardsRepository } from "@/lib/catalog-standards/supabase/repository";
import type {
  CatalogQualityStandardSnapshot,
  ProductSkuStandard,
  SellerStandardRecord
} from "@/lib/catalog-standards/types";

type ProductStandardLookupInput = {
  brand?: string | null;
  category?: string | null;
  id?: string | null;
  price?: number | null;
  price_cents?: number | null;
  sellerId?: string | null;
  title?: string | null;
};

const SUPABASE_CACHE_KEY = ["belapop-quality-standard", "supabase-snapshot-v1"];
const CATALOG_STANDARD_SEED_FALLBACK_ENABLED = process.env.NODE_ENV !== "production";

const getSupabaseSnapshotCached = unstable_cache(
  async () => createSupabaseCatalogStandardsRepository().getSnapshot(),
  SUPABASE_CACHE_KEY,
  {
    revalidate: 300,
    tags: ["belapop-quality-standard", "catalog-standards"]
  }
);

const shouldLogRepositoryFallback = () =>
  process.env.NODE_ENV !== "test" && process.env.BELAPOP_QUALITY_STANDARD_LOG_FALLBACK === "1";

const emptyCatalogStandardSnapshot = (): CatalogQualityStandardSnapshot => ({
  architectureName: "BelaPop Quality Standard",
  dashboard: {
    claimControls: {
      blacklist: [],
      whitelist: []
    },
    governancePillars: [],
    metrics: [],
    operationalAlerts: ["Catalog standards em revisao no Supabase."]
  },
  policies: [],
  products: [],
  sellers: [],
  verificationStatuses: []
});

async function getFallbackSnapshot() {
  if (!CATALOG_STANDARD_SEED_FALLBACK_ENABLED) {
    return emptyCatalogStandardSnapshot();
  }
  return fallbackCatalogStandardsRepository.getSnapshot();
}

const buildPendingSellerStandard = (
  sellerId: string | null | undefined
): SellerStandardRecord => {
  const normalizedSellerId = sellerId?.trim() || "unknown";

  return {
    authenticityPolicy: {
      batchControl: "when-available",
      complianceHistory: [],
      invoiceRequired: true,
      manualApprovalRequired: true,
      originDescription: "Procedencia acompanhada pela curadoria BelaPop.",
      summary: "Seller em revisao pela curadoria BelaPop."
    },
    bannerUrl: "/catalog/premium-product-placeholder.svg",
    brandName: "Seller em revisao BelaPop",
    brandsSold: [],
    categoriesServed: [],
    category: "Marketplace",
    cnpj: "",
    commercialResponsible: "Curadoria BelaPop",
    contact: {
      email: belapopContact.supportEmail,
      name: "Atendimento BelaPop",
      phone: ""
    },
    history: {
      incidents90d: 0,
      lastAuditAt: "",
      notes: ["Padrao de seller não encontrado no Supabase."],
      returnRatePct: 0
    },
    id: `pending-seller-standard-${normalizedSellerId}`,
    institutionalDescription: "Seller acompanhado pelos critérios de qualidade BelaPop.",
    invoiceIssuanceConfirmed: false,
    legalName: "Seller em revisao BelaPop",
    logoUrl: "/catalog/premium-product-placeholder.svg",
    mainCategory: "Marketplace",
    packagingPolicy: "Política de embalagem acompanhada pela curadoria BelaPop.",
    productAuthenticityConfirmed: false,
    qualityScore: 0,
    region: "Brasil",
    responsibilityTermAcceptedAt: null,
    returnPolicy: {
      exchangeRules: "Trocas seguem a política BelaPop e as informações do pedido.",
      fullPolicyHref: "/trocas-e-devoluções",
      id: `return-pending-${normalizedSellerId}`,
      remorseRules: "Arrependimento em ate 7 dias conforme política da plataforma.",
      returnWindowDays: 7,
      reverseLogistics: "Logistica reversa definida pelo atendimento BelaPop.",
      summary: "Política BelaPop aplicada ao pedido.",
      supportChannel: belapopContact.supportEmail
    },
    scoreBreakdown: {
      catalogQuality: 0,
      complaints: 0,
      reliability: 0,
      responseTime: 0,
      returnRate: 0,
      reviews: 0,
      shipment: 0,
      visualStandardization: 0
    },
    sellerId: normalizedSellerId,
    shippingOriginAddress: "Origem informada no checkout",
    shippingPolicy: {
      averageDeliveryDays: "Prazo calculado no checkout",
      carrierMethod: "Transportadora parceira",
      coverageRegions: ["Brasil"],
      freightRules: "Frete validado no checkout conforme endereco e seller.",
      id: `shipping-pending-${normalizedSellerId}`,
      preparationCopy: "Prazo confirmado no checkout.",
      postingSlaHours: 48,
      premiumShipping: false,
      trackingRequired: true
    },
    status: "review",
    verificationBadges: [],
    verificationStatus: "in-review"
  };
};

const buildPendingProductStandard = (
  product: ProductStandardLookupInput
): ProductSkuStandard => {
  const normalizedProductId = product.id?.trim() || "unknown-product";
  const normalizedSellerId = product.sellerId?.trim() || "unknown";
  const price =
    typeof product.price === "number"
      ? product.price
      : typeof product.price_cents === "number"
        ? product.price_cents / 100
        : 0;

  return {
    authenticity: {
      approvedSeller: false,
      batchControl: "pending",
      invoiceAvailable: false,
      invoiceRequired: true,
      origin: "Procedencia em revisao pela curadoria BelaPop.",
      proofAvailable: false,
      responsibleValidator: "Qualidade BelaPop",
      standardStatus: "in-review",
      status: "pending"
    },
    authenticityStatus: "in-review",
    brand: product.brand?.trim() || "BelaPop",
    category: product.category?.trim() || "Produto",
    claims: [],
    dispatchDeadline: "Prazo calculado no checkout",
    id: `pending-product-standard-${normalizedProductId}`,
    images: [],
    ingredients: [],
    internalSku: `review-${normalizedProductId}`,
    mainBenefit: "Informacoes acompanhadas pela curadoria BelaPop.",
    missingFields: ["catalog-standard"],
    name: product.title?.trim() || "Produto em revisao BelaPop",
    needs: [],
    normalizedName: product.title?.trim() || "Produto em revisao BelaPop",
    origin: "Origem informada no checkout",
    packaging: {
      cleanPackage: false,
      cleanPresentation: false,
      damagedBoxBlocked: true,
      invoiceIncluded: false,
      orderIdentification: true,
      leakProtection: false,
      premiumIdentity: false,
      protectedProduct: false,
      sealedWhenApplicable: false,
      thankYouCardOptional: false,
      unboxingScore: 0
    },
    price,
    productId: normalizedProductId,
    productType: "Produto",
    qualityLevel: "attention",
    qualityScore: 0,
    returnPolicyId: `return-pending-${normalizedSellerId}`,
    returnPolicySummary: "Política BelaPop aplicada ao pedido e detalhada no checkout.",
    secondaryBenefits: [],
    sellerId: normalizedSellerId,
    seo: {
      description: "Informacoes acompanhadas pela curadoria BelaPop.",
      slug: normalizedProductId,
      title: product.title?.trim() || "Produto em revisao BelaPop"
    },
    skinTypes: [],
    status: "review",
    stock: 0,
    subcategory: product.category?.trim() || "Produto",
    tags: [],
    texture: "Textura informada na pagina do produto",
    usageInstructions: [],
    validationAlerts: [
      {
        code: "catalog-standard-missing",
        detail: "SKU com padrao de catalogo em revisao pela BelaPop.",
        field: "catalog_standard",
        label: "Padrao em revisao",
        severity: "warning"
      }
    ],
    volume: "",
    warnings: ["SKU com padrao de catalogo em revisao pela BelaPop."]
  };
};

export async function getCatalogStandardSnapshot(): Promise<CatalogQualityStandardSnapshot> {
  try {
    const snapshot = await getSupabaseSnapshotCached();
    if (hasUsableCatalogStandardSnapshot(snapshot)) return snapshot;
  } catch (error) {
    if (shouldLogRepositoryFallback()) {
      console.warn("[BelaPop Quality Standard] Supabase snapshot fallback", error);
    }
  }

  return getFallbackSnapshot();
}

export async function getSellerStandardBySellerId(
  sellerId: string | null | undefined
): Promise<SellerStandardRecord> {
  const snapshot = await getCatalogStandardSnapshot();
  const direct = snapshot.sellers.find((seller) => seller.sellerId === sellerId);
  if (direct) return direct;
  if (CATALOG_STANDARD_SEED_FALLBACK_ENABLED) {
    return snapshot.sellers[0] ?? resolveSellerStandard(sellerId);
  }
  return buildPendingSellerStandard(sellerId);
}

export async function getProductStandardForProduct(
  product: ProductStandardLookupInput
): Promise<ProductSkuStandard> {
  const snapshot = await getCatalogStandardSnapshot();
  const direct = snapshot.products.find((standard) => standard.productId === product.id);
  if (direct) return direct;

  if (!CATALOG_STANDARD_SEED_FALLBACK_ENABLED) {
    return buildPendingProductStandard(product);
  }
  return resolveProductStandardForProduct(product);
}
