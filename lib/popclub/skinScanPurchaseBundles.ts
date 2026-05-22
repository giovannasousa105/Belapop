export type SkinScanPurchaseBundleKey = "essencial" | "premium" | "luxo";

export type SkinScanPurchaseBundleProduct = {
  slug: string;
  label: string;
  quantity?: number;
};

export type SkinScanPurchaseBundle = {
  key: SkinScanPurchaseBundleKey;
  label: string;
  title: string;
  subtitle: string;
  profileRead: string;
  usageOrder: string[];
  ticketLabel: string;
  ctaLabel: string;
  ctaKind: "cart" | "concierge";
  image: string;
  products: SkinScanPurchaseBundleProduct[];
};

export const skinScanPurchaseBundles = [
  {
    key: "essencial",
    label: "Saida 01",
    title: "Rotina essencial",
    subtitle: "Entrada curada para manter hidratação, conforto e proteção diaria.",
    profileRead:
      "Indicada para uma leitura com boa tolerancia cutanea, leve perda de agua e necessidade de consistencia sem excesso de camadas.",
    usageOrder: ["Limpeza suave", "Serum hidratante", "Proteção diaria"],
    ticketLabel: "R$ 787,00",
    ctaLabel: "Levar essencial ao carrinho",
    ctaKind: "cart",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBOoeQJFNSOkAW3Cq0WnoBOyIG5vLEUD2W9z-owLVl8_L_7n7IswDtaOQOo39vEeaD0sqKF7TclXUcNmNy2HdQBt_7FdEirq7JTfFPqUme7ORGjZgbtk_iAiykH6li1VYERJbJiAaUEqcVKnzelKe1WM9h2zOgNoxND9sABkHteux5A6TLijXEhMeQVu8nZ3AwCuX1OXjuLyDfFNoyxb1UBlxb8DNvcZJzX8G2mPSUbfX9xSljXiPZgheo2jp5Po23ueMNTpum5Wl3J",
    products: [
      { slug: "gel-limpeza-veludo", label: "Gel Limpeza Veludo" },
      { slug: "serum-radiance-01", label: "Serum Radiance 01" },
      { slug: "protetor-solar-luz-de-vela-fps50", label: "Protetor Solar Luz de Vela FPS 50" }
    ]
  },
  {
    key: "premium",
    label: "Saida 02",
    title: "Rotina premium",
    subtitle: "Mais profundidade de tratamento para luminosidade, textura e barreira preservada.",
    profileRead:
      "Faz sentido quando o scan aponta boa base de pele, mas espaco claro para ganho de luminosidade, elasticidade e prevencao.",
    usageOrder: [
      "Preparo com tonico",
      "Serum de hidratação",
      "Creme de barreira",
      "Proteção de alta performance"
    ],
    ticketLabel: "R$ 1.127,00",
    ctaLabel: "Levar premium ao carrinho",
    ctaKind: "cart",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAkPSPvhW1sBuGfYdUMIElLuh8bkt3zONeqZBUVuS9owpMjzB48suyVWXBa6PsdYOlJqYcv2LRpiRSaiPSXg3s-vbZzksJXir6GndDxfb_Rsd7_waQ7mExCdLUmTrnL-tv20chreospOXbmHnIc-qluRCvqwnnhkXfQbR-Dq52volsm8t41GolokgwI1nYLdwQNkAw4CgjVR6YVL2Cs71FlSJN87BV_d9Mp_wTvR33G9QqzgKf-lHdHAu1cVa-FkXbRM1iGVpucGhW9",
    products: [
      { slug: "tonico-nuvem-de-rosa", label: "Tonico Nuvem de Rosa" },
      { slug: "serum-radiance-01", label: "Serum Radiance 01" },
      { slug: "creme-barrier-celeste", label: "Creme Barrier Celeste" },
      { slug: "protetor-solar-luz-de-vela-fps50", label: "Protetor Solar Luz de Vela FPS 50" }
    ]
  },
  {
    key: "luxo",
    label: "Saida 03",
    title: "Edição de luxo",
    subtitle: "Curadoria com assinatura BelaPop para quem quer elevar textura, sensorial e ativos.",
    profileRead:
      "Pensada para peles que pedem ajuste fino de uso, mais camadas de cuidado e acompanhamento de concierge para calibrar textura, luminosidade e constancia.",
    usageOrder: [
      "Limpeza e preparo",
      "Patch de olhar e tonico",
      "Concentrado regenerador",
      "Creme de assinatura e proteção"
    ],
    ticketLabel: "R$ 1.544,00",
    ctaLabel: "Acionar concierge",
    ctaKind: "concierge",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBoTOIuhua06aYc68OaPCjZHv13j9zKU_afOzcMkzqoZ0o8QZCotrXZd-QfvkCY-pyj23Bpw8MVg325KArtZ-_IZ0XsEFc8oxOhPc53SGnKcyrKPxLv-IaoljYmVK3eHQ1PW5tiAicb79WrKRns3kxu-qdIck_y0y0JxnoenhZU3wUWN6RRUgT0pdAGeougWJXgzDx_TzFBnRTUHZT2vc0Pg5yX5aZSc7wPD5xPbj_1gFzGvos-G1Ut-9hSLVkKf1ypOk9lKoowZDee",
    products: [
      { slug: "gel-limpeza-veludo", label: "Gel Limpeza Veludo" },
      { slug: "tonico-nuvem-de-rosa", label: "Tonico Nuvem de Rosa" },
      { slug: "patch-olhos-aurora", label: "Patch Olhos Aurora" },
      { slug: "serum-radiance-01", label: "Serum Radiance 01" },
      { slug: "creme-barrier-celeste", label: "Creme Barrier Celeste" },
      { slug: "protetor-solar-luz-de-vela-fps50", label: "Protetor Solar Luz de Vela FPS 50" }
    ]
  }
] as const satisfies readonly SkinScanPurchaseBundle[];

export const skinScanPurchaseBundleMap = skinScanPurchaseBundles.reduce<
  Record<SkinScanPurchaseBundleKey, SkinScanPurchaseBundle>
>((accumulator, bundle) => {
  accumulator[bundle.key] = bundle;
  return accumulator;
}, {} as Record<SkinScanPurchaseBundleKey, SkinScanPurchaseBundle>);
