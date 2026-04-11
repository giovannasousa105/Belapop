type ProductVisualInput = {
  category?: string | null;
  heroImageUrl?: string | null;
  coverImage?: string | null;
};

const DEFAULT_PRODUCT_HERO = "/editorial/product-hero-signature.svg";

const PRODUCT_HERO_BY_CATEGORY: Record<string, string> = {
  skincare: "/editorial/product-hero-skincare.svg",
  maquiagem: "/editorial/product-hero-maquiagem.svg",
  cabelos: "/editorial/product-hero-cabelos.svg",
  "bem-estar": "/editorial/product-hero-bem-estar.svg",
  corpo: "/editorial/product-hero-corpo.svg",
  acessorios: "/editorial/product-hero-acessorios.svg"
};

const LOGO_PLACEHOLDERS = new Set(["/logo.svg", "/logo-dark.svg"]);

function normalizeCategory(value?: string | null) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function isRenderableProductImage(value?: string | null) {
  if (typeof value !== "string") return false;

  const sanitized = value.trim();
  if (!sanitized) return false;

  return !LOGO_PLACEHOLDERS.has(sanitized.toLowerCase());
}

export function getProductHeroCover(input: ProductVisualInput) {
  const editorialCandidate = [input.heroImageUrl, input.coverImage].find(
    (value) => typeof value === "string" && value.includes("/editorial/product-hero-")
  );

  if (editorialCandidate) {
    return editorialCandidate.trim();
  }

  return PRODUCT_HERO_BY_CATEGORY[normalizeCategory(input.category)] ?? DEFAULT_PRODUCT_HERO;
}

export function getProductDisplayImage(input: ProductVisualInput) {
  const candidate = [input.heroImageUrl, input.coverImage].find(isRenderableProductImage);
  if (candidate) {
    return candidate.trim();
  }

  return getProductHeroCover(input);
}