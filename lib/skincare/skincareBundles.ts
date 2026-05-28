export type SkinBundleGoal =
  | "manha"
  | "noite"
  | "glow"
  | "barreira"
  | "sensível"
  | "descoberta";

export type SkinBundleSkinType = "oleosa" | "mista" | "seca" | "sensível" | "normal";

export type SkinBundleSort = "recommended" | "starter" | "price-asc" | "price-desc";

export type SkinBundleProduct = {
  step: number;
  productId: string;
  sellerId: string;
  name: string;
  usage: string;
  benefit: string;
  price: number;
  quantity?: number;
};

export type SkinBundle = {
  id: string;
  name: string;
  slug: string;
  subtitle: string;
  description: string;
  promise: string;
  skinTypes: SkinBundleSkinType[];
  concerns: string[];
  useMoment: string[];
  priceRange: "entrada" | "medio" | "premium";
  goal: SkinBundleGoal;
  goalLabel: string;
  objective: string;
  badge: string;
  conversionBadge?: string;
  originalPrice: number;
  bundlePrice: number;
  price: number;
  savings: number;
  benefit: string;
  expectedResult: string;
  recommendedFor: string[];
  ticketLabel: string;
  recommendationScore: number;
  bestForStart?: boolean;
  featured?: boolean;
  image: string;
  imageAlt: string;
  productIds: string[];
  products: SkinBundleProduct[];
  routineSteps: string[];
  usageOrder: string[];
  tags: string[];
  cta: string;
  secondaryCta: string;
};

const sellerSkin = "s1";
const sellerMake = "s2";
const sellerWellness = "s3";

function withProductIds(bundle: Omit<SkinBundle, "productIds" | "price">): SkinBundle {
  return {
    ...bundle,
    price: bundle.bundlePrice,
    productIds: bundle.products.map((product) => product.productId)
  };
}

export const skincareBundles: SkinBundle[] = [
  withProductIds({
    id: "ritual-manha",
    name: "Ritual da Manha",
    slug: "ritual-da-manha",
    subtitle: "Preparar, hidratar e proteger.",
    description:
      "Uma rotina inteligente para começar o dia com pele limpa, luminosa e protegida.",
    promise: "Hidratação, proteção e vico para o dia.",
    skinTypes: ["normal", "mista", "seca", "oleosa"],
    concerns: ["proteção diaria", "opacidade", "rotina essencial"],
    useMoment: ["manha"],
    priceRange: "premium",
    goal: "manha",
    goalLabel: "Manha",
    objective: "proteção diaria",
    badge: "Curadoria BelaPop",
    conversionBadge: "Estoque limitado",
    originalPrice: 989,
    bundlePrice: 849,
    savings: 140,
    benefit: "Pele preparada, confortavel e protegida sem excesso de passos.",
    expectedResult: "Pele com acabamento mais fresco, hidratado e pronta para o dia.",
    recommendedFor: ["Quem quer uma rotina objetiva", "Peles que pedem proteção diaria"],
    ticketLabel: "Ticket sugerido",
    recommendationScore: 96,
    bestForStart: true,
    featured: true,
    image: "/hero-bela-pop-editorial.jpg",
    imageAlt: "Rotina de skincare editorial com pele luminosa e frascos premium.",
    products: [
      {
        step: 1,
        productId: "p10",
        sellerId: sellerSkin,
        name: "Gel Limpeza Veludo",
        usage: "Use pela manha com o rosto umido.",
        benefit: "Remove impurezas sem ressecar.",
        price: 182
      },
      {
        step: 2,
        productId: "p1",
        sellerId: sellerSkin,
        name: "Serum Radiance 01",
        usage: "Aplique antes do hidratante.",
        benefit: "Ajuda na luminosidade e uniformidade.",
        price: 289
      },
      {
        step: 3,
        productId: "p2",
        sellerId: sellerSkin,
        name: "Creme Barrier Celeste",
        usage: "Use uma camada fina antes da proteção.",
        benefit: "Mantem a pele confortavel ao longo do dia.",
        price: 320
      },
      {
        step: 4,
        productId: "p11",
        sellerId: sellerSkin,
        name: "Patch Olhos Aurora",
        usage: "Use quando quiser reforcar frescor no olhar.",
        benefit: "Apoia hidratação e efeito descansado.",
        price: 198
      }
    ],
    routineSteps: ["Limpeza", "Serum", "Hidratante", "Cuidado de acabamento"],
    usageOrder: ["Limpeza", "Serum", "Hidratante", "Acabamento"],
    tags: ["normal", "mista", "seca", "oleosa", "manha", "premium"],
    cta: "Adicionar kit ao carrinho",
    secondaryCta: "Ver rotina"
  }),
  withProductIds({
    id: "ritual-noite",
    name: "Ritual da Noite",
    slug: "ritual-da-noite",
    subtitle: "Reparar enquanto a pele descansa.",
    description:
      "Tratamento noturno para renovar, reparar e acordar com sensacao de pele descansada.",
    promise: "Reparacao e conforto para o periodo noturno.",
    skinTypes: ["normal", "mista", "seca"],
    concerns: ["textura", "ressecamento", "reparacao"],
    useMoment: ["noite"],
    priceRange: "premium",
    goal: "noite",
    goalLabel: "Noite",
    objective: "renovacao noturna",
    badge: "Rotina completa",
    conversionBadge: "Estoque limitado",
    originalPrice: 1029,
    bundlePrice: 899,
    savings: 130,
    benefit: "Rotina de alto conforto para tratar sem deixar a pele sobrecarregada.",
    expectedResult: "Pele mais macia, com textura mais uniforme e sensacao de descanso.",
    recommendedFor: ["Quem sente a pele cansada", "Rotinas que precisam de reparo"],
    ticketLabel: "Ticket sugerido",
    recommendationScore: 91,
    image: "/editorial/login-hero-original.jpg",
    imageAlt: "Cena editorial noturna de beleza premium.",
    products: [
      {
        step: 1,
        productId: "p10",
        sellerId: sellerSkin,
        name: "Gel Limpeza Veludo",
        usage: "Use a noite para remover residuos do dia.",
        benefit: "Prepara a pele para receber tratamento.",
        price: 182
      },
      {
        step: 2,
        productId: "p2",
        sellerId: sellerSkin,
        name: "Creme Barrier Celeste",
        usage: "Aplique como tratamento de conforto.",
        benefit: "Reforca barreira e maciez.",
        price: 320
      },
      {
        step: 3,
        productId: "p1",
        sellerId: sellerSkin,
        name: "Serum Radiance 01",
        usage: "Use em noites alternadas conforme tolerancia.",
        benefit: "Apoia luminosidade e uniformidade.",
        price: 289
      },
      {
        step: 4,
        productId: "p12",
        sellerId: sellerWellness,
        name: "Cha Botanical Calm",
        usage: "Inclua como ritual complementar noturno.",
        benefit: "Torna a rotina mais sensorial e desacelerada.",
        price: 140
      }
    ],
    routineSteps: ["Limpeza", "Tratamento", "Creme reparador", "Ritual complementar"],
    usageOrder: ["Limpeza", "Tratamento", "Hidratante", "Complemento"],
    tags: ["normal", "mista", "seca", "noite", "premium"],
    cta: "Adicionar kit ao carrinho",
    secondaryCta: "Ver rotina"
  }),
  withProductIds({
    id: "kit-barreira",
    name: "Kit Barreira",
    slug: "kit-barreira",
    subtitle: "Conforto e barreira fortalecida.",
    description:
      "Cuidado de conforto para pele seca, sensibilizada ou com barreira fragilizada.",
    promise: "Mais conforto, menos ressecamento e barreira fortalecida.",
    skinTypes: ["seca", "sensível", "normal"],
    concerns: ["barreira", "ressecamento", "sensibilidade"],
    useMoment: ["manha", "noite"],
    priceRange: "medio",
    goal: "barreira",
    goalLabel: "Barreira",
    objective: "fortalecimento da barreira",
    badge: "Mais vendido",
    conversionBadge: "Mais escolhido da semana",
    originalPrice: 882,
    bundlePrice: 769,
    savings: 113,
    benefit: "Conforto imediato com rotina de baixo atrito.",
    expectedResult: "Pele menos repuxada, mais macia e com melhor tolerancia.",
    recommendedFor: ["Pele seca", "Pele sensibilizada", "Uso pos-procedimento cosmético leve"],
    ticketLabel: "Ticket sugerido",
    recommendationScore: 94,
    image: "/editorial/home-ai-card.jpg",
    imageAlt: "Close editorial de pele e tecnologia BelaPop.",
    products: [
      {
        step: 1,
        productId: "p10",
        sellerId: sellerSkin,
        name: "Gel Limpeza Veludo",
        usage: "Massageie sem friccionar.",
        benefit: "Limpa respeitando a barreira.",
        price: 182
      },
      {
        step: 2,
        productId: "p2",
        sellerId: sellerSkin,
        name: "Creme Barrier Celeste",
        usage: "Use manha e noite.",
        benefit: "Reforca maciez e elasticidade.",
        price: 320
      },
      {
        step: 3,
        productId: "p11",
        sellerId: sellerSkin,
        name: "Patch Olhos Aurora",
        usage: "Use nas areas que pedem conforto extra.",
        benefit: "Entrega hidratação localizada.",
        price: 198
      },
      {
        step: 4,
        productId: "p7",
        sellerId: sellerWellness,
        name: "Body Mist Rosa Profundo",
        usage: "Use como complemento sensorial.",
        benefit: "Finaliza o ritual com toque acetinado.",
        price: 220
      }
    ],
    routineSteps: ["Limpeza gentil", "Creme reparador", "Hidratação localizada", "Sensorial"],
    usageOrder: ["Limpador", "Creme", "Patch", "Complemento"],
    tags: ["seca", "sensível", "barreira", "conforto", "medio"],
    cta: "Adicionar kit ao carrinho",
    secondaryCta: "Ver rotina"
  }),
  withProductIds({
    id: "kit-glow",
    name: "Kit Glow",
    slug: "kit-glow",
    subtitle: "Vico com acabamento editorial.",
    description: "Uma seleção para luminosidade, vico e aparencia de pele saudavel.",
    promise: "Glow elegante sem parecer excesso.",
    skinTypes: ["normal", "mista", "seca"],
    concerns: ["glow", "opacidade", "textura"],
    useMoment: ["manha", "evento"],
    priceRange: "medio",
    goal: "glow",
    goalLabel: "Glow",
    objective: "luminosidade",
    badge: "Glow imediato",
    conversionBadge: "Rotina viral no TikTok",
    originalPrice: 887,
    bundlePrice: 779,
    savings: 108,
    benefit: "Pele mais luminosa com acabamento sofisticado.",
    expectedResult: "Aparencia descansada, luminosa e com textura mais polida.",
    recommendedFor: ["Pele opaca", "Preparacao de maquiagem", "Rotina de evento"],
    ticketLabel: "Ticket sugerido",
    recommendationScore: 89,
    image: "/editorial/belapop-skin-scan-hero-poster.jpg",
    imageAlt: "Beleza editorial com luz suave e acabamento glow.",
    products: [
      {
        step: 1,
        productId: "p10",
        sellerId: sellerSkin,
        name: "Gel Limpeza Veludo",
        usage: "Comece com pele limpa.",
        benefit: "Remove opacidade superficial.",
        price: 182
      },
      {
        step: 2,
        productId: "p1",
        sellerId: sellerSkin,
        name: "Serum Radiance 01",
        usage: "Aplique antes do hidratante.",
        benefit: "Ajuda no vico e uniformidade.",
        price: 289
      },
      {
        step: 3,
        productId: "p11",
        sellerId: sellerSkin,
        name: "Patch Olhos Aurora",
        usage: "Use 10 minutos antes da maquiagem.",
        benefit: "Potencializa o aspecto descansado.",
        price: 198
      },
      {
        step: 4,
        productId: "p4",
        sellerId: sellerMake,
        name: "Blush Veu Rose",
        usage: "Finalize nas macas do rosto.",
        benefit: "Entrega cor saudavel e acabamento translcido.",
        price: 198
      }
    ],
    routineSteps: ["Limpeza", "Serum iluminador", "Patch", "Acabamento glow"],
    usageOrder: ["Limpeza", "Serum", "Patch", "Blush"],
    tags: ["normal", "mista", "seca", "glow", "evento", "medio"],
    cta: "Adicionar kit ao carrinho",
    secondaryCta: "Ver rotina"
  }),
  withProductIds({
    id: "pele-sensível",
    name: "Kit Pele Sensível",
    slug: "pele-sensível",
    subtitle: "Cuidado gentil, previsivel e seguro.",
    description:
      "Rotina calma para peles sensibilizadas que precisam de seguranca e conforto.",
    promise: "Cuidado calmante e seguro para reduzir atrito.",
    skinTypes: ["sensível", "seca", "normal"],
    concerns: ["sensibilidade", "vermelhidao", "barreira"],
    useMoment: ["manha", "noite"],
    priceRange: "medio",
    goal: "sensível",
    goalLabel: "Sensível",
    objective: "cuidado gentil",
    badge: "Pele sensível",
    conversionBadge: "Estoque limitado",
    originalPrice: 700,
    bundlePrice: 629,
    savings: 71,
    benefit: "Menos agressao, mais previsibilidade.",
    expectedResult: "Pele com menor sensacao de desconforto e rotina mais facil de manter.",
    recommendedFor: ["Pele reativa", "Rotinas minimalistas", "Quem evita ativos agressivos"],
    ticketLabel: "Ticket sugerido",
    recommendationScore: 93,
    image: "/hero-bela.jpg",
    imageAlt: "Rosto feminino em luz suave com foco em pele sensível.",
    products: [
      {
        step: 1,
        productId: "p10",
        sellerId: sellerSkin,
        name: "Gel Limpeza Veludo",
        usage: "Use com agua fria ou morna.",
        benefit: "Limpa sem sensacao de pele repuxada.",
        price: 182
      },
      {
        step: 2,
        productId: "p2",
        sellerId: sellerSkin,
        name: "Creme Barrier Celeste",
        usage: "Use manha e noite.",
        benefit: "Ajuda a reduzir desconforto.",
        price: 320
      },
      {
        step: 3,
        productId: "p11",
        sellerId: sellerSkin,
        name: "Patch Olhos Aurora",
        usage: "Use quando a pele pedir frescor.",
        benefit: "Apoia hidratação localizada.",
        price: 198
      }
    ],
    routineSteps: ["Limpeza sem agressao", "Creme calmante", "Hidratação localizada"],
    usageOrder: ["Limpador", "Creme", "Patch"],
    tags: ["sensível", "seca", "normal", "barreira", "medio"],
    cta: "Adicionar kit ao carrinho",
    secondaryCta: "Ver rotina"
  }),
  withProductIds({
    id: "edição-descoberta",
    name: "Edição Descoberta",
    slug: "edição-descoberta",
    subtitle: "Entrada acessivel na curadoria.",
    description:
      "A porta de entrada para experimentar a curadoria BelaPop com baixo risco.",
    promise: "Campeoes de recompra para descobrir favoritos.",
    skinTypes: ["normal", "mista", "seca", "oleosa", "sensível"],
    concerns: ["descoberta", "primeira compra", "baixo risco"],
    useMoment: ["primeira compra"],
    priceRange: "entrada",
    goal: "descoberta",
    goalLabel: "Descoberta",
    objective: "entrada acessivel",
    badge: "Novo",
    conversionBadge: "Mais escolhido da semana",
    originalPrice: 669,
    bundlePrice: 579,
    savings: 90,
    benefit: "Teste a curadoria antes de montar a rotina completa.",
    expectedResult: "Primeiro contato com texturas e sensoriais sem montar uma rotina longa.",
    recommendedFor: ["Primeira compra BelaPop", "Presente de entrada", "Rotina minimalista"],
    ticketLabel: "Ticket sugerido",
    recommendationScore: 98,
    bestForStart: true,
    image: "/vitrine-premium-bg.png",
    imageAlt: "Composicao premium de produtos BelaPop para descoberta.",
    products: [
      {
        step: 1,
        productId: "p10",
        sellerId: sellerSkin,
        name: "Gel Limpeza Veludo",
        usage: "Use como primeiro passo.",
        benefit: "Entrada segura para testar textura.",
        price: 182
      },
      {
        step: 2,
        productId: "p1",
        sellerId: sellerSkin,
        name: "Serum Radiance 01",
        usage: "Teste por alguns dias.",
        benefit: "Ajuda a entender tolerancia e sensorial.",
        price: 289
      },
      {
        step: 3,
        productId: "p9",
        sellerId: sellerMake,
        name: "Lip Tint Atelier",
        usage: "Use como acabamento de baixo risco.",
        benefit: "Adiciona cor e conforto imediato.",
        price: 165
      }
    ],
    routineSteps: ["Limpeza", "Serum", "Acabamento"],
    usageOrder: ["Limpeza", "Serum", "Finalizacao"],
    tags: ["descoberta", "entrada", "normal", "mista", "sensível"],
    cta: "Adicionar kit ao carrinho",
    secondaryCta: "Ver rotina"
  })
];

export const skinBundleGoalOptions = [
  { value: "todos", label: "Todos" },
  { value: "manha", label: "Manha" },
  { value: "noite", label: "Noite" },
  { value: "glow", label: "Glow" },
  { value: "barreira", label: "Barreira" },
  { value: "sensível", label: "Sensível" },
  { value: "descoberta", label: "Descoberta" }
] as const;

export const skinBundleSkinTypeOptions = [
  { value: "todos", label: "Todos" },
  { value: "oleosa", label: "Oleosa" },
  { value: "mista", label: "Mista" },
  { value: "seca", label: "Seca" },
  { value: "sensível", label: "Sensível" },
  { value: "normal", label: "Normal" }
] as const;

export const skinBundleSortOptions = [
  { value: "recommended", label: "Mais recomendado" },
  { value: "starter", label: "Melhor para começar" },
  { value: "price-asc", label: "Menor preco" },
  { value: "price-desc", label: "Maior ticket" }
] as const;

export const formatBundleCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);

export function sortSkinBundles(bundles: SkinBundle[], sort: SkinBundleSort) {
  return [...bundles].sort((a, b) => {
    if (sort === "price-asc") return a.bundlePrice - b.bundlePrice;
    if (sort === "price-desc") return b.bundlePrice - a.bundlePrice;
    if (sort === "starter") {
      return (
        Number(b.bestForStart ?? false) - Number(a.bestForStart ?? false) ||
        b.recommendationScore - a.recommendationScore
      );
    }
    return b.recommendationScore - a.recommendationScore;
  });
}

export function getSkinBundleBySlug(slug: string) {
  return skincareBundles.find((bundle) => bundle.slug === slug) ?? null;
}

export function getSkinBundleById(id: string) {
  return skincareBundles.find((bundle) => bundle.id === id) ?? null;
}

export function getBundleProductFallback(productId: string) {
  for (const bundle of skincareBundles) {
    const product = bundle.products.find((item) => item.productId === productId);
    if (product) {
      return {
        id: product.productId,
        name: product.name,
        category: "Skincare",
        price: product.price,
        sellerId: product.sellerId,
        bundleName: bundle.name,
        image: bundle.image
      };
    }
  }
  return null;
}
