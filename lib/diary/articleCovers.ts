type ArticleCoverInput = {
  slug?: string | null;
  category?: string | null;
  coverImageUrl?: string | null;
};

const KNOWN_BAD_COVER_VALUES = new Set(["/logo.svg", "/logo-dark.svg", "/icon.svg"]);
const HERO_COVER_BY_SLUG: Record<string, string> = {
  "ritual-matutino": "/editorial/diario-hero-ritual-matutino.svg",
  "pele-em-plantao": "/editorial/diario-hero-pele-em-plantao.svg",
  "autocuidado-noite": "/editorial/diario-hero-autocuidado-noite.svg",
  "bem-estar-sensorial": "/editorial/diario-hero-bem-estar-sensorial.svg",
  "makeup-editorial": "/editorial/diario-hero-makeup-editorial.svg"
};

function normalize(value?: string | null) {
  return typeof value === "string" ? value.trim() : "";
}

function hasUsableExternalCover(coverImageUrl?: string | null) {
  const value = normalize(coverImageUrl);
  if (!value) return false;
  if (KNOWN_BAD_COVER_VALUES.has(value)) return false;
  if (value.startsWith("/diario/") && value.endsWith(".jpg")) return false;
  return true;
}

export function getDiaryFallbackCover(input: ArticleCoverInput) {
  const slug = normalize(input.slug).toLowerCase();
  const category = normalize(input.category).toLowerCase();

  if (slug.includes("makeup") || category.includes("maqui")) {
    return "/editorial/diario-makeup-editorial.svg";
  }

  if (slug.includes("pele") || category.includes("pele")) {
    return "/editorial/diario-pele-editorial.svg";
  }

  if (slug.includes("autocuidado") || slug.includes("noite") || category.includes("autocuidado")) {
    return "/editorial/diario-autocuidado-editorial.svg";
  }

  if (slug.includes("sensorial") || category.includes("bem-estar") || category.includes("bem-estar")) {
    return "/editorial/diario-bem-estar-editorial.svg";
  }

  return "/editorial/diario-rotina-editorial.svg";
}

export function resolveDiaryCardCover(input: ArticleCoverInput) {
  if (hasUsableExternalCover(input.coverImageUrl)) {
    return normalize(input.coverImageUrl);
  }

  return getDiaryFallbackCover(input);
}

export function getDiaryHeroCover(input: ArticleCoverInput) {
  const slug = normalize(input.slug).toLowerCase();
  const category = normalize(input.category).toLowerCase();

  if (HERO_COVER_BY_SLUG[slug]) {
    return HERO_COVER_BY_SLUG[slug];
  }

  if (slug.includes("makeup") || category.includes("maqui")) {
    return "/editorial/diario-hero-makeup-editorial.svg";
  }

  if (slug.includes("pele") || category.includes("pele") || slug.includes("plantao")) {
    return "/editorial/diario-hero-pele-em-plantao.svg";
  }

  if (slug.includes("autocuidado") || slug.includes("noite") || category.includes("autocuidado")) {
    return "/editorial/diario-hero-autocuidado-noite.svg";
  }

  if (
    slug.includes("sensorial") ||
    slug.includes("minimalismo") ||
    category.includes("bem-estar")
  ) {
    return "/editorial/diario-hero-bem-estar-sensorial.svg";
  }

  return "/editorial/diario-hero-ritual-matutino.svg";
}
