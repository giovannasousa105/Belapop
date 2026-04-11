import type {
  ActivityLog,
  AuditTrailEntry,
  Campaign,
  ComplianceFlag,
  CurationStatus,
  CurationRule,
  Customer,
  Document,
  FinancialAlert,
  InternalUser,
  LogisticsIncident,
  Order,
  Payout,
  PlatformSetting,
  Product,
  QualityScore,
  Refund,
  Review,
  Seller,
  Shipment
} from "@/types/adm";

export const sellers: Seller[] = [
  {
    id: "sel-aurora",
    name: "Aurora Maison",
    category: "Skincare",
    tier: "premium",
    status: "premium",
    riskLevel: "baixa",
    qualityScore: 96,
    activeProducts: 14,
    gmv30d: 348000,
    pendingDocuments: 0
  },
  {
    id: "sel-velvet",
    name: "Velvet Lab",
    category: "Makeup",
    tier: "premium",
    status: "aprovado",
    riskLevel: "media",
    qualityScore: 89,
    activeProducts: 22,
    gmv30d: 291000,
    pendingDocuments: 1
  },
  {
    id: "sel-lumi",
    name: "Lumiere Rituals",
    category: "Perfumaria",
    tier: "core",
    status: "em-revisao",
    riskLevel: "alta",
    qualityScore: 74,
    activeProducts: 8,
    gmv30d: 118500,
    pendingDocuments: 2
  },
  {
    id: "sel-nordic",
    name: "Nordic Hair Atelier",
    category: "Haircare",
    tier: "core",
    status: "alerta",
    riskLevel: "media",
    qualityScore: 78,
    activeProducts: 11,
    gmv30d: 96000,
    pendingDocuments: 1
  },
  {
    id: "sel-botanica",
    name: "Botanica Reserve",
    category: "Skincare",
    tier: "premium",
    status: "destaque",
    riskLevel: "baixa",
    qualityScore: 94,
    activeProducts: 19,
    gmv30d: 265000,
    pendingDocuments: 0
  },
  {
    id: "sel-atelierx",
    name: "Atelier X",
    category: "Corpo e Banho",
    tier: "core",
    status: "bloqueado",
    riskLevel: "critica",
    qualityScore: 61,
    activeProducts: 6,
    gmv30d: 40200,
    pendingDocuments: 3
  }
];

export const products: Product[] = [
  {
    id: "prd-001",
    sellerId: "sel-aurora",
    name: "Serum Glass Skin",
    category: "Skincare",
    price: 289,
    status: "aprovado",
    curationStatus: "aprovado",
    qualityScore: 97,
    featured: true,
    stock: 182
  },
  {
    id: "prd-002",
    sellerId: "sel-aurora",
    name: "Mist Repair Essence",
    category: "Skincare",
    price: 199,
    status: "destaque",
    curationStatus: "aprovado",
    qualityScore: 95,
    featured: true,
    stock: 136
  },
  {
    id: "prd-003",
    sellerId: "sel-velvet",
    name: "Velvet Matte Ink",
    category: "Makeup",
    price: 149,
    status: "em-revisao",
    curationStatus: "em-revisao",
    qualityScore: 82,
    featured: false,
    stock: 204
  },
  {
    id: "prd-004",
    sellerId: "sel-velvet",
    name: "Soft Focus Palette",
    category: "Makeup",
    price: 329,
    status: "aprovado",
    curationStatus: "aprovado",
    qualityScore: 88,
    featured: true,
    stock: 81
  },
  {
    id: "prd-005",
    sellerId: "sel-lumi",
    name: "Noir Eau Parfum",
    category: "Perfumaria",
    price: 520,
    status: "alerta",
    curationStatus: "pendente",
    qualityScore: 69,
    featured: false,
    stock: 34
  },
  {
    id: "prd-006",
    sellerId: "sel-lumi",
    name: "Amber Musk",
    category: "Perfumaria",
    price: 459,
    status: "pendente",
    curationStatus: "pendente",
    qualityScore: 71,
    featured: false,
    stock: 27
  },
  {
    id: "prd-007",
    sellerId: "sel-nordic",
    name: "Scalp Detox Oil",
    category: "Haircare",
    price: 139,
    status: "em-revisao",
    curationStatus: "em-revisao",
    qualityScore: 76,
    featured: false,
    stock: 120
  },
  {
    id: "prd-008",
    sellerId: "sel-nordic",
    name: "Bond Repair Mask",
    category: "Haircare",
    price: 239,
    status: "critico",
    curationStatus: "reprovado",
    qualityScore: 58,
    featured: false,
    stock: 18
  },
  {
    id: "prd-009",
    sellerId: "sel-botanica",
    name: "Night Cell Balm",
    category: "Skincare",
    price: 349,
    status: "destaque",
    curationStatus: "aprovado",
    qualityScore: 96,
    featured: true,
    stock: 97
  },
  {
    id: "prd-010",
    sellerId: "sel-botanica",
    name: "Calm Barrier Cream",
    category: "Skincare",
    price: 219,
    status: "aprovado",
    curationStatus: "aprovado",
    qualityScore: 92,
    featured: false,
    stock: 142
  },
  {
    id: "prd-011",
    sellerId: "sel-atelierx",
    name: "Cedar Body Wash",
    category: "Corpo e Banho",
    price: 89,
    status: "bloqueado",
    curationStatus: "reprovado",
    qualityScore: 52,
    featured: false,
    stock: 0
  },
  {
    id: "prd-012",
    sellerId: "sel-atelierx",
    name: "Mineral Body Lotion",
    category: "Corpo e Banho",
    price: 119,
    status: "pendente",
    curationStatus: "pendente",
    qualityScore: 63,
    featured: false,
    stock: 49
  }
];

export const curationStatuses: CurationStatus[] = [
  {
    id: "cur-001",
    productId: "prd-003",
    sellerId: "sel-velvet",
    status: "em-revisao",
    reviewer: "Ana Curadoria",
    reason: "Ajustar claim de longa duracao",
    createdAt: "2026-04-03T10:10:00Z",
    updatedAt: "2026-04-04T13:35:00Z"
  },
  {
    id: "cur-002",
    productId: "prd-005",
    sellerId: "sel-lumi",
    status: "pendente",
    reviewer: "Rita Curadoria",
    reason: "Comprovacao IFRA pendente",
    createdAt: "2026-04-02T14:00:00Z",
    updatedAt: "2026-04-04T17:00:00Z"
  },
  {
    id: "cur-003",
    productId: "prd-008",
    sellerId: "sel-nordic",
    status: "reprovado",
    reviewer: "Leonardo Qualidade",
    reason: "Taxa de devolucao acima do limite",
    createdAt: "2026-03-31T11:45:00Z",
    updatedAt: "2026-04-04T09:10:00Z"
  },
  {
    id: "cur-004",
    productId: "prd-012",
    sellerId: "sel-atelierx",
    status: "pendente",
    reviewer: "Ana Curadoria",
    reason: "Documento tecnico vencido",
    createdAt: "2026-04-01T09:00:00Z",
    updatedAt: "2026-04-04T19:00:00Z"
  }
];

export const customers: Customer[] = [
  {
    id: "cus-001",
    name: "Helena Souza",
    segment: "premium",
    status: "premium",
    ltv: 7900,
    openTickets: 0,
    riskFlag: false
  },
  {
    id: "cus-002",
    name: "Marina Duarte",
    segment: "premium",
    status: "alerta",
    ltv: 4820,
    openTickets: 2,
    riskFlag: false
  },
  {
    id: "cus-003",
    name: "Arthur Mendes",
    segment: "standard",
    status: "aprovado",
    ltv: 1430,
    openTickets: 1,
    riskFlag: false
  },
  {
    id: "cus-004",
    name: "Isabela Rocha",
    segment: "premium",
    status: "destaque",
    ltv: 10200,
    openTickets: 0,
    riskFlag: false
  },
  {
    id: "cus-005",
    name: "Renata Lima",
    segment: "standard",
    status: "alerta",
    ltv: 820,
    openTickets: 3,
    riskFlag: true
  },
  {
    id: "cus-006",
    name: "Carlos Teixeira",
    segment: "standard",
    status: "aprovado",
    ltv: 1280,
    openTickets: 0,
    riskFlag: false
  }
];

export const shipments: Shipment[] = [
  {
    id: "shp-401",
    orderId: "ord-9001",
    sellerId: "sel-lumi",
    carrier: "Loggi Premium",
    trackingCode: "LGX9001BR",
    status: "critico",
    eta: "2026-04-03",
    lastUpdateAt: "2026-04-04T18:11:00Z"
  },
  {
    id: "shp-402",
    orderId: "ord-9002",
    sellerId: "sel-velvet",
    carrier: "Sedex",
    trackingCode: "SDX9002BR",
    status: "em-revisao",
    eta: "2026-04-06",
    lastUpdateAt: "2026-04-05T07:30:00Z"
  },
  {
    id: "shp-403",
    orderId: "ord-9003",
    sellerId: "sel-nordic",
    carrier: "Jadlog",
    trackingCode: "JDG9003BR",
    status: "alerta",
    eta: "2026-04-05",
    lastUpdateAt: "2026-04-04T09:55:00Z"
  },
  {
    id: "shp-404",
    orderId: "ord-9004",
    sellerId: "sel-atelierx",
    carrier: "Correios",
    trackingCode: "COR9004BR",
    status: "pendente",
    eta: "2026-04-07",
    lastUpdateAt: "2026-04-04T20:40:00Z"
  },
  {
    id: "shp-405",
    orderId: "ord-9005",
    sellerId: "sel-botanica",
    carrier: "DHL",
    trackingCode: "DHL9005BR",
    status: "resolvido",
    eta: "2026-04-02",
    lastUpdateAt: "2026-04-02T18:00:00Z"
  }
];

export const orders: Order[] = [
  {
    id: "ord-9001",
    customerId: "cus-002",
    sellerId: "sel-lumi",
    productId: "prd-005",
    shipmentId: "shp-401",
    status: "critico",
    logisticsStatus: "critico",
    priority: "critica",
    total: 520,
    createdAt: "2026-04-01T10:20:00Z",
    eta: "2026-04-03"
  },
  {
    id: "ord-9002",
    customerId: "cus-001",
    sellerId: "sel-velvet",
    productId: "prd-003",
    shipmentId: "shp-402",
    status: "em-revisao",
    logisticsStatus: "em-revisao",
    priority: "alta",
    total: 149,
    createdAt: "2026-04-03T09:00:00Z",
    eta: "2026-04-06"
  },
  {
    id: "ord-9003",
    customerId: "cus-003",
    sellerId: "sel-nordic",
    productId: "prd-008",
    shipmentId: "shp-403",
    status: "alerta",
    logisticsStatus: "alerta",
    priority: "alta",
    total: 239,
    createdAt: "2026-04-02T16:00:00Z",
    eta: "2026-04-05"
  },
  {
    id: "ord-9004",
    customerId: "cus-005",
    sellerId: "sel-atelierx",
    productId: "prd-011",
    shipmentId: "shp-404",
    status: "pendente",
    logisticsStatus: "pendente",
    priority: "media",
    total: 89,
    createdAt: "2026-04-04T13:20:00Z",
    eta: "2026-04-07"
  },
  {
    id: "ord-9005",
    customerId: "cus-004",
    sellerId: "sel-botanica",
    productId: "prd-009",
    shipmentId: "shp-405",
    status: "resolvido",
    logisticsStatus: "resolvido",
    priority: "baixa",
    total: 349,
    createdAt: "2026-03-30T08:50:00Z",
    eta: "2026-04-02"
  },
  {
    id: "ord-9006",
    customerId: "cus-006",
    sellerId: "sel-aurora",
    productId: "prd-001",
    shipmentId: "shp-405",
    status: "aprovado",
    logisticsStatus: "resolvido",
    priority: "baixa",
    total: 289,
    createdAt: "2026-04-02T11:10:00Z",
    eta: "2026-04-04"
  }
];

export const logisticsIncidents: LogisticsIncident[] = [
  {
    id: "inc-701",
    orderId: "ord-9001",
    shipmentId: "shp-401",
    sellerId: "sel-lumi",
    status: "critico",
    priority: "critica",
    type: "Atraso sem movimentacao",
    summary: "Sem evento de rastreio por 48h em rota SP",
    openedAt: "2026-04-04T12:00:00Z",
    refundId: "rfd-301"
  },
  {
    id: "inc-702",
    orderId: "ord-9003",
    shipmentId: "shp-403",
    sellerId: "sel-nordic",
    status: "alerta",
    priority: "alta",
    type: "Endereco parcial",
    summary: "Falha de CEP no manifesto de coleta",
    openedAt: "2026-04-04T15:20:00Z"
  },
  {
    id: "inc-703",
    orderId: "ord-9004",
    shipmentId: "shp-404",
    sellerId: "sel-atelierx",
    status: "em-revisao",
    priority: "media",
    type: "Rastreio nao vinculado",
    summary: "Etiqueta emitida sem sincronismo no OMS",
    openedAt: "2026-04-05T08:30:00Z"
  }
];

export const refunds: Refund[] = [
  {
    id: "rfd-301",
    orderId: "ord-9001",
    sellerId: "sel-lumi",
    customerId: "cus-002",
    amount: 520,
    reason: "Atraso critico",
    status: "pendente",
    requestedAt: "2026-04-04T19:10:00Z",
    logisticsIncidentId: "inc-701"
  },
  {
    id: "rfd-302",
    orderId: "ord-9003",
    sellerId: "sel-nordic",
    customerId: "cus-003",
    amount: 239,
    reason: "Produto recebido danificado",
    status: "em-revisao",
    requestedAt: "2026-04-04T10:45:00Z",
    logisticsIncidentId: "inc-702"
  },
  {
    id: "rfd-303",
    orderId: "ord-9005",
    sellerId: "sel-botanica",
    customerId: "cus-004",
    amount: 0,
    reason: "Sem devolucao",
    status: "resolvido",
    requestedAt: "2026-04-02T11:00:00Z"
  }
];

export const payouts: Payout[] = [
  {
    id: "pay-201",
    sellerId: "sel-aurora",
    orderIds: ["ord-9006"],
    period: "30d",
    grossAmount: 289,
    netAmount: 245.65,
    status: "aprovado",
    scheduledAt: "2026-04-08"
  },
  {
    id: "pay-202",
    sellerId: "sel-lumi",
    orderIds: ["ord-9001"],
    period: "30d",
    grossAmount: 520,
    netAmount: 0,
    status: "bloqueado",
    scheduledAt: "2026-04-08"
  },
  {
    id: "pay-203",
    sellerId: "sel-velvet",
    orderIds: ["ord-9002"],
    period: "30d",
    grossAmount: 149,
    netAmount: 126.65,
    status: "em-revisao",
    scheduledAt: "2026-04-08"
  },
  {
    id: "pay-204",
    sellerId: "sel-nordic",
    orderIds: ["ord-9003"],
    period: "30d",
    grossAmount: 239,
    netAmount: 0,
    status: "alerta",
    scheduledAt: "2026-04-08"
  }
];

export const financialAlerts: FinancialAlert[] = [
  {
    id: "fal-901",
    sellerId: "sel-lumi",
    orderId: "ord-9001",
    refundId: "rfd-301",
    payoutId: "pay-202",
    status: "critico",
    priority: "critica",
    type: "Risco de chargeback",
    summary: "Pedido critico com atraso e abertura de chargeback",
    createdAt: "2026-04-04T20:30:00Z"
  },
  {
    id: "fal-902",
    sellerId: "sel-nordic",
    orderId: "ord-9003",
    refundId: "rfd-302",
    payoutId: "pay-204",
    status: "alerta",
    priority: "alta",
    type: "Divergencia de frete",
    summary: "Custo logistico acima da margem permitida",
    createdAt: "2026-04-04T12:00:00Z"
  },
  {
    id: "fal-903",
    sellerId: "sel-atelierx",
    orderId: "ord-9004",
    status: "pendente",
    priority: "media",
    type: "Conta bancaria vencida",
    summary: "Dados bancarios sem validacao para repasse",
    createdAt: "2026-04-05T09:10:00Z"
  }
];

export const reviews: Review[] = [
  {
    id: "rev-601",
    productId: "prd-001",
    sellerId: "sel-aurora",
    customerId: "cus-001",
    rating: 5,
    status: "destaque",
    sentiment: "positivo",
    excerpt: "Resultado visivel em 7 dias e embalagem premium.",
    createdAt: "2026-04-01T20:00:00Z"
  },
  {
    id: "rev-602",
    productId: "prd-005",
    sellerId: "sel-lumi",
    customerId: "cus-002",
    rating: 2,
    status: "critico",
    sentiment: "negativo",
    excerpt: "Atrasou e chegou com vazamento na tampa.",
    createdAt: "2026-04-04T21:00:00Z"
  },
  {
    id: "rev-603",
    productId: "prd-008",
    sellerId: "sel-nordic",
    customerId: "cus-003",
    rating: 3,
    status: "alerta",
    sentiment: "neutro",
    excerpt: "Funciona, mas demorou para chegar.",
    createdAt: "2026-04-04T12:20:00Z"
  },
  {
    id: "rev-604",
    productId: "prd-009",
    sellerId: "sel-botanica",
    customerId: "cus-004",
    rating: 5,
    status: "premium",
    sentiment: "positivo",
    excerpt: "Textura impecavel e atendimento excelente.",
    createdAt: "2026-04-03T16:15:00Z"
  }
];

export const documents: Document[] = [
  {
    id: "doc-801",
    sellerId: "sel-lumi",
    type: "Comprovacao IFRA",
    status: "pendente",
    dueDate: "2026-04-06",
    owner: "Compliance"
  },
  {
    id: "doc-802",
    sellerId: "sel-atelierx",
    type: "Certificado ANVISA",
    status: "bloqueado",
    dueDate: "2026-04-03",
    owner: "Compliance"
  },
  {
    id: "doc-803",
    sellerId: "sel-velvet",
    type: "Contrato comercial",
    status: "em-revisao",
    dueDate: "2026-04-08",
    owner: "Juridico"
  },
  {
    id: "doc-804",
    sellerId: "sel-aurora",
    type: "Seguro de transporte",
    status: "aprovado",
    dueDate: "2026-04-10",
    owner: "Operacoes"
  }
];

export const curationRules: CurationRule[] = [
  {
    id: "rule-claim-001",
    name: "Claims de longa duracao exigem evidência validada",
    scope: "claim",
    status: "aprovado",
    priority: "alta",
    owner: "Curadoria",
    targetType: "product",
    targetId: "prd-003",
    condition: "Produtos de maquiagem com promessa acima de 12h",
    action: "Mover para revisao e solicitar ajuste de claim",
    updatedAt: "2026-04-04T13:30:00Z"
  },
  {
    id: "rule-doc-002",
    name: "Fragrancia premium sem IFRA atual bloqueia vitrine",
    scope: "documento",
    status: "critico",
    priority: "critica",
    owner: "Compliance",
    targetType: "product",
    targetId: "prd-005",
    condition: "Ausencia de comprovacao IFRA vigente",
    action: "Suspender destaque e abrir pendencia documental",
    updatedAt: "2026-04-04T16:20:00Z"
  },
  {
    id: "rule-log-003",
    name: "Reprovacao automatica por devolucao acima da meta",
    scope: "logistica",
    status: "alerta",
    priority: "alta",
    owner: "Qualidade",
    targetType: "product",
    targetId: "prd-008",
    condition: "Taxa de devolucao acima de 12% em 15 dias",
    action: "Reprovar SKU e abrir monitoramento de seller",
    updatedAt: "2026-04-04T09:05:00Z"
  },
  {
    id: "rule-rep-004",
    name: "Seller bloqueado perde prioridade editorial",
    scope: "reputacao",
    status: "bloqueado",
    priority: "critica",
    owner: "Operacao",
    targetType: "seller",
    targetId: "sel-atelierx",
    condition: "Bloqueio operacional ou regulatorio ativo",
    action: "Remover vitrines, reter repasse e escalar auditoria",
    updatedAt: "2026-04-05T09:20:00Z"
  }
];

export const complianceFlags: ComplianceFlag[] = [
  {
    id: "cmpf-001",
    sellerId: "sel-lumi",
    productId: "prd-005",
    documentId: "doc-801",
    type: "IFRA pendente para fragrancia premium",
    status: "critico",
    priority: "critica",
    summary: "Produto em rota de destaque sem comprovacao IFRA vigente.",
    createdAt: "2026-04-04T16:25:00Z"
  },
  {
    id: "cmpf-002",
    sellerId: "sel-atelierx",
    documentId: "doc-802",
    type: "Certificado regulatorio vencido",
    status: "bloqueado",
    priority: "critica",
    summary: "Seller bloqueado ate regularizacao do certificado ANVISA.",
    createdAt: "2026-04-03T11:30:00Z"
  },
  {
    id: "cmpf-003",
    sellerId: "sel-nordic",
    productId: "prd-008",
    alertId: "fal-902",
    type: "Divergencia operacional com impacto financeiro",
    status: "alerta",
    priority: "alta",
    summary: "Queda de score, devolucao e frete acima da margem no mesmo SKU.",
    createdAt: "2026-04-04T12:10:00Z"
  }
];

export const campaigns: Campaign[] = [
  {
    id: "cmp-101",
    name: "Editoriais de Inverno",
    productIds: ["prd-001", "prd-009", "prd-004"],
    sellerIds: ["sel-aurora", "sel-botanica", "sel-velvet"],
    status: "destaque",
    period: "30d",
    highlight: true,
    upliftPct: 18
  },
  {
    id: "cmp-102",
    name: "Selecao Hair Recovery",
    productIds: ["prd-007", "prd-008"],
    sellerIds: ["sel-nordic"],
    status: "em-revisao",
    period: "7d",
    highlight: false,
    upliftPct: 4
  },
  {
    id: "cmp-103",
    name: "Fragrancias Noturnas",
    productIds: ["prd-005", "prd-006"],
    sellerIds: ["sel-lumi"],
    status: "alerta",
    period: "30d",
    highlight: false,
    upliftPct: -2
  }
];

export const internalUsers: InternalUser[] = [
  {
    id: "usr-001",
    name: "Ana Curadoria",
    role: "Head de Curadoria",
    area: "Curadoria",
    status: "premium",
    lastAccessAt: "2026-04-05T08:40:00Z"
  },
  {
    id: "usr-002",
    name: "Bruno Operacoes",
    role: "Coord. Logistica",
    area: "Operacao",
    status: "aprovado",
    lastAccessAt: "2026-04-05T08:55:00Z"
  },
  {
    id: "usr-003",
    name: "Clara Finance",
    role: "Controller",
    area: "Financeiro",
    status: "aprovado",
    lastAccessAt: "2026-04-05T07:10:00Z"
  },
  {
    id: "usr-004",
    name: "Diego Compliance",
    role: "Analista Senior",
    area: "Compliance",
    status: "alerta",
    lastAccessAt: "2026-04-04T18:00:00Z"
  }
];

export const platformSettings: PlatformSetting[] = [
  {
    id: "set-001",
    area: "financeiro",
    label: "Take rate padrao",
    value: "12.5%",
    owner: "Financeiro",
    status: "aprovado",
    linkedRoute: "/adm/financeiro/repasses",
    updatedAt: "2026-04-01T09:00:00Z"
  },
  {
    id: "set-002",
    area: "logistica",
    label: "Janela de SLA critico",
    value: "48h sem evento",
    owner: "Operacao",
    status: "alerta",
    linkedRoute: "/adm/operacao/logistica/incidentes",
    updatedAt: "2026-04-04T12:00:00Z"
  },
  {
    id: "set-003",
    area: "curadoria",
    label: "Claim premium com prova obrigatoria",
    value: "Ativo para skincare e perfumaria",
    owner: "Curadoria",
    status: "aprovado",
    linkedRoute: "/adm/curadoria/regras",
    updatedAt: "2026-04-04T13:20:00Z"
  },
  {
    id: "set-004",
    area: "seguranca",
    label: "Step-up por Passkey para perfis internos",
    value: "Obrigatorio em rotas sensiveis",
    owner: "Seguranca",
    status: "premium",
    linkedRoute: "/adm/gestao/usuarios-internos",
    updatedAt: "2026-04-05T08:05:00Z"
  }
];

export const activityLogs: ActivityLog[] = [
  {
    id: "act-1001",
    userId: "usr-001",
    entityType: "product",
    entityId: "prd-003",
    action: "Solicitou ajuste de claim comercial",
    status: "em-revisao",
    createdAt: "2026-04-04T13:40:00Z"
  },
  {
    id: "act-1002",
    userId: "usr-002",
    entityType: "incident",
    entityId: "inc-701",
    action: "Escalonou incidente para transportadora",
    status: "critico",
    createdAt: "2026-04-04T19:02:00Z"
  },
  {
    id: "act-1003",
    userId: "usr-003",
    entityType: "payout",
    entityId: "pay-202",
    action: "Bloqueou repasse por risco operacional",
    status: "bloqueado",
    createdAt: "2026-04-04T20:45:00Z"
  },
  {
    id: "act-1004",
    userId: "usr-004",
    entityType: "document",
    entityId: "doc-802",
    action: "Marcado como documento vencido",
    status: "bloqueado",
    createdAt: "2026-04-03T11:30:00Z"
  }
];

export const auditTrail: AuditTrailEntry[] = [
  {
    id: "act-1001",
    userId: "usr-001",
    entityType: "product",
    entityId: "prd-003",
    actionType: "product.request-adjustment",
    actionLabel: "Solicitou ajuste de claim comercial",
    status: "em-revisao",
    createdAt: "2026-04-04T13:40:00Z",
    contextPathname: "/adm/curadoria/produtos?product=prd-003",
    summary: "Produto devolvido ao seller para ajuste do claim de longa duracao.",
    before: {
      status: "pendente",
      curationStatus: "pendente",
      featured: false,
      qualityScore: 82
    },
    after: {
      status: "em-revisao",
      curationStatus: "em-revisao",
      featured: false,
      qualityScore: 82
    },
    metadata: {
      reviewer: "Ana Curadoria",
      reason: "Ajustar claim de longa duracao"
    }
  },
  {
    id: "act-1002",
    userId: "usr-002",
    entityType: "incident",
    entityId: "inc-701",
    actionType: "incident.register",
    actionLabel: "Escalonou incidente para transportadora",
    status: "critico",
    createdAt: "2026-04-04T19:02:00Z",
    contextPathname: "/adm/operacao/logistica/incidentes?shipment=shp-401",
    summary: "Incidente logistico mantido em nivel critico e escalado para tratativa manual.",
    before: {
      status: "alerta",
      priority: "alta",
      type: "Atraso sem movimentacao"
    },
    after: {
      status: "critico",
      priority: "critica",
      type: "Atraso sem movimentacao"
    },
    metadata: {
      shipmentId: "shp-401",
      orderId: "ord-9001",
      refundId: "rfd-301"
    }
  },
  {
    id: "act-1003",
    userId: "usr-003",
    entityType: "payout",
    entityId: "pay-202",
    actionType: "payout.hold",
    actionLabel: "Bloqueou repasse por risco operacional",
    status: "bloqueado",
    createdAt: "2026-04-04T20:45:00Z",
    contextPathname: "/adm/financeiro/repasses?payout=pay-202",
    summary: "Repasse segurado ate fechamento da auditoria financeira do pedido critico.",
    before: {
      status: "em-revisao",
      grossAmount: 520,
      netAmount: 0
    },
    after: {
      status: "bloqueado",
      grossAmount: 520,
      netAmount: 0
    },
    metadata: {
      sellerId: "sel-lumi",
      alertId: "fal-901"
    }
  },
  {
    id: "act-1004",
    userId: "usr-004",
    entityType: "document",
    entityId: "doc-802",
    actionType: "document.request-update",
    actionLabel: "Marcado como documento vencido",
    status: "bloqueado",
    createdAt: "2026-04-03T11:30:00Z",
    contextPathname: "/adm/curadoria/documentos?document=doc-802",
    summary: "Documento tecnico vencido manteve o seller em bloqueio ate nova submissao.",
    before: {
      status: "em-revisao",
      dueDate: "2026-04-03",
      owner: "Compliance"
    },
    after: {
      status: "bloqueado",
      dueDate: "2026-04-03",
      owner: "Compliance"
    },
    metadata: {
      sellerId: "sel-atelierx",
      type: "Certificado ANVISA"
    }
  }
];

export const qualityScores: QualityScore[] = [
  {
    id: "qsc-001",
    sellerId: "sel-aurora",
    score: 96,
    status: "destaque",
    trend: "up",
    updatedAt: "2026-04-05T07:00:00Z"
  },
  {
    id: "qsc-002",
    sellerId: "sel-velvet",
    score: 89,
    status: "aprovado",
    trend: "stable",
    updatedAt: "2026-04-05T07:00:00Z"
  },
  {
    id: "qsc-003",
    sellerId: "sel-lumi",
    score: 74,
    status: "alerta",
    trend: "down",
    updatedAt: "2026-04-05T07:00:00Z"
  },
  {
    id: "qsc-004",
    sellerId: "sel-nordic",
    score: 78,
    status: "em-revisao",
    trend: "down",
    updatedAt: "2026-04-05T07:00:00Z"
  },
  {
    id: "qsc-005",
    sellerId: "sel-botanica",
    score: 94,
    status: "premium",
    trend: "up",
    updatedAt: "2026-04-05T07:00:00Z"
  },
  {
    id: "qsc-006",
    sellerId: "sel-atelierx",
    score: 61,
    status: "critico",
    trend: "down",
    updatedAt: "2026-04-05T07:00:00Z"
  }
];

export const adminMockData = {
  sellers,
  products,
  curationStatuses,
  curationRules,
  orders,
  shipments,
  logisticsIncidents,
  payouts,
  refunds,
  financialAlerts,
  customers,
  reviews,
  documents,
  complianceFlags,
  campaigns,
  internalUsers,
  platformSettings,
  activityLogs,
  auditTrail,
  qualityScores
};
