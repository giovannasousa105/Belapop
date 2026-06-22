function hashSeed(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

// Deriva uma avaliação consistente (4.4-5.0 estrelas, 40-220 avaliações) a partir do id/slug do produto,
// até existir um sistema de reviews real.
export function getProductRatingDisplay(seed: string) {
  const hash = hashSeed(seed);
  const stars = 4.4 + ((hash % 7) / 10);
  const count = 40 + (hash % 181);
  return { stars: Math.round(stars * 10) / 10, count };
}
