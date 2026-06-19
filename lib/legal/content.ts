import { belapopContact } from "@/lib/brand/contact";

export const legalRoutes = {
  privacy: "/aviso-de-privacidade",
  terms: "/termos-de-uso",
  cookies: "/política-de-cookies",
  returns: "/política-de-trocas-e-devoluções",
  shipping: "/política-de-envio"
} as const;

export const legacyLegalRoutes = {
  privacy: "/privacidade",
  terms: "/termos",
  cookies: "/cookies"
} as const;

export const belapopCompany = {
  tradeName: "BelaPop",
  legalName: "63.945.608 GIOVANNA DE SOUSA FERREIRA SANTOS",
  cnpj: "63.945.608/0001-09",
  address: "Rua Coromandel, 189, Bairro Amorim, Araguari/MG, CEP 38446-093",
  legalNature: "MEI ativa",
  cnae: "4772-5/00",
  capital: "R$ 10.000,00"
} as const;

export const belapopOperationalContacts = {
  institutionalEmail: belapopContact.supportEmail,
  privacyChannel: belapopContact.privacyEmail,
  dpoName: "Responsável por Privacidade BelaPop",
  dpoChannel: belapopContact.privacyEmail
} as const;

export const operationalPendingItems = [
  "Atendimento a pedidos, entrega, pagamento e pós-venda pelo canal institucional.",
  "Solicitações de privacidade, LGPD e incidentes direcionadas ao canal de privacidade.",
  "Registro de protocolos para atendimento e acompanhamento conforme o histórico da compra.",
  "Políticas de envio, troca, devolução, cookies e termos disponíveis antes da finalização do pedido."
] as const;

export const footerLinkGroups = [
  {
    title: "Institucional",
    links: [
      { label: "Sobre a BelaPop", href: "/sobre" },
      { label: "Círculo BelaPop", href: "/circulo" },
      { label: "Segurança", href: "/seguranca" },
      { label: "Fale conosco", href: "/contato" }
    ]
  },
  {
    title: "Legal",
    links: [
      { label: "Aviso de Privacidade", href: legalRoutes.privacy },
      { label: "Termos de Uso", href: legalRoutes.terms },
      { label: "Política de Cookies", href: legalRoutes.cookies },
      { label: "Trocas e Devoluções", href: legalRoutes.returns },
      { label: "Envio e Frete", href: legalRoutes.shipping },
      { label: "Personalizar cookies", action: "cookie-preferences" as const }
    ]
  }
] as const;

export const trustSignalItems = [
  {
    title: "Pagamento seguro",
    body: "A confirmação do pedido depende do meio de pagamento escolhido e das validações de segurança aplicáveis."
  },
  {
    title: "Envio com rastreio",
    body: "O prazo estimado é informado após a aprovação do pagamento e a liberação operacional do pedido."
  },
  {
    title: "Troca e reembolso",
    body: "As regras de arrependimento, devolução e estorno ficam visíveis antes da compra e durante o pós-venda."
  },
  {
    title: "Produtos originais",
    body: "A BelaPop informa o seller responsável antes da compra e não trata a marca exibida como vendedora automática."
  },
  {
    title: "Suporte ao cliente",
    body: "O atendimento existe para pedidos, logística, reembolso e temas de privacidade, com trilha documental."
  }
] as const;

export const commerceTrustMarkers = [
  {
    key: "authenticity",
    title: "Autenticidade visível",
    shortLabel: "Autenticidade",
    body: "Seller identificado, procedência declarada e item original com controle de origem antes da compra."
  },
  {
    key: "curation",
    title: "Curadoria BelaPop",
    shortLabel: "Curadoria BelaPop",
    body: "A seleção editorial deixa claro por que o item entrou na vitrine e em qual contexto ele faz sentido."
  },
  {
    key: "tracking",
    title: "Envio com rastreio",
    shortLabel: "Envio com rastreio",
    body: "Prazo consolidado no pedido e acompanhamento de rastreio assim que a expedição é liberada."
  },
  {
    key: "exchange",
    title: "Troca facilitada",
    shortLabel: "Troca facilitada",
    body: "Fluxo de troca, devolução ou estorno com protocolo, histórico e acompanhamento no pós-venda."
  },
  {
    key: "concierge",
    title: "Atendimento concierge",
    shortLabel: "Concierge",
    body: "Suporte humano e contextual para compra, pedido, entrega e pós-venda sem perder o histórico."
  },
  {
    key: "payment",
    title: "Pagamento seguro",
    shortLabel: "Pagamento seguro",
    body: "Cobrança condicionada à validação do backend, antifraude e meios realmente disponíveis para o pedido."
  }
] as const;

export const cookieCategories = [
  {
    key: "necessary",
    title: "Estritamente necessários",
    description:
      "Mantêm sessão, segurança, autenticação, prevenção a fraude e funcionamento básico da plataforma.",
    alwaysOn: true
  },
  {
    key: "performance",
    title: "Desempenho e análise",
    description:
      "Ajudam a entender navegação, performance de páginas e erros para melhorar a experiência.",
    alwaysOn: false
  },
  {
    key: "functionality",
    title: "Funcionalidade",
    description:
      "Guardam preferências de interface, conteúdo útil e recursos que tornam a navegação mais consistente.",
    alwaysOn: false
  },
  {
    key: "advertising",
    title: "Publicidade e personalização",
    description:
      "Suportam personalização de campanhas, audiências e experiências de mídia quando houver base adequada.",
    alwaysOn: false
  }
] as const;

export type CookieCategoryKey = (typeof cookieCategories)[number]["key"];

export const privacyNotice = {
  updatedAt: "29/05/2026",
  intro:
    "Este Aviso de Privacidade explica como a BelaPop trata dados pessoais no site, no Skin Scan, no Círculo BelaPop, no WhatsApp, no checkout e no pós-venda.",
  tableOfContents: [
    { id: "controladora", label: "Controladora, DPO e contato" },
    { id: "dados-tratados", label: "Dados tratados" },
    { id: "dados-pele", label: "Dados de pele e saúde" },
    { id: "finalidades-bases-legais", label: "Finalidades e bases legais" },
    { id: "círculo-whatsapp", label: "Círculo e WhatsApp" },
    { id: "compartilhamento", label: "Compartilhamento" },
    { id: "transferencia-internacional", label: "Transferência internacional" },
    { id: "cookies-rastreamento", label: "Cookies e rastreamento" },
    { id: "retencao", label: "Prazos de retenção" },
    { id: "menores", label: "Menores de idade" },
    { id: "direitos", label: "Direitos do titular" },
    { id: "seguranca", label: "Segurança, antifraude e incidentes" },
    { id: "links-terceiros", label: "Links para sites de terceiros" },
    { id: "atualizacoes", label: "Alterações neste aviso" },
    { id: "contato", label: "Contato e canal de privacidade" }
  ],
  dataTypes: [
    "Dados cadastrais e de contato, como nome, CPF, e-mail, telefone e endereço de entrega ou cobrança.",
    "Dados de navegação e dispositivo, como IP, identificadores técnicos, preferências de sessão e eventos de uso.",
    "Dados necessários para pagamento, prevenção a fraude, autenticação e conciliação financeira.",
    "Dados de atendimento, trocas, devoluções, reclamações e histórico operacional do pedido.",
    "Dados fornecidos em formulários, campanhas, avaliações, wishlist, conta e interações com concierge ou suporte.",
    "Dados de pele informados no Skin Scan, no Círculo BelaPop ou em preferências de skincare, como tipo de pele, foco de cuidado, preocupação dermatológica e imagem enviada para análise visual quando a funcionalidade for usada."
  ],
  purposes: [
    {
      title: "Criar conta, autenticar acesso e manter a jornada de compra",
      legalBasis: "Execução de contrato e procedimentos preliminares."
    },
    {
      title: "Processar pedidos, cobrança, expedição, logística, pós-venda e reembolso",
      legalBasis: "Execução de contrato e cumprimento de obrigações legais."
    },
    {
      title: "Prevenir fraude, validar identidade e proteger o ambiente transacional",
      legalBasis: "Legítimo interesse e exercício regular de direitos."
    },
    {
      title: "Atender direitos do consumidor, registros fiscais e demandas de autoridades",
      legalBasis: "Cumprimento de obrigação legal ou regulatória."
    },
    {
      title: "Mensurar performance, melhorar usabilidade e personalizar experiências opcionais",
      legalBasis: "Legítimo interesse ou consentimento, conforme o caso."
    },
    {
      title: "Enviar comunicações promocionais e campanhas personalizadas",
      legalBasis: "Consentimento, quando exigido."
    }
  ],
  sharing: [
    "Operadores de pagamento, instituições financeiras, provedores antifraude e parceiros de conciliação.",
    "Transportadoras, operadores logísticos, hubs de fulfillment e fornecedores de rastreio.",
    "Prestadores de tecnologia, infraestrutura, atendimento, CRM, mensageria e hospedagem.",
    "Parceiros seller somente quando identificados de forma clara na oferta e necessários para cumprir o pedido.",
    "Autoridades públicas ou terceiros legitimados quando houver dever legal, regulatório ou ordem válida."
  ],
  retention:
    "Dados fiscais e transacionais são mantidos por 5 anos; dados relacionados à relação de consumo e pós-venda por 5 anos; logs de acesso por 6 meses, salvo obrigação legal ou ordem de autoridade; dados de marketing e WhatsApp permanecem até revogação do consentimento; dados de pele e imagem do Skin Scan são mantidos apenas pelo tempo necessário à análise e à entrega da experiência, salvo se a cliente salvar o resultado na conta.",
  rights: [
    "Confirmação da existência de tratamento.",
    "Acesso aos dados e correção de informações incompletas, inexatas ou desatualizadas.",
    "Anonimização, bloqueio ou eliminação, quando cabível.",
    "Portabilidade, nos termos da regulamentação aplicável.",
    "Informação sobre compartilhamentos e sobre a possibilidade de não consentir.",
    "Revogação de consentimento, quando essa for a base legal aplicável."
  ],
  security:
    "A BelaPop pode empregar controles de autenticação, trilhas de auditoria, segregação de acesso, monitoramento de eventos e validações antifraude compatíveis com a operação digital."
} as const;

export const termsAndConditions = {
  updatedAt: "29/05/2026",
  intro:
    "Estes Termos de Uso explicam as regras de uso do site, do Círculo BelaPop, dos drops, do checkout, das comunicações e do atendimento ao consumidor.",
  tableOfContents: [
    { id: "identificacao-escopo", label: "Identificação e escopo" },
    { id: "cadastro-elegibilidade", label: "Cadastro e elegibilidade" },
    { id: "círculo-whatsapp", label: "Círculo BelaPop e WhatsApp" },
    { id: "drops", label: "Drops e janela de compra" },
    { id: "seller-e-oferta", label: "Seller, oferta e marcas exibidas" },
    { id: "preco-estoque-aprovação", label: "Preço, estoque e aprovação" },
    { id: "pagamento-antifraude", label: "Pagamento e antifraude" },
    { id: "logistica-entrega", label: "Logística e entrega" },
    { id: "cosmeticos-seguranca", label: "Uso de cosméticos e patch test" },
    { id: "reembolso-e-devolucao", label: "Reembolso e devolução" },
    { id: "propriedade-intelectual", label: "Propriedade intelectual" },
    { id: "limitação-responsabilidade", label: "Limitação de responsabilidade" },
    { id: "atualizacoes-contato", label: "Atualizações e contato" }
  ]
} as const;

export const cookiesPolicy = {
  updatedAt: "29/05/2026",
  intro:
    "A Política de Cookies explica quais cookies e tecnologias semelhantes a BelaPop usa, quais são essenciais, quais dependem de consentimento e como revisar suas preferências.",
  tableOfContents: [
    { id: "o-que-sao", label: "O que são cookies" },
    { id: "categorias", label: "Categorias utilizadas" },
    { id: "ferramentas", label: "Ferramentas de medição e mídia" },
    { id: "consentimento", label: "Como o consentimento funciona" },
    { id: "gestao", label: "Como personalizar ou retirar o consentimento" },
    { id: "retencao", label: "Retenção e revisão" }
  ]
} as const;

export const returnsPolicy = {
  updatedAt: "29/05/2026",
  intro:
    "A Política de Trocas e Devoluções separa o direito de arrependimento em compras online, a garantia legal de cosméticos, reações adversas, avarias, divergências e reembolso.",
  tableOfContents: [
    { id: "arrependimento", label: "Arrependimento em 7 dias" },
    { id: "drops-circulo", label: "Drops e Círculo BelaPop" },
    { id: "troca-garantia", label: "Troca, vício e garantia legal" },
    { id: "reacao-adversa", label: "Reação adversa e segurança" },
    { id: "avaria-divergencia", label: "Avaria, divergência ou item incorreto" },
    { id: "marketplace", label: "Pedidos com sellers parceiros" },
    { id: "atraso-entrega", label: "Atraso ou não entrega" },
    { id: "analise-reembolso", label: "Análise e reembolso" },
    { id: "como-solicitar", label: "Como solicitar atendimento" }
  ]
} as const;

export const shippingPolicy = {
  updatedAt: "29/05/2026",
  intro:
    "A Política de Envio e Frete explica como prazos, custos, rastreio e responsabilidades logísticas são apresentados na BelaPop antes da conclusão do pedido.",
  tableOfContents: [
    { id: "calculo-frete", label: "Cálculo de frete" },
    { id: "prazo-entrega", label: "Prazo de entrega" },
    { id: "sellers", label: "Produtos de sellers parceiros" },
    { id: "rastreamento", label: "Rastreamento e ocorrências" },
    { id: "atendimento", label: "Atendimento logístico" }
  ]
} as const;
