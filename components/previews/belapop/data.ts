export const previewScreens = [
  {
    slug: "skincare",
    title: "Skincare",
    description: "Tela de skincare com base mobile first, hot products e expansao editorial para desktop.",
    finalPath: "/preview/skincare"
  },
  {
    slug: "home",
    title: "Home editorial",
    description: "Landing page principal com foco mobile, curadoria e SkinBela.",
    finalPath: "/"
  },
  {
    slug: "scan",
    title: "Scan etapa 1",
    description: "Selecao de focos de cuidado para iniciar a analise facial.",
    finalPath: "/skin-scan"
  },
  {
    slug: "scan-2",
    title: "Scan etapa 2",
    description: "Captura facial com viewfinder editorial e metricas em tempo real.",
    finalPath: "/conta/skincare"
  },
  {
    slug: "diagnostico",
    title: "Diagnostico exclusivo",
    description: "Relatorio biometrico com metricas, vitrine e concierge.",
    finalPath: "/conta/skincare"
  },
  {
    slug: "concierge",
    title: "Concierge de diagnostico",
    description: "Chat de recomendacao ligado ao perfil biometrico.",
    finalPath: "/conta/skincare"
  },
  {
    slug: "carrinho",
    title: "Sacola",
    description: "Carrinho editorial com resumo premium e CTA de compra.",
    finalPath: "/carrinho"
  },
  {
    slug: "login",
    title: "Login",
    description: "Acesso mobile first com imagem editorial e campos amplos.",
    finalPath: "/login"
  },
  {
    slug: "pedido",
    title: "Pedido a caminho",
    description: "Acompanhamento editorial de pedido com destaque de ritual.",
    finalPath: "/pedido/sucesso"
  },
  {
    slug: "rastreio",
    title: "Rastreio",
    description: "Timeline mobile first com resumo e suporte de luxo.",
    finalPath: "/account/orders"
  },
  {
    slug: "feedback",
    title: "Feedback do ritual",
    description: "Tela de avaliacao de produto e experiencia BelaPop.",
    finalPath: "/account/reviews"
  },
  {
    slug: "membro",
    title: "Painel do membro",
    description: "Dashboard premium do POPCLUB com beneficios e status.",
    finalPath: "/conta"
  },
  {
    slug: "recompensas",
    title: "Vitrine de recompensas",
    description: "Galeria premium de resgates, pontos e colecoes para membros.",
    finalPath: "/conta/recompensas"
  },
  {
    slug: "skinbela",
    title: "SkinBela AI",
    description: "Assistente conversacional com evidencias e contexto de pele.",
    finalPath: "/belacode"
  },
  {
    slug: "checkout",
    title: "Checkout editorial",
    description: "Entrega, pagamento e resumo em composicao premium.",
    finalPath: "/checkout"
  },
  {
    slug: "produto",
    title: "Produto editorial",
    description: "Pagina de produto premium com ciencia, ritual e avaliacoes.",
    finalPath: "/produto/orquidea-imperial"
  }
] as const;

export type PreviewScreenSlug = (typeof previewScreens)[number]["slug"];

export function getPreviewScreen(slug: string) {
  return previewScreens.find((screen) => screen.slug === slug);
}

export const homeCollections = [
  {
    id: "colecao-noir",
    title: "Noir Reset",
    description:
      "Texturas noturnas, formulas de barreira e acabamento silencioso para uma pele descansada.",
    coverImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCT5GZzXmWWAknkinKChmsDe2Ot1ArGEA5EJzKe9wXj747oeIA1uq0suNjUCInPQ7YGISMpmLN67bnVu2a3XdRUQlTDWjj2wO_SA61dDDMzwuFB6M1J9Zu0vm7o4FYmssUwAnQiA2K7tZUlIjxdQeMdJjmTTN5MAXut2Hg8UItOC72k_GMGlTFN628D05nOK6zms0_kIE3LoHtlPmUKjc8E8F84Wv19072iDCZCf1v4rKPUcs2Wd4K6sib6uGJur3dVJNGPHxnzdCP3",
    href: "/preview/home",
    eyebrow: "Rotina",
    productCount: 12,
    supportingLabel: "Ritual noturno"
  },
  {
    id: "colecao-glow",
    title: "Glass Veil",
    description:
      "Curadoria de luminosidade com hidratacao refinada e acabamento editorial.",
    coverImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAs4ENUUEpry-Q0eVRqe2OtjDFxasfzRMrbyUjsMYde3nEsa57ojPsAwMMQbLoVtB0r_olMJ-tj1WGn7vJRIbOoGVptBncqD07egKWxFEuLCeJSPyi8IKyK1vKC4dgpQBWCdi8GVn3NGGJmmle_go9oE-HczbnHvaqiVGDxZIxhuJEen8unlNKa9VRqjl9ZZE4XQDdf5zbXxIz_Pt6cPOyy3LtdAu72K4KXM2EPfN37QzcKNgjHevRxxV4OINflp9Ye37Xq6JV-YERT",
    href: "/preview/home",
    eyebrow: "Glow",
    productCount: 8,
    supportingLabel: "Acabamento espelhado"
  },
  {
    id: "colecao-atelier",
    title: "Atelier Repair",
    description:
      "Ceramidas, antioxidantes e conforto sensorial para pele sensibilizada.",
    coverImage:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBSZbcsoRwtGZma1xtPnfazg5G6zub6oDp4T0CgeneN_tIpzSbCd1RuJnDge-KjNtq0SnTVARNcdVZvu3aZNDiKgKub1mR3jaBJZ-aZlVpDCK2xfYZps5fFHu_ffFim6L3agVcpgKOpy3HYXKdN0BDzWPX0SgKjOWvjLEfnEd9-Jd8aLjWl37jY-AAnD8QRf_zVaPOEGmekVRMo6llKZMA85omOSPgJNpzgUeB83XITHQyshgfsnxKas7KZ92_0y0yZIdadFzkewyl8",
    href: "/preview/home",
    eyebrow: "Repair",
    productCount: 10,
    supportingLabel: "Barreira cutanea"
  }
] as const;

export const homeBrands = [
  { name: "La Mer", count: 12 },
  { name: "Dior", count: 9 },
  { name: "Chanel", count: 7 },
  { name: "Augustinus Bader", count: 6 }
] as const;

export const homeBestSellers = [
  {
    id: "lamer-cream",
    slug: "creme-de-la-mer",
    title: "Creme de la Mer",
    brand: "La Mer",
    category: "hidratacao premium",
    price: 2450,
    badge: "Escolha BelaPop",
    tags: ["no_white_cast"],
    hero_image_url:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA1d3PIi7736mJnObIEYCJUoiP4bmpq9pCaEAFfBAx23a480EeJKiB41E0-vv8RV6Hy9GumivnK1Ma8Qf_6zZ13cQhOyP2mdHB2Hn-_qF-UOBcFDZDbxOizfMkGd9_GPoiwIf2d2T79xO6k5yKuXBJZYyy0pfNOSVxTju28BP4ayJWYbYczNd0Quc2Xc_4KOya7HYkvbNIi1Uq3NHLLuPykkUxLJCfI-4brER289dhN4kB6WtR6Kjk0BLtMxG8kHxRNTYSfZGzUtYvD"
  },
  {
    id: "chanel-serum",
    slug: "hydra-beauty-micro-serum",
    title: "Hydra Beauty Micro Serum",
    brand: "Chanel",
    category: "serum",
    price: 890,
    badge: "Glow iconico",
    tags: ["high_pigment"],
    hero_image_url:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAkPSPvhW1sBuGfYdUMIElLuh8bkt3zONeqZBUVuS9owpMjzB48suyVWXBa6PsdYOlJqYcv2LRpiRSaiPSXg3s-vbZzksJXir6GndDxfb_Rsd7_waQ7mExCdLUmTrnL-tv20chreospOXbmHnIc-qluRCvqwnnhkXfQbR-Dq52volsm8t41GolokgwI1nYLdwQNkAw4CgjVR6YVL2Cs71FlSJN87BV_d9Mp_wTvR33G9QqzgKf-lHdHAu1cVa-FkXbRM1iGVpucGhW9"
  },
  {
    id: "dior-serum",
    slug: "capture-totale-serum",
    title: "Capture Totale Super Potent",
    brand: "Dior",
    category: "tratamento",
    price: 1120,
    badge: "Tratamento",
    tags: ["skin_tone_deep"],
    hero_image_url:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBoTOIuhua06aYc68OaPCjZHv13j9zKU_afOzcMkzqoZ0o8QZCotrXZd-QfvkCY-pyj23Bpw8MVg325KArtZ-_IZ0XsEFc8oxOhPc53SGnKcyrKPxLv-IaoljYmVK3eHQ1PW5tiAicb79WrKRns3kxu-qdIck_y0y0JxnoenhZU3wUWN6RRUgT0pdAGeougWJXgzDx_TzFBnRTUHZT2vc0Pg5yX5aZSc7wPD5xPbj_1gFzGvos-G1Ut-9hSLVkKf1ypOk9lKoowZDee"
  },
  {
    id: "aurum-elixir",
    slug: "elixir-facial-aurum",
    title: "Elixir Facial Aurum",
    brand: "BelaPop Selection",
    category: "luminosidade",
    price: 1240,
    badge: "Lancamento",
    tags: ["hair_cacheado"],
    hero_image_url:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBCSgeS0fD1xzjfiRzx1lZ-r_Jb8MiviIq0t7T0wjZGDhgkPwF0Vxfix3ThGk32htv_ABW56SBNC-XXk-tkMBXMRO6zrlwzMm7Tctjf3kQOC468Wn6ciE2ZetLa-Wvjydus6j1zH7UUttbYlaNzzi6hr3GV_7x3VVo64R2WCCJLBRsUu1hoMqCq7-2-74-jRD0WdRGeym0vjLlZB4AxQNjwFlQZJ4xGkiyOIp50UjqgWDILICc6OGENuqAQscSczvDxLVxrZTK-cw_O"
  }
] as const;
