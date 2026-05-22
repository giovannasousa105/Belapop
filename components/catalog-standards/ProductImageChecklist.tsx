import { ProductImageValidator, type ProductImageSpec } from "@/lib/catalog-standards";
import { ImageQualityWarning } from "@/components/catalog-standards/ImageQualityWarning";
import { ProductStandardsChecklist } from "@/components/catalog-standards/ProductStandardsChecklist";

type ProductImageChecklistProps = {
  className?: string;
  images: ProductImageSpec[];
};

export function ProductImageChecklist({ className = "", images }: ProductImageChecklistProps) {
  const result = ProductImageValidator.validate(images);
  const mainImage = images.find((image) => image.kind === "main");
  const checks = [
    {
      detail: "Imagem principal com fundo limpo e produto centralizado.",
      label: "Imagem principal",
      passed: Boolean(mainImage?.url),
      required: true
    },
    {
      detail: "Sem marca d'agua, texto promocional ou print de catalogo.",
      label: "Sem poluicao visual",
      passed: !result.alerts.some((alert) => ["watermark", "promotional-text", "catalog-screenshot", "polluted-montage"].includes(alert.code)),
      required: true
    },
    {
      detail: "Textura, embalagem, modo de uso ou lifestyle clean.",
      label: "Imagens secundarias",
      passed: images.some((image) => image.kind !== "main"),
      required: false
    }
  ];

  return (
    <div className={`space-y-3 ${className}`}>
      <ProductStandardsChecklist checks={checks} title="Checklist visual do SKU" />
      <ImageQualityWarning result={result} />
    </div>
  );
}
