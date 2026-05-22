import {
  getSkinBundleById,
  skincareBundles,
  type SkinBundle
} from "@/lib/skincare/skincareBundles";

export type UniverseTag =
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

export type UniverseCTA = {
  label: string;
  href: string;
};

export type UniverseTheme = {
  accent: string;
  accentSoft: string;
  ink: string;
  surface: string;
  contrast: string;
};

export type UniverseCollection = {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  href: string;
  image: string;
  imageAlt: string;
  badge: string;
  tags: UniverseTag[];
};

export type UniverseRoutine = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  href: string;
  cta: string;
  bundleId: string;
  productIds: string[];
  tags: UniverseTag[];
  steps: Array<{
    label: string;
    description: string;
  }>;
};

export type UniverseEditorialTrail = {
  id: string;
  label: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  tags: UniverseTag[];
};

export type UniverseStartPoint = {
  title: string;
  description: string;
  href: string;
  cta: string;
};

export type UniverseWeeklyCuration = {
  label: string;
  title: string;
  description: string;
  productId: string;
  bundleId: string;
  href: string;
};

export type BelaPopUniverse = {
  id: string;
  slug: string;
  legacySlugs?: string[];
  name: string;
  subtitle: string;
  description: string;
  editorialText: string;
  image: string;
  imageAlt: string;
  heroImage: string;
  heroImageAlt: string;
  badge: string;
  productIds: string[];
  collectionIds: string[];
  bundleIds: string[];
  routineIds: string[];
  tags: UniverseTag[];
  primaryCTA: UniverseCTA;
  secondaryCTA: UniverseCTA;
  theme: UniverseTheme;
  tone: string;
  discoveryPrompt: string;
  skinScanPrompt: string;
  conciergePrompt: string;
  startHere: UniverseStartPoint[];
  editorialTrails: UniverseEditorialTrail[];
  weeklyCuration: UniverseWeeklyCuration;
  relatedSlugs: string[];
};

export const universeCollections: UniverseCollection[] = [
  {
    id: "curadoria-icons",
    name: "Best of BelaPop",
    subtitle: "recompra, desejo e critério",
    description:
      "Uma seleção curta de produtos que explicam o olhar da BelaPop: formulas claras, textura elegante e uso que se sustenta.",
    href: "/catalogo?tag=curated-icon",
    image: "/hero-bela-pop-editorial.jpg",
    imageAlt: "Composicao editorial de skincare BelaPop em luz suave.",
    badge: "Validado pela curadoria",
    tags: ["curated-icon", "luxury", "discovery"]
  },
  {
    id: "new-atelier",
    name: "Chegadas do Atelier",
    subtitle: "novidades sem ruido",
    description:
      "Lancamentos e achados recentes organizados por motivo de entrada: textura, ativo, acabamento ou ocasiao.",
    href: "/catalogo?tag=new",
    image: "/vitrine-premium-bg.png",
    imageAlt: "Vitrine premium com produtos em composição editorial.",
    badge: "Novo na curadoria",
    tags: ["new", "discovery"]
  },
  {
    id: "clinical-edit",
    name: "Clinical Edit",
    subtitle: "ativos, barreira e performance",
    description:
      "Produtos e guias para quem compra por evidencia, tolerancia e resultado, sem abrir mao do sensorial.",
    href: "/guias/ativos",
    image: "/editorial/home-ai-card.jpg",
    imageAlt: "Close editorial de pele e tecnologia BelaPop.",
    badge: "Ciencia aplicada",
    tags: ["clinical", "luxury", "routine"]
  },
  {
    id: "gift-intentions",
    name: "Presentes por Intencao",
    subtitle: "afeto com faixa de preco",
    description:
      "Kits e produtos que parecem pessoais, com rotas por autocuidado, glow, conforto e descoberta.",
    href: "/catalogo?tag=gift",
    image: "/editorial/login-hero-original.jpg",
    imageAlt: "Cena editorial premium em tons quentes para presentes.",
    badge: "Escolha facil",
    tags: ["gift", "bundle", "discovery"]
  },
  {
    id: "sensitive-barrier",
    name: "Barreira & Conforto",
    subtitle: "baixo atrito, alta previsibilidade",
    description:
      "Rotinas gentis para peles que pedem menos estimulo, mais consistencia e uma compra sem susto.",
    href: "/guias/rotinas/pele-sensível",
    image: "/hero-bela.jpg",
    imageAlt: "Retrato de pele com luz suave e sensacao de conforto.",
    badge: "Pele sensível",
    tags: ["sensitive-skin", "routine", "clinical"]
  },
  {
    id: "brazilian-premium-edit",
    name: "Brasil Premium Edit",
    subtitle: "sensorial nacional elevado",
    description:
      "Marcas, ativos e texturas brasileiras com acabamento sofisticado e identidade de beleza contemporanea.",
    href: "/catalogo?tag=brazilian-premium",
    image: "/vitrine-premium-bg.png",
    imageAlt: "Produtos premium em vitrine editorial BelaPop.",
    badge: "Beleza nacional",
    tags: ["brazilian-premium", "luxury", "discovery"]
  }
];

export const universeRoutines: UniverseRoutine[] = [
  {
    id: "rotina-iconica-essencial",
    title: "Rotina Iconica Essencial",
    subtitle: "limpar, tratar, selar",
    description:
      "A entrada mais segura para entender a BelaPop: poucos passos, texturas elegantes e alto potencial de recompra.",
    href: "/guias/rotinas/barreira-cutanea-fragilizada",
    cta: "Ver rotina essencial",
    bundleId: "ritual-manha",
    productIds: ["p10", "p1", "p2"],
    tags: ["curated-icon", "routine", "luxury"],
    steps: [
      {
        label: "Preparar",
        description: "Limpeza suave para manter conforto antes do tratamento."
      },
      {
        label: "Tratar",
        description: "Serum de luminosidade com leitura facil de resultado."
      },
      {
        label: "Selar",
        description: "Hidratante de barreira para acabamento macio e constante."
      }
    ]
  },
  {
    id: "rotina-novidade-sem-erro",
    title: "Novidade sem Erro",
    subtitle: "descobrir com critério",
    description:
      "Uma trilha para testar novidades sem sobrecarregar a pele nem comprar por impulso.",
    href: "/kits/edição-descoberta",
    cta: "Começar pela edição descoberta",
    bundleId: "edição-descoberta",
    productIds: ["p10", "p1", "p9"],
    tags: ["new", "discovery", "routine"],
    steps: [
      {
        label: "Escolher um foco",
        description: "Entre por textura, glow ou acabamento, não por excesso de lancamentos."
      },
      {
        label: "Testar em ciclo curto",
        description: "Observe conforto e resultado antes de inserir outro ativo."
      },
      {
        label: "Fixar favoritos",
        description: "Transforme achado em rotina apenas quando ele fizer sentido."
      }
    ]
  },
  {
    id: "rotina-clinical-noite",
    title: "Clinical Night Protocol",
    subtitle: "performance com recuperacao",
    description:
      "Tratamento noturno com foco em ativo principal, barreira e tolerancia ao longo da semana.",
    href: "/guias/ativos/retinol",
    cta: "Explorar protocolo",
    bundleId: "ritual-noite",
    productIds: ["p10", "p1", "p2"],
    tags: ["clinical", "luxury", "routine"],
    steps: [
      {
        label: "Limpeza precisa",
        description: "Remova residuos sem deixar a pele repuxando."
      },
      {
        label: "Ativo em dias alternados",
        description: "Use performance com frequencia ajustada ao momento da pele."
      },
      {
        label: "Recuperacao",
        description: "Ceramidas e hidratação sustentam conforto e adesao."
      }
    ]
  },
  {
    id: "rotina-presente-seguro",
    title: "Presente Seguro",
    subtitle: "glow, conforto ou descoberta",
    description:
      "Uma compra guiada por intencao e faixa de investimento para acertar mesmo sem conhecer toda a rotina da pessoa.",
    href: "/kits/edição-descoberta",
    cta: "Ver kit presenteavel",
    bundleId: "edição-descoberta",
    productIds: ["p11", "p9", "p7"],
    tags: ["gift", "bundle", "discovery"],
    steps: [
      {
        label: "Definir intencao",
        description: "Autocuidado, glow ou descanso criam escolhas mais pessoais."
      },
      {
        label: "Escolher faixa",
        description: "A compra fica elegante quando o preco tambem e parte da curadoria."
      },
      {
        label: "Adicionar acabamento",
        description: "Um item sensorial transforma o kit em gesto."
      }
    ]
  },
  {
    id: "rotina-pele-sensível",
    title: "Rotina Pele Sensível",
    subtitle: "acalmar, reparar, proteger",
    description:
      "Uma rotina previsivel para reduzir desconforto, fortalecer barreira e evitar combinacoes agressivas.",
    href: "/guias/rotinas/pele-sensível",
    cta: "Montar rotina sensível",
    bundleId: "pele-sensível",
    productIds: ["p10", "p2", "p11"],
    tags: ["sensitive-skin", "routine", "clinical"],
    steps: [
      {
        label: "Acalmar",
        description: "Limpeza com baixo atrito e sensacao de pele confortavel."
      },
      {
        label: "Reparar",
        description: "Camadas de barreira antes de qualquer ambicao de performance."
      },
      {
        label: "Proteger",
        description: "Consistencia diaria para manter tolerancia."
      }
    ]
  },
  {
    id: "rotina-brasilidade-glow",
    title: "Ritual Brasilidade Glow",
    subtitle: "sensorial, pele e corpo",
    description:
      "Uma composição de texturas e gestos nacionais para uma beleza tropical sofisticada, sem caricatura.",
    href: "/kits/kit-glow",
    cta: "Conhecer ritual glow",
    bundleId: "kit-glow",
    productIds: ["p1", "p4", "p7"],
    tags: ["brazilian-premium", "luxury", "routine"],
    steps: [
      {
        label: "Textura",
        description: "Comece por produtos de toque elegante e acabamento natural."
      },
      {
        label: "Luminosidade",
        description: "Combine glow de pele com cor translucidada."
      },
      {
        label: "Sensorial",
        description: "Finalize com corpo, aroma ou bem-estar em chave premium."
      }
    ]
  }
];

export const belaPopUniverses: BelaPopUniverse[] = [
  {
    id: "ícones-da-curadoria",
    slug: "ícones-da-curadoria",
    legacySlugs: ["ícones-da-belapop"],
    name: "Ícones da Curadoria",
    subtitle: "Produtos mais desejados, recomendados e validados pela BelaPop.",
    description:
      "A seleção que traduz autoridade, confianca e desejo: produtos com razao clara para existir na rotina.",
    editorialText:
      "Entrar por Ícones da Curadoria e entender o critério BelaPop antes de olhar para quantidade. Aqui ficam os produtos que voltam para a conversa, os kits que reduzem indecisao e as rotinas que explicam por que algo merece espaco no banheiro.",
    image: "/hero-bela-pop-editorial.jpg",
    imageAlt: "Composicao editorial de skincare premium BelaPop.",
    heroImage: "/hero-bela-pop-editorial.jpg",
    heroImageAlt: "Hero editorial com textura premium de skincare BelaPop.",
    badge: "Mais desejados",
    productIds: ["p10", "p1", "p2", "p11"],
    collectionIds: ["curadoria-icons", "clinical-edit"],
    bundleIds: ["ritual-manha", "kit-glow", "kit-barreira"],
    routineIds: ["rotina-iconica-essencial"],
    tags: ["curated-icon", "luxury", "discovery", "routine", "bundle"],
    primaryCTA: { label: "Ver ícones", href: "#produtos" },
    secondaryCTA: { label: "Comprar curadoria", href: "#kits" },
    theme: {
      accent: "#9A7A2F",
      accentSoft: "#EFE5C9",
      ink: "#171412",
      surface: "#FCF8F4",
      contrast: "#111111"
    },
    tone: "autoridade, confianca e desejo",
    discoveryPrompt: "O achado que resume a curadoria desta semana.",
    skinScanPrompt: "Use o Skin Scan para descobrir qual icone combina melhor com o momento da sua pele.",
    conciergePrompt: "A concierge ajuda a transformar os ícones em uma rotina sem excesso.",
    startHere: [
      {
        title: "Comece por limpeza e serum",
        description: "Dois passos mostram textura, tolerancia e resultado sem alongar a rotina.",
        href: "/guias/rotinas/barreira-cutanea-fragilizada",
        cta: "Ver ordem essencial"
      },
      {
        title: "Depois escolha um kit",
        description: "O kit organiza recompra, presente ou glow em uma decisão unica.",
        href: "/kits/ritual-da-manha",
        cta: "Ver kit iconico"
      }
    ],
    editorialTrails: [
      {
        id: "vale-o-icone",
        label: "Vale o investimento?",
        title: "O que faz um produto virar icone",
        description: "Critério de uso, textura e recompra explicados antes da compra.",
        href: "/guias/vale-o-investimento/serum-radiance-01",
        cta: "Ler guia",
        tags: ["curated-icon", "luxury"]
      },
      {
        id: "combina-clinical",
        label: "Combina com",
        title: "Clinical Luxury para elevar performance",
        description: "Quando a rotina essencial pede ativos com mais precisao.",
        href: "/universos/clinical-luxury",
        cta: "Explorar clinical",
        tags: ["clinical", "routine"]
      }
    ],
    weeklyCuration: {
      label: "Achado da curadoria",
      title: "Serum Radiance 01 como primeiro tratamento",
      description: "Um ponto de entrada para glow elegante, textura leve e leitura facil de resultado.",
      productId: "p1",
      bundleId: "ritual-manha",
      href: "/guias/vale-o-investimento/serum-radiance-01"
    },
    relatedSlugs: ["clinical-luxury", "novos-no-atelier"]
  },
  {
    id: "novos-no-atelier",
    slug: "novos-no-atelier",
    legacySlugs: ["recem-chegados"],
    name: "Novos no Atelier",
    subtitle: "Lancamentos, descobertas recentes e novidades adicionadas a curadoria.",
    description:
      "Uma vitrine viva para descobrir o novo com contexto, exclusividade e menos ruido de mercado.",
    editorialText:
      "Novidade na BelaPop não entra como pressa. Ela chega com motivo: uma textura que faltava, um ativo que resolve melhor, um acabamento que muda a rotina ou um kit que facilita a primeira compra.",
    image: "/vitrine-premium-bg.png",
    imageAlt: "Vitrine premium com lancamentos e textura editorial.",
    heroImage: "/vitrine-premium-bg.png",
    heroImageAlt: "Hero editorial de novidades BelaPop em vitrine premium.",
    badge: "New in",
    productIds: ["p9", "p4", "p11", "p3"],
    collectionIds: ["new-atelier", "curadoria-icons"],
    bundleIds: ["edição-descoberta", "kit-glow"],
    routineIds: ["rotina-novidade-sem-erro"],
    tags: ["new", "discovery", "routine", "bundle"],
    primaryCTA: { label: "Descobrir novidades", href: "#produtos" },
    secondaryCTA: { label: "Ver edição descoberta", href: "#kits" },
    theme: {
      accent: "#8E5B68",
      accentSoft: "#F0DEE3",
      ink: "#1A1416",
      surface: "#FCF7F6",
      contrast: "#111111"
    },
    tone: "novidade, descoberta e exclusividade",
    discoveryPrompt: "O novo que entrou porque tem papel real na rotina.",
    skinScanPrompt: "Use o Skin Scan antes de testar novidades se sua pele estiver reativa.",
    conciergePrompt: "A concierge ajuda a escolher uma novidade sem comprometer o que ja funciona.",
    startHere: [
      {
        title: "Entre por uma unica textura",
        description: "Teste um produto novo por vez para entender conforto e resultado.",
        href: "/kits/edição-descoberta",
        cta: "Ver edição descoberta"
      },
      {
        title: "Use o guia de ativos",
        description: "Quando a novidade for tratamento, entenda combinacoes antes de comprar.",
        href: "/guias/ativos/niacinamida",
        cta: "Ler ativo"
      }
    ],
    editorialTrails: [
      {
        id: "new-atelier-primeira-compra",
        label: "Comece por aqui",
        title: "A edição descoberta reduz risco na primeira compra",
        description: "Mini rotina para experimentar sensorial, glow e acabamento.",
        href: "/kits/edição-descoberta",
        cta: "Ver kit",
        tags: ["new", "bundle"]
      },
      {
        id: "new-atelier-brasil",
        label: "Combina com",
        title: "Brasilidades Premium para descobrir marcas locais",
        description: "Quando o novo tambem carrega identidade brasileira.",
        href: "/universos/brasilidades-premium",
        cta: "Conhecer brasilidades",
        tags: ["brazilian-premium", "discovery"]
      }
    ],
    weeklyCuration: {
      label: "Chegou ao atelier",
      title: "Lip Tint Atelier como acabamento de baixo risco",
      description: "Cor modulavel, conforto e compra facil para entrar no universo sem montar rotina longa.",
      productId: "p9",
      bundleId: "edição-descoberta",
      href: "/kits/edição-descoberta"
    },
    relatedSlugs: ["brasilidades-premium", "presentes"]
  },
  {
    id: "clinical-luxury",
    slug: "clinical-luxury",
    name: "Clinical Luxury",
    subtitle: "Dermocosmeticos com apelo clínico, performance, tecnologia e sofisticacao.",
    description:
      "Ciencia, resultado e luxo discreto para comprar por ativo, tolerancia e consistencia de uso.",
    editorialText:
      "Clinical Luxury e a area técnica da BelaPop. A linguagem e de performance, mas a experiência continua sensorial: ativo certo, frequencia possivel, barreira respeitada e uma compra que não depende de promessas barulhentas.",
    image: "/editorial/home-ai-card.jpg",
    imageAlt: "Pele em close com interface editorial de analise BelaPop.",
    heroImage: "/editorial/home-ai-card.jpg",
    heroImageAlt: "Hero clinical luxury com pele e tecnologia.",
    badge: "Performance discreta",
    productIds: ["p1", "p2", "p10", "p11"],
    collectionIds: ["clinical-edit", "sensitive-barrier"],
    bundleIds: ["ritual-noite", "kit-barreira", "ritual-manha"],
    routineIds: ["rotina-clinical-noite"],
    tags: ["clinical", "luxury", "routine", "bundle"],
    primaryCTA: { label: "Explorar clinical luxury", href: "#produtos" },
    secondaryCTA: { label: "Montar minha rotina", href: "#rotinas" },
    theme: {
      accent: "#60746D",
      accentSoft: "#DDE7E2",
      ink: "#101716",
      surface: "#F7FAF8",
      contrast: "#101312"
    },
    tone: "ciencia, resultado e luxo discreto",
    discoveryPrompt: "O produto que entrega performance sem teatralizar a rotina.",
    skinScanPrompt: "O Skin Scan ajuda a ajustar intensidade, tolerancia e ordem de uso.",
    conciergePrompt: "A concierge organiza ativos para evitar combinacoes redundantes.",
    startHere: [
      {
        title: "Defina um ativo principal",
        description: "A rotina fica mais elegante quando performance tem prioridade clara.",
        href: "/guias/ativos/retinol",
        cta: "Ler guia de ativo"
      },
      {
        title: "Inclua recuperacao",
        description: "Barreira forte sustenta resultado e reduz abandono de tratamento.",
        href: "/kits/kit-barreira",
        cta: "Ver kit barreira"
      }
    ],
    editorialTrails: [
      {
        id: "clinical-ativos",
        label: "Trilha editorial",
        title: "Ativos que valem investimento",
        description: "Niacinamida, ceramidas e retinol explicados por papel na rotina.",
        href: "/guias/ativos",
        cta: "Ver guia",
        tags: ["clinical", "luxury"]
      },
      {
        id: "clinical-sensitive",
        label: "Combina com",
        title: "Pele Sensível quando a performance pede pausa",
        description: "Conforto e barreira como parte da estrategia, não como plano B.",
        href: "/universos/pele-sensível",
        cta: "Ir para pele sensível",
        tags: ["sensitive-skin", "routine"]
      }
    ],
    weeklyCuration: {
      label: "Clinical da semana",
      title: "Creme Barrier Celeste para sustentar ativos",
      description: "Um reparador que deixa a rotina técnica mais toleravel e constante.",
      productId: "p2",
      bundleId: "kit-barreira",
      href: "/guias/ativos/ceramidas"
    },
    relatedSlugs: ["pele-sensível", "ícones-da-curadoria"]
  },
  {
    id: "presentes",
    slug: "presentes",
    legacySlugs: ["para-presentear"],
    name: "Presentes",
    subtitle: "Produtos e kits para presentear por intencao e faixa de preco.",
    description:
      "Afeto, elegancia e facilidade de escolha para transformar beleza em gesto memoravel.",
    editorialText:
      "Presentear beleza pode ser dificil quando parece técnico demais. Este universo transforma a escolha em intencao: autocuidado, glow, descanso, primeira descoberta ou luxo sensorial.",
    image: "/editorial/login-hero-original.jpg",
    imageAlt: "Imagem editorial premium com luz quente para presentes.",
    heroImage: "/editorial/login-hero-original.jpg",
    heroImageAlt: "Hero editorial de presentes BelaPop.",
    badge: "Gift edit",
    productIds: ["p11", "p9", "p7", "p8"],
    collectionIds: ["gift-intentions", "new-atelier"],
    bundleIds: ["edição-descoberta", "kit-glow", "kit-barreira"],
    routineIds: ["rotina-presente-seguro"],
    tags: ["gift", "bundle", "discovery", "luxury"],
    primaryCTA: { label: "Encontrar presente", href: "#comece" },
    secondaryCTA: { label: "Falar com concierge", href: "#concierge" },
    theme: {
      accent: "#A86F53",
      accentSoft: "#F1DDD3",
      ink: "#1B130F",
      surface: "#FCF7F4",
      contrast: "#111111"
    },
    tone: "afeto, elegancia e facilidade de escolha",
    discoveryPrompt: "Um presente que parece escolhido, não apenas comprado.",
    skinScanPrompt: "Para presente de skincare, use o Skin Scan quando a pessoa puder participar.",
    conciergePrompt: "A concierge ajuda a escolher por ocasiao, faixa de preco e tom do gesto.",
    startHere: [
      {
        title: "Escolha a intencao",
        description: "Glow, conforto, descoberta ou bem-estar ja reduzem quase toda indecisao.",
        href: "/kits/edição-descoberta",
        cta: "Ver presente seguro"
      },
      {
        title: "Se estiver em duvida, fale com concierge",
        description: "A escolha fica mais pessoal quando passa por ocasiao e perfil.",
        href: "#concierge",
        cta: "Abrir concierge"
      }
    ],
    editorialTrails: [
      {
        id: "gift-under-ritual",
        label: "Por onde começar",
        title: "Kit pequeno, efeito grande",
        description: "Edicoes de descoberta funcionam para aniversario, agradecimento e autocuidado.",
        href: "/kits/edição-descoberta",
        cta: "Ver kit",
        tags: ["gift", "bundle"]
      },
      {
        id: "gift-new",
        label: "Combina com",
        title: "Novos no Atelier para quem ama novidade",
        description: "Presentes com sensacao de acesso antecipado.",
        href: "/universos/novos-no-atelier",
        cta: "Ver novidades",
        tags: ["new", "discovery"]
      }
    ],
    weeklyCuration: {
      label: "Presente da semana",
      title: "Patch Olhos Aurora como gesto de cuidado",
      description: "Facil de usar, bonito de receber e seguro para diferentes rotinas.",
      productId: "p11",
      bundleId: "edição-descoberta",
      href: "/kits/edição-descoberta"
    },
    relatedSlugs: ["novos-no-atelier", "ícones-da-curadoria"]
  },
  {
    id: "pele-sensível",
    slug: "pele-sensível",
    name: "Pele Sensível",
    subtitle: "Produtos, rotinas e kits para conforto, barreira cutanea e baixa irritabilidade.",
    description:
      "Cuidado, seguranca e acolhimento para comprar com calma quando a pele pede previsibilidade.",
    editorialText:
      "Pele Sensível não e um canto menor da curadoria. E uma forma de escolher: menos friccao, menos novidade simultanea, mais barreira, mais repeticao inteligente e uma rotina que respeita sinais.",
    image: "/hero-bela.jpg",
    imageAlt: "Pele em close com luz suave e sensacao de acolhimento.",
    heroImage: "/hero-bela.jpg",
    heroImageAlt: "Hero de pele sensível BelaPop com luz suave.",
    badge: "Baixo atrito",
    productIds: ["p10", "p2", "p11", "p12"],
    collectionIds: ["sensitive-barrier", "clinical-edit"],
    bundleIds: ["pele-sensível", "kit-barreira"],
    routineIds: ["rotina-pele-sensível"],
    tags: ["sensitive-skin", "clinical", "routine", "bundle"],
    primaryCTA: { label: "Montar rotina sensível", href: "#rotinas" },
    secondaryCTA: { label: "Fazer Skin Scan", href: "/skin-scan" },
    theme: {
      accent: "#75846F",
      accentSoft: "#E2E8DD",
      ink: "#131812",
      surface: "#FAFBF7",
      contrast: "#111111"
    },
    tone: "cuidado, seguranca e acolhimento",
    discoveryPrompt: "O achado que acalma a rotina antes de prometer performance.",
    skinScanPrompt: "O Skin Scan ajuda a separar sensibilidade, ressecamento e barreira fragilizada.",
    conciergePrompt: "A concierge monta uma rotina com poucos passos e baixo atrito.",
    startHere: [
      {
        title: "Reduza a rotina primeiro",
        description: "A pele sensível costuma responder melhor a clareza do que a abundancia.",
        href: "/guias/rotinas/pele-sensível",
        cta: "Ver rotina sensível"
      },
      {
        title: "Compre barreira antes de ativo",
        description: "Conforto vem antes de potencia quando ha ardor, repuxamento ou vermelhidao.",
        href: "/kits/kit-barreira",
        cta: "Ver kit barreira"
      }
    ],
    editorialTrails: [
      {
        id: "sensitive-barrier-guide",
        label: "Trilha editorial",
        title: "Barreira cutanea fragilizada",
        description: "Como reconhecer sinais e escolher produtos com menos risco.",
        href: "/guias/rotinas/barreira-cutanea-fragilizada",
        cta: "Ler guia",
        tags: ["sensitive-skin", "clinical"]
      },
      {
        id: "sensitive-clinical",
        label: "Combina com",
        title: "Clinical Luxury com tolerancia",
        description: "Performance so entra quando a pele tem conforto para sustentar.",
        href: "/universos/clinical-luxury",
        cta: "Explorar clinical",
        tags: ["clinical", "luxury"]
      }
    ],
    weeklyCuration: {
      label: "Conforto da semana",
      title: "Gel Limpeza Veludo para reduzir atrito",
      description: "Um primeiro passo gentil muda a tolerancia da rotina inteira.",
      productId: "p10",
      bundleId: "pele-sensível",
      href: "/guias/rotinas/pele-sensível"
    },
    relatedSlugs: ["clinical-luxury", "brasilidades-premium"]
  },
  {
    id: "brasilidades-premium",
    slug: "brasilidades-premium",
    name: "Brasilidades Premium",
    subtitle: "Marcas brasileiras sofisticadas, ativos nacionais e sensorialidade tropical elegante.",
    description:
      "Orgulho, sofisticacao local e descoberta para uma beleza brasileira com identidade premium.",
    editorialText:
      "Brasilidades Premium foge do obvio. A curadoria olha para marcas, ingredientes, sensoriais e narrativas nacionais que conseguem ser sofisticadas sem perder identidade.",
    image: "/vitrine-premium-bg.png",
    imageAlt: "Vitrine editorial BelaPop com produtos premium.",
    heroImage: "/vitrine-premium-bg.png",
    heroImageAlt: "Hero editorial de brasilidades premium BelaPop.",
    badge: "Made in Brazil edit",
    productIds: ["p7", "p4", "p5", "p12"],
    collectionIds: ["brazilian-premium-edit", "new-atelier"],
    bundleIds: ["kit-glow", "ritual-manha", "edição-descoberta"],
    routineIds: ["rotina-brasilidade-glow"],
    tags: ["brazilian-premium", "luxury", "discovery", "routine", "bundle"],
    primaryCTA: { label: "Conhecer brasilidades", href: "#produtos" },
    secondaryCTA: { label: "Comprar curadoria", href: "#kits" },
    theme: {
      accent: "#6E7562",
      accentSoft: "#E3E6D8",
      ink: "#141611",
      surface: "#FBFAF4",
      contrast: "#111111"
    },
    tone: "orgulho, sofisticacao local e descoberta",
    discoveryPrompt: "O achado brasileiro que merece prateleira premium.",
    skinScanPrompt: "Use o Skin Scan para conectar sensorial brasileiro com necessidades reais da pele.",
    conciergePrompt: "A concierge ajuda a montar uma rotina nacional sofisticada, não folclorica.",
    startHere: [
      {
        title: "Comece pelo sensorial",
        description: "Textura e acabamento sao a porta de entrada para marcas nacionais.",
        href: "/kits/kit-glow",
        cta: "Ver ritual glow"
      },
      {
        title: "Combine pele, corpo e bem-estar",
        description: "A brasilidade premium aparece melhor quando a rotina tem camadas.",
        href: "/catalogo?tag=brazilian-premium",
        cta: "Ver seleção"
      }
    ],
    editorialTrails: [
      {
        id: "brazilian-sensorial",
        label: "Trilha editorial",
        title: "Sensorial tropical em chave sofisticada",
        description: "Como escolher aroma, textura e glow sem cair no excesso.",
        href: "/catalogo?tag=brazilian-premium",
        cta: "Ver seleção",
        tags: ["brazilian-premium", "luxury"]
      },
      {
        id: "brazilian-new",
        label: "Combina com",
        title: "Novos no Atelier para descobertas brasileiras",
        description: "Marcas locais que entram pelo critério de novidade e acabamento.",
        href: "/universos/novos-no-atelier",
        cta: "Descobrir novidades",
        tags: ["new", "discovery"]
      }
    ],
    weeklyCuration: {
      label: "Brasil premium da semana",
      title: "Body Mist Rosa Profundo como assinatura sensorial",
      description: "Uma forma leve de entrar em corpo, perfume e identidade nacional.",
      productId: "p7",
      bundleId: "kit-glow",
      href: "/catalogo?tag=brazilian-premium"
    },
    relatedSlugs: ["novos-no-atelier", "pele-sensível"]
  }
];

const universeBySlug = new Map<string, BelaPopUniverse>();

belaPopUniverses.forEach((universe) => {
  universeBySlug.set(universe.slug, universe);
  universe.legacySlugs?.forEach((slug) => universeBySlug.set(slug, universe));
});

export function getUniverseBySlug(slug: string) {
  return universeBySlug.get(slug) ?? null;
}

export function getRelatedUniverses(slugs: string[]) {
  return slugs
    .map((slug) => getUniverseBySlug(slug))
    .filter((universe): universe is BelaPopUniverse => Boolean(universe));
}

export function getUniverseCollections(universe: BelaPopUniverse) {
  const collectionMap = new Map(universeCollections.map((collection) => [collection.id, collection]));
  return universe.collectionIds
    .map((id) => collectionMap.get(id) ?? null)
    .filter((collection): collection is UniverseCollection => Boolean(collection));
}

export function getUniverseRoutines(universe: BelaPopUniverse) {
  const routineMap = new Map(universeRoutines.map((routine) => [routine.id, routine]));
  return universe.routineIds
    .map((id) => routineMap.get(id) ?? null)
    .filter((routine): routine is UniverseRoutine => Boolean(routine));
}

export function getUniverseBundles(universe: BelaPopUniverse): SkinBundle[] {
  return universe.bundleIds
    .map((id) => getSkinBundleById(id))
    .filter((bundle): bundle is SkinBundle => Boolean(bundle));
}

export function getAllUniverseBundles() {
  return skincareBundles;
}
