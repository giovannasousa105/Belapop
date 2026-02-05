import { Product, ShippingCartItem } from "@/lib/types";

const FALLBACK = {
  weightKg: 0.3,
  widthCm: 12,
  heightCm: 6,
  lengthCm: 18
};

const warnMissing = (product: Product, field: keyof typeof FALLBACK) => {
  if (process.env.NODE_ENV === "production") return;
  console.warn(
    `[BelaPop] Produto ${product.id} sem ${field}. Usando fallback.`
  );
};

const ensureNumber = (
  value: number | undefined,
  fallback: number,
  product: Product,
  field: keyof typeof FALLBACK
) => {
  if (!Number.isFinite(value)) {
    warnMissing(product, field);
    return fallback;
  }
  return Number(value);
};

export const buildShippingItems = (
  items: { product: Product; quantity: number }[]
): ShippingCartItem[] =>
  items.map(({ product, quantity }) => ({
    productId: product.id,
    sellerId: product.sellerId,
    quantity: Math.max(1, Math.floor(quantity)),
    weightKg: ensureNumber(product.weightKg, FALLBACK.weightKg, product, "weightKg"),
    widthCm: ensureNumber(product.widthCm, FALLBACK.widthCm, product, "widthCm"),
    heightCm: ensureNumber(product.heightCm, FALLBACK.heightCm, product, "heightCm"),
    lengthCm: ensureNumber(product.lengthCm, FALLBACK.lengthCm, product, "lengthCm"),
    price: product.price
  }));
