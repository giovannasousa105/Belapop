import { belapopContact } from "@/lib/brand/contact";

export const legalRoutes = {
  privacy: "/aviso-de-privacidade",
  terms: "/termos-e-condicoes",
  cookies: "/política-de-cookies",
  returns: "/trocas-e-devolucoes",
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
  "Solicitações de privacidade e LGPD direcionadas ao canal de privacidade.",
  "Registro de protocolos e acompanhamento conforme o histórico da compra.",
  "Políticas de envio, troca e devolução publicadas antes da finalização do pedido."
] as const;

export const footerLinkGroups = [
  {
    title: "Institucional",
    links: [
      { label: "Sobre a BelaPop", href: "/sobre" },
      { label: "Segurança", href: "/seguranca" },
      { label: "Fale conosco", href: "/contato" }
    ]
  },
  {
    title: "Legal",
    links: [
      { label: "Aviso de Privacidade", href: legalRoutes.privacy },
      { label: "Termos e Condições", href: legalRoutes.terms },
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
  updatedAt: "13/05/2026",
  intro:
    "Este Aviso de Privacidade resume como a BelaPop trata dados pessoais no ambiente digital, quais finalidades orientam esse tratamento e quais canais oficiais existem para atendimento ao titular.",
  tableOfContents: [
    { id: "controladora", label: "Controladora e identificação" },
    { id: "dados-tratados", label: "Dados tratados" },
    { id: "finalidades-bases-legais", label: "Finalidades e bases legais" },
    { id: "compartilhamento", label: "Compartilhamento" },
    { id: "retencao", label: "Retenção" },
    { id: "direitos", label: "Direitos do titular" },
    { id: "seguranca", label: "Segurança e antifraude" },
    { id: "contato", label: "Contato e atualizações" }
  ],
  dataTypes: [
    "Dados cadastrais e de contato, como nome, CPF, e-mail, telefone e endereço de entrega ou cobrança.",
    "Dados de navegação e dispositivo, como IP, identificadores técnicos, preferências de sessão e eventos de uso.",
    "Dados necessários para pagamento, prevenção a fraude, autenticação e conciliação financeira.",
    "Dados de atendimento, trocas, devoluções, reclamações e histórico operacional do pedido.",
    "Dados fornecidos em formulários, campanhas, avaliações, wishlist, conta e interações com concierge ou suporte."
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
    "A BelaPop mantém dados pelo tempo necessário para cumprir a finalidade informada, atender obrigações legais, fiscais, regulatórias, resolver disputas, resguardar direitos e prevenir fraude. Os critérios de retenção são revisados conforme a evolução da operação.",
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
  updatedAt: "13/05/2026",
  intro:
    "Estes Termos deixam claro como a BelaPop vende, aprova, entrega, acompanha e eventualmente reembolsa pedidos no ambiente digital. O objetivo é reduzir ambiguidade jurídica e tornar a operação visível para o cliente antes da compra.",
  tableOfContents: [
    { id: "identificacao-escopo", label: "Identificação e escopo" },
    { id: "cadastro-elegibilidade", label: "Cadastro e elegibilidade" },
    { id: "seller-e-oferta", label: "Seller, oferta e marcas exibidas" },
    { id: "preco-estoque-aprovação", label: "Preço, estoque e aprovação" },
    { id: "pagamento-antifraude", label: "Pagamento e antifraude" },
    { id: "logistica-entrega", label: "Logística e entrega" },
    { id: "reembolso-e-devolucao", label: "Reembolso e devolução" },
    { id: "propriedade-intelectual", label: "Propriedade intelectual" },
    { id: "limitação-responsabilidade", label: "Limitação de responsabilidade" },
    { id: "atualizacoes-contato", label: "Atualizações e contato" }
  ]
} as const;

export const cookiesPolicy = {
  updatedAt: "13/05/2026",
  intro:
    "A Política de Cookies explica como a BelaPop usa cookies e tecnologias semelhantes para manter sessão, segurança, prevenção a fraude, mensuração de desempenho e personalização opcional.",
  tableOfContents: [
    { id: "o-que-sao", label: "O que são cookies" },
    { id: "categorias", label: "Categorias utilizadas" },
    { id: "consentimento", label: "Como o consentimento funciona" },
    { id: "gestao", label: "Como personalizar ou retirar o consentimento" },
    { id: "mapa-operacional", label: "Mapa de cookies e preferências" }
  ]
} as const;

export const returnsPolicy = {
  updatedAt: "13/05/2026",
  intro:
    "A Política de Trocas e Devoluções apresenta como a BelaPop conduz atendimento pós-venda, arrependimento, avarias, divergências e reembolso em pedidos próprios ou com sellers parceiros.",
  tableOfContents: [
    { id: "arrependimento", label: "Arrependimento e devolução" },
    { id: "avaria-divergencia", label: "Avaria, divergência ou item incorreto" },
    { id: "marketplace", label: "Pedidos com sellers parceiros" },
    { id: "análise-reembolso", label: "Análise e reembolso" },
    { id: "como-solicitar", label: "Como solicitar atendimento" }
  ]
} as const;

export const shippingPolicy = {
  updatedAt: "13/05/2026",
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
