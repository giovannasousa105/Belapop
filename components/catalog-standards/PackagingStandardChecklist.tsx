import type { PackagingStandard, StandardChecklistItem } from "@/lib/catalog-standards";
import { ProductStandardsChecklist } from "@/components/catalog-standards/ProductStandardsChecklist";

type PackagingStandardChecklistProps = {
  className?: string;
  packaging: PackagingStandard;
};

export function PackagingStandardChecklist({ className = "", packaging }: PackagingStandardChecklistProps) {
  const checks: StandardChecklistItem[] = [
    { label: "Proteção contra vazamento e quebra", passed: packaging.leakProtection && packaging.protectedProduct, required: true },
    { label: "Embalagem limpa", passed: packaging.cleanPackage ?? packaging.cleanPresentation, required: true },
    { label: "Produto lacrado quando aplicavel", passed: packaging.sealedWhenApplicable ?? true, required: true },
    { label: "Nota fiscal e pedido identificados", passed: (packaging.invoiceIncluded ?? true) && (packaging.orderIdentification ?? true), required: true },
    { label: "Sem caixa danificada", passed: packaging.damagedBoxBlocked ?? true, required: true },
    { label: "Unboxing premium", passed: packaging.premiumIdentity && packaging.unboxingScore >= 80, required: false }
  ];

  return <ProductStandardsChecklist className={className} checks={checks} title="Checklist de embalagem" />;
}
