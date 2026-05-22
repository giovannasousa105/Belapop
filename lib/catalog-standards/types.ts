export type StandardStatus = "approved" | "review" | "pending" | "blocked";

export type StandardSeverity = "info" | "warning" | "critical";

export type SellerVerificationStatus =
  | "pending"
  | "in-review"
  | "approved"
  | "rejected"
  | "suspended"
  | "verified-belapop";

export type ProductAuthenticityStatus =
  | "not-verified"
  | "in-review"
  | "verified"
  | "rejected"
  | "authentic-belapop";

export type QualityScoreLevel = "excellent" | "good" | "attention" | "blocked";

export type VerificationBadgeType =
  | "seller-verified"
  | "authentic-product"
  | "invoice-guaranteed"
  | "premium-shipping"
  | "belapop-curation";

export type ProductStandardTag =
  | "clinical"
  | "luxury"
  | "sensitive-skin"
  | "gift"
  | "new"
  | "curated-icon"
  | "brazilian-premium"
  | "discovery"
  | "routine"
  | "bundle";

export type ClaimValidationInput = string | string[];

export type ProductImageKind = "main" | "secondary" | "texture" | "application" | "packaging";

export interface StandardIssue {
  code: string;
  detail: string;
  field?: string;
  label: string;
  severity: StandardSeverity;
}

export interface SellerQualityScoreBreakdown {
  authenticity?: number;
  catalogQuality: number;
  complaints: number;
  completeness?: number;
  packaging?: number;
  problemRate?: number;
  reliability: number;
  responseTime: number;
  returnRate: number;
  reviews: number;
  shipment: number;
  visualStandardization: number;
}

export interface ProductQualityScoreBreakdown {
  authenticity: number;
  benefits?: number;
  claims: number;
  content: number;
  images: number;
  logistics: number;
  naming: number;
  policy?: number;
  seo: number;
}

export interface SellerShippingPolicy {
  averageDeliveryDays: string;
  carrierMethod?: string;
  coverageRegions: string[];
  freightRules: string;
  id: string;
  originAddress?: string;
  preparationCopy?: string;
  postingSlaHours: number;
  premiumShipping: boolean;
  trackingRequired: boolean;
}

export interface SellerReturnPolicy {
  damagedProductRules?: string;
  divergentProductRules?: string;
  exchangeRules: string;
  fullPolicyHref?: string;
  id: string;
  packagingCondition?: string;
  remorseRules?: string;
  returnWindowDays: number;
  reverseLogistics: string;
  summary: string;
  supportChannel?: string;
}

export interface SellerAuthenticityPolicy {
  batchControl: "required" | "when-available" | "not-applicable";
  complianceHistory: string[];
  invoiceRequired: boolean;
  manualApprovalRequired: boolean;
  originDescription: string;
  summary: string;
}

export interface PackagingStandard {
  cleanPackage?: boolean;
  cleanPresentation: boolean;
  damagedBoxBlocked?: boolean;
  invoiceIncluded?: boolean;
  orderIdentification?: boolean;
  leakProtection: boolean;
  premiumIdentity: boolean;
  protectedProduct: boolean;
  sampleWhenPossible?: boolean;
  sealedWhenApplicable?: boolean;
  tissuePaperRecommended?: boolean;
  thankYouCardOptional: boolean;
  extraGlassProtection?: boolean;
  unboxingScore: number;
}

export interface SellerStandardRecord {
  authenticityPolicy: SellerAuthenticityPolicy;
  bannerUrl: string;
  brandsSold: string[];
  brandName: string;
  categoriesServed: string[];
  category: string;
  cnpj: string;
  commercialResponsible: string;
  contact: {
    email: string;
    name: string;
    phone: string;
  };
  history: {
    incidents90d: number;
    lastAuditAt: string;
    notes: string[];
    returnRatePct: number;
  };
  id: string;
  institutionalDescription: string;
  invoiceIssuanceConfirmed: boolean;
  legalName: string;
  logoUrl: string;
  mainCategory: string;
  packagingPolicy: string;
  productAuthenticityConfirmed: boolean;
  qualityScore: number;
  region: string;
  responsibilityTermAcceptedAt: string | null;
  returnPolicy: SellerReturnPolicy;
  scoreBreakdown: SellerQualityScoreBreakdown;
  sellerId: string;
  shippingPolicy: SellerShippingPolicy;
  shippingOriginAddress: string;
  status: StandardStatus;
  verificationBadges: VerificationBadgeType[];
  verificationStatus: SellerVerificationStatus;
}

export interface ProductImageSpec {
  allowsBeforeAfter?: boolean;
  background?: "clean" | "lifestyle" | "colored" | "unknown";
  hasPromotionalText?: boolean;
  hasWatermark?: boolean;
  height?: number;
  isCentered?: boolean;
  isBeforeAfter?: boolean;
  isCatalogScreenshot?: boolean;
  isPollutedMontage?: boolean;
  kind: ProductImageKind;
  lighting?: "good" | "acceptable" | "poor" | "unknown";
  ratio?: string;
  url: string;
  width?: number;
}

export interface ProductAuthenticity {
  approvedSeller: boolean;
  batchControl: "confirmed" | "when-available" | "pending";
  expiryDate?: string;
  invoiceAvailable: boolean;
  invoiceRequired: boolean;
  lot?: string;
  origin: string;
  proofAvailable?: boolean;
  responsibleValidator?: string;
  status: "verified" | "pending" | "blocked";
  standardStatus?: ProductAuthenticityStatus;
}

export interface ProductSeoBasics {
  description: string;
  slug: string;
  title: string;
}

export interface ProductSkuStandard {
  authenticity: ProductAuthenticity;
  authenticityStatus: ProductAuthenticityStatus;
  brand: string;
  category: string;
  claims: string[];
  dispatchDeadline: string;
  gtin?: string;
  id: string;
  images: ProductImageSpec[];
  ingredients: string[];
  internalSku: string;
  line?: string;
  mainBenefit: string;
  missingFields: string[];
  name: string;
  needs: string[];
  normalizedName: string;
  origin: string;
  packaging: PackagingStandard;
  price: number;
  productId: string;
  productType: string;
  qualityLevel: QualityScoreLevel;
  qualityScore: number;
  returnPolicyId: string;
  returnPolicySummary: string;
  secondaryBenefits: string[];
  sellerId: string;
  seo: ProductSeoBasics;
  skinTypes: string[];
  status: StandardStatus;
  stock: number;
  subcategory: string;
  tags: ProductStandardTag[];
  texture: string;
  usageInstructions: string[];
  validationAlerts: StandardIssue[];
  volume: string;
  warnings: string[];
}

export interface ProductNameNormalizationResult {
  blocked: boolean;
  issues: StandardIssue[];
  original: string;
  value: string;
}

export interface ClaimValidationResult {
  allowed: string[];
  blocked: string[];
  issues: StandardIssue[];
  isValid: boolean;
  unknown: string[];
}

export interface ProductImageValidationResult {
  alerts: StandardIssue[];
  isValid: boolean;
  score: number;
}

export interface StandardChecklistItem {
  detail?: string;
  label: string;
  passed: boolean;
  required?: boolean;
}

export interface CatalogStandardDashboardMetric {
  detail: string;
  id: string;
  label: string;
  status: StandardStatus;
  value: string;
}

export interface CatalogSellerPolicySnapshot {
  authenticity: SellerAuthenticityPolicy;
  returnPolicy: SellerReturnPolicy;
  sellerId: string;
  shippingPolicy: SellerShippingPolicy;
}

export interface CatalogVerificationStatus {
  authenticity: ProductAuthenticity["status"];
  badges: string[];
  productId: string;
  sellerApproved: boolean;
}

export interface CatalogStandardDashboard {
  claimControls: {
    blacklist: string[];
    whitelist: string[];
  };
  governancePillars: string[];
  metrics: CatalogStandardDashboardMetric[];
  operationalAlerts: string[];
}

export interface CatalogQualityStandardSnapshot {
  architectureName: "BelaPop Quality Standard";
  dashboard: CatalogStandardDashboard;
  policies: CatalogSellerPolicySnapshot[];
  products: ProductSkuStandard[];
  sellers: SellerStandardRecord[];
  verificationStatuses: CatalogVerificationStatus[];
}

export interface ProductClaim {
  label: string;
  status: "allowed" | "blocked" | "review";
}

export type ProductShippingPolicy = SellerShippingPolicy;
export type ProductReturnPolicy = SellerReturnPolicy;
export type ProductPackagingStandard = PackagingStandard;

export interface ProductQualityScore {
  breakdown: ProductQualityScoreBreakdown;
  level: QualityScoreLevel;
  score: number;
}

export interface SellerQualityScore {
  breakdown: SellerQualityScoreBreakdown;
  level: QualityScoreLevel;
  score: number;
}

export type SellerQualityStandard = SellerStandardRecord;
export type ProductQualityStandard = ProductSkuStandard;

export interface ProductPublishValidationResult {
  canPublish: boolean;
  blockingIssues: StandardIssue[];
  warnings: StandardIssue[];
}
