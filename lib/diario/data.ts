export interface ReelItem {
  slug: string;
  title: string;
  caption?: string;
  thumbnailUrl?: string;
  duration?: string;
  tag?: string;
  publishedAt?: string;
}

export interface ArtigoItem {
  slug: string;
  title: string;
  excerpt: string;
  coverUrl?: string;
  readTime: number;
  tag: string;
  publishedAt?: string;
}

export interface ReflexaoItem {
  slug: string;
  title: string;
  excerpt: string;
  readTime: number;
  tema?: string;
  publishedAt?: string;
}

export const reels: ReelItem[] = [
  {
    slug: "como-usar-niacinamida",
    title: "Como usar Niacinamida sem errar",
    caption: "Ordem de uso, quantidade certa e o que evitar combinar.",
    thumbnailUrl: "/editorial/belapop-skin-scan-hero-mobile-poster.jpg",
    duration: "0:52",
    tag: "Ingrediente",
    publishedAt: "2026-05-28",
  },
  {
    slug: "rotina-3-passos",
    title: "Rotina de 3 passos que realmente funciona",
    caption: "Para quem quer resultado sem complicar a rotina.",
    thumbnailUrl: "/editorial/belapop-skin-scan-hero-poster.jpg",
    duration: "1:08",
    tag: "Rotina",
    publishedAt: "2026-05-22",
  },
  {
    slug: "toner-coreano-para-que-serve",
    title: "Toner coreano: para que serve de verdade",
    caption: "A diferença entre toner, essence e sérum explicada em 60 segundos.",
    thumbnailUrl: "/editorial/login-hero-original.jpg",
    duration: "1:02",
    tag: "K-Beauty",
    publishedAt: "2026-05-15",
  },
  {
    slug: "como-ler-lista-inci",
    title: "Como ler a lista INCI de um cosmético",
    caption: "O que olhar primeiro antes de comprar qualquer produto.",
    thumbnailUrl: "/editorial/home-ai-card.jpg",
    duration: "0:48",
    tag: "Guia rápido",
    publishedAt: "2026-05-10",
  },
];

export const artigos: ArtigoItem[] = [
  {
    slug: "protetor-solar-rotina-coreana",
    title: "Por que o protetor solar é o passo mais importante da rotina coreana",
    excerpt:
      "Entenda por que as coreanas colocam SPF como prioridade absoluta — e como isso muda a lógica de tudo que vem antes.",
    coverUrl: "/editorial/belapop-skin-scan-hero-poster.jpg",
    readTime: 6,
    tag: "Guia de ativo",
    publishedAt: "2026-05-25",
  },
  {
    slug: "barreira-cutanea",
    title: "Barreira cutânea: o que é e por que você precisa parar de agredir a sua",
    excerpt:
      "O conceito mais importante do skincare moderno, explicado sem jargão técnico.",
    coverUrl: "/editorial/belapop-skin-scan-hero-mobile-poster.jpg",
    readTime: 4,
    tag: "Conceito",
    publishedAt: "2026-05-18",
  },
  {
    slug: "skincare-coreano-10-passos-mito",
    title: "A rotina de 10 passos coreana é um mito. Veja o que realmente importa",
    excerpt:
      "Ninguém faz 10 passos todo dia. A lógica do K-beauty é outra — e é muito mais aplicável do que parece.",
    coverUrl: "/editorial/home-ai-card.jpg",
    readTime: 5,
    tag: "K-Beauty",
    publishedAt: "2026-05-12",
  },
];

export const reflexoes: ReflexaoItem[] = [
  {
    slug: "menos-produtos-mais-consistencia",
    title: "Menos produtos, mais consistência",
    excerpt:
      "A gente foi ensinada a acumular. Mas a pele responde melhor a poucos passos feitos todo dia do que a muitos passos feitos às vezes...",
    readTime: 3,
    tema: "Minimalismo",
    publishedAt: "2026-05-29",
  },
  {
    slug: "o-que-coreanas-sabem",
    title: "O que a rotina coreana sabe que a ocidental ainda não aprendeu",
    excerpt:
      "Não é sobre ter 10 passos. É sobre tratar a pele como algo que merece atenção antes de aparecer o problema...",
    readTime: 4,
    tema: "K-Beauty",
    publishedAt: "2026-05-19",
  },
  {
    slug: "curadoria-nao-e-luxo",
    title: "Curadoria não é luxo — é falta de tempo para errar",
    excerpt:
      "Cada produto que entra na lista BelaPop passou por uma pergunta simples: você compraria de novo? A resposta precisa ser sim sem hesitar...",
    readTime: 2,
    tema: "BelaPop",
    publishedAt: "2026-05-12",
  },
];
