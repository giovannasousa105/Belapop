import { Product } from "@/lib/types";

export const PRODUCT_SELECT_FIELDS = `
  id,
  name,
  description,
  category,
  price_cents,
  currency,
  images,
  highlights,
  status,
  weight_kg,
  width_cm,
  height_cm,
  length_cm,
  stock_quantity,
  curated,
  curation_feedback,
  review_notes,
  image_tone,
  is_featured,
  created_at,
  updated_at,
  seller_id
`;

export const fromDbStatus = (status?: string): Product["status"] => {
  if (status === "review" || status === "published" || status === "paused" || status === "draft") {
    return status;
  }
  return "draft";
};

export const toDbStatus = (status: Product["status"]) => status;

export const mapProductRow = (row: any): Product => ({
  id: row.id,
  name: row.name ?? "",
  description: row.description ?? "",
  category: row.category,
  price: Number(row.price_cents ?? 0) / 100,
  currency: row.currency ?? "BRL",
  images: Array.isArray(row.images) ? row.images : [],
  highlights: Array.isArray(row.highlights) ? row.highlights : [],
  status: fromDbStatus(row.status),
  weightKg: row.weight_kg ?? undefined,
  widthCm: row.width_cm ?? undefined,
  heightCm: row.height_cm ?? undefined,
  lengthCm: row.length_cm ?? undefined,
  stockQuantity: Number(row.stock_quantity ?? 0),
  curated: Boolean(row.curated),
  curationFeedback: row.curation_feedback ?? undefined,
  imageTone: row.image_tone ?? undefined,
  featured: Boolean(row.is_featured),
  createdAt: row.created_at ?? new Date().toISOString(),
  updatedAt: row.updated_at ?? new Date().toISOString(),
  sellerId: row.seller_id ?? ""
});
