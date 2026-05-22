import { ClaimValidator, normalizeProductName, ProductImageValidator } from "@/lib/catalog-standards";

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
  const warnings: string[] = [];
  const statusValue = (payload.status ?? DEFAULT_STATUS) as ProductStatus;
  const enforceDimensions = options?.requireDimensions ?? statusValue !== "draft";
  const nameResult = normalizeProductName(String(payload.name ?? ""));

  if (!payload.name?.trim()) {
    errors.push("Informe um nome editorial.");
  }
  if (nameResult.blocked) {
    errors.push(nameResult.issues.map((issue) => issue.detail).join(" "));
  } else if (nameResult.issues.length) {
    warnings.push(nameResult.issues.map((issue) => issue.detail).join(" "));
  }
  if (!payload.description?.trim()) {
    errors.push("Conte-nos sobre o produto.");
  }

  const claimText = [
    payload.name,
    payload.description,
    ...(Array.isArray(payload.highlights) ? payload.highlights : []),
    ...(Array.isArray(payload.claims) ? payload.claims : [])
  ]
    .filter(Boolean)
    .join(" ");
  const blockedClaimIssues = ClaimValidator.scanTextForBlockedTerms(claimText);
  if (blockedClaimIssues.length) {
    errors.push(blockedClaimIssues.map((issue) => issue.detail).join(" "));
  }
  if (Array.isArray(payload.claims) && payload.claims.length) {
    const claimValidation = ClaimValidator.validate(payload.claims);
    if (!claimValidation.isValid) {
      errors.push(claimValidation.issues.map((issue) => issue.detail).join(" "));
    } else if (claimValidation.unknown.length && enforceDimensions) {
      warnings.push("Claims fora da whitelist precisam de revisao editorial.");
    }
  }

  const price = Number(payload.price);
  if (!payload.price || Number.isNaN(price) || price <= 0) {
    errors.push("Defina um preco valido.");
  }
  if (enforceDimensions) {
    const numericFields = ["weightKg", "widthCm", "heightCm", "lengthCm"] as const;
    numericFields.forEach((field) => {
      const value = Number(payload[field]);
      if (!payload[field] || Number.isNaN(value) || value <= 0) {
        errors.push("Preencha peso e dimensoes completas.");
      }
    });
  }
  const stock = Number(payload.stockQuantity);
  if (Number.isNaN(stock) || stock < 0) {
    errors.push("Estoque não pode ser negativo.");
  }
  const images = normalizeImages(payload.images);
  if (!images.length) {
    errors.push("Inclua ao menos uma imagem de referencia.");
  }
  const imageValidation = ProductImageValidator.validate(
    images.map((url, index) => ({
      kind: index === 0 ? "main" : "secondary",
      url
    }))
  );
  const criticalImageAlerts = imageValidation.alerts.filter((alert) => alert.severity === "critical");
  if (criticalImageAlerts.length) {
    errors.push(criticalImageAlerts.map((alert) => alert.detail).join(" "));
  }

  return {
    errors,
    images,
    normalizedName: nameResult.value || String(payload.name ?? "").trim(),
    status: statusValue,
    warnings
  };
};
