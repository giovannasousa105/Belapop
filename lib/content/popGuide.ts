import { skincareBundles } from "@/lib/skincare/skincareBundles";

export type PopGuideCategory =
  | "ativos"
  | "rotinas"
  | "curadoria-da-semana"
  | "vale-o-investimento";

export type SkinTypeTag = "oleosa" | "mista" | "seca" | "sensível" | "normal";

export type RoutineStepPeriod = "manha" | "noite";

export type ProductRecommendation = {
  productId: string;
  slug: string;
  name: string;
  brand: string;
  role: string;
  price: number;
  collectionIds: string[];
  ingredientTags: string[];
  needTags: string[];
  skinTypes: SkinTypeTag[];
  routineStep: string;
};

export type LinkedBundle = {
  bundleId: string;
  reason: string;
};

export type IngredientGuide = {
  slug: string;
  name: string;
  headline: string;
  metaTitle: string;
  metaDescription: string;
  summary: string;
  indicatedFor: string[];
  notIdealFor: string[];
  howToUse: string[];
  combinesWith: string[];
  cautionWith: string[];
  productIds: string[];
  collectionIds: string[];
  bundleIds: string[];
  needTags: string[];
  skinTypes: SkinTypeTag[];
  routineSteps: string[];
  priceRange: "entrada" | "intermediario" | "premium";
};

export type RoutineGuide = {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  diagnosis: string;
  promise: string;
  needTags: string[];
  skinTypes: SkinTypeTag[];
  priceRange: "entrada" | "intermediario" | "premium";
  estimatedTicket: number;
  recommendedBundleId: string;
  productIds: string[];
  collectionIds: string[];
  morningSteps: RoutineStep[];
  nightSteps: RoutineStep[];
};

export type RoutineStep = {
  period: RoutineStepPeriod;
  order: number;
  title: string;
  description: string;
  productRole: string;
};

export type WeeklyCurationItem = {
  id: string;
  label: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  productIds: string[];
  collectionIds: string[];
  bundleIds: string[];
  needTags: string[];
  ingredientTags: string[];
  skinTypes: SkinTypeTag[];
};

export type WorthInvestmentGuide = {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  productId: string;
  productName: string;
  promise: string;
  makesSenseFor: string[];
  worthPayingMoreWhen: string[];
  notWorthWhen: string[];
  affordableAlternative: ProductRecommendation;
  routineFit: string[];
  productIds: string[];
  collectionIds: string[];
  bundleIds: string[];
  needTags: string[];
  ingredientTags: string[];
  skinTypes: SkinTypeTag[];
};

export const popGuideProducts: ProductRecommendation[] = [
  {
    productId: "p1",
    slug: "p1",
    name: "Serum Radiance 01",
    brand: "BelaPop Atelier",
    role: "Serum iluminador",
    price: 289,
    collectionIds: ["glow", "ativos-inteligentes"],
    ingredientTags: ["niacinamida", "peptideos", "vitamina-c"],
    needTags: ["glow", "manchas", "textura"],
    skinTypes: ["normal", "mista", "seca"],
    routineStep: "Tratamento"
  },
  {
    productId: "p2",
    slug: "p2",
    name: "Creme Barrier Celeste",
    brand: "BelaPop Atelier",
    role: "Hidratante reparador",
    price: 320,
    collectionIds: ["barreira", "pele-sensível"],
    ingredientTags: ["ceramidas", "pantenol"],
    needTags: ["barreira", "ressecamento", "sensibilidade"],
    skinTypes: ["seca", "sensível", "normal"],
    routineStep: "Hidratação"
  },
  {
    productId: "p10",
    slug: "p10",
    name: "Gel Limpeza Veludo",
    brand: "BelaPop Atelier",
    role: "Limpeza suave",
    price: 182,
    collectionIds: ["limpeza", "pele-sensível"],
    ingredientTags: ["pantenol"],
    needTags: ["sensibilidade", "oleosidade", "minimalista"],
    skinTypes: ["oleosa", "mista", "sensível", "normal"],
    routineStep: "Limpeza"
  },
  {
    productId: "p11",
    slug: "p11",
    name: "Patch Olhos Aurora",
    brand: "BelaPop Atelier",
    role: "Complemento glow",
    price: 198,
    collectionIds: ["glow", "olhos"],
    ingredientTags: ["acido-hialuronico", "peptideos"],
    needTags: ["glow", "hidratação", "anti-idade"],
    skinTypes: ["normal", "mista", "seca"],
    routineStep: "Complemento"
  }
];

const productMap = new Map(popGuideProducts.map((product) => [product.productId, product]));

const ingredientBase: Array<{
  slug: string;
  name: string;
  summary: string;
  indicatedFor: string[];
  notIdealFor: string[];
  combinesWith: string[];
  cautionWith: string[];
  productIds: string[];
  bundleIds: string[];
  needTags: string[];
  skinTypes: SkinTypeTag[];
  priceRange: IngredientGuide["priceRange"];
}> = [
  {
    slug: "acido-hialuronico",
    name: "Acido hialuronico",
    summary: "Ajuda a reter agua e melhora a sensacao de pele preenchida e confortavel.",
    indicatedFor: ["pele desidratada", "linhas finas por ressecamento", "rotinas minimalistas"],
    notIdealFor: ["quem espera clareamento intenso", "pele com irritacao ativa sem hidratante por cima"],
    combinesWith: ["ceramidas", "niacinamida", "protetor solar"],
    cautionWith: ["esfoliantes fortes quando a barreira esta sensível"],
    productIds: ["p11", "p2"],
    bundleIds: ["ritual-manha", "kit-barreira"],
    needTags: ["hidratação", "barreira"],
    skinTypes: ["normal", "mista", "seca", "sensível"],
    priceRange: "intermediario"
  },
  {
    slug: "niacinamida",
    name: "Niacinamida",
    summary: "Ativo versatil para aparencia de poros, uniformidade, oleosidade e reforco de barreira.",
    indicatedFor: ["poros aparentes", "oleosidade", "manchas leves", "barreira fragil"],
    notIdealFor: ["pele que arde com formulas muito concentradas"],
    combinesWith: ["acido hialuronico", "ceramidas", "vitamina C"],
    cautionWith: ["rotinas com muitos ativos novos ao mesmo tempo"],
    productIds: ["p1", "p2"],
    bundleIds: ["kit-glow", "kit-barreira"],
    needTags: ["glow", "oleosidade", "barreira"],
    skinTypes: ["oleosa", "mista", "normal", "sensível"],
    priceRange: "intermediario"
  },
  {
    slug: "vitamina-c",
    name: "Vitamina C",
    summary: "Classico de luminosidade para rotina da manha, especialmente quando combinado com protetor solar.",
    indicatedFor: ["opacidade", "manchas", "rotina de prevencao"],
    notIdealFor: ["pele sensibilizada por acidos", "quem não usa protetor solar"],
    combinesWith: ["protetor solar", "acido hialuronico", "niacinamida"],
    cautionWith: ["retinol na mesma rotina quando a pele e sensível"],
    productIds: ["p1"],
    bundleIds: ["ritual-manha", "kit-glow"],
    needTags: ["glow", "manchas"],
    skinTypes: ["normal", "mista", "seca"],
    priceRange: "premium"
  },
  {
    slug: "retinol",
    name: "Retinol",
    summary: "Ativo noturno de renovacao para textura, linhas e aparencia de firmeza.",
    indicatedFor: ["anti-idade", "textura irregular", "poros aparentes"],
    notIdealFor: ["gestantes", "pele muito sensibilizada", "iniciantes sem rotina de barreira"],
    combinesWith: ["ceramidas", "pantenol", "hidratante reparador"],
    cautionWith: ["acido glicolico", "acido salicilico", "vitamina C em pele reativa"],
    productIds: ["p2"],
    bundleIds: ["ritual-noite", "kit-barreira"],
    needTags: ["anti-idade", "textura"],
    skinTypes: ["normal", "mista", "seca"],
    priceRange: "premium"
  },
  {
    slug: "acido-salicilico",
    name: "Acido salicilico",
    summary: "Ativo queridinho para oleosidade, cravos e aparencia de poros obstruidos.",
    indicatedFor: ["acne", "oleosidade", "poros aparentes"],
    notIdealFor: ["pele muito seca", "barreira fragilizada", "uso diario sem orientacao"],
    combinesWith: ["niacinamida", "hidratante leve", "protetor solar"],
    cautionWith: ["retinol", "acido glicolico", "esfoliantes fisicos"],
    productIds: ["p10", "p1"],
    bundleIds: ["ritual-manha", "edição-descoberta"],
    needTags: ["acne", "oleosidade"],
    skinTypes: ["oleosa", "mista"],
    priceRange: "entrada"
  },
  {
    slug: "ceramidas",
    name: "Ceramidas",
    summary: "Lipideos essenciais para conforto, barreira e reducao da sensacao de ressecamento.",
    indicatedFor: ["pele seca", "barreira fragil", "sensibilidade"],
    notIdealFor: ["quem busca efeito secativo imediato"],
    combinesWith: ["pantenol", "acido hialuronico", "niacinamida"],
    cautionWith: ["acidos em excesso enquanto a pele arde"],
    productIds: ["p2"],
    bundleIds: ["kit-barreira", "pele-sensível"],
    needTags: ["barreira", "ressecamento", "sensibilidade"],
    skinTypes: ["seca", "sensível", "normal"],
    priceRange: "intermediario"
  },
  {
    slug: "peptideos",
    name: "Peptideos",
    summary: "Ativos de suporte para aparencia de firmeza, elasticidade e pele descansada.",
    indicatedFor: ["anti-idade", "glow sofisticado", "rotina premium"],
    notIdealFor: ["quem procura esfoliacao ou controle intenso de acne"],
    combinesWith: ["niacinamida", "acido hialuronico", "ceramidas"],
    cautionWith: ["formulas muito acidas na mesma etapa"],
    productIds: ["p1", "p11"],
    bundleIds: ["kit-glow", "ritual-noite"],
    needTags: ["anti-idade", "glow"],
    skinTypes: ["normal", "mista", "seca"],
    priceRange: "premium"
  },
  {
    slug: "pantenol",
    name: "Pantenol",
    summary: "Ativo de cuidado gentil para conforto, recuperacao e suporte de barreira.",
    indicatedFor: ["pele sensível", "ressecamento", "pos-ativo"],
    notIdealFor: ["quem busca clareamento rapido"],
    combinesWith: ["ceramidas", "acido hialuronico", "niacinamida"],
    cautionWith: ["rotinas agressivas com muitos acidos"],
    productIds: ["p10", "p2"],
    bundleIds: ["pele-sensível", "kit-barreira"],
    needTags: ["sensibilidade", "barreira"],
    skinTypes: ["sensível", "seca", "normal"],
    priceRange: "entrada"
  },
  {
    slug: "acido-glicolico",
    name: "Acido glicolico",
    summary: "Esfoliante quimico para textura, viço e renovacao da superficie da pele.",
    indicatedFor: ["textura irregular", "opacidade", "manchas superficiais"],
    notIdealFor: ["pele sensibilizada", "rotina sem protetor solar", "barreira fragil"],
    combinesWith: ["hidratante reparador", "protetor solar", "pantenol"],
    cautionWith: ["retinol", "acido salicilico", "vitamina C concentrada"],
    productIds: ["p1", "p2"],
    bundleIds: ["ritual-noite", "kit-glow"],
    needTags: ["textura", "glow", "manchas"],
    skinTypes: ["normal", "mista", "oleosa"],
    priceRange: "intermediario"
  },
  {
    slug: "protetor-solar",
    name: "Protetor solar",
    summary: "O passo que protege o investimento da rotina e sustenta resultados de ativos.",
    indicatedFor: ["todas as peles", "manchas", "anti-idade", "uso de acidos"],
    notIdealFor: ["nenhuma rotina diurna deveria pular este passo"],
    combinesWith: ["vitamina C", "niacinamida", "hidratante leve"],
    cautionWith: ["texturas que causam desconforto e reduzem aderencia"],
    productIds: ["p1", "p10"],
    bundleIds: ["ritual-manha", "pele-sensível"],
    needTags: ["proteção", "manchas", "anti-idade"],
    skinTypes: ["oleosa", "mista", "seca", "sensível", "normal"],
    priceRange: "intermediario"
  }
];

export const ingredientGuides: IngredientGuide[] = ingredientBase.map((item) => ({
  ...item,
  headline: `${item.name}: como escolher sem comprar no escuro`,
  metaTitle: `${item.name} | Guia BelaPop`,
  metaDescription: `${item.name}: para quem serve, como usar e quais rotinas BelaPop combinam com este ativo.`,
  howToUse: [
    "Comece com baixa frequencia quando o ativo for novo para sua pele.",
    "Priorize textura confortavel e uma rotina que você consiga repetir.",
    "Use protetor solar de dia quando o ativo tiver foco em manchas, renovacao ou glow."
  ],
  collectionIds: ["skincare", ...item.needTags],
  routineSteps: ["limpeza", "tratamento", "hidratação", "proteção"]
}));

export const routineGuides: RoutineGuide[] = [
  {
    slug: "pele-sensível",
    title: "Pele sensível",
    metaTitle: "Rotina para pele sensível | Guia BelaPop",
    metaDescription: "Rotina BelaPop para pele sensível com ordem de uso, kit indicado e compra assistida.",
    diagnosis: "A pele costuma reagir quando a rotina tem ativos demais, limpeza agressiva ou pouca reparacao.",
    promise: "Menos atrito, mais conforto e uma rotina que respeita a tolerância da pele.",
    needTags: ["sensibilidade", "barreira"],
    skinTypes: ["sensível", "seca", "normal"],
    priceRange: "intermediario",
    estimatedTicket: 379.9,
    recommendedBundleId: "pele-sensível",
    productIds: ["p10", "p2"],
    collectionIds: ["pele-sensível"],
    morningSteps: [
      { period: "manha", order: 1, title: "Limpeza gentil", description: "Limpe sem friccionar.", productRole: "Limpador sem agressao" },
      { period: "manha", order: 2, title: "Hidratação calmante", description: "Reforce conforto antes do protetor.", productRole: "Hidratante calmante" },
      { period: "manha", order: 3, title: "Proteção", description: "Escolha textura que não arde.", productRole: "Protetor para pele sensível" }
    ],
    nightSteps: [
      { period: "noite", order: 1, title: "Limpeza curta", description: "Remova o dia sem agredir.", productRole: "Limpeza suave" },
      { period: "noite", order: 2, title: "Reparacao", description: "Evite misturar muitos ativos.", productRole: "Serum reparador" },
      { period: "noite", order: 3, title: "Selar barreira", description: "Finalize com creme de conforto.", productRole: "Creme reparador" }
    ]
  },
  {
    slug: "barreira-cutanea-fragilizada",
    title: "Barreira cutanea fragilizada",
    metaTitle: "Rotina para barreira cutanea fragilizada | Guia BelaPop",
    metaDescription: "Como recuperar conforto, reduzir ressecamento e comprar uma rotina coerente para barreira.",
    diagnosis: "Repuxamento, ardor e textura irregular podem indicar que a pele precisa de pausa e reparacao.",
    promise: "Repor conforto antes de voltar a ativos mais ambiciosos.",
    needTags: ["barreira", "ressecamento"],
    skinTypes: ["seca", "sensível", "normal"],
    priceRange: "intermediario",
    estimatedTicket: 429.9,
    recommendedBundleId: "kit-barreira",
    productIds: ["p10", "p2"],
    collectionIds: ["barreira"],
    morningSteps: [
      { period: "manha", order: 1, title: "Limpeza minima", description: "Use pouco produto e agua fria ou morna.", productRole: "Limpador suave" },
      { period: "manha", order: 2, title: "Camada reparadora", description: "Hidrate antes de proteger.", productRole: "Creme com ceramidas" },
      { period: "manha", order: 3, title: "Protetor confortavel", description: "Proteja sem sensorial pesado.", productRole: "Protetor solar" }
    ],
    nightSteps: [
      { period: "noite", order: 1, title: "Limpar", description: "Remova protetor e poluicao.", productRole: "Limpeza suave" },
      { period: "noite", order: 2, title: "Acalmar", description: "Use serum de suporte.", productRole: "Serum calmante" },
      { period: "noite", order: 3, title: "Recuperar", description: "Finalize com balm nas areas secas.", productRole: "Balm reparador" }
    ]
  },
  {
    slug: "acne-e-oleosidade",
    title: "Acne e oleosidade",
    metaTitle: "Rotina para acne e oleosidade | Guia BelaPop",
    metaDescription: "Rotina compravel para controlar brilho, poros e acne sem destruir a barreira.",
    diagnosis: "O erro mais comum e secar demais a pele, o que aumenta desconforto e reduz constancia.",
    promise: "Controle com leveza, hidratação estrategica e ativos bem posicionados.",
    needTags: ["acne", "oleosidade", "poros"],
    skinTypes: ["oleosa", "mista"],
    priceRange: "entrada",
    estimatedTicket: 319.9,
    recommendedBundleId: "ritual-manha",
    productIds: ["p10", "p1"],
    collectionIds: ["oleosidade"],
    morningSteps: [
      { period: "manha", order: 1, title: "Gel suave", description: "Limpe sem deixar repuxar.", productRole: "Limpeza equilibrada" },
      { period: "manha", order: 2, title: "Serum leve", description: "Aposte em niacinamida.", productRole: "Serum controle" },
      { period: "manha", order: 3, title: "Protetor fluido", description: "Textura confortavel evita abandono.", productRole: "Protetor leve" }
    ],
    nightSteps: [
      { period: "noite", order: 1, title: "Limpeza", description: "Remova oleosidade e protetor.", productRole: "Gel de limpeza" },
      { period: "noite", order: 2, title: "Tratamento pontual", description: "Use ativo conforme tolerância.", productRole: "Acido salicilico" },
      { period: "noite", order: 3, title: "Hidratar", description: "Não pule hidratação.", productRole: "Hidratante leve" }
    ]
  },
  {
    slug: "manchas",
    title: "Manchas",
    metaTitle: "Rotina para manchas | Guia BelaPop",
    metaDescription: "Rotina com proteção, luminosidade e constancia para manchas e tom irregular.",
    diagnosis: "Mancha pede disciplina: ativo certo, proteção solar e expectativa realista.",
    promise: "Rotina de prevencao e uniformidade com foco em compra consciente.",
    needTags: ["manchas", "glow"],
    skinTypes: ["normal", "mista", "seca", "oleosa"],
    priceRange: "premium",
    estimatedTicket: 429.9,
    recommendedBundleId: "ritual-manha",
    productIds: ["p1", "p10"],
    collectionIds: ["manchas"],
    morningSteps: [
      { period: "manha", order: 1, title: "Limpar", description: "Prepare sem sensibilizar.", productRole: "Limpeza suave" },
      { period: "manha", order: 2, title: "Antioxidante", description: "Use vitamina C ou niacinamida.", productRole: "Serum antioxidante" },
      { period: "manha", order: 3, title: "Proteger", description: "Protetor e reaplicacao sustentam resultado.", productRole: "Protetor solar" }
    ],
    nightSteps: [
      { period: "noite", order: 1, title: "Limpeza", description: "Retire residuos do dia.", productRole: "Limpeza" },
      { period: "noite", order: 2, title: "Uniformizar", description: "Alterne ativos para evitar irritacao.", productRole: "Serum uniformizador" },
      { period: "noite", order: 3, title: "Reparar", description: "Finalize com barreira.", productRole: "Hidratante" }
    ]
  }
];

const moreRoutineNames: Array<[string, string, string, string, string]> = [
  ["glow", "Glow", "kit-glow", "Viço elegante sem brilho excessivo.", "glow"],
  ["anti-idade", "Anti-idade", "ritual-noite", "Prevenir, renovar e manter elasticidade.", "anti-idade"],
  ["hidratação-intensa", "Hidratação intensa", "kit-barreira", "Camadas de agua e conforto para pele sedenta.", "hidratação"],
  ["poros-aparentes", "Poros aparentes", "ritual-manha", "Controle visual de textura com rotina leve.", "poros"],
  ["textura-irregular", "Textura irregular", "ritual-noite", "Renovacao gradual com barreira protegida.", "textura"],
  ["pele-ressecada", "Pele ressecada", "kit-barreira", "Conforto, maciez e menos repuxamento.", "ressecamento"],
  ["rotina-minimalista", "Rotina minimalista", "edição-descoberta", "Poucos passos, alta aderencia.", "minimalista"],
  ["rotina-premium", "Rotina premium", "kit-glow", "Sensorial sofisticado e ativos bem combinados.", "premium"]
];

routineGuides.push(
  ...moreRoutineNames.map(([slug, title, bundleId, promise, needTag]): RoutineGuide => {
    const priceRange: RoutineGuide["priceRange"] =
      bundleId === "edição-descoberta" ? "entrada" : "intermediario";

    return {
      slug,
      title,
      metaTitle: `${title} | Rotina BelaPop`,
      metaDescription: `Rotina BelaPop para ${title.toLowerCase()} com kit indicado, produtos sugeridos e compra assistida.`,
      diagnosis: "A rotina precisa ser simples de entender, coerente na ordem de uso e facil de comprar.",
      promise,
      needTags: [needTag],
      skinTypes: ["normal", "mista"],
      priceRange,
      estimatedTicket: skincareBundles.find((bundle) => bundle.id === bundleId)?.bundlePrice ?? 399.9,
      recommendedBundleId: bundleId,
      productIds: ["p10", "p1", "p2"],
      collectionIds: [needTag],
      morningSteps: [
        { period: "manha", order: 1, title: "Preparar", description: "Limpeza gentil e textura confortavel.", productRole: "Limpeza" },
        { period: "manha", order: 2, title: "Tratar", description: "Ativo principal sem excesso.", productRole: "Tratamento" },
        { period: "manha", order: 3, title: "Proteger", description: "Protetor como ultimo passo.", productRole: "Proteção" }
      ],
      nightSteps: [
        { period: "noite", order: 1, title: "Remover o dia", description: "Limpeza sem agressao.", productRole: "Limpeza" },
        { period: "noite", order: 2, title: "Reparar", description: "Hidratação e suporte de barreira.", productRole: "Hidratante" }
      ]
    };
  })
);

export const weeklyCurationItems: WeeklyCurationItem[] = [
  {
    id: "produto-da-semana",
    label: "Produto da semana",
    title: "Serum Radiance 01",
    description: "O tratamento para quem quer glow com aparencia refinada, sem montar uma rotina enorme.",
    href: "/produto/p1",
    cta: "Ver produto",
    productIds: ["p1"],
    collectionIds: ["glow"],
    bundleIds: ["kit-glow"],
    needTags: ["glow", "manchas"],
    ingredientTags: ["niacinamida", "peptideos"],
    skinTypes: ["normal", "mista", "seca"]
  },
  {
    id: "kit-da-semana",
    label: "Kit da semana",
    title: "Kit Barreira",
    description: "A escolha mais segura quando a pele esta pedindo menos agressao e mais conforto.",
    href: "/kits#kit-barreira",
    cta: "Comprar kit",
    productIds: ["p10", "p2"],
    collectionIds: ["barreira"],
    bundleIds: ["kit-barreira"],
    needTags: ["barreira", "sensibilidade"],
    ingredientTags: ["ceramidas", "pantenol"],
    skinTypes: ["seca", "sensível"]
  },
  {
    id: "ativo-em-destaque",
    label: "Ativo em destaque",
    title: "Niacinamida",
    description: "Versatil, facil de encaixar e boa ponte entre desejo de glow e cuidado de barreira.",
    href: "/guias/ativos/niacinamida",
    cta: "Ler guia",
    productIds: ["p1", "p2"],
    collectionIds: ["ativos-inteligentes"],
    bundleIds: ["kit-glow", "kit-barreira"],
    needTags: ["glow", "oleosidade"],
    ingredientTags: ["niacinamida"],
    skinTypes: ["oleosa", "mista", "normal"]
  },
  {
    id: "achado-premium",
    label: "Achado premium",
    title: "Creme Barrier Celeste",
    description: "Textura de conforto que justifica o ticket quando a pele esta sensibilizada.",
    href: "/guias/vale-o-investimento/creme-barrier-celeste",
    cta: "Vale o investimento?",
    productIds: ["p2"],
    collectionIds: ["barreira"],
    bundleIds: ["kit-barreira"],
    needTags: ["barreira", "ressecamento"],
    ingredientTags: ["ceramidas", "pantenol"],
    skinTypes: ["seca", "sensível"]
  },
  {
    id: "custo-beneficio",
    label: "Melhor custo-beneficio",
    title: "Gel Limpeza Veludo",
    description: "Um passo simples que melhora aderencia da rotina inteira.",
    href: "/produto/p10",
    cta: "Ver produto",
    productIds: ["p10"],
    collectionIds: ["limpeza"],
    bundleIds: ["edição-descoberta"],
    needTags: ["minimalista", "sensibilidade"],
    ingredientTags: ["pantenol"],
    skinTypes: ["oleosa", "mista", "sensível"]
  },
  {
    id: "viral-analisado",
    label: "Produto viral analisado",
    title: "Patch Olhos Aurora",
    description: "Faz sentido quando você quer acabamento imediato, mas não substitui hidratação diaria.",
    href: "/produto/p11",
    cta: "Ver análise",
    productIds: ["p11"],
    collectionIds: ["glow"],
    bundleIds: ["kit-glow"],
    needTags: ["glow", "anti-idade"],
    ingredientTags: ["acido-hialuronico", "peptideos"],
    skinTypes: ["normal", "mista", "seca"]
  },
  {
    id: "curadora",
    label: "Recomendação da curadora",
    title: "Comece pela Edição Descoberta",
    description: "Menor risco para sentir texturas, entender tolerância e comprar melhor na segunda rotina.",
    href: "/kits#edição-descoberta",
    cta: "Conhecer edição",
    productIds: ["p10"],
    collectionIds: ["descoberta"],
    bundleIds: ["edição-descoberta"],
    needTags: ["minimalista"],
    ingredientTags: ["pantenol"],
    skinTypes: ["normal", "mista", "seca"]
  }
];

export const worthInvestmentGuides: WorthInvestmentGuide[] = [
  {
    slug: "serum-radiance-01",
    title: "Serum Radiance 01 vale o investimento?",
    metaTitle: "Serum Radiance 01 vale o investimento? | BelaPop",
    metaDescription: "Análise comercial BelaPop do Serum Radiance 01, para quem faz sentido e como encaixar na rotina.",
    productId: "p1",
    productName: "Serum Radiance 01",
    promise: "Promete luminosidade, textura mais uniforme e sensorial leve para uso frequente.",
    makesSenseFor: ["quem quer glow sem oleosidade", "pele normal, mista ou seca", "rotina com foco em manchas leves"],
    worthPayingMoreWhen: ["você usa serum todos os dias", "quer um unico passo de tratamento", "valoriza acabamento sofisticado"],
    notWorthWhen: ["sua barreira esta ardendo", "você ainda não usa protetor solar", "o objetivo principal e acne inflamada"],
    affordableAlternative: popGuideProducts[2],
    routineFit: ["Manha depois da limpeza", "Antes do hidratante", "Sempre antes do protetor solar"],
    productIds: ["p1", "p10"],
    collectionIds: ["glow", "ativos-inteligentes"],
    bundleIds: ["kit-glow", "ritual-manha"],
    needTags: ["glow", "manchas"],
    ingredientTags: ["niacinamida", "peptideos"],
    skinTypes: ["normal", "mista", "seca"]
  },
  {
    slug: "creme-barrier-celeste",
    title: "Creme Barrier Celeste vale o investimento?",
    metaTitle: "Creme Barrier Celeste vale o investimento? | BelaPop",
    metaDescription: "Quando vale pagar mais por um creme reparador e quando escolher alternativa mais simples.",
    productId: "p2",
    productName: "Creme Barrier Celeste",
    promise: "Promete conforto imediato, reforco de barreira e acabamento aveludado.",
    makesSenseFor: ["pele seca", "barreira fragilizada", "quem usa acidos e precisa reparar"],
    worthPayingMoreWhen: ["o hidratante comum não sustenta conforto", "a pele repuxa ao longo do dia", "você quer reduzir passos extras"],
    notWorthWhen: ["sua pele e muito oleosa e rejeita cremes", "você busca efeito secativo", "o orcamento pede rotina de entrada"],
    affordableAlternative: popGuideProducts[2],
    routineFit: ["Manha antes do protetor em pele seca", "Noite como ultimo passo", "Depois de seruns calmantes"],
    productIds: ["p2", "p10"],
    collectionIds: ["barreira", "pele-sensível"],
    bundleIds: ["kit-barreira", "pele-sensível"],
    needTags: ["barreira", "ressecamento"],
    ingredientTags: ["ceramidas", "pantenol"],
    skinTypes: ["seca", "sensível", "normal"]
  }
];

export function getProductRecommendations(productIds: string[]) {
  return productIds
    .map((id) => productMap.get(id))
    .filter((product): product is ProductRecommendation => Boolean(product));
}

export function getBundleById(bundleId: string) {
  return skincareBundles.find((bundle) => bundle.id === bundleId) ?? null;
}

export function getIngredientGuide(slug: string) {
  return ingredientGuides.find((guide) => guide.slug === slug) ?? null;
}

export function getRoutineGuide(slug: string) {
  return routineGuides.find((guide) => guide.slug === slug) ?? null;
}

export function getWorthInvestmentGuide(slug: string) {
  return worthInvestmentGuides.find((guide) => guide.slug === slug) ?? null;
}
