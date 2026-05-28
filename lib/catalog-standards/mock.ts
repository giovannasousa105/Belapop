import { belapopContact } from "@/lib/brand/contact";
import { ALLOWED_CLAIMS, BLOCKED_CLAIM_TERMS, ClaimValidator } from "@/lib/catalog-standards/claims";
import { ProductImageValidator } from "@/lib/catalog-standards/image";
import { normalizeProductName } from "@/lib/catalog-standards/naming";
import { canPublishProduct } from "@/lib/catalog-standards/publishing";
import { calculateProductQualityScore, calculateSellerQualityScore, resolveQualityScoreLevel } from "@/lib/catalog-standards/scoring";
import type {
  CatalogStandardDashboardMetric,
  PackagingStandard,
  ProductImageSpec,
  ProductSkuStandard,
  SellerStandardRecord,
  StandardIssue,
  StandardStatus
} from "@/lib/catalog-standards/types";

const defaultPackaging: PackagingStandard = {
  cleanPackage: true,
  cleanPresentation: true,
  damagedBoxBlocked: true,
  extraGlassProtection: true,
  invoiceIncluded: true,
  orderIdentification: true,
  leakProtection: true,
  premiumIdentity: true,
  protectedProduct: true,
  sampleWhenPossible: true,
  sealedWhenApplicable: true,
  tissuePaperRecommended: true,
  thankYouCardOptional: true,
  unboxingScore: 92
};

const needsPackagingReview: PackagingStandard = {
  cleanPackage: true,
  cleanPresentation: true,
  damagedBoxBlocked: true,
  invoiceIncluded: true,
  orderIdentification: true,
  leakProtection: false,
  premiumIdentity: false,
  protectedProduct: true,
  sealedWhenApplicable: false,
  thankYouCardOptional: false,
  unboxingScore: 68
};

const sellerScore = (breakdown: SellerStandardRecord["scoreBreakdown"]) =>
  calculateSellerQualityScore(breakdown);

export const mockSellerStandards: SellerStandardRecord[] = [
  {
    id: "std-seller-aurora",
    sellerId: "sel-aurora",
    brandsSold: ["Aurora Maison", "BelaPop Clinical"],
    brandName: "Aurora Maison",
    categoriesServed: ["Skincare", "Dermocosmeticos", "Pele sensível"],
    legalName: "Aurora Maison Cosmeticos Ltda.",
    cnpj: "12.345.678/0001-90",
    commercialResponsible: "Helena Duarte",
    contact: {
      email: "operação@auroramaison.com.br",
      name: "Helena Duarte",
      phone: "+55 11 99999-0101"
    },
    shippingPolicy: {
      averageDeliveryDays: "2 a 5 dias uteis",
      carrierMethod: "Correios, Loggi Premium ou transportadora parceira",
      coverageRegions: ["Sudeste", "Sul", "Centro-Oeste"],
      freightRules: "Envio com rastreio, embalagem protegida e SLA maximo de 24h.",
      id: "ship-aurora",
      originAddress: "Rua Bela Cintra, 1200 - Sao Paulo, SP",
      preparationCopy: "Pedido conferido, embalado com proteção e preparado em ate 24h.",
      postingSlaHours: 24,
      premiumShipping: true,
      trackingRequired: true
    },
    returnPolicy: {
      damagedProductRules: "Avarias seguem triagem com foto e suporte BelaPop.",
      divergentProductRules: "Produto divergente tem troca ou devolucao assistida.",
      exchangeRules: "Troca por avaria, divergencia ou arrependimento dentro da janela legal.",
      fullPolicyHref: "/termos-e-condicoes",
      id: "return-aurora",
      packagingCondition: "Preferencialmente com embalagem original e itens recebidos.",
      remorseRules: "Arrependimento em ate 7 dias conforme política da plataforma.",
      returnWindowDays: 7,
      reverseLogistics: "Etiqueta reversa emitida pelo atendimento BelaPop.",
      summary: "Devolucao orientada por concierge e conferida por lote.",
      supportChannel: belapopContact.supportEmail
    },
    authenticityPolicy: {
      batchControl: "when-available",
      complianceHistory: ["NF validada", "Seller aprovado manualmente", "Lote rastreavel para linhas clinicas"],
      invoiceRequired: true,
      manualApprovalRequired: true,
      originDescription: "Distribuicao oficial com nota fiscal vinculada ao pedido.",
      summary: "Produto original com procedência auditavel."
    },
    bannerUrl: "/catalog/premium-product-placeholder.svg",
    category: "Skincare",
    history: {
      incidents90d: 0,
      lastAuditAt: "2026-04-22",
      notes: ["Catalogo revisado", "Imagem principal aprovada", "SLA consistente"],
      returnRatePct: 1.4
    },
    institutionalDescription: "Laboratorio boutique de skincare com formulas objetivas e apelo clínico discreto.",
    invoiceIssuanceConfirmed: true,
    logoUrl: "/catalog/premium-product-placeholder.svg",
    mainCategory: "Dermocosmeticos",
    packagingPolicy: "Produto protegido contra vazamento e quebra, caixa limpa, NF inclusa e identificacao correta do pedido.",
    productAuthenticityConfirmed: true,
    qualityScore: sellerScore({
      catalogQuality: 96,
      complaints: 96,
      reliability: 98,
      responseTime: 94,
      returnRate: 95,
      reviews: 96,
      shipment: 97,
      visualStandardization: 95
    }),
    region: "Sao Paulo, SP",
    responsibilityTermAcceptedAt: "2026-04-01T12:00:00Z",
    scoreBreakdown: {
      catalogQuality: 96,
      complaints: 96,
      reliability: 98,
      responseTime: 94,
      returnRate: 95,
      reviews: 96,
      shipment: 97,
      visualStandardization: 95
    },
    status: "approved",
    verificationBadges: ["seller-verified", "premium-shipping", "invoice-guaranteed", "belapop-curation"],
    verificationStatus: "verified-belapop",
    shippingOriginAddress: "Rua Bela Cintra, 1200 - Sao Paulo, SP"
  },
  {
    id: "std-seller-velvet",
    sellerId: "sel-velvet",
    brandsSold: ["Velvet Lab"],
    brandName: "Velvet Lab",
    categoriesServed: ["Maquiagem", "Presentes", "Atelier"],
    legalName: "Velvet Lab Beauty Ltda.",
    cnpj: "23.456.789/0001-12",
    commercialResponsible: "Marina Rocha",
    contact: {
      email: "seller@velvetlab.com.br",
      name: "Marina Rocha",
      phone: "+55 21 99999-0202"
    },
    shippingPolicy: {
      averageDeliveryDays: "3 a 6 dias uteis",
      carrierMethod: "Correios ou transportadora parceira",
      coverageRegions: ["Sudeste", "Sul", "Nordeste"],
      freightRules: "Postagem em ate 36h com rastreio obrigatorio.",
      id: "ship-velvet",
      originAddress: "Rua Dias Ferreira, 90 - Rio de Janeiro, RJ",
      preparationCopy: "Pedido separado com conferencia de lacre e embalagem de proteção.",
      postingSlaHours: 36,
      premiumShipping: true,
      trackingRequired: true
    },
    returnPolicy: {
      damagedProductRules: "Avarias ou embalagem violada devem ser reportadas com foto.",
      divergentProductRules: "Divergencia de item segue troca assistida.",
      exchangeRules: "Troca condicionada a lacre preservado, avaria ou erro de separação.",
      fullPolicyHref: "/termos-e-condicoes",
      id: "return-velvet",
      packagingCondition: "Lacre preservado quando aplicavel.",
      remorseRules: "Arrependimento em ate 7 dias para itens elegiveis.",
      returnWindowDays: 7,
      reverseLogistics: "Logistica reversa aprovada apos triagem.",
      summary: "Política clara para maquiagem e itens de higiene.",
      supportChannel: "seller@velvetlab.com.br"
    },
    authenticityPolicy: {
      batchControl: "when-available",
      complianceHistory: ["NF obrigatoria", "Claims em revisao editorial"],
      invoiceRequired: true,
      manualApprovalRequired: true,
      originDescription: "Venda direta de marca parceira aprovada.",
      summary: "Procedencia declarada e auditada em amostra."
    },
    bannerUrl: "/catalog/premium-product-placeholder.svg",
    category: "Makeup",
    history: {
      incidents90d: 1,
      lastAuditAt: "2026-04-18",
      notes: ["Ajustar claims de duração", "Padrao visual aprovado"],
      returnRatePct: 2.2
    },
    institutionalDescription: "Marca editorial de maquiagem com foco em acabamento sofisticado e uso real.",
    invoiceIssuanceConfirmed: true,
    logoUrl: "/catalog/premium-product-placeholder.svg",
    mainCategory: "Maquiagem",
    packagingPolicy: "Itens lacrados quando aplicavel, proteção contra impacto e apresentação limpa.",
    productAuthenticityConfirmed: true,
    qualityScore: sellerScore({
      catalogQuality: 88,
      complaints: 90,
      reliability: 90,
      responseTime: 86,
      returnRate: 88,
      reviews: 91,
      shipment: 89,
      visualStandardization: 94
    }),
    region: "Rio de Janeiro, RJ",
    responsibilityTermAcceptedAt: "2026-04-08T15:20:00Z",
    scoreBreakdown: {
      catalogQuality: 88,
      complaints: 90,
      reliability: 90,
      responseTime: 86,
      returnRate: 88,
      reviews: 91,
      shipment: 89,
      visualStandardization: 94
    },
    status: "review",
    verificationBadges: ["seller-verified", "invoice-guaranteed", "belapop-curation"],
    verificationStatus: "in-review",
    shippingOriginAddress: "Rua Dias Ferreira, 90 - Rio de Janeiro, RJ"
  },
  {
    id: "std-seller-lumi",
    sellerId: "sel-lumi",
    brandsSold: ["Lumiere Rituals"],
    brandName: "Lumiere Rituals",
    categoriesServed: ["Perfumaria", "Corpo e banho"],
    legalName: "Lumiere Fragrancias e Rituais Ltda.",
    cnpj: "34.567.890/0001-23",
    commercialResponsible: "Clara Monteiro",
    contact: {
      email: "qualidade@lumiererituals.com.br",
      name: "Clara Monteiro",
      phone: "+55 31 99999-0303"
    },
    shippingPolicy: {
      averageDeliveryDays: "5 a 9 dias uteis",
      carrierMethod: "Correios",
      coverageRegions: ["Sudeste"],
      freightRules: "Postagem declarada em 48h, com ocorrencias recentes de atraso.",
      id: "ship-lumi",
      originAddress: "Avenida do Contorno, 2200 - Belo Horizonte, MG",
      preparationCopy: "Pedido preparado em ate 48h, sujeito a revisao operacional.",
      postingSlaHours: 48,
      premiumShipping: false,
      trackingRequired: true
    },
    returnPolicy: {
      damagedProductRules: "Vazamento ou quebra exige foto da embalagem e frasco.",
      divergentProductRules: "Produto divergente volta para revisao de separação.",
      exchangeRules: "Troca por avaria, vazamento ou divergencia.",
      fullPolicyHref: "/termos-e-condicoes",
      id: "return-lumi",
      packagingCondition: "Embalagem e frasco devem ser preservados para triagem.",
      remorseRules: "Arrependimento em ate 7 dias quando elegivel.",
      returnWindowDays: 7,
      reverseLogistics: "Solicitação manual pelo concierge.",
      summary: "Política publicada, mas precisa detalhar perfume e embalagem.",
      supportChannel: "qualidade@lumiererituals.com.br"
    },
    authenticityPolicy: {
      batchControl: "required",
      complianceHistory: ["NF obrigatoria", "IFRA pendente para linha Noir"],
      invoiceRequired: true,
      manualApprovalRequired: true,
      originDescription: "Producao nacional com lote obrigatorio por fragrancia.",
      summary: "Aprovação condicionada a documentacao técnica."
    },
    bannerUrl: "/catalog/premium-product-placeholder.svg",
    category: "Perfumaria",
    history: {
      incidents90d: 3,
      lastAuditAt: "2026-04-15",
      notes: ["Documentacao técnica pendente", "SLA precisa recuperar estabilidade"],
      returnRatePct: 4.8
    },
    institutionalDescription: "Casa de fragrancias com proposta sensorial e assinatura olfativa autoral.",
    invoiceIssuanceConfirmed: true,
    logoUrl: "/catalog/premium-product-placeholder.svg",
    mainCategory: "Perfumaria",
    packagingPolicy: "Frascos com proteção extra obrigatoria; política em revisao para reduzir risco de vazamento.",
    productAuthenticityConfirmed: false,
    qualityScore: sellerScore({
      catalogQuality: 74,
      complaints: 72,
      reliability: 76,
      responseTime: 78,
      returnRate: 70,
      reviews: 79,
      shipment: 68,
      visualStandardization: 82
    }),
    region: "Belo Horizonte, MG",
    responsibilityTermAcceptedAt: "2026-04-10T09:00:00Z",
    scoreBreakdown: {
      catalogQuality: 74,
      complaints: 72,
      reliability: 76,
      responseTime: 78,
      returnRate: 70,
      reviews: 79,
      shipment: 68,
      visualStandardization: 82
    },
    status: "pending",
    verificationBadges: ["belapop-curation"],
    verificationStatus: "pending",
    shippingOriginAddress: "Avenida do Contorno, 2200 - Belo Horizonte, MG"
  }
];

const buildImageSet = (overrides: Partial<ProductImageSpec>[] = []): ProductImageSpec[] => {
  const base: ProductImageSpec[] = [
    {
      background: "clean",
      hasPromotionalText: false,
      hasWatermark: false,
      height: 1600,
      isCentered: true,
      kind: "main",
      lighting: "good",
      ratio: "4/5",
      url: "/catalog/premium-product-placeholder.svg",
      width: 1280
    },
    {
      background: "clean",
      hasPromotionalText: false,
      hasWatermark: false,
      height: 1500,
      isCentered: true,
      kind: "secondary",
      lighting: "good",
      ratio: "1/1",
      url: "/catalog/premium-product-placeholder.svg",
      width: 1500
    },
    {
      background: "clean",
      hasPromotionalText: false,
      hasWatermark: false,
      height: 1400,
      isCentered: true,
      kind: "texture",
      lighting: "good",
      ratio: "1/1",
      url: "/catalog/premium-product-placeholder.svg",
      width: 1400
    }
  ];

  return base.map((image, index) => ({ ...image, ...(overrides[index] ?? {}) }));
};

const createProductStandard = (input: {
  active?: string;
  brand: string;
  category: string;
  claims: string[];
  images?: ProductImageSpec[];
  line?: string;
  mainBenefit: string;
  missingFields?: string[];
  name: string;
  packaging?: PackagingStandard;
  price: number;
  productId: string;
  productType: string;
  sellerId: string;
  status: StandardStatus;
  tags: ProductSkuStandard["tags"];
  validationAlerts?: StandardIssue[];
  volume: string;
}): ProductSkuStandard => {
  const naming = normalizeProductName(input.name, {
    activeOrDifferential: input.active,
    brand: input.brand,
    line: input.line,
    productType: input.productType,
    volume: input.volume
  });
  const images = input.images ?? buildImageSet();
  const imageValidation = ProductImageValidator.validate(images);
  const claimValidation = ClaimValidator.validate(input.claims);
  const validationAlerts = [
    ...naming.issues,
    ...claimValidation.issues,
    ...imageValidation.alerts,
    ...(input.validationAlerts ?? [])
  ];
  const qualityScore = calculateProductQualityScore({
    authenticity: input.status === "approved" ? 96 : input.status === "blocked" ? 35 : 76,
    claims: claimValidation.isValid ? 94 : 55,
    content: input.missingFields?.length ? 72 : 94,
    images: imageValidation.score,
    logistics: input.sellerId === "sel-lumi" ? 70 : 92,
    naming: naming.blocked ? 42 : 94,
    seo: input.missingFields?.includes("seo") ? 62 : 88
  });
  const authenticityStatus =
    input.status === "approved"
      ? ("authentic-belapop" as const)
      : input.status === "blocked"
        ? ("rejected" as const)
        : ("in-review" as const);

  return {
    authenticity: {
      approvedSeller: input.status !== "blocked",
      batchControl: input.sellerId === "sel-lumi" ? "pending" : "confirmed",
      expiryDate: input.sellerId === "sel-lumi" ? undefined : "2027-12-31",
      invoiceAvailable: input.status !== "blocked" && input.sellerId !== "sel-lumi",
      invoiceRequired: true,
      lot: input.sellerId === "sel-lumi" ? undefined : `LOT-${input.productId.toUpperCase()}`,
      origin: input.sellerId === "sel-lumi" ? "Origem nacional com lote pendente" : "Origem validada com NF",
      proofAvailable: input.status === "approved",
      responsibleValidator: input.status === "approved" ? "Curadoria BelaPop" : "Qualidade BelaPop",
      standardStatus: authenticityStatus,
      status: input.status === "approved" ? "verified" : input.status === "blocked" ? "blocked" : "pending"
    },
    authenticityStatus,
    brand: input.brand,
    category: input.category,
    claims: input.claims,
    dispatchDeadline: input.sellerId === "sel-lumi" ? "48h em revisao" : "24h a 36h",
    gtin: input.status === "approved" ? `789${input.productId.replace(/\D/g, "").padStart(10, "0")}` : undefined,
    id: `std-${input.productId}`,
    images,
    ingredients: input.active ? [input.active, "Base sensorial controlada"] : ["Base sensorial controlada"],
    internalSku: input.productId,
    line: input.line,
    mainBenefit: input.mainBenefit,
    missingFields: input.missingFields ?? [],
    name: input.name,
    needs: ["Rotina consistente", input.mainBenefit],
    normalizedName: naming.value,
    origin: input.sellerId === "sel-lumi" ? "Brasil, lote em validação" : "Distribuicao oficial",
    packaging: input.packaging ?? defaultPackaging,
    price: input.price,
    productId: input.productId,
    productType: input.productType,
    qualityLevel: resolveQualityScoreLevel(qualityScore),
    qualityScore,
    returnPolicyId: input.sellerId === "sel-lumi" ? "return-lumi" : input.sellerId === "sel-velvet" ? "return-velvet" : "return-aurora",
    returnPolicySummary: input.sellerId === "sel-lumi" ? "Troca por avaria, vazamento ou divergencia." : "Trocas e devoluções com política clara e acompanhamento BelaPop.",
    secondaryBenefits: ["Conforto", "Aplicacao simples"],
    sellerId: input.sellerId,
    seo: {
      description: `${input.brand} ${input.productType} com curadoria BelaPop e informações de origem, uso e envio.`,
      slug: input.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, ""),
      title: naming.value
    },
    skinTypes: input.category.toLowerCase().includes("skin") ? ["normal", "mista", "sensível"] : ["todos"],
    status: input.status,
    stock: input.status === "pending" ? 24 : input.status === "blocked" ? 0 : 96,
    subcategory: input.category === "Skincare" ? "Tratamento" : input.category,
    tags: input.tags,
    texture: input.category === "Skincare" ? "Leve e confortavel" : "Sensorial",
    usageInstructions: [
      "Use com a pele limpa e seca.",
      "Aplique em camada fina, seguindo a frequencia indicada.",
      "Finalize a rotina conforme necessidade da pele."
    ],
    validationAlerts,
    volume: input.volume,
    warnings: validationAlerts.filter((alert) => alert.severity !== "critical").map((alert) => alert.detail)
  };
};

export const mockProductStandards: ProductSkuStandard[] = [
  createProductStandard({
    active: "Niacinamida",
    brand: "Aurora Maison",
    category: "Skincare",
    claims: ["Hidratação", "Glow", "Uniformizacao"],
    line: "Clinical",
    mainBenefit: "Luminosidade controlada",
    name: "Aurora Maison Clinical Serum Niacinamida 30ml",
    price: 289,
    productId: "prd-001",
    productType: "Serum",
    sellerId: "sel-aurora",
    status: "approved",
    tags: ["clinical", "luxury", "curated-icon"],
    volume: "30ml"
  }),
  createProductStandard({
    active: "Ceramidas",
    brand: "Aurora Maison",
    category: "Skincare",
    claims: ["Fortalecimento da barreira", "Conforto", "Baixa irritabilidade"],
    line: "Barrier",
    mainBenefit: "Barreira cutanea",
    name: "Aurora Maison Barrier Creme Ceramidas 50g",
    price: 219,
    productId: "prd-010",
    productType: "Creme",
    sellerId: "sel-aurora",
    status: "approved",
    tags: ["sensitive-skin", "clinical", "routine"],
    volume: "50g"
  }),
  createProductStandard({
    active: "Soft focus",
    brand: "Velvet Lab",
    category: "Makeup",
    claims: ["Glow", "Textura mais macia"],
    line: "Atelier",
    mainBenefit: "Acabamento uniforme",
    name: "Velvet Lab Atelier Paleta Soft Focus 12g",
    price: 329,
    productId: "prd-004",
    productType: "Paleta",
    sellerId: "sel-velvet",
    status: "review",
    tags: ["luxury", "gift", "discovery"],
    validationAlerts: [
      {
        code: "claim-evidence-needed",
        detail: "Anexar evidencia de duração antes de destacar em campanha.",
        field: "claims",
        label: "Evidencia pendente",
        severity: "warning"
      }
    ],
    volume: "12g"
  }),
  createProductStandard({
    active: "Musk ambarado",
    brand: "Lumiere Rituals",
    category: "Perfumaria",
    claims: ["Resultado imediato garantido"],
    images: buildImageSet([
      {
        background: "colored",
        hasPromotionalText: true,
        height: 900,
        isCentered: false,
        lighting: "poor",
        ratio: "16/9",
        width: 1200
      }
    ]),
    line: "Noir",
    mainBenefit: "Assinatura olfativa",
    missingFields: ["guia de ativos", "lote", "seo"],
    name: "LUMIERE NOIR PERFUME RESULTADO IMEDIATO GARANTIDO 100ML",
    packaging: needsPackagingReview,
    price: 520,
    productId: "prd-005",
    productType: "Eau de Parfum",
    sellerId: "sel-lumi",
    status: "pending",
    tags: ["luxury", "discovery"],
    volume: "100ml"
  }),
  createProductStandard({
    active: "Peptideos",
    brand: "BelaPop",
    category: "Skincare",
    claims: ["Hidratação", "Glow"],
    line: "Radiance",
    mainBenefit: "Luminosidade suave",
    name: "BelaPop Radiance Serum Peptideos 30ml",
    price: 289,
    productId: "p1",
    productType: "Serum",
    sellerId: "s1",
    status: "approved",
    tags: ["curated-icon", "clinical", "luxury"],
    volume: "30ml"
  }),
  createProductStandard({
    active: "Cafeina",
    brand: "BelaPop",
    category: "Skincare",
    claims: ["Hidratação", "Conforto"],
    line: "Aurora",
    mainBenefit: "Olhar descansado",
    name: "BelaPop Aurora Patch Olhos Cafeina 30 pares",
    price: 198,
    productId: "p11",
    productType: "Patch",
    sellerId: "s1",
    status: "approved",
    tags: ["sensitive-skin", "routine", "discovery"],
    volume: "30 pares"
  })
];

export const mockSellerPolicies = mockSellerStandards.map((seller) => ({
  authenticity: seller.authenticityPolicy,
  returnPolicy: seller.returnPolicy,
  sellerId: seller.sellerId,
  shippingPolicy: seller.shippingPolicy
}));

export const mockVerificationStatuses = mockProductStandards.map((product) => ({
  authenticity: product.authenticity.status,
  badges: product.authenticity.status === "verified"
    ? ["Produto Autentico", "Nota Fiscal Garantida", "Curadoria BelaPop"]
    : ["Revisao BelaPop"],
  productId: product.productId,
  sellerApproved: product.authenticity.approvedSeller
}));

const countBy = <T>(items: T[], predicate: (item: T) => boolean) =>
  items.filter(predicate).length;

const averageSellerScore = Math.round(
  mockSellerStandards.reduce((total, seller) => total + seller.qualityScore, 0) / mockSellerStandards.length
);

const productsBlockedForPublish = mockProductStandards.filter((product) => {
  const seller = mockSellerStandards.find((item) => item.sellerId === product.sellerId);
  return !canPublishProduct(product, seller).canPublish;
});

export const catalogStandardDashboard = {
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
      value: String(countBy(mockSellerStandards, (seller) => seller.status !== "approved"))
    },
    {
      detail: "Itens sem todos os campos editoriais, SEO, lote ou guia técnico.",
      id: "incomplete-skus",
      label: "SKUs incompletos",
      status: "review",
      value: String(countBy(mockProductStandards, (product) => product.missingFields.length > 0))
    },
    {
      detail: "Imagens com baixa resolucao, texto promocional, ratio irregular ou metadados ausentes.",
      id: "image-alerts",
      label: "Alertas de imagem",
      status: "review",
      value: String(countBy(mockProductStandards, (product) => product.validationAlerts.some((alert) => alert.field === "images")))
    },
    {
      detail: "Claims bloqueados ou fora da whitelist BelaPop.",
      id: "claim-alerts",
      label: "Claims invalidos",
      status: "blocked",
      value: String(countBy(mockProductStandards, (product) => product.validationAlerts.some((alert) => alert.field === "claims")))
    },
    {
      detail: "Produtos sem autenticidade final, NF, origem ou lote validado.",
      id: "auth-pending",
      label: "Autenticidade pendente",
      status: "pending",
      value: String(countBy(mockProductStandards, (product) => product.authenticity.status !== "verified"))
    },
    {
      detail: "Sellers sem envio premium, rastreio ou SLA consistente.",
      id: "shipping-policy-alerts",
      label: "Política de envio",
      status: "review",
      value: String(countBy(mockSellerStandards, (seller) => !seller.shippingPolicy.premiumShipping || seller.shippingPolicy.postingSlaHours > 36))
    },
    {
      detail: "Sellers aprovados, verificados ou prontos para operar dentro do padrao.",
      id: "approved-sellers",
      label: "Sellers aprovados",
      status: "approved",
      value: String(countBy(mockSellerStandards, (seller) => ["approved", "verified-belapop"].includes(seller.verificationStatus)))
    },
    {
      detail: "Sellers reprovados ou suspensos ate recompor documentacao e qualidade.",
      id: "rejected-sellers",
      label: "Sellers reprovados",
      status: "blocked",
      value: String(countBy(mockSellerStandards, (seller) => ["rejected", "suspended"].includes(seller.verificationStatus)))
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
  ] satisfies CatalogStandardDashboardMetric[],
  operationalAlerts: [
    "SKU com claim proibido deve voltar para rascunho antes de qualquer destaque comercial.",
    "Seller com SLA acima de 36h perde selo Envio Premium ate recompor histórico.",
    "Produto sem NF ou origem declarada não recebe badge Produto Autentico.",
    "Imagem principal com texto promocional deve ser substituida por packshot limpo."
  ]
};

export const belapopQualityStandard = {
  architectureName: "BelaPop Quality Standard",
  dashboard: catalogStandardDashboard,
  products: mockProductStandards,
  sellers: mockSellerStandards,
  policies: mockSellerPolicies,
  verificationStatuses: mockVerificationStatuses
};

export const resolveSellerStandard = (sellerId: string | null | undefined) =>
  mockSellerStandards.find((seller) => seller.sellerId === sellerId) ?? mockSellerStandards[0];

export const resolveProductStandardForProduct = (product: {
  brand?: string | null;
  category?: string | null;
  id?: string | null;
  price?: number | null;
  price_cents?: number | null;
  sellerId?: string | null;
  title?: string | null;
}) => {
  const direct = mockProductStandards.find((standard) => standard.productId === product.id);
  if (direct) return direct;

  const seller = resolveSellerStandard(product.sellerId);
  const price =
    typeof product.price === "number"
      ? product.price
      : typeof product.price_cents === "number"
        ? product.price_cents / 100
        : 0;

  return createProductStandard({
    active: "Curadoria BelaPop",
    brand: product.brand?.trim() || seller.brandName || "BelaPop",
    category: product.category?.trim() || "Skincare",
    claims: ["Hidratação", "Conforto"],
    line: "Curadoria",
    mainBenefit: "Escolha segura",
    name: product.title?.trim() || "BelaPop Curadoria Produto 30ml",
    price,
    productId: product.id?.trim() || "product-standard-fallback",
    productType: "Produto",
    sellerId: product.sellerId?.trim() || seller.sellerId,
    status: seller.status === "approved" ? "approved" : "review",
    tags: ["curated-icon", "discovery"],
    volume: "30ml"
  });
};
