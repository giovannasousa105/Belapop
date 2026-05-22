import type { ProductImageSpec, ProductImageValidationResult, StandardIssue } from "@/lib/catalog-standards/types";

export const PREMIUM_PRODUCT_PLACEHOLDER = {
  alt: "Imagem de produto em revisao pela curadoria BelaPop",
  url: "/catalog/premium-product-placeholder.svg"
} as const;

const parseRatio = (ratio: string | undefined) => {
  if (!ratio) return null;
  const [left, right] = ratio.split("/").map(Number);
  if (!left || !right) return null;
  return left / right;
};

const addAlert = (
  alerts: StandardIssue[],
  code: string,
  label: string,
  detail: string,
  severity: StandardIssue["severity"]
) => {
  alerts.push({ code, detail, field: "images", label, severity });
};

export class ProductImageValidator {
  static validate(images: ProductImageSpec[]): ProductImageValidationResult {
    const alerts: StandardIssue[] = [];
    let score = 100;

    if (images.length === 0) {
      addAlert(
        alerts,
        "missing-images",
        "Imagem ausente",
        "Inclua ao menos uma imagem principal do produto.",
        "critical"
      );
      return { alerts, isValid: false, score: 0 };
    }

    const mainImage = images.find((image) => image.kind === "main") ?? images[0];
    if (mainImage.kind !== "main") {
      score -= 12;
      addAlert(
        alerts,
        "missing-main-image-kind",
        "Principal não marcada",
        "Marque a imagem principal para controlar a vitrine e o PDP.",
        "warning"
      );
    }

    images.forEach((image, index) => {
      if (!image.url?.trim()) {
        score -= 20;
        addAlert(alerts, "empty-image-url", "Imagem sem URL", `Imagem ${index + 1} não possui URL.`, "critical");
      }

      if (image.width && image.height && (image.width < 1200 || image.height < 1200)) {
        score -= 10;
        addAlert(
          alerts,
          "low-resolution",
          "Baixa resolucao",
          "Priorize imagens com pelo menos 1200px no menor lado.",
          "warning"
        );
      }

      if (!image.width || !image.height) {
        score -= 4;
        addAlert(
          alerts,
          "missing-image-metadata",
          "Metadados pendentes",
          "Informe dimensoes para validar resolucao e enquadramento automaticamente.",
          "info"
        );
      }

      if (image.hasWatermark) {
        score -= 18;
        addAlert(alerts, "watermark", "Marca d'agua", "Remova marca d'agua da imagem.", "critical");
      }

      if (image.hasPromotionalText) {
        score -= 18;
        addAlert(
          alerts,
          "promotional-text",
          "Texto promocional",
          "Imagem de SKU não deve conter chamadas promocionais.",
          "critical"
        );
      }

      if (image.isCatalogScreenshot) {
        score -= 20;
        addAlert(
          alerts,
          "catalog-screenshot",
          "Print de catalogo",
          "Substitua prints por imagem original do produto em padrao BelaPop.",
          "critical"
        );
      }

      if (image.isPollutedMontage) {
        score -= 14;
        addAlert(
          alerts,
          "polluted-montage",
          "Montagem poluida",
          "Evite composições com excesso de elementos, chamadas ou colagens.",
          "warning"
        );
      }

      if (image.isBeforeAfter && !image.allowsBeforeAfter) {
        score -= 16;
        addAlert(
          alerts,
          "before-after-not-validated",
          "Antes/depois sem validação",
          "Antes/depois so pode entrar com permissao e validação de claims.",
          "critical"
        );
      }

      if (image.background && image.kind === "main" && image.background !== "clean") {
        score -= 8;
        addAlert(
          alerts,
          "unclean-background",
          "Fundo fora do padrao",
          "A imagem principal deve ter fundo limpo e produto centralizado.",
          "warning"
        );
      }

      if (image.isCentered === false) {
        score -= 8;
        addAlert(
          alerts,
          "not-centered",
          "Enquadramento irregular",
          "Centralize o produto para manter consistencia visual.",
          "warning"
        );
      }

      if (image.lighting === "poor") {
        score -= 10;
        addAlert(alerts, "poor-lighting", "Iluminacao baixa", "Troque por imagem com luz limpa e uniforme.", "warning");
      }

      const resolvedRatio = image.ratio ? parseRatio(image.ratio) : image.width && image.height ? image.width / image.height : null;
      if (resolvedRatio && (resolvedRatio < 0.72 || resolvedRatio > 1.05)) {
        score -= 6;
        addAlert(
          alerts,
          "ratio-outside-standard",
          "Ratio fora do padrao",
          "Use ratio proximo de 4/5 ou 1/1 para vitrines e PDP.",
          "info"
        );
      }
    });

    return {
      alerts,
      isValid: alerts.every((alert) => alert.severity !== "critical"),
      score: Math.max(0, Math.min(100, score))
    };
  }
}
