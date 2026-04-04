export const legalRoutes = {
  privacy: "/aviso-de-privacidade",
  terms: "/termos-e-condicoes",
  cookies: "/politica-de-cookies"
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
  institutionalEmail: null as string | null,
  privacyChannel: null as string | null,
  dpoName: null as string | null,
  dpoChannel: null as string | null
} as const;

export const operationalPendingItems = [
  "E-mail institucional da BelaPop.",
  "Canal formal para solicitações de privacidade.",
  "Identificação do encarregado(a) ou responsável por dados.",
  "Mapa operacional real de cookies, analytics e personalização.",
  "Política operacional definitiva de entrega, troca e reembolso."
] as const;

export const footerLinkGroups = [
  {
    title: "Institucional",
    links: [
      { label: "Sobre a BelaPop", href: "/sobre" },
      { label: "Seguranca", href: "/seguranca" },
      { label: "Fale conosco", href: "/contato" }
    ]
  },
  {
    title: "Legal",
    links: [
      { label: "Aviso de Privacidade", href: legalRoutes.privacy },
      { label: "Termos e Condicoes", href: legalRoutes.terms },
      { label: "Politica de Cookies", href: legalRoutes.cookies },
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
    body: "A BelaPop informa o seller responsavel antes da compra e nao trata a marca exibida como vendedora automatica."
  },
  {
    title: "Suporte ao cliente",
    body: "O atendimento existe para pedidos, logística, reembolso e temas de privacidade, com trilha documental."
  }
] as const;

export const cookieCategories = [
  {
    key: "necessary",
    title: "Estritamente necessarios",
    description:
      "Mantêm sessão, segurança, autenticação, prevenção a fraude e funcionamento básico da plataforma.",
    alwaysOn: true
  },
  {
    key: "performance",
    title: "Desempenho e analise",
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
    title: "Publicidade e personalizacao",
    description:
      "Suportam personalização de campanhas, audiências e experiências de mídia quando houver base adequada.",
    alwaysOn: false
  }
] as const;

export type CookieCategoryKey = (typeof cookieCategories)[number]["key"];

export const privacyNotice = {
  updatedAt: "03/04/2026",
  intro:
    "Este Aviso de Privacidade traduz a base institucional e operacional da BelaPop para o ambiente digital. Ele resume quais dados podem ser tratados, para quais finalidades e quais controles ainda dependem de validacao operacional.",
  tableOfContents: [
    { id: "controladora", label: "Controladora e identificacao" },
    { id: "dados-tratados", label: "Dados tratados" },
    { id: "finalidades-bases-legais", label: "Finalidades e bases legais" },
    { id: "compartilhamento", label: "Compartilhamento" },
    { id: "retencao", label: "Retencao" },
    { id: "direitos", label: "Direitos do titular" },
    { id: "seguranca", label: "Seguranca e antifraude" },
    { id: "contato", label: "Contato e atualizacoes" }
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
      legalBasis: "Execucao de contrato e procedimentos preliminares."
    },
    {
      title: "Processar pedidos, cobrança, expedição, logística, pós-venda e reembolso",
      legalBasis: "Execucao de contrato e cumprimento de obrigacoes legais."
    },
    {
      title: "Prevenir fraude, validar identidade e proteger o ambiente transacional",
      legalBasis: "Legitimo interesse e exercicio regular de direitos."
    },
    {
      title: "Atender direitos do consumidor, registros fiscais e demandas de autoridades",
      legalBasis: "Cumprimento de obrigacao legal ou regulatoria."
    },
    {
      title: "Mensurar performance, melhorar usabilidade e personalizar experiencias opcionais",
      legalBasis: "Legitimo interesse ou consentimento, conforme o caso."
    },
    {
      title: "Enviar comunicacoes promocionais e campanhas personalizadas",
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
    "A BelaPop mantem dados pelo tempo necessario para cumprir a finalidade informada, atender obrigacoes legais, fiscais, regulatorias, resolver disputas, resguardar direitos e prevenir fraude. Os prazos operacionais finos ainda dependem de matriz de retencao formal.",
  rights: [
    "Confirmacao da existencia de tratamento.",
    "Acesso aos dados e correção de informações incompletas, inexatas ou desatualizadas.",
    "Anonimizacao, bloqueio ou eliminacao, quando cabivel.",
    "Portabilidade, nos termos da regulamentacao aplicavel.",
    "Informacao sobre compartilhamentos e sobre a possibilidade de nao consentir.",
    "Revogacao de consentimento, quando essa for a base legal aplicavel."
  ],
  security:
    "A BelaPop pode empregar controles de autenticacao, trilhas de auditoria, segregacao de acesso, monitoramento de eventos e validacoes antifraude compativeis com a operacao digital. A arquitetura definitiva de seguranca deve ser refletida em politicas e playbooks internos."
} as const;

export const termsAndConditions = {
  updatedAt: "03/04/2026",
  intro:
    "Estes Termos deixam claro como a BelaPop vende, aprova, entrega, acompanha e eventualmente reembolsa pedidos no ambiente digital. O objetivo e reduzir ambiguidade juridica e tornar a operacao visivel para o cliente antes da compra.",
  tableOfContents: [
    { id: "identificacao-escopo", label: "Identificacao e escopo" },
    { id: "cadastro-elegibilidade", label: "Cadastro e elegibilidade" },
    { id: "seller-e-oferta", label: "Seller, oferta e marcas exibidas" },
    { id: "preco-estoque-aprovacao", label: "Preco, estoque e aprovacao" },
    { id: "pagamento-antifraude", label: "Pagamento e antifraude" },
    { id: "logistica-entrega", label: "Logistica e entrega" },
    { id: "reembolso-e-devolucao", label: "Reembolso e devolucao" },
    { id: "propriedade-intelectual", label: "Propriedade intelectual" },
    { id: "limitacao-responsabilidade", label: "Limitacao de responsabilidade" },
    { id: "atualizacoes-contato", label: "Atualizacoes e contato" }
  ]
} as const;

export const cookiesPolicy = {
  updatedAt: "03/04/2026",
  intro:
    "A Politica de Cookies explica como a BelaPop usa cookies e tecnologias semelhantes para manter sessao, seguranca, prevencao a fraude, mensuracao de desempenho e personalizacao opcional.",
  tableOfContents: [
    { id: "o-que-sao", label: "O que sao cookies" },
    { id: "categorias", label: "Categorias utilizadas" },
    { id: "consentimento", label: "Como o consentimento funciona" },
    { id: "gestao", label: "Como personalizar ou retirar o consentimento" },
    { id: "mapa-operacional", label: "Mapa operacional e validacoes pendentes" }
  ]
} as const;
