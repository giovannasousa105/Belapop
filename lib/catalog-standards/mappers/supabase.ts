import { belapopContact } from "@/lib/brand/contact";
import { resolveQualityScoreLevel } from "@/lib/catalog-standards/scoring";
import type {
  PackagingStandard,
  ProductAuthenticity,
  ProductAuthenticityStatus,
  ProductImageKind,
  ProductImageSpec,
  ProductSkuStandard,
  QualityScoreLevel,
  SellerAuthenticityPolicy,
  SellerQualityScoreBreakdown,
  SellerReturnPolicy,
  SellerShippingPolicy,
  SellerStandardRecord,
  SellerVerificationStatus,
  StandardIssue,
  StandardSeverity,
  StandardStatus,
  VerificationBadgeType
} from "@/lib/catalog-standards/types";
import type {
  CatalogStandardProductRow,
  CatalogStandardSellerRow
} from "@/lib/catalog-standards/supabase/types";

const STANDARD_STATUSES: StandardStatus[] = ["approved", "review", "pending", "blocked"];
const SELLER_VERIFICATION_STATUSES: SellerVerificationStatus[] = [
  "pending",
  "in-review",
  "approved",
  "rejected",
  "suspended",
  "verified-belapop"
];
const AUTHENTICITY_STATUSES: ProductAuthenticityStatus[] = [
  "not-verified",
  "in-review",
  "verified",
  "rejected",
  "authentic-belapop"
];
const QUALITY_LEVELS: QualityScoreLevel[] = ["excellent", "good", "attention", "blocked"];
const BADGE_TYPES: VerificationBadgeType[] = [
  "seller-verified",
  "authentic-product",
  "invoice-guaranteed",
  "premium-shipping",
  "belapop-curation"
];
const IMAGE_KINDS: ProductImageKind[] = ["main", "secondary", "texture", "application", "packaging"];
const SEVERITIES: StandardSeverity[] = ["info", "warning", "critical"];

const PLACEHOLDER_IMAGE = "/catalog/premium-product-placeholder.svg";

const asObject = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

const asString = (value: unknown, fallback = "") => {
  if (typeof value === "string") {
    const clean = value.trim();
    return clean.length > 0 ? clean : fallback;
  }
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
};

const asNullableString = (value: unknown) => {
  const clean = asString(value);
  return clean.length > 0 ? clean : null;
};

const asNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const asBoolean = (value: unknown, fallback = false) =>
  typeof value === "boolean" ? value : fallback;

const asStringArray = (value: unknown, fallback: string[] = []) => {
  if (!Array.isArray(value)) return fallback;
  const normalized = value
    .map((item) => asString(item))
    .filter((item) => item.length > 0);
  return normalized.length > 0 ? normalized : fallback;
};

const pickEnum = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T => {
  const normalized = asString(value) as T;
  return allowed.includes(normalized) ? normalized : fallback;
};

const mapScoreBreakdown = (value: unknown): SellerQualityScoreBreakdown => {
  const source = asObject(value);
  return {
    authenticity: asNumber(source.authenticity, undefined as unknown as number),
    catalogQuality: asNumber(source.catalogQuality, 80),
    complaints: asNumber(source.complaints, 80),
    completeness: asNumber(source.completeness, undefined as unknown as number),
    packaging: asNumber(source.packaging, undefined as unknown as number),
    problemRate: asNumber(source.problemRate, undefined as unknown as number),
    reliability: asNumber(source.reliability, 80),
    responseTime: asNumber(source.responseTime, 80),
    returnRate: asNumber(source.returnRate, 80),
    reviews: asNumber(source.reviews, 80),
    shipment: asNumber(source.shipment, 80),
    visualStandardization: asNumber(source.visualStandardization, 80)
  };
};

const omitUndefined = <T extends Record<string, unknown>>(value: T) =>
  Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T;

const mapShippingPolicy = (value: unknown, fallbackId: string): SellerShippingPolicy => {
  const source = asObject(value);
  return {
    averageDeliveryDays: asString(source.averageDeliveryDays, "Prazo informado no checkout"),
    carrierMethod: asNullableString(source.carrierMethod) ?? undefined,
    coverageRegions: asStringArray(source.coverageRegions, ["Brasil"]),
    freightRules: asString(source.freightRules, "Envio com rastreio e preparacao acompanhada pela BelaPop."),
    id: asString(source.id, fallbackId),
    originAddress: asNullableString(source.originAddress) ?? undefined,
    preparationCopy: asNullableString(source.preparationCopy) ?? undefined,
    postingSlaHours: asNumber(source.postingSlaHours, 48),
    premiumShipping: asBoolean(source.premiumShipping, false),
    trackingRequired: asBoolean(source.trackingRequired, true)
  };
};

const mapReturnPolicy = (value: unknown, fallbackId: string): SellerReturnPolicy => {
  const source = asObject(value);
  return {
    damagedProductRules: asNullableString(source.damagedProductRules) ?? undefined,
    divergentProductRules: asNullableString(source.divergentProductRules) ?? undefined,
    exchangeRules: asString(source.exchangeRules, "Troca assistida conforme política BelaPop."),
    fullPolicyHref: asNullableString(source.fullPolicyHref) ?? undefined,
    id: asString(source.id, fallbackId),
    packagingCondition: asNullableString(source.packagingCondition) ?? undefined,
    remorseRules: asNullableString(source.remorseRules) ?? undefined,
    returnWindowDays: asNumber(source.returnWindowDays, 7),
    reverseLogistics: asString(source.reverseLogistics, "Solicitação pelo atendimento BelaPop."),
    summary: asString(source.summary, "Trocas e devoluções com política clara."),
    supportChannel: asNullableString(source.supportChannel) ?? undefined
  };
};

const mapAuthenticityPolicy = (value: unknown): SellerAuthenticityPolicy => {
  const source = asObject(value);
  return {
    batchControl: pickEnum(source.batchControl, ["required", "when-available", "not-applicable"], "when-available"),
    complianceHistory: asStringArray(source.complianceHistory),
    invoiceRequired: asBoolean(source.invoiceRequired, true),
    manualApprovalRequired: asBoolean(source.manualApprovalRequired, true),
    originDescription: asString(source.originDescription, "Origem declarada pelo seller."),
    summary: asString(source.summary, "Procedencia acompanhada pela curadoria BelaPop.")
  };
};

const mapPackaging = (value: unknown): PackagingStandard => {
  const source = asObject(value);
  return {
    cleanPackage: asBoolean(source.cleanPackage, true),
    cleanPresentation: asBoolean(source.cleanPresentation, true),
    damagedBoxBlocked: asBoolean(source.damagedBoxBlocked, true),
    extraGlassProtection: asBoolean(source.extraGlassProtection, false),
    invoiceIncluded: asBoolean(source.invoiceIncluded, true),
    orderIdentification: asBoolean(source.orderIdentification, true),
    leakProtection: asBoolean(source.leakProtection, true),
    premiumIdentity: asBoolean(source.premiumIdentity, false),
    protectedProduct: asBoolean(source.protectedProduct, true),
    sampleWhenPossible: asBoolean(source.sampleWhenPossible, false),
    sealedWhenApplicable: asBoolean(source.sealedWhenApplicable, true),
    thankYouCardOptional: asBoolean(source.thankYouCardOptional, true),
    tissuePaperRecommended: asBoolean(source.tissuePaperRecommended, false),
    unboxingScore: asNumber(source.unboxingScore, 75)
  };
};

const mapImage = (value: unknown): ProductImageSpec | null => {
  const source = asObject(value);
  const url = asString(source.url);
  if (!url) return null;
  return {
    allowsBeforeAfter: asBoolean(source.allowsBeforeAfter, false),
    background: pickEnum(source.background, ["clean", "lifestyle", "colored", "unknown"] as const, "unknown"),
    hasPromotionalText: asBoolean(source.hasPromotionalText, false),
    hasWatermark: asBoolean(source.hasWatermark, false),
    height: asNumber(source.height, undefined as unknown as number),
    isBeforeAfter: asBoolean(source.isBeforeAfter, false),
    isCatalogScreenshot: asBoolean(source.isCatalogScreenshot, false),
    isCentered: asBoolean(source.isCentered, true),
    isPollutedMontage: asBoolean(source.isPollutedMontage, false),
    kind: pickEnum(source.kind, IMAGE_KINDS, "secondary"),
    lighting: pickEnum(source.lighting, ["good", "acceptable", "poor", "unknown"] as const, "unknown"),
    ratio: asNullableString(source.ratio) ?? undefined,
    url,
    width: asNumber(source.width, undefined as unknown as number)
  };
};

const mapImages = (value: unknown): ProductImageSpec[] => {
  const images = Array.isArray(value) ? value.map(mapImage).filter((item): item is ProductImageSpec => Boolean(item)) : [];
  return images.length > 0
    ? images
    : [
        {
          background: "clean",
          hasPromotionalText: false,
          hasWatermark: false,
          height: 1600,
          isCentered: true,
          kind: "main",
          lighting: "good",
          ratio: "4/5",
          url: PLACEHOLDER_IMAGE,
          width: 1280
        }
      ];
};

const mapIssue = (value: unknown): StandardIssue | null => {
  const source = asObject(value);
  const label = asString(source.label);
  const detail = asString(source.detail);
  if (!label || !detail) return null;
  return {
    code: asString(source.code, "catalog-standard-warning"),
    detail,
    field: asNullableString(source.field) ?? undefined,
    label,
    severity: pickEnum(source.severity, SEVERITIES, "warning")
  };
};

const mapIssues = (value: unknown) =>
  Array.isArray(value) ? value.map(mapIssue).filter((item): item is StandardIssue => Boolean(item)) : [];

const mapAuthenticity = (value: unknown, sellerId: string, status: StandardStatus): ProductAuthenticity => {
  const source = asObject(value);
  const standardStatus = pickEnum(source.standardStatus, AUTHENTICITY_STATUSES, status === "approved" ? "authentic-belapop" : "in-review");
  const authStatus = pickEnum(source.status, ["verified", "pending", "blocked"], status === "blocked" ? "blocked" : status === "approved" ? "verified" : "pending");
  return {
    approvedSeller: asBoolean(source.approvedSeller, status !== "blocked"),
    batchControl: pickEnum(source.batchControl, ["confirmed", "when-available", "pending"], sellerId === "sel-lumi" ? "pending" : "confirmed"),
    expiryDate: asNullableString(source.expiryDate) ?? undefined,
    invoiceAvailable: asBoolean(source.invoiceAvailable, status === "approved"),
    invoiceRequired: asBoolean(source.invoiceRequired, true),
    lot: asNullableString(source.lot) ?? undefined,
    origin: asString(source.origin, "Origem declarada pelo seller"),
    proofAvailable: asBoolean(source.proofAvailable, status === "approved"),
    responsibleValidator: asNullableString(source.responsibleValidator) ?? undefined,
    standardStatus,
    status: authStatus
  };
};

export function mapSellerStandardRow(row: CatalogStandardSellerRow): SellerStandardRecord | null {
  const sellerId = asString(row.seller_id);
  if (!sellerId) return null;
  const id = asString(row.id, `std-${sellerId}`);
  const scoreBreakdown = mapScoreBreakdown(row.score_breakdown);

  return omitUndefined({
    authenticityPolicy: mapAuthenticityPolicy(row.authenticity_policy),
    bannerUrl: asString(row.banner_url, PLACEHOLDER_IMAGE),
    brandsSold: asStringArray(row.brands_sold, [asString(row.brand_name, "BelaPop")]),
    brandName: asString(row.brand_name, "BelaPop"),
    categoriesServed: asStringArray(row.categories_served, [asString(row.category, "Beleza")]),
    category: asString(row.category, "Beleza"),
    cnpj: asString(row.cnpj, "00.000.000/0000-00"),
    commercialResponsible: asString(row.commercial_responsible, "Curadoria BelaPop"),
    contact: {
      email: asString(asObject(row.contact).email, belapopContact.supportEmail),
      name: asString(asObject(row.contact).name, "Curadoria BelaPop"),
      phone: asString(asObject(row.contact).phone, "+55 11 00000-0000")
    },
    history: {
      incidents90d: asNumber(asObject(row.history).incidents90d, 0),
      lastAuditAt: asString(asObject(row.history).lastAuditAt, new Date().toISOString().slice(0, 10)),
      notes: asStringArray(asObject(row.history).notes),
      returnRatePct: asNumber(asObject(row.history).returnRatePct, 0)
    },
    id,
    institutionalDescription: asString(row.institutional_description, "Seller em avaliacao pela curadoria BelaPop."),
    invoiceIssuanceConfirmed: asBoolean(row.invoice_issuance_confirmed, false),
    legalName: asString(row.legal_name, asString(row.brand_name, "BelaPop")),
    logoUrl: asString(row.logo_url, PLACEHOLDER_IMAGE),
    mainCategory: asString(row.main_category, asString(row.category, "Beleza")),
    packagingPolicy: asString(row.packaging_policy, "Embalagem protegida e apresentacao limpa."),
    productAuthenticityConfirmed: asBoolean(row.product_authenticity_confirmed, false),
    qualityScore: asNumber(row.quality_score, 0),
    region: asString(row.region, "Brasil"),
    responsibilityTermAcceptedAt: asNullableString(row.responsibility_term_accepted_at),
    returnPolicy: mapReturnPolicy(row.return_policy, `return-${sellerId}`),
    scoreBreakdown,
    sellerId,
    shippingOriginAddress: asString(row.shipping_origin_address, asString(asObject(row.shipping_policy).originAddress, "Origem informada no pedido")),
    shippingPolicy: mapShippingPolicy(row.shipping_policy, `ship-${sellerId}`),
    status: pickEnum(row.status, STANDARD_STATUSES, "pending"),
    verificationBadges: asStringArray(row.verification_badges).filter((item): item is VerificationBadgeType =>
      BADGE_TYPES.includes(item as VerificationBadgeType)
    ),
    verificationStatus: pickEnum(row.verification_status, SELLER_VERIFICATION_STATUSES, "pending")
  });
}

export function mapProductStandardRow(row: CatalogStandardProductRow): ProductSkuStandard | null {
  const productId = asString(row.product_id);
  const sellerId = asString(row.seller_id);
  if (!productId || !sellerId) return null;
  const status = pickEnum(row.status, STANDARD_STATUSES, "pending");
  const qualityScore = asNumber(row.quality_score, 0);

  return omitUndefined({
    authenticity: mapAuthenticity(row.authenticity, sellerId, status),
    authenticityStatus: pickEnum(row.authenticity_status, AUTHENTICITY_STATUSES, status === "approved" ? "authentic-belapop" : "in-review"),
    brand: asString(row.brand, "BelaPop"),
    category: asString(row.category, "Skincare"),
    claims: asStringArray(row.claims),
    dispatchDeadline: asString(row.dispatch_deadline, "Prazo informado no checkout"),
    gtin: asNullableString(row.gtin) ?? undefined,
    id: asString(row.id, `std-${productId}`),
    images: mapImages(row.images),
    ingredients: asStringArray(row.ingredients, ["Base sensorial controlada"]),
    internalSku: asString(row.internal_sku, productId),
    line: asNullableString(row.line) ?? undefined,
    mainBenefit: asString(row.main_benefit, "Escolha segura"),
    missingFields: asStringArray(row.missing_fields),
    name: asString(row.name, "BelaPop Curadoria Produto 30ml"),
    needs: asStringArray(row.needs, ["Rotina consistente"]),
    normalizedName: asString(row.normalized_name, asString(row.name, "BelaPop Curadoria Produto 30ml")),
    origin: asString(row.origin, "Origem declarada"),
    packaging: mapPackaging(row.packaging),
    price: asNumber(row.price, 0),
    productId,
    productType: asString(row.product_type, "Produto"),
    qualityLevel: pickEnum(row.quality_level, QUALITY_LEVELS, resolveQualityScoreLevel(qualityScore)),
    qualityScore,
    returnPolicyId: asString(row.return_policy_id, `return-${sellerId}`),
    returnPolicySummary: asString(row.return_policy_summary, "Trocas e devoluções com política clara."),
    secondaryBenefits: asStringArray(row.secondary_benefits, ["Conforto"]),
    sellerId,
    seo: {
      description: asString(asObject(row.seo).description, "Produto com curadoria BelaPop."),
      slug: asString(asObject(row.seo).slug, productId),
      title: asString(asObject(row.seo).title, asString(row.normalized_name, asString(row.name, productId)))
    },
    skinTypes: asStringArray(row.skin_types, ["todos"]),
    status,
    stock: asNumber(row.stock, 0),
    subcategory: asString(row.subcategory, asString(row.category, "Skincare")),
    tags: asStringArray(row.tags) as ProductSkuStandard["tags"],
    texture: asString(row.texture, "Sensorial"),
    usageInstructions: asStringArray(row.usage_instructions, ["Use conforme orientacao do produto."]),
    validationAlerts: mapIssues(row.validation_alerts),
    volume: asString(row.volume, "30ml"),
    warnings: asStringArray(row.warnings)
  });
}
