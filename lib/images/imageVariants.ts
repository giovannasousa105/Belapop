// Variantes de imagem de produto — processadas no upload, não no cliente.
// Fundo padrão: #FAFAF8 (off-white quente — nunca branco puro).

export interface ImageVariant {
  sufixo:     string;
  largura:    number;
  altura:     number;
  quality:    number;
  formato:    "webp";
  fit:        "contain" | "cover";
  background: { r: number; g: number; b: number; alpha: number };
}

// Off-white #FAFAF8 decomposto em RGBA para o sharp
const OFF_WHITE = { r: 250, g: 250, b: 248, alpha: 1 } as const;
const WARM_WHITE = { r: 240, g: 237, b: 232, alpha: 1 } as const;

export const VARIANTES: Record<string, ImageVariant> = {
  // Card no catálogo — quadrado, produto centralizado
  card: {
    sufixo:     "_card",
    largura:    600,
    altura:     600,
    quality:    85,
    formato:    "webp",
    fit:        "contain",
    background: OFF_WHITE,
  },

  // Carrossel da PDP — quadrado maior
  pdp: {
    sufixo:     "_pdp",
    largura:    1200,
    altura:     1200,
    quality:    90,
    formato:    "webp",
    fit:        "contain",
    background: OFF_WHITE,
  },

  // Thumbnail para grid, wishlist, notificações
  thumb: {
    sufixo:     "_thumb",
    largura:    300,
    altura:     300,
    quality:    80,
    formato:    "webp",
    fit:        "contain",
    background: OFF_WHITE,
  },

  // Editorial wide — universos, hero (4:3, fit cover)
  editorial: {
    sufixo:     "_editorial",
    largura:    1200,
    altura:     900,
    quality:    90,
    formato:    "webp",
    fit:        "cover",
    background: WARM_WHITE,
  },

  // Avatar — miniatura para emails, notificações
  avatar: {
    sufixo:     "_avatar",
    largura:    120,
    altura:     120,
    quality:    75,
    formato:    "webp",
    fit:        "contain",
    background: OFF_WHITE,
  },
};

export type VarianteKey = keyof typeof VARIANTES;

// Convenção de path no Supabase Storage:
//   produtos/{produto_id}/{imagem_id}{variante.sufixo}.webp
export function buildStoragePath(
  produto_id: string,
  imagem_id:  string,
  variante:   VarianteKey,
): string {
  return `produtos/${produto_id}/${imagem_id}${VARIANTES[variante].sufixo}.webp`;
}
