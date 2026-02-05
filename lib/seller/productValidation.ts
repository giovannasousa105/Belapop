export type ProductStatus = "draft" | "review" | "published" | "paused";

export const DEFAULT_STATUS: ProductStatus = "draft";

const normalizeImages = (value: any): string[] => {
  if (Array.isArray(value)) {
    return value.map((img) => String(img).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((img) => img.trim())
      .filter(Boolean);
  }
  return [];
};

export const validateProductPayload = (
  payload: any,
  options?: { requireDimensions?: boolean }
) => {
  const errors: string[] = [];
  const statusValue = (payload.status ?? DEFAULT_STATUS) as ProductStatus;
  const enforceDimensions = options?.requireDimensions ?? statusValue !== "draft";

  if (!payload.name?.trim()) {
    errors.push("Informe um nome editorial.");
  }
  if (!payload.description?.trim()) {
    errors.push("Conte-nos sobre o produto.");
  }
  const price = Number(payload.price);
  if (!payload.price || Number.isNaN(price) || price <= 0) {
    errors.push("Defina um preço válido.");
  }
  if (enforceDimensions) {
    const numericFields = ["weightKg", "widthCm", "heightCm", "lengthCm"] as const;
    numericFields.forEach((field) => {
      const value = Number(payload[field]);
      if (!payload[field] || Number.isNaN(value) || value <= 0) {
        errors.push("Preencha peso e dimensões completas.");
      }
    });
  }
  const stock = Number(payload.stockQuantity);
  if (Number.isNaN(stock) || stock < 0) {
    errors.push("Estoque não pode ser negativo.");
  }
  const images = normalizeImages(payload.images);
  if (!images.length) {
    errors.push("Inclua ao menos uma imagem de referência.");
  }
  return { errors, images, status: statusValue };
};
